// Library imports
import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView from '@teovilla/react-native-web-maps';

// Component imports
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Initialize global variables and constants
const lat_delta = 0.015;
const long_delta = 0.012;

export default function HomeScreen() {
    return (
        <View style={styles.container}>
            <MapView
                provider="google"
                style={styles.map}
                initialRegion={{
                    latitude: 37.78825,
                    longitude: -122.4324,
                    latitudeDelta: lat_delta,
                    longitudeDelta: long_delta,
                }}
                googleMapsApiKey={process.env.GOOGLE_MAPS_API_KEY}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: '100%',
        width: '100%',
    },
    map: {
        flex: 1,
    },
});
