import "../global.css";
import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { secureStore } from "@clerk/clerk-expo/secure-store";
import { useFonts } from "expo-font";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { tokenCache } from "../cache";
import { JazzAndAuth } from "../src/auth-context";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Wait for Clerk to load
    if (!isLoaded) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)"; // Adjust if your auth routes are structured differently

    if (isSignedIn && inAuthGroup) {
      // If logged in and on an auth screen, redirect to main app
      router.replace("/chat");
    } else if (!isSignedIn && !inAuthGroup) {
      // If not logged in and not on an auth screen, redirect to login
      router.replace("/"); // Adjust to your specific login route if needed
    }

    // Hide splash screen once logic is processed and auth state is confirmed
    SplashScreen.hideAsync();
  }, [isLoaded, isSignedIn, segments, router]); // Add router to dependencies

  // Render nothing until Clerk is loaded to prevent flicker or premature rendering
  if (!isLoaded) {
    return null; // Or a custom loading indicator
  }

  // Render the current route determined by Expo Router
  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Renamed to avoid conflict if 'loaded' was used elsewhere
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error(
      "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env",
    );
  }

  // Keep splash screen visible until fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      // Hiding splash screen is now handled within InitialLayout based on Clerk's readiness
    } else {
      SplashScreen.preventAutoHideAsync(); // Ensure it stays visible if fonts unload/reload
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // Don't render anything until fonts are loaded
  }

  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={publishableKey}
      __experimental_resourceCache={secureStore}
    >
      {/* ClerkLoaded ensures Clerk SDK is ready before rendering children */}
      <ClerkLoaded>
        <JazzAndAuth>
          {/* InitialLayout now handles the auth state checking and renders the Slot */}
          <InitialLayout />
        </JazzAndAuth>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
