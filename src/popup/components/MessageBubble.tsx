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
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Label */}
          <div className="text-xs text-gray-400 mb-1 px-1">
            {isUser ? 'You:' : 'Techne:'}
          </div>
          
          {/* Message content */}
          <div className={`inline-block px-4 py-2 rounded-lg ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-100'
          }`}>
            <div className="whitespace-pre-wrap">{message.content}</div>
            {message.isStreaming && !message.content && (
              <div className="mt-2 flex items-center gap-1">
                <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500 mt-1 px-1">
            {new Intl.DateTimeFormat('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }).format(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;