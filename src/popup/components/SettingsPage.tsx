import React, { useState, useEffect } from 'react';
import { contextDb, SettingKeys } from '../../background/contextDb';
import { logger } from '../../utils/logger';

export const SettingsPage: React.FC = () => {
  const [isPersonalizationEnabled, setIsPersonalizationEnabled] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load current settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const personalizationEnabled = await contextDb.getSettingValue(SettingKeys.PERSONALIZATION_ENABLED, false);
        setIsPersonalizationEnabled(personalizationEnabled);
      } catch (error) {
        logger.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Handle personalization toggle change
  const handlePersonalizationToggle = async () => {
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
    <div className="h-full flex flex-col">
      
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-6">
          {/* Personalization Setting */}
          <div>
            <div className="flex items-center">
              <label htmlFor="personalization" className="text-sm text-gray-700 mr-3">
                Enable Personalization
              </label>
              
              {/* Toggle switch */}
              <button 
                onClick={handlePersonalizationToggle}
                disabled={isSaving}
                className="relative inline-flex items-center h-6 rounded-full w-11 focus:outline-none"
                aria-pressed={isPersonalizationEnabled}
              >
                <span 
                  className={`${
                    isPersonalizationEnabled ? 'bg-gray-300' : 'bg-gray-300'
                  } absolute h-6 w-11 mx-auto rounded-full transition-colors duration-200 ease-in-out`}
                  style={isPersonalizationEnabled ? { backgroundColor: '#0000ED' } : {}}
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
      </div>
    </div>
  );
};