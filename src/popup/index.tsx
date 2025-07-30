import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { OverlayMenuBar } from './components/OverlayMenuBar';
import { ActivityPage } from './components/ActivityPage';
import { ChatPage } from './components/ChatPage';
import { FeedPage } from './components/FeedPage';
import { SettingsPage } from './components/SettingsPage';
import { logger } from '../utils/logger';

logger.info("Popup script starting...");

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('feed');

  // Render active page component
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'activity':
        return <ActivityPage />;
      case 'chat':
        return <ChatPage />;
      case 'feed':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
            <FeedPage
              feedId="personalized"
              title=""
              description=""
              hoursBack={24}
              numCards={5}
              sortBy="karma_density"
            />
          </div>
        );
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
      <div className="flex-1 overflow-auto">
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