import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, lazy, Suspense } from "react";
import { Dimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";
import { ThemeProvider as CustomThemeProvider, useTheme } from "../utils/themeContext";
import { lightTheme, darkTheme } from "../utils/theme";
import { getDeviceInfo } from "../utils/orientationUtils";
import { FastSplashScreen } from "../components/FastSplashScreen";
import { initializeAPIs } from "../utils/apiInitializer";

// Lazy loading para componentes pesados
const SplashScreenComponent = lazy(() => import("../components/SplashScreen").then(module => ({ default: module.SplashScreen })));

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { isDark } = useTheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [deviceInfo, setDeviceInfo] = useState(getDeviceInfo());
  const [appReady, setAppReady] = useState(false);
  
  // Toggle this to use animated splash (true) or fast splash (false)
  const useAnimatedSplash = false;

  useEffect(() => {
    if (loaded) {
      // Hide native splash immediately when fonts are loaded
      SplashScreen.hideAsync();
      // Mark app as ready without additional delay
      setAppReady(true);
      
      // Initialize APIs em background
      initializeAPIs().catch(error => {
        console.warn('Failed to initialize APIs:', error);
      });
    }
  }, [loaded]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setDeviceInfo(getDeviceInfo());
    });
    return () => subscription?.remove();
  }, []);


  // Show splash screen while app is loading
  if (!appReady) {
    return (
      <Suspense fallback={<FastSplashScreen onAnimationComplete={() => {}} />}>
        {useAnimatedSplash 
          ? <SplashScreenComponent onAnimationComplete={() => {}} />
          : <FastSplashScreen onAnimationComplete={() => {}} />}
      </Suspense>
    );
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
        <Stack.Screen name="new-session" options={{ headerShown: false }} />
      </Stack>
      <StatusBar backgroundColor={isDark ? "#1a1a1a" : "#ffffff"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CustomThemeProvider>
        <RootLayoutContent />
      </CustomThemeProvider>
    </GestureHandlerRootView>
  );
}
