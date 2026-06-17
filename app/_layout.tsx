import {
  Fraunces_700Bold,
  Fraunces_800ExtraBold,
  Fraunces_900Black,
} from "@expo-google-fonts/fraunces";
import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_800ExtraBold,
  NunitoSans_900Black,
} from "@expo-google-fonts/nunito-sans";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { SettingsProvider } from "../context/settings";
import { SessionProvider } from "../context/session";
import { colors, fontFamilies } from "../theme";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_700Bold,
    Fraunces_800ExtraBold,
    Fraunces_900Black,
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_800ExtraBold,
    NunitoSans_900Black,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SettingsProvider>
      <SessionProvider>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: "#f7f4ef" },
            headerStyle: { backgroundColor: "#f7f4ef" },
            headerShadowVisible: false,
            headerTitleStyle: {
              color: colors.wineDeep,
              fontFamily: fontFamilies.cardTitle,
              fontSize: 22,
            },
          }}
        >
          <Stack.Screen name="index" options={{ title: "One More Drink" }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="new-session" options={{ title: "New Session" }} />
          <Stack.Screen name="active-session" options={{ title: "Active Session" }} />
          <Stack.Screen name="settings" options={{ title: "Settings" }} />
          <Stack.Screen name="session-history" options={{ title: "Session History" }} />
          <Stack.Screen name="session-detail/[sessionId]" options={{ title: "Session Detail" }} />
          <Stack.Screen name="session-summary" options={{ title: "Session Summary" }} />
        </Stack>
        <StatusBar style="dark" />
      </SessionProvider>
    </SettingsProvider>
  );
}
