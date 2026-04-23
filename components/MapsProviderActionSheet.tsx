/**
 * MapsProviderActionSheet Component
 *
 * A reusable ActionSheet component for maps provider selection (Apple, Google).
 * Reads and writes the user's preference via `MapProviderContext` so the change is
 * applied app-wide immediately.
 *
 * @author Rongbin Gu (@rongbin99)
 */

// ========================================
// IMPORTS
// ========================================
import React, { useState, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react';
import { TouchableOpacity, Platform, StyleSheet, View } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { CircleCheckBig } from 'lucide-react-native';
import { ThemedText } from '@/components/ThemedText';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ICON_SIZES, SHADOWS } from '@/constants/DesignTokens';
import { getMapProvider, setMapProvider, MAP_PROVIDER_OPTIONS, MapProviderType, SNAP_POINTS } from '@/constants/MapProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

// ========================================
// TYPE DEFINITIONS
// ========================================
export interface MapsProviderActionSheetRef {
    show: () => void;
    hide: () => void;
}

interface MapsProviderActionSheetProps {
    onChange?: (provider: MapProviderType) => void;
}

// ========================================
// CONSTANTS & CONFIGURATION
// ========================================
const TAG = '[MapsProviderActionSheet]';

// ========================================
// MAIN COMPONENT
// ========================================
const MapsProviderActionSheet = forwardRef<MapsProviderActionSheetRef, MapsProviderActionSheetProps>(
    ({ onChange }, ref) => {
        useEffect(() => {
            console.log(TAG, 'Mounted on platform:', Platform.OS);
        }, []);

        // Fail safe
        if (Platform.OS !== 'ios') return null;

        // Theme-aware colors
        const sheetBg = useThemeColor('card');
        const borderColor = useThemeColor('divider');
        const mutedText = useThemeColor('mutedText');
        const textColor = useThemeColor('text');

        const [visible, setVisible] = useState(false);
        const [selected, setSelected] = useState<MapProviderType>('apple');
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
                getMapProvider().then(provider => {
                    console.log(TAG, 'Current provider:', provider);
                    setSelected(provider);
                });
                bottomSheetRef.current?.snapToIndex(0);
            } else {
                console.log(TAG, 'Sheet hidden');
                bottomSheetRef.current?.close();
            }
        }, [visible]);

        const handleSelect = async (provider: MapProviderType) => {
            console.log(TAG, 'Provider selected:', provider);
            setSelected(provider);
            await setMapProvider(provider);
            onChange?.(provider);
            setVisible(false);
        };

        const renderBackdrop = (props: any) => (
            <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
        );

        const dynamicOptionStyle = useMemo(
            () => ({ backgroundColor: sheetBg, borderColor }),
            [sheetBg, borderColor],
        );

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
                    <ThemedText style={styles.sheetTitle}>Select Maps Provider</ThemedText>
                    <View>
                        {MAP_PROVIDER_OPTIONS.map((item) => {
                            const isSelected = selected === item.value;
                            return (
                                <TouchableOpacity
                                    key={item.value}
                                    style={[
                                        styles.highlightButton,
                                        dynamicOptionStyle,
                                        isSelected && styles.highlightButtonSelected,
                                    ]}
                                    onPress={() => handleSelect(item.value as MapProviderType)}
                                    accessibilityLabel={`Select ${item.label}`}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: isSelected }}
                                >
                                    <View style={styles.providerOptionHeader}>
                                        <MaterialCommunityIcons
                                            name={item.value === 'apple' ? ('apple' as any) : ('google-maps' as any)}
                                            size={ICON_SIZES.xl}
                                            color={isSelected ? COLORS.primary : mutedText}
                                            style={styles.providerIcon}
                                        />
                                        <View style={styles.providerTextContainer}>
                                            <ThemedText
                                                style={[
                                                    styles.highlightButtonText,
                                                    { color: isSelected ? COLORS.primary : textColor },
                                                ]}
                                            >
                                                {item.label}
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

MapsProviderActionSheet.displayName = 'MapsProviderActionSheet';

const styles = StyleSheet.create({
    sheetBackground: {
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
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
        borderRadius: RADIUS.md,
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
    providerOptionHeader: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    providerIcon: {
        marginRight: SPACING.md,
    },
    providerTextContainer: {
        flex: 1,
    },
});

export default MapsProviderActionSheet;
