import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import * as Location from 'expo-location';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';

export default function HomeScreen() {
    const [position, setPosition] = useState<LatLngExpression>([
        37.78825,
        -122.4324,
      ]);
      const [loading, setLoading] = useState(true);
      const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                // Use Polyfill to get current location
                Location.installWebGeolocationPolyfill();
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permission to access location was denied');
                    return;
                }
                // Get current position
                const current_location = await Location.getCurrentPositionAsync();
                setPosition([
                    current_location.coords.latitude,
                    current_location.coords.longitude,
                ]);
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
            <MapContainer
                center={position}
                zoom={13}
                style={styles.map}
                scrollWheelZoom
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={position} />
            </MapContainer>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: '100%', height: '100%' },
});
