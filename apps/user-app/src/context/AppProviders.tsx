"use client";

import { AuthProvider } from "./AuthContext";
import { BookingProvider } from "./BookingContext";
import { CityProvider } from "./CityContext";

export const AppProviders = ({
  children
}: {
  children: React.ReactNode;
}) => {
  return (
    <AuthProvider>
      <CityProvider>
        <BookingProvider>{children}</BookingProvider>
      </CityProvider>
    </AuthProvider>
  );
};
