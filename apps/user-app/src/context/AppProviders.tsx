"use client";

import { AuthProvider } from "./AuthContext";

export const AppProviders = ({
  children
}: {
  children: React.ReactNode;
}) => {
  return <AuthProvider>{children}</AuthProvider>;
};
