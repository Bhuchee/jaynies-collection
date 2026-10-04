/*
  FRD F15 and F16. The app's session state.

  Three states, and the difference matters:

    loading   we have not found out yet, so the UI shows nothing decisive
    signedOut no usable token: show the sign-in screen
    signedIn  a token that /api/v1/me accepted

  A 401 from ANY call clears the stored token and drops to signedOut. There is no
  refresh token and no silent refresh (FRD F15): a lapsed session means signing
  in again through the browser, which is one tap.
*/

import { create } from "zustand";

import {
  deleteMobileSession,
  getMe,
  type MeResponse,
} from "@/api/client";
import { clearToken, readToken, writeToken } from "@/api/token-store";

export type SessionState = "loading" | "signedOut" | "signedIn";

export type SessionUser = MeResponse["user"];

type SessionStore = {
  state: SessionState;
  token: string | null;
  user: SessionUser | null;
  /** Why the last attempt failed, safe to show a shopper. */
  error: string | null;
  /** Kept so the delivery fees are available without a second call. */
  deliveryZones: MeResponse["deliveryZones"];

  /** Reads the stored token and validates it with /me. Called on cold start. */
  restore: () => Promise<void>;
  signIn: (token: string, user: SessionUser) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const useSession = create<SessionStore>((set, get) => ({
  state: "loading",
  token: null,
  user: null,
  error: null,
  deliveryZones: [],

  async restore() {
    const token = await readToken();

    if (!token) {
      set({ state: "signedOut", token: null, user: null });
      return;
    }

    try {
      const me = await getMe(token);

      set({
        state: "signedIn",
        token,
        user: me.user,
        deliveryZones: me.deliveryZones,
        error: null,
      });
    } catch {
      /* Unknown or expired token: forget it and start clean. */
      await clearToken();
      set({ state: "signedOut", token: null, user: null });
    }
  },

  async signIn(token, user) {
    await writeToken(token);
    set({ state: "signedIn", token, user, error: null });
  },

  async signOut() {
    const { token } = get();

    /*
      Tell the server first so it can delete its session row, but never let a
      failure trap the shopper: the local token is cleared either way, because
      signing out on this device must work even with no network.
    */
    if (token) {
      try {
        await deleteMobileSession(token);
      } catch {
        /* The local clear below is what makes the device signed out. */
      }
    }

    await clearToken();
    set({ state: "signedOut", token: null, user: null, error: null });
  },

  clearError() {
    set({ error: null });
  },
}));