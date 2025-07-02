/**
 * Storage Utilities
 * 
 * Shared utility functions for AsyncStorage operations across the app.
 * Handles local storage of chat history for offline functionality.
 * 
 * @author Rongbin Gu (@rongbin99)
 */

// ========================================
// IMPORTS
// ========================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// ========================================
// CONSTANTS
// ========================================

const TAG = "[StorageUtils]";

/**
 * Storage keys for different data types
 */
export const STORAGE_KEYS = {
    CHAT_HISTORY: 'chatHistory',
    USER_PREFERENCES: 'userPreferences',
    OFFLINE_QUEUE: 'offlineQueue',
} as const;

// ========================================
// TYPE DEFINITIONS
// ========================================

/**
 * Chat data structure for storage
 */
export interface StoredChatData {
    id: string;
    title: string;
    location: string;
    searchData: Record<string, any>;
    messages: Array<{
        id: string;
        type: 'user' | 'ai';
        content: string;
        timestamp: string;
    }>;
    createdAt: string;
    updatedAt: string;
    image?: ImageData;
}

/**
 * Image data structure matching API response
 */
export interface ImageData {
    id: string;
    url: string;
    thumbnail: string;
    alt_description: string;
    photographer: {
        name: string;
        username: string;
        profile_url: string;
    };
    unsplash_url: string;
    location: string;
    original_location: string;
    search_query: string;
    cached_at: string;
}

/**
 * Trip plan history item for list display (matching history screen interface)
 */
export interface TripPlanHistoryItem {
    id: string;
    title: string;
    location: string;
    lastUpdated: string;
    searchData?: Record<string, any>;
    image?: ImageData;
}

// ========================================
// CHAT STORAGE FUNCTIONS
// ========================================

/**
 * Saves a chat to local storage
 * @param chat - Chat data to save
 */
export const saveChatToLocalStorage = async (chat: StoredChatData): Promise<void> => {
    try {
        console.log(TAG, 'Saving chat to local storage:', chat.id);
        
        // Get existing chats from AsyncStorage
        const existingChats = await getChatsFromLocalStorage();
        
        // Check if chat already exists (avoid duplicates)
        const existingChatIndex = existingChats.findIndex(existingChat => existingChat.id === chat.id);
        
        if (existingChatIndex >= 0) {
            // Update existing chat
            existingChats[existingChatIndex] = chat;
            console.log(TAG, 'Updated existing chat in local storage');
        } else {
            // Add new chat to the beginning of the array
            existingChats.unshift(chat);
            console.log(TAG, 'Added new chat to local storage');
        }
        
        // Keep only the last 50 chats to prevent storage bloat
        const chatsToStore = existingChats.slice(0, 50);
        
        // Save back to AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(chatsToStore));
        console.log(TAG, 'Chat saved successfully. Total chats:', chatsToStore.length);
        
    } catch (error) {
        console.error(TAG, 'Failed to save chat to local storage:', error);
        throw error;
    }
};

/**
 * Gets all chats from local storage
 * @returns Array of stored chat data
 */
export const getChatsFromLocalStorage = async (): Promise<StoredChatData[]> => {
    try {
        console.log(TAG, 'Loading chats from local storage');
        const existingChatsString = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
        const chats: StoredChatData[] = existingChatsString ? JSON.parse(existingChatsString) : [];
        console.log(TAG, 'Loaded chats from local storage:', chats.length);
        return chats;
    } catch (error) {
        console.error(TAG, 'Error loading chats from local storage:', error);
        return [];
    }
};

/**
 * Converts stored chat data to trip plan history items for display
 * @param chats - Array of stored chat data
 * @returns Array of trip plan history items
 */
export const convertChatsToHistoryItems = (chats: StoredChatData[]): TripPlanHistoryItem[] => {
    return chats.map(chat => ({
        id: chat.id,
        title: chat.title,
        location: chat.location,
        lastUpdated: chat.updatedAt || chat.createdAt,
        searchData: chat.searchData,
        image: chat.image,
    }));
};

/**
 * Merges local storage chats with API chats, removing duplicates
 * @param apiChats - Chats from backend API
 * @param localChats - Chats from local storage
 * @returns Merged and deduplicated chat list
 */
export const mergeChatsWithLocal = (
    apiChats: TripPlanHistoryItem[],
    localChats: TripPlanHistoryItem[]
): TripPlanHistoryItem[] => {
    console.log(TAG, 'Merging API chats with local chats:', {
        apiCount: apiChats.length,
        localCount: localChats.length
    });
    
    // Create a Map for efficient duplicate detection
    const chatMap = new Map<string, TripPlanHistoryItem>();
    
    // Add API chats first (they have priority)
    apiChats.forEach(chat => {
        chatMap.set(chat.id, chat);
    });
    
    // Add local chats that aren't already in API results
    localChats.forEach(chat => {
        if (!chatMap.has(chat.id)) {
            chatMap.set(chat.id, chat);
        }
    });
    
    // Convert back to array and sort by lastUpdated (newest first)
    const mergedChats = Array.from(chatMap.values()).sort((a, b) => {
        const dateA = new Date(a.lastUpdated).getTime();
        const dateB = new Date(b.lastUpdated).getTime();
        return dateB - dateA; // Newest first
    });
    
    console.log(TAG, 'Merged chats total:', mergedChats.length);
    return mergedChats;
};

/**
 * Deletes a chat from local storage
 * @param chatId - ID of chat to delete
 */
export const deleteChatFromLocalStorage = async (chatId: string): Promise<void> => {
    try {
        console.log(TAG, 'Deleting chat from local storage:', chatId);
        
        const existingChats = await getChatsFromLocalStorage();
        const filteredChats = existingChats.filter(chat => chat.id !== chatId);
        
        await AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(filteredChats));
        console.log(TAG, 'Chat deleted from local storage. Remaining:', filteredChats.length);
        
    } catch (error) {
        console.error(TAG, 'Error deleting chat from local storage:', error);
        throw error;
    }
};

// ========================================
// GENERAL STORAGE FUNCTIONS
// ========================================

/**
 * Clears all stored chat data (for debugging or user request)
 */
export const clearAllChatData = async (): Promise<void> => {
    try {
        console.log(TAG, 'Clearing all chat data from local storage');
        await AsyncStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
        console.log(TAG, 'All chat data cleared successfully');
    } catch (error) {
        console.error(TAG, 'Error clearing chat data:', error);
        throw error;
    }
};

/**
 * Gets storage usage statistics for debugging
 */
export const getStorageStats = async (): Promise<{
    chatCount: number;
    totalSizeKB: number;
}> => {
    try {
        const chatsString = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
        const chatCount = chatsString ? JSON.parse(chatsString).length : 0;
        const totalSizeKB = chatsString ? (chatsString.length / 1024) : 0;
        
        console.log(TAG, 'Storage stats:', { chatCount, totalSizeKB });
        return { chatCount, totalSizeKB };
    } catch (error) {
        console.error(TAG, 'Error getting storage stats:', error);
        return { chatCount: 0, totalSizeKB: 0 };
    }
}; 
