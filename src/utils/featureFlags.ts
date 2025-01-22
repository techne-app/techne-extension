import featureFlags from '../../feature-flags.json'; 

export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return featureFlags[feature];
}