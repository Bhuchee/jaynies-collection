/*
  FRD F16 and F17. The cart, and the hand-off to the website's checkout.

  Everything on this screen comes from the SERVER. The subtotal is the server's
  subtotalKobo, summed from live prices, never something this screen calculated
  (AGENTS.md rule 15). The app never formats a price on the way in.

  The "last updated" line is deliberate: the app polls every two seconds, and a
  shopper should be able to see whether what they are looking at is current
  rather than being told to trust it.

  CHECKOUT IS A HAND-OFF, and it opens the SYSTEM BROWSER. The website
  authenticates with a cookie session, not with the app bearer token, so the
  browser may ask for Google sign-in again even though the shopper is already
  signed in to the app. That is EXPECTED and is not a defect: the app cannot
  inject a cookie into the system browser, and the two sessions are deliberately
  independent so signing out of one leaves the other signed in.
*/

import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Trash2 } from "lucide-react-native";

import { ProductImage } from "@/components/ProductImage";
import { QuantityStepper } from "@/components/QuantityStepper";
import { ErrorState } from "@/components/ErrorState";
import { checkoutUrl } from "@/api/client";
import { useCartStore } from "@/store/cart";
import { useSession } from "@/store/session";
import { colors, font, ICON_STROKE_WIDTH } from "@/theme/tokens";
import { formatNaira } from "@/utils/money";

