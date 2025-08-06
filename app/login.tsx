/**
 * LoginScreen Component
 * 
 * User login screen with email/password authentication.
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
import { Mail, LogIn, Eye, EyeOff, UserRound, KeyRound, LoaderCircle } from 'lucide-react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ICON_SIZES, SHADOWS } from '@/constants/DesignTokens';
import { useAuth } from '@/contexts/AuthContext';

// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

const TAG = "[LoginScreen]";

// ========================================
// MAIN COMPONENT
// ========================================

export default function LoginScreen() {
    console.log(TAG, 'LoginScreen component initialized');

    // ========================================
    // HOOKS & CONTEXT
    // ========================================
    
    const { login, isLoading: authLoading } = useAuth();

    // ========================================
    // STATE MANAGEMENT
    // ========================================
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);

    // ========================================
    // VALIDATION
    // ========================================

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateForm = (): boolean => {
        let isValid = true;
        
        // Reset error states
        setEmailError(false);
        setPasswordError(false);

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
            Alert.alert('Error', 'Please enter your password');
            setPasswordError(true);
            return false;
        }

        return isValid;
    };

    // ========================================
    // EVENT HANDLERS
    // ========================================

    const handleLogin = async () => {
        console.log(TAG, 'Login attempt for email:', email);

        if (!validateForm()) {
            return;
        }

        try {
            setIsLoading(true);
            
            const success = await login(email.trim(), password);
            
            if (success) {
                console.log(TAG, 'Login successful, navigating back');
                router.back();
            }
            // Error handling is done in the auth context
            
        } catch (error) {
            console.error(TAG, 'Login error:', error);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUpPress = () => {
        console.log(TAG, 'Navigate to sign up');
        router.push('/signup');
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // ========================================
    // RENDER
    // ========================================

    console.log(TAG, 'Rendering LoginScreen');

    return (
        <>
            <Stack.Screen 
                options={{
                    title: 'Sign In',
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
                            <UserRound 
                                size={80} 
                                color={COLORS.primary} 
                                style={styles.titleIcon}
                            />
                            <ThemedText type="title" style={styles.title}>
                                Welcome Back
                            </ThemedText>
                            <ThemedText style={styles.subtitle}>
                                Sign in to your PlanIT account
                            </ThemedText>
                        </View>

                        {/* Form Section */}
                        <View style={styles.formSection}>
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
                                        onChangeText={(text) => {
                                            setEmail(text);
                                            setEmailError(false);
                                        }}
                                        placeholder="Enter your email"
                                        placeholderTextColor={COLORS.lightText}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!isLoading}
                                        accessibilityLabel="Email address input"
                                    />
                                </View>
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Password</Text>
                                <View style={[styles.inputWrapper, passwordError && styles.inputError]}>
                                    <KeyRound
                                        size={ICON_SIZES.md}
                                        color={passwordError ? COLORS.error : COLORS.lightText}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.textInput}
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            setPasswordError(false);
                                        }}
                                        placeholder="Enter your password"
                                        placeholderTextColor={COLORS.lightText}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!isLoading}
                                        accessibilityLabel="Password input"
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
                            </View>

                            {/* Login Button */}
                            <TouchableOpacity
                                style={[styles.loginButton, (isLoading || authLoading) && styles.loginButtonDisabled]}
                                onPress={handleLogin}
                                disabled={isLoading || authLoading}
                                accessibilityLabel="Login button"
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
                                            Signing In...
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.buttonContent}>
                                        <LogIn
                                            size={ICON_SIZES.md}
                                            color={COLORS.white}
                                        />
                                        <Text style={styles.buttonText}>
                                            Sign In
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Sign Up Section */}
                        <View style={styles.signUpSection}>
                            <ThemedText style={styles.signUpText}>
                                Don't have an account?
                            </ThemedText>
                            <TouchableOpacity
                                onPress={handleSignUpPress}
                                disabled={isLoading || authLoading}
                                accessibilityLabel="Go to sign up screen"
                                accessibilityRole="button"
                            >
                                <Text style={styles.signUpLink}>
                                    Sign Up
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
    
    loginButton: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        alignItems: 'center',
        marginTop: SPACING.lg,
        ...SHADOWS.sm,
    },
    
    loginButtonDisabled: {
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
    
    signUpSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.xs,
        marginTop: SPACING.lg,
    },
    
    signUpText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.lightText,
    },
    
    signUpLink: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
    },
}); 
