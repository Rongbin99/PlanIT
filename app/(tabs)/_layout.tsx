// Library imports
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

// Component imports
import { HapticTab } from '@/components/HapticTab';
import { Route, MapPinned, UserRound } from 'lucide-react-native';
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
                    tabBarIcon: ({ color }) => <MapPinned size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'Adventures',
                    tabBarIcon: ({ color }) => <Route size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'You',
                    tabBarIcon: ({ color }) => <UserRound size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}

// https://icons.expo.fyi/Index
// filter by material community icons
// https://lucide.dev/icons/
