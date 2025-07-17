/**
 * AccountScreen Component
 * 
 * Account settings screen with Name, Email, Location fields and logout functionality.
 * 
 * @author Rongbin Gu (@rongbin99)
 */

// ========================================
// IMPORTS
// ========================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router, Stack } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ICON_SIZES, SHADOWS } from '@/constants/DesignTokens';

// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

const TAG = "[AccountScreen]";
const ACCOUNT_DATA_KEY = '@planit_account_data';
const AUTH_TOKEN_KEY = '@planit_auth_token';
const MEMBER_SINCE_KEY = '@planit_member_since';

// ========================================
// TYPE DEFINITIONS
// ========================================

interface AccountData {
    name: string;
    location: string;
}

// ========================================
// MAIN COMPONENT
// ========================================

export default function AccountScreen() {
    console.log(TAG, 'AccountScreen component initialized');

    // ========================================
    // STATE MANAGEMENT
    // ========================================
    
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [memberSince, setMemberSince] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // ========================================
    // EFFECTS
    // ========================================

    useEffect(() => {
        checkAuthStatus();
    }, []);

    // ========================================
    // DATA MANAGEMENT
    // ========================================

    const checkAuthStatus = async (): Promise<void> => {
        try {
            console.log(TAG, 'Checking authentication status');
            setIsLoading(true);
            
            const authToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
            if (authToken) {
                setIsLoggedIn(true);
                await loadAccountData();
                await loadMemberSince();
            } else {
                setIsLoggedIn(false);
                console.log(TAG, 'User not logged in');
            }
        } catch (error) {
            console.error(TAG, 'Error checking auth status:', error);
            setIsLoggedIn(false);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAccountData = async (): Promise<void> => {
        try {
            console.log(TAG, 'Loading account data from AsyncStorage');
            
            const savedData = await AsyncStorage.getItem(ACCOUNT_DATA_KEY);
            if (savedData) {
                const accountData: AccountData = JSON.parse(savedData);
                setName(accountData.name || '');
                setLocation(accountData.location || '');
                console.log(TAG, 'Account data loaded successfully');
            }
        } catch (error) {
            console.error(TAG, 'Error loading account data:', error);
        }
    };

    const loadMemberSince = async (): Promise<void> => {
        try {
            const savedMemberSince = await AsyncStorage.getItem(MEMBER_SINCE_KEY);
            if (savedMemberSince) {
                setMemberSince(savedMemberSince);
            } else {
                // Set default member since date if not found
                const defaultDate = 'January 2024';
                setMemberSince(defaultDate);
                await AsyncStorage.setItem(MEMBER_SINCE_KEY, defaultDate);
            }
        } catch (error) {
            console.error(TAG, 'Error loading member since date:', error);
        }
    };

    const saveAccountData = async (): Promise<void> => {
        try {
            console.log(TAG, 'Saving account data to AsyncStorage');
            setIsSaving(true);
            
            const accountData: AccountData = {
                name: name.trim(),
                location: location.trim(),
            };
            
            await AsyncStorage.setItem(ACCOUNT_DATA_KEY, JSON.stringify(accountData));
            
            // TODO: Also sync with backend API
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log(TAG, 'Account data saved successfully');
            Alert.alert('Success', 'Your account information has been updated.');
            
        } catch (error) {
            console.error(TAG, 'Error saving account data:', error);
            Alert.alert('Error', 'Failed to save account information. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // ========================================
    // EVENT HANDLERS
    // ========================================

    const handleSave = async () => {
        console.log(TAG, 'Save button pressed');
        
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }
        
        await saveAccountData();
    };

    const handleLogin = () => {
        console.log(TAG, 'Login button pressed');
        // TODO: Navigate to login screen or implement login logic
        Alert.alert('Login', 'Login functionality will be implemented here');
    };

    const handleSignUp = () => {
        console.log(TAG, 'Sign up button pressed');
        // TODO: Navigate to sign up screen or implement sign up logic
        Alert.alert('Sign Up', 'Sign up functionality will be implemented here');
    };

    const handleLogout = () => {
        console.log(TAG, 'Logout button pressed');
        
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            console.log(TAG, 'User confirmed logout');
                            
                            // Clear authentication and user data
                            await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
                            await AsyncStorage.removeItem(ACCOUNT_DATA_KEY);
                            await AsyncStorage.removeItem('@planit_profile_image');
                            
                            // Update state
                            setIsLoggedIn(false);
                            setName('');
                            setLocation('');
                            setMemberSince('');
                            
                            Alert.alert('Logged Out', 'You have been successfully logged out.');
                            
                        } catch (error) {
                            console.error(TAG, 'Error during logout:', error);
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    // ========================================
    // RENDER
    // ========================================

    if (isLoading) {
        return (
            <>
                <Stack.Screen 
                    options={{ 
                        title: 'Account',
                        headerShown: true
                    }} 
                />
                <ThemedView style={styles.container}>
                    <View style={styles.loadingContainer}>
                        <MaterialCommunityIcons 
                            name="loading" 
                            size={ICON_SIZES.xxl} 
                            color={COLORS.primary} 
                        />
                        <ThemedText style={styles.loadingText}>Loading account data...</ThemedText>
                    </View>
                </ThemedView>
            </>
        );
    }

    return (
        <>
            <Stack.Screen 
                options={{ 
                    title: 'Account',
                    headerShown: true
                }} 
            />
            <ThemedView style={styles.container}>
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {isLoggedIn ? (
                        <>
                            {/* Member Since */}
                            <View style={styles.memberSinceContainer}>
                                <ThemedText type="defaultSemiBold" style={styles.memberSinceText}>
                                    Member since {memberSince}
                                </ThemedText>
                            </View>

                            {/* Name */}
                            <View style={styles.inputGroup}>
                                <ThemedText type="defaultSemiBold" style={styles.inputLabel}>
                                    Name
                                </ThemedText>
                                <View style={styles.inputContainer}>
                                    <MaterialCommunityIcons 
                                        name="account" 
                                        size={ICON_SIZES.lg} 
                                        color={COLORS.lightText} 
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.textInput}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Enter your full name"
                                        placeholderTextColor={COLORS.lightText}
                                        autoCapitalize="words"
                                        autoComplete="name"
                                        editable={!isSaving}
                                    />
                                </View>
                            </View>

                            {/* Location */}
                            <View style={styles.inputGroup}>
                                <ThemedText type="defaultSemiBold" style={styles.inputLabel}>
                                    Location
                                </ThemedText>
                                <View style={styles.inputContainer}>
                                    <MaterialCommunityIcons 
                                        name="map-marker" 
                                        size={ICON_SIZES.lg} 
                                        color={COLORS.lightText} 
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.textInput}
                                        value={location}
                                        onChangeText={setLocation}
                                        placeholder="Enter your city, country"
                                        placeholderTextColor={COLORS.lightText}
                                        autoCapitalize="words"
                                        editable={!isSaving}
                                    />
                                </View>
                            </View>

                            {/* Save Button */}
                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    (isSaving || !name.trim()) && styles.buttonDisabled
                                ]}
                                onPress={handleSave}
                                disabled={isSaving || !name.trim()}
                                accessibilityLabel="Save account information"
                                accessibilityRole="button"
                            >
                                <MaterialCommunityIcons
                                    name={isSaving ? "loading" : "content-save"}
                                    size={ICON_SIZES.lg}
                                    color={COLORS.white}
                                />
                                <Text style={styles.buttonText}>
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Text>
                            </TouchableOpacity>

                            {/* Logout Button */}
                            <TouchableOpacity
                                style={styles.logoutButton}
                                onPress={handleLogout}
                                accessibilityLabel="Logout from account"
                                accessibilityRole="button"
                            >
                                <MaterialCommunityIcons
                                    name="logout"
                                    size={ICON_SIZES.lg}
                                    color={COLORS.white}
                                />
                                <Text style={styles.logoutButtonText}>
                                    Logout
                                </Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {/* Not Logged In State */}
                            <View style={styles.authContainer}>
                                <MaterialCommunityIcons 
                                    name="account-circle" 
                                    size={80} 
                                    color={COLORS.lightText} 
                                    style={styles.authIcon}
                                />
                                <ThemedText type="title" style={styles.authTitle}>
                                    Welcome to PlanIT
                                </ThemedText>
                                <ThemedText style={styles.authSubtitle}>
                                    Sign in to access your account and manage your plans
                                </ThemedText>

                                {/* Login Button */}
                                <TouchableOpacity
                                    style={styles.loginButton}
                                    onPress={handleLogin}
                                    accessibilityLabel="Login to account"
                                    accessibilityRole="button"
                                >
                                    <MaterialCommunityIcons
                                        name="login"
                                        size={ICON_SIZES.lg}
                                        color={COLORS.white}
                                    />
                                    <Text style={styles.buttonText}>
                                        Log In
                                    </Text>
                                </TouchableOpacity>

                                {/* Sign Up Button */}
                                <TouchableOpacity
                                    style={styles.signUpButton}
                                    onPress={handleSignUp}
                                    accessibilityLabel="Sign up for account"
                                    accessibilityRole="button"
                                >
                                    <MaterialCommunityIcons
                                        name="account-plus"
                                        size={ICON_SIZES.lg}
                                        color={COLORS.primary}
                                    />
                                    <Text style={styles.signUpButtonText}>
                                        Sign Up
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </ScrollView>
            </ThemedView>
        </>
    );
}

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.md,
    },
    loadingText: {
        color: COLORS.lightText,
    },
    content: {
        flex: 1,
        padding: SPACING.xl,
    },
    inputGroup: {
        marginBottom: SPACING.xl,
    },
    inputLabel: {
        marginBottom: SPACING.sm,
        color: COLORS.text,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.white,
        ...SHADOWS.card,
    },
    inputIcon: {
        marginLeft: SPACING.lg,
    },
    textInput: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.text,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        borderRadius: RADIUS.md,
        marginTop: SPACING.xl,
        gap: SPACING.sm,
        ...SHADOWS.button,
    },
    buttonDisabled: {
        backgroundColor: COLORS.lightText,
        opacity: 0.6,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#dc3545', // Red color for destructive action
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        borderRadius: RADIUS.md,
        marginTop: SPACING.md,
        gap: SPACING.sm,
        ...SHADOWS.button,
    },
    logoutButtonText: {
        color: COLORS.white,
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    memberSinceContainer: {
        marginBottom: SPACING.xl,
        alignItems: 'center',
    },
    memberSinceText: {
        color: COLORS.lightText,
        fontSize: TYPOGRAPHY.fontSize.sm,
    },
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
        gap: SPACING.lg,
    },
    authIcon: {
        marginBottom: SPACING.md,
    },
    authTitle: {
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    authSubtitle: {
        textAlign: 'center',
        color: COLORS.lightText,
        fontSize: TYPOGRAPHY.fontSize.base,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        borderRadius: RADIUS.md,
        gap: SPACING.sm,
        ...SHADOWS.button,
    },
    signUpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.primary,
        gap: SPACING.sm,
        ...SHADOWS.button,
    },
    signUpButtonText: {
        color: COLORS.primary,
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
}); 