import { CONFIG } from '../config';
import { StoryData, ThreadData, Tag } from '../types';
import { MessageType, NewTagRequest } from '../types/messages';

export async function fetchStoryTags(
    storyIds: number[],
    maxTagsPerStory?: number,
    limitTagsPerStory?: boolean,
    tagTypes?: string[]
): Promise<StoryData[]> {
    try {
        const response = await fetch(`${CONFIG.BASE_URL}${CONFIG.ENDPOINTS.STORY_TAGS}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                story_ids: storyIds,
                max_tags_per_story: maxTagsPerStory,
                limit_tags_per_story: limitTagsPerStory,
                tag_types: tagTypes
            })
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching story tags:', error);
        return [];
    }
}

export async function fetchThreadTags(threadIds: number[]): Promise<ThreadData[]> {
    try {
        const response = await fetch(`${CONFIG.BASE_URL}${CONFIG.ENDPOINTS.THREAD_TAGS}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ thread_ids: threadIds })
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching thread tags:', error);
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
            const msg: NewTagRequest = {
                type: MessageType.NEW_TAG,
                data: {
                    tag: storyData.tags[i],
                    type: storyData.tag_types[i],
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

export function addThreadTag(element: HTMLElement | null, tags: Tag[], isThread: boolean): void {
    if (!element || !tags?.length) return;
    
    const comheadElement = element.querySelector('.comhead');
    if (!comheadElement) return;

    // Clear any existing tags
    const existingTags = comheadElement.querySelectorAll('.techne-tag');
    existingTags.forEach(tag => tag.remove());
    
    tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = `techne-tag ${tag.type}`;
        Object.assign(tagElement.style, {
            backgroundColor: '#FF6600',
            color: 'black',
            padding: '1px 3px',
            borderRadius: '2px',
            marginLeft: '4px'
        });
        tagElement.textContent = tag.tag || '';
        comheadElement.appendChild(tagElement);
    });
}