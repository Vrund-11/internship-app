"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useCity } from "@/context/CityContext";
import { states, cities as locationCities } from "@/features/booking/data/locations";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { MapPin, ChevronDown, Check, AlertCircle, Sparkles, Navigation } from "lucide-react";

type City = {
  id: string;
  name: string;
  state: string;
};

export default function SelectCityPage() {
  const [apiCities, setApiCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string>("Gujarat");
  const [selectedCityName, setSelectedCityName] = useState<string>("");
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [error, setError] = useState("");
  
  const { setCity } = useCity();
  const router = useRouter();

  useEffect(() => {
    api
      .get("/cities")
      .then((res) => {
        setApiCities(res.data as City[]);
      })
      .catch((err) => {
        console.error("Failed to load active cities", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeCitiesByName = useMemo(() => {
    return new Map(apiCities.map((city) => [city.name.toLowerCase(), city]));
  }, [apiCities]);

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

  const handleStateSelect = (stateName: string) => {
    setSelectedState(stateName);
    setSelectedCityName(""); // Reset city when state changes
    setIsStateDropdownOpen(false);
    setError("");
  };

  const handleCitySelect = (cityName: string, active: boolean) => {
    if (!active) return;
    setSelectedCityName(cityName);
    setIsCityDropdownOpen(false);
    setError("");
  };

  const handleConfirm = () => {
    if (!selectedCityName) {
      setError("Please select a city first.");
      return;
    }
    handleSelectCity(selectedCityName);
  };

  const handleSkip = () => {
    router.push("/home");
  };

  const visibleCities = selectedState ? locationCities[selectedState] ?? [] : [];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground">
      {/* Premium Background Glow Elements */}
      <div className="absolute -top-40 -left-40 h-[600px] w-[600px] animate-glow-pulse rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] animate-glow-pulse rounded-full bg-secondary/20 blur-[120px]" />

      <div className="relative z-10 w-full max-w-lg animate-fade-in-up">
        {/* Sleek Floating Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-primary shadow-elevated">
          <MapPin className="h-8 w-8 text-primary-foreground" />
        </div>

        {/* Main Card */}
        <div className="glass shadow-elevated rounded-3xl border border-border/50 p-8 text-center backdrop-blur-2xl">
          <span className="font-label-md inline-flex items-center gap-1.5 rounded-full bg-secondary/80 px-3 py-1 text-secondary-foreground">
            <Sparkles className="h-3 w-3" /> Quick Setup
          </span>
          
          <h1 className="mt-4 font-headline-lg text-foreground">Select Your City</h1>
          <p className="font-body-md mt-2 text-muted-foreground">
            Choose your current state and city to view available veterinary and grooming services.
          </p>

          <div className="mt-8 space-y-5 text-left">
            {/* 1. State Dropdown Selector */}
            <div className="relative">
              <label className="font-label-md text-muted-foreground mb-2 block">State</label>
              
              <button
                type="button"
                onClick={() => {
                  setIsStateDropdownOpen(!isStateDropdownOpen);
                  setIsCityDropdownOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border bg-card px-4 py-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary",
                  isStateDropdownOpen ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                )}
              >
                <span className="font-medium text-foreground">{selectedState || "Select State"}</span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isStateDropdownOpen && "rotate-180")} />
              </button>

              {/* Backdrop to close dropdown on click outside */}
              {isStateDropdownOpen && (
                <div className="fixed inset-0 z-30" onClick={() => setIsStateDropdownOpen(false)} />
              )}

              {/* Dropdown Options list */}
              {isStateDropdownOpen && (
                <div className="absolute left-0 right-0 z-40 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-elevated animate-scale-in no-scrollbar">
                  {states.map((state) => {
                    const isSelected = selectedState === state.name;
                    return (
                      <button
                        key={state.name}
                        type="button"
                        onClick={() => handleStateSelect(state.name)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm transition-colors",
                          isSelected ? "bg-secondary/60 text-secondary-foreground" : "text-foreground hover:bg-muted"
                        )}
                      >
                        <span className="font-medium">{state.name}</span>
                        <div className="flex items-center gap-2">
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                          {!state.active && (
                            <span className="font-label-sm rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                              Coming soon
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. City Dropdown Selector */}
            <div className="relative">
              <label className="font-label-md text-muted-foreground mb-2 block">City</label>
              
              <button
                type="button"
                onClick={() => {
                  if (!selectedState) return;
                  setIsCityDropdownOpen(!isCityDropdownOpen);
                  setIsStateDropdownOpen(false);
                }}
                disabled={!selectedState}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border bg-card px-4 py-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed",
                  isCityDropdownOpen ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                )}
              >
                <span className="font-medium text-foreground">{selectedCityName || "Select City"}</span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isCityDropdownOpen && "rotate-180")} />
              </button>

              {/* Backdrop to close dropdown on click outside */}
              {isCityDropdownOpen && (
                <div className="fixed inset-0 z-30" onClick={() => setIsCityDropdownOpen(false)} />
              )}

              {/* Dropdown Options list */}
              {isCityDropdownOpen && (
                <div className="absolute left-0 right-0 z-40 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-elevated animate-scale-in no-scrollbar">
                  {visibleCities.map((city) => {
                    const isSelected = selectedCityName === city.name;
                    return (
                      <button
                        key={city.name}
                        type="button"
                        onClick={() => handleCitySelect(city.name, city.active)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm transition-colors",
                          !city.active && "opacity-50 cursor-not-allowed",
                          isSelected ? "bg-secondary/60 text-secondary-foreground" : "text-foreground hover:bg-muted"
                        )}
                      >
                        <span className="font-medium">{city.name}</span>
                        <div className="flex items-center gap-2">
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                          {!city.active && (
                            <span className="font-label-sm rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                              Coming soon
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-left text-sm text-destructive animate-scale-in">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <Button
              onClick={handleConfirm}
              disabled={!selectedCityName}
              className="w-full rounded-2xl py-6 font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99] bg-primary text-primary-foreground flex items-center justify-center gap-2 shadow-elevated"
            >
              <Navigation className="h-4 w-4" /> Confirm & Continue
            </Button>
            
            <button
              onClick={handleSkip}
              className="w-full rounded-2xl border border-border bg-transparent py-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
            >
              Skip for now
            </button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            We are continuously expanding. You can skip selection to browse services and products in preview mode.
          </p>
        </div>
      </div>
    </div>
  );
}

