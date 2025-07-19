import { CONFIG } from '../../config';
import { fetchStoryTags, addStoryTags } from '../../utils/tag-utils';
import { StoryData } from '../../types';
import { selectRelevantTags } from '../../utils/personalization-utils';
import { logger } from '../../utils/logger';

async function init(): Promise<void> {
    try {
        const storyIds = getStoryIds();
        if (!storyIds.length) {
            logger.info('Techne: No stories found on page');
            return;
        }

        const storySubtextMap = mapStorySubtextElements();
        const data = await fetchStoryTags(
            storyIds,
            undefined,
            false,
            ['thread_theme']
        );
        logger.api('Techne: Fetched story tags:', data);

        // Always use selectRelevantTags - the background script will handle the feature flag check
        const tagSelector = selectRelevantTags;

        logger.debug('Techne: Starting tag processing for stories:', data.length);

        for (const story of data) {
            await processStory(story, storySubtextMap, tagSelector);
        }
    } catch (error) {
        logger.error('Techne: Error in main page initialization:', error);
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
        logger.debug(`Techne: Skipping story ${story.id} - no tags or subtext element`);
        return;
    }

    const selectedTags = await tagSelector(story);
    logger.debug(`Techne: Adding tags to DOM for story ${story.id}:`, selectedTags.tags);
    addStoryTags(subtextElement, { ...story, ...selectedTags });
}

init();