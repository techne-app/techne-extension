import featureFlags from '../../feature-flags.json';
import { contextDb, SettingKeys } from '../background/contextDb';

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