// Library imports
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

// Component imports
import { HapticTab } from '@/components/HapticTab';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarLabelPosition: 'below-icon',
                tabBarBackground: TabBarBackground,
                tabBarStyle: Platform.select({
                    ios: {
                        // Use a transparent background on iOS to show the blur effect
                        position: 'absolute',
                        height: 80,
                    },
                    default: {
                        height: 80,
                    },
                }),
                tabBarLabelStyle: {
                    fontSize: 16,
                    fontWeight: '600',
                    marginLeft: 16,
                },
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Map',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons size={44} name="map-search" color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons size={44} name="account-circle" color={color} />,
                }}
            />
            <Tabs.Screen
                name="temp"
                options={{
                    title: 'temp123',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons size={44} name="microsoft-visual-studio-code" color={color} />,
                }}
            />
        </Tabs>
    );
}
