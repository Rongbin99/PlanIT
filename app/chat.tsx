/**
 * ChatScreen Component
 * 
 * Displays a chat interface with AI responses based on user search queries and filters.
 * Features loading states, message bubbles, error handling, and automatic chat persistence.
 * 
 * UUID Synchronization:
 * - POST to /api/plan generates AI response and creates chat on backend
 * - Backend returns proper UUID in response.chatId
 * - Frontend uses backend UUID for all chat data and message IDs
 * - Chat saved to local storage for offline access with backend UUID
 * 
 * @author Rongbin Gu (@rongbin99)
 */

// ========================================
// IMPORTS
// ========================================
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, ActivityIndicator, TouchableOpacity, Alert, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Star, Tag, Clock, Globe, Phone, MapPin, Route, Lightbulb, RotateCw, Search, Hourglass, ExternalLink, ChevronLeft, MapPinned, Footprints, TrainFrontTunnel, BusFront, TramFront, TrainFront, Ship, Info } from 'lucide-react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import MapView, { Marker } from 'react-native-maps';
import { API_URLS, DEFAULT_HEADERS } from '@/constants/ApiConfig';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ICON_SIZES } from '@/constants/DesignTokens';
import { saveChatToLocalStorage as saveToStorage, StoredChatData, getChatsFromLocalStorage } from '@/constants/StorageUtils';
import { useAuth } from '@/contexts/AuthContext';
import { getMapProvider } from '@/constants/MapProvider';

// ========================================
// TYPE DEFINITIONS
// ========================================

/**
 * Individual location structure from backend
 */
interface Location {
    name: string;
    address: string;
    description: string;
    category: 'restaurant' | 'attraction' | 'activity' | 'shopping' | 'accommodation';
    estimatedTime: string;
    time: string;
    priceRange: 'Free' | '$' | '$$' | '$$$' | '$$$+';
    imageURL?: string;
    photos?: Array<{
        url: string;
        width: number;
        height: number;
    }>;
    rating?: number;
    user_ratings_total?: number;
    phone?: string;
    website?: string;
    opening_hours?: {
        open_now: boolean;
        weekday_text: string[];
    };
    google_place_id?: string;
    transitToNext?: {
        type: string;
        duration: string;
        details: string;
    };
}

/**
 * Individual chat message structure
 */
interface ChatMessage {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: string;
    locations?: Location[];
    city?: string;
    practicalTips?: string;
}

/**
 * Complete chat conversation data
 */
interface ChatData {
    id: string;
    title: string;
    location: string;
    messages: ChatMessage[];
    searchData: SearchData;
    createdAt: string;
    updatedAt: string;
}

/**
 * Search data structure from previous screen
 */
interface SearchData {
    searchQuery: string;
    filters: {
        timeOfDay: string[];
        environment: string;
        planTransit: boolean;
        groupSize: string;
        planFood: boolean;
        priceRange?: number;
        specialOption: string;
    };
    timestamp: string;
}

/**
 * API response structure from backend
 */
interface ApiResponse {
    success: boolean;
    response: string;
    city: string;
    locations: Location[];
    practicalTips: string;
    chatId: string;
    title: string;
    location: string;
    error?: string;
}

/**
 * Detail section structure for expanded view
 */
interface DetailSection {
    id: string;
    type: 'info' | 'hours' | 'actions' | 'map';
    data: any;
}

// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

const TAG = "[ChatScreen]";

/**
 * Chat-specific constants not in design tokens
 */
const CHAT_COLORS = {
    userBubble: COLORS.primary,
    aiBubble: '#e9ecef',
    userText: COLORS.white,
    aiText: COLORS.text,
} as const;

/**
 * Animation configuration
 */
const ANIMATION_CONFIG = {
    loadingDuration: 600,
    scrollDelay: 100,
} as const;

/**
 * Chat-specific layout constants
 */
const CHAT_LAYOUT = {
    headerHeight: 60,
    statusBarPadding: 60,
    messageBubbleRadius: RADIUS.xl,
    smallBubbleRadius: RADIUS.sm,
    contentPadding: SPACING.xl,
    messageMargin: SPACING.sm,
    maxBubbleWidth: '80%',
} as const;

/**
 * Price range display mapping
 */
const PRICE_RANGE_MAP = {
    1: '$',
    2: '$$',
    3: '$$$',
    4: '$$$+',
} as const;

