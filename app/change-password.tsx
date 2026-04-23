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
import { Eye, EyeOff, RotateCcwKey } from 'lucide-react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ICON_SIZES, SHADOWS } from '@/constants/DesignTokens';
import { useAuth } from '@/contexts/AuthContext';
import { API_URLS, DEFAULT_HEADERS } from '@/constants/ApiConfig';
import { useThemeColor } from '@/hooks/useThemeColor';

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
    // HOOKS & CONTEXT
    // ========================================

    const { token } = useAuth();
    const textColor = useThemeColor('text');
    const mutedTextColor = useThemeColor('mutedText');
    const borderColor = useThemeColor('border');
    const cardColor = useThemeColor('card');

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

            const response = await fetch(API_URLS.USER_PASSWORD, {
                method: 'PUT',
                headers: {
                    ...DEFAULT_HEADERS,
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const result = await response.json();

            if (result.success) {
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
            } else {
                console.warn(TAG, 'Password change failed:', result.message);
                Alert.alert('Error', result.message || 'Failed to change password. Please try again.');
            }
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
                        <ThemedText type="defaultSemiBold" style={[styles.inputLabel, { color: textColor }]}>
                            Current Password
                        </ThemedText>
                        <View style={[styles.inputContainer, { borderColor, backgroundColor: cardColor }]}>
                            <TextInput
                                style={[styles.textInput, { color: textColor }]}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Enter your current password"
                                placeholderTextColor={mutedTextColor}
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
                                {showCurrentPassword ? <EyeOff size={ICON_SIZES.lg} color={mutedTextColor} /> : <Eye size={ICON_SIZES.lg} color={mutedTextColor} />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* New Password */}
                    <View style={styles.inputGroup}>
                        <ThemedText type="defaultSemiBold" style={[styles.inputLabel, { color: textColor }]}>
                            New Password
                        </ThemedText>
                        <View style={[styles.inputContainer, { borderColor, backgroundColor: cardColor }, newPasswordError && styles.inputContainerError]}>
                            <TextInput
                                style={[styles.textInput, { color: textColor }]}
                                value={newPassword}
                                onChangeText={handleNewPasswordChange}
                                placeholder="Enter your new password"
                                placeholderTextColor={mutedTextColor}
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
                                {showNewPassword ? <EyeOff size={ICON_SIZES.lg} color={mutedTextColor} /> : <Eye size={ICON_SIZES.lg} color={mutedTextColor} />}
                            </TouchableOpacity>
                        </View>
                        <ThemedText style={[styles.helpText, { color: mutedTextColor }]}>
                            Password must be at least 6 characters long
                        </ThemedText>
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                        <ThemedText type="defaultSemiBold" style={[styles.inputLabel, { color: textColor }]}>
                            Confirm New Password
                        </ThemedText>
                        <View style={[styles.inputContainer, { borderColor, backgroundColor: cardColor }, confirmPasswordError && styles.inputContainerError]}>
                            <TextInput
                                style={[styles.textInput, { color: textColor }]}
                                value={confirmPassword}
                                onChangeText={handleConfirmPasswordChange}
                                placeholder="Confirm your new password"
                                placeholderTextColor={mutedTextColor}
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
                                {showConfirmPassword ? <EyeOff size={ICON_SIZES.lg} color={mutedTextColor} /> : <Eye size={ICON_SIZES.lg} color={mutedTextColor} />}
                            </TouchableOpacity>
                        </View>
                        <ThemedText style={[styles.helpText, { color: mutedTextColor }]}>
                            Passwords must match
                        </ThemedText>
                    </View>

                    {/* Change Password Button */}
                    <TouchableOpacity
                        style={[
                            styles.changePasswordButton,
                            (isLoading || !currentPassword || !newPassword || !confirmPassword || newPasswordError || confirmPasswordError) && [styles.buttonDisabled, { backgroundColor: mutedTextColor }]
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
                                <RotateCcwKey
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
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: RADIUS.md,
        ...SHADOWS.card,
    },
    textInput: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        fontSize: TYPOGRAPHY.fontSize.base,
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
