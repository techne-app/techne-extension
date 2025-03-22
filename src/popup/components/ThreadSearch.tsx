import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { MessageType, TagMatchResponse, NewSearchRequest, NewTagRequest } from '../../types/messages';
import { contextDb, type Search } from '../../background/contextDb';
import { ThreadCard } from './ThreadCard';
import { fetchStoryTags } from '../../utils/tag-utils';

interface TagMatch {
  tag: string;
  type: string;
  anchor: string;
  score: number;
}

export const ThreadSearch: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<TagMatch[]>([]);
  const [recentSearches, setRecentSearches] = useState<Search[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches
  const loadRecentSearches = async () => {
    try {
      const searches = await contextDb.getRecentSearches(10); // Get more searches for better autocomplete
      setRecentSearches(searches);
    } catch (err) {
      console.error('Failed to load searches:', err);
    }
  };

  // Filter items based on input
  const getFilteredItems = (input: string) => {
    return recentSearches
      .filter(item => 
        item.query.toLowerCase().includes(input.toLowerCase()))
      .slice(0, 3) // Only show top 3 matches
      .map(item => item.query);
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const filteredItems = getFilteredItems(inputValue);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredItems.length) {
          handleSelectItem(filteredItems[selectedIndex]);
        } else {
          executeSearch(inputValue);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle item selection
  const handleSelectItem = (item: string) => {
    setInputValue(item);
    setIsOpen(false);
    setSelectedIndex(-1);
    executeSearch(item);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search execution
  const executeSearch = async (query: string) => {
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }

    setLoading(true);
    setError(null);
    setMatches([]);
    setIsOpen(false);

    try {
      // Store the search query
      chrome.runtime.sendMessage({
        type: MessageType.NEW_SEARCH,
        data: { query }
      } as NewSearchRequest);

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
        setError('No tags returned from API');
        return;
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
        setError('No valid tags found');
        return;
      }
      
      // Send match request
      chrome.runtime.sendMessage({
        type: MessageType.TAG_MATCH_REQUEST,
        data: {
          inputText: query,
          tags: formattedTags
        }
      });
    } catch (error) {
      console.error('Error during search:', error);
      setError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle thread click
  const handleThreadClick = (match: TagMatch) => {
    chrome.runtime.sendMessage({
      type: MessageType.NEW_TAG,
      data: {
        tag: match.tag,
        type: match.type,
        anchor: match.anchor
      }
    } as NewTagRequest);
  };

  // Load searches on mount and set up listeners
  useEffect(() => {
    loadRecentSearches();

    const handleMessage = (message: any) => {
      if (message.type === MessageType.TAG_MATCH_RESPONSE) {
        setLoading(false);
        if (message.data.error) {
          setError(message.data.error);
        } else {
          setMatches(message.data.matches);
        }
      } else if (message.type === MessageType.SEARCHES_UPDATED) {
        loadRecentSearches();
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Search Threads</h2>
      
      <div className="relative">
        <div className="flex mb-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            placeholder="Search threads..."
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            role="combobox"
            className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => executeSearch(inputValue)}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Autocomplete dropdown */}
        <ul
          id="search-suggestions"
          ref={dropdownRef}
          role="listbox"
          className={`absolute w-full bg-white border rounded-b shadow-lg z-10 max-h-60 overflow-y-auto ${
            isOpen && getFilteredItems(inputValue).length > 0 ? '' : 'hidden'
          }`}
        >
          {getFilteredItems(inputValue).map((item, index) => (
            <li
              key={`${item}${index}`}
              role="option"
              aria-selected={selectedIndex === index}
              onClick={() => handleSelectItem(item)}
              className={`p-2 cursor-pointer ${
                selectedIndex === index ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
      
      {error && (
        <div className="text-red-500 mt-2 mb-4">{error}</div>
      )}
      
      {matches.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Results:</h3>
          <div className="space-y-2">
            {matches.map((match, index) => (
              <ThreadCard
                key={index}
                tag={match.tag}
                type={match.type}
                anchor={match.anchor}
                score={match.score}
                onThreadClick={() => handleThreadClick(match)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 