import React, { useState, useEffect, useRef } from 'react';
import { isFeatureEnabled, isChatInterfaceEnabled } from '../../utils/featureFlags';

export interface MenuTab {
  id: string;
  label: string;
  icon: string;
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
        { id: 'search', label: 'Search', icon: '🔍', enabled: isFeatureEnabled('tag_search') },
        { id: 'activity', label: 'Activity', icon: '📖', enabled: true },
        { id: 'chat', label: 'Chat', icon: '💬', enabled: chatEnabled },
        { id: 'settings', label: 'Settings', icon: '⚙️', enabled: true }
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
                flex items-center space-x-2 px-4 py-2 rounded-full text-base font-medium
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
              <span className="text-base">{tab.icon}</span>
              <span className="hidden sm:inline text-base">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};