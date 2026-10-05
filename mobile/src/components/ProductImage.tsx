/*
  FRD F16. A product image with the same placeholder fallback the website uses.

  The API returns an absolute imageUrl built from NEXT_PUBLIC_SITE_URL, because
  the app has no origin of its own to resolve "/products/x.webp" against. Ten
  products still have no photo, so the fallback is a normal case, not an edge
  case: the same --photo background and a plain card, in DESIGN.md colours.
*/

import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Shirt } from "lucide-react-native";

import { colors, ICON_STROKE_WIDTH } from "@/theme/tokens";

type Props = {
  imageUrl: string | null;
  /** 3:4 portrait, matching DESIGN.md section 1 rule 4. */
  aspectRatio?: number;
  rounded?: boolean;
};

export function ProductImage({ imageUrl, aspectRatio = 3 / 4, rounded = true }: Props) {
  /* DESIGN.md: a missing or broken image falls back to the branded placeholder
     rather than a broken-image icon. */
  const [failed, setFailed] = useState(false);

  const showPlaceholder = !imageUrl || failed;

  return (
    <View
      style={[
        styles.frame,
        { aspectRatio },
        rounded && styles.rounded,
      ]}
    >
      {showPlaceholder ? (
        <View style={styles.placeholder} accessibilityRole="image">
          <Shirt size={32} strokeWidth={ICON_STROKE_WIDTH} color={colors.inkMuted} />
        </View>
      ) : (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessibilityRole="image"
        />
      )}
    </View>
  );
}

/*
  DESIGN.md section 4 rule 1: every product image sits on the same light grey
  background, which is what makes a mixed catalogue look like one photo shoot.
*/
const styles = StyleSheet.create({
  frame: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: colors.photo,
  },
  rounded: {
    borderRadius: 4,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mist,
  },
});