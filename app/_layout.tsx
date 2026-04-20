import FontAwesome from "@expo/vector-icons/FontAwesome";
import { ThemeProvider, DarkTheme } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";

import { DatabaseProvider } from "@/db/provider";
import { SessionProvider as GpsSessionProvider } from "@/services/session";
import { AuthProvider, useAuth } from "@/services/auth";

export {
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
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
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/login");
      }
    }
  }, [user, isLoading]);

  if (isLoading) return null;

  return (
    <DatabaseProvider>
      <GpsSessionProvider>
        <ThemeProvider value={DarkTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#111318" },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" options={{ animation: "fade" }} />
            <Stack.Screen
              name="modal"
              options={{
                presentation: "modal",
                headerShown: true,
                headerTitle: "About Draft",
                headerTintColor: "#d4820a",
                headerStyle: { backgroundColor: "#111318" },
                headerTitleStyle: {
                  fontSize: 16,
                  fontWeight: "700",
                },
                headerShadowVisible: false,
              }}
            />
          </Stack>
        </ThemeProvider>
      </GpsSessionProvider>
    </DatabaseProvider>
  );
}
