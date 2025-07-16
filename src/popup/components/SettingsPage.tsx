import React, { useState, useEffect } from 'react';
import { contextDb, SettingKeys } from '../../background/contextDb';

export const SettingsPage: React.FC = () => {
  const [isPersonalizationEnabled, setIsPersonalizationEnabled] = useState<boolean>(false);
  const [isChatInterfaceEnabled, setIsChatInterfaceEnabled] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load current settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const personalizationEnabled = await contextDb.getSettingValue(
          SettingKeys.PERSONALIZATION_ENABLED, 
          false
        );
        const chatInterfaceEnabled = await contextDb.getSettingValue(
          SettingKeys.CHAT_INTERFACE_ENABLED, 
          false
        );
        setIsPersonalizationEnabled(personalizationEnabled);
        setIsChatInterfaceEnabled(chatInterfaceEnabled);
      } catch (error) {
        console.error('Failed to load settings:', error);
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
      console.log(`Personalization setting updated to: ${newValue}`);
    } catch (error) {
      console.error('Failed to save setting:', error);
      // Revert UI state on error
      setIsPersonalizationEnabled(!newValue);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle chat interface toggle change
  const handleChatInterfaceToggle = async () => {
    const newValue = !isChatInterfaceEnabled;
    setIsSaving(true);
    
    try {
      setIsChatInterfaceEnabled(newValue); // Update UI immediately
      await contextDb.saveSetting(SettingKeys.CHAT_INTERFACE_ENABLED, newValue);
      console.log(`Chat interface setting updated to: ${newValue}`);
    } catch (error) {
      console.error('Failed to save setting:', error);
      // Revert UI state on error
      setIsChatInterfaceEnabled(!newValue);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure your Techne extension preferences
        </p>
      </div>
      
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

          {/* Chat Interface Setting */}
          <div>
            <div className="flex items-center">
              <label htmlFor="chatInterface" className="text-sm text-gray-700 mr-3">
                Enable Chat Interface
              </label>
              
              {/* Toggle switch */}
              <button 
                onClick={handleChatInterfaceToggle}
                disabled={isSaving}
                className="relative inline-flex items-center h-6 rounded-full w-11 focus:outline-none"
                aria-pressed={isChatInterfaceEnabled}
              >
                <span 
                  className={`${
                    isChatInterfaceEnabled ? 'bg-gray-300' : 'bg-gray-300'
                  } absolute h-6 w-11 mx-auto rounded-full transition-colors duration-200 ease-in-out`}
                  style={isChatInterfaceEnabled ? { backgroundColor: '#0000ED' } : {}}
                ></span>
                <span 
                  className={`${
                    isChatInterfaceEnabled ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 rounded-full bg-white transform transition-transform duration-200 ease-in-out`}
                ></span>
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              When enabled, the chat interface will be available in the navigation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};