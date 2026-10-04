/*
  FRD F16. The sign-in screen.

  One button, because there is exactly one way to sign in: Google, through the
  website's own sign-in in the system browser. The app has no password field, no
  social buttons and no account creation.

  The privacy line is the same wording the website's /signin page uses.
*/

import { useCallback, useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ShieldCheck } from "lucide-react-native";

import { useSignIn } from "@/hooks/use-sign-in";
import { useSession } from "@/store/session";
import { colors, font } from "@/theme/tokens";

export default function SignInScreen() {
  const state = useSession((store) => store.state);
  const { signIn, busy, error } = useSignIn();

  /* Already signed in: never leave someone staring at this screen. */
  useFocusEffect(
    useCallback(() => {
      if (state === "signedIn") router.replace("/account");
    }, [state]),
  );

  useEffect(() => {
    if (state === "signedIn") router.replace("/account");
  }, [state]);

  return (
    <View style={styles.screen}>
      <View style={styles.inner}>
        <Text style={styles.wordmark}>JAYNIE&apos;S</Text>
        <Text style={styles.heading}>Sign in</Text>
        <Text style={styles.sub}>
          Sign in to see your orders and keep your cart across devices.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          disabled={busy}
          onPress={() => void signIn()}
          style={({ pressed }) => [
            styles.googleButton,
            pressed && styles.pressed,
            busy && styles.disabled,
          ]}
        >
          {busy ? (
            <ActivityIndicator color={colors.onyx} />
          ) : (
            <>
              <ShieldCheck size={20} strokeWidth={1.5} color={colors.onyx} />
              <Text style={styles.googleButtonText}>
                {busy ? "Opening Google sign-in..." : "Continue with Google"}
              </Text>
            </>
          )}
        </Pressable>

        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Text style={styles.privacy}>
          We only use your name, email and photo, to fill in checkout.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.onyx,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  wordmark: {
    fontFamily: font.black,
    fontSize: 26,
    letterSpacing: 2,
    color: colors.gold,
    textAlign: "center",
    marginBottom: 32,
  },
  heading: {
    fontFamily: font.black,
    fontSize: 28,
    textTransform: "uppercase",
    letterSpacing: -0.01,
    color: colors.white,
    textAlign: "center",
  },
  sub: {
    fontFamily: font.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.line,
    textAlign: "center",
    marginTop: 8,
  },
  googleButton: {
    /* DESIGN.md section 1 rule 6: 48px tall, never under the 44px minimum. */
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: 4,
    marginTop: 32,
    paddingHorizontal: 20,
  },
  googleButtonText: {
    fontFamily: font.semibold,
    fontSize: 15,
    color: colors.onyx,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.7,
  },
  error: {
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.highlight,
    textAlign: "center",
    marginTop: 16,
  },
  privacy: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
    textAlign: "center",
    marginTop: 24,
  },
});