import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MapProviderType = 'apple' | 'google';

export const MAP_PROVIDER_OPTIONS = [
  { label: 'Apple Maps', value: 'apple' },
  { label: 'Google Maps', value: 'google' },
];

const STORAGE_KEY = 'MAP_PROVIDER_PREFERENCE';

export async function getMapProvider(): Promise<MapProviderType> {
  if (Platform.OS === 'android') return 'google';
  // iOS: check AsyncStorage
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored === 'google' || stored === 'apple') return stored;
  return 'apple';
}

export async function setMapProvider(provider: MapProviderType): Promise<void> {
  if (Platform.OS === 'android') return; // no-op
  await AsyncStorage.setItem(STORAGE_KEY, provider);
}

/**
 * Returns the default map provider per platform.
 */
export function getDefaultMapProvider(platformOS: string = Platform.OS): MapProviderType {
  return platformOS === 'android' ? 'google' : 'apple';
}

/**
 * Whether Google Maps dark style should be applied.
 */
export function shouldUseDarkGoogleMap(
  provider: MapProviderType,
  effectiveTheme: 'light' | 'dark'
): boolean {
  return provider === 'google' && effectiveTheme === 'dark';
}

export const SNAP_POINTS = ['40%']; // for iOS only: 40%
