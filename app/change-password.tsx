/**
 * ChangePasswordScreen Component
 * 
 * Simple change password screen with current password, new password, and confirm password fields.
 * 
 * @author Rongbin Gu (@rongbin99)
 */

// ========================================
// IMPORTS
// ========================================
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { router, Stack } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ICON_SIZES, SHADOWS } from '@/constants/DesignTokens';

// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

const TAG = "[ChangePasswordScreen]";

// ========================================
// MAIN COMPONENT
// ========================================

export default function ChangePasswordScreen() {
    console.log(TAG, 'ChangePasswordScreen component initialized');

    // ========================================
    // STATE MANAGEMENT
    // ========================================
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newPasswordError, setNewPasswordError] = useState(false);
    const [confirmPasswordError, setConfirmPasswordError] = useState(false);

    // ========================================
    // EVENT HANDLERS
    // ========================================

    const validatePasswords = (): boolean => {
        let isValid = true;
        
        // Reset error states
        setNewPasswordError(false);
        setConfirmPasswordError(false);

        if (!currentPassword.trim()) {
            Alert.alert('Error', 'Please enter your current password');
            return false;
        }

        if (!newPassword.trim()) {
            Alert.alert('Error', 'Please enter a new password');
            return false;
        }

        if (newPassword.length < 6) {
            setNewPasswordError(true);
            isValid = false;
        }

        if (newPassword !== confirmPassword) {
            setConfirmPasswordError(true);
            isValid = false;
        }

        if (currentPassword === newPassword) {
            Alert.alert('Error', 'New password must be different from current password');
            return false;
        }

        return isValid;
    };

    // Helper function to check if new password meets length requirement
    const isNewPasswordValid = (password: string): boolean => {
        return password.length >= 6 || password.length === 0; // Don't show error for empty field
    };

    // Helper function to check if passwords match
    const doPasswordsMatch = (newPass: string, confirmPass: string): boolean => {
        return newPass === confirmPass || confirmPass.length === 0; // Don't show error for empty field
    };

    // Update validation states when passwords change
    const handleNewPasswordChange = (text: string) => {
        setNewPassword(text);
        setNewPasswordError(!isNewPasswordValid(text));
    };

    const handleConfirmPasswordChange = (text: string) => {
        setConfirmPassword(text);
        setConfirmPasswordError(!doPasswordsMatch(newPassword, text));
    };

    const handleChangePassword = async () => {
        console.log(TAG, 'Change password button pressed');

        if (!validatePasswords()) {
            return;
        }

        try {
            setIsLoading(true);
            
            // TODO: Implement actual password change logic with backend
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            console.log(TAG, 'Password change successful');
            
            Alert.alert(
                'Success',
                'Your password has been changed successfully.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Clear form and go back
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                            router.back();
                        }
                    }
                ]
            );
        } catch (error) {
            console.error(TAG, 'Error changing password:', error);
            Alert.alert('Error', 'Failed to change password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // ========================================
    // RENDER
    // ========================================

    return (
        <>
            <Stack.Screen 
                options={{ 
                    title: 'Change Password',
                    headerShown: true
                }} 
            />
            <ThemedView style={styles.container}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Current Password */}
                <View style={styles.inputGroup}>
                    <ThemedText type="defaultSemiBold" style={styles.inputLabel}>
                        Current Password
                    </ThemedText>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textInput}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder="Enter your current password"
                            placeholderTextColor={COLORS.lightText}
                            secureTextEntry={!showCurrentPassword}
                            autoCapitalize="none"
                            autoComplete="current-password"
                            editable={!isLoading}
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                            accessibilityLabel={showCurrentPassword ? "Hide password" : "Show password"}
                        >
                            <MaterialCommunityIcons
                                name={showCurrentPassword ? "eye-off" : "eye"}
                                size={ICON_SIZES.lg}
                                color={COLORS.lightText}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* New Password */}
                <View style={styles.inputGroup}>
                    <ThemedText type="defaultSemiBold" style={styles.inputLabel}>
                        New Password
                    </ThemedText>
                    <View style={[styles.inputContainer, newPasswordError && styles.inputContainerError]}>
                        <TextInput
                            style={styles.textInput}
                            value={newPassword}
                            onChangeText={handleNewPasswordChange}
                            placeholder="Enter your new password"
                            placeholderTextColor={COLORS.lightText}
                            secureTextEntry={!showNewPassword}
                            autoCapitalize="none"
                            autoComplete="new-password"
                            editable={!isLoading}
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowNewPassword(!showNewPassword)}
                            accessibilityLabel={showNewPassword ? "Hide password" : "Show password"}
                        >
                            <MaterialCommunityIcons
                                name={showNewPassword ? "eye-off" : "eye"}
                                size={ICON_SIZES.lg}
                                color={COLORS.lightText}
                            />
                        </TouchableOpacity>
                    </View>
                    <ThemedText style={styles.helpText}>
                        Password must be at least 6 characters long
                    </ThemedText>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                    <ThemedText type="defaultSemiBold" style={styles.inputLabel}>
                        Confirm New Password
                    </ThemedText>
                    <View style={[styles.inputContainer, confirmPasswordError && styles.inputContainerError]}>
                        <TextInput
                            style={styles.textInput}
                            value={confirmPassword}
                            onChangeText={handleConfirmPasswordChange}
                            placeholder="Confirm your new password"
                            placeholderTextColor={COLORS.lightText}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                            autoComplete="new-password"
                            editable={!isLoading}
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                            <MaterialCommunityIcons
                                name={showConfirmPassword ? "eye-off" : "eye"}
                                size={ICON_SIZES.lg}
                                color={COLORS.lightText}
                            />
                        </TouchableOpacity>
                    </View>
                    <ThemedText style={styles.helpText}>
                        Passwords must match
                    </ThemedText>
                </View>

                {/* Change Password Button */}
                <TouchableOpacity
                    style={[
                        styles.changePasswordButton,
                        (isLoading || !currentPassword || !newPassword || !confirmPassword || newPasswordError || confirmPasswordError) && styles.buttonDisabled
                    ]}
                    onPress={handleChangePassword}
                    disabled={isLoading || !currentPassword || !newPassword || !confirmPassword || newPasswordError || confirmPasswordError}
                    accessibilityLabel="Change password"
                    accessibilityRole="button"
                >
                    {isLoading ? (
                        <ActivityIndicator 
                            size={24} 
                            color={COLORS.white} 
                        />
                    ) : (
                        <>
                            <MaterialCommunityIcons
                                name="lock-reset"
                                size={ICON_SIZES.xl}
                                color={COLORS.white}
                            />
                            <Text style={styles.buttonText}>
                                Change Password
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
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
    textInput: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.text,
    },
    inputContainerError: {
        borderColor: '#e74c3c',
        borderWidth: 2,
    },
    eyeButton: {
        padding: SPACING.md,
    },
    helpText: {
        marginTop: SPACING.xs,
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.lightText,
    },
    changePasswordButton: {
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
}); 