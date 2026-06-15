/**
 * React Native implementation of TokenStorageAdapter.
 *
 * Uses expo-secure-store for encrypted, persistent token storage.
 * Falls back gracefully on web (where SecureStore is unavailable).
 */
import * as SecureStore from "expo-secure-store";
import type { TokenStorageAdapter } from "@canovet/core";

const ACCESS_TOKEN_KEY = "canovet_access_token";
const REFRESH_TOKEN_KEY = "canovet_refresh_token";

export const secureTokenStorage: TokenStorageAdapter = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),

  setAccessToken: async (token) => {
    if (token) {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    }
  },

  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),

  setRefreshToken: async (token) => {
    if (token) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  },
};
