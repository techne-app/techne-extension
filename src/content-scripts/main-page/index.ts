import { CONFIG } from '../../config';
import { fetchTags, addStoryTags } from '../../utils/tag-utils';
import { StoryData } from '../../types';
import { isFeatureEnabled } from '../../utils/featureFlags';
import { ExtensionResponse, MessageType } from '../../types/messages';

async function init(): Promise<void> {
    try {
        const storyIds = getStoryIds();
        if (!storyIds.length) {
            console.log('Techne: No stories found on page');
            return;
        }

        const storySubtextMap = mapStorySubtextElements();
        const data = await fetchTags<StoryData>(CONFIG.ENDPOINTS.STORY_TAGS, 
            storyIds, 
            'story_ids', 
            false,
            ['thread_theme']
        );
        console.log('Techne: Fetched story tags:', data);

        let tagSelector;

        if (isFeatureEnabled('tag_personalization')) {
            tagSelector = selectRelevantTags;
        } else{
            tagSelector = getDefaultTags;
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

async function processStory(
    story: StoryData,
    storySubtextMap: Map<number, HTMLElement>,
    tagSelector: (story: StoryData) => Promise<{ tags: string[]; tag_types: string[]; tag_anchors: string[] }>
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

async function getDefaultTags(story: StoryData) {
    return {
        tags: story.tags.slice(0, 3),
        tag_types: story.tag_types.slice(0, 3),
        tag_anchors: story.tag_anchors.slice(0, 3)
    };
}


async function selectRelevantTags(story: StoryData): Promise<{ tags: string[]; tag_types: string[]; tag_anchors: string[] }> {
    
    try {
        const response = await new Promise<ExtensionResponse>((resolve, reject) => {
            chrome.runtime.sendMessage({
                type: MessageType.RANK_TAGS,
                data: {
                    storyTags: story.tags,
                    tagTypes: story.tag_types,
                    tagAnchors: story.tag_anchors
                }
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });

        if (response.type === MessageType.RANK_TAGS_COMPLETE) {
            return {
                tags: response.data.result.tags.slice(0, 3),
                tag_types: response.data.result.types.slice(0, 3),
                tag_anchors: response.data.result.anchors.slice(0, 3)
            };
        }
        throw new Error('Unexpected response type');
    } catch (error) {
        console.error('Error getting tag recommendations:', error);
        return getDefaultTags(story);
    }
}

init();