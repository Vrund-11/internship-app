"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useCity } from "@/context/CityContext";
import { states, cities as locationCities } from "@/features/booking/data/locations";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

type City = {
  id: string;
  name: string;
  state: string;
};

export default function SelectCityPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string>(states[0]?.name ?? "");
  const [error, setError] = useState("");
  const { setCity } = useCity();
  const router = useRouter();

  useEffect(() => {
    api
      .get("/cities")
      .then((res) => {
        setCities(res.data as City[]);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeCitiesByName = useMemo(() => {
    return new Map(cities.map((city) => [city.name.toLowerCase(), city]));
  }, [cities]);

  const handleSelectCity = (cityName: string) => {
    const match = activeCitiesByName.get(cityName.toLowerCase());

    if (!match) {
      setError("That city is not available yet. Please choose an active city.");
      return;
    }

    setError("");
    setCity(match);
    router.push("/home");
  };

  const visibleCities = selectedState ? locationCities[selectedState] ?? [] : [];

  const handleSkip = () => {
    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Setup
        </p>
        <h1 className="mt-3 font-bold text-3xl text-foreground">Select Your City</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick your state and city. If we are not available yet, you will see
          “Coming soon.”
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">States</h2>
              {loading ? (
                <span className="text-xs text-muted-foreground">Loading…</span>
              ) : null}
            </div>
            <div className="mt-3 grid gap-3">
              {states.map((state) => (
                <button
                  key={state.name}
                  onClick={() => setSelectedState(state.name)}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-left transition",
                    selectedState === state.name
                      ? "border-primary bg-secondary text-foreground"
                      : "border-border bg-background text-foreground",
                    !state.active && "opacity-70"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{state.name}</span>
                    {!state.active ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        Coming soon
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold">Cities</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {visibleCities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                  Select a state to see cities.
                </div>
              ) : null}

              {visibleCities.map((city) => (
                <button
                  key={city.name}
                  onClick={() => city.active && handleSelectCity(city.name)}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-left transition",
                    city.active
                      ? "border-border bg-background hover:border-primary/40 hover:bg-secondary"
                      : "border-border bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                  disabled={!city.active}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{city.name}</span>
                    {!city.active ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        Coming soon
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            You can browse services even if your city is not available yet.
          </p>
          <Button variant="outline" onClick={handleSkip} className="rounded-full px-6">
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
