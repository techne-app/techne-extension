import React, { useState, useEffect } from 'react';
import { contextDb, type Search } from '../../background/contextDb';
import { MessageType } from '../../types/messages';

export const SearchHistory: React.FC = () => {
  const [searches, setSearches] = useState<Search[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load searches function
  const loadSearches = async () => {
    try {
      const records = await contextDb.getRecentSearches(10); // Get the 10 most recent searches
      setSearches(records);
    } catch (err) {
      console.error('Failed to load searches:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Handle clear all searches
  const handleClearAll = async () => {
    try {
      await contextDb.clearSearches();
      setSearches([]);
    } catch (err) {
      console.error('Failed to clear searches:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Load searches on component mount and set up message listener
  useEffect(() => {
    loadSearches();

    // Define the message listener function
    const handleMessage = (message: any) => {
      console.log('SearchHistory received message:', message);
      if (message.type === MessageType.SEARCHES_UPDATED) {
        console.log('Reloading searches due to SEARCHES_UPDATED message');
        loadSearches();
      }
    };

    // Add the listener
    chrome.runtime.onMessage.addListener(handleMessage);

    // Clean up the listener when component unmounts
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  // Format timestamp to locale string
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Handle search click - populate the search box
  const handleSearchClick = (query: string) => {
    // Send a message to TagMatcher to update its input
    chrome.runtime.sendMessage({
      type: 'UPDATE_SEARCH_INPUT',
      data: { query }
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-4 text-gray-600">Loading search history...</div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 text-red-600">Error: {error}</div>
    );
  }

  // Empty state
  if (!searches.length) {
    return (
      <div className="p-4 text-gray-600">No search history yet.</div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Recent Searches</h2>
        <button
          onClick={handleClearAll}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear All
        </button>
      </div>
      <div className="space-y-2">
        {searches.map((search) => (
          <div key={search.id} className="border p-3 rounded">
            <div className="flex justify-between items-center">
              <div className="font-medium cursor-pointer hover:text-blue-500" 
                   onClick={() => handleSearchClick(search.query)}>
                {search.query}
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(search.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 