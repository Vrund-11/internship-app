"use client";

import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import { api, setAccessToken as setApiToken } from "@/lib/api";
import { logger } from "@/lib/logger";

type User = {
  id: string;
  phone: string;
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const updateAccessToken = (token: string | null) => {
    setAccessToken(token);
    setApiToken(token);
  };

  const login = async (phone: string, otp: string) => {
    try {
      const res = await api.post("/auth/verify-otp", {
        phone,
        otp,
      });

      const { accessToken, user } = res.data;

      updateAccessToken(accessToken);
      setUser(user);
    } catch (err) {
      console.error("Login failed");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}

    setUser(null);
    updateAccessToken(null);
  };

  const hydrateUser = useEffectEvent(async () => {
    try {
      logger.info("AUTH_HYDRATE_START");

      const refreshRes = await api.post("/auth/refresh");

      updateAccessToken(refreshRes.data.accessToken);

      const meRes = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${refreshRes.data.accessToken}`,
        },
      });

      setUser(meRes.data);
      logger.info("AUTH_HYDRATE_SUCCESS");
    } catch (err) {
      logger.error("AUTH_HYDRATE_FAILED", err);
      setUser(null);
      updateAccessToken(null);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    hydrateUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, loading, setUser, login, logout }}
    >
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
