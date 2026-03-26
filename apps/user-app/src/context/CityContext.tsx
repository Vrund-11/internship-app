"use client";

import { createContext, useContext, useEffect, useState } from "react";

type City = {
  id: string;
  name: string;
  state?: string;
};

type CityContextType = {
  city: City | null;
  loading: boolean;
  setCity: (city: City) => void;
};

const CityContext = createContext<CityContextType | null>(null);

export const CityProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [city, setCityState] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const stored = localStorage.getItem("city");

      if (stored) {
        setCityState(JSON.parse(stored) as City);
      }

      setLoading(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const setCity = (nextCity: City) => {
    localStorage.setItem("city", JSON.stringify(nextCity));
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
    throw new Error("useCity must be used inside provider");
  }

  return ctx;
};
