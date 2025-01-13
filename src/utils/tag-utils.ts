import { CONFIG } from '../config';
import { StoryData, Tag } from '../types';
import { computeEmbeddings } from './embedding-utils';

export async function fetchTags<T>(
    endpoint: string, 
    ids: number[], 
    idField = 'ids',
    limitTagsPerStory = false,
    tagTypes?: string[]
): Promise<T[]> {
    try {
        const response = await fetch(`${CONFIG.BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                [idField]: ids,
                limit_tags_per_story: limitTagsPerStory,
                tag_types: tagTypes
            })
        });
        return await response.json();
    } catch (error) {
        console.error(`Error fetching tags from ${endpoint}:`, error);
        return [];
    }
} 

const handleTagClick = async (tag: string, anchor: string) => {
    const embeddings = await computeEmbeddings([tag]);
    const msg = {
        type: 'NEW_EMBEDDING',
        data: {
            tag,
            vectorData: embeddings[0],
            timestamp: Date.now(),
            anchor
        }
    };
    chrome.runtime.sendMessage(msg);
    window.open(anchor, '_blank');
};

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
        anchorElement.addEventListener('click', async (e) => {
            e.preventDefault();
            await handleTagClick(storyData.tags[i], storyData.tag_anchors[i]);
        });
        
        tagsContainer.appendChild(anchorElement);
    }
    subtextElement.appendChild(tagsContainer);
}

export function addCommentTag(element: HTMLElement | null, tags: Tag[], isThread: boolean): void {
    if (!element || !tags?.length) return;
    
    const comheadElement = element.querySelector('.comhead');
    if (!comheadElement) return;

    // Clear any existing tags
    const existingTags = comheadElement.querySelectorAll('.techne-tag');
    existingTags.forEach(tag => tag.remove());
    
    tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = `techne-tag ${tag.type}`;
        Object.assign(tagElement.style, CONFIG.STYLES.COMMENT_TAG);
        tagElement.textContent = tag.text;
        comheadElement.appendChild(tagElement);
    });
}