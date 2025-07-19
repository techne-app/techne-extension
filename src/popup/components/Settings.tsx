import React, { useState, useEffect, useRef } from 'react';
import { contextDb, SettingKeys } from '../../background/contextDb';
import { logger } from '../../utils/logger';

export const Settings: React.FC = () => {
  const [isPersonalizationEnabled, setIsPersonalizationEnabled] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Load current settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const personalizationEnabled = await contextDb.getSettingValue(
          SettingKeys.PERSONALIZATION_ENABLED, 
          false
        );
        setIsPersonalizationEnabled(personalizationEnabled);
      } catch (error) {
        logger.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Add click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && 
          settingsRef.current && 
          !settingsRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Add event listener when panel is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Toggle settings panel
  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  // Handle toggle change
  const handleToggleChange = async () => {
    const newValue = !isPersonalizationEnabled;
    setIsSaving(true);
    
    try {
      setIsPersonalizationEnabled(newValue); // Update UI immediately
      await contextDb.saveSetting(SettingKeys.PERSONALIZATION_ENABLED, newValue);
      logger.info(`Personalization setting updated to: ${newValue}`);
    } catch (error) {
      logger.error('Failed to save setting:', error);
      // Revert UI state on error
      setIsPersonalizationEnabled(!newValue);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative" ref={settingsRef}>
      {/* Settings icon button */}
      <button 
        onClick={togglePanel}
        className="p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
        title="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Settings panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 border">
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
            
            <div className="flex items-center mb-2">
              <label htmlFor="personalization" className="text-sm text-gray-700 mr-3">
                Enable Personalization
              </label>
              
              {/* Toggle switch */}
              <button 
                onClick={handleToggleChange}
                disabled={isSaving}
                className="relative inline-flex items-center h-6 rounded-full w-11 focus:outline-none"
                aria-pressed={isPersonalizationEnabled}
              >
                <span 
                  className={`${
                    isPersonalizationEnabled ? 'bg-green-500' : 'bg-gray-300'
                  } absolute h-6 w-11 mx-auto rounded-full transition-colors duration-200 ease-in-out`}
                ></span>
                <span 
                  className={`${
                    isPersonalizationEnabled ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 rounded-full bg-white transform transition-transform duration-200 ease-in-out`}
                ></span>
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              When enabled, the navigation will be personalized.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 