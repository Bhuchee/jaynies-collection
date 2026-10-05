/*
  FRD F16. The shop: a 2-column grid with the same category and gender filters
  and the same search as the website (FRD F3 and F13).

  Filters are passed straight to GET /api/v1/products, and the server reuses the
  website's own parseShopFilters, so the two surfaces cannot disagree about what
  "Men" or "Ankara" means.
*/

import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, X } from "lucide-react-native";

import {
  CATEGORY_OPTIONS,
  FilterChips,
  GENDER_OPTIONS,
} from "@/components/FilterChips";
import { ProductCard } from "@/components/ProductCard";
import { ErrorState } from "@/components/ErrorState";
import { getProducts } from "@/api/client";
import type { ProductDto } from "@/api/types";
import { colors, font, ICON_STROKE_WIDTH, MIN_TAP_TARGET } from "@/theme/tokens";

/* The server trims the search term and caps it, so the UI does not have to. */
const SEARCH_DEBOUNCE_MS = 350;

export default function ShopScreen() {
  const router = useRouter();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  /* Debounced so typing does not fire a request per keystroke. */
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);

      try {
        const data = await getProducts({
          category: category ?? undefined,
          gender: gender ?? undefined,
          q: debouncedSearch || undefined,
        });

        setProducts(data.products);
        setTotal(data.total);
        setError(null);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load the shop. Pull down to try again.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category, gender, debouncedSearch],
  );

  /* Reload whenever a filter changes: the list is server-filtered, not local. */
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>JAYNIE&apos;S</Text>
        <Text style={styles.tagline}>Handmade ready-to-wear</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search
            size={20}
            strokeWidth={ICON_STROKE_WIDTH}
            color={colors.inkMuted}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search pieces"
            placeholderTextColor={colors.inkMuted}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Search pieces"
          />
          {search ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setSearch("")}
              style={styles.clearButton}
            >
              <X size={18} strokeWidth={ICON_STROKE_WIDTH} color={colors.onyx} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FilterChips
        label="Category"
        options={CATEGORY_OPTIONS}
        selected={category}
        onSelect={setCategory}
      />
      <FilterChips
        label="Gender"
        options={GENDER_OPTIONS}
        selected={gender}
        onSelect={setGender}
      />

      <View style={styles.resultRow}>
        <Text style={styles.resultText}>
          {loading ? "Loading..." : `${total} ${total === 1 ? "piece" : "pieces"}`}
        </Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(product) => product.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={(product) => router.push(`/product/${product.slug}`)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load("refresh")}
            tintColor={colors.onyx}
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.empty} color={colors.onyx} />
          ) : error ? (
            /*
              A failure must never render as an empty shop. The shopper has to be
              able to tell "no such pieces" apart from "we could not ask".
            */
            <ErrorState
              title="Could not load the shop"
              message={error}
              busy={loading}
              onRetry={() => void load()}
            />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptyBody}>
                Try another filter, or clear the search.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.onyx,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  wordmark: {
    fontFamily: font.black,
    fontSize: 24,
    letterSpacing: 2,
    color: colors.gold,
  },
  tagline: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.line,
    marginTop: 2,
  },
  searchRow: {
    paddingHorizontal: 10,
    paddingTop: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.mist,
    borderRadius: 4,
    paddingHorizontal: 12,
    minHeight: MIN_TAP_TARGET,
  },
  searchInput: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.onyx,
    paddingVertical: 10,
  },
  clearButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  resultRow: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  resultText: {
    fontFamily: font.medium,
    fontSize: 13,
    color: colors.inkMuted,
  },
  list: {
    paddingBottom: 24,
  },
  row: {
    justifyContent: "flex-start",
  },
  empty: {
    padding: 32,
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: font.black,
    fontSize: 20,
    textTransform: "uppercase",
    color: colors.onyx,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
    textAlign: "center",
  },
});