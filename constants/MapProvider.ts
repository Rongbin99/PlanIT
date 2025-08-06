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
