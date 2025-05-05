// Import necessary libraries and components
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { Region } from 'react-native-maps';
import { ClusterProps, MarkerClusterer } from '@teovilla/react-native-web-maps';
import React, { useEffect, useState } from 'react';
import * as Location from 'expo-location';

// Initialize global variables and constants
let lat_delta = 0.0922;
let long_delta = 0.0421;

// Main HomeScreen Map component
export default function Index() {
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
                console.log(`Latitude: ${current_location.coords.latitude}, Longitude: ${current_location.coords.longitude}`);
            } catch (error: any) {
                setErrorMsg(error.message);
                console.warn(error.message);
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
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: latitude,
                    longitude: longitude,
                    latitudeDelta: lat_delta,
                    longitudeDelta: long_delta,
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: '100%', height: '100%' },
});
