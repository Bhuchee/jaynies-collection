/*
  FRD F16. The launch screen.

  While the session is still being restored this shows the wordmark and nothing
  else, because guessing would flash the sign-in screen at someone who is already
  signed in. Once the state is known it routes accordingly.
*/

import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { useSession } from "@/store/session";
import { colors, font } from "@/theme/tokens";

export default function IndexScreen() {
  const state = useSession((store) => store.state);

  useEffect(() => {
    if (state === "signedIn") router.replace("/account");
    if (state === "signedOut") router.replace("/signin");
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