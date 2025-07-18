import { MessageType, NewSearchRequest } from '../types/messages';
import { fetchStoryTags } from './tag-utils';

export interface TagMatch {
  tag: string;
  type: string;
  anchor: string;
  score: number;
}

export interface SearchResult {
  query: string;
  matches: TagMatch[];
  error?: string;
}

export class SearchService {
  /**
   * Execute semantic search against HN top stories
   * @param query - Search query string
   * @returns Promise<SearchResult>
   */
  static async executeSearch(query: string): Promise<SearchResult> {
    if (!query.trim()) {
      return {
        query,
        matches: [],
        error: 'Please enter a search term'
      };
    }

    try {
      // Store the search query
      chrome.runtime.sendMessage({
        type: MessageType.NEW_SEARCH,
        data: { query }
      } as NewSearchRequest).catch(() => {
        console.debug('No listeners for NEW_SEARCH message, this is expected');
      });

      // Fetch top story IDs
      const hnApiUrl = "https://hacker-news.firebaseio.com/v0/topstories.json";
      const storyIdsResponse = await fetch(hnApiUrl);
      
      if (!storyIdsResponse.ok) {
        throw new Error(`Failed to fetch story IDs: ${storyIdsResponse.status}`);
      }
      
      const allStoryIds = await storyIdsResponse.json();
      const storyIds = allStoryIds.slice(0, 30);
      
      if (storyIds.length === 0) {
        throw new Error('No story IDs found');
      }
      
      // Fetch tags for stories
      const data = await fetchStoryTags(storyIds, undefined, false, ['thread_theme']);
      
      if (!Array.isArray(data) || data.length === 0) {
        return {
          query,
          matches: [],
          error: 'No tags returned from API'
        };
      }
      
      // Format tags
      const formattedTags = [];
      for (const story of data) {
        if (story.tags && Array.isArray(story.tags)) {
          for (let i = 0; i < story.tags.length; i++) {
            if (story.tags[i] && story.tag_types?.[i] && story.tag_anchors?.[i]) {
              formattedTags.push({
                tag: story.tags[i],
                type: story.tag_types[i],
                anchor: story.tag_anchors[i]
              });
            }
          }
        }
      }
      
      if (formattedTags.length === 0) {
        return {
          query,
          matches: [],
          error: 'No valid tags found'
        };
      }
      
      // Perform semantic matching via background script
      const matches = await this.performSemanticMatching(query, formattedTags);
      
      return {
        query,
        matches,
        error: matches.length === 0 ? 'No matching discussions found' : undefined
      };
    } catch (error) {
      console.error('Error during search:', error);
      return {
        query,
        matches: [],
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  /**
   * Perform semantic matching using background script
   * @param inputText - Query text
   * @param tags - Available tags to match against
   * @returns Promise<TagMatch[]>
   */
  private static async performSemanticMatching(
    inputText: string, 
    tags: Array<{tag: string, type: string, anchor: string}>
  ): Promise<TagMatch[]> {
    return new Promise((resolve) => {
      // Set up message listener for response
      const handleMessage = (message: any) => {
        if (message.type === MessageType.TAG_MATCH_RESPONSE) {
          chrome.runtime.onMessage.removeListener(handleMessage);
          if (message.data.error) {
            resolve([]);
          } else {
            resolve(message.data.matches || []);
          }
        }
      };

      chrome.runtime.onMessage.addListener(handleMessage);

      // Send match request
      chrome.runtime.sendMessage({
        type: MessageType.TAG_MATCH_REQUEST,
        data: {
          inputText,
          tags
        }
      }).catch(() => {
        console.debug('No listeners for TAG_MATCH_REQUEST message, this is expected');
        resolve([]);
      });

      // Timeout fallback
      setTimeout(() => {
        chrome.runtime.onMessage.removeListener(handleMessage);
        resolve([]);
      }, 10000);
    });
  }

  /**
   * Handle tag click for analytics
   * @param tag - Tag that was clicked
   * @param type - Tag type
   * @param anchor - URL anchor
   */
  static handleTagClick(tag: string, type: string, anchor: string): void {
    chrome.runtime.sendMessage({
      type: 'NEW_TAG',
      data: {
        tag,
        type,
        anchor
      }
    }).catch(() => {
      console.debug('No listeners for NEW_TAG message, this is expected');
    });
  }

  /**
   * Open thread in new tab
   * @param anchor - URL to open
   */
  static openThread(anchor: string): void {
    window.open(anchor, '_blank');
  }
}