import featureFlags from '../../feature-flags.json'; // Adjust the path as necessary

export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return featureFlags[feature];
}