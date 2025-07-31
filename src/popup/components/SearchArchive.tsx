import React, { useState, useEffect } from 'react';
import { contextDb, type Search } from '../../background/contextDb';
import { MessageType } from '../../types/messages';
import { logger } from '../../utils/logger';

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
      logger.error('Failed to load searches:', err);
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
      logger.error('Failed to clear searches:', err);
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

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Recent Searches</h2>
        <button
          onClick={handleClearAll}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear
        </button>
      </div>
      
      {/* Content area */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-gray-400">Loading search history...</div>
        ) : error ? (
          <div className="text-red-400">Error: {error}</div>
        ) : !searches.length ? (
          <div className="text-gray-400">No search history yet.</div>
        ) : (
          searches.map((search) => (
            <div key={search.id} className="bg-gray-800 border border-gray-600 p-3 rounded-lg hover:bg-gray-750 transition-colors">
              <div className="flex justify-between items-center">
                <div className="font-medium text-white">
                  {search.query}
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(search.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};