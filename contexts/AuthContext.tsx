/**
 * Authentication Context
 * 
 * Provides authentication state management and user authentication methods.
 * Handles login, signup, logout, and token persistence with AsyncStorage.
 * 
 * @author Rongbin Gu (@rongbin99)
 */

// ========================================
// IMPORTS
// ========================================
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { API_URLS, DEFAULT_HEADERS } from '@/constants/ApiConfig';

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface User {
    id: string;
    email: string;
    name: string;
    profileImageUrl?: string;
    adventuresCount: number;
    placesVisitedCount: number;
    memberSince: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    signup: (email: string, password: string, name: string) => Promise<boolean>;
    logout: () => Promise<void>;
    updateProfile: (data: { name?: string; email?: string; profileImageUrl?: string }) => Promise<boolean>;
    refreshUserProfile: () => Promise<void>;
}

// ========================================
// CONSTANTS
// ========================================
const TAG = '[AuthContext]';
const AUTH_TOKEN_KEY = '@planit_auth_token';
const USER_DATA_KEY = '@planit_user_data';

// ========================================
// CONTEXT CREATION
// ========================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ========================================
// PROVIDER COMPONENT
// ========================================

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    // ========================================
    // STATE MANAGEMENT
    // ========================================
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ========================================
    // COMPUTED VALUES
    // ========================================
    const isAuthenticated = !!(user && token);

    // ========================================
    // INITIALIZATION
    // ========================================
    useEffect(() => {
        initializeAuth();
    }, []);

    /**
     * Initialize authentication state from AsyncStorage
     */
    const initializeAuth = async (): Promise<void> => {
        try {
            console.log(TAG, 'Initializing authentication state');
            setIsLoading(true);

            const [storedToken, storedUserData] = await Promise.all([
                AsyncStorage.getItem(AUTH_TOKEN_KEY),
                AsyncStorage.getItem(USER_DATA_KEY)
            ]);

            if (storedToken && storedUserData) {
                const userData = JSON.parse(storedUserData);
                console.log(TAG, 'Found stored auth data for user:', userData.email);
                
                setToken(storedToken);
                setUser(userData);
                
                // Refresh user profile to get latest data
                await refreshUserProfileInternal(storedToken);
            } else {
                console.log(TAG, 'No stored authentication data found');
            }
        } catch (error) {
            console.error(TAG, 'Error initializing auth:', error);
            await clearAuthData();
        } finally {
            setIsLoading(false);
        }
    };

    // ========================================
    // AUTHENTICATION METHODS
    // ========================================

    /**
     * Login user with email and password
     */
    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            console.log(TAG, 'Attempting login for:', email);

            const response = await fetch(API_URLS.USER_LOGIN, {
                method: 'POST',
                headers: DEFAULT_HEADERS,
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.success && result.token && result.user) {
                console.log(TAG, 'Login successful');
                
                await storeAuthData(result.token, result.user);
                setToken(result.token);
                setUser(result.user);
                
                return true;
            } else {
                console.warn(TAG, 'Login failed:', result.message);
                Alert.alert('Login Failed', result.message || 'Invalid credentials');
                return false;
            }
        } catch (error) {
            console.error(TAG, 'Login error:', error);
            Alert.alert('Login Error', 'Unable to connect to server. Please try again.');
            return false;
        }
    };

    /**
     * Sign up new user
     */
    const signup = async (email: string, password: string, name: string): Promise<boolean> => {
        try {
            console.log(TAG, 'Attempting signup for:', email);

            const response = await fetch(API_URLS.USER_SIGNUP, {
                method: 'POST',
                headers: DEFAULT_HEADERS,
                body: JSON.stringify({ email, password, name })
            });

            const result = await response.json();

            if (result.success && result.token && result.user) {
                console.log(TAG, 'Signup successful');
                
                await storeAuthData(result.token, result.user);
                setToken(result.token);
                setUser(result.user);
                
                return true;
            } else {
                console.warn(TAG, 'Signup failed:', result.message);
                Alert.alert('Signup Failed', result.message || 'Unable to create account');
                return false;
            }
        } catch (error) {
            console.error(TAG, 'Signup error:', error);
            Alert.alert('Signup Error', 'Unable to connect to server. Please try again.');
            return false;
        }
    };

    /**
     * Logout user and clear auth data
     */
    const logout = async (): Promise<void> => {
        try {
            console.log(TAG, 'Logging out user');
            
            await clearAuthData();
            setToken(null);
            setUser(null);
            
            console.log(TAG, 'Logout successful');
        } catch (error) {
            console.error(TAG, 'Logout error:', error);
        }
    };

    /**
     * Update user profile
     */
    const updateProfile = async (data: { name?: string; email?: string; profileImageUrl?: string }): Promise<boolean> => {
        try {
            if (!token) {
                console.warn(TAG, 'No auth token for profile update');
                return false;
            }

            console.log(TAG, 'Updating user profile');

            const response = await fetch(API_URLS.USER_PROFILE, {
                method: 'PUT',
                headers: {
                    ...DEFAULT_HEADERS,
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success && result.user) {
                console.log(TAG, 'Profile update successful');
                
                const updatedUser = result.user;
                await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
                setUser(updatedUser);
                
                return true;
            } else {
                console.warn(TAG, 'Profile update failed:', result.message);
                Alert.alert('Update Failed', result.message || 'Unable to update profile');
                return false;
            }
        } catch (error) {
            console.error(TAG, 'Profile update error:', error);
            Alert.alert('Update Error', 'Unable to connect to server. Please try again.');
            return false;
        }
    };

    /**
     * Refresh user profile from server
     */
    const refreshUserProfile = useCallback(async (): Promise<void> => {
        if (token) {
            await refreshUserProfileInternal(token);
        }
    }, [token]);

    // ========================================
    // HELPER METHODS
    // ========================================

    /**
     * Store authentication data in AsyncStorage
     */
    const storeAuthData = async (authToken: string, userData: User): Promise<void> => {
        try {
            await Promise.all([
                AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken),
                AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData))
            ]);
            console.log(TAG, 'Auth data stored successfully');
        } catch (error) {
            console.error(TAG, 'Error storing auth data:', error);
            throw error;
        }
    };

    /**
     * Clear authentication data from AsyncStorage
     */
    const clearAuthData = async (): Promise<void> => {
        try {
            await Promise.all([
                AsyncStorage.removeItem(AUTH_TOKEN_KEY),
                AsyncStorage.removeItem(USER_DATA_KEY)
            ]);
            console.log(TAG, 'Auth data cleared successfully');
        } catch (error) {
            console.error(TAG, 'Error clearing auth data:', error);
        }
    };

    /**
     * Internal method to refresh user profile
     */
    const refreshUserProfileInternal = async (authToken: string): Promise<void> => {
        try {
            console.log(TAG, 'Refreshing user profile');

            const response = await fetch(API_URLS.USER_PROFILE, {
                method: 'GET',
                headers: {
                    ...DEFAULT_HEADERS,
                    'Authorization': `Bearer ${authToken}`
                }
            });

            const result = await response.json();

            if (result.success && result.user) {
                console.log(TAG, 'Profile refresh successful');
                
                const updatedUser = result.user;
                await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
                setUser(updatedUser);
            } else {
                console.warn(TAG, 'Profile refresh failed, clearing auth data');
                await clearAuthData();
                setToken(null);
                setUser(null);
            }
        } catch (error) {
            console.error(TAG, 'Profile refresh error:', error);
            // Don't clear auth on network errors
        }
    };

    // ========================================
    // CONTEXT VALUE
    // ========================================
    const contextValue: AuthContextType = {
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        refreshUserProfile
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// ========================================
// CUSTOM HOOK
// ========================================

/**
 * Custom hook to use authentication context
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext; 
