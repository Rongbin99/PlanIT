/**
 * HistoryScreen Component
 * 
 * Displays a list of past trip plans with search functionality and management.
 * Features pull-to-refresh, trip deletion, navigation to existing trips, and empty states.
 * Integrates with local storage and provides a clean interface for trip history management.
 * 
 * @author Rongbin Gu (@rongbin99)
 */

// ========================================
// IMPORTS
// ========================================
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, ImageBackground } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ICON_SIZES, SHADOWS, LAYOUT, TIME_CONSTANTS } from '@/constants/DesignTokens';
import { API_URLS, DEFAULT_HEADERS } from '@/constants/ApiConfig';
import { getChatsFromLocalStorage, convertChatsToHistoryItems, mergeChatsWithLocal, deleteChatFromLocalStorage, TripPlanHistoryItem, ImageData } from '@/constants/StorageUtils';
import { useAuth } from '@/contexts/AuthContext';

// ========================================
// TYPE DEFINITIONS
// ========================================

/**
 * Props for FlatList renderItem function
 */
interface RenderItemProps {
    item: TripPlanHistoryItem;
    index: number;
}

/**
 * Trip data structure from API
 */
interface APITripData {
    id: string;
    title: string;
    location: string;
    lastUpdated: string;
    searchData: Record<string, any>;
    image: ImageData;
}

/**
 * API response for chat history
 */
interface TripPlanHistoryResponse {
    success: boolean;
    trips: APITripData[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
        nextOffset: number | null;
    };
    metadata: {
        sortBy: string;
        sortOrder: string;
        searchQuery: string | null;
        timestamp: string;
        imagesIncluded: boolean;
    };
    error?: string;
}

// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

const TAG = "[HistoryScreen]";
const DEMO_MODE = false; // true -> demo data, false -> production data

// ========================================
// SAMPLE DATA
// ========================================

