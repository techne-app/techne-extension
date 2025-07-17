import React, { useState, useEffect, useRef } from 'react';
import { isFeatureEnabled, isChatInterfaceEnabled } from '../../utils/featureFlags';

export interface MenuTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface OverlayMenuBarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const OverlayMenuBar: React.FC<OverlayMenuBarProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [forceVisible, setForceVisible] = useState(true);
  const [tabs, setTabs] = useState<MenuTab[]>([]);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load tabs with async chat interface check
  useEffect(() => {
    const loadTabs = async () => {
      const chatEnabled = await isChatInterfaceEnabled();
      
      const menuTabs: MenuTab[] = [
        { 
          id: 'search', 
          label: 'Search', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          ), 
          enabled: isFeatureEnabled('tag_search') 
        },
        { 
          id: 'activity', 
          label: 'Activity', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ), 
          enabled: true 
        },
        { 
          id: 'chat', 
          label: 'Chat', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          ), 
          enabled: chatEnabled 
        },
        { 
          id: 'settings', 
          label: 'Settings', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ), 
          enabled: true 
        }
      ].filter(tab => tab.enabled);
      
      setTabs(menuTabs);
    };

    loadTabs();
  }, []);

  // Auto-hide functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      // Show menu when mouse is in top 40px of the window
      const isInTopArea = e.clientY < 40;
      
      if (isInTopArea) {
        setIsVisible(true);
        clearTimeout(hideTimeoutRef.current!);
      } else {
        // Clear existing timeout
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
        
        // Set new timeout to hide after 2 seconds
        hideTimeoutRef.current = setTimeout(() => {
          if (!forceVisible) {
            setIsVisible(false);
          }
        }, 2000);
      }
    };

    const handleMouseLeave = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      
      hideTimeoutRef.current = setTimeout(() => {
        if (!forceVisible) {
          setIsVisible(false);
        }
      }, 2000);
    };

    // Show tabs for first 3 seconds
    setTimeout(() => {
      setForceVisible(false);
    }, 3000);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [forceVisible]);

  // Handle tab click
  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setIsVisible(true);
    setForceVisible(true);
    
    // Reset force visible after a short delay
    setTimeout(() => {
      setForceVisible(false);
    }, 1000);
  };

  return (
    <div ref={containerRef} className="absolute top-1 left-1/2 transform -translate-x-1/2 z-50">
      <div 
        className={`
          text-white px-4 py-2 rounded-full shadow-2xl
          transition-opacity duration-1000 ease-in-out
          ${isVisible ? 'opacity-100' : 'opacity-0'}
          ${isVisible ? 'pointer-events-auto' : 'pointer-events-none'}
        `}
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(59, 130, 246, 0.1)'
        }}
      >
        <div className="flex items-center space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-full text-lg font-medium
                transition-all duration-200
                ${activeTab === tab.id 
                  ? 'text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-blue-600/30'
                }
              `}
              style={activeTab === tab.id ? { 
                background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
              } : {}}
              title={tab.label}
            >
              <span className="flex items-center justify-center">{tab.icon}</span>
              <span className="hidden sm:inline text-lg">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};