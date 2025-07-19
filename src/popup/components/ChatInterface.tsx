import React, { useState, useRef, useEffect } from 'react';
import { type ChatCompletionMessageParam } from "@mlc-ai/web-llm";
import { Conversation, ChatMessage, MODEL_OPTIONS } from '../../types/chat';
import { ConversationManager } from '../../utils/conversationUtils';
import { webLLMClient } from '../../utils/webLLMClient';
import { configStore } from '../../utils/configStore';
import MessageBubble from './MessageBubble';
import { IntentDetector } from '../../utils/intentDetector';
import { SearchService } from '../../utils/searchService';


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
  const [modelLoadingText, setModelLoadingText] = useState('');
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
      console.log('🚀 Starting handleSearchRequest for:', searchQuery);
      
      // Execute search with streaming
      await SearchService.executeSearchStreaming(searchQuery, async (content) => {
        console.log('📨 Received content update:', content.substring(0, 50) + '...');
        
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
        
        console.log('💾 Database updated with content');
      });
      
      console.log('✅ SearchService.executeSearchStreaming completed');
      
      // Finalize the streaming message
      setStreamingMessage(prev => prev ? {
        ...prev,
        isStreaming: false
      } : null);
      
      console.log('🔄 Getting updated conversation...');
      
      // Get updated conversation
      const updatedConversation = await ConversationManager.getConversation(activeConversation!.id);
      if (updatedConversation) {
        onConversationUpdated(updatedConversation);
        console.log('🔄 Conversation updated in UI');
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      // Update the assistant message with error content
      const errorContent = `I encountered an error while searching for "${searchQuery}": ${error instanceof Error ? error.message : 'Unknown error'}`;
      await ConversationManager.updateMessage(
        activeConversation!.id, 
        assistantMessageId, 
        errorContent
      );
      setError('Search failed. Please try again.');
    } finally {
      console.log('🏁 handleSearchRequest finally block');
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
      console.log('🔍 Model loaded check:', isModelLoaded);
      
      if (isModelLoaded) {
        console.log('🔍 Model already loaded, checking for search intent...');
        try {
          const intentResult = await IntentDetector.detectSearchIntent(userMessage);
          console.log('🎯 Intent detection result:', intentResult);
          
          if (intentResult.isSearch && intentResult.searchQuery && intentResult.confidence > 0.5) {
            console.log('✅ Search intent detected with high confidence, executing search for:', intentResult.searchQuery);
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
            console.log('💬 No search intent detected or low confidence, continuing with chat. Confidence:', intentResult.confidence);
          }
        } catch (error) {
          console.error('Intent detection failed:', error);
        }
      } else {
        console.log('⏳ Model not loaded, will perform intent detection after loading');
      }

      // Only proceed with chat if we didn't intercept for search
      console.log('🗨️ Starting chat conversation...');

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
          setModelLoadingText(`Loading ${loadedModelName || 'AI Model'}`);
        } : undefined,
        onModelLoadingProgress: !isModelLoaded ? (progress, text) => {
          setModelLoadingProgress(progress);
          setModelLoadingText(text);
        } : undefined,
        onModelLoadingComplete: !isModelLoaded ? async () => {
          setIsModelLoading(false);
          setModelLoadingProgress(1);
          setModelLoadingText('');
          
          // Perform intent detection after model loads
          console.log('🔍 Model loading complete, now checking for search intent...');
          try {
            const intentResult = await IntentDetector.detectSearchIntent(userMessage);
            console.log('🎯 Intent detection result:', intentResult);
            
            if (intentResult.isSearch && intentResult.searchQuery && intentResult.confidence > 0.5) {
              console.log('✅ Search intent detected with high confidence, executing search for:', intentResult.searchQuery);
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
              console.log('💬 No search intent detected or low confidence, continuing with chat. Confidence:', intentResult.confidence);
            }
          } catch (error) {
            console.error('Intent detection failed:', error);
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
          console.error('WebLLM chat error:', errorMessage);
          setError(errorMessage);
          setStreamingMessage(null);
          setIsModelLoading(false);
        }
        });
      } catch (error) {
        console.error('WebLLM chat failed:', error);
        setIsModelLoading(false);
        setError('Chat failed to start');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
      console.error('Error during chat:', err);
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
      <div className="flex-shrink-0 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white truncate">
              {activeConversation.title}
            </h2>
            <p className="text-sm text-gray-400">
              {activeConversation.messages.length} messages
            </p>
          </div>
          <div></div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto">
          {/* Model loading progress message */}
          {isModelLoading && (
            <div className="flex justify-center mb-4">
              <div className="bg-gray-700 text-gray-300 px-4 py-3 rounded-lg text-sm max-w-2xl">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <div>
                    <div className="font-semibold mb-1">Loading AI Model...</div>
                    <div className="text-xs text-gray-400">
                      {modelLoadingText || `Loading ${loadedModelName || 'AI Model'}`}
                    </div>
                    <div className="w-48 h-2 bg-gray-600 rounded-full mt-2">
                      <div 
                        className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.round(modelLoadingProgress * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {Math.round(modelLoadingProgress * 100)}% complete
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
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
      <div className="flex-shrink-0 p-4 border-t border-gray-700">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="error-message text-red-400 mb-4 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={isModelLoading ? "Loading model, please wait..." : "Enter to send, Shift + Enter to wrap, / to search prompts, : to use commands"}
              disabled={isLoading || isModelLoading}
              className="flex-1 p-3 bg-gray-800 text-white rounded border border-gray-600 resize-none focus:outline-none focus:border-blue-500"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button 
              onClick={handleSubmit}
              disabled={isLoading || isModelLoading || !message.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded disabled:bg-gray-500 hover:bg-blue-700 transition-colors font-medium"
            >
              {isModelLoading ? 'Loading...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};