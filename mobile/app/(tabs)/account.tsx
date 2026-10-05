/*
  FRD F16. The signed-in screen, reached after sign-in.

  It shows the name and email that came back from GET /api/v1/me, which is the
  proof that the same Google account signed in here and on the website: both read
  the same users row.

  "Sign in again" is ALWAYS visible, signed in or not. A shopper who suspects the
  wrong account is on the device must never have to hunt for a way out, and the
  phone is frequently a shared device.
*/

import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { LogOut, RefreshCw, UserRound } from "lucide-react-native";

import { useSignIn } from "@/hooks/use-sign-in";
import { useSession } from "@/store/session";
import { formatNaira } from "@/utils/money";
import { colors, font, ICON_STROKE_WIDTH } from "@/theme/tokens";

export default function AccountScreen() {
  const state = useSession((store) => store.state);
  const user = useSession((store) => store.user);
  const deliveryZones = useSession((store) => store.deliveryZones);
  const signOut = useSession((store) => store.signOut);
  const restore = useSession((store) => store.restore);
  const { signIn, busy, error } = useSignIn();

  const [refreshing, setRefreshing] = useState(false);

  /* Signed out means /me rejected the token, so send them to sign in. The cart tab
     keeps them in the app rather than bouncing them to the shop. */
  useFocusEffect(
    useCallback(() => {
      if (state === "signedOut") router.replace("/signin");
    }, [state]),
  );

  async function handleSignOut() {
    await signOut();
    router.replace("/signin");
  }

  async function handleRefresh() {
    setRefreshing(true);
    await restore();
    setRefreshing(false);
  }

  const signedIn = state === "signedIn";

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.card}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <UserRound size={24} strokeWidth={ICON_STROKE_WIDTH} color={colors.gold} />
          </View>
          <Text style={styles.name}>
            {signedIn && user?.name ? user.name : "Not signed in"}
          </Text>
          {signedIn && user?.email ? (
            <Text style={styles.email}>{user.email}</Text>
          ) : null}
        </View>

        {signedIn ? (
          <View style={styles.zones}>
            <Text style={styles.zonesTitle}>Delivery</Text>
            {deliveryZones.map((zone) => (
              <View key={zone.zone} style={styles.zoneRow}>
                <Text style={styles.zoneLabel}>{zone.label}</Text>
                <Text style={styles.zoneFee}>
                  {zone.feeKobo === null
                    ? "Quoted on request"
                    : formatNaira(zone.feeKobo)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/*
          Always visible, on purpose. This is the escape hatch on a shared phone.
        */}
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void signIn()}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        >
          <RefreshCw size={20} strokeWidth={ICON_STROKE_WIDTH} color={colors.white} />
          <Text style={styles.primaryText}>
            {signedIn ? "Sign in again" : "Continue with Google"}
          </Text>
        </Pressable>

        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}

        {signedIn ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void handleSignOut()}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          >
            <LogOut size={20} strokeWidth={ICON_STROKE_WIDTH} color={colors.onyx} />
            <Text style={styles.secondaryText}>Sign out</Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => void handleRefresh()}
          style={styles.link}
        >
          <Text style={styles.linkText}>
            {refreshing ? "Refreshing..." : "Refresh my details"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: colors.cream,
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 24,
  },
  identity: {
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.onyx,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  name: {
    fontFamily: font.black,
    fontSize: 22,
    textTransform: "uppercase",
    letterSpacing: -0.01,
    color: colors.onyx,
    textAlign: "center",
  },
  email: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: 4,
    textAlign: "center",
  },
  zones: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 16,
  },
  zonesTitle: {
    fontFamily: font.semibold,
    fontSize: 15,
    color: colors.onyx,
    marginBottom: 8,
  },
  zoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  zoneLabel: {
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.inkMuted,
  },
  zoneFee: {
    fontFamily: font.semibold,
    fontSize: 15,
    color: colors.onyx,
  },
  primary: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.onyx,
    borderRadius: 4,
    marginTop: 24,
  },
  primaryText: {
    fontFamily: font.semibold,
    fontSize: 15,
    color: colors.white,
  },
  secondary: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.highlight,
    borderRadius: 4,
    marginTop: 12,
  },
  secondaryText: {
    fontFamily: font.semibold,
    fontSize: 15,
    color: colors.onyx,
  },
  pressed: {
    opacity: 0.85,
  },
  link: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  linkText: {
    fontFamily: font.medium,
    fontSize: 14,
    color: colors.goldDeep,
  },
  error: {
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.danger,
    textAlign: "center",
    marginTop: 12,
  },
});