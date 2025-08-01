import React, { useState, useEffect } from 'react';
import { Conversation } from '../../types/chat';
import { ConversationManager } from '../../utils/conversationUtils';
import { logger } from '../../utils/logger';

interface ConversationHistoryProps {
  activeConversationId?: string | null;
  onSelectConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  activeConversationId,
  onSelectConversation,
  onDeleteConversation
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load conversations function
  const loadConversations = async () => {
    try {
      const convs = await ConversationManager.getConversations();
      setConversations(convs);
    } catch (err) {
      logger.error('Failed to load conversations:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Handle clear all conversations
  const handleClearAll = async () => {
    try {
      // Delete ALL conversations
      const deletePromises = conversations.map(conv => ConversationManager.deleteConversation(conv.id));
      await Promise.all(deletePromises);
      setConversations([]);
      
      // Note: The parent component will handle what happens when active conversation is deleted
    } catch (err) {
      logger.error('Failed to clear conversations:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };


  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  return (
    <div className="p-4">
      {/* Always show header and clear button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Past Conversations</h2>
        <button
          onClick={handleClearAll}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          disabled={loading || conversations.length === 0}
        >
          Clear
        </button>
      </div>

      {/* Content based on state */}
      {loading ? (
        <div className="text-gray-400">Loading conversations...</div>
      ) : error ? (
        <div className="text-red-400">Error: {error}</div>
      ) : conversations.length === 0 ? (
        <div className="text-gray-400">No conversations yet.</div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conversation) => {
            const preview = ConversationManager.formatConversationPreview(conversation);
            return (
              <div
                key={conversation.id}
                className={`group relative bg-gray-800 border border-gray-600 p-3 rounded-lg hover:bg-gray-750 transition-colors ${
                  activeConversationId === conversation.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{preview.title}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(conversation.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {onSelectConversation && (
                      <button
                        onClick={() => onSelectConversation(conversation.id)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Open
                      </button>
                    )}
                    {onDeleteConversation && (
                      <button
                        onClick={() => onDeleteConversation(conversation.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-600 transition-all"
                        title="Delete conversation"
                      >
                        <svg className="w-4 h-4 text-gray-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};