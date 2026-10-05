/*
  FRD F16. Filter chips for the shop, matching DESIGN.md section 6: the active
  chip is filled black, inactive ones are outlined. Each is at least 44px tall
  (section 1 rule 6), even though the design says 40px: the hard rule wins, which
  is the same decision the website took.
*/

import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { colors, font, MIN_TAP_TARGET } from "@/theme/tokens";

export type ChipOption = { value: string; label: string };

type Props = {
  label: string;
  options: ChipOption[];
  selected: string | null;
  onSelect: (value: string | null) => void;
};

export function FilterChips({ label, options, selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {/*
        An "All" chip so a filter can always be cleared, which is the same
        affordance the website's shop page gives.
      */}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: selected === null }}
        onPress={() => onSelect(null)}
        style={({ pressed }) => [
          styles.chip,
          selected === null && styles.chipActive,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.label, selected === null && styles.labelActive]}>
          All
        </Text>
      </Pressable>

      {options.map((option) => {
        const active = selected === option.value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(active ? null : option.value)}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/*
  The category slugs are the ones in the database and in the website's shop
  filters, passed straight to GET /api/v1/products. The labels match
  lib/catalog.ts on the server, which sends them in the DTO, so these cannot
  drift from the website's chip text.
*/
export const CATEGORY_OPTIONS: ChipOption[] = [
  { value: "shirts", label: "Shirts" },
  { value: "hoodie-sets", label: "Hoodies & Sets" },
  { value: "tees-polos", label: "T-Shirts & Polos" },
  { value: "bottoms", label: "Cargo & Bottoms" },
  { value: "ankara", label: "Ankara" },
];

export const GENDER_OPTIONS: ChipOption[] = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
];

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  chip: {
    minHeight: MIN_TAP_TARGET,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  chipActive: {
    backgroundColor: colors.onyx,
    borderColor: colors.onyx,
  },
  label: {
    fontFamily: font.medium,
    fontSize: 14,
    color: colors.onyx,
  },
  labelActive: {
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
});