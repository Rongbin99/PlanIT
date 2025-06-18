import { Image } from 'expo-image';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ProfileScreen() {
    return (
        <ThemedView style={styles.container}>
            {/* Profile Header */}
            <ThemedView style={styles.profileHeader}>
                <TouchableOpacity style={styles.profileImageContainer}>
                    <Image
                        source={require('@/assets/images/default-avatar.jpg')}
                        style={styles.profileImage}
                    />
                    <View style={styles.editIconContainer}>
                        <MaterialCommunityIcons name="camera" size={20} color="#fff" />
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
            </ThemedView>

            {/* Settings Menu */}
            <ThemedView style={styles.settingsContainer}>
                <ThemedText type="subtitle" style={styles.settingsTitle}>Settings</ThemedText>
                
                <TouchableOpacity style={styles.settingItem}>
                    <MaterialCommunityIcons name="lock-outline" size={24} color="#666" />
                    <ThemedText style={styles.settingText}>Change Password</ThemedText>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                    <MaterialCommunityIcons name="account-outline" size={24} color="#666" />
                    <ThemedText style={styles.settingText}>Account</ThemedText>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                    <MaterialCommunityIcons name="palette-outline" size={24} color="#666" />
                    <ThemedText style={styles.settingText}>Appearance</ThemedText>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                    <MaterialCommunityIcons name="star-outline" size={24} color="#666" />
                    <ThemedText style={styles.settingText}>Rate Us</ThemedText>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                    <MaterialCommunityIcons name="update" size={24} color="#666" />
                    <ThemedText style={styles.settingText}>Check for Updates</ThemedText>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                    <MaterialCommunityIcons name="information-outline" size={24} color="#666" />
                    <ThemedText style={styles.settingText}>Legal & About</ThemedText>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
                </TouchableOpacity>
            </ThemedView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    profileHeader: {
        alignItems: 'center',
        paddingTop: 40,
        paddingBottom: 20,
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 16,
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
        backgroundColor: '#0a7ea4',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userName: {
        fontSize: 24,
        marginBottom: 4,
    },
    userSince: {
        color: '#666',
        marginBottom: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#ccc',
        marginHorizontal: 20,
    },
    settingsContainer: {
        padding: 20,
    },
    settingsTitle: {
        marginBottom: 16,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    settingText: {
        flex: 1,
        marginLeft: 12,
    },
});
