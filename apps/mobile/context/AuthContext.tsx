import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@canovet/core";
import { logger } from "@canovet/core";
import { api } from "../lib/api";
import { secureTokenStorage } from "../lib/token-storage";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, pass: string) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, pass: string) => {
    try {
      await SecureStore.deleteItemAsync("dev_logged_out");
      const res = await api.post("/auth/login-signup", {
        email,
        password: pass,
        platform: "mobile", // Tells the backend to return refresh token in body
      });

      const { accessToken, refreshToken, user } = res.data;

      await secureTokenStorage.setAccessToken(accessToken);
      await secureTokenStorage.setRefreshToken(refreshToken);
      setUser(user);
      return user as User;
    } catch (err) {
      console.error("Login failed");
      throw err;
    }
  };


  const logout = async () => {
    try {
      await SecureStore.setItemAsync("dev_logged_out", "true");
      await api.post("/auth/logout");
    } catch {}

    await secureTokenStorage.setAccessToken(null);
    await secureTokenStorage.setRefreshToken(null);
    setUser(null);
  };

  const hydrateUser = async () => {
    try {
      logger.info("AUTH_HYDRATE_START");

      // On mobile, send the refresh token in the request body.
      const refreshToken = await secureTokenStorage.getRefreshToken();

      if (!refreshToken) {
        logger.info("AUTH_HYDRATE_NO_SESSION");
        setUser(null);
        setLoading(false);
        return;
      }

      const refreshRes = await api.post("/auth/refresh", { refreshToken });

      const newAccessToken = refreshRes.data.accessToken;
      await secureTokenStorage.setAccessToken(newAccessToken);

      // If the server rotated the refresh token, save the new one.
      if (refreshRes.data.refreshToken) {
        await secureTokenStorage.setRefreshToken(refreshRes.data.refreshToken);
      }

      const meRes = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
        },
      });

      setUser(meRes.data);
      logger.info("AUTH_HYDRATE_SUCCESS");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logger.info("AUTH_HYDRATE_NO_SESSION");
      } else {
        logger.error("AUTH_HYDRATE_FAILED", err);
      }

      await secureTokenStorage.setAccessToken(null);
      await secureTokenStorage.setRefreshToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await SecureStore.deleteItemAsync("dev_logged_out");
      } catch {}
      hydrateUser();
    };
    init();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
