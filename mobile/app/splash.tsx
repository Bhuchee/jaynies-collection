/*
  FRD F16. The in-app splash.

  Expo Go cannot show a CUSTOM native splash: the splash you see is Expo Go's own,
  unstyled and identical for every project. So the branded first screen has to
  live inside the app.

  It stays up for about 1.2 seconds, or longer if the work is not done yet, and it
  is the first thing on screen. It covers two jobs at once:
    - Poppins loading, so no frame ever renders in a fallback typeface
    - the stored token being validated against /api/v1/me

  Routing happens HERE, not on the shop screen, because the app now has one entry
  point with three outcomes: a valid token goes to the tabs, anything else goes
  to a full-screen Sign in. Browsing signed out is not a thing (PRD 4A).
*/

import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { useSession } from "@/store/session";
import { colors, font } from "@/theme/tokens";

/*
  About 1.2s is a deliberate brand beat, not a spinner while waiting: it is long
  enough for the wordmark to register and short enough not to feel slow. It is a
  FLOOR, never a delay added on top of real work: if /me is slow, the splash
  waits longer rather than hiding a failure.
*/
const MIN_SPLASH_MS = 1200;

export default function SplashScreen() {
  const state = useSession((store) => store.state);

  const [minElapsed, setMinElapsed] = useState(false);
  const routed = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    /* Only once, and only when we know the answer: loading, signedOut or signedIn. */
    if (routed.current) return;
    if (state === "loading") return;
    if (!minElapsed) return;

    routed.current = true;

    router.replace(state === "signedIn" ? "/(tabs)" : "/signin");
  }, [state, minElapsed]);

  return (
    <View style={styles.screen}>
      <Image
        source={require("../assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Jaynie's Collection"
      />

      <Text style={styles.wordmark}>JAYNIE&apos;S</Text>
      <Text style={styles.tagline}>Handmade ready-to-wear in Nigeria</Text>

      {/* Only while we are genuinely still working, so a dead network is visible. */}
      {state === "loading" ? (
        <ActivityIndicator style={styles.spinner} color={colors.gold} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.onyx,
    paddingHorizontal: 32,
  },
  /* The gold-on-black mark, kept to roughly the header proportion. */
  logo: {
    width: 180,
    height: 120,
    marginBottom: 16,
  },
  wordmark: {
    fontFamily: font.black,
    fontSize: 28,
    letterSpacing: 4,
    color: colors.gold,
  },
  tagline: {
    fontFamily: font.regular,
    fontSize: 13,
    letterSpacing: 1,
    color: colors.inkMuted,
    marginTop: 8,
    textAlign: "center",
  },
  spinner: {
    marginTop: 32,
  },
});