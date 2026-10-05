/*
  FRD F16. A 1 to 10 quantity stepper, matching the website's (FRD F4) and the
  server's cart_items check constraint. The server caps at 10, so the UI must
  too: a shopper should not be able to pick something the server will refuse.

  DESIGN.md section 1 rule 6: the buttons are at least 44px.
*/

import { Pressable, StyleSheet, Text, View } from "react-native";
import { Minus, Plus } from "lucide-react-native";

import { colors, font, ICON_STROKE_WIDTH, MIN_TAP_TARGET } from "@/theme/tokens";

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 10;

type Props = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function QuantityStepper({ value, onChange, disabled = false }: Props) {
  const canDecrease = value > MIN_QUANTITY && !disabled;
  const canIncrease = value < MAX_QUANTITY && !disabled;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        disabled={!canDecrease}
        onPress={() => onChange(Math.max(MIN_QUANTITY, value - 1))}
        style={({ pressed }) => [
          styles.button,
          !canDecrease && styles.buttonDisabled,
          pressed && canDecrease && styles.pressed,
        ]}
      >
        <Minus
          size={20}
          strokeWidth={ICON_STROKE_WIDTH}
          color={canDecrease ? colors.onyx : colors.inkMuted}
        />
      </Pressable>

      <Text style={styles.value} accessibilityLabel={`Quantity ${value}`}>
        {value}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        disabled={!canIncrease}
        onPress={() => onChange(Math.min(MAX_QUANTITY, value + 1))}
        style={({ pressed }) => [
          styles.button,
          !canIncrease && styles.buttonDisabled,
          pressed && canIncrease && styles.pressed,
        ]}
      >
        <Plus
          size={20}
          strokeWidth={ICON_STROKE_WIDTH}
          color={canIncrease ? colors.onyx : colors.inkMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 4,
    alignSelf: "flex-start",
    overflow: "hidden",
  },
  button: {
    width: MIN_TAP_TARGET,
    height: MIN_TAP_TARGET,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  buttonDisabled: {
    backgroundColor: colors.mist,
  },
  value: {
    fontFamily: font.semibold,
    fontSize: 16,
    color: colors.onyx,
    minWidth: 36,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.85,
  },
});