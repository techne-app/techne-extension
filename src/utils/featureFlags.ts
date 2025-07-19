import featureFlags from '../../feature-flags.json';
import { contextDb, SettingKeys } from '../background/contextDb';
import { logger } from './logger';

export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return featureFlags[feature];
}

export async function isPersonalizationEnabled(): Promise<boolean> {
  // First check if the feature is globally enabled via feature flags
  const featureEnabled = isFeatureEnabled('tag_personalization');
  
  if (!featureEnabled) {
    return false; // If feature is globally disabled, return false
  }
  
  // If feature is globally enabled, check user preference (default to false)
  const userEnabled = await contextDb.getSettingValue(SettingKeys.PERSONALIZATION_ENABLED, false);
  return userEnabled;
}

export async function isChatInterfaceEnabled(): Promise<boolean> {
  try {
    // First check if the feature is globally enabled via feature flags
    const featureEnabled = isFeatureEnabled('chat_interface');
    
    if (!featureEnabled) {
      return false; // If feature is globally disabled, return false
    }
    
    // If feature is globally enabled, check user preference (default to true)
    const userEnabled = await contextDb.getSettingValue(SettingKeys.CHAT_INTERFACE_ENABLED, true);
    return userEnabled;
  } catch (error) {
    logger.error('Error checking chat interface setting:', error);
    // Fall back to feature flag on error
    return isFeatureEnabled('chat_interface');
  }
}