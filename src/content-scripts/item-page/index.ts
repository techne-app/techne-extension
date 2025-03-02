import { CONFIG } from '../../config';
import { fetchTags, addStoryTags, addCommentTag } from '../../utils/tag-utils';
import { StoryData, ThreadData, CommentData, CommentCategories, Tag } from '../../types';
import { isFeatureEnabled } from '../../utils/featureFlags';
import { selectRelevantTags, getDefaultTags } from '../../utils/personalization-utils';

function categorizeComments(comments: NodeListOf<Element>): CommentCategories {
    return Array.from(comments).reduce((acc: CommentCategories, comment: Element) => {
        const indentElement = comment.querySelector('td.ind img') as HTMLImageElement | null;
        const id = Number(comment.getAttribute('id'));
        // A thread is a comment with zero indentation (width=0)
        const isThread = indentElement?.width === 0;
        
        if (!isNaN(id)) {
            if (isThread) {
                acc.threadIds.push(id);
            } else {
                acc.commentIds.push(id);
            }
        }
        return acc;
    }, { threadIds: [], commentIds: [] });
}

async function init(): Promise<void> {
    try {
        // Get story ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const storyId = Number(urlParams.get('id'));
        
        if (!storyId) {
            console.error('Techne: No story ID found in URL');
            return;
        }

        // Fetch story tags
        const storyData = await fetchTags<StoryData>(CONFIG.ENDPOINTS.STORY_TAGS, [storyId], 'story_ids');
        if (storyData.length > 0) {
            // Find the story title element
            const titleRow = document.querySelector('tr.athing');
            if (titleRow?.nextElementSibling) {
                const subtext = titleRow.nextElementSibling.querySelector('.subline');
                if (subtext) {
                    // Apply personalization if enabled
                    if (isFeatureEnabled('tag_personalization')) {
                        const selectedTags = await selectRelevantTags(storyData[0]);
                        addStoryTags(subtext, { 
                            ...storyData[0], 
                            tags: selectedTags.tags,
                            tag_types: selectedTags.tag_types,
                            tag_anchors: selectedTags.tag_anchors 
                        });
                    } else {
                        addStoryTags(subtext, storyData[0]);
                    }
                }
            }
        }

        // Rest of the existing code for comments
        const comments = document.querySelectorAll('tr.athing.comtr');
        const { threadIds, commentIds } = categorizeComments(comments);

        if (threadIds.length) {
            const threadData = await fetchTags<ThreadData>(CONFIG.ENDPOINTS.THREAD_TAGS, threadIds, 'thread_ids');
            threadData.forEach(thread => {
                const element = document.getElementById(String(thread.id));
                if (element && thread.tags) {
                    const tagObjects: Tag[] = thread.tags.slice(0, 2).map(tag => ({
                        tag: tag,
                        type: 'topic'
                    }));
                    addCommentTag(element, tagObjects, true);
                }
            });
        }

        if (commentIds.length) {
            const commentData = await fetchTags<CommentData>(CONFIG.ENDPOINTS.COMMENT_TAGS, commentIds, 'comment_ids');
            commentData.forEach(comment => {
                const element = document.getElementById(String(comment.id));
                if (element && comment.tags) {
                    const tagObjects: Tag[] = comment.tags.slice(0, 1).map(tag => ({
                        tag: tag,
                        type: 'topic'
                    }));
                    addCommentTag(element, tagObjects, false);
                }
            });
        }
    } catch (error) {
        console.error('Techne: Error in item page initialization:', error);
    }
}

init(); 