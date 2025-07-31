import React, { useState, useEffect } from 'react';
import { ChatInterface } from './ChatInterface';
import { Conversation } from '../../types/chat';
import { ConversationManager } from '../../utils/conversationUtils';
import { configStore } from '../../utils/configStore';
import { logger } from '../../utils/logger';

export const ChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleNewConversation = async () => {
    try {
      const config = await configStore.getConfig();
      const newConv = await ConversationManager.createNewConversation(
        'New Conversation',
        config.model
      );
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
    } catch (error) {
      logger.error('Error creating new conversation:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const convs = await ConversationManager.getConversations();
      setConversations(convs);
      
      // Select the first conversation if available, otherwise create a draft
      if (convs.length > 0 && !activeConversationId) {
        setActiveConversationId(convs[0].id);
      } else if (convs.length === 0) {
        // Create a draft conversation so user can start typing immediately
        const config = await configStore.getConfig();
        const draftConv = ConversationManager.createDraftConversation(
          'New Conversation',
          config.model
        );
        setConversations([draftConv]);
        setActiveConversationId(draftConv.id);
      }
    } catch (error) {
      logger.error('Error loading conversations:', error);
      // Create a draft conversation as fallback
      try {
        const config = await configStore.getConfig();
        const draftConv = ConversationManager.createDraftConversation(
          'New Conversation',
          config.model
        );
        setConversations([draftConv]);
        setActiveConversationId(draftConv.id);
      } catch (fallbackError) {
        logger.error('Error creating fallback draft conversation:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await ConversationManager.deleteConversation(id);
      setConversations(prev => prev.filter(conv => conv.id !== id));
      
      // If deleted conversation was active, select another one
      if (activeConversationId === id) {
        const remaining = conversations.filter(conv => conv.id !== id);
        setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (error) {
      logger.error('Error deleting conversation:', error);
    }
  };

  const handleConversationUpdated = (updatedConversation: Conversation) => {
    setConversations(prev => {
      const existingIndex = prev.findIndex(conv => conv.id === updatedConversation.id);
      if (existingIndex >= 0) {
        // Update existing conversation
        return prev.map(conv => 
          conv.id === updatedConversation.id ? updatedConversation : conv
        );
      } else {
        // Add new conversation to the beginning of the list
        return [updatedConversation, ...prev];
      }
    });
    // Always update active conversation ID to the updated/new conversation
    setActiveConversationId(updatedConversation.id);
  };

  const activeConversation = conversations.find(conv => conv.id === activeConversationId) || null;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900">
      <ChatInterface
        activeConversation={activeConversation}
        onConversationUpdated={handleConversationUpdated}
        conversations={conversations}
      />
    </div>
  );
};