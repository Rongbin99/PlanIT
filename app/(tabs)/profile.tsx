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
import { Image } from 'expo-image';
import { StyleSheet, TouchableOpacity, View, Linking } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ICON_SIZES, SHADOWS, LAYOUT, TIME_CONSTANTS } from '@/constants/DesignTokens';

// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

const TAG = "[ProfileScreen]";

// ========================================
// MAIN COMPONENT
// ========================================

export default function ProfileScreen() {
    // Link opening handlers
    const openGitHub = () => {
        Linking.openURL('https://github.com/Rongbin99/PlanIT');
    };

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
                    <TouchableOpacity style={styles.profileImageContainer}>
                        <Image
                            source={require('@/assets/images/default-avatar.jpg')}
                            style={styles.profileImage}
                        />
                        <View style={styles.editIconContainer}>
                            <MaterialCommunityIcons name="camera" size={ICON_SIZES.lg} color={COLORS.white} />
                        </View>
                    </TouchableOpacity>
                    <ThemedText type="title" style={styles.userName}>John Doe</ThemedText>
                    <ThemedView style={styles.statsContainer}>
                        <ThemedView style={styles.statItem}>
                            <ThemedText type="defaultSemiBold">12</ThemedText>
                            <ThemedText>Adventures</ThemedText>
                        </ThemedView>
                        <ThemedView style={styles.statDivider} />
                        <ThemedView style={styles.statItem}>
                            <ThemedText type="defaultSemiBold">5</ThemedText>
                            <ThemedText>Places</ThemedText>
                        </ThemedView>
                    </ThemedView>
                </View>
            </View>

            {/* Settings Menu */}
            <ThemedView style={styles.settingsContainer}>
                <ThemedText type="subtitle" style={styles.settingsTitle}>Settings</ThemedText>
                
                <TouchableOpacity style={styles.settingItem}>
                    <MaterialCommunityIcons name="lock-outline" size={ICON_SIZES.xl} color={COLORS.lightText} />
                    <ThemedText style={styles.settingText}>Change Password</ThemedText>
                    <MaterialCommunityIcons name="chevron-right" size={ICON_SIZES.xl} color={COLORS.lightText} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                    <MaterialCommunityIcons name="account-outline" size={ICON_SIZES.xl} color={COLORS.lightText} />
                    <ThemedText style={styles.settingText}>Account</ThemedText>
                    <MaterialCommunityIcons name="chevron-right" size={ICON_SIZES.xl} color={COLORS.lightText} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                    <MaterialCommunityIcons name="palette-outline" size={ICON_SIZES.xl} color={COLORS.lightText} />
                    <ThemedText style={styles.settingText}>Appearance</ThemedText>
                    <MaterialCommunityIcons name="chevron-right" size={ICON_SIZES.xl} color={COLORS.lightText} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                    <MaterialCommunityIcons name="star-outline" size={ICON_SIZES.xl} color={COLORS.lightText} />
                    <ThemedText style={styles.settingText}>Rate Us</ThemedText>
                    <MaterialCommunityIcons name="chevron-right" size={ICON_SIZES.xl} color={COLORS.lightText} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                    <MaterialCommunityIcons name="update" size={ICON_SIZES.xl} color={COLORS.lightText} />
                    <ThemedText style={styles.settingText}>Check for Updates</ThemedText>
                    <MaterialCommunityIcons name="chevron-right" size={ICON_SIZES.xl} color={COLORS.lightText} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem} onPress={openGitHub}>
                    <MaterialCommunityIcons name="github" size={ICON_SIZES.xl} color={COLORS.lightText} />
                    <ThemedText style={styles.settingText}>Support on GitHub</ThemedText>
                    <MaterialCommunityIcons name="open-in-new" size={ICON_SIZES.xl} color={COLORS.lightText} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                    <MaterialCommunityIcons name="information-outline" size={ICON_SIZES.xl} color={COLORS.lightText} />
                    <ThemedText style={styles.settingText}>Legal & About</ThemedText>
                    <MaterialCommunityIcons name="chevron-right" size={ICON_SIZES.xl} color={COLORS.lightText} />
                </TouchableOpacity>
            </ThemedView>

            {/* Copyright */}
            <ThemedText style={styles.copyright}>
                &copy; {new Date().getFullYear()} PlanIT. Made by Rongbin99.
            </ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bannerContainer: {
        height: 250,
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    profileOverlay: {
        position: 'absolute',
        bottom: -60,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingBottom: SPACING.sm + SPACING.xs, // 10
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: SPACING.sm + SPACING.xs, // 10
        backgroundColor: COLORS.white,
        borderRadius: 60,
        padding: 2,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
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
        borderRadius: SPACING.xl,
        padding: SPACING.sm + SPACING.xs, // 10
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: COLORS.border,
        marginHorizontal: SPACING.xl,
    },
    settingsContainer: {
        padding: SPACING.xl,
        marginTop: 80,
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
        marginTop: SPACING.xl,
        marginBottom: SPACING.lg,
        opacity: 0.8,
    },
});
