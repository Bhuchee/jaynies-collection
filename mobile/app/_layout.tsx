/*
  FRD F16. The app root.

  Fonts load BEFORE anything renders, because DESIGN.md section 3 requires
  Poppins everywhere and a flash of fallback type on a fashion shop is exactly
  the kind of detail that makes it look unfinished.
*/

import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_800ExtraBold,
  Poppins_900Black,
  useFonts,
} from "@expo-google-fonts/poppins";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { colors, font } from "@/theme/tokens";
import { useSession } from "@/store/session";

/* Hold the splash screen until Poppins is ready, so there is no unstyled frame. */
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [font.regular]: Poppins_400Regular,
    [font.medium]: Poppins_500Medium,
    [font.semibold]: Poppins_600SemiBold,
    [font.extrabold]: Poppins_800ExtraBold,
    [font.black]: Poppins_900Black,
  });

  const ready = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  /*
    FRD F16: on cold start, read the token from secure store and validate it
    with /me. This is what decides whether the shopper sees the shop or the
    sign-in screen, so it runs once here rather than in each screen.
  */
  const restore = useSession((state) => state.restore);

  useEffect(() => {
    void restore();
  }, [restore]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.onyx },
          headerTintColor: colors.white,
          headerTitleStyle: { fontFamily: font.extrabold },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.white },
        }}
      >
        {/*
          The tab group is the app's shell: shop, cart and account. It is the
          default screen once signed in, because browsing never needs an account
          and the cart badge has to be live on every tab.
        */}
        {/*
          The launch screen, branded and in-app. Expo Go shows its OWN splash, so
          this route is what the shopper actually sees first.
        */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen
          name="signin"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[slug]" options={{ title: "" }} />
      </Stack>
    </SafeAreaProvider>
  );
}