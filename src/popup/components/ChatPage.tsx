import React from 'react';
import { ChatInterface } from './ChatInterface';

export const ChatPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Chat</h2>
        <p className="text-sm text-gray-600 mt-1">
          Ask questions about Hacker News content
        </p>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <ChatInterface />
      </div>
    </div>
  );
};