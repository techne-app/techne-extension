import React from 'react';
import { createRoot } from 'react-dom/client';
import { TagViewer } from './components/TagViewer';
import { ChatInterface } from './components/ChatInterface';
import { isFeatureEnabled } from '../utils/featureFlags';

console.log("Popup script starting...");

const container = document.getElementById('root');
console.log("Container element:", container);

if (container) {
  const root = createRoot(container);
  console.log("Root created, rendering components...");
  root.render(
    <div className="min-h-screen flex items-stretch">
      <div className="w-1/2 p-4 border-r">
        <TagViewer />
      </div>
      <div className="w-1/2 p-4">
        {isFeatureEnabled('personalize') && <ChatInterface />}
      </div>
    </div>
  );
}