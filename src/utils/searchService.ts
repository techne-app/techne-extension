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
   * Execute semantic search against HN top stories with streaming results
   * @param query - Search query string
   * @param onProgress - Optional callback for streaming results
   * @returns Promise<SearchResult>
   */
  static async executeSearchStreaming(
    query: string, 
    onProgress?: (content: string) => void
  ): Promise<SearchResult> {
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

      if (onProgress) {
        onProgress(`I'll search for "${query}" in recent Hacker News discussions...\n\n`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Fetch top story IDs
      const hnApiUrl = "https://hacker-news.firebaseio.com/v0/topstories.json";
      const storyIdsResponse = await fetch(hnApiUrl);
      
      if (!storyIdsResponse.ok) {
        throw new Error(`Failed to fetch story IDs: ${storyIdsResponse.status}`);
      }
      
      if (onProgress) {
        onProgress(`I'll search for "${query}" in recent Hacker News discussions...\n\nFetching latest stories from Hacker News...`);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const allStoryIds = await storyIdsResponse.json();
      const storyIds = allStoryIds.slice(0, 30);
      
      if (storyIds.length === 0) {
        throw new Error('No story IDs found');
      }
      
      if (onProgress) {
        onProgress(`I'll search for "${query}" in recent Hacker News discussions...\n\nFetching latest stories from Hacker News...\n\nAnalyzing ${storyIds.length} top stories...`);
        await new Promise(resolve => setTimeout(resolve, 400));
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
      
      if (onProgress) {
        onProgress(`I'll search for "${query}" in recent Hacker News discussions...\n\nFetching latest stories from Hacker News...\n\nAnalyzing ${storyIds.length} top stories...\n\nPerforming semantic search...`);
        await new Promise(resolve => setTimeout(resolve, 300));
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
        const errorResult = {
          query,
          matches: [],
          error: 'No valid tags found'
        };
        
        if (onProgress) {
          const errorContent = this.formatSearchResultsAsMessage(query, errorResult);
          onProgress(errorContent);
        }
        
        return errorResult;
      }
      
      // Perform semantic matching via background script with timeout handling
      try {
        console.log('🔄 Starting Promise.race for semantic matching...');
        const matches = await Promise.race([
          this.performSemanticMatching(query, formattedTags),
          new Promise<TagMatch[]>((_, reject) => 
            setTimeout(() => reject(new Error('Search timeout - semantic matching took too long')), 15000)
          )
        ]);
        
        console.log('🎯 Promise.race completed, matches received:', matches?.length || 0);
        
        if (onProgress) {
          console.log('📝 Updating progress to Processing results...');
          onProgress(`I'll search for "${query}" in recent Hacker News discussions...\n\nFetching latest stories from Hacker News...\n\nAnalyzing ${storyIds.length} top stories...\n\nPerforming semantic search...\n\nProcessing results...`);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Continue with results processing
        console.log('🔧 Building final search result...');
        const searchResult = {
          query,
          matches,
          error: matches.length === 0 ? 'No matching discussions found' : undefined
        };
        
        console.log('📊 Final search result prepared:', searchResult);
        
        if (onProgress) {
          console.log('🎨 Formatting final content...');
          const finalContent = this.formatSearchResultsAsMessage(query, searchResult);
          console.log('📤 Sending final content via onProgress:', finalContent.substring(0, 100) + '...');
          onProgress(finalContent);
        }
        
        console.log('✅ executeSearchStreaming completed successfully');
        return searchResult;
      } catch (matchingError) {
        console.error('❌ Semantic matching failed:', matchingError);
        const errorResult = {
          query,
          matches: [],
          error: matchingError instanceof Error ? matchingError.message : 'Semantic search failed'
        };
        
        if (onProgress) {
          const errorContent = this.formatSearchResultsAsMessage(query, errorResult);
          onProgress(errorContent);
        }
        
        return errorResult;
      }
    } catch (error) {
      console.error('Error during search:', error);
      const errorResult = {
        query,
        matches: [],
        error: error instanceof Error ? error.message : 'Search failed'
      };
      
      if (onProgress) {
        const errorContent = this.formatSearchResultsAsMessage(query, errorResult);
        onProgress(errorContent);
      }
      
      return errorResult;
    }
  }

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
    return new Promise((resolve, reject) => {
      console.log('🔍 Starting semantic matching for:', inputText, 'with', tags.length, 'tags');
      let timeoutId: NodeJS.Timeout;
      let resolved = false;
      
      // Set up message listener for response
      const handleMessage = (message: any) => {
        if (message.type === MessageType.TAG_MATCH_RESPONSE && !resolved) {
          console.log('✅ Received TAG_MATCH_RESPONSE:', message.data);
          resolved = true;
          clearTimeout(timeoutId);
          chrome.runtime.onMessage.removeListener(handleMessage);
          
          if (message.data.error) {
            console.error('❌ Semantic matching error:', message.data.error);
            resolve([]);
          } else {
            console.log('🎯 Semantic matching success, matches:', message.data.matches?.length || 0);
            resolve(message.data.matches || []);
          }
        }
      };

      chrome.runtime.onMessage.addListener(handleMessage);

      // Send match request
      console.log('📤 Sending TAG_MATCH_REQUEST...');
      chrome.runtime.sendMessage({
        type: MessageType.TAG_MATCH_REQUEST,
        data: {
          inputText,
          tags
        }
      }).then(() => {
        console.log('✅ TAG_MATCH_REQUEST sent successfully');
      }).catch((error) => {
        console.error('❌ Failed to send TAG_MATCH_REQUEST:', error);
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          chrome.runtime.onMessage.removeListener(handleMessage);
          reject(new Error('Failed to send search request to background script'));
        }
      });

      // Timeout fallback
      timeoutId = setTimeout(() => {
        if (!resolved) {
          console.warn('⏰ Semantic matching timeout reached');
          resolved = true;
          chrome.runtime.onMessage.removeListener(handleMessage);
          resolve([]);
        }
      }, 10000);
    });
  }

  /**
   * Format search results as message content
   * @param query - Search query
   * @param searchResult - Search result object
   * @returns Formatted message string
   */
  static formatSearchResultsAsMessage(query: string, searchResult: SearchResult): string {
    if (searchResult.error) {
      return `I encountered an error while searching for "${query}": ${searchResult.error}`;
    }
    
    if (searchResult.matches.length === 0) {
      return `I couldn't find any discussions about "${query}" in the recent top stories. Try a different search term or check back later.`;
    }
    
    const matchesText = searchResult.matches.slice(0, 5).map((match: TagMatch, index: number) => 
      `${index + 1}. **${match.tag}** (${match.type}, Score: ${match.score.toFixed(2)}) - [View Discussion](${match.anchor})`
    ).join('\n');
    
    let response = `I found ${searchResult.matches.length} discussion${searchResult.matches.length !== 1 ? 's' : ''} about "${query}":\n\n${matchesText}`;
    
    if (searchResult.matches.length > 5) {
      response += `\n\n... and ${searchResult.matches.length - 5} more result${searchResult.matches.length - 5 !== 1 ? 's' : ''}`;
    }
    
    response += '\n\nClick any discussion link to open it in a new tab.';
    
    return response;
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