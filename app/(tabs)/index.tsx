// Library imports
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MapView from '@teovilla/react-native-web-maps';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

// Component imports

// Initialize global variables and constants
const lat_delta = 0.015;
const long_delta = 0.012;
const PLACEHOLDER_OPTIONS = [
    'Thinking of your next trip?',
    'Where shall you visit next?',
    "What's for dinner?",
];

export default function HomeScreen() {
    const glowAnim = useRef(new Animated.Value(0)).current;
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [displayedPlaceholder, setDisplayedPlaceholder] = useState(PLACEHOLDER_OPTIONS[0]);
    const placeholderAnim = useRef(new Animated.Value(0)).current;
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 8000,
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 8000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [glowAnim]);

    useEffect(() => {
        const interval = setInterval(() => {
            // Animate out (cube out)
            Animated.timing(placeholderAnim, {
                toValue: -30,
                duration: 250,
                useNativeDriver: true,
            }).start(() => {
                // Change placeholder
                setPlaceholderIndex((prev) => {
                    const next = (prev + 1) % PLACEHOLDER_OPTIONS.length;
                    setDisplayedPlaceholder(PLACEHOLDER_OPTIONS[next]);
                    return next;
                });
                // Animate in (cube in)
                placeholderAnim.setValue(30);
                Animated.timing(placeholderAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }).start();
            });
        }, 7000); // Changes every 7 seconds
        return () => clearInterval(interval);
    }, []);

    const glowStyle = {
        borderWidth: 3,
        borderColor: glowAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: ['#87CEEB', '#9370DB', '#8A2BE2'],
        }),
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Animated.View style={[styles.searchInputContainer, glowStyle]}>
                    <View style={styles.searchRow}>
                        <View style={{ flex: 1, position: 'relative', justifyContent: 'center' }}>
                            <TextInput
                                style={[styles.searchInput, { position: 'absolute', width: '100%' }]}
                                value={inputValue}
                                onChangeText={setInputValue}
                                placeholder=" "
                                placeholderTextColor="#666"
                            />
                            {inputValue.length === 0 && (
                                <Animated.Text
                                    style={[
                                        styles.animatedPlaceholder,
                                        {
                                            transform: [{ translateY: placeholderAnim }],
                                            opacity: placeholderAnim.interpolate({
                                                inputRange: [-30, 0, 30],
                                                outputRange: [0, 1, 0],
                                            }),
                                        },
                                    ]}
                                    pointerEvents="none"
                                >
                                    {displayedPlaceholder}
                                </Animated.Text>
                            )}
                        </View>
                        <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
                            <MaterialCommunityIcons name="cog-outline" size={28} color="#888" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
                            <MaterialCommunityIcons name="airplane" size={32} color="#4B6CB7" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
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
    searchContainer: {
        position: 'absolute',
        top: 50,
        left: 50,
        right: 50,
        zIndex: 1,
    },
    searchInputContainer: {
        backgroundColor: 'white',
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginEnd: 10,
    },
    iconButton: {
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    searchInput: {
        flex: 1,
        paddingHorizontal: 25,
        paddingVertical: 15,
        fontSize: 16,
        backgroundColor: 'transparent',
    },
    animatedPlaceholder: {
        position: 'absolute',
        left: 25,
        right: 0,
        color: '#666',
        fontSize: 16,
        top: -10,
    },
});
