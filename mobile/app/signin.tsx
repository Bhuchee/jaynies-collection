/*
  FRD F16. The full-screen Sign in screen.

  Sign-in is MANDATORY: splash -> Sign in -> the app. Browsing signed out is not
  a thing (PRD 4A), so this screen has no skip.

  It is deliberately plain: the logo, one line of tagline, and one button. There
  is no password field and no social buttons, because there is exactly one way in
  and it is Google, through the website's own sign-in in the system browser.

  After a failure the button stays exactly where it is and relabels itself, so the
  shopper is never left hunting for a way to retry on a screen that appears to
  have no way forward.
*/

import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ShieldCheck } from "lucide-react-native";

import { useSignIn } from "@/hooks/use-sign-in";
import { colors, font, ICON_STROKE_WIDTH, MIN_TAP_TARGET } from "@/theme/tokens";

export default function SignInScreen() {
  const { signIn, busy, error } = useSignIn();

  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.inner}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Jaynie's Collection"
        />

        <Text style={styles.heading}>Sign in</Text>

        {/* One line, as asked: what this is, not a paragraph. */}
        <Text style={styles.tagline}>
          Handmade ready-to-wear, yours on every device.
        </Text>

        {error ? (
          <View
            accessibilityRole="alert"
            style={styles.errorBox}
          >
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          disabled={busy}
          onPress={() => void signIn()}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.pressed,
            busy && styles.disabled,
          ]}
        >
          <ShieldCheck
            size={20}
            strokeWidth={ICON_STROKE_WIDTH}
            color={colors.onyx}
          />
          <Text style={styles.buttonText}>
            {busy ? "Opening Google sign-in..." : "Sign in again"}
          </Text>
        </Pressable>

        <Text style={styles.privacy}>
          We only use your name, email and photo, to fill in checkout.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: colors.onyx,
  },
  inner: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  logo: {
    width: 200,
    height: 132,
    marginBottom: 24,
  },
  heading: {
    fontFamily: font.black,
    fontSize: 28,
    textTransform: "uppercase",
    letterSpacing: -0.01,
    color: colors.white,
  },
  tagline: {
    fontFamily: font.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.line,
    textAlign: "center",
    marginTop: 8,
  },
  /* A real box, so a failure is impossible to miss on a dark screen. */
  errorBox: {
    alignSelf: "stretch",
    backgroundColor: colors.highlight,
    borderRadius: 4,
    padding: 12,
    marginTop: 24,
  },
  errorText: {
    fontFamily: font.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.onyx,
    textAlign: "center",
  },
  button: {
    minHeight: 52,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: 4,
    marginTop: 24,
    minWidth: MIN_TAP_TARGET,
  },
  buttonText: {
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
  privacy: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
    textAlign: "center",
    marginTop: 24,
  },
});