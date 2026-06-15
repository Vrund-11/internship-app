/**
 * Platform-agnostic storage adapter interface.
 *
 * Web implementations use localStorage / in-memory token.
 * React Native implementations use expo-secure-store / AsyncStorage.
 */

/** Adapter for sensitive credential storage (tokens). */
export interface TokenStorageAdapter {
  getAccessToken: () => Promise<string | null>;
  setAccessToken: (token: string | null) => Promise<void>;
  getRefreshToken: () => Promise<string | null>;
  setRefreshToken: (token: string | null) => Promise<void>;
}

/** Adapter for general key-value persistence (city, preferences). */
export interface KVStorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

/** Adapter for navigation/routing (redirect on auth failure, etc.). */
export interface NavigationAdapter {
  /** Called when auth fails irrecoverably — e.g. redirect to login. */
  onAuthFailure: () => void;
}
