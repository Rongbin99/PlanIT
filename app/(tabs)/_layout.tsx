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
                        height: 60,
                    },
                    default: {
                        height: 60,
                    },
                }),
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                    fontFamily: 'Nunito',
                },
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Explore',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons size={24} name="map-search" color={color} />,
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'Adventures',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons size={24} name="bookmark-outline" color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'You',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons size={24} name="account-circle" color={color} />,
                }}
            />
        </Tabs>
    );
}

// https://icons.expo.fyi/Index
// filter by material community icons
