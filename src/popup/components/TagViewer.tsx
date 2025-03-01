import React, { useState, useEffect } from 'react';
import { tagDb, type Tag } from '../../background/db';
import { MessageType, ExtensionResponse } from '../../types/messages';

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
      console.error('Failed to clear tags:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Load tags on component mount and set up message listener
  useEffect(() => {
    loadTags();

    // Define the message listener function
    const handleMessage = (message: any) => {
      console.log('TagViewer received message:', message);
      if (message.type === MessageType.TAGS_UPDATED) {
        console.log('Reloading tags due to TAGS_UPDATED message');
        loadTags();
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
  const formatDate = (timestamp: number | undefined): string => {
    return timestamp ? new Date(timestamp).toLocaleString() : 'Unknown date';
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
      <div className="p-4 text-red-600">Error: {error}</div>
    );
  }

  // Empty state
  if (!tags.length) {
    return (
      <div className="p-4 text-gray-600">No threads visited yet. Try some.</div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Visited Threads</h2>
        <button
          onClick={handleClearAll}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear All
        </button>
      </div>
      <div className="space-y-2">
        {tags.map((tag) => (
          <div key={tag.id} className="border p-3 rounded">
            <div className="font-medium">{tag.tag}</div>
            <div className="text-sm text-gray-500">
              Visited: {formatDate(tag.timestamp)}
              <br />
              <a 
                href={tag.anchor} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Go to thread
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};