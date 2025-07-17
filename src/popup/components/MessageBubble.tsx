import React from 'react';
import { ChatMessage } from '../../types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center mb-4">
        <div className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm max-w-2xl">
          <div className="font-semibold mb-1">System Message:</div>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-2xl ${isUser ? 'order-2' : 'order-1'}`}>
        <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser ? 'bg-blue-600' : 'bg-gray-600'
          }`}>
            {isUser ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Message content */}
          <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
            <div className="text-xs text-gray-400 mb-1">
              {isUser ? 'User Message:' : 'Techne'}
            </div>
            <div className={`inline-block px-4 py-2 rounded-lg ${
              isUser
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-100'
            }`}>
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.isStreaming && (
                <div className="mt-2 flex items-center gap-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }).format(message.timestamp)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;