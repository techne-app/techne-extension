import { CONFIG } from '../../config';
import { fetchThreadTags, addThreadTag } from '../../utils/tag-utils';
import { ThreadData, Tag } from '../../types';
import { logger } from '../../utils/logger';

async function init(): Promise<void> {
    logger.debug("Techne: Profile page script initialized");
    
    const allComments = document.querySelectorAll('tr.athing.comtr');
    logger.debug("Techne: Found comments:", allComments.length);
    
    const threadIds = Array.from(allComments).map(comment => {
        const id = Number(comment.getAttribute('id'));
        return id;
    }).filter(id => !isNaN(id));
    
    logger.debug("Techne: Extracted thread IDs:", threadIds);

    if (threadIds.length) {
        try {
            const threadData = await fetchThreadTags(threadIds);
            logger.api("Techne: Received tag data:", threadData);

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
        } catch (error) {
            logger.error("Techne: Error fetching tags:", error);
        }
    }
}

init(); 