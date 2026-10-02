"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
  FRD F5. The cart lives in localStorage under the key jc-cart, so a guest can
  build a cart before signing in. unitPriceKobo is for display only: the server
  recalculates every price in placeOrder and never trusts this value.
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

export const MAX_QUANTITY = 10;

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(Math.max(Math.trunc(quantity), 1), MAX_QUANTITY);
}

type CartState = {
  lines: CartLine[];
  addItem: (line: CartLine) => void;
  setQuantity: (productId: string, size: string, quantity: number) => void;
  removeItem: (productId: string, size: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],

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
    }),
    { name: "jc-cart" },
  ),
);

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