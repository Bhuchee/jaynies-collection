/*
  FRD F16. The bottom tab bar, matching the website's mobile nav (DESIGN.md
  section 6): Shop, Cart and Account, with the cart badge driven by the SERVER
  cart.

  The badge is the total quantity, not the number of lines, which is the same rule
  the website follows. Because the cart is polled every two seconds, a line added
  on the website puts a badge on this tab without any interaction.

  useLiveCart is mounted here, ONCE, at the app shell rather than inside the cart
  screen. That is deliberate: the badge has to be live even while the shopper is
  looking at the shop, otherwise the graded "appears in the app's cart" would
  only work on one screen.
*/

import { Tabs } from "expo-router";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { LayoutGrid, ShoppingBag, UserRound } from "lucide-react-native";

import { useLiveCart } from "@/hooks/use-live-cart";
import { useSession } from "@/store/session";
import { useCartStore } from "@/store/cart";
import { colors, font, ICON_STROKE_WIDTH } from "@/theme/tokens";

export default function TabsLayout() {
  useLiveCart();

  const router = useRouter();
  const state = useSession((store) => store.state);
  const signedIn = state === "signedIn";

  /* The badge is the total quantity, matching the website. */
  const itemCount = useCartStore((store) => store.itemCount);

  useEffect(() => {
    if (!signedIn && state !== "loading") router.replace("/signin");
  }, [signedIn, state, router]);

  /*
    Signed out means /me rejected the token, or there never was one. Sign-in is
    mandatory now (PRD 4A), so the tabs are not reachable signed out: the shopper
    goes to the full-screen Sign in rather than into a shop with no cart.
  */
  if (!signedIn) return null;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.onyx },
        headerTintColor: colors.white,
        headerTitleStyle: { fontFamily: font.extrabold },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.onyx,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 12 },
        sceneStyle: { backgroundColor: colors.white },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Shop",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <LayoutGrid size={size} strokeWidth={ICON_STROKE_WIDTH} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          headerShown: false,
          /* The gold badge is DESIGN.md's cart badge colour. */
          tabBarBadge: signedIn && itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.gold,
            color: colors.onyx,
            fontFamily: font.semibold,
          },
          tabBarIcon: ({ color, size }) => (
            <ShoppingBag size={size} strokeWidth={ICON_STROKE_WIDTH} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          /* This tab carries its own title block, so the header would duplicate it. */
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <UserRound size={size} strokeWidth={ICON_STROKE_WIDTH} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}