export default function CartScreen() {
  const router = useRouter();

  const token = useSession((store) => store.token);
  const signedIn = useSession((store) => store.state === "signedIn");

  const lines = useCartStore((store) => store.lines);
  const itemCount = useCartStore((store) => store.itemCount);
  const subtotalKobo = useCartStore((store) => store.subtotalKobo);
  const loading = useCartStore((store) => store.loading);
  const error = useCartStore((store) => store.error);
  const lastUpdatedAt = useCartStore((store) => store.lastUpdatedAt);
  const load = useCartStore((store) => store.load);
  const setQuantity = useCartStore((store) => store.setQuantity);
  const remove = useCartStore((store) => store.remove);

  const [updatedLabel, setUpdatedLabel] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  /* Renders the poll time, so staleness is visible rather than silent. */
  useEffect(() => {
    if (!lastUpdatedAt) {
      setUpdatedLabel(null);
      return;
    }

    const time = new Date(lastUpdatedAt).toLocaleTimeString();

    setUpdatedLabel(`Updated ${time}`);
  }, [lastUpdatedAt]);

  async function handleCheckout() {
    if (!token) return;

    /*
      The system browser, not an in-app view. Checkout needs a real browser
      context, and the website decides sign-in with cookies.

      Wrapped because this is a native call: if the browser cannot be opened on
      this device, the shopper should read a sentence, not get a red screen.
    */
    try {
      await WebBrowser.openBrowserAsync(checkoutUrl());
    } catch {
      setCheckoutError(
        "Could not open your browser. Open the website on your phone to finish checkout.",
      );
    }
  }

  if (!signedIn) {
    /* Reached only if a 401 lands while the tab is already open. */
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Sign in to see your cart</Text>
        <Text style={styles.emptyBody}>
          Your cart follows your account, so it works on every device.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace("/signin")}
          style={styles.primary}
        >
          <Text style={styles.primaryText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  /*
    A failed read must not look like an empty cart. Retrying re-runs exactly the
    request that failed, through the same 2-second poll.
  */
  if (error && lines.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.heading}>Your cart</Text>
        </View>
        <ErrorState
          title="Could not load your cart"
          message={error}
          busy={loading}
          onRetry={() => {
            if (token) void load(token);
          }}
        />
      </View>
    );
  }

  if (loading && lines.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.onyx} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>Your cart</Text>
        {updatedLabel ? <Text style={styles.updated}>{updatedLabel}</Text> : null}
      </View>

      {lines.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyBody}>
            Anything you add here shows on the website too.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/")}
            style={styles.primary}
          >
            <Text style={styles.primaryText}>Browse the shop</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {lines.map((line) => (
            <View key={`${line.productId}-${line.size}`} style={styles.line}>
              <View style={styles.lineImage}>
                <ProductImage imageUrl={line.imageUrl} />
              </View>

              <View style={styles.lineBody}>
                <Text style={styles.lineName} numberOfLines={2}>
                  {line.name}
                </Text>
                <Text style={styles.lineMeta}>
                  Size {line.size} - {formatNaira(line.unitPriceKobo)}
                </Text>

                <View style={styles.lineControls}>
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(quantity) => {
                      if (!token) return;
                      void setQuantity(token, {
                        productId: line.productId,
                        size: line.size,
                        quantity,
                      });
                    }}
                  />

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${line.name}`}
                    disabled={!token}
                    onPress={() => {
                      if (!token) return;
                      void remove(token, {
                        productId: line.productId,
                        size: line.size,
                      });
                    }}
                    style={({ pressed }) => [
                      styles.removeButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Trash2
                      size={20}
                      strokeWidth={ICON_STROKE_WIDTH}
                      color={colors.danger}
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {itemCount} {itemCount === 1 ? "piece" : "pieces"}
              </Text>
              {/* The server calculated this. Never on this screen. */}
              <Text style={styles.summaryTotal}>
                {formatNaira(subtotalKobo)}
              </Text>
            </View>

            <Text style={styles.deliveryNote}>
              Delivery is calculated at checkout.
            </Text>

            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}

            {checkoutError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {checkoutError}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={!token}
              onPress={() => void handleCheckout()}
              style={({ pressed }) => [
                styles.primary,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryText}>Proceed to checkout</Text>
            </Pressable>

            {/* Set expectations rather than letting it look like a defect. */}
            <Text style={styles.handoffNote}>
              Checkout opens the website in your browser. You may be asked to
              sign in to the website again, because the app and the website keep
              separate sessions. Your cart is the same either way.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.white, flexGrow: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: colors.white },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  heading: { fontFamily: font.black, fontSize: 24, textTransform: "uppercase", letterSpacing: -0.01, color: colors.onyx },
  updated: { fontFamily: font.regular, fontSize: 12, color: colors.inkMuted, marginTop: 4 },
  emptyTitle: { fontFamily: font.black, fontSize: 20, textTransform: "uppercase", color: colors.onyx, marginBottom: 8, textAlign: "center" },
  emptyBody: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: colors.inkMuted, textAlign: "center" },
  line: { flexDirection: "row", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  lineImage: { width: 88 },
  lineBody: { flex: 1, marginLeft: 12 },
  lineName: { fontFamily: font.medium, fontSize: 16, lineHeight: 21, color: colors.onyx },
  lineMeta: { fontFamily: font.regular, fontSize: 14, color: colors.inkMuted, marginTop: 4 },
  lineControls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  removeButton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  summary: { padding: 16, marginTop: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontFamily: font.medium, fontSize: 15, color: colors.inkMuted },
  summaryTotal: { fontFamily: font.black, fontSize: 20, color: colors.onyx },
  deliveryNote: { fontFamily: font.regular, fontSize: 13, color: colors.inkMuted, marginTop: 6 },
  error: { fontFamily: font.regular, fontSize: 14, color: colors.danger, marginTop: 12 },
  primary: { marginTop: 20, minHeight: 52, alignItems: "center", justifyContent: "center", backgroundColor: colors.onyx, borderRadius: 4, paddingHorizontal: 24 },
  primaryText: { fontFamily: font.semibold, fontSize: 15, color: colors.white },
  handoffNote: { fontFamily: font.regular, fontSize: 12, lineHeight: 17, color: colors.inkMuted, marginTop: 12, textAlign: "center" },
  pressed: { opacity: 0.85 },
});