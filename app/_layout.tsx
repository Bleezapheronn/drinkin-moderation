import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { SessionProvider } from "../context/session";

export default function RootLayout() {
  return (
    <SessionProvider>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: "#f7f4ef" },
          headerStyle: { backgroundColor: "#f7f4ef" },
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "DrinkInModeration" }} />
        <Stack.Screen name="new-session" options={{ title: "New Session" }} />
        <Stack.Screen name="active-session" options={{ title: "Active Session" }} />
        <Stack.Screen name="session-history" options={{ title: "Session History" }} />
        <Stack.Screen name="session-detail/[sessionId]" options={{ title: "Session Detail" }} />
        <Stack.Screen name="session-summary" options={{ title: "Session Summary" }} />
      </Stack>
      <StatusBar style="dark" />
    </SessionProvider>
  );
}
