/**
 * ThemeContext
 *
 * Manages theme preference state (light / dark / system) and exposes
 * the currently effective app theme.
 *
 * @author Rongbin Gu (@rongbin99)
 */

// ========================================
// IMPORTS
// ========================================
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';

// ========================================
// CONSTANTS
// ========================================
const TAG = '[ThemeContext]';
export const THEME_STORAGE_KEY = '@planit_theme_preference';
const LIGHT_THEME = 'light';
const DARK_THEME = 'dark';
const SYSTEM_THEME = 'system';
const DEFAULT_THEME_PREFERENCE = SYSTEM_THEME;
export const THEME_PREFERENCES = [LIGHT_THEME, DARK_THEME, SYSTEM_THEME] as const;
const THEME_PREFERENCE_SET: ReadonlySet<string> = new Set(THEME_PREFERENCES);

// ========================================
// TYPE DEFINITIONS
// ========================================
export type ThemePreference = typeof THEME_PREFERENCES[number];
export type EffectiveTheme = Exclude<ThemePreference, typeof SYSTEM_THEME>;

export interface ThemeContextType {
    preference: ThemePreference;
    effectiveTheme: EffectiveTheme;
    setPreference: (preference: ThemePreference) => Promise<void>;
    isLoaded: boolean;
}

interface ThemeProviderProps {
    children: ReactNode;
}

/**
 * Type guard that narrows an unknown value to a valid ThemePreference.
 */
function isThemePreference(value: unknown): value is ThemePreference {
    return typeof value === 'string' && THEME_PREFERENCE_SET.has(value);
}

/**
 * Normalizes React Native's ColorSchemeName to an app EffectiveTheme.
 * Unknown values default to light mode.
 */
function normalizeSystemScheme(systemScheme: ColorSchemeName): EffectiveTheme {
    return systemScheme === DARK_THEME ? DARK_THEME : LIGHT_THEME;
}

/**
 * Resolves the preference and system theme to either 'light' or 'dark'.
 */
function resolveEffectiveTheme(preference: ThemePreference, systemScheme: ColorSchemeName): EffectiveTheme {
    return preference === SYSTEM_THEME ? normalizeSystemScheme(systemScheme) : preference;
}

// ========================================
// CONTEXT CREATION
// ========================================
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ========================================
// PROVIDER COMPONENT
// ========================================
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    // ========================================
    // STATE MANAGEMENT
    // ========================================
    const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_THEME_PREFERENCE);
    const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());
    const [isLoaded, setIsLoaded] = useState(false);

    // ========================================
    // INITIALIZATION
    // ========================================
    /**
     * Load persisted theme preference from AsyncStorage.
     */
    useEffect(() => {
        (async () => {
            try {
                console.log(TAG, 'Loading theme preference');
                const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (isThemePreference(stored)) {
                    console.log(TAG, 'Loaded preference:', stored);
                    setPreferenceState(stored);
                } else {
                    console.log(TAG, 'No stored preference, defaulting to', DEFAULT_THEME_PREFERENCE);
                }
            } catch (error) {
                console.error(TAG, 'Failed to load preference:', error);
            } finally {
                setIsLoaded(true);
            }
        })();
    }, []);

    /**
     * Subscribe to system color scheme changes.
     */
    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            console.log(TAG, 'System scheme changed:', colorScheme);
            setSystemScheme(colorScheme);
        });
        return () => subscription.remove();
    }, []);

    // ========================================
    // CONTEXT METHODS
    // ========================================
    /**
     * Update and persist the user's theme preference.
     */
    const setPreference = useCallback(async (next: ThemePreference) => {
        console.log(TAG, 'Setting preference:', next);
        setPreferenceState(next);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, next);
        } catch (error) {
            console.error(TAG, 'Failed to persist preference:', error);
        }
    }, []);

    // ========================================
    // COMPUTED VALUES
    // ========================================
    const effectiveTheme = useMemo(
        () => resolveEffectiveTheme(preference, systemScheme),
        [preference, systemScheme],
    );

    // ========================================
    // CONTEXT VALUE
    // ========================================
    const contextValue = useMemo<ThemeContextType>(
        () => ({ preference, effectiveTheme, setPreference, isLoaded }),
        [preference, effectiveTheme, setPreference, isLoaded],
    );

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};

// ========================================
// CUSTOM HOOKS
// ========================================
/**
 * Read/write the user's theme preference from any component wrapped in <ThemeProvider>.
 */
export const useAppTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useAppTheme must be used within a ThemeProvider');
    }
    return context;
};

/**
 * Returns the currently effective theme ('light' | 'dark').
 * Safe to call outside the provider — falls back to the system scheme.
 */
export const useEffectiveTheme = (): EffectiveTheme => {
    const context = useContext(ThemeContext);
    if (context) return context.effectiveTheme;
    return normalizeSystemScheme(Appearance.getColorScheme());
};

export default ThemeContext;
