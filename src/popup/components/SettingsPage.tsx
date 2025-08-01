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
    <div 
      className="h-full flex flex-col"
      style={{ 
        fontFamily: 'var(--font-sans)',
        backgroundColor: 'var(--dark-bg)',
        color: 'var(--text-primary)'
      }}
    >
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Personalization Setting */}
          <div>
            <div className="flex items-center">
              <label 
                htmlFor="personalization" 
                className="text-sm mr-3"
                style={{ 
                  color: 'var(--text-primary)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                Enable Personalization
              </label>
              
              {/* Toggle switch */}
              <button 
                onClick={handlePersonalizationToggle}
                disabled={isSaving}
                className="relative inline-flex items-center h-6 rounded-full w-11 focus:outline-none transition-all duration-200"
                aria-pressed={isPersonalizationEnabled}
                style={{
                  backgroundColor: isPersonalizationEnabled ? 'var(--hn-blue)' : 'var(--hn-border)'
                }}
              >
                <span 
                  className={`${
                    isPersonalizationEnabled ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 rounded-full bg-white transform transition-transform duration-200 ease-in-out shadow-sm`}
                ></span>
              </button>
            </div>
            
            <p 
              className="text-xs mt-2"
              style={{ 
                color: 'var(--text-secondary)',
                lineHeight: 'var(--line-height-relaxed)'
              }}
            >
              When enabled, the navigation will be personalized based on your browsing patterns.
            </p>
          </div>

          {/* Additional Settings Section */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--hn-border)' }}>
            <h3 
              className="text-sm font-medium mb-3"
              style={{ 
                color: 'var(--text-primary)',
                fontWeight: 'var(--font-weight-semibold)'
              }}
            >
              About Techne
            </h3>
            <p 
              className="text-xs"
              style={{ 
                color: 'var(--text-secondary)',
                lineHeight: 'var(--line-height-relaxed)'
              }}
            >
              Techne enhances your Hacker News experience with AI-powered insights and personalized content discovery. 
              All data is stored locally in your browser for privacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};