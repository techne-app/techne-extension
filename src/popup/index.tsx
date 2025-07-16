import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { OverlayMenuBar } from './components/OverlayMenuBar';
import { SearchPage } from './components/SearchPage';
import { ActivityPage } from './components/ActivityPage';
import { ChatPage } from './components/ChatPage';
import { SettingsPage } from './components/SettingsPage';
import { isChatInterfaceEnabled } from '../utils/featureFlags';
import { restoreSearchState } from '../utils/searchStateManager';

console.log("Popup script starting...");

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('search');
  const [chatEnabled, setChatEnabled] = useState<boolean>(false);

  // Restore last active tab on startup and check chat interface
  useEffect(() => {
    const restoreState = async () => {
      const searchState = await restoreSearchState();
      if (searchState && searchState.tab) {
        setActiveTab(searchState.tab);
      }
      
      // Check if chat interface is enabled
      const chatInterfaceEnabled = await isChatInterfaceEnabled();
      setChatEnabled(chatInterfaceEnabled);
    };

    restoreState();
  }, []);

  // Render active page component
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'search':
        return <SearchPage />;
      case 'activity':
        return <ActivityPage />;
      case 'chat':
        return chatEnabled ? <ChatPage /> : <SearchPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <SearchPage />;
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
console.log("Container element:", container);

if (container) {
  const root = createRoot(container);
  console.log("Root created, rendering components...");
  root.render(<App />);
}