/**
 * HomeScreen Component
 * 
 * Main search interface with interactive dropdown filters and map view.
 * Handles user input, filter selection, and navigation to chat screen.
 * Features animated search placeholders and dropdown menu with various filter options.
 * 
 * @author Rongbin Gu (@rongbin99)
 */

// ========================================
// IMPORTS
// ========================================
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, StyleSheet, TextInput, TouchableOpacity, View, Text, ScrollView, Alert, Dimensions, ActivityIndicator, FlatList, BackHandler, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ArrowLeft, LoaderCircle, LocateFixed, LocateOff, Send } from 'lucide-react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import ActionSheet, { SheetManager } from 'react-native-actions-sheet';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ICON_SIZES, SHADOWS } from '@/constants/DesignTokens';

// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

const TAG = "[HomeScreen]";
const MAP_ANIMATION_DURATION = 1000;

// Get screen dimensions
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Map configuration
const MAP_CONFIG = {
    LAT_DELTA: 0.02,
    LONG_DELTA: 0.015,
    // Fallback to Toronto location if user location is not available
    DEFAULT_REGION: {
        latitude: 43.6532,
        longitude: -79.3832,
    },
} as const;

// UI Constants for home screen specific values
const HOME_ICON_SIZES = {
    filter: ICON_SIZES.xxl + 4, // 28 (32 + 4)
    send: ICON_SIZES.xxl,       // 32
    checkbox: ICON_SIZES.xl,    // 24
    radio: ICON_SIZES.xl,       // 24
    toggle: ICON_SIZES.xxl,     // 32
    back: 28,
} as const;

const HOME_COLORS = {
    placeholder: COLORS.lightText,
    loading: '#CCE5FF',
    subText: '#555',
} as const;

const ANIMATIONS = {
    glowDuration: 8000,
    placeholderDuration: 250,
    placeholderInterval: 7000,
    dropdownDuration: 300,
    placeholderOffset: 30,
} as const;

const HOME_SPACING = {
    searchTop: 80,
    searchHorizontal: SPACING.xl,
    borderRadius: 30,
    dropdownRadius: RADIUS.xl,
    dropdownMarginTop: SPACING.sm,
    iconPadding: SPACING.sm,
    contentPadding: SPACING.xl,
    sectionMargin: SPACING.md,
    optionPaddingVertical: SPACING.sm,
    textMarginLeft: SPACING.md,
    subSectionMarginTop: SPACING.sm,
    subSectionMarginLeft: SPACING.xl,
    subSectionPaddingLeft: SPACING.lg,
} as const;

// Layout constants
const DROPDOWN_HEIGHT_PERCENTAGE = Platform.OS === 'android' ? 0.80 : 0.70;
const DROPDOWN_HEIGHT = SCREEN_HEIGHT * DROPDOWN_HEIGHT_PERCENTAGE;
const BORDER_WIDTH = 3;

// Dynamic placeholder text options for engaging user experience
const SEARCH_PLACEHOLDER_OPTIONS = [
    'Thinking of your next trip?',
    'Where shall you visit next?',
    "Where would you like to explore?",
    "Plan your perfect weekend getaway",
    "Discover hidden gems in the city",
    "Find your next adventure",
    "Explore local attractions",
    "Create your dream adventure",
    "Search for popular destinations",
    "Find the best spots to visit",
] as const;

// Price range mapping system
const PRICE_RANGE_MAP = {
    1: '$',
    2: '$$',
    3: '$$$',
    4: '$$$+',
} as const;

const PRICE_RANGE_VALUES = [1, 2, 3, 4] as const;

// ========================================
// TYPE DEFINITIONS
// ========================================
interface TimeOfDay {
    allDay: boolean;
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
}

type Environment = 'indoor' | 'outdoor' | 'mixed';
type GroupSize = 'solo' | 'duo' | 'group';
type PriceRangeValue = 1 | 2 | 3 | 4;
type SpecialOption = 'casual' | 'adventure' | 'tourist' | 'wander' | 'date' | 'family';

interface SearchData {
    searchQuery: string;
    location?: Location.LocationObject;
    filters: {
        timeOfDay: string[];
        environment: Environment;
        planTransit: boolean;
        groupSize: GroupSize;
        planFood: boolean;
        priceRange?: PriceRangeValue;
        specialOption?: SpecialOption;
    };
    timestamp: string;
}

