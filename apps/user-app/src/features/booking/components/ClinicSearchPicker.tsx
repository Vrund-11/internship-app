"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Star, Map } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/shared/lib/utils";

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface ClinicSearchPickerProps {
  selectedClinic: any;
  onSelect: (clinic: any) => void;
  onNext: () => void;
}

export default function ClinicSearchPicker({
  selectedClinic,
  onSelect,
  onNext,
}: ClinicSearchPickerProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClinics = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/partners/clinics`, {
          params: { search: debouncedQuery },
        });
        setClinics(res.data.clinics || []);
      } catch (err) {
        console.error("Failed to fetch clinics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClinics();
  }, [debouncedQuery]);

  return (
    <div className="py-6 animate-fade-in-up">
      <h2 className="font-serif text-[26px] text-[#081C13] mb-1.5 px-4">Find a Clinic</h2>
      <p className="text-[14px] text-[#3E6255] mb-5 px-4">
        Search for your preferred partner clinic 🏥
      </p>

      {/* Search Bar */}
      <div className="px-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-[#3E6255]" />
          </div>
          <input
            type="text"
            className="w-full bg-[#F5FAF7] border border-[#DDE8E3] rounded-[16px] py-3.5 pl-11 pr-4 text-[14px] text-[#081C13] focus:outline-none focus:border-[#27AE78] transition-colors"
            placeholder="Search by clinic name or area..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Results */}
      <div className="px-4 flex flex-col gap-3">
        {loading ? (
          <div className="py-8 text-center text-[#3E6255] text-sm flex flex-col items-center">
            <div className="w-6 h-6 border-2 border-[#27AE78] border-t-transparent rounded-full animate-spin mb-3"></div>
            Searching clinics...
          </div>
        ) : clinics.length === 0 ? (
          <div className="py-8 text-center text-[#3E6255] text-sm bg-[#F5FAF7] rounded-[20px] border border-[#DDE8E3]">
            <Map className="w-8 h-8 mx-auto text-[#B8CEC5] mb-2" />
            No clinics found matching "{query}"
          </div>
        ) : (
          clinics.map((clinic) => {
            const isSelected = selectedClinic?.id === clinic.id;
            return (
              <button
                key={clinic.id}
                onClick={() => {
                  onSelect(clinic);
                  // Auto scroll triggers from page.tsx passing down onNext
                  setTimeout(onNext, 300);
                }}
                className={cn(
                  "w-full flex items-start gap-4 p-4 rounded-[20px] transition-all text-left border relative overflow-hidden",
                  isSelected
                    ? "border-[#27AE78] bg-[#F0F5F2]"
                    : "border-[#DDE8E3] bg-white hover:border-[#B8CEC5]"
                )}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 w-8 h-8 bg-[#27AE78] rounded-bl-[20px] flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
                
                <div 
                  className="w-[46px] h-[46px] rounded-[14px] flex items-center justify-center shrink-0"
                  style={{ background: isSelected ? "#27AE78" : "#F5FAF7" }}
                >
                  <MapPin className={cn("w-6 h-6", isSelected ? "text-white" : "text-[#27AE78]")} />
                </div>
                
                <div className="flex-1 pr-4">
                  <h3 className="font-bold text-[#081C13] text-[15px] leading-tight mb-1">{clinic.name}</h3>
                  <p className="text-[13px] text-[#3E6255] leading-snug line-clamp-2">{clinic.address}</p>
                  
                  <div className="flex items-center gap-4 mt-2.5">
                    <span className="flex items-center gap-1 text-[12px] font-medium text-[#081C13]">
                      <Star className="w-3.5 h-3.5 text-[#F5922A] fill-[#F5922A]" />
                      {clinic.rating} <span className="text-[#3E6255] font-normal">({clinic.totalCompleted})</span>
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
