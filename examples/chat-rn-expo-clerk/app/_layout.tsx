import "../global.css";
import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { secureStore } from "@clerk/clerk-expo/secure-store";
import { useFonts } from "expo-font";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { tokenCache } from "../cache";
import { JazzAndAuth } from "../src/auth-context";

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
      router.replace("/chat");
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace("/");
    }

    SplashScreen.hideAsync();
  }, [isLoaded, isSignedIn, segments, router]);

  if (!isLoaded) {
    return null;
  }

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error(
      "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env",
    );
  }

  useEffect(() => {
    if (fontsLoaded) {
    } else {
      SplashScreen.preventAutoHideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={publishableKey}
      __experimental_resourceCache={secureStore}
    >
      <ClerkLoaded>
        <JazzAndAuth>
          <InitialLayout />
        </JazzAndAuth>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