// Demo trip plans for development and testing purposes
// In production, this would be replaced with API calls or storage retrieval
const SAMPLE_TRIP_PLAN_DATA: TripPlanHistoryItem[] = [
    {
        id: 'trip_001',
        title: 'After work friends hangout and food in downtown Toronto',
        location: 'Toronto, Ontario, Canada',
        lastUpdated: new Date(Date.now() - TIME_CONSTANTS.HOUR_MS).toISOString(),
        image: {
            id: "KHVwR0vTA-A",
            url: "https://images.unsplash.com/photo-1610509659326-b35b9b15bf51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NjgwNTN8MHwxfHNlYXJjaHwxfHxUb3JvbnRvJTIwc2t5bGluZXxlbnwxfDB8fHwxNzUxNDIxNzg4fDA&ixlib=rb-4.1.0&q=80&w=1080",
            thumbnail: "https://images.unsplash.com/photo-1610509659326-b35b9b15bf51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NjgwNTN8MHwxfHNlYXJjaHwxfHxUb3JvbnRvJTIwc2t5bGluZXxlbnwxfDB8fHwxNzUxNDIxNzg4fDA&ixlib=rb-4.1.0&q=80&w=400",
            alt_description: "city skyline under full moon",
            photographer: {
                name: "Dave Xu",
                username: "phtm",
                profile_url: "https://unsplash.com/@phtm"
            },
            unsplash_url: "https://unsplash.com/photos/city-skyline-under-full-moon-KHVwR0vTA-A",
            location: "Toronto",
            original_location: "Toronto, Ontario, Canada",
            search_query: "Toronto skyline",
            cached_at: "2025-07-02T02:05:42.551Z"
      },
    },
    {
        id: 'trip_002',
        title: 'Weekend activities for couples',
        location: 'Montréal, Quebec, Canada',
        lastUpdated: new Date(Date.now() - TIME_CONSTANTS.DAY_MS).toISOString(),
        image: {
            id: "CL9Pl-5fXBU",
            url: "https://images.unsplash.com/photo-1659482513037-950fea76794c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NjgwNTN8MHwxfHNlYXJjaHwxfHxNb250cmVhbCUyMHNreWxpbmV8ZW58MXwwfHx8MTc1MTQyMTc4OHww&ixlib=rb-4.1.0&q=80&w=1080",
            thumbnail: "https://images.unsplash.com/photo-1659482513037-950fea76794c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NjgwNTN8MHwxfHNlYXJjaHwxfHxNb250cmVhbCUyMHNreWxpbmV8ZW58MXwwfHx8MTc1MTQyMTc4OHww&ixlib=rb-4.1.0&q=80&w=400",
            alt_description: "a city with many tall buildings",
            photographer: {
                name: "Grant Van Cleemput",
                username: "gvancleem",
                profile_url: "https://unsplash.com/@gvancleem"
            },
            unsplash_url: "https://unsplash.com/photos/a-city-with-many-tall-buildings-CL9Pl-5fXBU",
            location: "Montreal",
            original_location: "Montreal, Quebec, Canada",
            search_query: "Montreal skyline",
            cached_at: "2025-07-02T02:05:42.559Z"
      },
    },
    {
        id: 'trip_003',
        title: 'Family-friendly activities in Vancouver',
        location: 'Vancouver, British Columbia, Canada',
        lastUpdated: new Date(Date.now() - TIME_CONSTANTS.DAY_MS * 2).toISOString(),
        image: {
            id: "Wc45W-dQFlA",
            url: "https://images.unsplash.com/photo-1647655806923-e8202f4f2b8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NjgwNTN8MHwxfHNlYXJjaHwxfHxWYW5jb3V2ZXIlMjBza3lsaW5lfGVufDF8MHx8fDE3NTE0MjE3ODh8MA&ixlib=rb-4.1.0&q=80&w=1080",
            thumbnail: "https://images.unsplash.com/photo-1647655806923-e8202f4f2b8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NjgwNTN8MHwxfHNlYXJjaHwxfHxWYW5jb3V2ZXIlMjBza3lsaW5lfGVufDF8MHx8fDE3NTE0MjE3ODh8MA&ixlib=rb-4.1.0&q=80&w=400",
            alt_description: "an aerial view of a city and a harbor",
            photographer: {
                name: "Adrian Yu",
                username: "visualstrance",
                profile_url: "https://unsplash.com/@visualstrance"
            },
            unsplash_url: "https://unsplash.com/photos/an-aerial-view-of-a-city-and-a-harbor-Wc45W-dQFlA",
            location: "Vancouver",
            original_location: "Vancouver, British Columbia, Canada",
            search_query: "Vancouver skyline",
            cached_at: "2025-07-02T02:05:42.553Z"
      },
    },
];

// ========================================
// MAIN COMPONENT
// ========================================

