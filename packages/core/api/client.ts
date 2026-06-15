import axios, { type AxiosInstance } from "axios";
import type { TokenStorageAdapter, NavigationAdapter } from "../adapters";

/**
 * Creates a platform-agnostic Axios API client with:
 *   - Automatic Bearer token injection via request interceptor
 *   - Silent refresh on 401 via response interceptor
 *
 * Both the web app (Next.js) and the mobile app (React Native) use this
 * factory, each supplying their own TokenStorageAdapter & NavigationAdapter.
 *
 * Web: stores access token in memory, refresh token in httpOnly cookie (handled by browser).
 * Mobile: stores both tokens in expo-secure-store.
 */
export function createApiClient(
  baseURL: string,
  tokenStorage: TokenStorageAdapter,
  navigation: NavigationAdapter,
  options?: {
    /** If true, sends cookies with every request (web only — httpOnly cookie flow). */
    withCredentials?: boolean;
  }
): AxiosInstance {
  const api = axios.create({
    baseURL,
    withCredentials: options?.withCredentials ?? false,
  });

  // ── Request Interceptor ─────────────────────────────────────────────
  api.interceptors.request.use(async (config) => {
    const token = await tokenStorage.getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  // ── Response Interceptor (silent 401 refresh) ───────────────────────
  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalRequest = error.config as
        | (typeof error.config & { _retry?: boolean; url?: string })
        | undefined;

      // Don't attempt refresh for the refresh endpoint itself (avoids loop).
      const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh");

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !isRefreshRequest
      ) {
        originalRequest._retry = true;

        try {
          // Build the refresh payload.  On mobile we send the refresh token
          // in the body; on web the httpOnly cookie is sent automatically.
          const refreshToken = await tokenStorage.getRefreshToken();

          const refreshRes = await axios.post(
            `${baseURL}/auth/refresh`,
            refreshToken ? { refreshToken } : {},
            { withCredentials: options?.withCredentials ?? false }
          );

          const newAccessToken: string = refreshRes.data.accessToken;

          await tokenStorage.setAccessToken(newAccessToken);

          // If the server returns a new refresh token (mobile flow), persist it.
          if (refreshRes.data.refreshToken) {
            await tokenStorage.setRefreshToken(refreshRes.data.refreshToken);
          }

          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return api(originalRequest);
        } catch {
          navigation.onAuthFailure();
        }
      }

      return Promise.reject(error);
    }
  );

  return api;
}
