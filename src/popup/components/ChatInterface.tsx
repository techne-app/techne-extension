import React, { useState, useRef, useEffect } from 'react';
import { type ChatCompletionMessageParam } from "@mlc-ai/web-llm";
import { Conversation, ChatMessage, MODEL_OPTIONS } from '../../types/chat';
import { ConversationManager } from '../../utils/conversationUtils';
import { webLLMClient } from '../../utils/webLLMClient';
import { configStore } from '../../utils/configStore';
import MessageBubble from './MessageBubble';
import { IntentDetector } from '../../utils/intentDetector';
import { SearchService } from '../../utils/searchService';
import { logger } from '../../utils/logger';
import { Modal } from './Modal';
import { ActivityPage } from './ActivityPage';
import { SettingsPage } from './SettingsPage';
import { FeedPage } from './FeedPage';

// Helper function to convert technical errors to user-friendly messages
const getUserFriendlyErrorMessage = (error: string): string => {
  const lowerError = error.toLowerCase();
  if (lowerError.includes('cache') || lowerError.includes('failed to execute') || lowerError.includes('networkerror')) {
    return 'Unable to download AI model - please check your connection and try again';
  }
  // Default case for other errors
  return 'Something went wrong - please try again';
};

interface ChatInterfaceProps {
  activeConversation: Conversation | null;
  onConversationUpdated: (conversation: Conversation) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  activeConversation, 
  onConversationUpdated 
}) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedModelName, setLoadedModelName] = useState<string>('');
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelLoadingProgress, setModelLoadingProgress] = useState(0);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, streamingMessage]);

  // Update model display name when conversation changes
  useEffect(() => {
    if (activeConversation) {
      setLoadedModelName(activeConversation.modelDisplayName);
    }
  }, [activeConversation]);

  // Handle search request with streaming - reuse existing assistant message
  const handleSearchRequest = async (searchQuery: string, assistantMessageId: string) => {
    try {
      logger.search('Starting handleSearchRequest for:', searchQuery);
      
      // Execute search with streaming
      await SearchService.executeSearchStreaming(searchQuery, async (content) => {
        try {
          logger.debug('Received content update:', content.substring(0, 50) + '...');
          
          // Update streaming message state
          setStreamingMessage(prev => prev ? {
            ...prev,
            content,
            isStreaming: true
          } : null);
          
          // Update database with current content (await the async operation)
          await ConversationManager.updateMessage(
            activeConversation!.id, 
            assistantMessageId, 
            content
          );
          
          logger.database('Database updated with content');
        } catch (error) {
          logger.error('Error in search streaming callback:', error);
        }
      });
      
      logger.search('SearchService.executeSearchStreaming completed');
      
      // Finalize the streaming message
      setStreamingMessage(prev => prev ? {
        ...prev,
        isStreaming: false
      } : null);
      
      logger.debug('Getting updated conversation...');
      
      // Get updated conversation
      const updatedConversation = await ConversationManager.getConversation(activeConversation!.id);
      if (updatedConversation) {
        onConversationUpdated(updatedConversation);
        logger.debug('Conversation updated in UI');
      }
    } catch (error) {
      logger.error('Search error:', error);
      // Update the assistant message with error content
      const errorContent = `I encountered an error while searching for "${searchQuery}": ${error instanceof Error ? error.message : 'Unknown error'}`;
      await ConversationManager.updateMessage(
        activeConversation!.id, 
        assistantMessageId, 
        errorContent
      );
      setError('Search failed. Please try again.');
    } finally {
      logger.debug('handleSearchRequest finally block');
      setIsLoading(false);
      setStreamingMessage(null);
    }
  };


  const handleSubmit = async () => {
    if (!message.trim() || !activeConversation || isModelLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Add user message to conversation
      await ConversationManager.addMessage(activeConversation.id, 'user', userMessage);
      
      // Update conversation title if this is the first message
      if (activeConversation.messages.length === 0) {
        const newTitle = ConversationManager.generateConversationTitle(userMessage);
        await ConversationManager.updateConversationTitle(activeConversation.id, newTitle);
      }

      // Get updated conversation
      const updatedConversation = await ConversationManager.getConversation(activeConversation.id);
      if (updatedConversation) {
        onConversationUpdated(updatedConversation);
      }

      // Create streaming assistant message for regular chat
      const assistantMessage = await ConversationManager.addMessage(
        activeConversation.id, 
        'assistant', 
        '', 
        true
      );
      setStreamingMessage(assistantMessage);

      // Prepare chat history for the engine
      const chatHistory: ChatCompletionMessageParam[] = updatedConversation?.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })) || [];

      // Get current config
      const config = await configStore.getConfig();
      setLoadedModelName(MODEL_OPTIONS.find(m => m.value === config.model)?.name || config.model);


      // Check if model is already loaded by checking webLLMClient state
      const isModelLoaded = webLLMClient.isModelLoaded();
      logger.model('Model loaded check:', isModelLoaded);
      
      if (isModelLoaded) {
        logger.model('Model already loaded, checking for search intent...');
        try {
          const intentResult = await IntentDetector.detectSearchIntent(userMessage);
          logger.intent('Intent detection result:', intentResult);
          
          if (intentResult.isSearch && intentResult.searchQuery && intentResult.confidence > 0.5) {
            logger.search('Search intent detected with high confidence, executing search for:', intentResult.searchQuery);
            // Update both streaming message and database with search status
            const searchStatusContent = `🔍 Searching for "${intentResult.searchQuery}"...`;
            setStreamingMessage(prev => prev ? {
              ...prev,
              content: searchStatusContent,
              isStreaming: false
            } : null);
            
            // Update the database message with search status
            await ConversationManager.updateMessage(
              activeConversation.id, 
              assistantMessage.id, 
              searchStatusContent
            );
            
            await handleSearchRequest(intentResult.searchQuery, assistantMessage.id);
            
            // Get final updated conversation after search completes
            const finalConversation = await ConversationManager.getConversation(activeConversation.id);
            if (finalConversation) {
              onConversationUpdated(finalConversation);
            }
            return;
          } else {
            logger.chat('No search intent detected or low confidence, continuing with chat. Confidence:', intentResult.confidence);
          }
        } catch (error) {
          logger.error('Intent detection failed:', error);
        }
      } else {
        logger.model('Model not loaded, will perform intent detection after loading');
      }

      // Only proceed with chat if we didn't intercept for search
      logger.chat('Starting chat conversation...');

      // Use WebLLM client with web-llm-chat patterns
      try {
        await webLLMClient.chat({
        messages: chatHistory,
        config: {
          model: config.model,
          temperature: config.temperature,
          topP: config.topP,
          maxTokens: config.maxTokens,
          stream: true,
        },
        // Only show loading UI if model actually needs to load
        onModelLoadingStart: !isModelLoaded ? () => {
          setIsModelLoading(true);
          setModelLoadingProgress(0);
        } : undefined,
        onModelLoadingProgress: !isModelLoaded ? (progress) => {
          setModelLoadingProgress(progress);
        } : undefined,
        onModelLoadingComplete: !isModelLoaded ? async () => {
          setIsModelLoading(false);
          setModelLoadingProgress(1);
          
          // Perform intent detection after model loads
          logger.model('Model loading complete, now checking for search intent...');
          try {
            const intentResult = await IntentDetector.detectSearchIntent(userMessage);
            logger.intent('Intent detection result:', intentResult);
            
            if (intentResult.isSearch && intentResult.searchQuery && intentResult.confidence > 0.5) {
              logger.search('Search intent detected with high confidence, executing search for:', intentResult.searchQuery);
              // Update both streaming message and database with search status
              const searchStatusContent = `🔍 Searching for "${intentResult.searchQuery}"...`;
              setStreamingMessage(prev => prev ? {
                ...prev,
                content: searchStatusContent,
                isStreaming: false
              } : null);
              
              // Update the database message with search status
              await ConversationManager.updateMessage(
                activeConversation.id, 
                assistantMessage.id, 
                searchStatusContent
              );
              
              await handleSearchRequest(intentResult.searchQuery, assistantMessage.id);
              
              // Get final updated conversation after search completes
              const finalConversation = await ConversationManager.getConversation(activeConversation.id);
              if (finalConversation) {
                onConversationUpdated(finalConversation);
              }
              return false; // Abort chat
            } else {
              logger.chat('No search intent detected or low confidence, continuing with chat. Confidence:', intentResult.confidence);
            }
          } catch (error) {
            logger.error('Intent detection failed:', error);
          }
          
          return true; // Continue with chat
        } : undefined,
        onUpdate: (message) => {
          // Update streaming message
          setStreamingMessage(prev => prev ? {
            ...prev,
            content: message
          } : null);
        },
        onFinish: async (message) => {
          // Update the message in the database
          await ConversationManager.updateMessage(activeConversation.id, assistantMessage.id, message);
          
          // Get final updated conversation
          const finalConversation = await ConversationManager.getConversation(activeConversation.id);
          if (finalConversation) {
            onConversationUpdated(finalConversation);
          }

          setStreamingMessage(null);
        },
        onError: (errorMessage) => {
          logger.error('WebLLM chat error:', errorMessage);
          setError(errorMessage);
          setStreamingMessage(null);
          setIsModelLoading(false);
        }
        });
      } catch (error) {
        logger.error('WebLLM chat failed:', error);
        setIsModelLoading(false);
        setError('Chat failed to start');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
      logger.error('Error during chat:', err);
      setStreamingMessage(null);
      setIsModelLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-lg font-medium">Select a conversation to start chatting</p>
          <p className="text-sm mt-2">Choose a conversation from the sidebar or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white truncate">
              {activeConversation.title}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {/* Feed Icon */}
            <button
              onClick={() => setIsFeedModalOpen(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Feed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            
            {/* Memory Icon */}
            <button
              onClick={() => setIsMemoryModalOpen(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Memory"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            
            {/* Settings Icon */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto">
          
          {activeConversation.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {streamingMessage && (
            <MessageBubble message={streamingMessage} />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4">
        <div className="max-w-4xl mx-auto">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isModelLoading ? "Loading model, please wait..." : "Enter to send"}
            disabled={isLoading || isModelLoading}
            className="w-full p-3 bg-gray-800 text-white rounded border border-gray-600 resize-none focus:outline-none focus:border-blue-500"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          
          {/* Status indicator - small reserved space, prominent when active */}
          <div className="flex items-center justify-center mt-2 h-6">
            {isModelLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-blue-500"></div>
                <span>Loading model...</span>
                <div className="w-24 h-1 bg-gray-600 rounded-full">
                  <div 
                    className="h-1 bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round(modelLoadingProgress * 100)}%` }}
                  />
                </div>
                <span>{Math.round(modelLoadingProgress * 100)}%</span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{getUserFriendlyErrorMessage(error)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feed Modal */}
      <Modal
        isOpen={isFeedModalOpen}
        onClose={() => setIsFeedModalOpen(false)}
        title="Feed"
      >
        <div className="min-h-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
          <FeedPage
            feedId="personalized"
            title=""
            description=""
            hoursBack={24}
            numCards={3}
            sortBy="karma_density"
          />
        </div>
      </Modal>

      {/* Memory Modal */}
      <Modal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        title="Memory"
      >
        <ActivityPage />
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Settings"
      >
        <SettingsPage />
      </Modal>
    </div>
  );
};