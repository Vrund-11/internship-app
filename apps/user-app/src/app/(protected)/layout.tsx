"use client";

import { useAuth } from "@/context/AuthContext";
import { useCity } from "@/context/CityContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { city, loading: cityLoading } = useCity();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && user && !cityLoading && !city) {
      router.push("/select-city");
    }
  }, [user, loading, city, cityLoading, router]);

  if (loading || cityLoading) {
    return <div>Loading...</div>;
  }

  if (!user || !city) {
    return null;
  }

  return <>{children}</>;
}
