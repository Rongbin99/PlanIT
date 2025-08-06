import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { Circle, CircleCheckBig } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ICON_SIZES, SHADOWS } from '@/constants/DesignTokens';
import { getMapProvider, setMapProvider, MAP_PROVIDER_OPTIONS, MapProviderType } from '@/constants/MapProvider';

export interface MapsProviderActionSheetRef {
  show: () => void;
  hide: () => void;
}

interface MapsProviderActionSheetProps {
  onChange?: (provider: MapProviderType) => void;
}

const TAG = '[MapsProviderActionSheet]';

const MapsProviderActionSheet = forwardRef<MapsProviderActionSheetRef, MapsProviderActionSheetProps>(
  ({ onChange }, ref) => {
    // console log platform on mount
    useEffect(() => {
      console.log(TAG, 'Mounted on platform:', Platform.OS);
    }, []);

    // Fail safe
    if (Platform.OS !== 'ios') return null;

    const [visible, setVisible] = useState(false);
    const [selected, setSelected] = useState<MapProviderType>('apple');
    const snapPoints = ['40%'];
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

    const renderOption = ({ item }: { item: typeof MAP_PROVIDER_OPTIONS[0] }) => (
      <TouchableOpacity
        style={[
          styles.highlightButton,
          selected === item.value && styles.highlightButtonSelected,
        ]}
        onPress={() => handleSelect(item.value as MapProviderType)}
        accessibilityLabel={`Select ${item.label}`}
        accessibilityRole="button"
        accessibilityState={{ selected: selected === item.value }}
      >
        {selected === item.value ? (
          <CircleCheckBig
            size={ICON_SIZES.lg}
            color={COLORS.primary}
            style={{ marginRight: 8 }}
          />
        ) : (
          <Circle
            size={ICON_SIZES.lg}
            color={COLORS.lightText}
            style={{ marginRight: 8 }}
          />
        )}
        <Text style={[
          styles.highlightButtonText,
          selected === item.value && styles.highlightButtonTextSelected,
        ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );

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
          <Text style={styles.sheetTitle}>Select Maps Provider</Text>
          <FlashList
            data={MAP_PROVIDER_OPTIONS}
            renderItem={renderOption}
            keyExtractor={item => item.value}
          />
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
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
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
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
});

export default MapsProviderActionSheet;
