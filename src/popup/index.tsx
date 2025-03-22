import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThreadHistory } from './components/ThreadHistory';
import { ThreadSearch } from './components/ThreadSearch';
import { ChatInterface } from './components/ChatInterface';
import { SearchHistory } from './components/SearchHistory';
import { Settings } from './components/Settings';
import { isFeatureEnabled } from '../utils/featureFlags';

console.log("Popup script starting...");

const container = document.getElementById('root');
console.log("Container element:", container);

if (container) {
  const root = createRoot(container);
  console.log("Root created, rendering components...");
  root.render(
    <div className="min-h-screen flex flex-col h-full text-base">
      {/* Header with Settings */}
      <div className="flex justify-end p-2 border-b">
        <Settings />
      </div>
      
      <div className="flex flex-row flex-grow">
        <div className="w-1/2 border-r flex flex-col flex-grow">
          <div className="flex-1 border-b overflow-auto p-4">
            <ThreadHistory />
          </div>
          {isFeatureEnabled('tag_search') && (
            <div className="flex-1 overflow-auto p-4">
              <SearchHistory />
            </div>
          )}
        </div>
        <div className="w-1/2 flex flex-col flex-grow">
          {isFeatureEnabled('tag_search') && (
            <div className="flex-1 border-b p-4">
              <ThreadSearch />
            </div>
          )}
          {isFeatureEnabled('chat_interface') && (
            <div className="flex-1 p-4">
              <ChatInterface />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}