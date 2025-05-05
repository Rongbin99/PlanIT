// Import necessary libraries and components
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Platform, Text } from 'react-native';
import { AppleMaps, GoogleMaps, CameraPosition, Coordinates } from 'expo-maps';
import * as Location from 'expo-location';

// Initialize global variables and constants
let lat_delta = 0.0922;
let long_delta = 0.0421;

// Determine the MapView Component based on the platform
const NativeMap: React.FC<{
    latitude: number;
    longitude: number;
  }> = ({ latitude, longitude }) => {
    const coords: Coordinates = { latitude, longitude };
    const cameraPosition: CameraPosition = {
      coordinates: coords,
      zoom: 13,
    };
  
    // Pick MapView based on mobile platform
    const MapView = Platform.OS === 'ios' ? AppleMaps.View : GoogleMaps.View;
  
    return (
      <MapView
        style={styles.map}
        cameraPosition={cameraPosition}
        markers={[{ coordinates: coords }]}
      />
    );
  };

// Main HomeScreen Map component
export default function HomeScreen() {
    const [latitude, setLatitude] = useState(37.78825);
    const [longitude, setLongitude] = useState(-122.4324);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                // Request permission
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permission to access location was denied');
                    return;
                }

                // Get current position
                let current_location = await Location.getCurrentPositionAsync({});
                setLatitude(current_location.coords.latitude);
                setLongitude(current_location.coords.longitude);
            } catch (error: any) {
                setErrorMsg(error.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading map…</Text>
            </View>
        );
    }
    if (errorMsg) {
        return (
            <View style={styles.container}>
                <Text>{errorMsg}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <NativeMap
                latitude={latitude}
                longitude={longitude}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
});
