import React, { useState, useEffect } from 'react';
import { contextDb, SettingKeys } from '../../background/contextDb';
import { MODEL_OPTIONS } from '../../types/chat';

export const SettingsPage: React.FC = () => {
  const [isPersonalizationEnabled, setIsPersonalizationEnabled] = useState<boolean>(false);
  const [isChatInterfaceEnabled, setIsChatInterfaceEnabled] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Chat-specific settings
  const [selectedModel, setSelectedModel] = useState<string>(MODEL_OPTIONS[0].value);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [topP, setTopP] = useState<number>(0.95);
  const [maxTokens, setMaxTokens] = useState<number>(4096);

  // Load current settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [personalizationEnabled, chatInterfaceEnabled, chatModel, chatTemperature, chatTopP, chatMaxTokens] = await Promise.all([
          contextDb.getSettingValue(SettingKeys.PERSONALIZATION_ENABLED, false),
          contextDb.getSettingValue(SettingKeys.CHAT_INTERFACE_ENABLED, false),
          contextDb.getSettingValue(SettingKeys.CHAT_MODEL, MODEL_OPTIONS[0].value),
          contextDb.getSettingValue(SettingKeys.CHAT_TEMPERATURE, 0.7),
          contextDb.getSettingValue(SettingKeys.CHAT_TOP_P, 0.95),
          contextDb.getSettingValue(SettingKeys.CHAT_MAX_TOKENS, 4096)
        ]);
        
        setIsPersonalizationEnabled(personalizationEnabled);
        setIsChatInterfaceEnabled(chatInterfaceEnabled);
        setSelectedModel(chatModel);
        setTemperature(chatTemperature);
        setTopP(chatTopP);
        setMaxTokens(chatMaxTokens);
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
      
      // Notify other components about the change
      window.dispatchEvent(new CustomEvent('chatInterfaceToggled', { 
        detail: { enabled: newValue } 
      }));
    } catch (error) {
      console.error('Failed to save setting:', error);
      // Revert UI state on error
      setIsChatInterfaceEnabled(!newValue);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle chat settings changes
  const handleModelChange = async (newModel: string) => {
    setIsSaving(true);
    try {
      setSelectedModel(newModel);
      await contextDb.saveSetting(SettingKeys.CHAT_MODEL, newModel);
      console.log(`Model updated to: ${newModel}`);
    } catch (error) {
      console.error('Failed to save model:', error);
    } finally {
      setIsSaving(false);
    }
  };


  const handleTemperatureChange = async (newTemperature: number) => {
    setIsSaving(true);
    try {
      setTemperature(newTemperature);
      await contextDb.saveSetting(SettingKeys.CHAT_TEMPERATURE, newTemperature);
      console.log(`Temperature updated to: ${newTemperature}`);
    } catch (error) {
      console.error('Failed to save temperature:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTopPChange = async (newTopP: number) => {
    setIsSaving(true);
    try {
      setTopP(newTopP);
      await contextDb.saveSetting(SettingKeys.CHAT_TOP_P, newTopP);
      console.log(`Top P updated to: ${newTopP}`);
    } catch (error) {
      console.error('Failed to save top P:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMaxTokensChange = async (newMaxTokens: number) => {
    setIsSaving(true);
    try {
      setMaxTokens(newMaxTokens);
      await contextDb.saveSetting(SettingKeys.CHAT_MAX_TOKENS, newMaxTokens);
      console.log(`Max tokens updated to: ${newMaxTokens}`);
    } catch (error) {
      console.error('Failed to save max tokens:', error);
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

          {/* Chat Settings - only show when chat interface is enabled */}
          {isChatInterfaceEnabled && (
            <div className="ml-4 pl-4 border-l-2 border-gray-200 space-y-6">
              <h3 className="text-md font-medium text-gray-700">Chat Settings</h3>
              
              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  disabled={isSaving}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MODEL_OPTIONS.map(model => (
                    <option key={model.id} value={model.value}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the AI model to use for chat conversations.
                </p>
              </div>
              
              {/* Temperature Setting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
                  disabled={isSaving}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Controls randomness. Lower values make responses more focused and deterministic.
                </p>
              </div>

              {/* Top P Setting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Top P: {topP}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={topP}
                  onChange={(e) => handleTopPChange(parseFloat(e.target.value))}
                  disabled={isSaving}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Controls diversity via nucleus sampling. Lower values make responses more focused.
                </p>
              </div>

              {/* Max Tokens Setting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens: {maxTokens}
                </label>
                <input
                  type="range"
                  min="256"
                  max="8192"
                  step="256"
                  value={maxTokens}
                  onChange={(e) => handleMaxTokensChange(parseInt(e.target.value))}
                  disabled={isSaving}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum number of tokens to generate in the response.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};