// ========================================
// MAIN COMPONENT
// ========================================
export default function HomeScreen() {
    // ========================================
    // STATE MANAGEMENT
    // ========================================
    
    // Animation states
    const glowAnim = useRef(new Animated.Value(0)).current;
    const placeholderAnim = useRef(new Animated.Value(0)).current;
    const dropdownAnim = useRef(new Animated.Value(0)).current;
    
    // Map reference for programmatic control
    const mapRef = useRef<MapView>(null);
    
    // UI states
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [displayedPlaceholder, setDisplayedPlaceholder] = useState<string>(SEARCH_PLACEHOLDER_OPTIONS[0]);
    const [inputValue, setInputValue] = useState("");
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    
    // Location states
    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
    const [locationPermission, setLocationPermission] = useState<Location.LocationPermissionResponse | null>(null);
    const [isLocationLoading, setIsLocationLoading] = useState(true);
    const [hasUserLocation, setHasUserLocation] = useState(false);
    const [mapRegion, setMapRegion] = useState({
        latitude: MAP_CONFIG.DEFAULT_REGION.latitude as number,
        longitude: MAP_CONFIG.DEFAULT_REGION.longitude as number,
        latitudeDelta: MAP_CONFIG.LAT_DELTA as number,
        longitudeDelta: MAP_CONFIG.LONG_DELTA as number,
    });

    // Filter states - centralized filter management
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>({
        allDay: false,
        morning: false,
        afternoon: false,
        evening: false,
    });
    const [environment, setEnvironment] = useState<Environment>('indoor');
    const [planTransit, setPlanTransit] = useState(false);
    const [groupSize, setGroupSize] = useState<GroupSize>('solo');
    const [planFood, setPlanFood] = useState(false);
    const [priceRange, setPriceRange] = useState<PriceRangeValue>(1);
    const [specialOptions, setSpecialOptions] = useState<SpecialOption[]>([]);

    // ========================================
    // EFFECTS & ANIMATIONS
    // ========================================
    
    /**
     * Continuous glow animation for search bar border
     * Creates an engaging visual effect that cycles through colors
     */
    useEffect(() => {
        console.log(TAG, 'Initializing glow animation');
        
        const startGlowAnimation = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: ANIMATIONS.glowDuration,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0,
                        duration: ANIMATIONS.glowDuration,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        startGlowAnimation();
    }, [glowAnim]);

    /**
     * Placeholder text rotation animation
     * Only animates when input is empty and not focused
     */
    useEffect(() => {
        const startPlaceholderRotation = () => {
            const interval = setInterval(() => {
                // Only animate if input is empty and not focused
                if (inputValue.length === 0 && !isSearchFocused) {
                    // Animate out (slide up)
                    Animated.timing(placeholderAnim, {
                        toValue: -ANIMATIONS.placeholderOffset,
                        duration: ANIMATIONS.placeholderDuration,
                        useNativeDriver: true,
                    }).start(() => {
                        // Update placeholder text to random option
                        setPlaceholderIndex((prev) => {
                            let next;
                            do {
                                next = Math.floor(Math.random() * SEARCH_PLACEHOLDER_OPTIONS.length);
                            } while (next === prev && SEARCH_PLACEHOLDER_OPTIONS.length > 1);
                            
                            setDisplayedPlaceholder(SEARCH_PLACEHOLDER_OPTIONS[next]);
                            console.log(TAG, 'Random placeholder selected:', SEARCH_PLACEHOLDER_OPTIONS[next]);
                            return next;
                        });
                        
                        // Animate in (slide down)
                        placeholderAnim.setValue(ANIMATIONS.placeholderOffset);
                        Animated.timing(placeholderAnim, {
                            toValue: 0,
                            duration: ANIMATIONS.placeholderDuration,
                            useNativeDriver: true,
                        }).start();
                    });
                }
            }, ANIMATIONS.placeholderInterval);

            return () => clearInterval(interval);
        };

        return startPlaceholderRotation();
    }, [inputValue, isSearchFocused, placeholderAnim, placeholderIndex]);

    /**
     * Dropdown visibility animation
     * Smooth expand/collapse animation for filter dropdown
     */
    useEffect(() => {
        console.log(TAG, 'Animating dropdown visibility:', isDropdownVisible);
        
        Animated.timing(dropdownAnim, {
            toValue: isDropdownVisible ? 1 : 0,
            duration: ANIMATIONS.dropdownDuration,
            useNativeDriver: false, // Height animation requires layout
        }).start();
    }, [isDropdownVisible, dropdownAnim]);

    /**
     * Location permission and GPS detection
     * Requests location permission and gets user's current location
     */
    useEffect(() => {
        console.log(TAG, 'Setting up location services');
        
        const setupLocation = async () => {
            try {
                setIsLocationLoading(true);
                
                // Request location permission
                console.log(TAG, 'Requesting location permission');
                const permission = await Location.requestForegroundPermissionsAsync();
                setLocationPermission(permission);
                
                if (permission.status !== 'granted') {
                    console.warn(TAG, 'Location permission denied');
                    setIsLocationLoading(false);
                    Alert.alert(
                        'Location Permission',
                        'Location access is needed to show your current position on the map. Using default location (Toronto).',
                        [{ text: 'OK' }]
                    );
                    return;
                }

                // Get current location
                console.log(TAG, 'Getting current location');
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                
                console.log(TAG, 'Location acquired:', {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    accuracy: location.coords.accuracy,
                });
                
                setUserLocation(location);
                setHasUserLocation(true);
                
                // Update map region to user's location
                const newRegion = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: MAP_CONFIG.LAT_DELTA,
                    longitudeDelta: MAP_CONFIG.LONG_DELTA,
                };
                
                console.log(TAG, 'Updating map region to user location:', newRegion);
                setMapRegion(newRegion);
                
                // Animate map to user's location
                if (mapRef.current) {
                    console.log(TAG, 'Animating map to user location');
                    mapRef.current.animateToRegion(newRegion, MAP_ANIMATION_DURATION);
                }
                
            } catch (error) {
                console.error(TAG, 'Location error:', error);
                setHasUserLocation(false);
                Alert.alert(
                    'Location Error',
                    'Unable to get your current location. Using default location (Toronto, Canada).',
                    [{ text: 'OK' }]
                );
            } finally {
                setIsLocationLoading(false);
            }
        };

        setupLocation();
    }, []);

    /**
     * Handle hardware back button press
     * Closes dropdown if visible, otherwise allows default back behavior
     */
    useEffect(() => {
        const backAction = () => {
            if (isDropdownVisible) {
                console.log(TAG, 'Back button pressed, closing dropdown');
                closeDropdown();
                return true; // Prevent default back action
            }
            return false; // Allow default back action
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove();
    }, [isDropdownVisible]);

    /**
     * Reset UI state when screen comes into focus
     * Ensures dropdown and action sheets are closed when navigating back to this tab
     */
    useFocusEffect(
        useCallback(() => {
            console.log(TAG, 'HomeScreen focused, resetting UI state');
            setIsDropdownVisible(false);
            setIsActionSheetVisible(false);
            setIsSearchFocused(false);
        }, [])
    );

    // ========================================
    // LOCATION & EVENT HANDLERS
    // ========================================
    
    /**
     * Refreshes user location and updates map
     */
    const refreshLocation = async (): Promise<void> => {
        console.log(TAG, 'Refreshing user location');
        
        if (!locationPermission || locationPermission.status !== 'granted') {
            console.warn(TAG, 'Location permission not granted, requesting again');
            const permission = await Location.requestForegroundPermissionsAsync();
            setLocationPermission(permission);
            
            if (permission.status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Location permission is needed to show your current position.',
                    [{ text: 'OK' }]
                );
                return;
            }
        }

        try {
            setIsLocationLoading(true);
            console.log(TAG, 'Getting updated location');
            
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            
            console.log(TAG, 'Location refreshed:', {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
            });
            
            setUserLocation(location);
            setHasUserLocation(true);
            
            const newRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: MAP_CONFIG.LAT_DELTA,
                longitudeDelta: MAP_CONFIG.LONG_DELTA,
            };
            
            setMapRegion(newRegion);
            
            // Animate to new location
            if (mapRef.current) {
                console.log(TAG, 'Animating map to refreshed location');
                mapRef.current.animateToRegion(newRegion, MAP_ANIMATION_DURATION);
            }
            
        } catch (error) {
            console.error(TAG, 'Error refreshing location:', error);
            Alert.alert(
                'Location Error',
                'Unable to get your current location. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsLocationLoading(false);
        }
    };

    /**
     * Handles search box press - ensures dropdown stays open
     */
    const handleSearchBoxPress = (): void => {
        console.log(TAG, 'Search box pressed, opening dropdown');
        setIsDropdownVisible(true);
        setIsSearchFocused(true);
    };

    /**
     * Closes the dropdown and resets search focus
     */
    const closeDropdown = (): void => {
        console.log(TAG, 'Closing dropdown via back arrow');
        setIsDropdownVisible(false);
        setIsSearchFocused(false);
    };

    /**
     * Handles time of day filter toggle
     * @param time - The time period to toggle
     */
    const toggleTimeOfDay = (time: keyof TimeOfDay): void => {
        console.log(TAG, 'Toggling time of day:', time);
        setTimeOfDay(prev => {
            if (time === 'allDay') {
                // If toggling "All day", disable all other options when turning it on
                const newAllDay = !prev.allDay;
                const newState = {
                    allDay: newAllDay,
                    morning: newAllDay ? false : prev.morning,
                    afternoon: newAllDay ? false : prev.afternoon,
                    evening: newAllDay ? false : prev.evening,
                };
                console.log(TAG, 'All day toggled, new state:', newState);
                return newState;
            } else {
                // If toggling specific time, disable "All day" and toggle the specific time
                const newState = {
                    ...prev,
                    allDay: false,
                    [time]: !prev[time]
                };
                console.log(TAG, 'Specific time toggled, new state:', newState);
                return newState;
            }
        });
    };

    /**
     * Handles Plan Food button press - shows custom action sheet with price options if not active, toggles off if active
     */
    const handlePlanFoodPress = (): void => {
        if (planFood) {
            // If Plan Food is already on, turn it off
            console.log(TAG, 'Plan Food turned off');
            setPlanFood(false);
        } else {
            // If Plan Food is off, show price selection action sheet
            console.log(TAG, 'Plan Food pressed, showing price selection action sheet');
            
            setIsActionSheetVisible(true);
            SheetManager.show('price-selection-sheet');
        }
    };

    /**
     * Handles price selection from the action sheet
     */
    const handlePriceSelection = (selectedPrice: PriceRangeValue): void => {
        console.log(TAG, 'Price option selected:', selectedPrice, `(${PRICE_RANGE_MAP[selectedPrice]})`);
        setPriceRange(selectedPrice);
        setPlanFood(true);
        setIsActionSheetVisible(false);
        SheetManager.hide('price-selection-sheet');
    };

    /**
     * Resets all filters to their default values
     */
    const resetFilters = (): void => {
        console.log(TAG, 'Resetting all filters to defaults');
        setTimeOfDay({ allDay: false, morning: false, afternoon: false, evening: false });
        setEnvironment('indoor');
        setPlanTransit(false);
        setGroupSize('solo');
        setPlanFood(false);
        setPriceRange(1);
        setIsActionSheetVisible(false);
        setSpecialOptions([]);
    };

    /**
     * Resets the search form to initial state
     */
    const resetSearchForm = (): void => {
        console.log(TAG, 'Resetting search form');
        setInputValue("");
        setIsDropdownVisible(false);
        setIsActionSheetVisible(false);
        setIsSearchFocused(false);
        resetFilters();
    };

    // ========================================
    // DATA COLLECTION & NAVIGATION
    // ========================================
    
    /**
     * Collects all filter data into a structured format for backend
     * @returns Formatted search data object
     */
    const collectFilterData = (): SearchData => {
        // Handle time of day logic - if allDay is selected, use only that, otherwise use specific times
        const selectedTimeOfDay = timeOfDay.allDay 
            ? ['allDay']
            : Object.keys(timeOfDay).filter(
                key => key !== 'allDay' && timeOfDay[key as keyof TimeOfDay]
            );

        const searchData = {
            searchQuery: inputValue.trim(),
            ...(userLocation && { location: userLocation }),
            filters: {
                timeOfDay: selectedTimeOfDay,
                environment,
                planTransit,
                groupSize,
                planFood,
                ...(planFood && { priceRange }),
                ...(specialOptions.length > 0 && { specialOptions }),
            },
            timestamp: new Date().toISOString()
        };

        console.log(TAG, 'Collected filter data:', {
            ...searchData,
            filters: {
                ...searchData.filters,
                priceRange: searchData.filters.priceRange ? `${searchData.filters.priceRange} (${PRICE_RANGE_MAP[searchData.filters.priceRange]})` : undefined,
                specialOptions: searchData.filters.specialOptions?.length
                  ? searchData.filters.specialOptions.join(', ')
                  : 'None selected'
            }
        });

        return searchData;
    };

    /**
     * Handles search submission and navigation to chat screen
     * Validates input, collects data, and navigates to chat
     */
    const handleSendToBackend = async (): Promise<void> => {
        console.log(TAG, 'Send button pressed, validating and collecting data');
        
        const searchData = collectFilterData();
        
        // Input validation
        if (!searchData.searchQuery) {
            console.warn(TAG, 'Validation failed: empty search query');
            Alert.alert('Error', 'Please enter a search query');
            return;
        }

        try {
            console.log(TAG, 'Navigating to chat screen with search data');
            
            // Navigate to chat screen with search data
            router.push({
                pathname: '/chat' as any,
                params: {
                    searchData: JSON.stringify(searchData)
                }
            });

            console.log(TAG, 'Navigation successful, resetting form');
            
            // Reset form after successful navigation
            resetSearchForm();
        } catch (error) {
            console.error(TAG, 'Navigation error:', error);
            Alert.alert('Error', 'Failed to navigate to chat. Please try again.');
        }
    };

    // ========================================
    // UI HELPERS
    // ========================================
    
    /**
     * Renders checkbox icon based on checked state
     * @param isChecked - Whether the checkbox is checked
     * @returns JSX element for checkbox icon
     */
    const renderCheckbox = (isChecked: boolean): React.ReactElement => (
        <MaterialCommunityIcons 
            name={isChecked ? "checkbox-marked" : "checkbox-blank-outline"} 
            size={HOME_ICON_SIZES.checkbox} 
            color={isChecked ? COLORS.primary : HOME_COLORS.placeholder} 
        />
    );

    /**
     * Renders highlighted button based on selected state
     * @param isSelected - Whether the button is selected
     * @param text - The text to display on the button
     * @param icon - The icon to display when not selected
     * @returns JSX element for highlighted button
     */
    const renderHighlightButton = (isSelected: boolean, text: string, icon: string): React.ReactElement => (
        <View style={[styles.highlightButton, isSelected && styles.highlightButtonSelected]}>
            <MaterialCommunityIcons 
                name={isSelected ? "check" : icon as any} 
                size={HOME_ICON_SIZES.radio} 
                color={isSelected ? COLORS.white : HOME_COLORS.placeholder} 
            />
            <Text style={[styles.highlightButtonText, isSelected && styles.highlightButtonTextSelected]}>
                {text}
            </Text>
        </View>
    );

    /**
     * Renders toggle switch icon based on state
     * @param isOn - Whether the toggle is on
     * @returns JSX element for toggle icon
     */
    const renderToggle = (isOn: boolean): React.ReactElement => (
        <MaterialCommunityIcons 
            name={isOn ? "toggle-switch" : "toggle-switch-off"} 
            size={HOME_ICON_SIZES.toggle} 
            color={isOn ? COLORS.primary : HOME_COLORS.placeholder} 
        />
    );

    // ========================================
    // DYNAMIC STYLES
    // ========================================
    
    /**
     * Dynamic glow style for search bar border
     */
    const glowStyle = {
        borderWidth: BORDER_WIDTH,
        borderColor: glowAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: ['#87CEEB', '#9370DB', '#8A2BE2'], // Blue, Purple, Pink
        }),
    };

    /**
     * Determines send button color based on input state
     */
    const sendButtonColor = isLoading 
        ? HOME_COLORS.loading 
        : (inputValue.trim() ? COLORS.primary : HOME_COLORS.placeholder);

    // ========================================
    // RENDER
    // ========================================
    
    return (
        <View style={styles.container}>
            {/* Search Container */}
            <View style={styles.searchContainer}>
                {/* Search Input with Glow Effect */}
                <Animated.View style={[styles.searchInputContainer, glowStyle]}>
                    <View style={styles.searchRow}>
                        {/* Back Arrow (Conditional) */}
                        {isDropdownVisible && (
                            <TouchableOpacity 
                                style={styles.iconButton} 
                                onPress={closeDropdown}
                                accessibilityLabel="Close filters"
                            >
                                <ArrowLeft 
                                    size={HOME_ICON_SIZES.back} 
                                    color={COLORS.secondary} 
                                />
                            </TouchableOpacity>
                        )}

                        {/* Search Input Area */}
                        <TouchableOpacity 
                            style={styles.searchInputArea}
                            onPress={handleSearchBoxPress}
                            activeOpacity={1}
                        >
                            <TextInput
                                style={styles.searchInput}
                                value={inputValue}
                                onChangeText={(text) => {
                                    console.log(TAG, 'Search input changed:', text);
                                    setInputValue(text);
                                }}
                                placeholder=" "
                                placeholderTextColor={HOME_COLORS.placeholder}
                                editable={!isLoading}
                                onFocus={() => {
                                    console.log(TAG, 'Search input focused');
                                    setIsDropdownVisible(true);
                                    setIsSearchFocused(true);
                                }}
                                onBlur={() => {
                                    console.log(TAG, 'Search input blurred');
                                    setIsSearchFocused(false);
                                }}
                                returnKeyType="search"
                                onSubmitEditing={handleSendToBackend}
                            />
                            
                            {/* Animated Placeholder */}
                            {inputValue.length === 0 && !isSearchFocused && (
                                <Animated.Text
                                    style={[
                                        styles.animatedPlaceholder,
                                        {
                                            transform: [{ translateY: placeholderAnim }],
                                            opacity: placeholderAnim.interpolate({
                                                inputRange: [-ANIMATIONS.placeholderOffset, 0, ANIMATIONS.placeholderOffset],
                                                outputRange: [0, 1, 0],
                                            }),
                                        },
                                    ]}
                                    pointerEvents="none"
                                >
                                    {displayedPlaceholder}
                                </Animated.Text>
                            )}
                        </TouchableOpacity>
                        
                        {/* Send Button */}
                        <TouchableOpacity 
                            style={styles.iconButton} 
                            onPress={handleSendToBackend}
                            disabled={isLoading || !inputValue.trim()}
                            accessibilityLabel="Send search query"
                        >
                            {isLoading ? <LoaderCircle size={HOME_ICON_SIZES.send} color={sendButtonColor} /> : <Send size={HOME_ICON_SIZES.send} color={sendButtonColor} />}
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Dropdown Filter Menu */}
                <Animated.View 
                    style={[
                        styles.dropdown,
                        {
                            height: dropdownAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, DROPDOWN_HEIGHT],
                            }),
                            opacity: dropdownAnim,
                        }
                    ]}
                >
                    <ScrollView 
                        style={styles.dropdownContent} 
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Time of Day Section */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterTitle}>Time of Day</Text>
                            
                            {/* All Day Toggle */}
                            <TouchableOpacity 
                                style={styles.filterOption} 
                                onPress={() => toggleTimeOfDay('allDay')}
                            >
                                {renderToggle(timeOfDay.allDay)}
                                <Text style={styles.filterText}>All Day</Text>
                            </TouchableOpacity>
                            
                            {/* Specific Time Options */}
                            <View style={styles.threeColumnContainer}>
                                {(['morning', 'afternoon', 'evening'] as const).map((time) => (
                                    <View key={time} style={styles.columnItem}>
                                        <TouchableOpacity 
                                            style={timeOfDay.allDay ? styles.filterOptionDisabled : styles.filterOption} 
                                            onPress={() => !timeOfDay.allDay && toggleTimeOfDay(time)}
                                            disabled={timeOfDay.allDay}
                                        >
                                            {renderCheckbox(timeOfDay[time])}
                                            <Text style={timeOfDay.allDay ? styles.filterTextDisabled : styles.filterText}>
                                                {time.charAt(0).toUpperCase() + time.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Environment Section */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterTitle}>Environment</Text>
                            <View style={styles.threeColumnContainer}>
                                {(['indoor', 'outdoor', 'mixed'] as const).map((env) => {
                                    // Define specific icons for each environment
                                    const getEnvironmentIcon = (envType: string) => {
                                        switch (envType) {
                                            case 'indoor': return 'home';
                                            case 'outdoor': return 'tree';
                                            case 'mixed': return 'city';
                                            default: return 'radiobox-blank';
                                        }
                                    };
                                    
                                    return (
                                        <View key={env} style={styles.columnItem}>
                                            <TouchableOpacity 
                                                style={styles.filterOption} 
                                                onPress={() => {
                                                    console.log(TAG, 'Environment changed to:', env);
                                                    setEnvironment(env);
                                                }}
                                            >
                                                {renderHighlightButton(environment === env, env.charAt(0).toUpperCase() + env.slice(1), getEnvironmentIcon(env))}
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Plan Options Section - Side by Side */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterTitle}>Planning Options</Text>
                            <View style={styles.sideBySideContainer}>
                                <View style={styles.toggleContainer}>
                                    <TouchableOpacity 
                                        style={styles.filterOption} 
                                        onPress={() => {
                                            console.log(TAG, 'Plan Transit toggled to:', !planTransit);
                                            setPlanTransit(!planTransit);
                                        }}
                                    >
                                        {renderToggle(planTransit)}
                                        <Text style={styles.filterText}>Plan Transit</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.toggleContainer}>
                                    <TouchableOpacity 
                                        style={styles.filterOption} 
                                        onPress={handlePlanFoodPress}
                                    >
                                        {renderToggle(planFood)}
                                        <Text style={styles.filterText}>
                                            Plan Food {planFood ? `(${PRICE_RANGE_MAP[priceRange]})` : ''}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Group Size Section */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterTitle}>Group Size</Text>
                            <View style={styles.threeColumnContainer}>
                                {(['solo', 'duo', 'group'] as const).map((size) => {
                                    // Define specific icons for each group size
                                    const getGroupSizeIcon = (sizeType: string) => {
                                        switch (sizeType) {
                                            case 'solo': return 'account';
                                            case 'duo': return 'account-multiple';
                                            case 'group': return 'account-group';
                                            default: return 'radiobox-blank';
                                        }
                                    };
                                    
                                    return (
                                        <View key={size} style={styles.columnItem}>
                                            <TouchableOpacity 
                                                style={styles.filterOption} 
                                                onPress={() => {
                                                    console.log(TAG, 'Group size changed to:', size);
                                                    setGroupSize(size);
                                                }}
                                            >
                                                {renderHighlightButton(groupSize === size, size.charAt(0).toUpperCase() + size.slice(1), getGroupSizeIcon(size))}
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Special Options Section */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterTitle}>Special Options</Text>
                            <View style={styles.threeColumnContainer}>
                                {(['casual', 'adventure', 'tourist', 'wander', 'date', 'family'] as const).map((option) => (
                                    <View key={option} style={styles.columnItem}>
                                        <TouchableOpacity 
                                            style={styles.filterOption} 
                                            onPress={() => {
                                                setSpecialOptions(prev =>
                                                    prev.includes(option)
                                                        ? prev.filter(o => o !== option)
                                                        : [...prev, option]
                                                );
                                            }}
                                        >
                                            {renderCheckbox(specialOptions.includes(option))}
                                            <Text style={styles.filterText}>{option.charAt(0).toUpperCase() + option.slice(1)}</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                </Animated.View>
            </View>
            
            {/* Map View */}
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                    latitude: MAP_CONFIG.DEFAULT_REGION.latitude,
                    longitude: MAP_CONFIG.DEFAULT_REGION.longitude,
                    latitudeDelta: MAP_CONFIG.LAT_DELTA,
                    longitudeDelta: MAP_CONFIG.LONG_DELTA,
                }}
                region={mapRegion}
                showsUserLocation={hasUserLocation}
                showsMyLocationButton={false}
                followsUserLocation={false}
                onRegionChangeComplete={(region) => {
                    console.log(TAG, 'Map region changed:', region);
                }}
            />
            
            {/* Location Controls */}
            <View style={styles.locationControls}>
                <TouchableOpacity 
                    style={[styles.locationButton, isLocationLoading && styles.locationButtonLoading]}
                    onPress={refreshLocation}
                    disabled={isLocationLoading}
                    accessibilityLabel="Refresh location"
                    accessibilityRole="button"
                >
                    {isLocationLoading ? (
                        <ActivityIndicator 
                            size="large" 
                            color={COLORS.primary} 
                        />
                    ) : (
                        hasUserLocation ? <LocateFixed size={HOME_ICON_SIZES.filter} color={COLORS.primary} /> : <LocateOff size={HOME_ICON_SIZES.filter} color={COLORS.secondary} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Price Selection Action Sheet */}
            <ActionSheet id="price-selection-sheet" gestureEnabled={true}>
                <View style={styles.actionSheetContainer}>                    
                    <FlatList
                        data={PRICE_RANGE_VALUES}
                        keyExtractor={(item) => item.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.priceOptionItem}
                                onPress={() => {
                                    handlePriceSelection(item);
                                }}
                            >
                                <Text style={styles.priceOptionText}>{PRICE_RANGE_MAP[item]}</Text>
                                <Text style={styles.priceDescription}>
                                    {item === 1 ? 'Budget ($10-$20)' : 
                                     item === 2 ? 'Moderate ($20-$30)' : 
                                     item === 3 ? 'Premium ($30-$50)' : 'Luxury ($50+)'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </ActionSheet>
        </View>
    );
}

// ========================================
// STYLES
// ========================================
const styles = StyleSheet.create({
    // Layout
    container: {
        flex: 1,
        height: '100%',
        width: '100%',
    },
    map: {
        flex: 1,
    },
    
    // Search Container
    searchContainer: {
        position: 'absolute',
        top: HOME_SPACING.searchTop,
        left: HOME_SPACING.searchHorizontal,
        right: HOME_SPACING.searchHorizontal,
        zIndex: 10,
    },
    searchInputContainer: {
        backgroundColor: COLORS.white,
        borderRadius: HOME_SPACING.borderRadius,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginEnd: HOME_SPACING.iconPadding,
    },
    
    // Search Input
    searchInputArea: {
        flex: 1,
        position: 'relative',
        justifyContent: 'center',
    },
    searchInput: {
        position: 'absolute',
        width: '100%',
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
        color: HOME_COLORS.placeholder,
        fontSize: TYPOGRAPHY.fontSize.sm,
        top: Platform.OS === 'ios' ? -7.5 : -10,
    },
    
    // Buttons
    iconButton: {
        paddingHorizontal: HOME_SPACING.iconPadding,
        paddingVertical: HOME_SPACING.iconPadding,
    },
    
    // Dropdown
    dropdown: {
        backgroundColor: COLORS.white,
        borderRadius: HOME_SPACING.dropdownRadius,
        marginTop: HOME_SPACING.dropdownMarginTop,
        ...SHADOWS.card,
        overflow: 'hidden',
        // Enhanced modal-like appearance
        borderWidth: 1,
        borderColor: COLORS.border,
        // Stronger shadow for more prominence
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    dropdownContent: {
        padding: HOME_SPACING.contentPadding,
    },
    dropdownScrollContent: {
        paddingBottom: HOME_SPACING.contentPadding,
    },
    
    // Filter Sections
    filterSection: {
        marginBottom: HOME_SPACING.sectionMargin,
    },
    filterTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        marginBottom: SPACING.sm,
        color: COLORS.text,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: HOME_SPACING.optionPaddingVertical,
    },
    filterOptionDisabled: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: HOME_SPACING.optionPaddingVertical,
        opacity: 0.4,
    },
    filterText: {
        marginLeft: HOME_SPACING.textMarginLeft,
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.text,
    },
    filterTextDisabled: {
        marginLeft: HOME_SPACING.textMarginLeft,
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.lightText,
    },
    
    // Sub-sections
    subSection: {
        marginTop: HOME_SPACING.subSectionMarginTop,
        marginLeft: HOME_SPACING.subSectionMarginLeft,
        paddingLeft: HOME_SPACING.subSectionPaddingLeft,
        borderLeftWidth: 2,
        borderLeftColor: COLORS.border,
    },
    subTitle: {
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        marginBottom: SPACING.sm,
        color: HOME_COLORS.subText,
    },
    
    // Location Controls
    locationControls: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 80 : 30,
        right: 20,
        alignItems: 'flex-end',
        zIndex: 5,
    },
    locationButton: {
        backgroundColor: COLORS.white,
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.button,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    locationButtonLoading: {
        opacity: 0.7,
    },
    
    // 3-Column Layout
    threeColumnContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: SPACING.xs,
    },
    columnItem: {
        width: '30%',
        marginBottom: SPACING.sm,
    },
    
    // Side-by-side toggles
    sideBySideContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    toggleContainer: {
        flex: 1,
        marginHorizontal: SPACING.xs,
    },

    // Price Selection Action Sheet
    actionSheetContainer: {
        backgroundColor: COLORS.white,
        paddingTop: SPACING.md,
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.xxl,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
    },
    actionSheetTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        marginBottom: SPACING.lg,
        color: COLORS.text,
        textAlign: 'center',
    },
    priceOptionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.md,
        marginVertical: SPACING.xs,
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    priceOptionText: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
    },
    priceDescription: {
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.lightText,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    highlightButton: {
        padding: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
    },
    highlightButtonSelected: {
        backgroundColor: COLORS.primary,
    },
    highlightButtonText: {
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
    },
    highlightButtonTextSelected: {
        color: COLORS.white,
    },
});
