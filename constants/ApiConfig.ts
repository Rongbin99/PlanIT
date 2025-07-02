/**
 * API Configuration Constants
 * 
 * Centralized configuration for backend API endpoints across different environments.
 * Update the BACKEND_URL based on your deployment target and testing environment.
 * 
 * @author Rongbin Gu (@rongbin99)
 */

// ========================================
// ENVIRONMENT CONFIGURATION
// ========================================

/**
 * Backend URL configuration for different environments
 * 
 * Choose the appropriate URL based on your testing setup:
 * - iOS Simulator: use localhost:3000 
 * - Android Emulator: use 10.0.2.2:3000 (maps to host machine's localhost)
 * - Physical Device: use your network IP (e.g., 192.168.X.X:3000)
 * - Production: use your deployed API URL (e.g., AWS Lambda URL)
 */
export const BACKEND_URL = 'http://10.0.2.2:3000';

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
} as const;

/**
 * Complete API URLs
 */
export const API_URLS = {
    CHAT_HISTORY: `${BACKEND_URL}${API_ENDPOINTS.CHAT_HISTORY}`,
    PLAN_GENERATION: `${BACKEND_URL}${API_ENDPOINTS.PLAN_GENERATION}`,
    SAVE_CHAT: `${BACKEND_URL}${API_ENDPOINTS.SAVE_CHAT}`,
    DELETE_CHAT: (chatId: string) => `${BACKEND_URL}${API_ENDPOINTS.DELETE_CHAT}/${chatId}`,
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
