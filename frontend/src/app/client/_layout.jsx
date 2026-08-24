import { ActivityIndicator, Text, View } from "react-native";
import { Redirect, Stack, useSegments } from "expo-router";

import { useAuth } from "../../context/AuthContext";

export default function ClientLayout() {
  const { user, userData, authLoading } = useAuth();
  const segments = useSegments();

  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-500">Checking session...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (!userData?.onboarded && !userData?.isGuest) {
    return <Redirect href="/onboarding" />;
  }

  if (userData?.role !== "client") {
    return <Redirect href="/barber/dashboard" />;
  }

  if (userData?.isGuest || user?.isAnonymous) {
    const routeGroup = segments[1];
    const tabName = segments[2];
    const allowedGuestTab =
      routeGroup === "(tabs)" &&
      ["home", "search", "bookings", "messages", "profile"].includes(tabName);
    const allowedGuestBarberDetails = routeGroup === "barber";
    const allowedGuestNotifications = routeGroup === "notifications";

    if (
      !allowedGuestTab &&
      !allowedGuestBarberDetails &&
      !allowedGuestNotifications
    ) {
      return <Redirect href="/client/home" />;
    }
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="editProfile" />
      <Stack.Screen name="styles" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="barber/[barberId]" />
      <Stack.Screen name="notifications" />

    </Stack>
  );
}
