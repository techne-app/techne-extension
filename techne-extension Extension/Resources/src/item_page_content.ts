import { CommentCategories, StoryData, ThreadData, CommentData } from './types';

(function() {
   const CONFIG = {
       BASE_URL: "https://techne.app",
       ENDPOINTS: {
           STORY_TAGS: "/story-tags/",
           THREAD_TAGS: "/thread-tags/",
           COMMENT_TAGS: "/comment-tags/"
       },
       STYLES: {
           STORY_TAG: { color: 'blue', textDecoration: 'none' },
           COMMENT_TAG: { 
               backgroundColor: '#FF6600',
               color: 'black',
               padding: '1px 3px',
               borderRadius: '2px',
               marginLeft: '4px'
           }
       },
       MAX_STORY_TAGS: 3
   };

   class TagManager {
       static async fetchTags<T>(endpoint: string, ids: number[], idField = 'ids'): Promise<T[]> {
           try {
               const response = await fetch(`${CONFIG.BASE_URL}${endpoint}`, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ [idField]: ids })
               });
               return await response.json();
           } catch (error) {
               console.error(`Error fetching tags from ${endpoint}:`, error);
               return [];
           }
       }

       static addCommentTag(element: HTMLElement | null, tags: string[]): void {
           if (!element || !tags?.length) return;
           
           const comheadElement = element.querySelector('.comhead');
           if (!comheadElement) return;

           const tagsContainer = document.createElement('span');
           Object.assign(tagsContainer.style, CONFIG.STYLES.COMMENT_TAG);
           tagsContainer.textContent = tags[0];
           comheadElement.appendChild(tagsContainer);
       }

       static addStoryTags(subtextElement: Element, storyData: StoryData): void {
           if (!subtextElement || !storyData?.tags?.length || !storyData?.tag_anchors?.length) return;

           const tagsContainer = document.createElement('span');
           tagsContainer.style.color = CONFIG.STYLES.STORY_TAG.color;
           
           const tagCount = Math.min(storyData.tags.length, CONFIG.MAX_STORY_TAGS);
           for (let i = 0; i < tagCount; i++) {
               const anchorElement = document.createElement('a');
               Object.assign(anchorElement.style, CONFIG.STYLES.STORY_TAG);
               anchorElement.href = storyData.tag_anchors[i];
               anchorElement.textContent = ' | ' + storyData.tags[i];
               tagsContainer.appendChild(anchorElement);
           }
           subtextElement.appendChild(tagsContainer);
       }
   }

   class CommentSorter {
       static categorizeComments(comments: NodeListOf<Element>): CommentCategories {
           return Array.from(comments).reduce((acc: CommentCategories, comment: Element) => {
               const indentElement = comment.querySelector('td.ind img') as HTMLImageElement | null;
               const id = Number(comment.getAttribute('id'));
               if (!isNaN(id)) {
                   (indentElement?.width === 0 ? acc.threadIds : acc.commentIds).push(id);
               }
               return acc;
           }, { threadIds: [], commentIds: [] });
       }
   }

   async function init(): Promise<void> {
       const storyElement = document.querySelector('tr.athing.submission');
       if (storyElement) {
           const story_id = Number(storyElement.getAttribute('id'));
           const subtextElement = storyElement.closest('table.fatitem')?.querySelector('.subtext .subline');
           
           if (subtextElement && !isNaN(story_id)) {
               const storyData = await TagManager.fetchTags<StoryData>(CONFIG.ENDPOINTS.STORY_TAGS, [story_id], 'story_ids');
               if (storyData?.[0]) {
                   TagManager.addStoryTags(subtextElement, storyData[0]);
               }
           }
       }

       const allComments = document.querySelectorAll('tr[class="athing comtr"]');
       const { threadIds, commentIds } = CommentSorter.categorizeComments(allComments);

       if (threadIds.length) {
           const threadData = await TagManager.fetchTags<ThreadData>(CONFIG.ENDPOINTS.THREAD_TAGS, threadIds, 'thread_ids');
           threadData.forEach(thread => {
               const element = document.getElementById(thread.id);
               TagManager.addCommentTag(element, thread.tags);
           });
       }

       if (commentIds.length) {
           const commentData = await TagManager.fetchTags<CommentData>(CONFIG.ENDPOINTS.COMMENT_TAGS, commentIds, 'comment_ids');
           commentData.forEach(comment => {
               const element = document.getElementById(comment.id);
               TagManager.addCommentTag(element, comment.tags);
           });
       }
   }

   init().catch(error => console.error('Error initializing tag system:', error));
})();