/*
  FRD F16. A product card for the shop grid.

  The price row follows DESIGN.md section 3: the live price is 600 weight and the
  compare-at is quiet, struck through and muted, because the live price is what
  is being sold.
*/

import { Pressable, StyleSheet, Text, View } from "react-native";

import { ProductImage } from "@/components/ProductImage";
import type { ProductDto } from "@/api/types";
import { colors, font } from "@/theme/tokens";
import { formatNaira } from "@/utils/money";

type Props = {
  product: ProductDto;
  onPress: (product: ProductDto) => void;
};

export function ProductCard({ product, onPress }: Props) {
  const hasSaving =
    product.compareAtKobo !== null && product.compareAtKobo > product.priceKobo;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatNaira(product.priceKobo)}`}
      onPress={() => onPress(product)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <ProductImage imageUrl={product.imageUrl} />

      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>

      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatNaira(product.priceKobo)}</Text>

        {hasSaving ? (
          <Text style={styles.compareAt}>{formatNaira(product.compareAtKobo!)}</Text>
        ) : null}
      </View>

      {hasSaving ? (
        <View style={styles.savePill}>
          <Text style={styles.saveText}>
            Save {formatNaira(product.compareAtKobo! - product.priceKobo)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
  },
  pressed: {
    opacity: 0.85,
  },
  name: {
    fontFamily: font.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.onyx,
    marginTop: 10,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  price: {
    fontFamily: font.semibold,
    fontSize: 16,
    color: colors.onyx,
  },
  /*
    DESIGN.md section 3: the compare-at is deliberately the quietest thing in the
    price row, so the live price is what the eye lands on.
  */
  compareAt: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.inkMuted,
    opacity: 0.55,
    textDecorationLine: "line-through",
  },
  savePill: {
    alignSelf: "flex-start",
    backgroundColor: colors.highlight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  saveText: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.onyx,
  },
});