import { EffectiveTheme, useEffectiveTheme } from '@/contexts/ThemeContext';

/**
 * Returns the currently-active color scheme, respecting the user's in-app
 * theme preference managed by ThemeContext. Falls back to the system
 * appearance when the provider is not mounted.
 */
export function useColorScheme(): EffectiveTheme {
    return useEffectiveTheme();
}
