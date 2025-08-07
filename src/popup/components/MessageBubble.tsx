import React from 'react';
import ReactMarkdown from 'react-markdown';
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
          <div 
            className={`inline-block px-4 py-2 rounded-lg border ${
              isUser
                ? 'bg-blue-600 text-white border-blue-600'
                : ''
            }`}
            style={isUser ? {} : { 
              backgroundColor: '#f6f6ef', 
              borderColor: '#e0e0e0',
              color: 'var(--primary)'
            }}
          >
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0" style={{ color: 'var(--primary)' }}>
                <ReactMarkdown 
                  components={{
                    a: ({ node, ...props }) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline" style={{ color: 'var(--primary)' }} />
                    )
                  }}
                >
                  {message.content || ''}
                </ReactMarkdown>
              </div>
            )}
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