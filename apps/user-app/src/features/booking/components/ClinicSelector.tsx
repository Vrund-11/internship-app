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
    <div className="px-5 py-6 animate-fade-in-up">
      <h2 className="text-xl font-extrabold text-[#121212] mb-1">Your Nearby Clinics</h2>
      <p className="text-sm text-[#4A4A4A] font-semibold mb-6">
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
                "w-full flex items-start gap-3 p-4 rounded-3xl border transition-all text-left active:scale-[0.98] shadow-card",
                isSelected ? "border-[#FF10F0] bg-[#FFF0FC]" : "border-[#EDE4EB] bg-white"
              )}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FFF0FC] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-[#FF10F0]" />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-[#121212] text-sm">{clinic.name}</h3>
                <p className="text-xs text-[#4A4A4A] mt-0.5 font-semibold">{clinic.address}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs text-[#4A4A4A] font-semibold">
                    <Star className="w-3 h-3 text-[#FF10F0] fill-[#FF10F0]" />
                    {clinic.rating}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[#4A4A4A] font-semibold">
                    <Clock className="w-3 h-3 text-[#FF10F0]" />
                    {clinic.timing}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[#FF10F0] font-extrabold">
                    <Navigation className="w-3 h-3 text-[#FF10F0]" />
                    {clinic.distance}
                  </span>
                </div>
              </div>
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 transition-all",
                  isSelected ? "bg-[#FF10F0]" : "bg-[#F8F8F8] border border-border"
                )}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {(showBackButton || showContinueButton) && (
        <div className="flex gap-3">
          {showBackButton && onBack && (
            <Button variant="outline" onClick={onBack} className="flex-1 rounded-full h-[52px] border-[#EDE4EB] text-[14px] font-bold">
              Back
            </Button>
          )}
          {showContinueButton && (
            <Button
              onClick={onNext}
              disabled={!selectedClinic}
              className="flex-1 rounded-full h-[52px] bg-[#FF10F0] hover:bg-[#FF10F0]/90 text-white text-[14px] font-bold shadow-elevated border-none active:scale-[0.98] transition-transform"
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
