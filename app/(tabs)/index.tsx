import { StyleSheet } from 'react-native';
import MapView from 'react-native-maps';
import { useEffect, useState } from 'react';
import GetLocation from 'react-native-get-location';

import { View } from '@/components/Themed';

export default function HomeScreen() {
  const [latitude, setLatitude] = useState(37.78825);
  const [longitude, setLongitude] = useState(-122.4324);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 60000,
    })
    .then(location => {
      setLatitude(location.latitude);
      setLongitude(location.longitude);
      console.log(`Latitude: ${location.latitude}, Longitude: ${location.longitude}`);
      setLoading(false);
    })
    .catch(error => {
      const { code, message } = error;
      console.warn(code, message);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
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
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  }
},);