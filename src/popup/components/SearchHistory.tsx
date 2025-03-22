import React, { useState, useEffect } from 'react';
import { contextDb, type Search } from '../../background/contextDb';
import { MessageType } from '../../types/messages';

export const SearchArchive: React.FC = () => {
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
      if (message.type === MessageType.SEARCHES_UPDATED) {
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
        <h2 className="text-xl font-bold">Search Archive</h2>
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
              <div className="font-medium">
                {search.query}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(search.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 