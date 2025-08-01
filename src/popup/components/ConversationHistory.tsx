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
    <div className="p-4" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Always show header and clear button */}
      <div className="flex justify-between items-center mb-4">
        <h2 
          className="text-xl font-bold"
          style={{ 
            color: 'var(--text-primary)',
            fontWeight: 'var(--font-weight-bold)',
            letterSpacing: 'var(--letter-spacing-tight)'
          }}
        >
          Past Conversations
        </h2>
        <button
          onClick={handleClearAll}
          className="px-4 py-2 rounded transition-colors disabled:opacity-50"
          style={{ 
            backgroundColor: '#ef4444',
            color: 'white'
          }}
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#dc2626')}
          onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#ef4444')}
          disabled={loading || conversations.length === 0}
        >
          Clear
        </button>
      </div>

      {/* Content based on state */}
      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading conversations...</div>
      ) : error ? (
        <div style={{ color: '#ef4444' }}>Error: {error}</div>
      ) : conversations.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)' }}>No conversations yet.</div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conversation) => {
            const preview = ConversationManager.formatConversationPreview(conversation);
            return (
              <div
                key={conversation.id}
                className="group relative p-3 rounded-lg transition-colors"
                style={{
                  backgroundColor: 'var(--dark-card)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: activeConversationId === conversation.id ? 'var(--hn-blue)' : 'var(--hn-border)',
                  boxShadow: activeConversationId === conversation.id ? '0 0 0 2px rgba(0, 102, 204, 0.2)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (activeConversationId !== conversation.id) {
                    e.currentTarget.style.backgroundColor = 'var(--dark-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeConversationId !== conversation.id) {
                    e.currentTarget.style.backgroundColor = 'var(--dark-card)';
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div 
                      className="font-medium truncate"
                      style={{ 
                        color: 'var(--text-primary)',
                        fontWeight: 'var(--font-weight-medium)'
                      }}
                    >
                      {preview.title}
                    </div>
                    <div 
                      className="text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {new Date(conversation.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {onSelectConversation && (
                      <button
                        onClick={() => onSelectConversation(conversation.id)}
                        className="text-sm transition-colors"
                        style={{ color: 'var(--hn-blue)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#0052a3'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hn-blue)'}
                      >
                        Open
                      </button>
                    )}
                    {onDeleteConversation && (
                      <button
                        onClick={() => onDeleteConversation(conversation.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
                        title="Delete conversation"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--hn-border)';
                          e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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