"use client";

import { useAuth } from "@/context/AuthContext";
import { useCity } from "@/context/CityContext";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { city, loading: cityLoading, setCity } = useCity();
  const router = useRouter();
  const [cityHydrating, setCityHydrating] = useState(false);
  const [cityHydrationDone, setCityHydrationDone] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || cityLoading || cityHydrating || cityHydrationDone) {
      return;
    }

    let isActive = true;
    setCityHydrating(true);

    const validateAndHydrateCity = async () => {
      try {
        const [addressRes, cityRes] = await Promise.all([
          api.get("/booking/addresses"),
          api.get("/cities"),
        ]);

        const cities = (cityRes.data ?? []) as { id: string; name: string; state: string }[];

        if (city) {
          // Check if current city.id exists in the active cities list
          const exists = cities.some((c) => c.id === city.id);
          if (!exists) {
            // ID is stale (e.g. database was re-seeded/reset). Try matching by name.
            const match = cities.find(
              (c) => c.name.toLowerCase() === city.name.toLowerCase()
            );
            if (match && isActive) {
              setCity(match);
            } else if (isActive) {
              // No match found by name, clear the stale city
              setCity(null);
            }
          }
        } else {
          // No city selected yet, try to hydrate from user addresses
          const addresses = (addressRes.data?.addresses ?? []) as { city?: string }[];
          const cityName = addresses[0]?.city?.trim();

          if (cityName) {
            const match = cities.find(
              (entry) => entry.name.toLowerCase() === cityName.toLowerCase()
            );

            if (match && isActive) {
              setCity(match);
            }
          }
        }
      } catch {
        // Ignore errors and fall back to manual selection
      } finally {
        if (isActive) {
          setCityHydrating(false);
          setCityHydrationDone(true);
        }
      }
    };

    validateAndHydrateCity();

    return () => {
      isActive = false;
    };
  }, [user, city, cityLoading, cityHydrating, cityHydrationDone, setCity]);

  useEffect(() => {
    if (!loading && user && !cityLoading && !city && cityHydrationDone) {
      router.push("/select-city");
    }
  }, [user, loading, city, cityLoading, cityHydrationDone, router]);

  if (loading || cityLoading || cityHydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-2 border-[#DDE8E3] border-t-[#0B3B2A] animate-spin" />
      </div>
    );
  }

  if (!user || !city) {
    return null;
  }

  return <>{children}</>;
}
