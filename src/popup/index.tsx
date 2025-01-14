import React from 'react';
import { createRoot } from 'react-dom/client';
import { TagViewer } from './components/TagViewer';
import { ChatInterface } from './components/ChatInterface';

console.log("Popup script starting...");

const container = document.getElementById('root');
console.log("Container element:", container);

if (container) {
  const root = createRoot(container);
  console.log("Root created, rendering components...");
  root.render(
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-1/2 max-w-3xl flex flex-col gap-4">
        <TagViewer />
        <ChatInterface />
      </div>
    </div>
  );
}