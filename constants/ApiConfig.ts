/**
 * API Configuration Constants
 * 
 * Centralized configuration for backend API endpoints with automatic platform detection.
 * Automatically selects the correct backend URL based on the platform:
 * - iOS Simulator: localhost:3000
 * - Android Emulator: 10.0.2.2:3000 (maps to host machine's localhost)
 * - Other platforms: network IP for physical devices/production
 * 
 * @author Rongbin Gu (@rongbin99)
 */

import { Platform } from 'react-native';

// ========================================
// ENVIRONMENT CONFIGURATION
// ========================================

/**
 * Get backend URL based on platform:
 * - iOS Simulator: use localhost:3000 
 * - Android Emulator: use 10.0.2.2:3000 (maps to host machine's localhost)
 * - Physical Device: use your network IP (e.g., 192.168.X.X:3000)
 * - Production: use the API URL (e.g., AWS EC2 URL or GCP/Azure) <-- COMING SOON
 */
const getBackendUrl = (): string => {
    let url: string;
    const TAG = '[ApiConfig]';
    
    if (Platform.OS === 'ios') {
        url = 'http://localhost:3000';
        console.log(TAG, 'Platform detected: iOS - Using localhost backend');
    } else if (Platform.OS === 'android') {
        url = 'http://10.0.2.2:3000';
        console.log(TAG, 'Platform detected: Android - Using emulator backend (10.0.2.2)');
    } else {
        // Fallback for web, physical devices, or other platforms
        url = 'http://192.168.X.X:3000'; // Replace with your network IP
        console.log(TAG, `Platform detected: ${Platform.OS} - Using network IP backend`);
    }
    
    console.log(TAG, `Backend URL set to: ${url}`);
    return url;
};

/**
 * Backend URL automatically selected based on platform
 */
export const BACKEND_URL = getBackendUrl(); // Change to override the backend URL for production

// ========================================
// API ENDPOINTS
// ========================================

/**
 * API endpoint paths
 */
export const API_ENDPOINTS = {
    CHAT_HISTORY: '/api/chat',
    PLAN_GENERATION: '/api/plan',
    SAVE_CHAT: '/api/chat',
    DELETE_CHAT: '/api/chat',
    USER_SIGNUP: '/api/user/signup',
    USER_LOGIN: '/api/user/login',
    USER_PROFILE: '/api/user/profile',
    USER_PASSWORD: '/api/user/password',
    USER_PROFILE_IMAGE: '/api/user/profile-image',
    USER_STATS: '/api/user/stats',
} as const;

/**
 * Complete API URLs
 */
export const API_URLS = {
    CHAT_HISTORY: `${BACKEND_URL}${API_ENDPOINTS.CHAT_HISTORY}`,
    PLAN_GENERATION: `${BACKEND_URL}${API_ENDPOINTS.PLAN_GENERATION}`,
    SAVE_CHAT: `${BACKEND_URL}${API_ENDPOINTS.SAVE_CHAT}`,
    DELETE_CHAT: (chatId: string) => `${BACKEND_URL}${API_ENDPOINTS.DELETE_CHAT}/${chatId}`,
    USER_SIGNUP: `${BACKEND_URL}${API_ENDPOINTS.USER_SIGNUP}`,
    USER_LOGIN: `${BACKEND_URL}${API_ENDPOINTS.USER_LOGIN}`,
    USER_PROFILE: `${BACKEND_URL}${API_ENDPOINTS.USER_PROFILE}`,
    USER_PASSWORD: `${BACKEND_URL}${API_ENDPOINTS.USER_PASSWORD}`,
    USER_PROFILE_IMAGE: `${BACKEND_URL}${API_ENDPOINTS.USER_PROFILE_IMAGE}`,
    USER_STATS: `${BACKEND_URL}${API_ENDPOINTS.USER_STATS}`,
} as const;

// ========================================
// CONFIGURATION HELPERS
// ========================================

/**
 * Check if we're in development mode
 */
export const IS_DEV = __DEV__;

/**
 * Request timeout in milliseconds
 */
export const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Default request headers
 */
export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
} as const; 
