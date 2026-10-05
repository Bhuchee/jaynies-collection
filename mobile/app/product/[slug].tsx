/*
  FRD F16. The product screen.

  FRD F4 parity with the website: a size is REQUIRED and Add to cart stays
  disabled until one is chosen, because an unselected size is the single most
  common cause of a failed order.

  Adding goes through POST /api/v1/cart/items and the server's whole-cart
  response replaces the app state, so the badge is right the moment the shopper
  lands back on the shop.
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
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ShoppingBag } from "lucide-react-native";

import { ProductImage } from "@/components/ProductImage";
import { QuantityStepper, MIN_QUANTITY } from "@/components/QuantityStepper";
import { getProductBySlug } from "@/api/client";
import type { ProductDto } from "@/api/types";
import { useCartStore } from "@/store/cart";
import { useSession } from "@/store/session";
import { colors, font, ICON_STROKE_WIDTH } from "@/theme/tokens";
import { formatNaira } from "@/utils/money";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const token = useSession((store) => store.token);
  const addToCart = useCartStore((store) => store.add);
  const cartError = useCartStore((store) => store.error);

  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(MIN_QUANTITY);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    (async () => {
      try {
        const data = await getProductBySlug(slug);
        if (cancelled) return;
        setProduct(data.product);
        setLoadError(null);
      } catch (cause) {
        if (cancelled) return;
        setLoadError(
          cause instanceof Error ? cause.message : "That piece is not available.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function handleAdd() {
    if (!product || !size || !token) return;

    setAdding(true);
    setAdded(false);

    const ok = await addToCart(token, { productId: product.id, size, quantity });

    setAdding(false);

    /* A short confirmation, because the badge updating is easy to miss. */
    if (ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.onyx} />
      </View>
    );
  }

  if (loadError || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Not available</Text>
        <Text style={styles.errorBody}>{loadError}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back to the shop</Text>
        </Pressable>
      </View>
    );
  }

  const hasSaving =
    product.compareAtKobo !== null && product.compareAtKobo > product.priceKobo;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Stack.Screen options={{ title: product.name }} />

      <ProductImage imageUrl={product.imageUrl} rounded={false} />

      <View style={styles.body}>
        <Text style={styles.name}>{product.name}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatNaira(product.priceKobo)}</Text>
          {hasSaving ? (
            <Text style={styles.compareAt}>{formatNaira(product.compareAtKobo!)}</Text>
          ) : null}
          {hasSaving ? (
            <View style={styles.savePill}>
              <Text style={styles.saveText}>
                Save {formatNaira(product.compareAtKobo! - product.priceKobo)}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.description}>{product.description}</Text>

        <Text style={styles.sectionLabel}>Size</Text>
        <View style={styles.sizeRow}>
          {product.sizes.map((option) => {
            const active = size === option;

            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSize(option)}
                style={({ pressed }) => [
                  styles.sizePill,
                  active && styles.sizePillActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.sizeLabel, active && styles.sizeLabelActive]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Quantity</Text>
        <QuantityStepper value={quantity} onChange={setQuantity} />

        {cartError ? (
          <Text accessibilityRole="alert" style={styles.errorBody}>
            {cartError}
          </Text>
        ) : null}

        {/* Disabled until a size is chosen: FRD F4 rule. */}
        <Pressable
          accessibilityRole="button"
          disabled={!size || adding || !token}
          onPress={() => void handleAdd()}
          style={({ pressed }) => [
            styles.addButton,
            (!size || adding || !token) && styles.addButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          <ShoppingBag
            size={20}
            strokeWidth={ICON_STROKE_WIDTH}
            color={size && token ? colors.white : colors.inkMuted}
          />
          <Text
            style={[
              styles.addButtonText,
              (!size || !token) && styles.addButtonTextDisabled,
            ]}
          >
            {adding
              ? "Adding..."
              : added
                ? "Added to your cart"
                : `Add to cart - ${formatNaira(product.priceKobo * quantity)}`}
          </Text>
        </Pressable>

        <Text style={styles.note}>
          Made to order by Jaynie. Please allow 3-5 working days.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.white },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.white },
  errorTitle: { fontFamily: font.black, fontSize: 20, textTransform: "uppercase", color: colors.onyx, marginBottom: 8, textAlign: "center" },
  errorBody: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: colors.inkMuted, textAlign: "center", marginTop: 12 },
  backButton: { marginTop: 24, minHeight: 44, justifyContent: "center", paddingHorizontal: 24 },
  backButtonText: { fontFamily: font.semibold, fontSize: 15, color: colors.goldDeep },
  body: { padding: 16, paddingBottom: 40 },
  name: { fontFamily: font.black, fontSize: 24, textTransform: "uppercase", letterSpacing: -0.01, color: colors.onyx, marginTop: 16 },
  priceRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 8 },
  price: { fontFamily: font.semibold, fontSize: 18, color: colors.onyx },
  compareAt: { fontFamily: font.regular, fontSize: 16, color: colors.inkMuted, opacity: 0.55, textDecorationLine: "line-through" },
  savePill: { backgroundColor: colors.highlight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  saveText: { fontFamily: font.semibold, fontSize: 12, color: colors.onyx },
  description: { fontFamily: font.regular, fontSize: 15, lineHeight: 23, color: colors.inkMuted, marginTop: 16 },
  sectionLabel: { fontFamily: font.semibold, fontSize: 14, color: colors.onyx, marginTop: 24, marginBottom: 8 },
  sizeRow: { flexDirection: "row", gap: 10 },
  sizePill: { minWidth: 52, minHeight: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, borderRadius: 4, backgroundColor: colors.white, paddingHorizontal: 12 },
  sizePillActive: { backgroundColor: colors.onyx, borderColor: colors.onyx },
  sizeLabel: { fontFamily: font.semibold, fontSize: 15, color: colors.onyx },
  sizeLabelActive: { color: colors.white },
  addButton: { marginTop: 32, minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: colors.onyx, borderRadius: 4 },
  addButtonDisabled: { backgroundColor: colors.mist },
  addButtonText: { fontFamily: font.semibold, fontSize: 15, color: colors.white },
  addButtonTextDisabled: { color: colors.inkMuted },
  pressed: { opacity: 0.85 },
  note: { fontFamily: font.regular, fontSize: 13, lineHeight: 18, color: colors.inkMuted, marginTop: 16, textAlign: "center" },
});