// ========================================
// MAIN COMPONENT
// ========================================
export default function ChatScreen() {
    // ========================================
    // STATE MANAGEMENT
    // ========================================
    
    // Route parameters
    const params = useLocalSearchParams();
    
    // Auth context
    const { user, isAuthenticated, token } = useAuth();
    
    // Chat state
    const [isLoading, setIsLoading] = useState(true);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatData, setChatData] = useState<ChatData | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Location and MapIT state
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [isGeneratingMapLink, setIsGeneratingMapLink] = useState(false);
    
    // Bottom sheet state
    const [bottomSheetLocation, setBottomSheetLocation] = useState<Location | null>(null);
    
    // Animation references
    const scrollViewRef = useRef<ScrollView>(null);
    const dotAnimation = useRef(new Animated.Value(0)).current;
    const mapItButtonAnimation = useRef(new Animated.Value(1)).current;
    const lastScrollY = useRef(0);
    
    // Bottom sheet references
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['85%'], []);

    // Parsed search data from navigation params
    const searchData: SearchData | null = params.searchData 
        ? JSON.parse(params.searchData as string) 
        : null;
    
    // Trip plan ID from navigation (for existing trips)
    const tripPlanId = params.tripPlanId as string | undefined;
    const isExistingTrip = params.existingTripPlan === 'true';

    console.log(TAG, 'Component initialized with params:', {
        hasSearchData: !!searchData,
        chatId: params.chatId,
        existingChat: params.existingChat,
        tripPlanId: tripPlanId,
        isExistingTrip: isExistingTrip,
        searchQuery: searchData?.searchQuery
    });

    // ========================================
    // EFFECTS
    // ========================================
    
    /**
     * Initialize chat when component mounts or search data changes
     */
    useEffect(() => {
        console.log(TAG, 'Effect triggered - initializing chat');
        
        // Initialize MapIT button as visible
        mapItButtonAnimation.setValue(1);
        
        // Prevent multiple initializations
        if (isInitialized) {
            console.log(TAG, 'Chat already initialized, skipping');
            return;
        }
        
        setIsInitialized(true);
        
        if (searchData) {
            console.log(TAG, 'Found search data, starting new chat initialization');
            initializeChat();
        } else if (tripPlanId && isExistingTrip) {
            console.log(TAG, 'Found trip plan ID, loading existing trip');
            loadExistingTrip(tripPlanId);
        } else {
            console.log(TAG, 'No search data or trip ID found, handling missing data scenario');
            handleMissingData();
        }
    }, []);

    /**
     * Animated loading dots effect
     * Creates a pulsing animation while AI is thinking
     */
    useEffect(() => {
        if (isLoading) {
            console.log(TAG, 'Starting loading animation');
            
            const animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(dotAnimation, {
                        toValue: 1,
                        duration: ANIMATION_CONFIG.loadingDuration,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dotAnimation, {
                        toValue: 0,
                        duration: ANIMATION_CONFIG.loadingDuration,
                        useNativeDriver: true,
                    }),
                ])
            );
            animation.start();

            return () => {
                console.log(TAG, 'Stopping loading animation');
                animation.stop();
            };
        }
    }, [isLoading, dotAnimation]);

    // ========================================
    // CHAT INITIALIZATION
    // ========================================
    
    /**
     * Handles missing search data scenario
     */
    const handleMissingData = (): void => {
        console.warn(TAG, 'Missing search data - showing error alert');
        setIsLoading(false);
        Alert.alert(
            'Error',
            'No search data found. Please start a new search.',
            [
                {
                    text: 'Go Back',
                    onPress: () => {
                        console.log(TAG, 'User chose to go back');
                        router.back();
                    },
                },
            ]
        );
    };

    /**
     * Initializes the chat conversation with user message and AI response
     */
    const initializeChat = async (): Promise<void> => {
        if (!searchData) {
            console.error(TAG, 'No search data available for initialization');
            return;
        }

        console.log(TAG, 'Starting chat initialization process');

        try {
            // Create initial user message
            console.log(TAG, 'Creating user message from search data');
            const userMessage = createUserMessage(searchData);
            setMessages([userMessage]);
            console.log(TAG, 'User message created:', userMessage);

            // Get AI response from backend
            console.log(TAG, 'Fetching AI response from backend');
            const { message: aiResponse, chatId: backendChatId, title: backendTitle, location: backendLocation } = await fetchAIResponse(searchData, userMessage);
            console.log(TAG, 'AI response received:', { aiResponse, backendChatId, backendTitle, backendLocation });
            
            // Update user message ID to reference backend chat ID
            const updatedUserMessage = {
                ...userMessage,
                id: `user_${backendChatId}_0`
            };
            
            // Create complete chat data with backend chat ID
            console.log(TAG, 'Creating complete chat data structure with backend UUID');
            const newChatData = createChatDataWithBackendId(searchData, updatedUserMessage, aiResponse, backendChatId, backendTitle, backendLocation);
            console.log(TAG, 'Chat data created:', {
                id: newChatData.id,
                title: newChatData.title,
                messageCount: newChatData.messages.length
            });
            
            // Save to local storage for offline access (chat already saved on backend)
            console.log(TAG, 'Saving chat to local storage for offline access');
            const storedChatData: StoredChatData = {
                id: newChatData.id,
                title: newChatData.title,
                location: newChatData.location,
                searchData: newChatData.searchData,
                messages: newChatData.messages,
                createdAt: newChatData.createdAt,
                updatedAt: newChatData.updatedAt,
            };
            await saveToStorage(storedChatData);
            
            // Update state with backend UUID
            setMessages([updatedUserMessage, aiResponse]);
            setChatData(newChatData);
            
            // Set locations from AI response
            if (aiResponse.locations && aiResponse.locations.length > 0) {
                setLocations(aiResponse.locations);
                console.log(TAG, 'Set locations from AI response:', aiResponse.locations.length);
            }
            
            // Update trip data for history integration
            if (aiResponse.city) {
                updateTripDataForHistory(backendChatId, aiResponse.city, aiResponse.locations || []);
            }
            
            console.log(TAG, 'Chat initialization completed successfully with backend UUID:', {
                chatId: backendChatId,
                title: newChatData.title,
                messageCount: newChatData.messages.length,
                userMessageId: updatedUserMessage.id,
                aiMessageId: aiResponse.id,
                locationCount: aiResponse.locations?.length || 0
            });
            
            setIsLoading(false);
            
            // Auto-scroll to bottom after content loads
            setTimeout(() => {
                console.log(TAG, 'Auto-scrolling to bottom');
                scrollToBottom();
            }, ANIMATION_CONFIG.scrollDelay);

        } catch (error) {
            console.error(TAG, 'Chat initialization failed:', error);
            handleChatError(error);
        }
    };

    /**
     * Loads an existing trip plan from local storage or backend
     * @param tripId - The ID of the trip to load
     */
    const loadExistingTrip = async (tripId: string): Promise<void> => {
        console.log(TAG, 'Loading existing trip:', tripId);
        setIsLoading(true);
        
        try {
            // First try to load from local storage
            console.log(TAG, 'Attempting to load trip from local storage');
            const storedChats = await getChatsFromLocalStorage();
            const savedTrip = storedChats.find(chat => chat.id === tripId);
            
            if (savedTrip) {
                console.log(TAG, 'Found trip in local storage:', savedTrip.id);
                
                // Convert stored chat data to current format
                const chatData: ChatData = {
                    id: savedTrip.id,
                    title: savedTrip.title,
                    location: savedTrip.location,
                    messages: savedTrip.messages,
                    searchData: savedTrip.searchData as SearchData,
                    createdAt: savedTrip.createdAt,
                    updatedAt: savedTrip.updatedAt
                };
                
                // Set chat data and messages
                setChatData(chatData);
                setMessages(chatData.messages);
                
                // Extract locations from AI messages
                const aiMessages = chatData.messages.filter(msg => msg.type === 'ai');
                if (aiMessages.length > 0) {
                    const lastAiMessage = aiMessages[aiMessages.length - 1];
                    if (lastAiMessage.locations && lastAiMessage.locations.length > 0) {
                        setLocations(lastAiMessage.locations);
                        console.log(TAG, 'Set locations from saved trip:', lastAiMessage.locations.length);
                    }
                }
                
                console.log(TAG, 'Successfully loaded existing trip from local storage');
                setIsLoading(false);
                
                // Auto-scroll to bottom
                setTimeout(() => {
                    scrollToBottom();
                }, ANIMATION_CONFIG.scrollDelay);
                
                return;
            }
            
            // If not found locally and user is authenticated, try backend
            if (isAuthenticated && token) {
                console.log(TAG, 'Trip not found locally, trying backend');
                // TODO: Implement backend trip loading when API is available
                // For now, show error since we don't have the backend endpoint yet
                throw new Error('Trip not found in local storage and backend loading not yet implemented');
            } else {
                throw new Error('Trip not found in local storage');
            }
            
        } catch (error) {
            console.error(TAG, 'Failed to load existing trip:', error);
            setIsLoading(false);
            
            Alert.alert(
                'Trip Not Found',
                'Could not load the requested trip plan. It may have been deleted or is no longer available.',
                [
                    {
                        text: 'Go Back',
                        onPress: () => {
                            console.log(TAG, 'User chose to go back after trip load error');
                            router.back();
                        },
                    },
                ]
            );
        }
    };

    // ========================================
    // MESSAGE CREATION
    // ========================================
    
    /**
     * Creates a user message from search data
     * @param searchData - The search query and filters
     * @returns Formatted user message
     */
    const createUserMessage = (searchData: SearchData): ChatMessage => {
        const userMessage = {
            id: `user_${Date.now()}`,
            type: 'user' as const,
            content: searchData.searchQuery,
            timestamp: new Date().toISOString(),
        };
        
        console.log(TAG, 'Created user message:', userMessage);
        return userMessage;
    };

    /**
     * Creates complete chat data object with backend chat ID
     * @param searchData - Original search parameters
     * @param userMessage - User's initial message
     * @param aiMessage - AI's response message
     * @param backendChatId - Chat ID from backend
     * @param backendTitle - Title from backend
     * @param backendLocation - Location from backend
     * @returns Complete chat data structure
     */
    const createChatDataWithBackendId = (
        searchData: SearchData, 
        userMessage: ChatMessage, 
        aiMessage: ChatMessage,
        backendChatId: string,
        backendTitle: string,
        backendLocation: string
    ): ChatData => {
        const chatData = {
            id: backendChatId,
            title: backendTitle,
            location: backendLocation,
            messages: [userMessage, aiMessage],
            searchData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        
        console.log(TAG, 'Created chat data structure with backend UUID:', {
            id: chatData.id,
            title: chatData.title,
            location: chatData.location,
            messageCount: chatData.messages.length,
            searchQuery: searchData.searchQuery,
            backendProvided: true
        });
        
        return chatData;
    };

    /**
     * Generates a readable title from search query with proper capitalization
     * @param searchQuery - User's search input
     * @returns Formatted title for chat with first word capitalized
     */
    const generateChatTitle = (searchQuery: string): string => {
        const maxLength = 50;
        
        // Trim and handle empty queries
        const trimmedQuery = searchQuery.trim();
        if (!trimmedQuery) {
            return 'Untitled Chat';
        }
        
        // Truncate if necessary
        const truncatedQuery = trimmedQuery.length > maxLength 
            ? `${trimmedQuery.substring(0, maxLength)}...`
            : trimmedQuery;
        
        // Capitalize the first word
        const capitalizedTitle = truncatedQuery.charAt(0).toUpperCase() + truncatedQuery.slice(1);
            
        console.log(TAG, 'Generated chat title:', {
            original: searchQuery,
            capitalized: capitalizedTitle
        });
        return capitalizedTitle;
    };

    // ========================================
    // API COMMUNICATION
    // ========================================
    
    /**
     * Fetches AI response from backend API
     * @param searchData - Search parameters and filters
     * @param userMessage - User's message content
     * @returns AI response message and backend chat ID
     */
    const fetchAIResponse = async (searchData: SearchData, userMessage: ChatMessage): Promise<{ message: ChatMessage; chatId: string; title: string; location: string }> => {
        console.log(TAG, 'Starting API request to /api/plan');
        console.log(TAG, 'Request payload:', {
            searchData: {
                ...searchData,
                filters: {
                    ...searchData.filters,
                    priceRange: searchData.filters.priceRange ? `${searchData.filters.priceRange} (${PRICE_RANGE_MAP[searchData.filters.priceRange as keyof typeof PRICE_RANGE_MAP] || 'unknown'})` : undefined
                }
            },
            userMessage: userMessage.content
        });

        // Include authorization header if user is authenticated
        const headers = {
            ...DEFAULT_HEADERS,
            ...(isAuthenticated && token && { Authorization: `Bearer ${token}` })
        };

        const response = await fetch(API_URLS.PLAN_GENERATION, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                searchData,
                userMessage: userMessage.content,
            }),
        });

        console.log(TAG, 'API response status:', response.status);

        if (!response.ok) {
            const errorMessage = `HTTP error! status: ${response.status}`;
            console.error(TAG, 'API request failed:', errorMessage);
            throw new Error(errorMessage);
        }

        const result: ApiResponse = await response.json();
        console.log(TAG, 'API response data:', {
            success: result.success,
            hasResponse: !!result.response,
            chatId: result.chatId,
            responseLength: result.response?.length,
            error: result.error
        });

        const aiMessage = {
            id: `ai_${result.chatId}_1`, // Use backend chatId for message ID
            type: 'ai' as const,
            content: result.response || 'I found some great options for you!',
            timestamp: new Date().toISOString(),
            city: result.city,
            practicalTips: result.practicalTips,
            locations: result.locations,
        };

        console.log(TAG, 'Created AI message with backend chatId:', {
            messageId: aiMessage.id,
            chatId: result.chatId,
            locationCount: result.locations?.length || 0
        });
        return { 
            message: aiMessage, 
            chatId: result.chatId, 
            title: result.title, 
            location: result.location 
        };
    };

    // ========================================
    // ERROR HANDLING
    // ========================================
    
    /**
     * Handles chat initialization errors
     * @param error - Error object or message
     */
    const handleChatError = (error: unknown): void => {
        console.error(TAG, 'Chat error occurred:', error);
        setIsLoading(false);
        
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'An unexpected error occurred';

        console.log(TAG, 'Showing error alert to user:', errorMessage);

        Alert.alert(
            'Connection Error',
            `Failed to get AI response: ${errorMessage}`,
            [
                {
                    text: 'Go Back',
                    onPress: () => {
                        console.log(TAG, 'User chose to go back after error');
                        router.back();
                    },
                },
                {
                    text: 'Retry',
                    onPress: () => {
                        console.log(TAG, 'User chose to retry after error');
                        setIsInitialized(false);
                        setIsLoading(true);
                        initializeChat();
                    },
                },
            ]
        );
    };

    // ========================================
    // LOCATION AND MAPIT HELPERS
    // ========================================
    
    /**
     * Shows bottom sheet for location options
     * @param location - Selected location
     */
    const showLocationBottomSheet = (location: Location): void => {
        console.log(TAG, 'Showing Location Bottom Sheet for location:', location.name);
        setBottomSheetLocation(location);
        bottomSheetRef.current?.snapToIndex(1);
    };

    /**
     * Closes the bottom sheet modal
     */
    const hideBottomSheet = (): void => {
        console.log(TAG, 'Hiding Location Bottom Sheet');
        bottomSheetRef.current?.close();
        setBottomSheetLocation(null);
    };

    /**
     * Renders backdrop for bottom sheet
     */
    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    /**
     * Gets detail sections for expanded view
     * @param location - Selected location
     * @returns Array of detail sections
     */
    const getDetailSections = (location: Location): DetailSection[] => {
        const sections: DetailSection[] = [
            {
                id: 'info',
                type: 'info',
                data: {
                    name: location.name,
                    address: location.address,
                    description: location.description,
                    category: location.category,
                    estimatedTime: location.estimatedTime,
                    priceRange: location.priceRange,
                    rating: location.rating,
                    user_ratings_total: location.user_ratings_total,
                    phone: location.phone
                }
            }
        ];

        // Add map section
        if (location.google_place_id || location.address) {
            sections.push({
                id: 'map',
                type: 'map',
                data: {
                    name: location.name,
                    address: location.address,
                    google_place_id: location.google_place_id
                }
            });
        }

        // Add hours section if available
        if (location.opening_hours?.weekday_text && location.opening_hours.weekday_text.length > 0) {
            sections.push({
                id: 'hours',
                type: 'hours',
                data: {
                    open_now: location.opening_hours.open_now,
                    weekday_text: location.opening_hours.weekday_text
                }
            });
        }

        return sections;
    };

    /**
     * Handles re-generation of plan excluding a specific location
     * @param location - Location to exclude when re-generating plan
     */
    const handleRegenerateLocation = (location: Location): void => {
        console.log(TAG, 'Re-generating plan excluding location:', location.name);
        Alert.alert(
            'Re-generate Plan',
            `Generate a new plan without ${location.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Confirm', 
                    onPress: () => {
                        // Navigate back to search with pre-filled location
                        router.push({
                        pathname: '/(tabs)',
                        params: {
                            prefillLocation: location.address,
                            prefillQuery: `More places like ${location.name}`
                            }
                        });
                    }
                }
            ]
        );
    };

    /**
     * Handles opening website or Google search for a location
     * @param location - Location to open website/search for
     */
    const handleOpenWebsite = (location: Location): void => {
        console.log(TAG, 'Opening website/search for location:', location.name);
        
        let url: string;
        
        if (location.website && location.website !== 'Not available') {
            // Open the actual website
            url = location.website;
        } else {
            // Create Google search URL
            const searchQuery = encodeURIComponent(`${location.name} ${location.address}`);
            url = `https://www.google.com/search?q=${searchQuery}`;
        }
        
        Linking.openURL(url).catch((error) => {
            console.error(TAG, 'Failed to open URL:', error);
            Alert.alert('Error', 'Failed to open website or search');
        });
    };

    /**
     * Opens directions to a specific location
     * @param location - Location to get directions to
     */
    const handleGetDirections = async (location: Location): Promise<void> => {
        console.log(TAG, 'Getting directions to location:', location.name);
        const encodedAddress = encodeURIComponent(location.address);
        try {
            const provider = await getMapProvider();
            let mapsUrl: string;
            if (provider === 'apple') {
                mapsUrl = `http://maps.apple.com/?q=${encodedAddress}`;
            } else {
                mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
            }
            Linking.openURL(mapsUrl).catch((error) => {
                console.error(TAG, 'Failed to open maps:', error);
                Alert.alert('Error', 'Failed to open maps application');
            });
        } catch (error) {
            console.error(TAG, 'Error getting map provider:', error);
            Alert.alert('Error', 'Failed to determine map provider.');
        }
    };

    /**
     * Generates and opens Google Maps trip link for all locations
     */
    const handleMapIT = async (): Promise<void> => {
        if (locations.length === 0) {
            Alert.alert('No Locations', 'No locations available to create a trip map.');
            return;
        }

        console.log(TAG, 'Generating MapIT link for', locations.length, 'locations');
        setIsGeneratingMapLink(true);

        try {
            const provider = await getMapProvider();
            const headers = {
                ...DEFAULT_HEADERS,
                ...(isAuthenticated && token && { Authorization: `Bearer ${token}` })
            };

            const response = await fetch(`${API_URLS.PLAN_GENERATION}/mapit`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    locations: locations,
                    travelMode: 'driving'
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log(TAG, 'Generated map link:', result.mapUrl);

            let mapUrl = result.mapUrl;
            if (provider === 'apple') {
                // Try to convert Google Maps URL to Apple Maps format (best effort)
                // We'll just use the first location as destination for Apple Maps
                const dest = encodeURIComponent(locations[locations.length - 1].address);
                mapUrl = `http://maps.apple.com/?daddr=${dest}`;
            }

            Linking.openURL(mapUrl).catch((error) => {
                console.error(TAG, 'Failed to open map link:', error);
                if (provider === 'apple') {
                    Alert.alert('Error', 'Failed to open Apple Maps');
                } else {
                    Alert.alert('Error', 'Failed to open Google Maps');
                }
            });

        } catch (error) {
            console.error(TAG, 'Error generating map link:', error);
            Alert.alert('Error', 'Failed to generate map link. Please try again.');
        } finally {
            setIsGeneratingMapLink(false);
        }
    };

    // ========================================
    // HISTORY INTEGRATION
    // ========================================
    
    /**
     * Updates the trip data for history integration
     * @param chatId - Chat/trip ID
     * @param city - City from AI response
     * @param locations - Array of locations
     */
    const updateTripDataForHistory = (chatId: string, city: string, locations: Location[]): void => {
        console.log(TAG, 'Updating trip data for history integration:', {
            chatId,
            city,
            locationCount: locations.length
        });
        
        // This will be used by history.tsx to populate the location field
        // The location field in APITripData interface should use the city from AI response
        // rather than the extracted location from search query
        
        // Store this data in the chat data for retrieval by history screen
        if (chatData) {
            const updatedChatData = {
                ...chatData,
                location: city, // Use AI-provided city instead of extracted location
                searchData: {
                    ...chatData.searchData,
                    aiGeneratedCity: city,
                    aiGeneratedLocations: locations
                }
            };
            setChatData(updatedChatData);
            console.log(TAG, 'Updated chat data with AI city and locations for history');
        }
    };

    // ========================================
    // UI HELPERS
    // ========================================
    
    /**
     * Handles scroll events to show/hide MapIT button based on scroll direction
     * @param event - Scroll event from ScrollView
     */
    const handleScroll = (event: any): void => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const scrollDirection = currentScrollY > lastScrollY.current ? 'down' : 'up';
        const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);
        
        // Only animate if scroll delta is significant (prevents jitter)
        if (scrollDelta > 5) {
            if (scrollDirection === 'down' && currentScrollY > 100) {
                // Hide button when scrolling down (after scrolling past 100px)
                Animated.timing(mapItButtonAnimation, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            } else if (scrollDirection === 'up') {
                // Show button when scrolling up
                Animated.timing(mapItButtonAnimation, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            }
        }
        
        lastScrollY.current = currentScrollY;
    };
    
    /**
     * Scrolls chat to bottom for new messages
     */
    const scrollToBottom = (): void => {
        console.log(TAG, 'Scrolling to bottom of chat');
        scrollViewRef.current?.scrollToEnd({ animated: true });
    };

    /**
     * Formats filter data into readable text
     * @param filters - Filter object from search data
     * @returns Formatted filter string
     */
    const formatFilters = (filters: SearchData['filters']): string => {
        const filterTexts: string[] = [];
        
        if (filters.timeOfDay && filters.timeOfDay.length > 0) {
            filterTexts.push(`Time: ${filters.timeOfDay.join(', ')}`);
        }
        if (filters.environment) {
            filterTexts.push(`Environment: ${filters.environment}`);
        }
        if (filters.groupSize) {
            filterTexts.push(`Group: ${filters.groupSize}`);
        }
        if (filters.planTransit) {
            filterTexts.push('Transit planned');
        }
        if (filters.planFood) {
            const priceDisplay = filters.priceRange 
                ? PRICE_RANGE_MAP[filters.priceRange as keyof typeof PRICE_RANGE_MAP] || 'unknown'
                : 'included';
            filterTexts.push(`Food: ${priceDisplay}`);
        }
        if (filters.specialOption && filters.specialOption !== 'auto') {
            filterTexts.push(`Style: ${filters.specialOption}`);
        }

        const formattedText = filterTexts.join(' • ');
        console.log(TAG, 'Formatted filters:', formattedText);
        return formattedText;
    };

    // ========================================
    // HELPER FUNCTIONS
    // ========================================
    
    // Transit icon mapping for Lucide React Native
    const transitIconMap: { [key: string]: React.ComponentType<any> } = {
        'bus': BusFront,
        'subway': TrainFrontTunnel,
        'metro': TrainFrontTunnel,
        'tram': TramFront,
        'streetcar': TramFront,
        'train': TrainFront,
        'ferry': Ship,
        'walk': Footprints,
        'default': Info,
    };

    /**
     * Gets the appropriate icon component for transit types
     * @param transitType - The type of transit (bus, subway, tram, etc.)
     * @returns Lucide React Native icon component
     */
    const getTransitIcon = (transitType: string): React.ComponentType<any> => {
        const type = transitType.toLowerCase();
        if (type.includes('bus')) return transitIconMap.bus;
        if (type.includes('subway') || type.includes('metro')) return transitIconMap.subway;
        if (type.includes('tram') || type.includes('streetcar')) return transitIconMap.tram;
        if (type.includes('train')) return transitIconMap.train;
        if (type.includes('ferry')) return transitIconMap.ferry;
        if (type.includes('walk')) return transitIconMap.walk;
        return transitIconMap.default;
    };

    // ========================================
    // BOTTOM SHEET RENDER FUNCTIONS
    // ========================================

    /**
     * Renders detail section for FlashList
     * @param item - Detail section data
     * @returns JSX element for detail section
     */
    const renderDetailSection = ({ item }: { item: DetailSection }) => {
        switch (item.type) {
            case 'info':
                return (
                    <View style={styles.bottomSheetInfoSection}>
                        <View style={styles.bottomSheetRegenerateContainer}>
                            <TouchableOpacity
                                style={styles.bottomSheetRegenerateIcon}
                                onPress={() => {
                                    hideBottomSheet();
                                    handleRegenerateLocation(bottomSheetLocation!);
                                }}
                            >
                                <RotateCw size={ICON_SIZES.xl} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.bottomSheetLocationName}>{item.data.name}</Text>
                        <Text style={styles.bottomSheetLocationAddress}>{item.data.address}</Text>
                        
                        <View style={styles.bottomSheetMetaRow}>
                            <View style={styles.bottomSheetMetaItem}>
                                <Star size={ICON_SIZES.sm} color="#FFD700" />
                                <Text style={styles.bottomSheetRatingText}>
                                    {item.data.rating?.toFixed(1)}
                                </Text>
                            </View>
                            <View style={styles.bottomSheetMetaItem}>
                                <Tag size={ICON_SIZES.sm} color={COLORS.lightText} />
                                <Text style={styles.bottomSheetMetaText}>
                                    {item.data.category.charAt(0).toUpperCase() + item.data.category.slice(1)}
                                </Text>
                            </View>
                            <View style={styles.bottomSheetMetaItem}>
                                <Hourglass size={ICON_SIZES.sm} color={COLORS.lightText} />
                                <Text style={styles.bottomSheetMetaText}>{item.data.estimatedTime}</Text>
                            </View>
                            <View style={styles.bottomSheetMetaItem}>
                                <Text style={styles.bottomSheetMetaText}>{item.data.priceRange}</Text>
                            </View>
                        </View>

                        <Text style={styles.bottomSheetDescription}>{item.data.description}</Text>
                        
                        <View style={styles.bottomSheetActionButtons}>
                            {bottomSheetLocation?.website && bottomSheetLocation.website !== 'Not available' ? (
                                <TouchableOpacity
                                    style={styles.bottomSheetWebsiteButton}
                                    onPress={() => handleOpenWebsite(bottomSheetLocation!)}
                                >
                                    <Globe size={ICON_SIZES.sm} color={COLORS.primary} />
                                    <Text style={styles.bottomSheetWebsiteText}>Visit Website</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.bottomSheetWebsiteButton}
                                    onPress={() => handleOpenWebsite(bottomSheetLocation!)}
                                >
                                    <Search size={ICON_SIZES.sm} color={COLORS.primary} />
                                    <Text style={styles.bottomSheetWebsiteText}>Search on Google</Text>
                                </TouchableOpacity>
                            )}
                            
                            {item.data.phone && (
                                <TouchableOpacity
                                    style={styles.bottomSheetPhoneButton}
                                    onPress={() => Linking.openURL(`tel:${item.data.phone}`)}
                                >
                                    <Phone size={ICON_SIZES.sm} color={COLORS.primary} />
                                    <Text style={styles.bottomSheetPhoneText}>{item.data.phone}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        
                    </View>
                );

            case 'hours':
                return (
                    <View style={styles.bottomSheetHoursSection}>
                        <View style={styles.bottomSheetSectionHeader}>
                            <Clock size={20} color={COLORS.primary} />
                            <Text style={styles.bottomSheetSectionTitle}>Hours of Operation</Text>
                        </View>
                        
                        <View style={styles.bottomSheetHoursList}>
                            {item.data.weekday_text.map((hours: string, index: number) => (
                                <Text key={index} style={styles.bottomSheetHoursText}>
                                    {hours}
                                </Text>
                            ))}
                        </View>
                    </View>
                );

            case 'map':
                return (
                    <View style={styles.bottomSheetMapSection}>
                        <View style={styles.bottomSheetSectionHeader}>
                            <MapPin size={ICON_SIZES.xl} color={COLORS.primary} />
                            <Text style={styles.bottomSheetSectionTitle}>Location</Text>
                        </View>
                        
                        <TouchableOpacity
                            style={styles.bottomSheetMapContainer}
                            onPress={() => handleGetDirections(bottomSheetLocation!)}
                            activeOpacity={0.8}
                        >
                            <MapView
                                style={styles.bottomSheetMap}
                                initialRegion={{
                                    latitude: 37.78825, // Default coordinates - should be replaced with actual location coords
                                    longitude: -122.4324,
                                    latitudeDelta: 0.005,
                                    longitudeDelta: 0.005,
                                }}
                                scrollEnabled={false}
                                zoomEnabled={false}
                                rotateEnabled={false}
                                pitchEnabled={false}
                            >
                                <Marker
                                    coordinate={{
                                        latitude: 37.78825, // Default coordinates - should be replaced with actual location coords
                                        longitude: -122.4324,
                                    }}
                                />
                            </MapView>
                            <View style={styles.bottomSheetMapOverlay}>
                                <TouchableOpacity onPress={() => handleGetDirections(bottomSheetLocation!)}>
                                    <ExternalLink size={ICON_SIZES.xl} color={COLORS.white} />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </View>
                );

            default:
                return null;
        }
    };

    /**
     * Renders bottom sheet content based on current state
     * @returns JSX element for bottom sheet content
     */
    const renderBottomSheetContent = () => {
        if (!bottomSheetLocation) return null;

        // Show full details
        const sections = getDetailSections(bottomSheetLocation);
        return (
            <BottomSheetView style={styles.bottomSheetContent}>
                <FlashList
                    data={sections}
                    renderItem={renderDetailSection}
                    showsVerticalScrollIndicator={false}
                />
            </BottomSheetView>
        );
    };

    // ========================================
    // RENDER HELPERS
    // ========================================
    
    /**
     * Renders individual chat message with appropriate styling
     * @param message - Message data to render
     * @param index - Message index in array
     * @returns JSX element for message
     */
    const renderMessage = (message: ChatMessage, index: number): React.ReactElement => {
        const isUser = message.type === 'user';
        console.log(TAG, `Rendering message ${index}:`, {
            id: message.id,
            type: message.type,
            contentLength: message.content.length,
            isUser,
            hasLocations: message.locations && message.locations.length > 0
        });
        
        return (
            <View 
                key={message.id} 
                style={[
                    styles.messageContainer,
                    isUser ? styles.userMessageContainer : styles.aiMessageContainer
                ]}
            >
                <View 
                    style={[
                        styles.messageBubble,
                        isUser ? styles.userBubble : styles.aiBubble
                    ]}
                >
                    <Text 
                        style={[
                            styles.messageText,
                            isUser ? styles.userMessageText : styles.aiMessageText
                        ]}
                    >
                        {message.content}
                    </Text>
                    
                    {/* Display filters for user messages */}
                    {isUser && searchData && (
                        <Text style={styles.filterText}>
                            {formatFilters(searchData.filters)}
                        </Text>
                    )}
                    
                    {/* Display locations for AI messages */}
                    {!isUser && message.locations && message.locations.length > 0 && (
                        <View style={styles.locationsInChatContainer}>
                            {/* Uniform vertical timeline background */}
                            <View style={styles.timelineBackground} />
                            
                            {/* Vertical timeline of locations with transit info */}
                            {message.locations.map((location, locationIndex) => (
                                    <React.Fragment key={`location-fragment-${locationIndex}`}>
                                        {/* Location Item */}
                                        <View key={`location-${locationIndex}-${location.name}`} style={styles.timelineItemWrapper}>
                                            {/* Timeline indicator */}
                                            <View style={styles.timelineIndicator}>
                                                <View style={styles.timelineDot} />
                                            </View>
                                            
                                            {/* Time display */}
                                            <View style={styles.timeDisplayContainer}>
                                                <Text style={styles.timeDisplayText}>{location.time}</Text>
                                            </View>
                                            
                                            {/* Location content */}
                                            <TouchableOpacity
                                                style={styles.locationItemInChat}
                                                onPress={() => showLocationBottomSheet(location)}
                                                accessibilityLabel={`Location: ${location.name} at ${location.time}`}
                                                accessibilityRole="button"
                                            >
                                                <View style={styles.locationItemContent}>
                                                    <View style={styles.locationItemHeader}>
                                                        <Text style={styles.locationItemName} numberOfLines={1}>
                                                            {location.name}
                                                        </Text>
                                                        <View style={styles.locationItemMeta}>
                                                            <Text style={styles.locationItemCategory}>
                                                                {location.category.charAt(0).toUpperCase() + location.category.slice(1)}
                                                            </Text>
                                                            {location.rating && (
                                                                <View style={styles.locationItemRating}>
                                                                    <Star size={ICON_SIZES.xs} color="#FFD700" 
                                                                    />
                                                                    <Text style={styles.locationItemRatingText}>
                                                                        {location.rating.toFixed(1)}
                                                                    </Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    </View>
                                                    
                                                    <Text style={styles.locationItemAddress} numberOfLines={1}>
                                                        {location.address}
                                                    </Text>
                                                    
                                                    <Text style={styles.locationItemDescription} numberOfLines={2}>
                                                        {location.description}
                                                    </Text>
                                                    
                                                    <View style={styles.locationItemFooter}>
                                                        <View style={styles.locationItemTime}>
                                                            <Hourglass 
                                                                size={12} 
                                                                color={COLORS.lightText} 
                                                            />
                                                            <Text style={styles.locationItemTimeText}>
                                                                {location.estimatedTime}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.locationItemPriceStatus}>
                                                            <Text style={styles.locationItemPrice}>
                                                                {location.priceRange}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                        
                                        {/* Transit Information (between locations) */}
                                        {location.transitToNext && (
                                            <View key={`transit-${locationIndex}`} style={styles.transitInfoWrapper}>
                                                <View style={styles.transitIndicator}>
                                                    {(() => {
                                                        const TransitIcon = getTransitIcon(location.transitToNext.type);
                                                        return <TransitIcon size={16} color={COLORS.primary} />;
                                                    })()}
                                                </View>
                                                <View style={styles.transitDetails}>
                                                    <Text style={styles.transitText}>
                                                        {location.transitToNext.type} ({location.transitToNext.duration})
                                                    </Text>
                                                </View>
                                            </View>
                                        )}
                                    </React.Fragment>
                                ))}
                        </View>
                    )}
                    
                    {/* Display practical tips for AI messages */}
                    {!isUser && message.practicalTips && (
                        <View style={styles.practicalTipsContainer}>
                            <View style={styles.practicalTipsHeader}>
                                <Lightbulb size={16} color={COLORS.primary} />
                                <Text style={styles.practicalTipsTitle}>Trip Insights</Text>
                            </View>
                            <Text style={styles.practicalTipsText}>{message.practicalTips}</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    /**
     * Renders loading message with animated dots
     * @returns JSX element for loading state
     */
    const renderLoadingMessage = (): React.ReactElement => {
        console.log(TAG, 'Rendering loading message');
        
        return (
            <View style={[styles.messageContainer, styles.aiMessageContainer]}>
                <View style={[styles.messageBubble, styles.aiBubble]}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                        <Animated.View
                            style={[
                                styles.loadingDots,
                                {
                                    opacity: dotAnimation,
                                },
                            ]}
                        >
                            <Text style={styles.loadingText}>AI is thinking</Text>
                        </Animated.View>
                    </View>
                </View>
            </View>
        );
    };

    /**
     * Renders header with navigation and title
     * @returns JSX element for header
     */
    const renderHeader = (): React.ReactElement => {
        const title = chatData?.title || searchData?.searchQuery || 'New Chat';
        console.log(TAG, 'Rendering header with title:', title);
        
        return (
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => {
                        console.log(TAG, 'Back button pressed');
                        router.back();
                    }}
                    accessibilityLabel="Go back"
                    accessibilityRole="button"
                >
                    <ChevronLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {title}
                </Text>
                <View style={styles.headerSpacer} />
            </View>
        );
    };

    // ========================================
    // RENDER
    // ========================================
    console.log(TAG, 'Rendering component with state:', {
        isLoading,
        messageCount: messages.length,
        hasSearchData: !!searchData,
        hasChatData: !!chatData
    });

    return (
        <View style={styles.container}>
            {/* Header */}
            {renderHeader()}

            {/* Chat Messages */}
            <ScrollView 
                ref={scrollViewRef}
                style={styles.chatContainer}
                contentContainerStyle={styles.chatContent}
                onContentSizeChange={() => {
                    console.log(TAG, 'Content size changed, auto-scrolling');
                    scrollToBottom();
                }}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
            >
                {messages.map((message, index) => renderMessage(message, index))}
                {isLoading && renderLoadingMessage()}
            </ScrollView>

            {/* Full-width MapIT Button with scroll-based visibility */}
            {locations.length > 0 && (
                <Animated.View 
                    style={[
                        styles.mapItContainer,
                        {
                            opacity: mapItButtonAnimation,
                            transform: [{
                                translateY: mapItButtonAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [100, 0], // Slide down when hidden
                                }),
                            }],
                        }
                    ]}
                >
                    <TouchableOpacity 
                        style={[
                            styles.mapItButtonFullWidth,
                            isGeneratingMapLink && styles.mapItButtonFullWidthDisabled
                        ]}
                        onPress={handleMapIT}
                        disabled={isGeneratingMapLink}
                        accessibilityLabel="Create map trip"
                        accessibilityRole="button"
                    >
                        {isGeneratingMapLink ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                            <>
                                <Route size={20} color={COLORS.white} />
                                <Text style={styles.mapItButtonFullWidthText}>
                                    MapIT
                                </Text>
                                <MapPinned size={20} color={COLORS.white} />
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* Location Bottom Sheet */}
            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose={true}
                backdropComponent={renderBackdrop}
                onClose={() => setBottomSheetLocation(null)}
                handleIndicatorStyle={styles.bottomSheetIndicator}
                backgroundStyle={styles.bottomSheetBackground}
            >
                {renderBottomSheetContent()}
            </BottomSheet>
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
        backgroundColor: COLORS.background,
    },
    
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md + SPACING.xs, // 15
        paddingTop: CHAT_LAYOUT.statusBarPadding,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        ...SHADOWS.card,
    },
    backButton: {
        padding: SPACING.xs + 1, // 5
        borderRadius: SPACING.xl,
    },
    headerTitle: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.text,
        textAlign: 'center',
        marginHorizontal: SPACING.sm + SPACING.xs, // 10
    },
    headerSpacer: {
        width: 34, // Same width as back button for centering
    },
    
    // Chat Container
    chatContainer: {
        flex: 1,
    },
    chatContent: {
        padding: CHAT_LAYOUT.contentPadding,
        paddingBottom: SPACING.xxxl,
    },
    
    // Message Containers
    messageContainer: {
        marginVertical: CHAT_LAYOUT.messageMargin,
        maxWidth: CHAT_LAYOUT.maxBubbleWidth,
    },
    userMessageContainer: {
        alignSelf: 'flex-end',
    },
    aiMessageContainer: {
        alignSelf: 'flex-start',
        maxWidth: '100%',
        width: '100%',
    },
    
    // Message Bubbles
    messageBubble: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: CHAT_LAYOUT.messageBubbleRadius,
        ...SHADOWS.card,
    },
    userBubble: {
        backgroundColor: CHAT_COLORS.userBubble,
        borderBottomRightRadius: CHAT_LAYOUT.smallBubbleRadius,
    },
    aiBubble: {
        backgroundColor: CHAT_COLORS.aiBubble,
        borderBottomLeftRadius: CHAT_LAYOUT.smallBubbleRadius,
    },
    
    // Message Text
    messageText: {
        fontSize: TYPOGRAPHY.fontSize.base,
        lineHeight: TYPOGRAPHY.lineHeight.relaxed,
    },
    userMessageText: {
        color: CHAT_COLORS.userText,
    },
    aiMessageText: {
        color: CHAT_COLORS.aiText,
    },
    filterText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.white,
        marginTop: SPACING.sm,
        fontStyle: 'italic',
        lineHeight: SPACING.lg,
    },
    
    // Loading Animation
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loadingDots: {
        marginLeft: SPACING.sm,
    },
    loadingText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.lightText,
        fontStyle: 'italic',
    },

    // Locations in Chat
    locationsInChatContainer: {
        marginTop: SPACING.sm,
        paddingHorizontal: SPACING.sm,
        position: 'relative',
    },
    
    // Timeline styles
    timelineBackground: {
        position: 'absolute',
        left: SPACING.sm + 6, // Center with timeline dots (6px is half of dot width)
        top: SPACING.xs + 6, // Start from first dot center
        bottom: SPACING.xs + 6, // End at last dot center
        width: 2,
        backgroundColor: COLORS.border,
        zIndex: 0,
    },
    timelineItemWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
        position: 'relative',
        zIndex: 1,
    },
    timelineIndicator: {
        alignItems: 'center',
        marginRight: SPACING.sm,
        marginTop: SPACING.xs,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.white,
        ...SHADOWS.card,
    },
    timeDisplayContainer: {
        minWidth: 70,
        alignItems: 'center',
        marginRight: SPACING.sm,
        marginTop: SPACING.xs,
    },
    timeDisplayText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
        textAlign: 'center',
    },
    
    locationItemInChat: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.sm,
        padding: SPACING.sm,
        ...SHADOWS.card,
    },
    locationItemContent: {
        flex: 1,
    },
    locationItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs / 2,
    },
    locationItemName: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.text,
        marginRight: SPACING.xs,
    },
    locationItemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationItemCategory: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.lightText,
        marginRight: SPACING.xs,
    },
    locationItemRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationItemRatingText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.lightText,
        marginLeft: SPACING.xs,
    },
    locationItemAddress: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.text,
        marginBottom: SPACING.xs / 2,
    },
    locationItemDescription: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.text,
        marginBottom: SPACING.xs / 2,
    },
    locationItemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    locationItemTime: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationItemTimeText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.lightText,
        marginLeft: SPACING.xs,
    },
    locationItemPriceStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationItemPrice: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
    },

    // MapIT Button (Full-width)
    mapItContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SPACING.md,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        ...SHADOWS.card,
    },
    mapItButtonFullWidth: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: SPACING.md,
        paddingVertical: SPACING.md,
        ...SHADOWS.button,
    },
    mapItButtonFullWidthDisabled: {
        opacity: 0.7,
    },
    mapItButtonFullWidthText: {
        color: COLORS.white,
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        marginLeft: SPACING.md,
        marginRight: SPACING.md,
    },

    // Bottom Sheet Styles
    bottomSheetBackground: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        ...SHADOWS.card,
    },
    bottomSheetIndicator: {
        backgroundColor: COLORS.border,
        width: 40,
        height: 4,
    },
    bottomSheetContent: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
    },
    bottomSheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    bottomSheetTitle: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
        marginRight: SPACING.md,
    },

    // Info Section
    bottomSheetInfoSection: {
        paddingBottom: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        marginBottom: SPACING.lg,
        position: 'relative',
    },
    bottomSheetLocationName: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    bottomSheetLocationAddress: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.lightText,
        marginBottom: SPACING.md,
        lineHeight: TYPOGRAPHY.lineHeight.relaxed,
    },
    bottomSheetRatingText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.text,
        marginLeft: SPACING.xs,
    },
    bottomSheetDescription: {
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.text,
        lineHeight: TYPOGRAPHY.lineHeight.relaxed,
        marginBottom: SPACING.md,
    },
    bottomSheetMetaRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        marginBottom: SPACING.md,
        gap: SPACING.md,
    },
    bottomSheetMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    bottomSheetMetaText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.text,
        marginLeft: SPACING.xs,
    },
    bottomSheetPhoneButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        backgroundColor: COLORS.accent,
        borderRadius: RADIUS.md,
        alignSelf: 'flex-start',
    },
    bottomSheetPhoneText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.primary,
        marginLeft: SPACING.xs,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },

    // Action Buttons
    bottomSheetActionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    bottomSheetWebsiteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        backgroundColor: COLORS.accent,
        borderRadius: RADIUS.md,
        marginRight: SPACING.sm,
    },
    bottomSheetWebsiteText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.primary,
        marginLeft: SPACING.xs,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },

    // Regenerate Icon
    bottomSheetRegenerateContainer: {
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.md,
        zIndex: 1,
    },
    bottomSheetRegenerateIcon: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.button,
    },

    // Section Headers
    bottomSheetSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    bottomSheetSectionTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.text,
        marginLeft: SPACING.sm,
    },

    // Hours Section
    bottomSheetHoursSection: {
        paddingBottom: SPACING.lg,
        marginBottom: SPACING.lg,
    },

    bottomSheetHoursList: {
        gap: SPACING.xs,
    },
    bottomSheetHoursText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.text,
        lineHeight: TYPOGRAPHY.lineHeight.relaxed,
    },

    // Map Section
    bottomSheetMapSection: {
        paddingBottom: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        marginBottom: SPACING.lg,
    },
    bottomSheetMapContainer: {
        position: 'relative',
        height: 200,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        ...SHADOWS.card,
    },
    bottomSheetMap: {
        flex: 1,
    },
    bottomSheetMapOverlay: {
        position: 'absolute',
        top: SPACING.sm,
        right: SPACING.sm,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md,
        padding: SPACING.sm,
        ...SHADOWS.button,
    },

    // Practical Tips styles
    practicalTipsContainer: {
        marginTop: SPACING.md,
        padding: SPACING.md,
        backgroundColor: '#f8f9fa',
        borderRadius: RADIUS.md,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
    },
    practicalTipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    practicalTipsTitle: {
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
        marginLeft: SPACING.xs,
    },
    practicalTipsText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        lineHeight: 20,
        color: COLORS.text,
    },
    
    // Transit styles
    transitInfoWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xs,
        marginLeft: SPACING.xs,
        position: 'relative',
        zIndex: 1,
    },
    transitIndicator: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.accent,
    },
    transitDetails: {
        flex: 1,
    },
    transitText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.lightText,
        fontStyle: 'italic',
    },
}); 
