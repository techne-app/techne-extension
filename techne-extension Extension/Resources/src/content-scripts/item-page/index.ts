import { CONFIG } from '../../config';
import { fetchTags, addCommentTag } from '../../utils/tag-utils';
import { StoryData, ThreadData, CommentData, CommentCategories, Tag } from '../../types';

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
    const comments = document.querySelectorAll('tr.athing.comtr');
    const { threadIds, commentIds } = categorizeComments(comments);

    if (threadIds.length) {
        const threadData = await fetchTags<ThreadData>(CONFIG.ENDPOINTS.THREAD_TAGS, threadIds, 'thread_ids');
        threadData.forEach(thread => {
            const element = document.getElementById(String(thread.id));
            if (element && thread.tags) {
                // For threads, show up to 2 tags
                const tagObjects: Tag[] = thread.tags.slice(0, 2).map(tag => ({
                    text: tag,
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
                // For regular comments, show only 1 tag
                const tagObjects: Tag[] = comment.tags.slice(0, 1).map(tag => ({
                    text: tag,
                    type: 'topic'
                }));
                addCommentTag(element, tagObjects, false);
            }
        });
    }
}

init().catch(error => console.error('Error initializing tag system:', error)); 