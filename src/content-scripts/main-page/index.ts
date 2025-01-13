import { vectorDb } from '../../background/db';
import { CONFIG } from '../../config';
import { fetchTags, addStoryTags } from '../../utils/tag-utils';
import { findBestMatchingTags } from '../../utils/embedding-utils';
import { StoryData } from '../../types';

async function init(): Promise<void> {
    try {
        // Get user's historical tags
        const userEmbeddings = await vectorDb.getAllEmbeddings();
        const userTags = userEmbeddings.map(e => e.tag);

        const athingElements = document.querySelectorAll('tr.athing');
        const story_ids = Array.from(athingElements).map(element => 
            Number(element.getAttribute('id'))
        );

        if (!story_ids.length) return;

        // Create story-subtext mapping
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

        // Fetch all tags (not limited)
        const data = await fetchTags<StoryData>(
            CONFIG.ENDPOINTS.STORY_TAGS, 
            story_ids, 
            'story_ids',
            false
        );

        // Process each story's tags
        for (const story of data) {
            const subtextElement = storySubtextMap.get(story.id);
            if (subtextElement && story.tags?.length) {
                // Find best matching tags based on user history
                const bestTags = await findBestMatchingTags(
                    story.tags,
                    userTags,
                    CONFIG.MAX_STORY_TAGS
                );
                
                // Create modified story data with selected tags
                const modifiedStory = {
                    ...story,
                    tags: bestTags,
                    tag_anchors: bestTags.map(tag => 
                        story.tag_anchors[story.tags.indexOf(tag)]
                    )
                };

                addStoryTags(subtextElement, modifiedStory);
            }
        }
    } catch (error) {
        console.error('Techne: Error in main page initialization:', error);
    }
}

init();
