"use client";

import axios from "axios";
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, setAccessToken as setApiToken } from "@/lib/api";
import { logger } from "@/lib/logger";

type User = {
  id: string;
  email: string;
  name?: string | null;
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, pass: string) => Promise<User>;
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

  const login = async (email: string, pass: string) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("dev_logged_out");
      }
      const res = await api.post("/auth/login-signup", {
        email,
        password: pass,
      });

      const { accessToken, user } = res.data;

      updateAccessToken(accessToken);
      setUser(user);
      return user as User;
    } catch (err) {
      console.error("Login failed");
      throw err;
    }
  };


  const logout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("dev_logged_out", "true");
      }
      await api.post("/auth/logout");
    } catch {}

    setUser(null);
    updateAccessToken(null);
  };

  const hydrateUser = async () => {
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
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logger.info("AUTH_HYDRATE_NO_SESSION");
      } else {
        logger.error("AUTH_HYDRATE_FAILED", err);
      }

      setUser(null);
      updateAccessToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("dev_logged_out");
    }
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
