import { CONFIG } from '../../config';
import { fetchTags, addStoryTags, addCommentTag } from '../../utils/tag-utils';
import { StoryData, ThreadData, CommentData, CommentCategories, Tag } from '../../types';
import { selectRelevantTags } from '../../utils/personalization-utils';

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
                    // Always use selectRelevantTags - the background script will handle the feature flag check
                    const selectedTags = await selectRelevantTags(storyData[0]);
                    addStoryTags(subtext, { 
                        ...storyData[0], 
                        tags: selectedTags.tags,
                        tag_types: selectedTags.tag_types,
                        tag_anchors: selectedTags.tag_anchors 
                    });
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
                if (element && thread.tags && thread.tag_types) {
                    // Find thread category and theme tags
                    const categoryIndex = thread.tag_types.findIndex(type => type === 'thread_category');
                    const themeIndex = thread.tag_types.findIndex(type => type === 'thread_theme');
                    
                    const tagObjects: Tag[] = [];
                    
                    // Add thread category tag first if found
                    if (categoryIndex !== -1) {
                        tagObjects.push({
                            tag: thread.tags[categoryIndex],
                            type: 'topic'
                        });
                    }
                    
                    // Add thread theme tag second if found
                    if (themeIndex !== -1) {
                        tagObjects.push({
                            tag: thread.tags[themeIndex],
                            type: 'topic'
                        });
                    }
                    
                    if (tagObjects.length > 0) {
                        addCommentTag(element, tagObjects, true);
                    }
                }
            });
        }
    } catch (error) {
        console.error("Techne: Error fetching tags:", error);
    }
}

init(); 