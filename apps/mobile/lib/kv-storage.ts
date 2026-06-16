/**
 * React Native implementation of KVStorageAdapter.
 *
 * Uses AsyncStorage for non-sensitive key-value persistence (city, preferences).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { KVStorageAdapter } from "@canovet/core";

export const asyncKVStorage: KVStorageAdapter = {
  getItem: (key) => AsyncStorage.getItem(key),

  setItem: (key, value) => AsyncStorage.setItem(key, value),

  removeItem: (key) => AsyncStorage.removeItem(key),
};
