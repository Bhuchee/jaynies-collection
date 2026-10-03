"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
  FRD F5. Signed out, the cart lives in localStorage under the key jc-cart, so a
  guest can build a cart before signing in. Signed in, the same cart is mirrored
  to cart_items in Neon, and after the sign-in merge the server is authoritative.

  unitPriceKobo is for display only: the server recalculates every price in
  placeOrder and never trusts this value.
*/
export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  size: string;
  unitPriceKobo: number;
  quantity: number;
};

/**
 * null means "we have not found out yet". Checkout waits for this to resolve
 * before it decides the cart is empty, so a signed-in shopper is never bounced
 * to /cart while their saved cart is still loading or merging.
 */
export type CartSyncState = "unknown" | "guest" | "syncing" | "ready";

export const MAX_QUANTITY = 10;

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(Math.max(Math.trunc(quantity), 1), MAX_QUANTITY);
}

type CartState = {
  lines: CartLine[];
  /** null until the sync provider has resolved who the shopper is. */
  userId: string | null;
  syncState: CartSyncState;
  /** Number of server writes in flight, so a focus reload cannot clobber one. */
  pending: number;
  setIdentity: (userId: string | null) => void;
  setSyncState: (syncState: CartSyncState) => void;
  /** Replaces the whole cart, used when the server answers. */
  setLines: (lines: CartLine[]) => void;
  addItem: (line: CartLine) => void;
  setQuantity: (productId: string, size: string, quantity: number) => void;
  removeItem: (productId: string, size: string) => void;
  /** Clears only the local cart. The saved cart is left alone on sign-out. */
  clear: () => void;
  beginWrite: () => void;
  endWrite: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      userId: null,
      syncState: "unknown",
      pending: 0,

      setIdentity: (userId) =>
        set((state) => ({
          userId,
          syncState:
            state.syncState === "unknown"
              ? userId
                ? "syncing"
                : "guest"
              : state.syncState,
        })),

      setSyncState: (syncState) => set({ syncState }),

      setLines: (lines) => set({ lines }),

      addItem: (line) =>
        set((state) => {
          const index = state.lines.findIndex(
            (item) => item.productId === line.productId && item.size === line.size,
          );

          if (index === -1) {
            return {
              lines: [...state.lines, { ...line, quantity: clampQuantity(line.quantity) }],
            };
          }

          const lines = [...state.lines];
          const current = lines[index];
          lines[index] = {
            ...current,
            quantity: clampQuantity(current.quantity + line.quantity),
          };
          return { lines };
        }),

      setQuantity: (productId, size, quantity) =>
        set((state) => ({
          lines: state.lines.map((item) =>
            item.productId === productId && item.size === size
              ? { ...item, quantity: clampQuantity(quantity) }
              : item,
          ),
        })),

      removeItem: (productId, size) =>
        set((state) => ({
          lines: state.lines.filter(
            (item) => !(item.productId === productId && item.size === size),
          ),
        })),

      clear: () => set({ lines: [] }),

      beginWrite: () => set((state) => ({ pending: state.pending + 1 })),
      endWrite: () =>
        set((state) => ({ pending: Math.max(0, state.pending - 1) })),
    }),
    {
      name: "jc-cart",
      /* Only the lines are persisted: the identity and sync fields must never
         come back from localStorage, or a stale signed-in flag would leak. */
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

/** True when the cart is safe to read: hydrated, and sync has settled. */
export function useCartReady(): boolean {
  const hydrated = useCartHydrated();
  const syncState = useCartStore((state) => state.syncState);
  return hydrated && syncState !== "unknown" && syncState !== "syncing";
}

/** True while a server write is in flight, used to avoid clobbering changes. */
export function useCartHasPendingWrite(): boolean {
  return useCartStore((state) => state.pending > 0);
}

/**
 * FRD F5. Signing out wipes the local cart so the next person on the device
 * starts with an empty one. It only touches localStorage: the saved cart in
 * Neon is left alone, so signing back in restores it.
 */
export function clearLocalCart(): void {
  useCartStore.getState().clear();
}

/*
  The badge shows the total quantity of items, not the number of lines.
  useSyncExternalStore keeps the server and first client render at 0, then
  picks up the persisted cart after hydration, so there is no mismatch.
*/
function subscribeToCart(onStoreChange: () => void): () => void {
  return useCartStore.subscribe(onStoreChange);
}

function getCartCount(): number {
  return useCartStore
    .getState()
    .lines.reduce((total, line) => total + line.quantity, 0);
}

function getServerCartCount(): number {
  return 0;
}

export function useCartCount(): number {
  return useSyncExternalStore(
    subscribeToCart,
    getCartCount,
    getServerCartCount,
  );
}

function subscribeToNothing(): () => void {
  return () => {};
}

function hasHydrated(): boolean {
  return true;
}

function hasNotHydrated(): boolean {
  return false;
}

/*
  False while the server renders, true in the browser. Pages that read the
  persisted cart wait for this before showing an empty state, so a saved cart
  never flashes as empty during hydration.
*/
export function useCartHydrated(): boolean {
  return useSyncExternalStore(subscribeToNothing, hasHydrated, hasNotHydrated);
}