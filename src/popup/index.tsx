import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { OverlayMenuBar } from './components/OverlayMenuBar';
import { ActivityPage } from './components/ActivityPage';
import { ChatPage } from './components/ChatPage';
import { SettingsPage } from './components/SettingsPage';
import { isChatInterfaceEnabled } from '../utils/featureFlags';

console.log("Popup script starting...");

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [chatEnabled, setChatEnabled] = useState<boolean>(false);

  // Check chat interface on startup and listen for changes
  useEffect(() => {
    const checkChatInterface = async () => {
      // Check if chat interface is enabled
      const chatInterfaceEnabled = await isChatInterfaceEnabled();
      setChatEnabled(chatInterfaceEnabled);
      
      // Set default tab: chat if enabled, otherwise settings
      if (chatInterfaceEnabled) {
        setActiveTab('chat');
      } else {
        setActiveTab('settings');
      }
    };

    // Listen for chat interface toggle events
    const handleChatInterfaceToggled = (event: CustomEvent) => {
      setChatEnabled(event.detail.enabled);
    };

    checkChatInterface();
    
    // Add event listener
    window.addEventListener('chatInterfaceToggled', handleChatInterfaceToggled as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('chatInterfaceToggled', handleChatInterfaceToggled as EventListener);
    };
  }, []);

  // Render active page component
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'activity':
        return <ActivityPage />;
      case 'chat':
        return chatEnabled ? <ChatPage /> : <SettingsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <SettingsPage />;
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