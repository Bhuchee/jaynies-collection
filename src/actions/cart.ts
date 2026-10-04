"use server";

import { auth } from "@/auth";
import {
  addSavedCartLine as addLine,
  getSavedCart,
  mergeGuestCart as mergeCart,
  removeSavedCartLine as removeLine,
  setSavedCartQuantity as setQuantity,
  type SavedCart,
  type SavedCartLine,
} from "@/lib/cart";

/*
  FRD F5. The website's Server Actions are now THIN WRAPPERS over the shared
  functions in lib/cart.ts, which is what lets the app and the website use the
  same cart logic (FRD F14).

  This file has only two jobs left:
    1. resolve auth() to a userId, which only the website needs
    2. hand back the same result shape the website's client components already
       expect, so nothing downstream had to change

  The Server Actions are deliberately KEPT even though the website's cart
  client now calls /api/v1/cart over HTTP (FRD F14). That is the second working
  path: if the HTTP switch ever needs reverting, the actions are still here and
  still tested, and they cost one small file.

  CartActionResult is kept as an alias so every existing import keeps working.
*/

export type { SavedCartLine };
export type CartActionResult = SavedCart;

/** The signed-in shopper's id, or null when there is no session. */
async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** FRD F5. Reads the saved cart joined to the catalogue. */
export async function fetchSavedCart(): Promise<CartActionResult> {
  return getSavedCart((await currentUserId()) ?? "");
}

/** FRD F5 sign-in merge. MAX, not sum, capped at 10, one-sided lines kept. */
export async function mergeGuestCart(
  guestLines: unknown,
): Promise<CartActionResult> {
  return mergeCart((await currentUserId()) ?? "", guestLines);
}

/** FRD F5. Adds to any existing quantity for the same product and size. */
export async function addSavedCartLine(input: unknown): Promise<CartActionResult> {
  return addLine((await currentUserId()) ?? "", input);
}

/** FRD F5. Sets an exact quantity on one saved line. */
export async function setSavedCartQuantity(
  input: unknown,
): Promise<CartActionResult> {
  return setQuantity((await currentUserId()) ?? "", input);
}

/** FRD F5. Removes one saved line. */
export async function removeSavedCartLine(input: unknown): Promise<CartActionResult> {
  return removeLine((await currentUserId()) ?? "", input);
}