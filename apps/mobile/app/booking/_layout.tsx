import { Stack } from "expo-router";

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="wizard" />
      <Stack.Screen name="pet" />
      <Stack.Screen name="address" />
      <Stack.Screen name="schedule" />
    </Stack>
  );
}
