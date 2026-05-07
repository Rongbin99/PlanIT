import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider as AppThemeProvider } from '@/contexts/ThemeContext';

/**
 * Bridges the app's ThemeContext with React Navigation's ThemeProvider so that
 * navigation surfaces (headers, tab bars) follow the user's chosen theme.
 */
function NavigationThemeBridge({ children }: { children: ReactNode }) {
    const colorScheme = useColorScheme();
    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            {children}
        </ThemeProvider>
    );
}

export default function RootLayout() {
    const [loaded] = useFonts({
        Nunito: require('../assets/fonts/Nunito-Regular.ttf'),
        CircularStd: require('../assets/fonts/CircularStd-Medium.otf'),
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });

    if (!loaded) {
        // Async font loading only occurs in development.
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AppThemeProvider>
                <AuthProvider>
                    <NavigationThemeBridge>
                        <Stack>
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen
                                name="chat"
                                options={{
                                    headerShown: false,
                                    presentation: 'card',
                                    animation: 'slide_from_right',
                                }}
                            />
                            <Stack.Screen
                                name="account"
                                options={{
                                    headerShown: Platform.OS === 'android' ? false : true,
                                    presentation: Platform.OS === 'ios' ? 'card' : 'modal',
                                    headerBackTitle: 'Settings',
                                    title: 'Account',
                                }}
                            />
                            <Stack.Screen
                                name="change-password"
                                options={{
                                    headerShown: Platform.OS === 'android' ? false : true,
                                    presentation: Platform.OS === 'ios' ? 'card' : 'modal',
                                    headerBackTitle: 'Settings',
                                    title: 'Change Password',
                                }}
                            />
                            <Stack.Screen
                                name="login"
                                options={{
                                    headerShown: Platform.OS === 'android' ? false : true,
                                    presentation: Platform.OS === 'ios' ? 'card' : 'modal',
                                    title: 'Log In',
                                }}
                            />
                            <Stack.Screen
                                name="signup"
                                options={{
                                    headerShown: Platform.OS === 'android' ? false : true,
                                    presentation: Platform.OS === 'ios' ? 'card' : 'modal',
                                    title: 'Sign Up',
                                }}
                            />
                            <Stack.Screen name="+not-found" />
                        </Stack>
                        <StatusBar style="auto" />
                    </NavigationThemeBridge>
                </AuthProvider>
            </AppThemeProvider>
        </GestureHandlerRootView>
    );
}
