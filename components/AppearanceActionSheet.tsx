/**
 * AppearanceActionSheet Component
 * 
 * A reusable ActionSheet component for theme selection (Light, Dark, System).
 * Uses BottomSheet with FlashList for theme options and handles persistence.
 * 
 * @author Rongbin Gu (@rongbin99)
 */

// ========================================
// IMPORTS
// ========================================
import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { CircleCheckBig, SunMedium, Moon, SunMoon } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, TYPOGRAPHY, SPACING, ICON_SIZES, SHADOWS } from '@/constants/DesignTokens';
import { SNAP_POINTS } from '@/constants/MapProvider';

// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

const TAG = "[AppearanceActionSheet]";
const THEME_STORAGE_KEY = '@planit_theme_preference';

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

export interface AppearanceActionSheetRef {
    show: () => void;
    hide: () => void;
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
// MAIN COMPONENT
// ========================================

const AppearanceActionSheet = forwardRef<AppearanceActionSheetRef, AppearanceActionSheetProps>(
    ({ onThemeChange }, ref) => {
        console.log(TAG, 'AppearanceActionSheet component initialized');

        // ========================================
        // STATE MANAGEMENT
        // ========================================
        
        const [visible, setVisible] = useState(false);
        const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('system');
        const snapPoints = SNAP_POINTS;
        const bottomSheetRef = React.useRef<BottomSheet>(null);

        useImperativeHandle(ref, () => ({
            show: () => {
                console.log(TAG, 'show() called');
                setVisible(true);
            },
            hide: () => {
                console.log(TAG, 'hide() called');
                setVisible(false);
            },
        }));

        useEffect(() => {
            if (visible) {
                console.log(TAG, 'Sheet visible');
                loadThemePreference();
                bottomSheetRef.current?.snapToIndex(0);
            } else {
                console.log(TAG, 'Sheet hidden');
                bottomSheetRef.current?.close();
            }
        }, [visible]);

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
            setVisible(false);
            
            // Notify parent component
            onThemeChange?.(theme);
        };

        // ========================================
        // RENDER FUNCTIONS
        // ========================================

        const renderBackdrop = (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        );

        const renderThemeOption = ({ item }: { item: ThemeData }) => (
            <TouchableOpacity
                style={[
                    styles.highlightButton,
                    selectedTheme === item.id && styles.highlightButtonSelected,
                ]}
                onPress={() => handleThemeSelection(item.id)}
                accessibilityLabel={`Select ${item.name} theme`}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedTheme === item.id }}
            >
                <View style={styles.themeOptionContent}>
                    <View style={styles.themeOptionHeader}>
                        {item.id === 'light' ? (
                            <SunMedium
                                size={ICON_SIZES.xl}
                                color={selectedTheme === item.id ? COLORS.primary : COLORS.lightText}
                                style={styles.themeIcon}
                            />
                        ) : item.id === 'dark' ? (
                            <Moon
                                size={ICON_SIZES.xl}
                                color={selectedTheme === item.id ? COLORS.primary : COLORS.lightText}
                                style={styles.themeIcon}
                            />
                        ) : (
                            <SunMoon
                                size={ICON_SIZES.xl}
                                color={selectedTheme === item.id ? COLORS.primary : COLORS.lightText}
                                style={styles.themeIcon}
                            />
                        )}
                        <View style={styles.themeTextContainer}>
                            <Text style={[
                                styles.highlightButtonText,
                                selectedTheme === item.id && styles.highlightButtonTextSelected,
                            ]}>
                                {item.name}
                            </Text>
                            <Text style={styles.themeOptionDescription}>
                                {item.description}
                            </Text>
                        </View>
                    </View>
                </View>
                {selectedTheme === item.id && (
                    <CircleCheckBig
                        size={ICON_SIZES.xl}
                        color={COLORS.primary}
                        style={{ marginRight: 12 }}
                    />
                )}
            </TouchableOpacity>
        );

        // ========================================
        // RENDER
        // ========================================

        return (
            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose={true}
                backdropComponent={renderBackdrop}
                onClose={() => setVisible(false)}
                handleIndicatorStyle={styles.sheetIndicator}
                backgroundStyle={styles.sheetBackground}
                style={{ zIndex: 1000 }}
            >
                <BottomSheetView style={styles.sheetContent}>
                    <Text style={styles.sheetTitle}>Select Theme</Text>
                    <FlashList
                        data={THEME_OPTIONS}
                        renderItem={renderThemeOption}
                        keyExtractor={item => item.id}
                    />
                </BottomSheetView>
            </BottomSheet>
        );
    }
);

// ========================================
// STATIC METHODS
// ========================================

/**
 * Shows the appearance ActionSheet
 */
export const showAppearanceSheet = () => {
    console.log(TAG, 'Showing appearance ActionSheet');
    // This will be handled by the ref in the parent component
};

/**
 * Hides the appearance ActionSheet
 */
export const hideAppearanceSheet = () => {
    console.log(TAG, 'Hiding appearance ActionSheet');
    // This will be handled by the ref in the parent component
};

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
    sheetBackground: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        ...SHADOWS.card,
    },
    sheetIndicator: {
        backgroundColor: COLORS.border,
        width: 40,
        height: 4,
    },
    sheetContent: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.lg,
    },
    sheetTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
        marginBottom: SPACING.lg,
        textAlign: 'center',
    },
    highlightButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 72,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
        marginBottom: SPACING.md,
        ...SHADOWS.button,
    },
    highlightButtonSelected: {
        borderColor: COLORS.primary,
        borderWidth: 2,
    },
    highlightButtonText: {
        color: COLORS.text,
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    highlightButtonTextSelected: {
        color: COLORS.primary,
    },
    themeOptionContent: {
        flex: 1,
    },
    themeOptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.xs,
    },
    themeIcon: {
        marginRight: SPACING.md,
    },
    themeTextContainer: {
        flex: 1,
    },
    themeOptionDescription: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.lightText,
        marginTop: SPACING.xs,
    },
});

export default AppearanceActionSheet; 
