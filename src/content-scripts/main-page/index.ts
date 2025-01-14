import { CONFIG } from '../../config';
import { fetchTags, addStoryTags } from '../../utils/tag-utils';
import { StoryData } from '../../types';
import { getChatCompletion } from '../../utils/llm-utils';
import { tagDb } from '../../background/db';

async function init(): Promise<void> {
    try {
        const athingElements = document.querySelectorAll('tr.athing');
        const story_ids = Array.from(athingElements).map(element => Number(element.getAttribute('id')));

        if (!story_ids.length) {
            console.log('Techne: No stories found on page');
            return;
        }

        // Create a map to store the relation between story IDs and their corresponding subtext elements
        const storySubtextMap = new Map();

        athingElements.forEach((athingElement) => {
            const storyId = Number(athingElement.getAttribute('id'));
            let subtextElement = athingElement.nextElementSibling;
            if (subtextElement) {
                const sublineElement = subtextElement.querySelector('.subline');
                if (sublineElement) {
                    storySubtextMap.set(storyId, sublineElement);
                }
            }
        });

        const data = await fetchTags<StoryData>(CONFIG.ENDPOINTS.STORY_TAGS, story_ids, 'story_ids');
        console.log('Techne: Fetched story tags:', data);

        console.log('Techne: Starting tag processing for stories:', data.length);
        
        const tagPromises = data.map(async (story) => {
            const subtextElement = storySubtextMap.get(story.id);
            if (subtextElement && story.tags?.length) {
                console.log(`Techne: Processing story ${story.id} with original tags:`, story.tags);
                const selectedTags = await selectRelevantTags(
                    story.tags,
                    story.tag_types,
                    story.tag_anchors
                );
                console.log(`Techne: Selected tags for story ${story.id}:`, selectedTags.tags);
                return { subtextElement, story, selectedTags };
            }
            console.log(`Techne: Skipping story ${story.id} - no tags or subtext element`);
            return null;
        });

        const results = await Promise.all(tagPromises);
        console.log('Techne: Processed all stories, adding tags to DOM');
        
        results.forEach(result => {
            if (result) {
                const { subtextElement, story, selectedTags } = result;
                console.log(`Techne: Adding tags to DOM for story ${story.id}:`, selectedTags.tags);
                addStoryTags(subtextElement, {
                    ...story,
                    tags: selectedTags.tags,
                    tag_types: selectedTags.types,
                    tag_anchors: selectedTags.anchors
                });
            }
        });

    } catch (error) {
        console.error('Techne: Error in main page initialization:', error);
    }
}

async function selectRelevantTags(storyTags: string[], tagTypes: string[], tagAnchors: string[]): Promise<{
    tags: string[],
    types: string[],
    anchors: string[]
}> {
    const historicalTags = await tagDb.getAllTags();
    console.log('Techne: Historical tags found:', historicalTags.map(t => t.tag));
    const historicalTagStrings = historicalTags.map(t => t.tag).join(', ');

    const prompt = `Given a user's historical interests: [${historicalTagStrings}]
    And a story's tags: [${storyTags.join(', ')}]
    Select the 3 most relevant tags that would interest this user based on their history.
    Only respond with the exact tag names separated by commas. If there are less than 3 tags, return all of them.`;

    console.log('Techne: Sending prompt to LLM with tags:', storyTags);
    try {
        const response = await getChatCompletion([
            { role: 'user', content: prompt }
        ]) as string;
        console.log('Techne: LLM response:', response);

        const selectedTags = response.split(',').map(t => t.trim());
        console.log('Techne: Parsed selected tags:', selectedTags);
        
        const result = {
            tags: [] as string[],
            types: [] as string[],
            anchors: [] as string[]
        };

        selectedTags.forEach(selectedTag => {
            const index = storyTags.findIndex(t => t === selectedTag);
            if (index !== -1) {
                result.tags.push(storyTags[index]);
                result.types.push(tagTypes[index]);
                result.anchors.push(tagAnchors[index]);
            }
        });

        return result;
    } catch (error) {
        console.error('Error getting tag recommendations:', error);
        // Fallback to first 3 tags if LLM fails
        return {
            tags: storyTags.slice(0, 3),
            types: tagTypes.slice(0, 3),
            anchors: tagAnchors.slice(0, 3)
        };
    }
}

init();
