"use client";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { Check, MapPin, Star, Clock, Navigation } from "lucide-react";
import type { Clinic } from "@/shared/types";

interface ClinicSelectorProps {
  clinics: Clinic[];
  selectedClinic: Clinic | null;
  onSelect: (clinic: Clinic) => void;
  onNext: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  showContinueButton?: boolean;
  continueLabel?: string;
}

const ClinicSelector = ({
  clinics,
  selectedClinic,
  onSelect,
  onNext,
  onBack,
  showBackButton = true,
  showContinueButton = true,
  continueLabel = "Continue",
}: ClinicSelectorProps) => {
  return (
    <div className="px-4 py-6 animate-fade-in-up">
      <h2 className="text-xl font-bold text-foreground mb-1">Your Nearby Clinics</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Pick the clinic that works best for you 🏥
      </p>

      <div className="space-y-3 mb-6">
        {clinics.map((clinic) => {
          const isSelected = selectedClinic?.id === clinic.id;
          return (
            <button
              key={clinic.id}
              onClick={() => onSelect(clinic)}
              className={cn(
                "w-full flex items-start gap-3 p-4 rounded-3xl border-2 transition-all text-left active:scale-[0.98]",
                isSelected ? "border-primary bg-secondary shadow-md" : "border-border bg-card"
              )}
            >
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-sm">{clinic.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{clinic.address}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3 h-3 text-primary fill-primary" />
                    {clinic.rating}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {clinic.timing}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Navigation className="w-3 h-3" />
                    {clinic.distance}
                  </span>
                </div>
              </div>
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 transition-all",
                  isSelected ? "bg-primary" : "bg-muted"
                )}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
              </div>
            </button>
          );
        })}
      </div>

      {(showBackButton || showContinueButton) && (
        <div className="flex gap-3">
          {showBackButton && onBack && (
            <Button variant="outline" onClick={onBack} className="flex-1 rounded-full h-12">
              Back
            </Button>
          )}
          {showContinueButton && (
            <Button
              onClick={onNext}
              disabled={!selectedClinic}
              className="flex-1 rounded-full h-12 font-semibold shadow-lg shadow-primary/25"
            >
              {continueLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ClinicSelector;
