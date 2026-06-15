"use client";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { Check, Scissors, Stethoscope, Hospital, Scan, Droplets, Activity, Syringe, Pill, ShieldPlus, Bath, Hand, Ear, Smile, Sparkles } from "lucide-react";
import type { ServiceItem, Pet } from "@/shared/types";
import { calcTotal } from "@/shared/types";

const serviceIconMap: Record<string, React.ReactNode> = {
  bath: <Bath className="w-[18px] h-[18px] text-[#A7009D]" />,
  scissors: <Scissors className="w-[18px] h-[18px] text-[#A7009D]" />,
  hand: <Hand className="w-[18px] h-[18px] text-[#A7009D]" />,
  ear: <Ear className="w-[18px] h-[18px] text-[#A7009D]" />,
  smile: <Smile className="w-[18px] h-[18px] text-[#A7009D]" />,
  sparkles: <Sparkles className="w-[18px] h-[18px] text-[#A7009D]" />,
  stethoscope: <Stethoscope className="w-[18px] h-[18px] text-[#2E7BD4]" />,
  syringe: <Syringe className="w-[18px] h-[18px] text-[#2E7BD4]" />,
  pill: <Pill className="w-[18px] h-[18px] text-[#2E7BD4]" />,
  "shield-plus": <ShieldPlus className="w-[18px] h-[18px] text-[#2E7BD4]" />,
  hospital: <Hospital className="w-[18px] h-[18px] text-[#b45309]" />,
  scan: <Scan className="w-[18px] h-[18px] text-[#b45309]" />,
  droplets: <Droplets className="w-[18px] h-[18px] text-[#b45309]" />,
  activity: <Activity className="w-[18px] h-[18px] text-[#b45309]" />,
};

interface ServicePickerProps {
  services: ServiceItem[];
  selectedServices: ServiceItem[];
  selectedPets: Pet[];
  onSelect: (services: ServiceItem[]) => void;
  onNext: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  showContinueButton?: boolean;
  continueLabel?: string;
}

const ServicePicker = ({ services, selectedServices, selectedPets, onSelect, onNext, onBack, showBackButton = true, showContinueButton = true, continueLabel = "Continue" }: ServicePickerProps) => {
  const toggleService = (service: ServiceItem) => {
    const isSelected = selectedServices.some(s => s.id === service.id);
    if (isSelected) {
      onSelect(selectedServices.filter(s => s.id !== service.id));
    } else {
      onSelect([...selectedServices, service]);
    }
  };

  const total = calcTotal(selectedPets, selectedServices);

  return (
    <div className="px-4 py-5 animate-fade-in-up lg:px-0">
      <div className="text-[12px] text-[#5C3A58] font-bold uppercase tracking-[0.8px] mb-3">Choose Services</div>

      <div className="space-y-3 mb-5">
        {services.map((service) => {
          const isSelected = selectedServices.some(s => s.id === service.id);
          const hasDog = selectedPets.some(p => p.type === "dog");
          const hasCat = selectedPets.some(p => p.type === "cat");

          return (
            <button
              key={service.id}
              onClick={() => toggleService(service)}
              className="w-full flex items-start gap-3.5 p-4 rounded-[18px] transition-all text-left"
              style={{
                border: `${isSelected ? 2 : 1}px solid ${isSelected ? "#A7009D" : "#EDE4EB"}`,
                background: isSelected ? "rgba(39,174,120,0.08)" : "#FFFFFF",
              }}
            >
              <div 
                className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "#F3EEF1", border: "1px solid #EDE4EB" }}
              >
                {serviceIconMap[service.icon] || <Sparkles className="w-[18px] h-[18px] text-[#A7009D]" />}
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-bold text-[#1a0a18]">{service.name}</div>
                <div className="text-[12px] text-[#5C3A58] mt-0.5 leading-[1.3]">{service.description}</div>
                <div className="flex gap-2 mt-2">
                  {hasDog && (
                    <span className="text-[10px] font-bold bg-[#F5D6F5] text-[#A7009D] rounded-md px-1.5 py-0.5 uppercase tracking-[0.4px]">
                      🐕 ₹{service.dogPrice}
                    </span>
                  )}
                  {hasCat && (
                    <span className="text-[10px] font-bold bg-[#FEF3C7] text-[#b45309] rounded-md px-1.5 py-0.5 uppercase tracking-[0.4px]">
                      🐈 ₹{service.catPrice}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-[#8A6888] bg-[#F3EEF1] rounded-md px-1.5 py-0.5 uppercase tracking-[0.4px]">
                    ⏱ {service.duration}
                  </span>
                </div>
              </div>
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-2"
                style={{ border: `2px solid ${isSelected ? "#A7009D" : "#D4B8D0"}` }}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-[#A7009D]" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedServices.length > 0 && (
        <div className="bg-[#F5D6F5] rounded-[18px] p-4 mb-6 border border-[#A7009D]/20 flex justify-between items-center shadow-sm">
          <div>
            <div className="text-[11px] text-[#A7009D] font-bold uppercase tracking-[0.6px]">Total Est.</div>
            <div className="font-bold text-[22px] font-normal text-[#A7009D] leading-tight">₹{total}</div>
          </div>
          <div className="text-right">
            <div className="text-[12px] text-[#A7009D]">{selectedServices.length} service(s)</div>
            <div className="text-[12px] text-[#A7009D]">× {selectedPets.length} pet(s)</div>
          </div>
        </div>
      )}

      {(showBackButton || showContinueButton) && (
        <div className="flex gap-3">
          {showBackButton && onBack && (
            <Button variant="outline" onClick={onBack} className="flex-1 rounded-2xl h-12 border-[#EDE4EB]">
              Back
            </Button>
          )}
          {showContinueButton && (
            <Button 
              onClick={onNext} 
              disabled={selectedServices.length === 0} 
              className="flex-1 rounded-2xl h-[48px] bg-[#A7009D] hover:bg-[#6B0068] text-white text-[14px] font-bold shadow-elevated"
            >
              {continueLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ServicePicker;
