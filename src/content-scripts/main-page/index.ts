import { CONFIG } from '../../config';
import { fetchTags, addStoryTags } from '../../utils/tag-utils';
import { StoryData } from '../../types';
import { getChatCompletion } from '../../utils/llm-utils';

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

        data.forEach((story) => {
            const subtextElement = storySubtextMap.get(story.id);
            if (subtextElement) {
                addStoryTags(subtextElement, story);
            }
        });

        // Add test chat completion
        try {
            const response = await getChatCompletion([
                { role: 'user', content: 'Hello, how are you? Also, what is your name?' }
            ]);
            console.log('AI Response:', response);
        } catch (error) {
            console.error('Chat completion error:', error);
        }
    } catch (error) {
        console.error('Techne: Error in main page initialization:', error);
    }
}

init();
