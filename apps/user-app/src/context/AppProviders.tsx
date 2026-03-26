"use client";

import { AuthProvider } from "./AuthContext";
import { CityProvider } from "./CityContext";

export const AppProviders = ({
  children
}: {
  children: React.ReactNode;
}) => {
  return (
    <AuthProvider>
      <CityProvider>{children}</CityProvider>
    </AuthProvider>
  );
};
