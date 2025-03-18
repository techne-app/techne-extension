import { CONFIG } from '../../config';
import { fetchTags, addCommentTag } from '../../utils/tag-utils';
import { ThreadData, Tag } from '../../types';

async function init(): Promise<void> {
    console.log("Techne: Profile page script initialized");
    
    const allComments = document.querySelectorAll('tr.athing.comtr');
    console.log("Techne: Found comments:", allComments.length);
    
    const threadIds = Array.from(allComments).map(comment => {
        const id = Number(comment.getAttribute('id'));
        return id;
    }).filter(id => !isNaN(id));
    
    console.log("Techne: Extracted thread IDs:", threadIds);

    if (threadIds.length) {
        try {
            const threadData = await fetchTags<ThreadData>(
                CONFIG.ENDPOINTS.THREAD_TAGS, 
                threadIds, 
                'thread_ids',
                false,
                ['expertise', 'topic']
            );
            
            console.log("Techne: Received tag data:", threadData);

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
        } catch (error) {
            console.error("Techne: Error fetching tags:", error);
        }
    }
}

init(); 