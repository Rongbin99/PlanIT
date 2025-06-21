/**
 * HistoryScreen Component
 * 
 * Displays a list of past chat conversations with search functionality and management.
 * Features pull-to-refresh, chat deletion, navigation to existing chats, and empty states.
 * Integrates with local storage and provides a clean interface for chat history management.
 * 
 * @author Rongbin Gu (@rongbin99)
 * @version 1.0.0
 */

// ========================================
// IMPORTS
// ========================================
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

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
 * Chat history item for list display
 * Optimized structure for history overview
 */
interface ChatHistoryItem {
    id: string;
    title: string;
    lastMessage: string;
    timestamp: string;
    messageCount: number;
    searchData?: Record<string, any>;
}

/**
 * Props for FlatList renderItem function
 */
interface RenderItemProps {
    item: ChatHistoryItem;
    index: number;
}

/**
 * API response for chat history
 */
interface ChatHistoryResponse {
    success: boolean;
    chats: ChatHistoryItem[];
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
    border: '#e0e0e0',
    accent: '#e3f2fd',
} as const;

/**
 * Layout and spacing constants
 */
const LAYOUT = {
    headerPaddingTop: 60,
    headerPaddingHorizontal: 20,
    headerPaddingBottom: 20,
    contentPadding: 20,
    cardMarginBottom: 12,
    cardPadding: 16,
    cardBorderRadius: 12,
    emptyStatePadding: 40,
    buttonBorderRadius: 24,
    buttonPadding: 12,
    hitSlop: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
    },
} as const;

/**
 * Time calculation constants
 */
const TIME_CONSTANTS = {
    HOUR_MS: 1000 * 60 * 60,
    DAY_MS: 1000 * 60 * 60 * 24,
    WEEK_MS: 1000 * 60 * 60 * 24 * 7,
} as const;

// ========================================
// SAMPLE DATA
// ========================================

/**
 * Demo chat data for development and testing
 * In production, this would be replaced with API calls or storage retrieval
 */
const SAMPLE_CHAT_DATA: ChatHistoryItem[] = [
    {
        id: 'chat_001',
        title: 'Best restaurants in downtown Toronto',
        lastMessage: 'I found some amazing restaurants that match your criteria...',
        timestamp: new Date(Date.now() - TIME_CONSTANTS.HOUR_MS).toISOString(),
        messageCount: 4,
    },
    {
        id: 'chat_002',
        title: 'Weekend activities for couples',
        lastMessage: 'Here are some romantic spots perfect for a date...',
        timestamp: new Date(Date.now() - TIME_CONSTANTS.DAY_MS).toISOString(),
        messageCount: 6,
    },
    {
        id: 'chat_003',
        title: 'Family-friendly activities in Vancouver',
        lastMessage: 'These activities are perfect for families with children...',
        timestamp: new Date(Date.now() - TIME_CONSTANTS.DAY_MS * 2).toISOString(),
        messageCount: 8,
    },
];

