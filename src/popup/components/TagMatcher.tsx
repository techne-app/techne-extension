import React, { useState, useEffect } from 'react';
import { MessageType, TagMatchResponse, NewSearchRequest, NewTagRequest } from '../../types/messages';
import { CONFIG } from '../../config';
import { StoryData } from '../../types';
import { fetchTags } from '../../utils/tag-utils';

interface TagMatch {
  tag: string;
  type: string;
  anchor: string;
  score: number;
}

export const TagMatcher: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<TagMatch[]>([]);

  // Handle message responses from background script
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === MessageType.TAG_MATCH_RESPONSE) {
        setLoading(false);
        if (message.data.error) {
          setError(message.data.error);
        } else {
          setMatches(message.data.matches);
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  // Handle test button click
  const handleTestClick = async () => {
    if (!inputText.trim()) {
      setError('Please enter a tag to test');
      return;
    }

    setLoading(true);
    setError(null);
    setMatches([]);

    try {
      // Store the search query
      chrome.runtime.sendMessage({
        type: MessageType.NEW_SEARCH,
        data: {
          query: inputText
        }
      } as NewSearchRequest);

      // Fetch top story IDs from Hacker News API
      const hnApiUrl = "https://hacker-news.firebaseio.com/v0/topstories.json";
      const storyIdsResponse = await fetch(hnApiUrl);
      
      if (!storyIdsResponse.ok) {
        throw new Error(`Failed to fetch story IDs: ${storyIdsResponse.status}`);
      }
      
      const allStoryIds = await storyIdsResponse.json();
      // Take the first 30 story IDs
      const storyIds = allStoryIds.slice(0, 30);
      
      if (storyIds.length === 0) {
        throw new Error('No story IDs found');
      }
      
      console.log('Fetched story IDs:', storyIds);
      
      // Now fetch tags for these stories using your existing utility
      const data = await fetchTags<StoryData>(
        CONFIG.ENDPOINTS.STORY_TAGS, 
        storyIds, 
        'story_ids',
        false,
        ['thread_theme']
      );
      
      console.log('API response:', data);
      
      // Check if we have valid data
      if (!Array.isArray(data) || data.length === 0) {
        setError('No tags returned from API');
        setLoading(false);
        return;
      }
      
      // Format tags for message
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
      
      console.log('Formatted tags:', formattedTags);
      
      if (formattedTags.length === 0) {
        setError('No valid tags found in API response');
        setLoading(false);
        return;
      }
      
      // Send message to background
      chrome.runtime.sendMessage({
        type: MessageType.TAG_MATCH_REQUEST,
        data: {
          inputText,
          tags: formattedTags
        }
      });
    } catch (error) {
      console.error('Error fetching tags:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch tags');
      setLoading(false);
    }
  };

  // Format score as percentage
  const formatScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  // Handle thread link click
  const handleThreadClick = (match: TagMatch) => {
    // Store the tag in TagDB when a user clicks on "Go to thread"
    chrome.runtime.sendMessage({
      type: MessageType.NEW_TAG,
      data: {
        tag: match.tag,
        type: match.type,
        anchor: match.anchor
      }
    } as NewTagRequest);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Search for recent threads</h2>
      
      <div className="flex mb-4">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter a tag to test..."
          className="flex-grow p-2 border rounded mr-2"
        />
        <button
          onClick={handleTestClick}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}
      
      {matches.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Results:</h3>
          <div className="space-y-2">
            {matches.map((match, index) => (
              <div key={index} className="border p-3 rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{match.tag}</span>
                    <div className="text-sm text-gray-500">
                      Type: {match.type}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-green-600 font-medium">{formatScore(match.score)} match</span>
                    <a 
                      href={match.anchor} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm"
                      onClick={() => handleThreadClick(match)}
                    >
                      Go to thread
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 