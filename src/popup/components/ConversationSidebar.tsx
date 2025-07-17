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
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">WebLLM Chat</h1>
            <p className="text-sm text-gray-400">AI Models Running in Browser</p>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2 mb-4">
          <button 
            onClick={onNewConversation}
            className="p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            title="New Conversation"
          >
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button className="p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors" title="Settings">
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button 
            className="p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors flex-1"
            title="More Options"
          >
            <svg className="w-4 h-4 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
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
                      <div className="text-xs text-gray-400 mt-1">
                        {preview.messageCount} messages • {preview.lastUpdated}
                      </div>
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
      <div className="p-4 border-t border-gray-700">
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