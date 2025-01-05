import { CONFIG } from '../../config';
import { fetchTags, addStoryTags } from '../../utils/tag-utils';
import { StoryData } from '../../types';

const athingElements = document.querySelectorAll('tr.athing');
const story_ids = Array.from(athingElements).map(element => Number(element.getAttribute('id')));

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

fetchTags<StoryData>(CONFIG.ENDPOINTS.STORY_TAGS, story_ids, 'story_ids')
    .then(data => {
        data.forEach((story) => {
            const subtextElement = storySubtextMap.get(story.id);
            if (subtextElement) {
                addStoryTags(subtextElement, story);
            }
        });
    });
