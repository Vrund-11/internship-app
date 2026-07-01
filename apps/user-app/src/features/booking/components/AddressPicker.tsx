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
import { api } from "@/lib/api";

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
  Home: <Home className="w-5 h-5 text-[#FF10F0]" />,
  Office: <Briefcase className="w-5 h-5 text-[#FF10F0]" />,
  Other: <MapPin className="w-5 h-5 text-[#FF10F0]" />,
};

const labelColors: Record<string, string> = {
  Home: "#FFF0FC",
  Office: "#FFF0FC",
  Other: "#FFF0FC",
};

const serviceableCities = new Set(["Ahmedabad"]);

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

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const stateCities = formState ? cities[formState] || [] : [];

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const res = await api.get("/booking/addresses/autocomplete", {
        params: { query: val },
      });
      if (res.data && res.data.suggestions) {
        setSuggestions(res.data.suggestions);
      }
    } catch (err) {
      console.error("Autocomplete request failed", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const selectSuggestion = (s: any) => {
    setSearchQuery(s.label);
    setFormCity(s.city);
    setFormState(s.state);
    setForm((prev) => ({
      ...prev,
      area: s.area,
      pincode: s.pincode,
    }));
    setSelectedCoords({
      latitude: s.latitude,
      longitude: s.longitude,
    });
    setSuggestions([]);
  };

  const handleAdd = () => {
    setError(null);
    if (!formState) {
      setError("Please select an address or state");
      return;
    }
    if (!formCity) {
      setError("Please select a valid city");
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
      latitude: selectedCoords?.latitude,
      longitude: selectedCoords?.longitude,
    };
    onAddAddress(address);
    onSelect(address);
    setForm({ label: "Home", house: "", area: "", pincode: "" });
    setFormState("");
    setFormCity("");
    setSearchQuery("");
    setSelectedCoords(null);
    setShowForm(false);
  };

  const isCityActive = (cityName: string) => {
    if (!cityName) return false;
    const nameLower = cityName.toLowerCase();
    return nameLower === "ahmedabad";
  };

  const isServiceableAddress = (address: Address | null) => {
    if (!address) return false;
    return serviceableCities.has(address.city);
  };

  return (
    <div className="px-5 py-5 animate-fade-in-up lg:px-0">
      <div className="text-[12px] text-[#121212] font-extrabold uppercase tracking-[0.8px] mb-3 px-1">SERVICE ADDRESS</div>

      <div className="space-y-3.5 mb-4">
        {addresses.map((addr) => {
          const isSelected = selectedAddress?.id === addr.id;
          const isServiceable = isServiceableAddress(addr);
          return (
            <button
              key={addr.id}
              onClick={() => isServiceable && onSelect(addr)}
              className={cn(
                "w-full flex items-start gap-3.5 p-4 rounded-[18px] transition-all bg-white text-left shadow-card border border-[#EDE4EB]/50",
                !isServiceable && "opacity-50 cursor-not-allowed"
              )}
              style={{
                border: `${isSelected ? 2 : 1}px solid ${isSelected ? "#FF10F0" : "#EDE4EB"}`,
                background: isSelected ? "rgba(255, 16, 240, 0.04)" : "#FFFFFF",
              }}
            >
              <div 
                className="w-[44px] h-[44px] rounded-[14px] flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: labelColors[addr.label] || "#F8F8F8" }}
              >
                {labelIcons[addr.label] || <MapPin className="w-5 h-5 text-[#FF10F0]" />}
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-extrabold text-[#121212]">{addr.label}</div>
                <div className="text-[12px] text-[#4A4A4A] mt-0.5 leading-[1.3] font-semibold">
                  {addr.house}, {addr.area}
                </div>
                <div className="text-[12px] text-[#4A4A4A] leading-[1.3] font-semibold">
                  {addr.city}, {addr.state} - {addr.pincode}
                </div>
                {!isServiceable && (
                  <div className="text-[10px] text-[#E05C35] font-bold uppercase tracking-[0.4px] mt-1.5">
                    Not available yet
                  </div>
                )}
              </div>
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-2"
                style={{ border: `2px solid ${isSelected ? "#FF10F0" : "#EDE4EB"}` }}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF10F0]" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-[18px] border border-dashed border-[#FF10F0]/30 text-[#FF10F0] hover:bg-[#FFF0FC]/50 transition-colors bg-transparent cursor-pointer active:scale-[0.99]"
        >
          <Plus className="w-4 h-4 text-[#FF10F0]" />
          <span className="text-[13px] font-bold">Add New Address</span>
        </button>
      ) : (
        <div className="bg-white rounded-[18px] border border-[#EDE4EB] p-4 space-y-4 animate-scale-in shadow-card">
          <div className="flex gap-2">
            {["Home", "Office", "Other"].map((label) => (
              <button
                key={label}
                onClick={() => setForm((prev) => ({ ...prev, label }))}
                className="flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-colors border"
                style={{
                  background: form.label === label ? "#FF10F0" : "#FFFFFF",
                  color: form.label === label ? "#FFFFFF" : "#4A4A4A",
                  borderColor: form.label === label ? "#FF10F0" : "#EDE4EB",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative">
            <label className="text-[12px] font-extrabold text-[#121212] mb-2 block uppercase tracking-wide">Search Address (Mapbox suggestions)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search area, landmark or neighborhood..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-xl border border-[#EDE4EB] px-3.5 h-[44px] text-[14px] outline-none focus:border-[#FF10F0] font-semibold"
              />
              {loadingSuggestions && (
                <div className="absolute right-3.5 top-3 animate-spin w-4 h-4 border-2 border-[#FF10F0] border-t-transparent rounded-full" />
              )}
            </div>
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 z-50 bg-white border border-[#EDE4EB] rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-[#EDE4EB]/50 last:border-b-0 text-[13px] text-slate-700 font-semibold"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {formCity && !isCityActive(formCity) && (
            <div className="flex items-start gap-2 bg-[#FFF4F0] rounded-xl p-3 border border-[#E05C35]/20">
              <AlertCircle className="w-4 h-4 text-[#E05C35] mt-0.5 shrink-0" />
              <p className="text-[12px] text-[#E05C35] leading-snug font-bold">
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
                className="rounded-xl h-[44px] text-[14px] focus-visible:ring-[#FF10F0]"
              />
              <Input
                placeholder="Area / Landmark"
                value={form.area}
                onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))}
                className="rounded-xl h-[44px] text-[14px] focus-visible:ring-[#FF10F0]"
              />
              <Input
                placeholder="Pincode"
                value={form.pincode}
                onChange={(event) => setForm((prev) => ({ ...prev, pincode: event.target.value }))}
                className="rounded-xl h-[44px] text-[14px] focus-visible:ring-[#FF10F0]"
              />
              {error && <div className="text-[12px] text-red-500 font-bold px-1">⚠️ {error}</div>}
              <div className="flex gap-2.5 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl h-[44px] text-[13px] border-[#EDE4EB] text-[#4A4A4A] font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  className="flex-1 rounded-xl h-[44px] text-[13px] bg-[#FF10F0] text-white hover:bg-[#FF10F0]/90 font-bold border-none"
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
            <Button variant="outline" onClick={onBack} className="flex-1 rounded-full h-[52px] border-[#EDE4EB] text-[14px] font-bold">
              Back
            </Button>
          )}
          {showContinueButton && (
            <Button
              onClick={onNext}
              disabled={!selectedAddress}
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

export default AddressPicker;
