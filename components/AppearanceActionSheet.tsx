/**
 * AppearanceActionSheet Component
 * 
 * A reusable ActionSheet component for theme selection (Light, Dark, System).
 * Uses ActionSheet with FlatList for theme options and handles persistence.
 * 
 * @author Rongbin Gu (@rongbin99)
 */

// ========================================
// IMPORTS
// ========================================
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Text, Alert } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import ActionSheet, { SheetManager } from 'react-native-actions-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { COLORS, TYPOGRAPHY, SPACING, ICON_SIZES } from '@/constants/DesignTokens';

// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

const TAG = "[AppearanceActionSheet]";
const THEME_STORAGE_KEY = '@planit_theme_preference';
const SHEET_ID = 'appearance-theme-sheet';

// ========================================
// TYPE DEFINITIONS
// ========================================

type ThemeOption = 'light' | 'dark' | 'system';

interface ThemeData {
    id: ThemeOption;
    name: string;
    description: string;
    icon: string;
}

interface AppearanceActionSheetProps {
    onThemeChange?: (theme: ThemeOption) => void;
}

// ========================================
// THEME OPTIONS DATA
// ========================================

const THEME_OPTIONS: ThemeData[] = [
    {
        id: 'light',
        name: 'Light',
        description: 'Always use light theme',
        icon: 'white-balance-sunny',
    },
    {
        id: 'dark',
        name: 'Dark',
        description: 'Always use dark theme',
        icon: 'moon-waning-crescent',
    },
    {
        id: 'system',
        name: 'System',
        description: 'Follow system preference',
        icon: 'cellphone-cog',
    },
];

// ========================================
// STATIC METHODS
// ========================================

/**
 * Shows the appearance ActionSheet
 */
export const showAppearanceSheet = () => {
    console.log(TAG, 'Showing appearance ActionSheet');
    SheetManager.show(SHEET_ID);
};

/**
 * Hides the appearance ActionSheet
 */
export const hideAppearanceSheet = () => {
    console.log(TAG, 'Hiding appearance ActionSheet');
    SheetManager.hide(SHEET_ID);
};

// ========================================
// MAIN COMPONENT
// ========================================

export default function AppearanceActionSheet({ onThemeChange }: AppearanceActionSheetProps) {
    console.log(TAG, 'AppearanceActionSheet component initialized');

    // ========================================
    // STATE MANAGEMENT
    // ========================================
    
    const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('system');

    // ========================================
    // EFFECTS
    // ========================================

    useEffect(() => {
        loadThemePreference();
    }, []);

    // ========================================
    // DATA MANAGEMENT
    // ========================================

    /**
     * Loads the saved theme preference from AsyncStorage
     */
    const loadThemePreference = async (): Promise<void> => {
        try {
            console.log(TAG, 'Loading theme preference from AsyncStorage');
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            
            if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
                setSelectedTheme(savedTheme as ThemeOption);
                console.log(TAG, 'Theme preference loaded:', savedTheme);
            } else {
                console.log(TAG, 'No saved theme preference, using default: system');
                setSelectedTheme('system');
            }
        } catch (error) {
            console.error(TAG, 'Error loading theme preference:', error);
        }
    };

    /**
     * Saves the theme preference to AsyncStorage
     */
    const saveThemePreference = async (theme: ThemeOption): Promise<void> => {
        try {
            console.log(TAG, 'Saving theme preference:', theme);
            await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
            setSelectedTheme(theme);
            console.log(TAG, 'Theme preference saved successfully');
        } catch (error) {
            console.error(TAG, 'Error saving theme preference:', error);
            Alert.alert('Error', 'Failed to save theme preference. Please try again.');
        }
    };

    // ========================================
    // EVENT HANDLERS
    // ========================================

    /**
     * Handles theme selection from ActionSheet
     */
    const handleThemeSelection = async (theme: ThemeOption) => {
        console.log(TAG, 'Theme selected:', theme);
        
        await saveThemePreference(theme);
        
        // Close the action sheet
        hideAppearanceSheet();
        
        // Notify parent component
        onThemeChange?.(theme);
    };

    /**
     * Renders individual theme option in the FlatList
     */
    const renderThemeOption = ({ item }: { item: ThemeData }) => (
        <TouchableOpacity
            style={[
                styles.themeOptionItem,
                selectedTheme === item.id && styles.themeOptionSelected
            ]}
            onPress={() => handleThemeSelection(item.id)}
            accessibilityLabel={`Select ${item.name} theme`}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedTheme === item.id }}
        >
            <View style={styles.themeOptionContent}>
                <MaterialCommunityIcons
                    name={item.icon as any}
                    size={ICON_SIZES.xl}
                    color={selectedTheme === item.id ? COLORS.primary : COLORS.lightText}
                    style={styles.themeIcon}
                />
                <View style={styles.themeTextContainer}>
                    <Text style={[
                        styles.themeOptionTitle,
                        selectedTheme === item.id && styles.themeOptionTitleSelected
                    ]}>
                        {item.name}
                    </Text>
                    <Text style={[
                        styles.themeOptionDescription,
                        selectedTheme === item.id && styles.themeOptionDescriptionSelected
                    ]}>
                        {item.description}
                    </Text>
                </View>
                {selectedTheme === item.id && (
                    <MaterialCommunityIcons
                        name="check-circle"
                        size={ICON_SIZES.xl}
                        color={COLORS.primary}
                    />
                )}
            </View>
        </TouchableOpacity>
    );

    // ========================================
    // RENDER
    // ========================================

    return (
        <ActionSheet id={SHEET_ID} gestureEnabled={true}>
            <View style={styles.actionSheetContainer}>
                <View style={styles.actionSheetHeader}>
                    <ThemedText type="title" style={styles.actionSheetTitle}>
                        Choose Theme
                    </ThemedText>
                    <ThemedText style={styles.actionSheetSubtitle}>
                        Select your preferred appearance
                    </ThemedText>
                </View>
                
                <FlatList
                    data={THEME_OPTIONS}
                    keyExtractor={(item) => item.id}
                    renderItem={renderThemeOption}
                    showsVerticalScrollIndicator={false}
                    style={styles.themeOptionsList}
                />
            </View>
        </ActionSheet>
    );
}

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
    actionSheetContainer: {
        backgroundColor: COLORS.white,
        paddingTop: SPACING.md,
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.xxl,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    actionSheetHeader: {
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    actionSheetTitle: {
        marginBottom: SPACING.xs,
    },
    actionSheetSubtitle: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.lightText,
        textAlign: 'center',
    },
    themeOptionsList: {
        maxHeight: 300,
    },
    themeOptionItem: {
        marginVertical: SPACING.xs,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    themeOptionSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.white,
    },
    themeOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    themeIcon: {
        marginRight: SPACING.md,
    },
    themeTextContainer: {
        flex: 1,
    },
    themeOptionTitle: {
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.text,
    },
    themeOptionTitleSelected: {
        color: COLORS.primary,
    },
    themeOptionDescription: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.lightText,
        marginTop: SPACING.xs,
    },
    themeOptionDescriptionSelected: {
        color: COLORS.text,
    },
}); 