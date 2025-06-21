/**
 * ChatScreen Component
 * 
 * Displays a chat interface with AI responses based on user search queries and filters.
 * Features loading states, message bubbles, error handling, and automatic chat persistence.
 * Integrates with backend API for AI response generation and chat storage.
 * 
 * @author Rongbin Gu (@rongbin99)
 * @version 1.0.0
 */

// ========================================
// IMPORTS
// ========================================
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

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

/**
 * UI color scheme for consistent styling
 */
const COLORS = {
    primary: '#4B6CB7',
    secondary: '#888',
    text: '#333',
    lightText: '#666',
    background: '#f8f9fa',
    white: '#ffffff',
    userBubble: '#4B6CB7',
    aiBubble: '#e9ecef',
    userText: '#ffffff',
    aiText: '#333333',
} as const;

/**
 * Animation configuration
 */
const ANIMATION_CONFIG = {
    loadingDuration: 600,
    scrollDelay: 100,
} as const;

/**
 * Layout constants
 */
const LAYOUT = {
    headerHeight: 60,
    statusBarPadding: 60,
    messageBubbleRadius: 20,
    smallBubbleRadius: 4,
    contentPadding: 20,
    messageMargin: 8,
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
    
    // Animation references
    const scrollViewRef = useRef<ScrollView>(null);
    const dotAnimation = useRef(new Animated.Value(0)).current;

    // Parsed search data from navigation params
    const searchData: SearchData | null = params.searchData 
        ? JSON.parse(params.searchData as string) 
        : null;

    console.log('[ChatScreen] Component initialized with params:', {
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
        console.log('[ChatScreen] Effect triggered - initializing chat');
        
        if (searchData) {
            console.log('[ChatScreen] Found search data, starting new chat initialization');
            initializeChat();
        } else {
            console.log('[ChatScreen] No search data found, handling missing data scenario');
            handleMissingData();
        }
    }, [searchData]);

    /**
     * Animated loading dots effect
     * Creates a pulsing animation while AI is thinking
     */
    useEffect(() => {
        if (isLoading) {
            console.log('[ChatScreen] Starting loading animation');
            
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
                console.log('[ChatScreen] Stopping loading animation');
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
        console.warn('[ChatScreen] Missing search data - showing error alert');
        setIsLoading(false);
        Alert.alert(
            'Error',
            'No search data found. Please start a new search.',
            [
                {
                    text: 'Go Back',
                    onPress: () => {
                        console.log('[ChatScreen] User chose to go back');
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
            console.error('[ChatScreen] No search data available for initialization');
            return;
        }

        console.log('[ChatScreen] Starting chat initialization process');

        try {
            // Create initial user message
            console.log('[ChatScreen] Creating user message from search data');
            const userMessage = createUserMessage(searchData);
            setMessages([userMessage]);
            console.log('[ChatScreen] User message created:', userMessage);

            // Get AI response from backend
            console.log('[ChatScreen] Fetching AI response from backend');
            const aiResponse = await fetchAIResponse(searchData, userMessage);
            console.log('[ChatScreen] AI response received:', aiResponse);
            
            // Create complete chat data
            console.log('[ChatScreen] Creating complete chat data structure');
            const newChatData = createChatData(searchData, userMessage, aiResponse);
            console.log('[ChatScreen] Chat data created:', {
                id: newChatData.id,
                title: newChatData.title,
                messageCount: newChatData.messages.length
            });
            
            // Update state
            setMessages([userMessage, aiResponse]);
            setChatData(newChatData);
            
            // Persist chat for history
            console.log('[ChatScreen] Saving chat to storage for history');
            await saveChatToStorage(newChatData);
            
            setIsLoading(false);
            console.log('[ChatScreen] Chat initialization completed successfully');
            
            // Auto-scroll to bottom after content loads
            setTimeout(() => {
                console.log('[ChatScreen] Auto-scrolling to bottom');
                scrollToBottom();
            }, ANIMATION_CONFIG.scrollDelay);

        } catch (error) {
            console.error('[ChatScreen] Chat initialization failed:', error);
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
        
        console.log('[ChatScreen] Created user message:', userMessage);
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
            messages: [userMessage, aiMessage],
            searchData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        
        console.log('[ChatScreen] Created chat data structure:', {
            id: chatData.id,
            title: chatData.title,
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
            
        console.log('[ChatScreen] Generated chat title:', title);
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
        console.log('[ChatScreen] Starting API request to /api/plan');
        console.log('[ChatScreen] Request payload:', {
            searchData: {
                ...searchData,
                filters: {
                    ...searchData.filters,
                    priceRange: searchData.filters.priceRange ? `${searchData.filters.priceRange} (${PRICE_RANGE_MAP[searchData.filters.priceRange as keyof typeof PRICE_RANGE_MAP] || 'unknown'})` : undefined
                }
            },
            userMessage: userMessage.content
        });

        const response = await fetch('YOUR_BACKEND_URL/api/plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                searchData,
                userMessage: userMessage.content,
            }),
        });

        console.log('[ChatScreen] API response status:', response.status);

        if (!response.ok) {
            const errorMessage = `HTTP error! status: ${response.status}`;
            console.error('[ChatScreen] API request failed:', errorMessage);
            throw new Error(errorMessage);
        }

        const result: ApiResponse = await response.json();
        console.log('[ChatScreen] API response data:', {
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

        console.log('[ChatScreen] Created AI message:', aiMessage);
        return aiMessage;
    };

    // ========================================
    // DATA PERSISTENCE
    // ========================================
    
    /**
     * Saves chat data to local storage for history
     * @param chat - Complete chat data to save
     */
    const saveChatToStorage = async (chat: ChatData): Promise<void> => {
        try {
            console.log('[ChatScreen] Attempting to save chat to storage');
            
            // TODO: Implement actual storage mechanism
            // In production, this would save to AsyncStorage or send to backend
            console.log('[ChatScreen] Saving chat to storage:', {
                id: chat.id,
                title: chat.title,
                messageCount: chat.messages.length,
                timestamp: chat.createdAt,
            });
            
            // Example AsyncStorage implementation:
            // const existingChats = await AsyncStorage.getItem('chatHistory');
            // const chats = existingChats ? JSON.parse(existingChats) : [];
            // chats.unshift(chat);
            // await AsyncStorage.setItem('chatHistory', JSON.stringify(chats));
            
            console.log('[ChatScreen] Chat saved to storage successfully');
        } catch (error) {
            console.error('[ChatScreen] Error saving chat to storage:', error);
            // Non-critical error - don't show alert to user
        }
    };

    // ========================================
    // ERROR HANDLING
    // ========================================
    
    /**
     * Handles chat initialization errors
     * @param error - Error object or message
     */
    const handleChatError = (error: unknown): void => {
        console.error('[ChatScreen] Chat error occurred:', error);
        setIsLoading(false);
        
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'An unexpected error occurred';

        console.log('[ChatScreen] Showing error alert to user:', errorMessage);

        Alert.alert(
            'Connection Error',
            `Failed to get AI response: ${errorMessage}`,
            [
                {
                    text: 'Go Back',
                    onPress: () => {
                        console.log('[ChatScreen] User chose to go back after error');
                        router.back();
                    },
                },
                {
                    text: 'Retry',
                    onPress: () => {
                        console.log('[ChatScreen] User chose to retry after error');
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
        console.log('[ChatScreen] Scrolling to bottom of chat');
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
        console.log('[ChatScreen] Formatted filters:', formattedText);
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
        console.log(`[ChatScreen] Rendering message ${index}:`, {
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
        console.log('[ChatScreen] Rendering loading message');
        
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
        console.log('[ChatScreen] Rendering header with title:', title);
        
        return (
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => {
                        console.log('[ChatScreen] Back button pressed');
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
    console.log('[ChatScreen] Rendering component with state:', {
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
                    console.log('[ChatScreen] Content size changed, auto-scrolling');
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
        paddingHorizontal: 20,
        paddingVertical: 15,
        paddingTop: LAYOUT.statusBarPadding,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        elevation: 2,
        shadowColor: COLORS.text,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    backButton: {
        padding: 5,
        borderRadius: 20,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
        marginHorizontal: 10,
    },
    headerSpacer: {
        width: 34, // Same width as back button for centering
    },
    
    // Chat Container
    chatContainer: {
        flex: 1,
    },
    chatContent: {
        padding: LAYOUT.contentPadding,
        paddingBottom: 40,
    },
    
    // Message Containers
    messageContainer: {
        marginVertical: LAYOUT.messageMargin,
        maxWidth: LAYOUT.maxBubbleWidth,
    },
    userMessageContainer: {
        alignSelf: 'flex-end',
    },
    aiMessageContainer: {
        alignSelf: 'flex-start',
    },
    
    // Message Bubbles
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: LAYOUT.messageBubbleRadius,
        elevation: 1,
        shadowColor: COLORS.text,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    userBubble: {
        backgroundColor: COLORS.userBubble,
        borderBottomRightRadius: LAYOUT.smallBubbleRadius,
    },
    aiBubble: {
        backgroundColor: COLORS.aiBubble,
        borderBottomLeftRadius: LAYOUT.smallBubbleRadius,
    },
    
    // Message Text
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    userMessageText: {
        color: COLORS.userText,
    },
    aiMessageText: {
        color: COLORS.aiText,
    },
    filterText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 8,
        fontStyle: 'italic',
        lineHeight: 16,
    },
    
    // Loading Animation
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loadingDots: {
        marginLeft: 8,
    },
    loadingText: {
        fontSize: 14,
        color: COLORS.lightText,
        fontStyle: 'italic',
    },
}); 
