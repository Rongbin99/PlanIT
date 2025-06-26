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
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ICON_SIZES, SHADOWS, LAYOUT, TIME_CONSTANTS } from '@/constants/DesignTokens';

// ========================================
// TYPE DEFINITIONS
// ========================================

/**
 * Trip plan history item for list display
 * Optimized structure for history list overview
 */
interface TripPlanHistoryItem {
    id: string;
    title: string;
    location: string;
    lastUpdated: string;
    searchData?: Record<string, any>;
}

/**
 * Props for FlatList renderItem function
 */
interface RenderItemProps {
    item: TripPlanHistoryItem;
    index: number;
}

/**
 * API response for chat history
 */
interface TripPlanHistoryResponse {
    success: boolean;
    trips_list: TripPlanHistoryItem[];
    error?: string;
}

// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

const BACKEND_URL = 'http://localhost:3000'; // TODO: change to production URL (AWS Lambda)
const TAG = "[HistoryScreen]";
const STORAGE_KEY = 'tripPlanHistory';
const DEMO_MODE = true; // true -> demo data, false -> production data

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
    },
    {
        id: 'trip_002',
        title: 'Weekend activities for couples',
        location: 'Montréal, Quebec, Canada',
        lastUpdated: new Date(Date.now() - TIME_CONSTANTS.DAY_MS).toISOString(),
    },
    {
        id: 'trip_003',
        title: 'Family-friendly activities in Vancouver',
        location: 'Vancouver, British Columbia, Canada',
        lastUpdated: new Date(Date.now() - TIME_CONSTANTS.DAY_MS * 2).toISOString(),
    },
];

// ========================================
// MAIN COMPONENT
// ========================================

export default function HistoryScreen() {
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
     * Loads and handles trip plan history from local storage or API (account-specific)
     */
    const loadTripPlanHistory = async (): Promise<void> => {
        try {
            console.log(TAG, 'Starting trip plan history loading process');
            setIsLoading(true);
            
            // First, try to load from local storage for immediate display
            const localTripPlans = await loadTripPlanHistoryFromStorage();
            if (localTripPlans.length > 0) {
                console.log(TAG, 'Loaded', localTripPlans.length, 'trip plans from local storage');
                setTripPlanHistory(localTripPlans);
            }
            
            // Skip API fetching in demo mode
            if (DEMO_MODE) {
                console.info(TAG, 'Demo mode enabled, skipping API fetch');
                return;
            }
            
            // Then fetch from API for updates
            try {
                const apiTripPlans = await fetchTripPlanHistoryFromAPI();
                
                if (apiTripPlans.length > 0) {
                    console.log(TAG, 'Fetched', apiTripPlans.length, 'trip plans from API');
                    setTripPlanHistory(apiTripPlans);
                    // Save API data to local storage for offline use
                    await saveTripPlanHistoryToStorage(apiTripPlans);
                } else {
                    console.log(TAG, 'No trip plans found in API, using local data');
                }
            } catch (apiError) {
                console.error(TAG, 'API fetch failed, using local data:', apiError);
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
            // Otherwise, load from local storage then API
            const storedTripPlans = await AsyncStorage.getItem(STORAGE_KEY);
            
            if (storedTripPlans) {
                const tripPlans: TripPlanHistoryItem[] = JSON.parse(storedTripPlans);
                console.log(TAG, 'Loaded', tripPlans.length, 'trip plans from local storage');
                return tripPlans;
            } else {
                console.log(TAG, 'No trip plans found in local storage, returning empty array');
                return [];
            }
        } catch (error) {
            console.error(TAG, 'Error loading from storage:', error);
            return [];
        }
    };

    /**
     * Fetches chat history from backend API
     */
    const fetchTripPlanHistoryFromAPI = async (): Promise<TripPlanHistoryItem[]> => {
        console.log(TAG, `Fetching trip plan history from API: ${BACKEND_URL}/api/chat`);
        
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Add authentication headers if needed
                // 'Authorization': `Bearer ${userToken}`,
            },
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
            tripPlanCount: result.trips_list?.length || 0,
            error: result.error
        });

        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch trip plan history');
        }

        return result.trips_list || [];
    };

    /**
     * Saves trip plan history to local storage using AsyncStorage
     */
    const saveTripPlanHistoryToStorage = async (tripPlans: TripPlanHistoryItem[]): Promise<void> => {
        try {
            console.log(TAG, 'Saving', tripPlans.length, 'trip plans to local storage');
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tripPlans));
            console.log(TAG, 'Trip plan history saved to local storage successfully');
        } catch (error) {
            console.error(TAG, 'Error saving to storage:', error);
        }
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
     * Performs the actual trip plan deletion
     * @param tripPlanId - ID of trip plan to delete
     */
    const performTripPlanDeletion = async (tripPlanId: string): Promise<void> => {
        try {
            console.log(TAG, 'Starting trip plan deletion process for:', tripPlanId);
            // Update local state immediately for responsive UX
            const updatedTripPlans = tripPlanHistory.filter(tripPlan => tripPlan.id !== tripPlanId);
            setTripPlanHistory(updatedTripPlans);
            console.log(TAG, 'Local state updated, remaining trip plans:', updatedTripPlans.length);
            // Save to local storage
            await saveTripPlanHistoryToStorage(updatedTripPlans);
            
            // Send delete request to backend
            try {
                console.log(TAG, 'Sending delete request to API');
                const response = await fetch(`${BACKEND_URL}/api/chat/${tripPlanId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        // Add authentication headers if needed
                    },
                });
                
                console.log(TAG, 'Delete API response status:', response.status, response.statusText);
                
                if (!response.ok) {
                    throw new Error(`Failed to delete from server: ${response.status} ${response.statusText}`);
                }
                // Otherwise, log success message
                console.log(TAG, 'Trip plan deleted from server successfully');
            } catch (apiError) {
                console.warn(TAG, 'Server deletion failed, only local deletion succeeded:', apiError);
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
        console.log(TAG, `Rendering trip plan item ${index}:`, {
            id: item.id,
            title: item.title,
            location: item.location
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
                    const itemHeight = 120; // Approximate item height
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
        ...SHADOWS.card,
    },
    tripPlanContent: {
        padding: LAYOUT.card.padding,
    },
    tripPlanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.sm,
    },
    tripPlanTitle: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.text,
        marginRight: SPACING.sm + SPACING.xs, // 10
    },
    timestamp: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.lightText,
        flexShrink: 0,
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
