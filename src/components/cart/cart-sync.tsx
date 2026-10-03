"use client";

import { useEffect } from "react";
import {
  addSavedCartLine,
  fetchSavedCart,
  mergeGuestCart,
  removeSavedCartLine,
  setSavedCartQuantity,
  type CartActionResult,
} from "@/actions/cart";
import { resetCartAfterSignOut, useCartStore } from "@/store/cart";

type CartSyncProps = {
  /** The session's user id, or null when signed out. Rendered on the server. */
  userId: string | null;
};

/**
 * FRD F5. Three jobs, in order of importance:
 *
 *  1. Merge the guest cart into the saved cart EXACTLY ONCE, for a cart that was
 *     built while signed out. The persisted `syncedUserId` marker decides this,
 *     not an in-memory ref: a ref is lost on every refresh, which used to let a
 *     stale local cart be merged back into a server cart that another device had
 *     already emptied by ordering.
 *  2. While signed in, mirror every add, quantity change and remove to the
 *     server.
 *  3. For an already-synced shopper, load the server cart on page load and on tab
 *     focus, and let it REPLACE the local cart completely. An empty server cart is
 *     a real answer, so the local cart must be emptied too.
 *
 * A focus reload is skipped while a write is in flight, so it can never overwrite
 * a change that has not been saved yet.
 */
export function CartSync({ userId }: CartSyncProps) {
  useEffect(() => {
    const store = useCartStore.getState();
    store.setIdentity(userId);
  }, [userId]);

  /*
    FRD F5. The first load for a shopper on this device either merges the guest
    cart, or, if this device has already merged for this user, just loads the saved
    cart. After the marker is set, localStorage is never pushed back to the server.
  */
  useEffect(() => {
    if (!userId) return;

    const store = useCartStore.getState();

    if (store.syncedUserId === userId) {
      /* Already synced on this device: the server cart is the whole truth. */
      store.setSyncState("syncing");

      let cancelled = false;

      void (async () => {
        try {
          const result: CartActionResult = await fetchSavedCart();

          if (cancelled) return;

          if (result.ok) {
            /* Replaces local lines outright, including with an empty list. */
            useCartStore.getState().setLines(result.lines);
          }
        } catch {
          /* Keep the local cart and let the shopper carry on. */
        } finally {
          if (!cancelled) {
            useCartStore.getState().setSyncState("ready");
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    /* Not merged yet: this local cart was built while signed out. */
    store.setSyncState("syncing");

    let cancelled = false;

    void (async () => {
      try {
        const result: CartActionResult = await mergeGuestCart(
          useCartStore.getState().lines,
        );

        if (cancelled) return;

        if (result.ok) {
          const state = useCartStore.getState();
          state.setLines(result.lines);
          /* Only mark it synced once the server has actually answered, so a
             failed merge is retried rather than skipped forever. */
          state.markSynced(userId);
        }
      } catch {
        /* A failed merge must not trap the shopper on a loading screen. */
      } finally {
        if (!cancelled) {
          useCartStore.getState().setSyncState("ready");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  /* Focus reload, for a shopper who has already merged. The server cart replaces
     the local cart completely, and an empty server cart empties the local one. */
  useEffect(() => {
    if (!userId) return;
    if (useCartStore.getState().syncedUserId !== userId) return;

    async function reload() {
      const state = useCartStore.getState();

      if (state.pending > 0) return;

      try {
        const result = await fetchSavedCart();

        if (result.ok && useCartStore.getState().pending === 0) {
          useCartStore.getState().setLines(result.lines);
        }
      } catch {
        /* Offline or a dropped request: keep what we have and try again later. */
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        void reload();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [userId]);

  /*
    FRD F5. Sign-out clears the local cart AND forgets the merge marker, so the
    next person on a shared device sees none and a later sign-in is a fresh merge.
    The saved cart stays in Neon, so the shopper gets it back when they sign in.

    The guard is `syncedUserId` being non-null, meaning THIS DEVICE has merged a
    guest cart for some account before. A true guest has a null marker, and their
    cart must survive every reload. Guarding on `syncState` instead was wrong,
    because a signed-out visitor is already in the "guest" state by the time this
    runs, so every guest page load wiped their cart.

    The explicit sign-out click also calls clearLocalCart() in the account menu,
    which covers the case where the page does not reload at all.
  */
  useEffect(() => {
    if (userId) return;

    /* A genuine guest is left alone; only a previously synced device clears. */
    resetCartAfterSignOut();
  }, [userId]);

  return null;
}

/**
 * FRD F5. Mirrors one local cart change to the server when signed in, and adopts
 * the server's response as the new local cart. Returns true when a server write
 * happened.
 */
export async function pushCartChange(
  change:
    | { kind: "add"; productId: string; size: string; quantity: number }
    | { kind: "setQuantity"; productId: string; size: string; quantity: number }
    | { kind: "remove"; productId: string; size: string; quantity?: number },
): Promise<boolean> {
  const state = useCartStore.getState();

  if (!state.userId) return false;

  const payload = {
    productId: change.productId,
    size: change.size,
    quantity: change.kind === "remove" ? 1 : change.quantity,
  };

  state.beginWrite();

  try {
    const result =
      change.kind === "add"
        ? await addSavedCartLine(payload)
        : change.kind === "setQuantity"
          ? await setSavedCartQuantity(payload)
          : await removeSavedCartLine(payload);

    if (result.ok) {
      useCartStore.getState().setLines(result.lines);
      return true;
    }

    /* The server refused, so its version of the cart is the truth. */
    const refreshed = await fetchSavedCart();

    if (refreshed.ok) {
      useCartStore.getState().setLines(refreshed.lines);
    }

    return false;
  } catch {
    return false;
  } finally {
    useCartStore.getState().endWrite();
  }
}