export default function HistoryScreen() {
    // Auth context
    const { user, isAuthenticated, token } = useAuth();
    
    // State management
    const [tripPlanHistory, setTripPlanHistory] = useState<TripPlanHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Effects
    useEffect(() => {
        console.log(TAG, 'Screen initialized with state:', {
            tripPlanCount: tripPlanHistory.length,
            isLoading,
            refreshing
        });
    }, [tripPlanHistory, isLoading, refreshing]);
    
    /**
     * Load trip plan history when screen comes into focus
     * Uses useFocusEffect to refresh data when user returns to this tab
     */
    useFocusEffect(
        useCallback(() => {
            console.log(TAG, 'Screen focused, loading trip plan history');
            loadTripPlanHistory();
        }, [])
    );

    // Data management
    
    /**
     * Loads and handles trip plan history from local storage and API with merging
     */
    const loadTripPlanHistory = async (): Promise<void> => {
        try {
            console.log(TAG, 'Starting trip plan history loading process');
            setIsLoading(true);
            
            // First, load from local storage for immediate display
            const localTripPlans = await loadTripPlanHistoryFromStorage();
            console.log(TAG, 'Loaded', localTripPlans.length, 'trip plans from local storage');
            
            // Skip API fetching in demo mode
            if (DEMO_MODE) {
                console.info(TAG, 'Demo mode enabled, using local data only');
                setTripPlanHistory(localTripPlans);
                return;
            }
            
            // For non-authenticated users, only use local storage
            if (!isAuthenticated) {
                console.log(TAG, 'User not authenticated, using local data only');
                setTripPlanHistory(localTripPlans);
                return;
            }
            
            // For authenticated users, show local data immediately for better UX
            if (localTripPlans.length > 0) {
                setTripPlanHistory(localTripPlans);
            }
            
            // Then fetch from API and merge with local data (authenticated users only)
            try {
                console.log(TAG, 'User authenticated, fetching from API and merging with local data');
                const apiTripPlans = await fetchTripPlanHistoryFromAPI();
                console.log(TAG, 'Fetched', apiTripPlans.length, 'trip plans from API');
                
                // Merge API data with local data (API takes priority)
                const mergedTripPlans = mergeChatsWithLocal(apiTripPlans, localTripPlans);
                console.log(TAG, 'Merged data: API +', apiTripPlans.length, 'Local +', localTripPlans.length, '= Total', mergedTripPlans.length);
                
                setTripPlanHistory(mergedTripPlans);
                // Note: We don't save API data to AsyncStorage here because chats are saved
                // individually when created. This avoids overwriting newer local data.
            } catch (apiError) {
                console.error(TAG, 'API fetch failed for authenticated user, using local data:', apiError);

            }
        } catch (error) {
            console.error(TAG, 'Error loading trip plan history:', error);
            handleLoadError();
        } finally {
            setIsLoading(false);
            console.log(TAG, 'Trip plan history load process completed');
        }
    };

    /**
     * Loads trip plan history from local storage using AsyncStorage
     */
    const loadTripPlanHistoryFromStorage = async (): Promise<TripPlanHistoryItem[]> => {
        try {
            console.log(TAG, 'Loading trip plan history from local storage');
            
            // If demo mode is enabled, use sample data
            if (DEMO_MODE) {
                console.info(TAG, 'Demo mode enabled, using sample data');
                return SAMPLE_TRIP_PLAN_DATA;
            }
            
            // Load from AsyncStorage using utility
            const storedChats = await getChatsFromLocalStorage();
            const tripPlans = convertChatsToHistoryItems(storedChats);
            
            console.log(TAG, 'Loaded', tripPlans.length, 'trip plans from local storage');
            return tripPlans;
        } catch (error) {
            console.error(TAG, 'Error loading from storage:', error);
            return [];
        }
    };

    /**
     * Fetches chat history from backend API
     */
    const fetchTripPlanHistoryFromAPI = async (): Promise<TripPlanHistoryItem[]> => {
        console.log(TAG, `Fetching trip plan history from API: ${API_URLS.CHAT_HISTORY}`);
        
        // Include authorization header if user is authenticated
        const headers = {
            ...DEFAULT_HEADERS,
            ...(isAuthenticated && token && { Authorization: `Bearer ${token}` })
        };
        
        const response = await fetch(API_URLS.CHAT_HISTORY, {
            method: 'GET',
            headers,
        });

        console.log(TAG, 'API response status:', response.status, response.statusText);
        // API response error handling
        if (!response.ok) {
            const errorText = await response.text();
            const errorMessage = `HTTP response error! ${errorText}`;
            console.error(TAG, 'API request failed:', errorMessage);
            throw new Error(errorMessage);
        }

        const result: TripPlanHistoryResponse = await response.json();
        console.log(TAG, 'API response data:', {
            success: result.success,
            tripPlanCount: result.trips?.length || 0,
            error: result.error,
            hasImages: result.trips?.some(trip => trip.image) || false,
            imagesIncluded: result.metadata?.imagesIncluded || false,
            totalTrips: result.pagination?.total || 0,
            hasMore: result.pagination?.hasMore || false
        });

        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch trip plan history');
        }

        // Log image information for debugging
        result.trips?.forEach((trip, index) => {
            console.log(TAG, `Trip ${index + 1} image:`, {
                id: trip.id,
                hasImage: !!trip.image,
                imageUrl: trip.image?.url ? `${trip.image.url.substring(0, 50)}...` : 'none',
                thumbnailUrl: trip.image?.thumbnail ? `${trip.image.thumbnail.substring(0, 50)}...` : 'none'
            });
        });

        // Convert API data to TripPlanHistoryItem format
        const convertedTrips: TripPlanHistoryItem[] = result.trips?.map(trip => ({
            id: trip.id,
            title: trip.title,
            location: trip.location,
            lastUpdated: trip.lastUpdated,
            searchData: trip.searchData,
            image: trip.image
        })) || [];

        console.log(TAG, `Converted ${convertedTrips.length} trips from API format`);
        return convertedTrips;
    };

    /**
     * Handles pull-to-refresh functionality
     */
    const onRefresh = async (): Promise<void> => {
        console.log(TAG, 'Pull-to-refresh triggered');
        setRefreshing(true);
        await loadTripPlanHistory();
        setRefreshing(false);
        console.log(TAG, 'Pull-to-refresh completed');
    };

    /**
     * Handles errors during trip plan history loading
     */
    const handleLoadError = (): void => {
        console.warn(TAG, 'Load error alert shown to user');
        Alert.alert(
            'Load Error',
            'Failed to load trip plan history. Please try again.',
            [
                {
                    text: 'Try Again',
                    onPress: () => {
                        console.log(TAG, 'User chose to retry loading');
                        loadTripPlanHistory();
                    },
                },
                {
                    text: 'Continue Offline',
                    onPress: () => {
                        console.log(TAG, 'User chose to continue with offline data');
                    },
                },
            ]
        );
    };

    // Navigation Handlers
    
    /**
     * Handles navigation to existing trip planning session
     * @param tripPlan - Trip planning session to open
     */
    const handleTripPlanPress = (tripPlan: TripPlanHistoryItem): void => {
        // Log session item to console
        console.log(TAG, 'Trip plan item pressed:', {
            id: tripPlan.id,
            title: tripPlan.title,
            location: tripPlan.location
        });
        
        try {
            // Navigate to the chat screen with the trip plan ID
            router.push({
                pathname: '/chat' as any,
                params: {
                    tripPlanId: tripPlan.id,
                    existingTripPlan: 'true'
                }
            });
            console.log(TAG, 'Navigation to trip plan successful:', tripPlan.id);
        } catch (error) {
            console.error(TAG, 'Navigation error:', error);
            Alert.alert('Error', 'Failed to open trip plan. Please try again.');
        }
    };

    /**
     * Handles navigation to main search screen
     */
    const handleStartExploring = (): void => {
        console.log(TAG, 'Start exploring button pressed');
        
        try {
            // Navigate to the main screen (index.tsx)
            router.push('/(tabs)/' as any);
            console.log(TAG, 'Navigation to main screen successful');
        } catch (error) {
            console.error(TAG, 'Navigation error:', error);
            Alert.alert('Error', 'Failed to navigate. Please try again.');
        }
    };

    // Trip Plan Management
    
    /**
     * Handles trip plan deletion with confirmation
     * @param tripPlanId - ID of trip plan to delete
     */
    const handleDeleteTripPlan = (tripPlanId: string): void => {
        const tripPlanToDelete = tripPlanHistory.find(tripPlan => tripPlan.id === tripPlanId);
        console.log(TAG, 'Delete trip plan requested:', {
            id: tripPlanId,
            title: tripPlanToDelete?.title,
            location: tripPlanToDelete?.location
        });
        
        // Popup confirmation for deletion from user
        Alert.alert(
            'Delete Trip Plan',
            `Are you sure you want to delete "${tripPlanToDelete?.title}"?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        console.log(TAG, 'User cancelled deletion request');
                    },
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        console.log(TAG, 'User confirmed deletion request');
                        performTripPlanDeletion(tripPlanId);
                    },
                },
            ]
        );
    };

    /**
     * Performs the actual trip plan deletion from UI, local storage, and backend
     * @param tripPlanId - ID of trip plan to delete
     */
    const performTripPlanDeletion = async (tripPlanId: string): Promise<void> => {
        try {
            console.log(TAG, 'Starting trip plan deletion process for:', tripPlanId);
            
            // Update local state immediately for responsive UX
            const updatedTripPlans = tripPlanHistory.filter(tripPlan => tripPlan.id !== tripPlanId);
            setTripPlanHistory(updatedTripPlans);
            console.log(TAG, 'UI state updated, remaining trip plans:', updatedTripPlans.length);
            
            // Delete from local storage
            try {
                await deleteChatFromLocalStorage(tripPlanId);
                console.log(TAG, 'Trip plan deleted from local storage');
            } catch (storageError) {
                console.warn(TAG, 'Failed to delete from local storage:', storageError);
            }
            
            // Send delete request to backend
            try {
                console.log(TAG, 'Sending delete request to API');
                
                // Include authorization header if user is authenticated
                const headers = {
                    ...DEFAULT_HEADERS,
                    ...(isAuthenticated && token && { Authorization: `Bearer ${token}` })
                };
                
                const response = await fetch(API_URLS.DELETE_CHAT(tripPlanId), {
                    method: 'DELETE',
                    headers,
                });
                
                console.log(TAG, 'Delete API response status:', response.status, response.statusText);
                
                if (!response.ok) {
                    throw new Error(`Failed to delete from server: ${response.status} ${response.statusText}`);
                }
                console.log(TAG, 'Trip plan deleted from server successfully');
            } catch (apiError) {
                console.warn(TAG, 'Server deletion failed, but local deletion succeeded:', apiError);
                // This is okay - the item is deleted locally and will be handled on next sync
            }
        } catch (error) {
            console.error(TAG, 'Error during trip plan deletion:', error);
            // Rollback on error
            console.warn(TAG, 'Rolling back deletion, reloading trip plan history');
            loadTripPlanHistory();
            Alert.alert('Error', 'Failed to delete trip plan. Please try again.');
        }
    };

    // Utility Functions
    
    /**
     * Safely extracts image URL from trip data, preferring thumbnail over full URL
     * @param trip - Trip plan item
     * @returns Image URL string or null if no valid image
     */
    const getImageUrl = (trip: TripPlanHistoryItem): string | null => {
        if (!trip.image) {
            return null;
        }
        
        // Extract URL from ImageData object, preferring thumbnail
        if (typeof trip.image === 'object' && trip.image !== null) {
            return trip.image.thumbnail || trip.image.url;
        }
        
        // This shouldn't happen with the current structure, but adding for safety
        return null;
    };
    
    /**
     * Formats timestamp for display in trip plan list
     * @param timestamp - ISO timestamp string
     * @returns Human-readable time string
     */
    const formatTimestamp = (timestamp: string): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        
        // Calculate hours and days since timestamp
        const minutes = Math.floor(diff / TIME_CONSTANTS.MINUTE_MS);
        const hours = Math.floor(diff / TIME_CONSTANTS.HOUR_MS);
        const days = Math.floor(diff / TIME_CONSTANTS.DAY_MS);
        
        // Format the timestamp based on the difference
        let formattedTime: string;
        if (minutes < 1) {
            formattedTime = 'Just now';
        } else if (minutes < 60) {
            formattedTime = `${minutes}m ago`;
        } else if (hours < 24) {
            formattedTime = `${hours}h ago`;
        } else if (days < 7) {
            formattedTime = `${days}d ago`;
        } else {
            formattedTime = date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
            });
        }
        
        console.log(TAG, `Formatted timestamp ${timestamp} -> ${formattedTime}`);
        return formattedTime;
    };

    // Render Helpers
    
    /**
     * Renders individual trip plans in the list
     * @param renderProps - FlatList render item props
     * @returns JSX element for trip plan item
     */
    const renderTripPlanItem = ({ item, index }: RenderItemProps): React.ReactElement => {
        const imageUrl = getImageUrl(item);
        
        console.log(TAG, `Rendering trip plan item ${index}:`, {
            id: item.id,
            title: item.title,
            location: item.location,
            hasImage: !!imageUrl,
            imageUrl: imageUrl ? `${imageUrl.substring(0, 50)}...` : 'none'
        });
        
        // Render the trip plan item with background image
        return (
            <TouchableOpacity 
                style={styles.tripPlanItem}
                onPress={() => handleTripPlanPress(item)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Open trip plan: ${item.title}`}
            >
                {imageUrl ? (
                    /* Trip Plan with Background Image */
                    <ImageBackground
                        source={{ uri: imageUrl }}
                        style={styles.backgroundImage}
                        resizeMode="cover"
                        onError={(error) => {
                            console.warn(TAG, `Failed to load image for trip ${item.id}:`, {
                                error: error.nativeEvent.error,
                                imageUrl: imageUrl
                            });
                        }}
                        onLoad={() => {
                            console.log(TAG, `Successfully loaded image for trip ${item.id}:`, {
                                imageUrl: imageUrl
                            });
                        }}
                    >
                        {/* Dark gradient overlay for text readability */}
                        <LinearGradient
                            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                            style={styles.gradientOverlay}
                        >
                            <View style={styles.tripPlanContent}>
                                {/* Trip Plan Header: Title and timestamp */}
                                <View style={styles.tripPlanHeader}>
                                    <Text style={[styles.tripPlanTitle, styles.tripPlanTitleWithImage]} numberOfLines={2}>
                                        {item.title}
                                    </Text>
                                    <Text style={[styles.timestamp, styles.timestampWithImage]}>
                                        {formatTimestamp(item.lastUpdated)}
                                    </Text>
                                </View>
                                
                                {/* Item Footer: Location and Delete Button */}
                                <View style={styles.tripPlanFooter}>
                                    <View style={styles.locationCount}>
                                        <MaterialCommunityIcons 
                                            name="map-marker-outline" 
                                            size={ICON_SIZES.sm} 
                                            color={COLORS.white} 
                                        />
                                        <Text style={[styles.locationCountText, styles.locationCountTextWithImage]}>
                                            {item.location}
                                        </Text>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.deleteButton}
                                        onPress={() => handleDeleteTripPlan(item.id)}
                                        hitSlop={LAYOUT.hitSlop}
                                        accessibilityRole="button"
                                        accessibilityLabel="Delete trip plan"
                                    >
                                        <MaterialCommunityIcons 
                                            name="delete-outline" 
                                            size={ICON_SIZES.md} 
                                            color={COLORS.white} 
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </LinearGradient>
                    </ImageBackground>
                ) : (
                    /* Trip Plan without Background Image (fallback) */
                    <View style={styles.tripPlanContent}>
                        {/* Trip Plan Header: Title and timestamp */}
                        <View style={styles.tripPlanHeader}>
                            <Text style={styles.tripPlanTitle} numberOfLines={2}>
                                {item.title}
                            </Text>
                            <Text style={styles.timestamp}>
                                {formatTimestamp(item.lastUpdated)}
                            </Text>
                        </View>
                        
                        {/* Item Footer: Location and Delete Button */}
                        <View style={styles.tripPlanFooter}>
                            <View style={styles.locationCount}>
                                <MaterialCommunityIcons 
                                    name="map-marker-outline" 
                                    size={ICON_SIZES.sm} 
                                    color={COLORS.lightText} 
                                />
                                <Text style={styles.locationCountText}>
                                    {item.location}
                                </Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.deleteButton}
                                onPress={() => handleDeleteTripPlan(item.id)}
                                hitSlop={LAYOUT.hitSlop}
                                accessibilityRole="button"
                                accessibilityLabel="Delete trip plan"
                            >
                                <MaterialCommunityIcons 
                                    name="delete-outline" 
                                    size={ICON_SIZES.md} 
                                    color={COLORS.lightText} 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    /**
     * Renders empty state when no trip plans exist
     * @returns JSX element for empty state
     */
    const renderEmptyState = (): React.ReactElement => {
        console.log(TAG, 'Rendering empty state');
        
        return (
            <View style={styles.emptyState}>
                <MaterialCommunityIcons 
                    name="cactus" 
                    size={96} 
                    color={COLORS.lightText} 
                />
                <Text style={styles.emptyTitle}>No Adventure Plans Yet</Text>
                <Text style={styles.emptyText}>
                    Start planning and your PlanITs will appear here!
                </Text>
                {/* Start Exploring Button */}
                <TouchableOpacity 
                    style={styles.startButton}
                    onPress={handleStartExploring}
                    accessibilityRole="button"
                    accessibilityLabel="Start exploring"
                >
                    <Text style={styles.startButtonText}>Start Exploring</Text>
                </TouchableOpacity>
            </View>
        );
    };

    /**
     * Renders header section with title and PlanIT count
     * @returns JSX element for header
     */
    const renderHeader = (): React.ReactElement => {
        console.log(TAG, 'Rendering header with', tripPlanHistory.length, 'trip plans');
        
        return (
            <View style={styles.header}>
                <ThemedText type="title" style={styles.headerTitle}>
                    Your PlanITs
                </ThemedText>
                <ThemedText type="default" style={styles.headerSubtitle}>
                    {tripPlanHistory.length} trip plan{tripPlanHistory.length !== 1 ? 's' : ''}
                </ThemedText>
            </View>
        );
    };

    // Render
    console.log(TAG, 'Rendering component with state:', {
        isLoading,
        refreshing,
        tripPlanCount: tripPlanHistory.length,
        isEmpty: tripPlanHistory.length === 0
    });

    return (
        <ThemedView style={styles.container}>
            {/* Header */}
            {renderHeader()}

            {/* Trip Plan List */}
            <FlatList
                data={tripPlanHistory}
                renderItem={renderTripPlanItem}
                keyExtractor={(item) => {
                    console.log(TAG, `Extracting key for trip plan: ${item.id}`);
                    return item.id;
                }}
                style={styles.tripPlanList}
                contentContainerStyle={
                    tripPlanHistory.length === 0 ? styles.emptyContainer : styles.listContent
                }
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                        title="Pull to refresh"
                    />
                }
                ListEmptyComponent={!isLoading ? renderEmptyState : null}
                initialNumToRender={10}
                maxToRenderPerBatch={5}
                windowSize={10}
                removeClippedSubviews={true}
                getItemLayout={(data, index) => {
                    const itemHeight = LAYOUT.card.height;
                    return {
                        length: itemHeight,
                        offset: itemHeight * index,
                        index,
                    };
                }}
                onEndReached={() => {
                    console.log(TAG, 'Reached end of list');
                }}
                onEndReachedThreshold={0.5}
            />
        </ThemedView>
    );
}

