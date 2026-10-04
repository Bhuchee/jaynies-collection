/*
  FRD F16. The DESIGN.md tokens as plain constants, because React Native has no
  CSS custom properties and no tailwind.config.

  Every value here is copied from DESIGN.md section 2 and nowhere else. No hex
  value is hard-coded in a component: a component that needs a colour imports it
  from here, so the app cannot drift from the website's palette
  (AGENTS.md rule 10, DESIGN.md section 1 rule 3).

  DESIGN.md section 1 rule 2: icons are lucide-react-native only, 1.5px stroke,
  20px by default and 24px in navigation.
*/

export const colors = {
  /* Primary text, primary buttons, footer, active chips. */
  onyx: "#0A0A0A",
  /* Secondary text. */
  inkMuted: "#5C5C5C",
  /* Highlighter blocks behind headline words, the delivery band, badges. */
  highlight: "#EAD86B",
  /* Logo-adjacent accents, the email button, the cart badge. */
  gold: "#C9A44C",
  /* Gold text on light backgrounds. */
  goldDeep: "#8E6E27",
  /* Alternate section background. */
  cream: "#FBF9EE",
  /* Hero card background, input backgrounds. */
  mist: "#F1F2F1",
  /* Product image placeholder and card background. */
  photo: "#D3D3D3",
  /* Borders and dividers. */
  line: "#E4E4E4",
  /* Page background. */
  white: "#FFFFFF",
  /* Success banner text and icon. */
  success: "#2F6B3B",
  /* Errors. */
  danger: "#B3261E",
} as const;

/*
  DESIGN.md section 3. Poppins for everything, loaded by expo-font at startup.
  DESIGN.md section 1 rule 6: tap targets are at least 44px.
*/
export const font = {
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semibold: "Poppins_600SemiBold",
  extrabold: "Poppins_800ExtraBold",
  black: "Poppins_900Black",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  pill: 999,
} as const;

/** DESIGN.md section 1 rule 6: never smaller than this. */
export const MIN_TAP_TARGET = 44;

/** DESIGN.md section 1 rule 2: lucide icons use a 1.5px stroke. */
export const ICON_STROKE_WIDTH = 1.5;
export const ICON_SIZE = 20;
export const ICON_SIZE_NAV = 24;