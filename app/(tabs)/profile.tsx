/**
 * ProfileScreen Component
 * 
 * Displays user profile information and settings.
 * 
 * @author Rongbin Gu (@rongbin99)
 */

// ========================================
// IMPORTS
// ========================================
import React, { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, TouchableOpacity, View, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import AppearanceActionSheet, { showAppearanceSheet } from '@/components/AppearanceActionSheet';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS, TYPOGRAPHY, SPACING, ICON_SIZES, SHADOWS, PROFILE_LAYOUT } from '@/constants/DesignTokens';
import { useAuth } from '@/contexts/AuthContext';
import { API_URLS } from '@/constants/ApiConfig';

// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

const TAG = "[ProfileScreen]";
const PROFILE_IMAGE_KEY = '@planit_profile_image';

// ========================================
// MAIN COMPONENT
// ========================================

export default function ProfileScreen() {
    console.log(TAG, 'ProfileScreen component initialized');

    // ========================================
    // HOOKS & CONTEXT
    // ========================================
    
    const { user, isAuthenticated, refreshUserProfile, token } = useAuth();

    // ========================================
    // STATE MANAGEMENT
    // ========================================
    
    const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
    const [isLoadingImage, setIsLoadingImage] = useState(false);

    // ========================================
    // EFFECTS
    // ========================================
    
    // Component lifecycle logging and image loading
    useEffect(() => {
        console.log(TAG, 'ProfileScreen mounted');
        loadProfileImage();
        
        return () => {
            console.log(TAG, 'ProfileScreen unmounted');
        };
    }, []);

    // Refresh user profile when authentication changes
    useEffect(() => {
        if (isAuthenticated && refreshUserProfile && user) {
            console.log(TAG, 'Refreshing user profile for authenticated user');
            refreshUserProfile();
        }
    }, [isAuthenticated, user?.id]);

    // ========================================
    // IMAGE MANAGEMENT FUNCTIONS
    // ========================================
    
    /**
     * Loads the saved profile image from AsyncStorage
     */
    const loadProfileImage = async (): Promise<void> => {
        try {
            console.log(TAG, 'Loading profile image from AsyncStorage');
            const savedImageUri = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
            
            if (savedImageUri) {
                console.log(TAG, 'Profile image found:', savedImageUri);
                setProfileImageUri(savedImageUri);
            } else {
                console.log(TAG, 'No saved profile image found');
            }
        } catch (error) {
            console.error(TAG, 'Error loading profile image:', error);
        }
    };

    /**
     * Saves the profile image URI to AsyncStorage
     * @param imageUri - The image URI to save
     */
    const saveProfileImage = async (imageUri: string): Promise<void> => {
        try {
            console.log(TAG, 'Saving profile image to AsyncStorage:', imageUri);
            await AsyncStorage.setItem(PROFILE_IMAGE_KEY, imageUri);
            console.log(TAG, 'Profile image saved successfully');
        } catch (error) {
            console.error(TAG, 'Error saving profile image:', error);
        }
    };

    /**
     * Requests media library permissions
     * @returns Promise<boolean> - Whether permission was granted
     */
    const requestImagePermissions = async (): Promise<boolean> => {
        try {
            console.log(TAG, 'Requesting image picker permissions');
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (status !== 'granted') {
                console.warn(TAG, 'Image picker permission denied');
                Alert.alert(
                    'Permission Required',
                    'Sorry, we need media library permissions to change your profile picture.',
                    [{ text: 'OK' }]
                );
                return false;
            }
            
            console.log(TAG, 'Image picker permissions granted');
            return true;
        } catch (error) {
            console.error(TAG, 'Error requesting image permissions:', error);
            return false;
        }
    };

    /**
     * Opens image picker and handles image selection
     */
    const pickImage = async (): Promise<void> => {
        try {
            console.log(TAG, 'Starting image picker process');
            setIsLoadingImage(true);

            // Request permissions
            const hasPermission = await requestImagePermissions();
            if (!hasPermission) {
                setIsLoadingImage(false);
                return;
            }

            // Launch image picker
            console.log(TAG, 'Launching image picker');
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1], // Square aspect ratio for profile picture
                quality: 0.8, // Compress to reduce storage size
            });

            console.log(TAG, 'Image picker result:', {
                canceled: result.canceled,
                hasAssets: !!(result.assets && result.assets.length > 0)
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedImage = result.assets[0];
                console.log(TAG, 'Image selected:', {
                    uri: selectedImage.uri,
                    width: selectedImage.width,
                    height: selectedImage.height,
                    fileSize: selectedImage.fileSize
                });

                // Upload image to backend if user is authenticated
                if (isAuthenticated && token) {
                    await uploadImageToBackend(selectedImage.uri);
                } else {
                    // Fallback to local storage for non-authenticated users
                    setProfileImageUri(selectedImage.uri);
                    await saveProfileImage(selectedImage.uri);
                }
                
                console.log(TAG, 'Profile image updated successfully');
            } else {
                console.log(TAG, 'Image picker was canceled');
            }
        } catch (error) {
            console.error(TAG, 'Error picking image:', error);
            Alert.alert(
                'Error',
                'Failed to pick image. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsLoadingImage(false);
        }
    };

    /**
     * Uploads image to backend
     */
    const uploadImageToBackend = async (imageUri: string): Promise<void> => {
        try {
            console.log(TAG, 'Uploading image to backend');
            
            // Create form data
            const formData = new FormData();
            formData.append('image', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'profile-image.jpg'
            } as any);

            // Make API call
            const response = await fetch(API_URLS.USER_PROFILE_IMAGE, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                console.log(TAG, 'Image uploaded successfully:', result.imageUrl);
                
                // Update local state with the backend URL
                const fullImageUrl = `${API_URLS.USER_PROFILE_IMAGE.replace('/api/user/profile-image', '')}${result.imageUrl}`;
                setProfileImageUri(fullImageUrl);
                
                // Update user context with new profile image URL
                if (refreshUserProfile) {
                    await refreshUserProfile();
                }
            } else {
                console.error(TAG, 'Image upload failed:', result.message);
                Alert.alert('Upload Failed', result.message || 'Failed to upload image. Please try again.');
            }
        } catch (error) {
            console.error(TAG, 'Error uploading image:', error);
            Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
        }
    };

    /**
     * Clears the saved profile image and resets to default
     */
    const clearProfileImage = async (): Promise<void> => {
        try {
            console.log(TAG, 'Clearing profile image');
            await AsyncStorage.removeItem(PROFILE_IMAGE_KEY);
            setProfileImageUri(null);
            console.log(TAG, 'Profile image cleared successfully');
        } catch (error) {
            console.error(TAG, 'Error clearing profile image:', error);
        }
    };

    // ========================================
    // EVENT HANDLERS
    // ========================================

    // Link opening handlers
    const openGitHub = async () => {
        console.log(TAG, 'Opening GitHub repository link');
        try {
            const url = 'https://github.com/Rongbin99/PlanIT';
            const supported = await Linking.canOpenURL(url);
            
            if (supported) {
                await Linking.openURL(url);
                console.log(TAG, 'Successfully opened GitHub link');
            } else {
                console.warn(TAG, 'Cannot open GitHub URL - not supported');
            }
        } catch (error) {
            console.error(TAG, 'Error opening GitHub link:', error);
        }
    };

    // Profile action handlers
    const handleProfileImagePress = () => {
        console.log(TAG, 'Profile image edit button pressed');
        pickImage();
    };

    const handleProfileImageLongPress = () => {
        console.log(TAG, 'Profile image long pressed');
        
        if (profileImageUri) {
            Alert.alert(
                'Reset Profile Picture',
                'Do you want to reset your profile picture to default?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Reset', 
                        style: 'destructive',
                        onPress: clearProfileImage 
                    }
                ]
            );
        }
    };

    const handleSettingPress = (settingName: string) => {
        console.log(TAG, `Setting pressed: ${settingName}`);
        
        switch (settingName) {
            case 'Change Password':
                if (isAuthenticated) {
                    router.push('/change-password' as any);
                } else {
                    console.log(TAG, 'User not authenticated, redirecting to login for password change');
                    Alert.alert(
                        'Login Required',
                        'You need to be logged in to change your password. Would you like to sign in now?',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                                text: 'Sign In', 
                                onPress: () => router.push('/account' as any)
                            }
                        ]
                    );
                }
                break;
            case 'Account':
                router.push('/account' as any);
                break;
            case 'Appearance':
                showAppearanceSheet();
                break;
            default:
                // TODO: Implement other settings screens
                console.log(TAG, `Setting "${settingName}" not implemented yet`);
                break;
        }
    };

    console.log(TAG, 'Profile image state:', {
        hasCustomImage: !!profileImageUri,
        isLoading: isLoadingImage,
        imageUri: profileImageUri ? `${profileImageUri.substring(0, 50)}...` : 'default'
    });

    return (
        <ThemedView style={styles.container}>
            {/* Profile Header with Banner */}
            <View style={styles.bannerContainer}>
                <Image
                    source={require('@/assets/images/profile-banner.jpg')}
                    style={styles.bannerImage}
                />
                <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.profileOverlay}>
                    <TouchableOpacity 
                        style={styles.profileImageContainer}
                        onPress={handleProfileImagePress}
                        onLongPress={handleProfileImageLongPress}
                        accessibilityLabel="Edit profile picture"
                        accessibilityRole="button"
                        accessibilityHint="Tap to change, long press to reset to default"
                    >
                        <Image
                            source={
                                isAuthenticated && user?.profileImageUrl 
                                    ? { uri: `${API_URLS.USER_PROFILE_IMAGE.replace('/api/user/profile-image', '')}${user.profileImageUrl}` }
                                    : profileImageUri 
                                        ? { uri: profileImageUri } 
                                        : require('@/assets/images/default-avatar.jpg')
                            }
                            style={styles.profileImage}
                        />
                        <View style={styles.editIconContainer}>
                            {isLoadingImage ? (
                                <MaterialCommunityIcons name="loading" size={ICON_SIZES.lg} color={COLORS.white} />
                            ) : (
                                <MaterialCommunityIcons name="camera" size={ICON_SIZES.lg} color={COLORS.white} />
                            )}
                        </View>
                    </TouchableOpacity>
                    <ThemedText type="title" style={styles.userName}>
                        {isAuthenticated && user ? user.name : 'Guest User'}
                    </ThemedText>
                    <ThemedView style={styles.statsContainer}>
                        <ThemedView style={styles.statItem}>
                            <ThemedText type="defaultSemiBold">
                                {isAuthenticated && user ? user.adventuresCount : 0}
                            </ThemedText>
                            <ThemedText>Adventures</ThemedText>
                        </ThemedView>
                        <ThemedView style={styles.statDivider} />
                        <ThemedView style={styles.statItem}>
                            <ThemedText type="defaultSemiBold">
                                {isAuthenticated && user ? user.placesVisitedCount : 0}
                            </ThemedText>
                            <ThemedText>Places</ThemedText>
                        </ThemedView>
                    </ThemedView>
                </View>
            </View>

            {/* Settings Menu */}
            <ThemedView style={styles.settingsContainer}>
                <ThemedText type="subtitle" style={styles.settingsTitle}>Settings</ThemedText>
                
                <TouchableOpacity 
                    style={styles.settingItem}
                    onPress={() => handleSettingPress('Account')}
                    accessibilityLabel="Account settings"
                    accessibilityRole="button"
                >
                    <MaterialCommunityIcons name="account-outline" size={ICON_SIZES.xl} color={COLORS.lightText} />
                    <ThemedText style={styles.settingText}>Account</ThemedText>
                    <MaterialCommunityIcons name="chevron-right" size={ICON_SIZES.xl} color={COLORS.lightText} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.settingItem}
                    onPress={() => handleSettingPress('Change Password')}
                    accessibilityLabel="Change password settings"
                    accessibilityRole="button"
                >
                    <MaterialCommunityIcons name="lock-outline" size={ICON_SIZES.xl} color={COLORS.lightText} />
                    <ThemedText style={styles.settingText}>Change Password</ThemedText>
                    <MaterialCommunityIcons name="chevron-right" size={ICON_SIZES.xl} color={COLORS.lightText} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.settingItem}
                    onPress={() => handleSettingPress('Appearance')}
                    accessibilityLabel="Appearance settings"
                    accessibilityRole="button"
                >
                    <MaterialCommunityIcons name="palette-outline" size={ICON_SIZES.xl} color={COLORS.lightText} />
                    <ThemedText style={styles.settingText}>Appearance</ThemedText>
                    <MaterialCommunityIcons name="chevron-down" size={ICON_SIZES.xl} color={COLORS.lightText} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.settingItem}
                    onPress={() => handleSettingPress('Rate PlanIT')}
                    accessibilityLabel="Rate the app"
                    accessibilityRole="button"
                >
                    <MaterialCommunityIcons name="star-outline" size={ICON_SIZES.xl} color={COLORS.lightText} />
                    <ThemedText style={styles.settingText}>Rate Us</ThemedText>
                    <MaterialCommunityIcons name="open-in-new" size={ICON_SIZES.xl} color={COLORS.lightText} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.settingItem}
                    onPress={() => handleSettingPress('Check for Updates')}
                    accessibilityLabel="Check for app updates"
                    accessibilityRole="button"
                >
                    <MaterialCommunityIcons name="update" size={ICON_SIZES.xl} color={COLORS.lightText} />
                    <ThemedText style={styles.settingText}>Check for Updates</ThemedText>
                    <MaterialCommunityIcons name="open-in-new" size={ICON_SIZES.xl} color={COLORS.lightText} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.settingItem} 
                    onPress={openGitHub}
                    accessibilityLabel="Support on GitHub"
                    accessibilityRole="button"
                >
                    <MaterialCommunityIcons name="github" size={ICON_SIZES.xl} color={COLORS.lightText} />
                    <ThemedText style={styles.settingText}>Support on GitHub</ThemedText>
                    <MaterialCommunityIcons name="open-in-new" size={ICON_SIZES.xl} color={COLORS.lightText} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.settingItem}
                    onPress={() => handleSettingPress('Legal & About')}
                    accessibilityLabel="Legal information and about"
                    accessibilityRole="button"
                >
                    <MaterialCommunityIcons name="information-outline" size={ICON_SIZES.xl} color={COLORS.lightText} />
                    <ThemedText style={styles.settingText}>Legal & About</ThemedText>
                    <MaterialCommunityIcons name="open-in-new" size={ICON_SIZES.xl} color={COLORS.lightText} />
                </TouchableOpacity>
            </ThemedView>

            {/* Copyright */}
            <ThemedText style={styles.copyright}>
                &copy; {new Date().getFullYear()} PlanIT. Made by Rongbin99.
            </ThemedText>

            {/* Appearance Theme Selection Action Sheet */}
            <AppearanceActionSheet 
                onThemeChange={(theme) => {
                    console.log(TAG, 'Theme changed to:', theme);
                }}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bannerContainer: {
        height: PROFILE_LAYOUT.bannerHeight,
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    profileOverlay: {
        position: 'absolute',
        bottom: PROFILE_LAYOUT.profileOverlayOffset,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingBottom: SPACING.sm + SPACING.xs, // 10
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: SPACING.sm + SPACING.xs, // 10
        backgroundColor: COLORS.white,
        borderRadius: PROFILE_LAYOUT.profileImageRadius,
        padding: 2,
        ...SHADOWS.card,
    },
    profileImage: {
        width: PROFILE_LAYOUT.profileImageSize,
        height: PROFILE_LAYOUT.profileImageSize,
        borderRadius: PROFILE_LAYOUT.profileImageRadius,
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        borderRadius: PROFILE_LAYOUT.editIconRadius,
        width: PROFILE_LAYOUT.editIconSize,
        height: PROFILE_LAYOUT.editIconSize,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.card,
    },
    userName: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        marginBottom: SPACING.xs,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        backgroundColor: COLORS.white,
        borderRadius: PROFILE_LAYOUT.statsContainerRadius,
        padding: SPACING.sm + SPACING.xs, // 10
        ...SHADOWS.card,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: PROFILE_LAYOUT.statDividerHeight,
        backgroundColor: COLORS.border,
        marginHorizontal: SPACING.xl,
    },
    settingsContainer: {
        paddingHorizontal: SPACING.xl,
        marginTop: PROFILE_LAYOUT.settingsTopMargin,
    },
    settingsTitle: {
        marginBottom: SPACING.xxl,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md + SPACING.xs, // 14
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    settingText: {
        flex: 1,
        marginLeft: SPACING.lg,
    },
    copyright: {
        textAlign: 'center',
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.lightText,
        marginTop: SPACING.sm,
        marginBottom: SPACING.lg,
        opacity: 0.8,
    },
});
