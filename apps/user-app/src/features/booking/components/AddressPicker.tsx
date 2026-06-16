"use client";

import { validateHouse, validateArea, validatePincode } from "@canovet/shared";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import { Check, Plus, MapPin, Home, Briefcase, AlertCircle } from "lucide-react";
import { states, cities } from "@/features/booking/data/locations";
import type { Address } from "@/shared/types";
import { generateId } from "@/shared/types";

interface AddressPickerProps {
  addresses: Address[];
  selectedAddress: Address | null;
  onSelect: (address: Address) => void;
  onAddAddress: (address: Address) => void;
  onNext: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  showContinueButton?: boolean;
  continueLabel?: string;
}

const labelIcons: Record<string, React.ReactNode> = {
  Home: <Home className="w-5 h-5 text-[#2E7BD4]" />,
  Office: <Briefcase className="w-5 h-5 text-[#b45309]" />,
  Other: <MapPin className="w-5 h-5 text-[#A7009D]" />,
};

const labelColors: Record<string, string> = {
  Home: "#E8F3FF",
  Office: "#FEF3C7",
  Other: "#F5D6F5",
};

const serviceableCities = new Set(["Ahmedabad", "Mumbai"]);

const AddressPicker = ({
  addresses,
  selectedAddress,
  onSelect,
  onAddAddress,
  onNext,
  onBack,
  showBackButton = true,
  showContinueButton = true,
  continueLabel = "Continue",
}: AddressPickerProps) => {
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState("");
  const [formCity, setFormCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ label: "Home", house: "", area: "", pincode: "" });

  const stateCities = formState ? cities[formState] || [] : [];

  const handleAdd = () => {
    setError(null);
    if (!formState) {
      setError("Please select a state");
      return;
    }
    if (!formCity) {
      setError("Please select a city");
      return;
    }
    
    const houseError = validateHouse(form.house);
    if (houseError) {
      setError(houseError);
      return;
    }

    const areaError = validateArea(form.area);
    if (areaError) {
      setError(areaError);
      return;
    }

    const pincodeError = validatePincode(form.pincode);
    if (pincodeError) {
      setError(pincodeError);
      return;
    }

    const address: Address = {
      id: generateId(),
      label: form.label,
      house: form.house,
      area: form.area,
      city: formCity,
      state: formState,
      pincode: form.pincode,
    };
    onAddAddress(address);
    onSelect(address);
    setForm({ label: "Home", house: "", area: "", pincode: "" });
    setFormState("");
    setFormCity("");
    setShowForm(false);
  };

  const isCityActive = (cityName: string) => {
    const cityList = cities[formState] || [];
    const city = cityList.find((entry) => entry.name === cityName);
    return city?.active ?? false;
  };

  const isServiceableAddress = (address: Address | null) => {
    if (!address) return false;
    return serviceableCities.has(address.city);
  };

  return (
    <div className="px-4 py-5 animate-fade-in-up lg:px-0">
      <div className="text-[12px] text-[#5C3A58] font-bold uppercase tracking-[0.8px] mb-3">Delivery Address</div>

      <div className="space-y-3.5 mb-4">
        {addresses.map((addr) => {
          const isSelected = selectedAddress?.id === addr.id;
          const isServiceable = isServiceableAddress(addr);
          return (
            <button
              key={addr.id}
              onClick={() => isServiceable && onSelect(addr)}
              className={cn(
                "w-full flex items-start gap-3.5 p-4 rounded-[18px] transition-all bg-white text-left",
                !isServiceable && "opacity-50 cursor-not-allowed"
              )}
              style={{
                border: `${isSelected ? 2 : 1}px solid ${isSelected ? "#A7009D" : "#EDE4EB"}`,
                background: isSelected ? "rgba(39,174,120,0.08)" : "#FFFFFF",
              }}
            >
              <div 
                className="w-[44px] h-[44px] rounded-[14px] flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: labelColors[addr.label] || "#F3EEF1" }}
              >
                {labelIcons[addr.label] || <MapPin className="w-5 h-5 text-[#8A6888]" />}
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-bold text-[#1a0a18]">{addr.label}</div>
                <div className="text-[12px] text-[#5C3A58] mt-0.5 leading-[1.3]">
                  {addr.house}, {addr.area}
                </div>
                <div className="text-[12px] text-[#5C3A58] leading-[1.3]">
                  {addr.city}, {addr.state} - {addr.pincode}
                </div>
                {!isServiceable && (
                  <div className="text-[10px] text-[#E05C35] font-semibold uppercase tracking-[0.4px] mt-1.5">
                    Not available yet
                  </div>
                )}
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

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-[18px] border border-dashed border-[#D4B8D0] text-[#A7009D] hover:bg-[#F5D6F5]/50 transition-colors bg-transparent"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[13px] font-bold">Add New Address</span>
        </button>
      ) : (
        <div className="bg-white rounded-[18px] border border-[#EDE4EB] p-4 space-y-4 animate-scale-in">
          <div className="flex gap-2">
            {["Home", "Office", "Other"].map((label) => (
              <button
                key={label}
                onClick={() => setForm((prev) => ({ ...prev, label }))}
                className="flex-1 py-2 rounded-xl text-[12px] font-bold transition-colors border"
                style={{
                  background: form.label === label ? "#A7009D" : "#FFFFFF",
                  color: form.label === label ? "#FFFFFF" : "#5C3A58",
                  borderColor: form.label === label ? "#A7009D" : "#EDE4EB",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div>
            <label className="text-[12px] font-bold text-[#1a0a18] mb-2 block">State</label>
            <div className="grid grid-cols-2 gap-2">
              {states.map((state) => (
                <button
                  key={state.name}
                  onClick={() => {
                    if (state.active) {
                      setFormState(state.name);
                      setFormCity("");
                    }
                  }}
                  className="p-3 rounded-xl border text-[13px] font-bold transition-colors text-left relative overflow-hidden"
                  style={{
                    opacity: state.active ? 1 : 0.5,
                    background: formState === state.name ? "rgba(39,174,120,0.08)" : "#FFFFFF",
                    borderColor: formState === state.name ? "#A7009D" : "#EDE4EB",
                    color: formState === state.name ? "#1a0a18" : "#5C3A58",
                  }}
                >
                  {state.name}
                  {!state.active && (
                    <span className="absolute top-1 right-1.5 text-[9px] font-bold text-[#b45309] uppercase">Soon</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {formState && (
            <div className="animate-fade-in-up">
              <label className="text-[12px] font-bold text-[#1a0a18] mb-2 block">City</label>
              <div className="grid grid-cols-2 gap-2">
                {stateCities.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => city.active && setFormCity(city.name)}
                    className="p-3 rounded-xl border text-[13px] font-bold transition-colors text-left relative overflow-hidden"
                    style={{
                      opacity: city.active ? 1 : 0.5,
                      background: formCity === city.name ? "rgba(39,174,120,0.08)" : "#FFFFFF",
                      borderColor: formCity === city.name ? "#A7009D" : "#EDE4EB",
                      color: formCity === city.name ? "#1a0a18" : "#5C3A58",
                    }}
                  >
                    {city.name}
                    {!city.active && (
                      <span className="absolute top-1 right-1.5 text-[9px] font-bold text-[#b45309] uppercase">Soon</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {formCity && !isCityActive(formCity) && (
            <div className="flex items-start gap-2 bg-[#FFF4F0] rounded-xl p-3 border border-[#E05C35]/20">
              <AlertCircle className="w-4 h-4 text-[#E05C35] mt-0.5 shrink-0" />
              <p className="text-[12px] text-[#E05C35] leading-snug font-medium">
                We are not available in {formCity} yet. Stay tuned!
              </p>
            </div>
          )}

          {formCity && isCityActive(formCity) && (
            <div className="space-y-3 animate-fade-in-up pt-1">
              <Input
                placeholder="House / Flat / Floor"
                value={form.house}
                onChange={(event) => setForm((prev) => ({ ...prev, house: event.target.value }))}
                className="rounded-xl h-[44px] text-[14px]"
              />
              <Input
                placeholder="Area / Landmark"
                value={form.area}
                onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))}
                className="rounded-xl h-[44px] text-[14px]"
              />
              <Input
                placeholder="Pincode"
                value={form.pincode}
                onChange={(event) => setForm((prev) => ({ ...prev, pincode: event.target.value }))}
                className="rounded-xl h-[44px] text-[14px]"
              />
              {error && <div className="text-[12px] text-red-500 font-semibold px-1">⚠️ {error}</div>}
              <div className="flex gap-2.5 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl h-[44px] text-[13px] border-[#EDE4EB] text-[#5C3A58]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  className="flex-1 rounded-xl h-[44px] text-[13px] bg-[#A7009D] text-white"
                  disabled={!form.house || !form.area || !form.pincode || !formCity}
                >
                  Save Address
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {(showBackButton || showContinueButton) && (
        <div className="flex gap-3 mt-6">
          {showBackButton && onBack && (
            <Button variant="outline" onClick={onBack} className="flex-1 rounded-2xl h-12 border-[#EDE4EB]">
              Back
            </Button>
          )}
          {showContinueButton && (
            <Button
              onClick={onNext}
              disabled={!selectedAddress}
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

export default AddressPicker;
