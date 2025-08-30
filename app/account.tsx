/**
 * AccountScreen Component
 * 
 * Account settings screen with Name, Email fields and logout functionality.
 * 
 * @author Rongbin Gu (@rongbin99)
 */

// ========================================
// IMPORTS
// ========================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Mail, Save, LogOut, LogIn, LoaderCircle, CircleUserRound, UserRoundPlus, IdCardLanyard } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ICON_SIZES, SHADOWS } from '@/constants/DesignTokens';
import { useAuth } from '@/contexts/AuthContext';

// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

const TAG = "[AccountScreen]";
const ACCOUNT_DATA_KEY = '@planit_account_data';

// ========================================
// TYPE DEFINITIONS
// ========================================

interface AccountData {
    name: string;
    email: string;
}

// ========================================
// MAIN COMPONENT
// ========================================

export default function AccountScreen() {
    console.log(TAG, 'AccountScreen component initialized');

    // ========================================
    // HOOKS & CONTEXT
    // ========================================
    
    const { user, isAuthenticated, logout, updateProfile } = useAuth();

    // ========================================
    // STATE MANAGEMENT
    // ========================================
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Track original values to detect changes
    const [originalName, setOriginalName] = useState('');
    const [originalEmail, setOriginalEmail] = useState('');

    // ========================================
    // EFFECTS
    // ========================================

    useEffect(() => {
        loadAccountData();
    }, [user]);

    // ========================================
    // DATA MANAGEMENT
    // ========================================

    const loadAccountData = async (): Promise<void> => {
        try {
            console.log(TAG, 'Loading account data');
            setIsLoading(true);
            
            if (isAuthenticated && user) {
                // Use data from auth context
                const userName = user.name || '';
                const userEmail = user.email || '';
                setName(userName);
                setEmail(userEmail);
                setOriginalName(userName);
                setOriginalEmail(userEmail);
            } else {
                // Load local data for non-authenticated users
                const savedData = await AsyncStorage.getItem(ACCOUNT_DATA_KEY);
                if (savedData) {
                    const accountData: AccountData = JSON.parse(savedData);
                    const localName = accountData.name || '';
                    const localEmail = accountData.email || '';
                    setName(localName);
                    setEmail(localEmail);
                    setOriginalName(localName);
                    setOriginalEmail(localEmail);
                }
            }
        } catch (error) {
            console.error(TAG, 'Error loading account data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveAccountData = async (): Promise<void> => {
        try {
            console.log(TAG, 'Saving account data');
            setIsSaving(true);
            
            if (isAuthenticated) {
                // Use auth context to update profile
                const success = await updateProfile({
                    name: name.trim(),
                    email: email.trim()
                });
                
                if (success) {
                    console.log(TAG, 'Profile updated successfully');
                    // Update original values to reflect the saved state
                    setOriginalName(name.trim());
                    setOriginalEmail(email.trim());
                    Alert.alert('Success', 'Your profile has been updated.');
                } else {
                    Alert.alert('Error', 'Failed to update profile. Please try again.');
                }
            } else {
                // Save locally for non-authenticated users
                const accountData: AccountData = {
                    name: name.trim(),
                    email: email.trim(),
                };
                
                await AsyncStorage.setItem(ACCOUNT_DATA_KEY, JSON.stringify(accountData));
                console.log(TAG, 'Account data saved locally');
                // Update original values to reflect the saved state
                setOriginalName(name.trim());
                setOriginalEmail(email.trim());
                Alert.alert('Success', 'Your account information has been updated.');
            }
            
        } catch (error) {
            console.error(TAG, 'Error saving account data:', error);
            Alert.alert('Error', 'Failed to save account information. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // ========================================
    // COMPUTED VALUES
    // ========================================
    
    // Check if any changes have been made
    const hasChanges = (name.trim() !== originalName) || (email.trim() !== originalEmail);
    
    // Check if form is valid (name is required)
    const isFormValid = name.trim().length > 0;
    
    // ========================================
    // EVENT HANDLERS
    // ========================================

    const handleSave = async () => {
        console.log(TAG, 'Save button pressed');
        
        if (!isFormValid) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }
        
        if (!hasChanges) {
            Alert.alert('No Changes', 'No changes have been made to save.');
            return;
        }
        
        await saveAccountData();
    };

    const handleLogin = () => {
        console.log(TAG, 'Login button pressed');
        router.push('/login');
    };

    const handleSignUp = () => {
        console.log(TAG, 'Sign up button pressed');
        router.push('/signup');
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
                            
                            // Use auth context logout
                            await logout();
                            
                            // Clear local data
                            await AsyncStorage.removeItem(ACCOUNT_DATA_KEY);
                            await AsyncStorage.removeItem('@planit_profile_image');
                            
                            // Update local state
                            setName('');
                            setEmail('');
                            setOriginalName('');
                            setOriginalEmail('');
                            
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
            <ThemedView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <LoaderCircle 
                        size={ICON_SIZES.xxl} 
                        color={COLORS.primary} 
                    />
                    <ThemedText style={styles.loadingText}>Loading account data...</ThemedText>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {isAuthenticated ? (
                    <>
                            {/* Member Since */}
                            <View style={styles.memberSinceContainer}>
                                <ThemedText type="defaultSemiBold" style={styles.memberSinceText}>
                                    Member since {user?.memberSince ? new Date(user.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}
                                </ThemedText>
                            </View>

                            {/* Name */}
                            <View style={styles.inputGroup}>
                                <ThemedText type="defaultSemiBold" style={styles.inputLabel}>
                                    Name
                                </ThemedText>
                                <View style={styles.inputContainer}>
                                    <IdCardLanyard 
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

                            {/* Email */}
                            <View style={styles.inputGroup}>
                                <ThemedText type="defaultSemiBold" style={styles.inputLabel}>
                                    Email
                                </ThemedText>
                                <View style={styles.inputContainer}>
                                    <Mail 
                                        size={ICON_SIZES.lg} 
                                        color={COLORS.lightText} 
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.textInput}
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="Enter your email address"
                                        placeholderTextColor={COLORS.lightText}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        autoComplete="email"
                                        editable={!isSaving}
                                    />
                                </View>
                            </View>

                            {/* Save Button */}
                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    (isSaving || !isFormValid || !hasChanges) && styles.buttonDisabled
                                ]}
                                onPress={handleSave}
                                disabled={isSaving || !isFormValid || !hasChanges}
                                accessibilityLabel="Save account information"
                                accessibilityRole="button"
                            >
                                {isSaving ? <LoaderCircle size={ICON_SIZES.lg} color={COLORS.white} /> : <Save size={ICON_SIZES.lg} color={COLORS.white} />}
                                <Text style={styles.buttonText}>
                                    {isSaving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
                                </Text>
                            </TouchableOpacity>

                            {/* Logout Button */}
                            <TouchableOpacity
                                style={styles.logoutButton}
                                onPress={handleLogout}
                                accessibilityLabel="Logout from account"
                                accessibilityRole="button"
                            >
                                <LogOut
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
                                <CircleUserRound 
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
                                    <LogIn
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
                                    <UserRoundPlus
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
