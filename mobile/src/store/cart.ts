/*
  FRD F14, F16 and F17. The cart, and the 2-second live sync behind R2.

  THE CART IS SERVER-AUTHORITATIVE. There is no local cart in the app and no
  offline write queue. Every add, quantity change and remove calls the API and
  replaces local state with the response, so the app can never show a total the
  server disagrees with (AGENTS.md rule 15).

  The store's own job is small and worth stating plainly:
    - hold what the server last said
    - track whether a WRITE is in flight, so the poller can stand down and a
      read can never clobber a change that has not been saved yet
    - remember when the cart was last refreshed, so the cart screen can show a
      "last updated" time instead of pretending to be current
*/

import { create } from "zustand";

import {
  addCartItem,
  ApiError,
  getCart,
  removeCartItem,
  setCartItemQuantity,
  type CartLineInput,
} from "@/api/client";
import type { CartResponse, SavedCartLine } from "@/api/types";

export type CartStore = {
  lines: SavedCartLine[];
  itemCount: number;
  subtotalKobo: number;

  /** True until the first successful read, so the UI can show a loading state. */
  loading: boolean;
  /** Server writes in flight. The poller skips while this is above zero. */
  pending: number;

  /** Epoch millis of the last successful read, or null before the first one. */
  lastUpdatedAt: number | null;
  /** Quiet, shopper-safe message. Never a stack trace or a raw error. */
  error: string | null;

  /** Called when the server says the token is dead, so the app can sign out. */
  onUnauthorized: () => void;

  load: (token: string) => Promise<void>;
  add: (token: string, input: CartLineInput) => Promise<boolean>;
  setQuantity: (token: string, input: CartLineInput) => Promise<boolean>;
  remove: (token: string, input: { productId: string; size: string }) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
};

const EMPTY_LINES: SavedCartLine[] = [];

function apply(cart: CartResponse, set: (partial: Partial<CartStore>) => void) {
  set({
    lines: cart.lines,
    itemCount: cart.itemCount,
    subtotalKobo: cart.subtotalKobo,
    lastUpdatedAt: Date.now(),
    error: null,
  });
}

/**
 * A 401 anywhere means the stored token is dead. The caller clears it and the
 * app returns to sign in, rather than continuing to poll with a token that will
 * never work (FRD F16).
 */
function handleError(
  error: unknown,
  set: (partial: Partial<CartStore>) => void,
  get: () => CartStore,
) {
  if (error instanceof ApiError && error.status === 401) {
    get().onUnauthorized();
    return;
  }

  set({
    error:
      error instanceof Error
        ? error.message
        : "Could not reach the shop. Please try again.",
  });
}

export const useCartStore = create<CartStore>((set, get) => ({
  lines: EMPTY_LINES,
  itemCount: 0,
  subtotalKobo: 0,
  loading: true,
  pending: 0,
  lastUpdatedAt: null,
  error: null,
  onUnauthorized: () => {},

  async load(token) {
    try {
      apply(await getCart(token), set);
    } catch (error) {
      handleError(error, set, get);
    } finally {
      set({ loading: false });
    }
  },

  async add(token, input) {
    set({ pending: get().pending + 1, error: null });

    try {
      apply(await addCartItem(token, input), set);
      return true;
    } catch (error) {
      handleError(error, set, get);
      return false;
    } finally {
      set({ pending: Math.max(0, get().pending - 1) });
    }
  },

  async setQuantity(token, input) {
    set({ pending: get().pending + 1, error: null });

    try {
      apply(await setCartItemQuantity(token, input), set);
      return true;
    } catch (error) {
      handleError(error, set, get);
      /* FRD F16: after a failed write, pull the server's version back so the
         UI cannot keep showing an optimistic quantity the server refused. */
      await get().load(token);
      return false;
    } finally {
      set({ pending: Math.max(0, get().pending - 1) });
    }
  },

  async remove(token, input) {
    set({ pending: get().pending + 1, error: null });

    try {
      apply(await removeCartItem(token, input), set);
      return true;
    } catch (error) {
      handleError(error, set, get);
      await get().load(token);
      return false;
    } finally {
      set({ pending: Math.max(0, get().pending - 1) });
    }
  },

  clearError() {
    set({ error: null });
  },

  reset() {
    set({
      lines: EMPTY_LINES,
      itemCount: 0,
      subtotalKobo: 0,
      loading: true,
      pending: 0,
      lastUpdatedAt: null,
      error: null,
    });
  },
}));

/** True while a server write is in flight; the poller stands down. */
export function useCartHasPendingWrite(): boolean {
  return useCartStore((state) => state.pending > 0);
}