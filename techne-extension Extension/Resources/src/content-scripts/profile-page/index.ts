import { CONFIG } from '../../config';
import { fetchTags, addCommentTag } from '../../utils/tag-utils';
import { CommentData, Tag } from '../../types';

async function init(): Promise<void> {
    console.log("Techne: Profile page script initialized");
    
    const allComments = document.querySelectorAll('tr.athing.comtr');
    console.log("Techne: Found comments:", allComments.length);
    
    const commentIds = Array.from(allComments).map(comment => {
        const id = Number(comment.getAttribute('id'));
        return id;
    }).filter(id => !isNaN(id));
    
    console.log("Techne: Extracted comment IDs:", commentIds);

    if (commentIds.length) {
        try {
            const commentData = await fetchTags<CommentData>(
                CONFIG.ENDPOINTS.COMMENT_TAGS, 
                commentIds, 
                'comment_ids',
                false,
                ['expertise', 'topic']
            );
            
            console.log("Techne: Received tag data:", commentData);

            commentData.forEach(comment => {
                const element = document.getElementById(String(comment.id));
                if (element && comment.tags && comment.tag_types) {
                    // Create array of Tag objects by combining tags and tag_types
                    const tagObjects: Tag[] = [];
                    
                    // Find first expertise tag
                    const expertiseIndex = comment.tag_types.findIndex(type => type === 'expertise');
                    if (expertiseIndex !== -1) {
                        tagObjects.push({
                            text: comment.tags[expertiseIndex],
                            type: 'expertise'
                        });
                    }
                    
                    // Find first topic tag
                    const topicIndex = comment.tag_types.findIndex(type => type === 'topic');
                    if (topicIndex !== -1) {
                        tagObjects.push({
                            text: comment.tags[topicIndex],
                            type: 'topic'
                        });
                    }

                    if (tagObjects.length > 0) {
                        console.log("Techne: Adding tags to comment", comment.id, tagObjects);
                        addCommentTag(element, tagObjects, false);
                    }
                }
            });
        } catch (error) {
            console.error("Techne: Error fetching or processing tags:", error);
        }
    }
}

init().catch(error => console.error('Techne: Error initializing tag system:', error)); 