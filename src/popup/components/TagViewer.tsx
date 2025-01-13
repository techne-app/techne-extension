import React, { useState, useEffect } from 'react';
import { tagDb, type Tag } from '../../background/db';

export const TagViewer: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load tags function
  const loadTags = async () => {
    try {
      const records = await tagDb.getAllTags();
      setTags(records);
    } catch (err) {
      console.error('Failed to load tags:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Handle clear all tags
  const handleClearAll = async () => {
    try {
      await tagDb.clearTags();
      setTags([]);
    } catch (err) {
      console.error('Failed to clear embeddings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Load tags on component mount and set up message listener
  useEffect(() => {
    loadTags();

    const messageListener = (message: any) => {
      if (message.type === 'EMBEDDINGS_UPDATED') {
        loadTags();
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  // Format vector data for display, showing first 3 values
  const formatVector = (vectorData: Float32Array | undefined): string => {
    if (!vectorData) return 'No data';
    const array = Array.from(vectorData);
    return array.slice(0, 3).map(n => n.toFixed(4)).join(', ') + 
           (array.length > 3 ? '...' : '');
  };

  // Format timestamp to locale string
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-4 text-gray-600">Loading tags...</div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading tags: {error}
      </div>
    );
  }

  // Main render with list of embeddings
  return (
    <div className="w-96 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Navigation History</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleClearAll}
            className="text-red-600 hover:text-red-800"
            title="Clear all embeddings"
          >
            🗑️
          </button>
          <span className="text-sm text-gray-500">
            {tags.length} total
          </span>
        </div>
      </div>
      
      {tags.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No embeddings stored yet
        </div>
      ) : (
        <div className="space-y-4">
          {tags.map((tag) => (
            <div key={tag.id} className="border rounded p-3 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <a 
                  href={tag.anchor}
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(tag.anchor, '_blank');
                  }}
                  className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  {tag.tag}
                </a>
                <span className="text-xs text-gray-500">
                  {formatDate(tag.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};