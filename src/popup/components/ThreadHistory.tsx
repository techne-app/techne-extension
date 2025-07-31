import React, { useState, useEffect } from 'react';
import { contextDb, type Tag } from '../../background/contextDb';
import { MessageType } from '../../types/messages';
import { TagHistoryCard } from './TagHistoryCard';
import { logger } from '../../utils/logger';

export const ThreadHistory: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load tags function
  const loadTags = async () => {
    try {
      const records = await contextDb.getAllTags();
      // Filter out any records with undefined required fields
      const validRecords = records.filter(
        record => record.tag && record.type && record.anchor
      );
      setTags(validRecords);
    } catch (err) {
      logger.error('Failed to load tags:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Handle clear all tags
  const handleClearAll = async () => {
    try {
      await contextDb.clearTags();
      setTags([]);
    } catch (err) {
      logger.error('Failed to clear tags:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Load tags on component mount and set up message listener
  useEffect(() => {
    loadTags();

    // Define the message listener function
    const handleMessage = (message: any) => {
      logger.debug('ThreadHistory received message:', message);
      if (message.type === MessageType.TAGS_UPDATED) {
        logger.debug('Reloading tags due to TAGS_UPDATED message');
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

  // Loading state
  if (loading) {
    return (
      <div className="p-4 text-gray-400">Loading tags...</div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 text-red-400">Error: {error}</div>
    );
  }

  // Empty state
  if (!tags.length) {
    return (
      <div className="p-4 text-gray-400">No threads visited yet. Try some.</div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Visited Threads</h2>
        <button
          onClick={handleClearAll}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear
        </button>
      </div>
      <div className="space-y-2">
        {tags.map((tag) => (
          <TagHistoryCard
            key={tag.id}
            tag={tag.tag || ''}
            type={tag.type || ''}
            anchor={tag.anchor || ''}
            timestamp={tag.timestamp}
          />
        ))}
      </div>
    </div>
  );
};