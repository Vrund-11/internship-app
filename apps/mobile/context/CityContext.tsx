import { createContext, useContext, useEffect, useState } from "react";
import type { City } from "@canovet/core";
import { asyncKVStorage } from "../lib/kv-storage";
import { api } from "../lib/api";

type CityContextType = {
  city: City | null;
  loading: boolean;
  setCity: (city: City | null) => void;
};

const CityContext = createContext<CityContextType | null>(null);

export const CityProvider = ({ children }: { children: React.ReactNode }) => {
  const [city, setCityState] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const stored = await asyncKVStorage.getItem("city");
        if (stored) {
          const parsed = JSON.parse(stored) as City;
          setCityState(parsed);

          // Verify and self-heal stale city ID from DB resets
          api.get("/cities")
            .then((res) => {
              const cities = (res.data ?? []) as { id: string; name: string }[];
              const exists = cities.some((c) => c.id === parsed.id);
              if (!exists) {
                const match = cities.find((c) => c.name.toLowerCase() === parsed.name.toLowerCase());
                if (match) {
                  // Save the new matching city ID
                  asyncKVStorage.setItem("city", JSON.stringify(match)).catch(() => {});
                  setCityState(match);
                } else {
                  asyncKVStorage.removeItem("city").catch(() => {});
                  setCityState(null);
                }
              }
            })
            .catch((err) => {
              console.error("Failed to validate city on startup", err);
            });
        }
      } catch {
        // Ignore parse errors
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, []);

  const setCity = async (nextCity: City | null) => {
    if (nextCity === null) {
      await asyncKVStorage.removeItem("city");
    } else {
      await asyncKVStorage.setItem("city", JSON.stringify(nextCity));
    }
    setCityState(nextCity);
  };

  return (
    <CityContext.Provider value={{ city, loading, setCity }}>
      {children}
    </CityContext.Provider>
  );
};

export const useCity = () => {
  const ctx = useContext(CityContext);
  if (!ctx) {
    throw new Error("useCity must be used inside CityProvider");
  }
  return ctx;
};
