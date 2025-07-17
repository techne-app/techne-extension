import React, { useState, useEffect } from 'react';
import { ChatInterface } from './ChatInterface';
import { ConversationSidebar } from './ConversationSidebar';
import { Conversation } from '../../types/chat';
import { ConversationManager } from '../../utils/conversationUtils';
import { configStore } from '../../utils/configStore';

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
      console.error('Error creating new conversation:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const convs = await ConversationManager.getConversations();
      setConversations(convs);
      
      // Select the first conversation if available, or create new one if none exist
      if (convs.length > 0 && !activeConversationId) {
        setActiveConversationId(convs[0].id);
      } else if (convs.length === 0) {
        // Auto-create new conversation if none exist
        await handleNewConversation();
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
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
      console.error('Error deleting conversation:', error);
    }
  };

  const handleConversationUpdated = (updatedConversation: Conversation) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === updatedConversation.id ? updatedConversation : conv
      )
    );
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
    <div className="h-full flex bg-gray-900">
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      <ChatInterface
        activeConversation={activeConversation}
        onConversationUpdated={handleConversationUpdated}
      />
    </div>
  );
};