// ========================================
// STYLES
// ========================================
const styles = StyleSheet.create({
    // Layout
    container: {
        flex: 1,
    },
    
    // Header
    header: {
        paddingHorizontal: LAYOUT.header.paddingHorizontal,
        paddingTop: LAYOUT.header.paddingTop,
        paddingBottom: LAYOUT.header.paddingBottom,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.fontSize.xxl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        marginBottom: SPACING.xs,
    },
    headerSubtitle: {
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.lightText,
    },
    
    // Trip Plan List
    tripPlanList: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: LAYOUT.content.paddingHorizontal,
        paddingTop: LAYOUT.content.paddingTop,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: LAYOUT.emptyState.paddingHorizontal,
    },
    
    // Trip Plan Items
    tripPlanItem: {
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.card.borderRadius,
        marginBottom: LAYOUT.card.marginBottom,
        minHeight: LAYOUT.card.height,
        ...SHADOWS.card,
        overflow: 'hidden', // Ensure border radius is applied to background image
    },
    backgroundImage: {
        width: '100%',
        height: LAYOUT.card.height,
        borderRadius: LAYOUT.card.borderRadius,
    },
    gradientOverlay: {
        flex: 1,
        justifyContent: 'space-between',
        borderRadius: LAYOUT.card.borderRadius,
    },
    tripPlanContent: {
        flex: 1,
        padding: LAYOUT.card.padding,
        justifyContent: 'space-between',
    },
    tripPlanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flex: 1,
    },
    tripPlanTitle: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.text,
        marginRight: SPACING.sm + SPACING.xs, // 10
    },
    tripPlanTitleWithImage: {
        color: COLORS.white,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 2,
    },
    timestamp: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.lightText,
        flexShrink: 0,
    },
    timestampWithImage: {
        color: COLORS.white,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 2,
    },
    tripPlanFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    locationCount: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationCountText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.lightText,
        marginLeft: SPACING.xs,
    },
    locationCountTextWithImage: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.white,
        marginLeft: SPACING.xs,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 2,
    },
    deleteButton: {
        padding: SPACING.xs,
        borderRadius: RADIUS.sm,
    },
    
    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: LAYOUT.emptyState.paddingVertical,
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.text,
        marginTop: SPACING.xl,
        marginBottom: SPACING.sm,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.lightText,
        textAlign: 'center',
        lineHeight: TYPOGRAPHY.lineHeight.relaxed,
        marginBottom: 30,
    },
    startButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: LAYOUT.button.paddingHorizontal,
        paddingVertical: LAYOUT.button.padding,
        borderRadius: LAYOUT.button.borderRadius,
        ...SHADOWS.button,
    },
    startButtonText: {
        color: COLORS.white,
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
});
