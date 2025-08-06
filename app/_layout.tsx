import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
    const colorScheme = useColorScheme();
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
            <AuthProvider>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
                                headerShown: false,
                                presentation: 'modal',
                            }} 
                        />
                        <Stack.Screen 
                            name="change-password" 
                            options={{ 
                                headerShown: false,
                                presentation: 'modal',
                            }} 
                        />
                        <Stack.Screen 
                            name="login" 
                            options={{ 
                                headerShown: false,
                                presentation: 'modal',
                            }} 
                        />
                        <Stack.Screen 
                            name="signup" 
                            options={{ 
                                headerShown: false,
                                presentation: 'modal',
                            }} 
                        />
                        <Stack.Screen name="+not-found" />
                    </Stack>
                    <StatusBar style="auto" />
                </ThemeProvider>
            </AuthProvider>
        </GestureHandlerRootView>
    );
}
