"use client";

import { useAuth } from "@/context/AuthContext";
import { useCity } from "@/context/CityContext";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  const hydrationStarted = useRef(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || cityLoading || hydrationStarted.current) {
      return;
    }

    hydrationStarted.current = true;
    setCityHydrating(true);

    const validateAndHydrateCity = async () => {
      try {
        // 1. Fetch cities (load from localStorage cache if available and < 1 hour old)
        let cities: { id: string; name: string; state: string }[] = [];
        const cachedCities = localStorage.getItem("active_cities");
        const cacheTime = localStorage.getItem("active_cities_time");
        const now = Date.now();

        if (cachedCities && cacheTime && now - parseInt(cacheTime) < 3600000) {
          cities = JSON.parse(cachedCities);
        } else {
          const cityRes = await api.get("/cities");
          cities = (cityRes.data ?? []) as { id: string; name: string; state: string }[];
          localStorage.setItem("active_cities", JSON.stringify(cities));
          localStorage.setItem("active_cities_time", now.toString());
        }

        // 2. Hydrate city (only query addresses if city is not set)
        if (city) {
          // Check if current city.id exists in the active cities list
          const exists = cities.some((c) => c.id === city.id);
          if (!exists) {
            // ID is stale (e.g. database was re-seeded/reset). Try matching by name.
            const match = cities.find(
              (c) => c.name.toLowerCase() === city.name.toLowerCase()
            );
            if (match) {
              setCity(match);
            } else {
              // No match found by name, clear the stale city
              setCity(null);
            }
          }
        } else {
          // No city selected yet, try to hydrate from user addresses
          const addressRes = await api.get("/booking/addresses");
          const addresses = (addressRes.data?.addresses ?? []) as { city?: string }[];
          const cityName = addresses[0]?.city?.trim();

          if (cityName) {
            const match = cities.find(
              (entry) => entry.name.toLowerCase() === cityName.toLowerCase()
            );

            if (match) {
              setCity(match);
            }
          }
        }
      } catch {
        // Ignore errors and fall back to manual selection
      } finally {
        setCityHydrating(false);
        setCityHydrationDone(true);
      }
    };

    validateAndHydrateCity();
  }, [user, city, cityLoading, setCity]);

  useEffect(() => {
    if (!loading && user && !cityLoading && !city && cityHydrationDone) {
      router.push("/select-city");
    }
  }, [user, loading, city, cityLoading, cityHydrationDone, router]);

  if (loading || cityLoading || cityHydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-2 border-[#EDE4EB] border-t-[#A7009D] animate-spin" />
      </div>
    );
  }

  if (!user || !city) {
    return null;
  }

  return <>{children}</>;
}
