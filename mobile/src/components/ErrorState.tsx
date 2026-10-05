/*
  FRD F16. The error state used by the shop and the cart.

  This exists because an error that renders as an empty list is worse than useless:
  it tells the shopper "there is nothing here" when the truth is "we could not ask
  the question". Both screens now show this instead, with a Retry that repeats the
  exact request that failed.
*/

import { Pressable, StyleSheet, Text, View } from "react-native";
import { RefreshCw } from "lucide-react-native";

import { colors, font, ICON_STROKE_WIDTH, MIN_TAP_TARGET } from "@/theme/tokens";

type Props = {
  title: string;
  message: string;
  onRetry: () => void;
  busy?: boolean;
};

export function ErrorState({ title, message, onRetry, busy = false }: Props) {
  return (
    <View style={styles.wrap}>
      <View accessibilityRole="alert" style={styles.box}>
        <Text style={styles.title}>{title}</Text>
        {/* The specific reason, not a generic apology. */}
        <Text style={styles.message}>{message}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry"
        disabled={busy}
        onPress={onRetry}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
          busy && styles.pressed,
        ]}
      >
        <RefreshCw
          size={20}
          strokeWidth={ICON_STROKE_WIDTH}
          color={colors.white}
        />
        <Text style={styles.buttonText}>{busy ? "Retrying..." : "Retry"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 24,
    alignItems: "center",
  },
  box: {
    alignSelf: "stretch",
    backgroundColor: colors.highlight,
    borderRadius: 4,
    padding: 16,
  },
  title: {
    fontFamily: font.black,
    fontSize: 18,
    textTransform: "uppercase",
    color: colors.onyx,
    marginBottom: 6,
  },
  message: {
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.onyx,
  },
  button: {
    minHeight: 48,
    minWidth: MIN_TAP_TARGET,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    alignSelf: "stretch",
    backgroundColor: colors.onyx,
    borderRadius: 4,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontFamily: font.semibold,
    fontSize: 15,
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
});