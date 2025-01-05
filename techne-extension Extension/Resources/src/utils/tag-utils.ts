import { CONFIG } from '../config';
import { StoryData } from '../types';

export async function fetchTags<T>(endpoint: string, ids: number[], idField = 'ids'): Promise<T[]> {
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

export function addStoryTags(subtextElement: Element, storyData: StoryData): void {
    if (!subtextElement || !storyData?.tags?.length || !storyData?.tag_anchors?.length) return;

    const tagsContainer = document.createElement('span');
    tagsContainer.style.color = CONFIG.STYLES.STORY_TAG.color;
    
    const tagCount = Math.min(storyData.tags.length, CONFIG.MAX_STORY_TAGS);
    for (let i = 0; i < tagCount; i++) {
        const anchorElement = document.createElement('a');
        Object.assign(anchorElement.style, CONFIG.STYLES.STORY_TAG);
        anchorElement.href = storyData.tag_anchors[i];
        anchorElement.textContent = ' | ' + storyData.tags[i];
        
        // Add click handler
        anchorElement.addEventListener('click', (e) => {
            e.preventDefault();
            const msg = {
                type: 'NEW_EMBEDDING',
                data: {
                    tag: storyData.tags[i],
                    vectorData: Array.from(new Float32Array([0.1, 0.2, 0.3])),
                    timestamp: Date.now(),
                    anchor: storyData.tag_anchors[i]
                }
            };
            chrome.runtime.sendMessage(msg);
            window.open(storyData.tag_anchors[i], '_blank');
        });
        
        tagsContainer.appendChild(anchorElement);
    }
    subtextElement.appendChild(tagsContainer);
}

export function addCommentTag(element: HTMLElement | null, tags: string[]): void {
    if (!element || !tags?.length) return;
    
    const comheadElement = element.querySelector('.comhead');
    if (!comheadElement) return;

    const tagsContainer = document.createElement('span');
    Object.assign(tagsContainer.style, CONFIG.STYLES.COMMENT_TAG);
    tagsContainer.textContent = tags[0];
    comheadElement.appendChild(tagsContainer);
} 