/**
 * AppearanceActionSheet Component
 *
 * A reusable ActionSheet component for theme selection (Light, Dark, System).
 * Reads and writes the user's preference via `ThemeContext` so the change is
 * applied app-wide immediately.
 *
 * @author Rongbin Gu (@rongbin99)
 */

// ========================================
// IMPORTS
// ========================================
import React, { useState, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react';
import { TouchableOpacity, StyleSheet, View, Platform } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { CircleCheckBig, SunMedium, Moon, SunMoon } from 'lucide-react-native';
import { ThemedText } from '@/components/ThemedText';
import { COLORS, TYPOGRAPHY, SPACING, ICON_SIZES, SHADOWS } from '@/constants/DesignTokens';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAppTheme, ThemePreference } from '@/contexts/ThemeContext';

// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

const TAG = "[AppearanceActionSheet]";
const SNAP_POINTS = Platform.OS === 'ios' ? ['50%'] : ['40%'];

// ========================================
// TYPE DEFINITIONS
// ========================================

interface ThemeData {
    id: ThemePreference;
    name: string;
    description: string;
}

interface AppearanceActionSheetProps {
    onThemeChange?: (theme: ThemePreference) => void;
}

export interface AppearanceActionSheetRef {
    show: () => void;
    hide: () => void;
}

// ========================================
// THEME OPTIONS DATA
// ========================================

const THEME_OPTIONS: ThemeData[] = [
    { id: 'light', name: 'Light', description: 'Always use light theme' },
    { id: 'dark', name: 'Dark', description: 'Always use dark theme' },
    { id: 'system', name: 'System', description: 'Follow system preference' },
];

// ========================================
// MAIN COMPONENT
// ========================================

const AppearanceActionSheet = forwardRef<AppearanceActionSheetRef, AppearanceActionSheetProps>(
    ({ onThemeChange }, ref) => {
        // ========================================
        // HOOKS & CONTEXT
        // ========================================

        const { preference, setPreference } = useAppTheme();

        // Theme-aware colors
        const sheetBg = useThemeColor('card');
        const borderColor = useThemeColor('divider');
        const mutedText = useThemeColor('mutedText');
        const textColor = useThemeColor('text');

        // ========================================
        // STATE MANAGEMENT
        // ========================================

        const [visible, setVisible] = useState(false);
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
                bottomSheetRef.current?.snapToIndex(0);
            } else {
                console.log(TAG, 'Sheet hidden');
                bottomSheetRef.current?.close();
            }
        }, [visible]);

        // ========================================
        // EVENT HANDLERS
        // ========================================

        const handleThemeSelection = async (theme: ThemePreference) => {
            console.log(TAG, 'Theme selected:', theme);
            await setPreference(theme);
            setVisible(false);
            onThemeChange?.(theme);
        };

        // ========================================
        // RENDER HELPERS
        // ========================================

        const renderBackdrop = (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        );

        const renderIcon = (id: ThemePreference, selected: boolean) => {
            const color = selected ? COLORS.primary : mutedText;
            if (id === 'light') return <SunMedium size={ICON_SIZES.xl} color={color} style={styles.themeIcon} />;
            if (id === 'dark') return <Moon size={ICON_SIZES.xl} color={color} style={styles.themeIcon} />;
            return <SunMoon size={ICON_SIZES.xl} color={color} style={styles.themeIcon} />;
        };

        const dynamicOptionStyle = useMemo(
            () => ({ backgroundColor: sheetBg, borderColor }),
            [sheetBg, borderColor],
        );

        // ========================================
        // RENDER
        // ========================================

        return (
            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={SNAP_POINTS}
                enableDynamicSizing={false}
                enablePanDownToClose={true}
                backdropComponent={renderBackdrop}
                onClose={() => setVisible(false)}
                handleIndicatorStyle={[styles.sheetIndicator, { backgroundColor: borderColor }]}
                backgroundStyle={[styles.sheetBackground, { backgroundColor: sheetBg }]}
                style={{ zIndex: 1000 }}
            >
                <BottomSheetView style={styles.sheetContent}>
                    <ThemedText style={styles.sheetTitle}>Select Theme</ThemedText>
                    <View>
                        {THEME_OPTIONS.map((item) => {
                            const isSelected = preference === item.id;
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.highlightButton,
                                        dynamicOptionStyle,
                                        isSelected && styles.highlightButtonSelected,
                                    ]}
                                    onPress={() => handleThemeSelection(item.id)}
                                    accessibilityLabel={`Select ${item.name} theme`}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: isSelected }}
                                >
                                    <View style={styles.themeOptionHeader}>
                                        {renderIcon(item.id, isSelected)}
                                        <View style={styles.themeTextContainer}>
                                            <ThemedText
                                                style={[
                                                    styles.highlightButtonText,
                                                    { color: isSelected ? COLORS.primary : textColor },
                                                ]}
                                            >
                                                {item.name}
                                            </ThemedText>
                                            <ThemedText style={[styles.themeOptionDescription, { color: mutedText }]}>
                                                {item.description}
                                            </ThemedText>
                                        </View>
                                    </View>
                                    {isSelected && (
                                        <CircleCheckBig
                                            size={ICON_SIZES.xl}
                                            color={COLORS.primary}
                                            style={{ marginRight: SPACING.md }}
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </BottomSheetView>
            </BottomSheet>
        );
    }
);

AppearanceActionSheet.displayName = 'AppearanceActionSheet';

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
    sheetBackground: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        ...SHADOWS.card,
    },
    sheetIndicator: {
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
        marginBottom: SPACING.lg,
        textAlign: 'center',
    },
    highlightButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 72,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: SPACING.md,
        ...SHADOWS.button,
    },
    highlightButtonSelected: {
        borderColor: COLORS.primary,
        borderWidth: 2,
    },
    highlightButtonText: {
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    themeOptionHeader: {
        flex: 1,
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
        marginTop: SPACING.xs,
    },
});

export default AppearanceActionSheet;
