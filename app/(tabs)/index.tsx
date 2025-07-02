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
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TextInput, TouchableOpacity, View, Text, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';

// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

// Map configuration
const MAP_CONFIG = {
    LAT_DELTA: 0.015,
    LONG_DELTA: 0.012,
    // Fallback to Toronto location if user location is not available
    DEFAULT_REGION: {
        latitude: 43.6532,
        longitude: -79.3832,
    },
} as const;

// UI Constants for consistent styling and easy maintenance
const ICON_SIZES = {
    filter: 28,
    send: 32,
    checkbox: 24,
    radio: 24,
    toggle: 32,
} as const;

const COLORS = {
    primary: '#4B6CB7',
    secondary: '#888',
    text: '#333',
    subText: '#555',
    placeholder: '#666',
    border: '#E0E0E0',
    background: 'white',
    shadow: '#000',
    loading: '#CCE5FF',
} as const;

const ANIMATIONS = {
    glowDuration: 8000,
    placeholderDuration: 250,
    placeholderInterval: 7000,
    dropdownDuration: 300,
    placeholderOffset: 30,
} as const;

const SPACING = {
    searchTop: 80,
    searchHorizontal: 20,
    borderRadius: 30,
    dropdownRadius: 20,
    dropdownMarginTop: 10,
    iconPadding: 10,
    contentPadding: 20,
    sectionMargin: 20,
    optionPaddingVertical: 8,
    textMarginLeft: 12,
    subSectionMarginTop: 10,
    subSectionMarginLeft: 20,
    subSectionPaddingLeft: 15,
} as const;

// Layout constants
const DROPDOWN_HEIGHT = 500;
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
    "Create your dream itinerary",
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
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
}

type Environment = 'indoor' | 'outdoor' | 'mixed';
type GroupSize = 'solo' | 'duo' | 'group';
type PriceRangeValue = 1 | 2 | 3 | 4;
type SpecialOption = 'auto' | 'casual' | 'tourist' | 'wander' | 'date' | 'family';

