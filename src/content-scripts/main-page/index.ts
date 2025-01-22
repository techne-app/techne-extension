import { CONFIG } from '../../config';
import { fetchTags, addStoryTags } from '../../utils/tag-utils';
import { StoryData } from '../../types';
import { getChatCompletion } from '../../utils/llm-utils';
import { Tag } from '../../background/db';
import { isFeatureEnabled } from '../../utils/featureFlags';

async function init(): Promise<void> {
    try {
        const storyIds = getStoryIds();
        if (!storyIds.length) {
            console.log('Techne: No stories found on page');
            return;
        }

        const storySubtextMap = mapStorySubtextElements();
        const data = await fetchTags<StoryData>(CONFIG.ENDPOINTS.STORY_TAGS, storyIds, 'story_ids');
        console.log('Techne: Fetched story tags:', data);

        let tagSelector: (story: StoryData) => Promise<{ tags: string[]; types: string[]; anchors: string[] }>;

        // Initialize with async version of getDefaultTags
        tagSelector = async (story: StoryData) => {
            return getDefaultTags(story);
        };

        if (isFeatureEnabled('personalize')) {
            const historicalTags = await getHistoricalTags();
            if (historicalTags.length > 0) {
                tagSelector = async (story: StoryData) => {
                    if (story.tags.length > 3) {
                        try {
                            const selectedTags = await selectRelevantTags(
                                story.tags,
                                story.tag_types,
                                story.tag_anchors,
                                historicalTags
                            );
                            return selectedTags;
                        } catch (error) {
                            console.log('Techne: Failed to get LLM recommendations, using default tags:', error);
                            return getDefaultTags(story);
                        }
                    }
                    return getDefaultTags(story);
                };
            }
        }

        console.log('Techne: Starting tag processing for stories:', data.length);

        for (const story of data) {
            await processStory(story, storySubtextMap, tagSelector);
        }
    } catch (error) {
        console.error('Techne: Error in main page initialization:', error);
    }
}

function getStoryIds(): number[] {
    const athingElements = document.querySelectorAll('tr.athing');
    return Array.from(athingElements).map(element => Number(element.getAttribute('id')));
}

function mapStorySubtextElements(): Map<number, HTMLElement> {
    const map = new Map();
    const athingElements = document.querySelectorAll('tr.athing');

    athingElements.forEach((athingElement) => {
        const storyId = Number(athingElement.getAttribute('id'));
        const subtextElement = athingElement.nextElementSibling?.querySelector('.subline');
        if (storyId && subtextElement) {
            map.set(storyId, subtextElement);
        }
    });

    return map;
}

async function getHistoricalTags(): Promise<Tag[]> {
    try {
        return await new Promise<Tag[]>((resolve, reject) => {
            const listener = (response: any) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                resolve(response?.tags || []);
            };
            chrome.runtime.sendMessage({ type: 'GET_ALL_TAGS' }, listener);
        });
    } catch (error) {
        console.log('Techne: Failed to get historical tags:', error);
        return [];
    }
}

async function processStory(
    story: StoryData,
    storySubtextMap: Map<number, HTMLElement>,
    tagSelector: (story: StoryData) => Promise<{ tags: string[]; types: string[]; anchors: string[] }>
) {
    const subtextElement = storySubtextMap.get(story.id);
    if (!subtextElement || !story.tags?.length) {
        console.log(`Techne: Skipping story ${story.id} - no tags or subtext element`);
        return;
    }

    const selectedTags = await tagSelector(story);
    console.log(`Techne: Adding tags to DOM for story ${story.id}:`, selectedTags.tags);
    addStoryTags(subtextElement, { ...story, ...selectedTags });
}

function getDefaultTags(story: StoryData) {
    return {
        tags: story.tags.slice(0, 3),
        types: story.tag_types.slice(0, 3),
        anchors: story.tag_anchors.slice(0, 3)
    };
}

async function selectRelevantTags(
    storyTags: string[],
    tagTypes: string[],
    tagAnchors: string[],
    historicalTags: Tag[]
): Promise<{ tags: string[]; types: string[]; anchors: string[] }> {
    const historicalTagStrings = historicalTags.map(t => t.tag).join(', ');
    const prompt = `Given:
                    Historical tags: [${historicalTagStrings}]
                    Story tags: [${storyTags.join(', ')}]

                    Select exactly 3 story tags most similar to historical tags.
                    Reply only with tags separated by commas.`;

    try {
        const response = await getChatCompletion([{ role: 'user', content: prompt }]) as string;
        const selectedTags = parseSelectedTags(response, storyTags, tagTypes, tagAnchors);
        return selectedTags || getDefaultTags({ tags: storyTags, tag_types: tagTypes, tag_anchors: tagAnchors } as StoryData);
    } catch (error) {
        console.error('Error getting tag recommendations:', error);
        return getDefaultTags({ tags: storyTags, tag_types: tagTypes, tag_anchors: tagAnchors } as StoryData);
    }
}

function parseSelectedTags(
    response: string,
    storyTags: string[],
    tagTypes: string[],
    tagAnchors: string[]
): { tags: string[]; types: string[]; anchors: string[] } | null {
    const selectedTags = response.split(',').map(t => t.trim());
    if (selectedTags.length > 3) return null;

    const result = { tags: [] as string[], types: [] as string[], anchors: [] as string[] };
    selectedTags.forEach(tag => {
        const index = storyTags.findIndex(t => t === tag);
        if (index !== -1) {
            result.tags.push(storyTags[index]);
            result.types.push(tagTypes[index]);
            result.anchors.push(tagAnchors[index]);
        }
    });

    return result.tags.length ? result : null;
}

init();