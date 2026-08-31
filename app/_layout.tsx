import FontAwesome from "@expo/vector-icons/FontAwesome";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";

import {
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import { palette, fonts } from "@/constants/theme";
import { DatabaseProvider } from "@/db/provider";
import { SessionProvider as GpsSessionProvider } from "@/services/session";
import { AuthProvider, useAuth } from "@/services/auth";
import { CurrencyProvider } from "@/services/currency";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.paper,
    card: palette.foam,
    text: palette.ink,
    border: "rgba(27,23,18,0.12)",
    primary: palette.amber,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
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
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { user, isLoading } = useAuth();

  // Hold on the splash until we know whether there's a stored account, so the
  // guards below don't flash the login screen at a signed-in user.
  if (isLoading) return null;

  return (
    <DatabaseProvider>
      <GpsSessionProvider>
        <CurrencyProvider>
          <ThemeProvider value={navTheme}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: palette.paper },
              }}
            >
              <Stack.Protected guard={!!user}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="modal"
                  options={{
                    presentation: "modal",
                    headerShown: true,
                    headerTitle: "About Draft",
                    headerTintColor: palette.ink,
                    headerStyle: { backgroundColor: palette.paper },
                    headerTitleStyle: {
                      fontFamily: fonts.display,
                      fontSize: 17,
                    },
                    headerShadowVisible: false,
                  }}
                />
                <Stack.Screen
                  name="notifications"
                  options={{
                    presentation: "modal",
                    headerShown: true,
                    headerTitle: "Notifications",
                    headerTintColor: palette.ink,
                    headerStyle: { backgroundColor: palette.paper },
                    headerTitleStyle: {
                      fontFamily: fonts.display,
                      fontSize: 17,
                    },
                    headerShadowVisible: false,
                  }}
                />
              </Stack.Protected>

              <Stack.Protected guard={!user}>
                <Stack.Screen name="login" options={{ animation: "fade" }} />
              </Stack.Protected>
            </Stack>
          </ThemeProvider>
        </CurrencyProvider>
      </GpsSessionProvider>
    </DatabaseProvider>
  );
}
