/**
 * ChatScreen Component
 * 
 * Displays a chat interface with AI responses based on user search queries and filters.
 * Features loading states, message bubbles, error handling, and automatic chat persistence.
 * Integrates with backend API for AI response generation and chat storage.
 * 
 * @author Rongbin Gu (@rongbin99)
 */

// ========================================
// IMPORTS
// ========================================
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { API_URLS, DEFAULT_HEADERS } from '@/constants/ApiConfig';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/constants/DesignTokens';
import { saveChatToLocalStorage as saveToStorage, StoredChatData } from '@/constants/StorageUtils';

// ========================================
// TYPE DEFINITIONS
// ========================================

/**
 * Individual chat message structure
 */
interface ChatMessage {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: string;
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
    chatId: string;
    error?: string;
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
    
    // Chat state
    const [isLoading, setIsLoading] = useState(true);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatData, setChatData] = useState<ChatData | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Animation references
    const scrollViewRef = useRef<ScrollView>(null);
    const dotAnimation = useRef(new Animated.Value(0)).current;

    // Parsed search data from navigation params
    const searchData: SearchData | null = params.searchData 
        ? JSON.parse(params.searchData as string) 
        : null;

    console.log(TAG, 'Component initialized with params:', {
        hasSearchData: !!searchData,
        chatId: params.chatId,
        existingChat: params.existingChat,
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
        
        // Prevent multiple initializations
        if (isInitialized) {
            console.log(TAG, 'Chat already initialized, skipping');
            return;
        }
        
        if (searchData) {
            console.log(TAG, 'Found search data, starting new chat initialization');
            setIsInitialized(true);
            initializeChat();
        } else {
            console.log(TAG, 'No search data found, handling missing data scenario');
            setIsInitialized(true);
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
            const aiResponse = await fetchAIResponse(searchData, userMessage);
            console.log(TAG, 'AI response received:', aiResponse);
            
            // Create complete chat data
            console.log(TAG, 'Creating complete chat data structure');
            const newChatData = createChatData(searchData, userMessage, aiResponse);
            console.log(TAG, 'Chat data created:', {
                id: newChatData.id,
                title: newChatData.title,
                messageCount: newChatData.messages.length
            });
            
            // Update state
            setMessages([userMessage, aiResponse]);
            setChatData(newChatData);
            
            // Persist chat for history
            console.log(TAG, 'Saving chat to storage for history');
            await saveChatToStorage(newChatData);
            
            setIsLoading(false);
            console.log(TAG, 'Chat initialization completed successfully');
            
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
     * Creates complete chat data object
     * @param searchData - Original search parameters
     * @param userMessage - User's initial message
     * @param aiMessage - AI's response message
     * @returns Complete chat data structure
     */
    const createChatData = (
        searchData: SearchData, 
        userMessage: ChatMessage, 
        aiMessage: ChatMessage
    ): ChatData => {
        const chatData = {
            id: `chat_${Date.now()}`,
            title: generateChatTitle(searchData.searchQuery),
            location: extractLocationFromSearchData(searchData),
            messages: [userMessage, aiMessage],
            searchData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        
        console.log(TAG, 'Created chat data structure:', {
            id: chatData.id,
            title: chatData.title,
            location: chatData.location,
            messageCount: chatData.messages.length,
            searchQuery: searchData.searchQuery
        });
        
        return chatData;
    };

    /**
     * Generates a readable title from search query
     * @param searchQuery - User's search input
     * @returns Formatted title for chat
     */
    const generateChatTitle = (searchQuery: string): string => {
        const maxLength = 50;
        const title = searchQuery.length > maxLength 
            ? `${searchQuery.substring(0, maxLength)}...`
            : searchQuery;
            
        console.log(TAG, 'Generated chat title:', title);
        return title;
    };

    // ========================================
    // API COMMUNICATION
    // ========================================
    
    /**
     * Fetches AI response from backend API
     * @param searchData - Search parameters and filters
     * @param userMessage - User's message content
     * @returns AI response message
     */
    const fetchAIResponse = async (searchData: SearchData, userMessage: ChatMessage): Promise<ChatMessage> => {
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

        const response = await fetch(API_URLS.PLAN_GENERATION, {
            method: 'POST',
            headers: DEFAULT_HEADERS,
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
            id: `ai_${Date.now()}`,
            type: 'ai' as const,
            content: result.response || 'I found some great options for you!',
            timestamp: new Date().toISOString(),
        };

        console.log(TAG, 'Created AI message:', aiMessage);
        return aiMessage;
    };

    // ========================================
    // DATA PERSISTENCE
    // ========================================
    
    /**
     * Saves chat data to both backend and local storage for offline support
     * @param chat - Complete chat data to save
     */
    const saveChatToStorage = async (chat: ChatData): Promise<void> => {
        // Convert chat data to storage format
        const storedChat: StoredChatData = {
            id: chat.id,
            title: chat.title,
            location: chat.location,
            searchData: chat.searchData,
            messages: chat.messages,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
        };
        
        // Always save to local storage first for offline functionality
        await saveToStorage(storedChat);
        
        try {
            console.log(TAG, 'Attempting to save chat to backend');
            
            console.log(TAG, 'Sending chat to backend:', {
                id: storedChat.id,
                title: storedChat.title,
                location: storedChat.location,
                messageCount: storedChat.messages.length,
            });
            
            // Send to backend API
            const response = await fetch(API_URLS.SAVE_CHAT, {
                method: 'POST',
                headers: DEFAULT_HEADERS,
                body: JSON.stringify(storedChat),
            });
            
            console.log(TAG, 'Save chat API response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Failed to save chat: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log(TAG, 'Chat saved to backend successfully:', result);
            
        } catch (error) {
            console.error(TAG, 'Error saving chat to backend:', error);
            console.log(TAG, 'Chat is still saved locally for offline access');
            // Non-critical error - chat is already saved locally
        }
    };

    /**
     * Extracts location from search data during chat creation with enhanced pattern matching
     * Note: This is only used once during chat creation to populate the ChatData.location field
     * @param searchData - Search parameters
     * @returns Location string for display
     */
    const extractLocationFromSearchData = (searchData: SearchData): string => {
        // Input validation
        if (!searchData || !searchData.searchQuery) {
            console.warn(TAG, 'Invalid search data provided to extractLocationFromSearchData');
            return 'Unknown Location';
        }

        const originalQuery = searchData.searchQuery.trim();
        
        // Handle empty or very short queries
        if (originalQuery.length === 0) {
            console.warn(TAG, 'Empty search query provided');
            return 'Unknown Location';
        }

        if (originalQuery.length <= 2) {
            console.warn(TAG, 'Search query too short for location extraction');
            return originalQuery;
        }

        const query = originalQuery.toLowerCase();
        console.log(TAG, 'Extracting location from query:', originalQuery);

        // Enhanced location patterns with priority order
        const locationPatterns = [
            // Most specific patterns first
            { pattern: ' near ', description: 'near pattern' },
            { pattern: ' in ', description: 'in pattern' },
            { pattern: ' at ', description: 'at pattern' },
            { pattern: ' around ', description: 'around pattern' },
            { pattern: ' from ', description: 'from pattern' },
            { pattern: ' to ', description: 'to pattern' },
            { pattern: ' by ', description: 'by pattern' },
            { pattern: ' close to ', description: 'close to pattern' },
            { pattern: ' next to ', description: 'next to pattern' },
        ];

        // Try each pattern in order
        for (const { pattern, description } of locationPatterns) {
            if (query.includes(pattern)) {
                const parts = query.split(pattern);
                let location = parts[parts.length - 1].trim();
                
                // Clean up the extracted location
                location = cleanLocationString(location, originalQuery);
                
                if (location && location.length > 0) {
                    console.log(TAG, `Found location using ${description}:`, location);
                    return location;
                }
            }
        }

        // Try alternative patterns for common queries
        const alternativeLocation = extractAlternativeLocationPatterns(query, originalQuery);
        if (alternativeLocation) {
            console.log(TAG, 'Found location using alternative pattern:', alternativeLocation);
            return alternativeLocation;
        }

        // Fallback: use the original query with length limit
        const fallbackLocation = originalQuery.length > 50 
            ? `${originalQuery.substring(0, 50).trim()}...`
            : originalQuery;
            
        console.log(TAG, 'No location pattern found, using fallback:', fallbackLocation);
        return fallbackLocation;
    };

    /**
     * Cleans and validates extracted location string
     * @param location - Raw extracted location string
     * @param originalQuery - Original search query for context
     * @returns Cleaned location string
     */
    const cleanLocationString = (location: string, originalQuery: string): string => {
        if (!location || typeof location !== 'string') {
            return '';
        }

        let cleaned = location.trim();

        // Remove common trailing words that aren't part of location
        const trailingWordsToRemove = [
            'for', 'with', 'and', 'or', 'but', 'so', 'yet', 'because',
            'restaurants', 'food', 'places', 'activities', 'things',
            'coffee', 'dinner', 'lunch', 'breakfast', 'shopping',
            'today', 'tomorrow', 'tonight', 'weekend'
        ];

        const words = cleaned.split(' ');
        let cleanedWords = [...words];

        // Remove trailing non-location words
        while (cleanedWords.length > 0) {
            const lastWord = cleanedWords[cleanedWords.length - 1].toLowerCase();
            if (trailingWordsToRemove.includes(lastWord)) {
                cleanedWords.pop();
            } else {
                break;
            }
        }

        cleaned = cleanedWords.join(' ').trim();

        // Minimum length validation
        if (cleaned.length < 2) {
            return '';
        }

        // Maximum length with intelligent truncation
        if (cleaned.length > 40) {
            // Try to truncate at word boundary
            const truncated = cleaned.substring(0, 40);
            const lastSpaceIndex = truncated.lastIndexOf(' ');
            
            if (lastSpaceIndex > 20) {
                cleaned = truncated.substring(0, lastSpaceIndex) + '...';
            } else {
                cleaned = truncated + '...';
            }
        }

        // Capitalize first letter of each word for display
        cleaned = cleaned.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        return cleaned;
    };

    /**
     * Extracts location using alternative patterns and heuristics
     * @param query - Lowercase search query
     * @param originalQuery - Original cased search query
     * @returns Extracted location or null
     */
    const extractAlternativeLocationPatterns = (query: string, originalQuery: string): string | null => {
        // Pattern: "restaurants [in] downtown seattle" -> "downtown seattle"
        const restaurantPattern = /(?:restaurants?|food|dining|eat|coffee|bars?)\s+(?:in\s+)?(.+)/i;
        let match = originalQuery.match(restaurantPattern);
        if (match && match[1]) {
            const location = cleanLocationString(match[1], originalQuery);
            if (location.length > 2) return location;
        }

        // Pattern: "things to do [in] paris" -> "paris"
        const activitiesPattern = /(?:things\s+to\s+do|activities|attractions|visit|explore)\s+(?:in\s+)?(.+)/i;
        match = originalQuery.match(activitiesPattern);
        if (match && match[1]) {
            const location = cleanLocationString(match[1], originalQuery);
            if (location.length > 2) return location;
        }

        // Pattern: "show me [places in] tokyo" -> "tokyo"
        const showMePattern = /(?:show\s+me|find\s+me|get\s+me)\s+(?:places\s+(?:in\s+)?|.*?(?:in\s+))(.+)/i;
        match = originalQuery.match(showMePattern);
        if (match && match[1]) {
            const location = cleanLocationString(match[1], originalQuery);
            if (location.length > 2) return location;
        }

        // Pattern: Look for common city/state/country patterns
        const locationWords = [
            'city', 'town', 'village', 'downtown', 'uptown', 'district',
            'beach', 'park', 'center', 'square', 'street', 'avenue',
            'county', 'state', 'province', 'country'
        ];
        
        for (const locWord of locationWords) {
            if (query.includes(locWord)) {
                // Extract context around the location word
                const index = query.indexOf(locWord);
                const start = Math.max(0, index - 20);
                const end = Math.min(query.length, index + locWord.length + 20);
                const context = originalQuery.substring(start, end).trim();
                
                const contextLocation = cleanLocationString(context, originalQuery);
                if (contextLocation.length > 2) {
                    return contextLocation;
                }
            }
        }

        return null;
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
    // UI HELPERS
    // ========================================
    
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
            isUser
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
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
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
                showsVerticalScrollIndicator={false}
            >
                {messages.map((message, index) => renderMessage(message, index))}
                {isLoading && renderLoadingMessage()}
            </ScrollView>
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
}); 
