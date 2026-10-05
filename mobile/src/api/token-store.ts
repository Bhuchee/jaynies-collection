/*
  FRD F15 and AGENTS.md rule 19.

  The bearer token lives in expo-secure-store, which is Android Keystore-backed.
  It is NOT in AsyncStorage, and NOT in an environment variable: an EXPO_PUBLIC_
  value is compiled into the JavaScript bundle where anyone can read it.

  Nothing here ever logs the token. The read, write and delete are the only
  places the token is touched, and every one of them is failure-tolerant: a
  keystore that refuses is a signing-out problem, never a crash.
*/

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/*
  expo-secure-store keys must be alphanumeric plus ".-_" on Android, so this is
  deliberately plain ASCII with no separators that need escaping.
*/
const TOKEN_KEY = "jc-api-token";

export async function readToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    /* A keystore read can fail on a device with no secure lock. Treat that as
       signed out rather than crashing on launch. */
    return null;
  }
}

/**
 * `keychainAccessible` is an iOS-only option. On Android it is ignored, so passing
 * it unconditionally is misleading even though it does not throw. Sending it only
 * where it means something keeps the intent honest: on Android the Keystore
 * wrapping is the default and there is nothing to choose.
 */
function writeOptions() {
  if (Platform.OS === "ios") {
    return { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
  }

  return {};
}

export async function writeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token, writeOptions());
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    /* Already gone, which is the state we wanted anyway. */
  }
}