import { CONFIG } from '../../config';
import { fetchStoryTags, fetchThreadTags, addStoryTags, addThreadTag } from '../../utils/tag-utils';
import { StoryData, ThreadData, CommentCategories, Tag } from '../../types';
import { logger } from '../../utils/logger';

function categorizeComments(comments: NodeListOf<Element>): CommentCategories {
    const threadIds: number[] = [];
    const commentIds: number[] = [];

    comments.forEach(comment => {
        const id = Number(comment.getAttribute('id'));
        if (!isNaN(id)) {
            threadIds.push(id);
        }
    });

    return { threadIds, commentIds };
}

async function init(): Promise<void> {
    try {
        const storyElement = document.querySelector('tr.athing');
        if (!storyElement) return;

        const storyId = Number(storyElement.getAttribute('id'));
        if (isNaN(storyId)) return;

        const subtextElement = storyElement.nextElementSibling?.querySelector('td.subtext');
        if (!subtextElement) return;

        const storyData = await fetchStoryTags([storyId]);
        if (storyData.length) {
            addStoryTags(subtextElement, storyData[0]);
        }

        const comments = document.querySelectorAll('tr.athing.comtr');
        const { threadIds } = categorizeComments(comments);

        if (threadIds.length) {
            const threadData = await fetchThreadTags(threadIds);
            threadData.forEach(thread => {
                const element = document.getElementById(String(thread.id));
                if (element && thread.tags && thread.tag_types) {
                    // Find thread category and theme tags
                    const categoryIndex = thread.tag_types.findIndex(type => type === 'thread_category');
                    const themeIndex = thread.tag_types.findIndex(type => type === 'thread_theme');
                    
                    const tagObjects: Tag[] = [];
                    
                    // Add thread category tag first if found
                    if (categoryIndex !== -1) {
                        tagObjects.push({
                            tag: thread.tags[categoryIndex],
                            type: thread.tag_types[categoryIndex]
                        });
                    }
                    
                    // Add thread theme tag second if found
                    if (themeIndex !== -1) {
                        tagObjects.push({
                            tag: thread.tags[themeIndex],
                            type: thread.tag_types[themeIndex]
                        });
                    }
                    
                    if (tagObjects.length > 0) {
                        addThreadTag(element, tagObjects, true);
                    }
                }
            });
        }
    } catch (error) {
        logger.error("Techne: Error fetching tags:", error);
    }
}

init(); 