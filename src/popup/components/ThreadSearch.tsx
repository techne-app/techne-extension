import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { MessageType, TagMatchResponse, NewSearchRequest } from '../../types/messages';
import { contextDb, type Search } from '../../background/contextDb';
import { SearchService, TagMatch } from '../../utils/searchService';

// TagMatch interface now imported from SearchService

interface ThreadSearchProps {
  onSearch?: (query: string, results: TagMatch[]) => void;
  onClear?: () => void;
  initialQuery?: string;
}

export const ThreadSearch: React.FC<ThreadSearchProps> = ({ 
  onSearch, 
  onClear, 
  initialQuery = '' 
}) => {
  const [inputValue, setInputValue] = useState(initialQuery);
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
      // Use the new SearchService
      const searchResult = await SearchService.executeSearch(query);
      
      if (searchResult.error) {
        setError(searchResult.error);
      } else {
        setMatches(searchResult.matches);
        // Call onSearch callback if provided
        if (onSearch) {
          onSearch(query, searchResult.matches);
        }
      }
    } catch (error) {
      console.error('Error during search:', error);
      setError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };


  // Load searches on mount and set up listeners
  useEffect(() => {
    loadRecentSearches();

    const handleMessage = (message: any) => {
      if (message.type === MessageType.SEARCHES_UPDATED) {
        loadRecentSearches();
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  return (
    <div>
      <div className="relative">
        <div className="flex mb-2 gap-2">
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
            className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => executeSearch(inputValue)}
            disabled={loading}
            className="px-4 py-2 text-white rounded disabled:bg-blue-300"
            style={{ backgroundColor: '#0000ED' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0000CC'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0000ED'}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          {(inputValue || matches.length > 0) && (
            <button
              onClick={() => {
                setInputValue('');
                setMatches([]);
                setError(null);
                if (onClear) {
                  onClear();
                }
              }}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 border rounded"
            >
              Clear
            </button>
          )}
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
    </div>
  );
}; 