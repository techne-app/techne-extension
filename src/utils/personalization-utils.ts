import { StoryData } from '../types';
import { ExtensionResponse, MessageType } from '../types/messages';

/**
 * Gets personalized tags for a story based on user history
 */
export async function selectRelevantTags(story: StoryData): Promise<{ tags: string[]; tag_types: string[]; tag_anchors: string[] }> {
    try {
        const response = await new Promise<ExtensionResponse>((resolve, reject) => {
            chrome.runtime.sendMessage({
                type: MessageType.RANK_TAGS,
                data: {
                    storyTags: story.tags,
                    tagTypes: story.tag_types,
                    tagAnchors: story.tag_anchors
                }
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });

        if (response.type === MessageType.RANK_TAGS_COMPLETE) {
            return {
                tags: response.data.result.tags.slice(0, 3),
                tag_types: response.data.result.types.slice(0, 3),
                tag_anchors: response.data.result.anchors.slice(0, 3)
            };
        }
        throw new Error('Unexpected response type');
    } catch (error) {
        console.error('Error getting tag recommendations:', error);
        return getDefaultTags(story);
    }
}

/**
 * Returns default tags when personalization fails or is disabled
 */
export async function getDefaultTags(story: StoryData) {
    return {
        tags: story.tags.slice(0, 3),
        tag_types: story.tag_types.slice(0, 3),
        tag_anchors: story.tag_anchors.slice(0, 3)
    };
} 