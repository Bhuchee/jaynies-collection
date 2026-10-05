/*
  FRD F16. The launch screen.

  While the session is still being restored this shows the wordmark and nothing
  else, because guessing would flash the sign-in screen at someone who is already
  signed in. Browsing needs no account, so a RESTORED session lands on the shop.
*/

import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { useSession } from "@/store/session";
import { colors, font } from "@/theme/tokens";

export default function IndexScreen() {
  const state = useSession((store) => store.state);

  useEffect(() => {
    /* Both states land on the tabs: the shop is browsable signed out, and the
       cart tab prompts for sign-in by itself. */
    if (state === "signedIn") router.replace("/(tabs)");
    if (state === "signedOut") router.replace("/(tabs)");
  }, [state]);

  return (
    <View style={styles.screen}>
      <Text style={styles.wordmark}>JAYNIE&apos;S</Text>
      <Text style={styles.tagline}>Handmade in Nigeria</Text>
      <ActivityIndicator style={styles.spinner} color={colors.gold} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.onyx,
  },
  wordmark: {
    fontFamily: font.black,
    fontSize: 30,
    letterSpacing: 3,
    color: colors.gold,
  },
  tagline: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: 8,
  },
  spinner: {
    marginTop: 32,
  },
});