/**
 * Mobile API client — configured with SecureStore token storage
 * and Expo Router navigation for auth failures.
 */
import { createApiClient } from "@canovet/core";
import { secureTokenStorage } from "./token-storage";
import { router } from "expo-router";

// TODO: Replace with your production API URL or use an env var.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

export const api = createApiClient(
  API_BASE_URL,
  secureTokenStorage,
  {
    onAuthFailure: () => {
      // Navigate to login screen when auth fails irrecoverably.
      router.replace("/login");
    },
  },
  {
    // Mobile doesn't use httpOnly cookies — tokens are in SecureStore.
    withCredentials: false,
  }
);