interface SearchData {
    searchQuery: string;
    filters: {
        timeOfDay: string[];
        environment: Environment;
        planTransit: boolean;
        groupSize: GroupSize;
        planFood: boolean;
        priceRange?: PriceRangeValue;
        specialOption: SpecialOption;
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
    
    // UI states
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [displayedPlaceholder, setDisplayedPlaceholder] = useState<string>(SEARCH_PLACEHOLDER_OPTIONS[0]);
    const [inputValue, setInputValue] = useState("");
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    
    // Location states
    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
    const [locationPermission, setLocationPermission] = useState<Location.LocationPermissionResponse | null>(null);
    const [mapRegion, setMapRegion] = useState({
        latitude: MAP_CONFIG.DEFAULT_REGION.latitude as number,
        longitude: MAP_CONFIG.DEFAULT_REGION.longitude as number,
        latitudeDelta: MAP_CONFIG.LAT_DELTA as number,
        longitudeDelta: MAP_CONFIG.LONG_DELTA as number,
    });

    // Filter states - centralized filter management
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>({
        morning: false,
        afternoon: false,
        evening: false,
    });
    const [environment, setEnvironment] = useState<Environment>('indoor');
    const [planTransit, setPlanTransit] = useState(false);
    const [groupSize, setGroupSize] = useState<GroupSize>('solo');
    const [planFood, setPlanFood] = useState(false);
    const [priceRange, setPriceRange] = useState<PriceRangeValue>(1);
    const [specialOption, setSpecialOption] = useState<SpecialOption>('auto');

    // ========================================
    // ANIMATION EFFECTS
    // ========================================
    
    /**
     * Continuous glow animation for search bar border
     * Creates an engaging visual effect that cycles through colors
     */
    useEffect(() => {
        console.log('[HomeScreen] Initializing glow animation');
        
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
        console.log('[HomeScreen] Setting up placeholder animation with interval:', ANIMATIONS.placeholderInterval);
        
        const startPlaceholderRotation = () => {
            const interval = setInterval(() => {
                // Only animate if input is empty and not focused
                if (inputValue.length === 0 && !isSearchFocused) {
                    console.log('[HomeScreen] Animating placeholder to index:', (placeholderIndex + 1) % SEARCH_PLACEHOLDER_OPTIONS.length);
                    
                    // Animate out (slide up)
                    Animated.timing(placeholderAnim, {
                        toValue: -ANIMATIONS.placeholderOffset,
                        duration: ANIMATIONS.placeholderDuration,
                        useNativeDriver: true,
                    }).start(() => {
                        // Update placeholder text
                        setPlaceholderIndex((prev) => {
                            const next = (prev + 1) % SEARCH_PLACEHOLDER_OPTIONS.length;
                            setDisplayedPlaceholder(SEARCH_PLACEHOLDER_OPTIONS[next]);
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
        console.log('[HomeScreen] Animating dropdown visibility:', isDropdownVisible);
        
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
        console.log('[HomeScreen] Setting up location services');
        
        const setupLocation = async () => {
            try {
                // Request location permission
                console.log('[HomeScreen] Requesting location permission');
                const permission = await Location.requestForegroundPermissionsAsync();
                setLocationPermission(permission);
                
                if (permission.status !== 'granted') {
                    console.warn('[HomeScreen] Location permission denied');
                    Alert.alert(
                        'Location Permission',
                        'Location access is needed to show your current position on the map. Using default location (Toronto).',
                        [{ text: 'OK' }]
                    );
                    return;
                }

                // Get current location
                console.log('[HomeScreen] Getting current location');
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                
                console.log('[HomeScreen] Location acquired:', {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
                
                setUserLocation(location);
                
                // Update map region to user's location
                setMapRegion({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: MAP_CONFIG.LAT_DELTA,
                    longitudeDelta: MAP_CONFIG.LONG_DELTA,
                });
                
            } catch (error) {
                console.error('[HomeScreen] Location error:', error);
                Alert.alert(
                    'Location Error',
                    'Unable to get your current location. Using default location (Toronto).',
                    [{ text: 'OK' }]
                );
            }
        };

        setupLocation();
    }, []);

    // ========================================
    // EVENT HANDLERS
    // ========================================
    
    /**
     * Handles search box press - ensures dropdown stays open
     */
    const handleSearchBoxPress = (): void => {
        console.log('[HomeScreen] Search box pressed, opening dropdown');
        setIsDropdownVisible(true);
        setIsSearchFocused(true);
    };

    /**
     * Toggles dropdown visibility
     */
    const toggleDropdown = (): void => {
        const newState = !isDropdownVisible;
        console.log('[HomeScreen] Toggling dropdown from', isDropdownVisible, 'to', newState);
        setIsDropdownVisible(newState);
    };

    /**
     * Handles time of day filter toggle
     * @param time - The time period to toggle
     */
    const toggleTimeOfDay = (time: keyof TimeOfDay): void => {
        console.log('[HomeScreen] Toggling time of day:', time);
        setTimeOfDay(prev => {
            const newState = {
                ...prev,
                [time]: !prev[time]
            };
            console.log('[HomeScreen] New time of day state:', newState);
            return newState;
        });
    };

    /**
     * Handles price range selection
     * @param value - The numeric price range value (1-4)
     */
    const handlePriceRangeChange = (value: PriceRangeValue): void => {
        console.log('[HomeScreen] Price range changed from', priceRange, 'to', value, `(${PRICE_RANGE_MAP[value]})`);
        setPriceRange(value);
    };

    /**
     * Resets all filters to their default values
     */
    const resetFilters = (): void => {
        console.log('[HomeScreen] Resetting all filters to defaults');
        setTimeOfDay({ morning: false, afternoon: false, evening: false });
        setEnvironment('indoor');
        setPlanTransit(false);
        setGroupSize('solo');
        setPlanFood(false);
        setPriceRange(1);
        setSpecialOption('auto');
    };

    /**
     * Resets the search form to initial state
     */
    const resetSearchForm = (): void => {
        console.log('[HomeScreen] Resetting search form');
        setInputValue("");
        setIsDropdownVisible(false);
        setIsSearchFocused(false);
        resetFilters();
    };

    // ========================================
    // DATA PROCESSING
    // ========================================
    
    /**
     * Collects all filter data into a structured format for backend
     * @returns Formatted search data object
     */
    const collectFilterData = (): SearchData => {
        const selectedTimeOfDay = Object.keys(timeOfDay).filter(
            key => timeOfDay[key as keyof TimeOfDay]
        );

        const searchData = {
            searchQuery: inputValue.trim(),
            filters: {
                timeOfDay: selectedTimeOfDay,
                environment,
                planTransit,
                groupSize,
                planFood,
                ...(planFood && { priceRange }),
                specialOption
            },
            timestamp: new Date().toISOString()
        };

        console.log('[HomeScreen] Collected filter data:', {
            ...searchData,
            filters: {
                ...searchData.filters,
                priceRange: searchData.filters.priceRange ? `${searchData.filters.priceRange} (${PRICE_RANGE_MAP[searchData.filters.priceRange]})` : undefined
            }
        });

        return searchData;
    };

    /**
     * Handles search submission and navigation to chat screen
     * Validates input, collects data, and navigates to chat
     */
    const handleSendToBackend = async (): Promise<void> => {
        console.log('[HomeScreen] Send button pressed, validating and collecting data');
        
        const searchData = collectFilterData();
        
        // Input validation
        if (!searchData.searchQuery) {
            console.warn('[HomeScreen] Validation failed: empty search query');
            Alert.alert('Error', 'Please enter a search query');
            return;
        }

        try {
            console.log('[HomeScreen] Navigating to chat screen with search data');
            
            // Navigate to chat screen with search data
            router.push({
                pathname: '/chat' as any,
                params: {
                    searchData: JSON.stringify(searchData)
                }
            });

            console.log('[HomeScreen] Navigation successful, resetting form');
            
            // Reset form after successful navigation
            resetSearchForm();
        } catch (error) {
            console.error('[HomeScreen] Navigation error:', error);
            Alert.alert('Error', 'Failed to navigate to chat. Please try again.');
        }
    };

    // ========================================
    // RENDER HELPERS
    // ========================================
    
    /**
     * Renders checkbox icon based on checked state
     * @param isChecked - Whether the checkbox is checked
     * @returns JSX element for checkbox icon
     */
    const renderCheckbox = (isChecked: boolean): React.ReactElement => (
        <MaterialCommunityIcons 
            name={isChecked ? "checkbox-marked" : "checkbox-blank-outline"} 
            size={ICON_SIZES.checkbox} 
            color={isChecked ? COLORS.primary : COLORS.placeholder} 
        />
    );

    /**
     * Renders radio button icon based on selected state
     * @param isSelected - Whether the radio button is selected
     * @returns JSX element for radio button icon
     */
    const renderRadio = (isSelected: boolean): React.ReactElement => (
        <MaterialCommunityIcons 
            name={isSelected ? "radiobox-marked" : "radiobox-blank"} 
            size={ICON_SIZES.radio} 
            color={isSelected ? COLORS.primary : COLORS.placeholder} 
        />
    );

    /**
     * Renders toggle switch icon based on state
     * @param isOn - Whether the toggle is on
     * @returns JSX element for toggle icon
     */
    const renderToggle = (isOn: boolean): React.ReactElement => (
        <MaterialCommunityIcons 
            name={isOn ? "toggle-switch" : "toggle-switch-off"} 
            size={ICON_SIZES.toggle} 
            color={isOn ? COLORS.primary : COLORS.placeholder} 
        />
    );

    // ========================================
    // COMPUTED STYLES
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
        ? COLORS.loading 
        : (inputValue.trim() ? COLORS.primary : COLORS.placeholder);

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
                                    console.log('[HomeScreen] Search input changed:', text);
                                    setInputValue(text);
                                }}
                                placeholder=" "
                                placeholderTextColor={COLORS.placeholder}
                                editable={!isLoading}
                                onFocus={() => {
                                    console.log('[HomeScreen] Search input focused');
                                    setIsDropdownVisible(true);
                                    setIsSearchFocused(true);
                                }}
                                onBlur={() => {
                                    console.log('[HomeScreen] Search input blurred');
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
                        
                        {/* Filter Button */}
                        <TouchableOpacity 
                            style={styles.iconButton} 
                            onPress={toggleDropdown}
                            disabled={isLoading}
                            accessibilityLabel="Toggle filters"
                        >
                            <MaterialCommunityIcons 
                                name="filter-outline" 
                                size={ICON_SIZES.filter} 
                                color={isLoading ? COLORS.loading : COLORS.secondary} 
                            />
                        </TouchableOpacity>
                        
                        {/* Send Button */}
                        <TouchableOpacity 
                            style={styles.iconButton} 
                            onPress={handleSendToBackend}
                            disabled={isLoading || !inputValue.trim()}
                            accessibilityLabel="Send search query"
                        >
                            <MaterialCommunityIcons 
                                name={isLoading ? "loading" : "send"} 
                                size={ICON_SIZES.send} 
                                color={sendButtonColor} 
                            />
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
                        contentContainerStyle={styles.dropdownScrollContent}
                    >
                        {/* Time of Day Section */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterTitle}>Time of Day</Text>
                            {(['morning', 'afternoon', 'evening'] as const).map((time) => (
                                <TouchableOpacity 
                                    key={time}
                                    style={styles.filterOption} 
                                    onPress={() => toggleTimeOfDay(time)}
                                >
                                    {renderCheckbox(timeOfDay[time])}
                                    <Text style={styles.filterText}>
                                        {time.charAt(0).toUpperCase() + time.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Environment Section */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterTitle}>Environment</Text>
                            {(['indoor', 'outdoor', 'mixed'] as const).map((env) => (
                                <TouchableOpacity 
                                    key={env}
                                    style={styles.filterOption} 
                                    onPress={() => {
                                        console.log('[HomeScreen] Environment changed to:', env);
                                        setEnvironment(env);
                                    }}
                                >
                                    {renderRadio(environment === env)}
                                    <Text style={styles.filterText}>
                                        {env.charAt(0).toUpperCase() + env.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Plan Transit Section */}
                        <View style={styles.filterSection}>
                            <TouchableOpacity 
                                style={styles.filterOption} 
                                onPress={() => {
                                    console.log('[HomeScreen] Plan Transit toggled to:', !planTransit);
                                    setPlanTransit(!planTransit);
                                }}
                            >
                                {renderToggle(planTransit)}
                                <Text style={styles.filterText}>Plan Transit</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Group Size Section */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterTitle}>Group Size</Text>
                            {(['solo', 'duo', 'group'] as const).map((size) => (
                                <TouchableOpacity 
                                    key={size}
                                    style={styles.filterOption} 
                                    onPress={() => {
                                        console.log('[HomeScreen] Group size changed to:', size);
                                        setGroupSize(size);
                                    }}
                                >
                                    {renderRadio(groupSize === size)}
                                    <Text style={styles.filterText}>
                                        {size.charAt(0).toUpperCase() + size.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Plan Food Section */}
                        <View style={styles.filterSection}>
                            <TouchableOpacity 
                                style={styles.filterOption} 
                                onPress={() => {
                                    console.log('[HomeScreen] Plan Food toggled to:', !planFood);
                                    setPlanFood(!planFood);
                                }}
                            >
                                {renderToggle(planFood)}
                                <Text style={styles.filterText}>Plan Food</Text>
                            </TouchableOpacity>

                            {/* Price Range (Conditional) */}
                            {planFood && (
                                <View style={styles.subSection}>
                                    <Text style={styles.subTitle}>Price Range</Text>
                                    {PRICE_RANGE_VALUES.map((value) => (
                                        <TouchableOpacity 
                                            key={value}
                                            style={styles.filterOption} 
                                            onPress={() => handlePriceRangeChange(value)}
                                        >
                                            {renderRadio(priceRange === value)}
                                            <Text style={styles.filterText}>{PRICE_RANGE_MAP[value]}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Special Options Section */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterTitle}>Special Options</Text>
                            {(['Auto', 'Casual', 'Tourist', 'Wander', 'Date', 'Family'] as const).map((option) => (
                                <TouchableOpacity 
                                    key={option}
                                    style={styles.filterOption} 
                                    onPress={() => {
                                        const newOption = option.toLowerCase() as SpecialOption;
                                        console.log('[HomeScreen] Special option changed to:', newOption);
                                        setSpecialOption(newOption);
                                    }}
                                >
                                    {renderRadio(specialOption === option.toLowerCase())}
                                    <Text style={styles.filterText}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </Animated.View>
            </View>
            
            {/* Map View */}
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: MAP_CONFIG.DEFAULT_REGION.latitude,
                    longitude: MAP_CONFIG.DEFAULT_REGION.longitude,
                    latitudeDelta: MAP_CONFIG.LAT_DELTA,
                    longitudeDelta: MAP_CONFIG.LONG_DELTA,
                }}
            />
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
        top: SPACING.searchTop,
        left: SPACING.searchHorizontal,
        right: SPACING.searchHorizontal,
        zIndex: 1,
    },
    searchInputContainer: {
        backgroundColor: COLORS.background,
        borderRadius: SPACING.borderRadius,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginEnd: SPACING.iconPadding,
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
        color: COLORS.placeholder,
        fontSize: 14,
        top: -10,
    },
    
    // Buttons
    iconButton: {
        paddingHorizontal: SPACING.iconPadding,
        paddingVertical: SPACING.iconPadding,
    },
    
    // Dropdown
    dropdown: {
        backgroundColor: COLORS.background,
        borderRadius: SPACING.dropdownRadius,
        marginTop: SPACING.dropdownMarginTop,
        shadowColor: COLORS.shadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        overflow: 'hidden',
    },
    dropdownContent: {
        padding: SPACING.contentPadding,
    },
    dropdownScrollContent: {
        paddingBottom: SPACING.contentPadding,
    },
    
    // Filter Sections
    filterSection: {
        marginBottom: SPACING.sectionMargin,
    },
    filterTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: COLORS.text,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.optionPaddingVertical,
    },
    filterText: {
        marginLeft: SPACING.textMarginLeft,
        fontSize: 16,
        color: COLORS.text,
    },
    
    // Sub-sections
    subSection: {
        marginTop: SPACING.subSectionMarginTop,
        marginLeft: SPACING.subSectionMarginLeft,
        paddingLeft: SPACING.subSectionPaddingLeft,
        borderLeftWidth: 2,
        borderLeftColor: COLORS.border,
    },
    subTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: COLORS.subText,
    },
});
