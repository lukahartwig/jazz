import { Redirect, Stack } from "expo-router";
import { useIsAuthenticated } from "jazz-react-native";
import React from "react";

export default function HomeLayout() {
  const isAuthenticated = useIsAuthenticated();

  if (isAuthenticated) {
    return <Redirect href={"/chat"} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, headerBackVisible: true }} />
  );
}
