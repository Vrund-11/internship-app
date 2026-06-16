import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";

import { AuthProvider } from "@/context/AuthContext";
import { CityProvider } from "@/context/CityContext";
import { BookingProvider } from "@/context/BookingContext";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    "PlusJakartaSans-Regular": PlusJakartaSans_400Regular,
    "PlusJakartaSans-Medium": PlusJakartaSans_500Medium,
    "PlusJakartaSans-SemiBold": PlusJakartaSans_600SemiBold,
    "PlusJakartaSans-Bold": PlusJakartaSans_700Bold,
    "PlusJakartaSans-ExtraBold": PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <CityProvider>
        <BookingProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            {/* Splash screen */}
            <Stack.Screen name="index" options={{ headerShown: false }} />

            {/* Auth screens (login, city selection) */}
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen
              name="select-city"
              options={{ headerShown: false }}
            />

            {/* Main tab navigator */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Booking flow stack */}
            <Stack.Screen
              name="booking"
              options={{ headerShown: false, animation: "slide_from_right" }}
            />

            {/* FAQ & Help Screen */}
            <Stack.Screen
              name="faq"
              options={{ headerShown: false, animation: "slide_from_right" }}
            />

            {/* Ask Cano Chat Assistant */}
            <Stack.Screen
              name="ask-cano"
              options={{ headerShown: false, animation: "slide_from_bottom" }}
            />
          </Stack>
        </BookingProvider>
      </CityProvider>
    </AuthProvider>
  );
}
