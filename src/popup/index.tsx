import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { OverlayMenuBar } from './components/OverlayMenuBar';
import { ActivityPage } from './components/ActivityPage';
import { ChatPage } from './components/ChatPage';
import { SettingsPage } from './components/SettingsPage';
import { logger } from '../utils/logger';

logger.info("Popup script starting...");

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('chat');

  // Render active page component
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'activity':
        return <ActivityPage />;
      case 'chat':
        return <ChatPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <ChatPage />;
    }
  };

  return (
    <div className="h-screen w-full flex flex-col relative text-base">
      {/* Overlay Menu Bar */}
      <OverlayMenuBar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderActiveTab()}
      </div>
    </div>
  );
};

const container = document.getElementById('root');
logger.debug("Container element:", container);

if (container) {
  const root = createRoot(container);
  logger.debug("Root created, rendering components...");
  root.render(<App />);
}