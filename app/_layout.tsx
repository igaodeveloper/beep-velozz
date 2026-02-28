import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";
import { ThemeProvider as CustomThemeProvider, useTheme } from "@/utils/themeContext";
import { lightTheme, darkTheme } from "@/utils/theme";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { isDark } = useTheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: darkTheme.colors.primary,
          background: darkTheme.colors.bg,
          card: darkTheme.colors.surface,
          text: darkTheme.colors.text,
          border: darkTheme.colors.border,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: lightTheme.colors.primary,
          background: lightTheme.colors.bg,
          card: lightTheme.colors.surface,
          text: lightTheme.colors.text,
          border: lightTheme.colors.border,
        },
      };

  return (
    <ThemeProvider value={navTheme}>
      <Stack
        screenOptions={({ route }) => ({
          headerShown: !route.name.startsWith("tempobook"),
        })}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <RootLayoutContent />
    </CustomThemeProvider>
  );
}
