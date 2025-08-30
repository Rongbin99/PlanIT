/**
 * SignupScreen Component
 * 
 * User registration screen with email/password/name input.
 * Features form validation, loading states, and integration with auth context.
 * 
 * @author Rongbin Gu (@rongbin99)
 */

// ========================================
// IMPORTS
// ========================================
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { Mail, LockKeyhole, Eye, EyeOff, UserRoundPlus, IdCardLanyard, LockKeyholeOpen, LoaderCircle } from 'lucide-react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ICON_SIZES, SHADOWS } from '@/constants/DesignTokens';
import { useAuth } from '@/contexts/AuthContext';

// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

const TAG = "[SignupScreen]";

// ========================================
// MAIN COMPONENT
// ========================================

export default function SignupScreen() {
    console.log(TAG, 'SignupScreen component initialized');

    // ========================================
    // HOOKS & CONTEXT
    // ========================================
    
    const { signup, isLoading: authLoading } = useAuth();

    // ========================================
    // STATE MANAGEMENT
    // ========================================
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [nameError, setNameError] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [confirmPasswordError, setConfirmPasswordError] = useState(false);

    // ========================================
    // VALIDATION
    // ========================================

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Helper function to check if email is valid
    const isEmailValid = (email: string): boolean => {
        return validateEmail(email) || email.length === 0; // Don't show error for empty field
    };

    // Helper function to check if password meets length requirement
    const isPasswordValid = (password: string): boolean => {
        return password.length >= 6 || password.length === 0; // Don't show error for empty field
    };

    // Helper function to check if passwords match
    const doPasswordsMatch = (password: string, confirmPass: string): boolean => {
        return password === confirmPass || confirmPass.length === 0; // Don't show error for empty field
    };

    const validateForm = (): boolean => {
        let isValid = true;
        
        // Reset error states
        setNameError(false);
        setEmailError(false);
        setPasswordError(false);
        setConfirmPasswordError(false);

        if (!name.trim()) {
            Alert.alert('Error', 'Please enter your full name');
            setNameError(true);
            return false;
        }

        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            setEmailError(true);
            return false;
        }

        if (!validateEmail(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            setEmailError(true);
            return false;
        }

        if (!password.trim()) {
            Alert.alert('Error', 'Please enter a password');
            setPasswordError(true);
            return false;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            setPasswordError(true);
            return false;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            setConfirmPasswordError(true);
            return false;
        }

        return isValid;
    };

    // Update validation states when fields change
    const handleEmailChange = (text: string) => {
        setEmail(text);
        setEmailError(!isEmailValid(text));
    };

    const handlePasswordChange = (text: string) => {
        setPassword(text);
        setPasswordError(!isPasswordValid(text));
        // Also revalidate confirm password when main password changes
        if (confirmPassword.length > 0) {
            setConfirmPasswordError(!doPasswordsMatch(text, confirmPassword));
        }
    };

    const handleConfirmPasswordChange = (text: string) => {
        setConfirmPassword(text);
        setConfirmPasswordError(!doPasswordsMatch(password, text));
    };

    // ========================================
    // EVENT HANDLERS
    // ========================================

    const handleSignup = async () => {
        console.log(TAG, 'Signup attempt for email:', email);

        if (!validateForm()) {
            return;
        }

        try {
            setIsLoading(true);
            
            const success = await signup(email.trim(), password, name.trim());
            
            if (success) {
                console.log(TAG, 'Signup successful, navigating back');
                router.back();
            }
            // Error handling is done in the auth context
            
        } catch (error) {
            console.error(TAG, 'Signup error:', error);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginPress = () => {
        console.log(TAG, 'Navigate to login');
        router.back(); // Go back to login
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    // ========================================
    // RENDER
    // ========================================

    console.log(TAG, 'Rendering SignupScreen');

    return (
        <>
            <Stack.Screen 
                options={{
                    title: 'Sign Up',
                    headerShown: true
                }}
            />
            
            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ThemedView style={styles.container}>
                    <ScrollView 
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Title Section */}
                        <View style={styles.titleSection}>
                            <UserRoundPlus 
                                size={80} 
                                color={COLORS.primary} 
                                style={styles.titleIcon}
                            />
                            <ThemedText type="title" style={styles.title}>
                                Create Account
                            </ThemedText>
                            <ThemedText style={styles.subtitle}>
                                Join PlanIT to start planning amazing adventures
                            </ThemedText>
                        </View>

                        {/* Form Section */}
                        <View style={styles.formSection}>
                            {/* Name Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Full Name</Text>
                                <View style={[styles.inputWrapper, nameError && styles.inputError]}>
                                    <IdCardLanyard 
                                        size={ICON_SIZES.md}
                                        color={nameError ? COLORS.error : COLORS.lightText}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.textInput}
                                        value={name}
                                        onChangeText={(text) => {
                                            setName(text);
                                            setNameError(false);
                                        }}
                                        placeholder="Enter your full name"
                                        placeholderTextColor={COLORS.lightText}
                                        autoCapitalize="words"
                                        autoCorrect={false}
                                        editable={!isLoading}
                                        accessibilityLabel="Full name input"
                                    />
                                </View>
                            </View>

                            {/* Email Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={[styles.inputWrapper, emailError && styles.inputError]}>
                                    <Mail
                                        size={ICON_SIZES.md}
                                        color={emailError ? COLORS.error : COLORS.lightText}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.textInput}
                                        value={email}
                                        onChangeText={handleEmailChange}
                                        placeholder="Enter your email"
                                        placeholderTextColor={COLORS.lightText}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!isLoading}
                                        accessibilityLabel="Email address input"
                                        {...(Platform.OS === 'ios' && {
                                            textContentType: 'emailAddress',
                                            autoComplete: 'email'
                                        })}
                                    />
                                </View>
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Password</Text>
                                <View style={[styles.inputWrapper, passwordError && styles.inputError]}>
                                    <LockKeyholeOpen
                                        size={ICON_SIZES.md}
                                        color={passwordError ? COLORS.error : COLORS.lightText}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.textInput}
                                        value={password}
                                        onChangeText={handlePasswordChange}
                                        placeholder="Enter your password"
                                        placeholderTextColor={COLORS.lightText}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!isLoading}
                                        accessibilityLabel="Password input"
                                        {...(Platform.OS === 'ios' && {
                                            textContentType: 'newPassword',
                                            autoComplete: 'password'
                                        })}
                                    />
                                    <TouchableOpacity
                                        style={styles.passwordToggle}
                                        onPress={togglePasswordVisibility}
                                        accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                                        accessibilityRole="button"
                                    >
                                        {showPassword ? <EyeOff size={ICON_SIZES.md} color={COLORS.lightText} /> : <Eye size={ICON_SIZES.md} color={COLORS.lightText} />}
                                    </TouchableOpacity>
                                </View>
                                <ThemedText style={styles.helpText}>
                                    Password must be at least 6 characters long
                                </ThemedText>
                            </View>

                            {/* Confirm Password Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <View style={[styles.inputWrapper, confirmPasswordError && styles.inputError]}>
                                    <LockKeyhole 
                                        size={ICON_SIZES.md}
                                        color={confirmPasswordError ? COLORS.error : COLORS.lightText}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.textInput}
                                        value={confirmPassword}
                                        onChangeText={handleConfirmPasswordChange}
                                        placeholder="Confirm your password"
                                        placeholderTextColor={COLORS.lightText}
                                        secureTextEntry={!showConfirmPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!isLoading}
                                        accessibilityLabel="Confirm password input"
                                        {...(Platform.OS === 'ios' && {
                                            textContentType: 'newPassword',
                                            autoComplete: 'password'
                                        })}
                                    />
                                    <TouchableOpacity
                                        style={styles.passwordToggle}
                                        onPress={toggleConfirmPasswordVisibility}
                                        accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
                                        accessibilityRole="button"
                                    >
                                        {showConfirmPassword ? <EyeOff size={ICON_SIZES.md} color={COLORS.lightText} /> : <Eye size={ICON_SIZES.md} color={COLORS.lightText} />}
                                    </TouchableOpacity>
                                </View>
                                <ThemedText style={styles.helpText}>
                                    Passwords must match
                                </ThemedText>
                            </View>

                            {/* Signup Button */}
                            <TouchableOpacity
                                style={[styles.signupButton, (isLoading || authLoading) && styles.signupButtonDisabled]}
                                onPress={handleSignup}
                                disabled={isLoading || authLoading}
                                accessibilityLabel="Sign up button"
                                accessibilityRole="button"
                            >
                                {isLoading || authLoading ? (
                                    <View style={styles.loadingContainer}>
                                        <LoaderCircle
                                            size={ICON_SIZES.md}
                                            color={COLORS.white}
                                            style={styles.loadingIcon}
                                        />
                                        <Text style={styles.buttonText}>
                                            Creating Account...
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.buttonContent}>
                                        <UserRoundPlus
                                            size={ICON_SIZES.md}
                                            color={COLORS.white}
                                        />
                                        <Text style={styles.buttonText}>
                                            Create Account
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Login Section */}
                        <View style={styles.loginSection}>
                            <ThemedText style={styles.loginText}>
                                Already have an account?
                            </ThemedText>
                            <TouchableOpacity
                                onPress={handleLoginPress}
                                disabled={isLoading || authLoading}
                                accessibilityLabel="Go to login screen"
                                accessibilityRole="button"
                            >
                                <Text style={styles.loginLink}>
                                    Sign In
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </ThemedView>
            </KeyboardAvoidingView>
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
    
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xl,
    },
    
    titleSection: {
        alignItems: 'center',
        marginTop: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    
    titleIcon: {
        marginBottom: SPACING.md,
    },
    
    title: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        textAlign: 'center',
        marginBottom: SPACING.sm,
        color: COLORS.text,
    },
    
    subtitle: {
        fontSize: TYPOGRAPHY.fontSize.base,
        textAlign: 'center',
        color: COLORS.lightText,
    },
    
    formSection: {
        marginBottom: SPACING.xl,
    },
    
    inputContainer: {
        marginBottom: SPACING.lg,
    },
    
    label: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.md,
        minHeight: 50,
    },
    
    inputError: {
        borderColor: COLORS.error,
        backgroundColor: COLORS.errorBackground,
    },
    
    inputIcon: {
        marginRight: SPACING.sm,
    },
    
    textInput: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.text,
        paddingVertical: SPACING.sm,
    },
    
    passwordToggle: {
        padding: SPACING.xs,
        marginLeft: SPACING.sm,
    },
    
    helpText: {
        marginTop: SPACING.xs,
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.lightText,
    },
    
    signupButton: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        alignItems: 'center',
        marginTop: SPACING.lg,
        ...SHADOWS.sm,
    },
    
    signupButtonDisabled: {
        backgroundColor: COLORS.disabled,
        opacity: 0.6,
    },
    
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    
    loadingIcon: {
        transform: [{ rotate: '45deg' }],
    },
    
    buttonText: {
        color: COLORS.white,
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    
    loginSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.xs,
        marginTop: SPACING.lg,
    },
    
    loginText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.lightText,
    },
    
    loginLink: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
    },
}); 
