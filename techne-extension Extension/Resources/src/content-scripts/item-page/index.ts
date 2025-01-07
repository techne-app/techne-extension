import { CONFIG } from '../../config';
import { fetchTags, addStoryTags, addCommentTag } from '../../utils/tag-utils';
import { StoryData, ThreadData, CommentData, CommentCategories } from '../../types';

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
    // Handle story tags
    const storyElement = document.querySelector('tr.athing.submission');
    if (storyElement) {
        const story_id = Number(storyElement.getAttribute('id'));
        const subtextElement = storyElement.closest('table.fatitem')?.querySelector('.subtext .subline');
        
        if (subtextElement && !isNaN(story_id)) {
            const storyData = await fetchTags<StoryData>(CONFIG.ENDPOINTS.STORY_TAGS, [story_id], 'story_ids');
            if (storyData?.[0]) {
                addStoryTags(subtextElement, storyData[0]);
            }
        }
    }

    // Handle comments
    const allComments = document.querySelectorAll('tr[class="athing comtr"]');
    const { threadIds, commentIds } = categorizeComments(allComments);

    if (threadIds.length) {
        const threadData = await fetchTags<ThreadData>(CONFIG.ENDPOINTS.THREAD_TAGS, threadIds, 'thread_ids', true);
        threadData.forEach(thread => {
            const element = document.getElementById(String(thread.id));
            // Pass true to indicate this is a thread-level comment
            addCommentTag(element, thread.tags, true);
        });
    }

    if (commentIds.length) {
        const commentData = await fetchTags<CommentData>(CONFIG.ENDPOINTS.COMMENT_TAGS, commentIds, 'comment_ids');
        commentData.forEach(comment => {
            const element = document.getElementById(String(comment.id));
            // Pass false to indicate this is not a thread-level comment
            addCommentTag(element, comment.tags, false);
        });
    }
}

init().catch(error => console.error('Error initializing tag system:', error)); 