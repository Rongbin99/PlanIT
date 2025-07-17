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
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { API_URLS, DEFAULT_HEADERS } from '@/constants/ApiConfig';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/constants/DesignTokens';
import { saveChatToLocalStorage as saveToStorage, StoredChatData } from '@/constants/StorageUtils';
import { useAuth } from '@/contexts/AuthContext';

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
    title: string;
    location: string;
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
    
    // Auth context
    const { user, isAuthenticated, token } = useAuth();
    
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
            
            console.log(TAG, 'Chat initialization completed successfully with backend UUID:', {
                chatId: backendChatId,
                title: newChatData.title,
                messageCount: newChatData.messages.length,
                userMessageId: updatedUserMessage.id,
                aiMessageId: aiResponse.id
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
        };

        console.log(TAG, 'Created AI message with backend chatId:', {
            messageId: aiMessage.id,
            chatId: result.chatId
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