// ========================================
// MAIN COMPONENT
// ========================================
export default function HistoryScreen() {
    // ========================================
    // STATE MANAGEMENT
    // ========================================
    
    const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    console.log('[HistoryScreen] Component initialized with state:', {
        chatCount: chatHistory.length,
        isLoading,
        refreshing
    });

    // ========================================
    // EFFECTS
    // ========================================
    
    /**
     * Load chat history when screen comes into focus
     * Uses useFocusEffect to refresh data when user returns to this tab
     */
    useFocusEffect(
        useCallback(() => {
            console.log('[HistoryScreen] Screen focused, loading chat history');
            loadChatHistory();
        }, [])
    );

    // ========================================
    // DATA MANAGEMENT
    // ========================================
    
    /**
     * Loads chat history from storage or API
     * Handles both initial load and refresh scenarios
     */
    const loadChatHistory = async (): Promise<void> => {
        try {
            console.log('[HistoryScreen] Starting chat history load process');
            setIsLoading(true);
            
            // First, try to load from local storage for immediate display
            const localChats = await loadChatHistoryFromStorage();
            if (localChats.length > 0) {
                console.log('[HistoryScreen] Loaded', localChats.length, 'chats from local storage');
                setChatHistory(localChats);
            }
            
            // Then fetch from API for updates
            try {
                console.log('[HistoryScreen] Fetching chat history from API: /api/chat');
                const apiChats = await fetchChatHistoryFromAPI();
                console.log('[HistoryScreen] Fetched', apiChats.length, 'chats from API');
                
                // Merge and sort by timestamp
                const mergedChats = mergeChatHistory(localChats, apiChats);
                console.log('[HistoryScreen] Merged chat history, total:', mergedChats.length);
                setChatHistory(mergedChats);
                
                // Update local storage with merged data
                await saveChatHistoryToStorage(mergedChats);
                
            } catch (apiError) {
                console.warn('[HistoryScreen] API fetch failed, using local data only:', apiError);
                // If API fails, continue with local data
            }
            
        } catch (error) {
            console.error('[HistoryScreen] Error loading chat history:', error);
            handleLoadError();
        } finally {
            setIsLoading(false);
            console.log('[HistoryScreen] Chat history load process completed');
        }
    };

    /**
     * Loads chat history from local storage (AsyncStorage)
     */
    const loadChatHistoryFromStorage = async (): Promise<ChatHistoryItem[]> => {
        try {
            console.log('[HistoryScreen] Loading chat history from local storage');
            
            // TODO: Replace with actual AsyncStorage implementation
            // const storedChats = await AsyncStorage.getItem('chatHistory');
            // const chats = storedChats ? JSON.parse(storedChats) : [];
            
            // For demo, simulate loading delay and return sample data
            await new Promise(resolve => setTimeout(resolve, 300));
            console.log('[HistoryScreen] Local storage returned', SAMPLE_CHAT_DATA.length, 'sample chats');
            return SAMPLE_CHAT_DATA;
            
        } catch (error) {
            console.error('[HistoryScreen] Error loading from storage:', error);
            return [];
        }
    };

    /**
     * Fetches chat history from backend API
     */
    const fetchChatHistoryFromAPI = async (): Promise<ChatHistoryItem[]> => {
        console.log('[HistoryScreen] Making API request to fetch chat history');
        
        const response = await fetch('YOUR_BACKEND_URL/api/chat', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Add authentication headers if needed
                // 'Authorization': `Bearer ${userToken}`,
            },
        });

        console.log('[HistoryScreen] API response status:', response.status);

        if (!response.ok) {
            const errorMessage = `HTTP error! status: ${response.status}`;
            console.error('[HistoryScreen] API request failed:', errorMessage);
            throw new Error(errorMessage);
        }

        const result: ChatHistoryResponse = await response.json();
        console.log('[HistoryScreen] API response data:', {
            success: result.success,
            chatCount: result.chats?.length || 0,
            error: result.error
        });

        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch chat history');
        }

        return result.chats || [];
    };

    /**
     * Merges local and API chat data, removing duplicates and sorting by timestamp
     */
    const mergeChatHistory = (localChats: ChatHistoryItem[], apiChats: ChatHistoryItem[]): ChatHistoryItem[] => {
        console.log('[HistoryScreen] Merging chat history - local:', localChats.length, 'api:', apiChats.length);
        
        // Create a map to avoid duplicates based on chat ID
        const chatMap = new Map<string, ChatHistoryItem>();
        
        // Add local chats first
        localChats.forEach(chat => {
            chatMap.set(chat.id, chat);
        });
        
        // Add/update with API chats (API data takes precedence)
        apiChats.forEach(chat => {
            chatMap.set(chat.id, chat);
        });
        
        // Convert back to array and sort by timestamp (newest first)
        const mergedChats = Array.from(chatMap.values()).sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        console.log('[HistoryScreen] Merge completed, final count:', mergedChats.length);
        return mergedChats;
    };

    /**
     * Saves chat history to local storage
     */
    const saveChatHistoryToStorage = async (chats: ChatHistoryItem[]): Promise<void> => {
        try {
            console.log('[HistoryScreen] Saving', chats.length, 'chats to local storage');
            
            // TODO: Replace with actual AsyncStorage implementation
            // await AsyncStorage.setItem('chatHistory', JSON.stringify(chats));
            
            console.log('[HistoryScreen] Chat history saved to local storage successfully');
        } catch (error) {
            console.error('[HistoryScreen] Error saving to storage:', error);
        }
    };

    /**
     * Handles pull-to-refresh functionality
     */
    const onRefresh = async (): Promise<void> => {
        console.log('[HistoryScreen] Pull-to-refresh triggered');
        setRefreshing(true);
        await loadChatHistory();
        setRefreshing(false);
        console.log('[HistoryScreen] Pull-to-refresh completed');
    };

    /**
     * Handles errors during chat history loading
     */
    const handleLoadError = (): void => {
        console.warn('[HistoryScreen] Showing load error alert to user');
        Alert.alert(
            'Load Error',
            'Failed to load chat history. Please try again.',
            [
                {
                    text: 'Retry',
                    onPress: () => {
                        console.log('[HistoryScreen] User chose to retry loading');
                        loadChatHistory();
                    },
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        console.log('[HistoryScreen] User cancelled retry');
                    },
                },
            ]
        );
    };

    // ========================================
    // NAVIGATION HANDLERS
    // ========================================
    
    /**
     * Handles navigation to existing chat conversation
     * @param chat - Chat history item to open
     */
    const handleChatPress = (chat: ChatHistoryItem): void => {
        console.log('[HistoryScreen] Chat item pressed:', {
            id: chat.id,
            title: chat.title,
            messageCount: chat.messageCount
        });
        
        try {
            router.push({
                pathname: '/chat' as any,
                params: {
                    chatId: chat.id,
                    existingChat: 'true'
                }
            });
            console.log('[HistoryScreen] Navigation to chat successful');
        } catch (error) {
            console.error('[HistoryScreen] Navigation error:', error);
            Alert.alert('Error', 'Failed to open chat. Please try again.');
        }
    };

    /**
     * Handles navigation to main search screen
     */
    const handleStartExploring = (): void => {
        console.log('[HistoryScreen] Start exploring button pressed');
        
        try {
            router.push('/(tabs)/' as any);
            console.log('[HistoryScreen] Navigation to main screen successful');
        } catch (error) {
            console.error('[HistoryScreen] Navigation error:', error);
            Alert.alert('Error', 'Failed to navigate. Please try again.');
        }
    };

    // ========================================
    // CHAT MANAGEMENT
    // ========================================
    
    /**
     * Handles chat deletion with confirmation
     * @param chatId - ID of chat to delete
     */
    const handleDeleteChat = (chatId: string): void => {
        const chatToDelete = chatHistory.find(chat => chat.id === chatId);
        console.log('[HistoryScreen] Delete chat requested:', {
            id: chatId,
            title: chatToDelete?.title
        });
        
        Alert.alert(
            'Delete Conversation',
            `Are you sure you want to delete "${chatToDelete?.title}"?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        console.log('[HistoryScreen] User cancelled deletion');
                    },
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        console.log('[HistoryScreen] User confirmed deletion');
                        performChatDeletion(chatId);
                    },
                },
            ]
        );
    };

    /**
     * Performs the actual chat deletion
     * @param chatId - ID of chat to delete
     */
    const performChatDeletion = async (chatId: string): Promise<void> => {
        try {
            console.log('[HistoryScreen] Starting chat deletion process for:', chatId);
            
            // Update local state immediately for responsive UX
            const updatedChats = chatHistory.filter(chat => chat.id !== chatId);
            setChatHistory(updatedChats);
            console.log('[HistoryScreen] Local state updated, remaining chats:', updatedChats.length);
            
            // Save to local storage
            await saveChatHistoryToStorage(updatedChats);
            
            // TODO: Send delete request to backend
            try {
                console.log('[HistoryScreen] Sending delete request to API');
                const response = await fetch(`YOUR_BACKEND_URL/api/chat/${chatId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        // Add authentication headers if needed
                    },
                });
                
                console.log('[HistoryScreen] Delete API response status:', response.status);
                
                if (!response.ok) {
                    throw new Error(`Failed to delete from server: ${response.status}`);
                }
                
                console.log('[HistoryScreen] Chat deleted from server successfully');
            } catch (apiError) {
                console.warn('[HistoryScreen] Server deletion failed, but local deletion succeeded:', apiError);
                // Local deletion succeeded, so don't rollback
            }
            
        } catch (error) {
            console.error('[HistoryScreen] Error during chat deletion:', error);
            // Rollback on error
            console.log('[HistoryScreen] Rolling back deletion, reloading chat history');
            loadChatHistory();
            Alert.alert('Error', 'Failed to delete chat. Please try again.');
        }
    };

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    /**
     * Formats timestamp for display in chat list
     * @param timestamp - ISO timestamp string
     * @returns Human-readable time string
     */
    const formatTimestamp = (timestamp: string): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        
        const hours = Math.floor(diff / TIME_CONSTANTS.HOUR_MS);
        const days = Math.floor(diff / TIME_CONSTANTS.DAY_MS);
        
        let formattedTime: string;
        
        if (hours < 1) {
            formattedTime = 'Just now';
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
        
        console.log(`[HistoryScreen] Formatted timestamp ${timestamp} -> ${formattedTime}`);
        return formattedTime;
    };

    // ========================================
    // RENDER HELPERS
    // ========================================
    
    /**
     * Renders individual chat item in the list
     * @param renderProps - FlatList render item props
     * @returns JSX element for chat item
     */
    const renderChatItem = ({ item, index }: RenderItemProps): React.ReactElement => {
        console.log(`[HistoryScreen] Rendering chat item ${index}:`, {
            id: item.id,
            title: item.title,
            messageCount: item.messageCount
        });
        
        return (
            <TouchableOpacity 
                style={styles.chatItem}
                onPress={() => handleChatPress(item)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Open chat: ${item.title}`}
            >
                <View style={styles.chatContent}>
                    {/* Chat Header */}
                    <View style={styles.chatHeader}>
                        <Text style={styles.chatTitle} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <Text style={styles.timestamp}>
                            {formatTimestamp(item.timestamp)}
                        </Text>
                    </View>
                    
                    {/* Last Message Preview */}
                    <Text style={styles.lastMessage} numberOfLines={2}>
                        {item.lastMessage}
                    </Text>
                    
                    {/* Chat Footer */}
                    <View style={styles.chatFooter}>
                        <View style={styles.messageCount}>
                            <MaterialCommunityIcons 
                                name="message-outline" 
                                size={14} 
                                color={COLORS.lightText} 
                            />
                            <Text style={styles.messageCountText}>
                                {item.messageCount} message{item.messageCount !== 1 ? 's' : ''}
                            </Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.deleteButton}
                            onPress={() => handleDeleteChat(item.id)}
                            hitSlop={LAYOUT.hitSlop}
                            accessibilityRole="button"
                            accessibilityLabel="Delete chat"
                        >
                            <MaterialCommunityIcons 
                                name="delete-outline" 
                                size={18} 
                                color={COLORS.lightText} 
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    /**
     * Renders empty state when no chats exist
     * @returns JSX element for empty state
     */
    const renderEmptyState = (): React.ReactElement => {
        console.log('[HistoryScreen] Rendering empty state');
        
        return (
            <View style={styles.emptyState}>
                <MaterialCommunityIcons 
                    name="chat-outline" 
                    size={80} 
                    color={COLORS.lightText} 
                />
                <Text style={styles.emptyTitle}>No Adventures Yet</Text>
                <Text style={styles.emptyText}>
                    Start exploring and your conversations will appear here
                </Text>
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
     * Renders header section with title and chat count
     * @returns JSX element for header
     */
    const renderHeader = (): React.ReactElement => {
        console.log('[HistoryScreen] Rendering header with', chatHistory.length, 'conversations');
        
        return (
            <View style={styles.header}>
                <ThemedText type="title" style={styles.headerTitle}>
                    Your Adventures
                </ThemedText>
                <ThemedText style={styles.headerSubtitle}>
                    {chatHistory.length} conversation{chatHistory.length !== 1 ? 's' : ''}
                </ThemedText>
            </View>
        );
    };

    // ========================================
    // RENDER
    // ========================================
    console.log('[HistoryScreen] Rendering component with state:', {
        isLoading,
        refreshing,
        chatCount: chatHistory.length,
        isEmpty: chatHistory.length === 0
    });

    return (
        <ThemedView style={styles.container}>
            {/* Header */}
            {renderHeader()}

            {/* Chat List */}
            <FlatList
                data={chatHistory}
                renderItem={renderChatItem}
                keyExtractor={(item) => {
                    console.log(`[HistoryScreen] Extracting key for item: ${item.id}`);
                    return item.id;
                }}
                style={styles.chatList}
                contentContainerStyle={
                    chatHistory.length === 0 ? styles.emptyContainer : styles.listContent
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
                    console.log('[HistoryScreen] Reached end of list');
                    // TODO: Implement pagination if needed
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
        paddingHorizontal: LAYOUT.headerPaddingHorizontal,
        paddingTop: LAYOUT.headerPaddingTop,
        paddingBottom: LAYOUT.headerPaddingBottom,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: COLORS.lightText,
    },
    
    // Chat List
    chatList: {
        flex: 1,
    },
    listContent: {
        padding: LAYOUT.contentPadding,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: LAYOUT.emptyStatePadding,
    },
    
    // Chat Items
    chatItem: {
        backgroundColor: COLORS.white,
        borderRadius: LAYOUT.cardBorderRadius,
        marginBottom: LAYOUT.cardMarginBottom,
        shadowColor: COLORS.text,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    chatContent: {
        padding: LAYOUT.cardPadding,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    chatTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginRight: 12,
    },
    timestamp: {
        fontSize: 12,
        color: COLORS.lightText,
        flexShrink: 0,
    },
    lastMessage: {
        fontSize: 14,
        color: COLORS.lightText,
        lineHeight: 20,
        marginBottom: 12,
    },
    chatFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    messageCount: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    messageCountText: {
        fontSize: 12,
        color: COLORS.lightText,
        marginLeft: 4,
    },
    deleteButton: {
        padding: 4,
        borderRadius: 4,
    },
    
    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.lightText,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    startButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: LAYOUT.buttonPadding,
        borderRadius: LAYOUT.buttonBorderRadius,
        elevation: 2,
        shadowColor: COLORS.primary,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    startButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
});
