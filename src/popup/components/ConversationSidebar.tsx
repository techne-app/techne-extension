import React, { useState } from 'react';
import { Conversation } from '../../types/chat';
import { ConversationManager } from '../../utils/conversationUtils';

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation
}) => {

  return (
    <div className="w-80 bg-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Techne</h2>
          <p className="text-sm text-gray-400">Your personalized navigator for Hacker News.</p>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          {conversations.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-8">
              <p>No conversations yet.</p>
              <p className="mt-2">Click "New Conversation" to start!</p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const preview = ConversationManager.formatConversationPreview(conversation);
              return (
                <div
                  key={conversation.id}
                  className={`group relative p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                    activeConversationId === conversation.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{preview.title}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conversation.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded hover:bg-gray-600 transition-all"
                      title="Delete conversation"
                    >
                      <svg className="w-4 h-4 text-gray-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex-shrink-0 p-4">
        <button 
          onClick={onNewConversation}
          className="w-full p-2 bg-blue-600 rounded hover:bg-blue-500 transition-colors text-center text-sm font-medium text-white"
        >
          New Chat
        </button>
      </div>
    </div>
  );
};

export default ConversationSidebar;