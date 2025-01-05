import { CONFIG } from '../../config';
import { fetchTags, addStoryTags, addCommentTag } from '../../utils/tag-utils';
import { StoryData, ThreadData, CommentData, CommentCategories } from '../../types';

function categorizeComments(comments: NodeListOf<Element>): CommentCategories {
    return Array.from(comments).reduce((acc: CommentCategories, comment: Element) => {
        const indentElement = comment.querySelector('td.ind img') as HTMLImageElement | null;
        const id = Number(comment.getAttribute('id'));
        if (!isNaN(id)) {
            (indentElement?.width === 0 ? acc.threadIds : acc.commentIds).push(id);
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
        const threadData = await fetchTags<ThreadData>(CONFIG.ENDPOINTS.THREAD_TAGS, threadIds, 'thread_ids');
        threadData.forEach(thread => {
            const element = document.getElementById(thread.id);
            addCommentTag(element, thread.tags);
        });
    }

    if (commentIds.length) {
        const commentData = await fetchTags<CommentData>(CONFIG.ENDPOINTS.COMMENT_TAGS, commentIds, 'comment_ids');
        commentData.forEach(comment => {
            const element = document.getElementById(comment.id);
            addCommentTag(element, comment.tags);
        });
    }
}

init().catch(error => console.error('Error initializing tag system:', error));