"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ChevronRight, Plus, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

interface ApiPet {
  id: string;
  name: string;
  type?: "dog" | "cat";
  breed?: string;
  age?: number;
  weight?: number;
}

const PET_EMOJIS = { dog: "🐕", cat: "🐈" };

const HeroSection = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState<ApiPet[]>([]);
  const [petsLoaded, setPetsLoaded] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const [addingPet, setAddingPet] = useState(false);
  const [form, setForm] = useState({ name: "", type: "dog" as "dog" | "cat", breed: "", age: "2", weight: "8" });
  const [activePetIndex, setActivePetIndex] = useState(0);

  const loadPets = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get("/booking/pets");
      const list = (res.data.pets ?? []) as ApiPet[];
      setPets(list);
    } catch {
      setPets([]);
    } finally {
      setPetsLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  const handleAddPet = async () => {
    if (!form.name.trim()) return;
    setAddingPet(true);
    try {
      const res = await api.post("/booking/pets", {
        name: form.name.trim(),
        type: form.type,
        breed: form.breed.trim() || "Mixed",
        age: Number(form.age) || 2,
        weight: Number(form.weight) || 8,
      });
      const created: ApiPet = {
        id: res.data.id,
        name: res.data.name,
        type: res.data.type || form.type,
        breed: res.data.breed || form.breed || "Mixed",
        age: res.data.age ?? Number(form.age),
        weight: res.data.weight ?? Number(form.weight),
      };
      setPets((prev) => [...prev, created]);
      setActivePetIndex(pets.length); // switch to new pet
      setShowAddPet(false);
      setForm({ name: "", type: "dog", breed: "", age: "2", weight: "8" });
    } catch {
      // fallback local add
      const localPet: ApiPet = {
        id: `local-${Date.now()}`,
        name: form.name.trim(),
        type: form.type,
        breed: form.breed.trim() || "Mixed",
        age: Number(form.age) || 2,
        weight: Number(form.weight) || 8,
      };
      setPets((prev) => [...prev, localPet]);
      setActivePetIndex(pets.length);
      setShowAddPet(false);
      setForm({ name: "", type: "dog", breed: "", age: "2", weight: "8" });
    } finally {
      setAddingPet(false);
    }
  };

  const activePet = pets[activePetIndex] ?? null;

  return (
    <section className="px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 lg:gap-6">
      <div className="flex flex-col gap-3 h-full">
      {/* Pet card */}
      {!petsLoaded ? (
        // Skeleton while loading
        <div className="bg-white rounded-[20px] border border-[#DDE8E3] p-4 flex items-center gap-3.5 animate-pulse">
          <div className="w-14 h-14 rounded-[18px] bg-[#E3F6EE] shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#E3F6EE] rounded w-24" />
            <div className="h-3 bg-[#F0F5F2] rounded w-40" />
          </div>
        </div>
      ) : pets.length === 0 ? (
        // No pets – prompt to add
        <button
          onClick={() => setShowAddPet(true)}
          className="bg-white rounded-[20px] border border-dashed border-[#27AE78] p-4 flex items-center gap-3.5 w-full text-left transition-colors hover:bg-[#F5FAF7]"
        >
          <div className="w-14 h-14 rounded-[18px] bg-[#E3F6EE] flex items-center justify-center shrink-0">
            <Plus className="w-6 h-6 text-[#27AE78]" />
          </div>
          <div>
            <div className="font-semibold text-[15px] text-[#081C13]">Add Your Pet</div>
            <div className="text-[12px] text-[#3E6255] mt-0.5">Tap to register your fur baby</div>
          </div>
        </button>
      ) : (
        // Show active pet
        <div className="bg-white rounded-[20px] border border-[#DDE8E3] p-4 flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-[18px] bg-[#E3F6EE] flex items-center justify-center text-[28px] shrink-0">
            {PET_EMOJIS[activePet?.type ?? "dog"]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-serif text-[17px] font-normal text-[#081C13] truncate">{activePet?.name ?? "Your Pet"}</div>
            <div className="text-[12px] text-[#3E6255] mt-0.5 truncate">
              {[activePet?.breed, activePet?.age ? `${activePet.age} yrs` : null, activePet?.weight ? `${activePet.weight} kg` : null]
                .filter(Boolean).join(" · ")}
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              <span className="bg-[#E3F6EE] text-[#1D8F60] text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-[0.6px] uppercase flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> Vaccinated
              </span>
              {pets.length > 1 && (
                <span className="bg-[#FEF1E4] text-[#C8731A] text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-[0.6px] uppercase">
                  +{pets.length - 1} more
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowAddPet(true)}
            className="w-8 h-8 rounded-[10px] bg-[#F0F5F2] border border-[#DDE8E3] flex items-center justify-center shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-[#6E8F83]" />
          </button>
        </div>
      )}

      {/* Pet switcher dots */}
      {pets.length > 1 && (
        <div className="flex gap-1.5 justify-center">
          {pets.map((_, i) => (
            <button
              key={i}
              onClick={() => setActivePetIndex(i)}
              className="rounded-full transition-all"
              style={{
                width: i === activePetIndex ? 20 : 8,
                height: 8,
                background: i === activePetIndex ? "#27AE78" : "#DDE8E3",
              }}
            />
          ))}
        </div>
      )}
      </div>

      {/* Hero promo */}
      <div className="rounded-[22px] p-5 relative overflow-hidden" style={{ background: "linear-gradient(118deg, #0B3B2A 0%, #1D6B47 100%)" }}>
        <div className="absolute -top-[30px] -right-[30px] w-[140px] h-[140px] rounded-full bg-[rgba(39,174,120,0.15)]" />
        <div className="absolute top-3.5 right-3.5 w-20 h-20 rounded-full bg-[rgba(39,174,120,0.1)]" />
        <div className="absolute -bottom-5 right-7 text-[50px] opacity-15">🐾</div>

        <span className="inline-block bg-[rgba(245,146,42,0.2)] text-[#F5922A] text-[10px] font-bold px-2.5 py-1 rounded-full tracking-[0.6px] uppercase mb-2">
          Offer
        </span>

        <div className="font-serif text-[20px] font-normal text-white mt-1 leading-[1.2]">
          First booking 20% off
        </div>
        <div className="text-[12px] text-white/60 mt-1">
          Use code <strong className="text-[#27AE78] tracking-[1px]">PAWS20</strong> at checkout
        </div>

        <Button className="mt-3.5 h-auto py-2 px-4 rounded-[10px] bg-[#27AE78] hover:bg-[#1D8F60] text-[#0B3B2A] font-bold text-[12px]">
          Claim Offer <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      {/* Add Pet Popup */}
      {showAddPet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddPet(false)}>
          <div
            className="w-full max-w-lg bg-white rounded-t-[28px] p-6 pb-10 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[18px] text-[#081C13]">Add Your Pet</h3>
              <button
                onClick={() => setShowAddPet(false)}
                className="w-8 h-8 rounded-full bg-[#F0F5F2] flex items-center justify-center"
              >
                <X className="w-4 h-4 text-[#3E6255]" />
              </button>
            </div>

            {/* Pet type toggle */}
            <div className="flex gap-2 mb-4">
              {(["dog", "cat"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className="flex-1 h-12 rounded-[14px] border text-[14px] font-bold capitalize transition-all"
                  style={{
                    border: form.type === t ? "2px solid #27AE78" : "1px solid #DDE8E3",
                    background: form.type === t ? "#F5FAF7" : "white",
                    color: form.type === t ? "#0B3B2A" : "#3E6255",
                  }}
                >
                  {PET_EMOJIS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className="space-y-3 mb-5">
              <input
                placeholder="Pet name *"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full h-12 rounded-[12px] border border-[#DDE8E3] px-4 text-[14px] text-[#081C13] outline-none focus:border-[#27AE78] bg-[#F9FCFA]"
              />
              <input
                placeholder="Breed (e.g. Labrador)"
                value={form.breed}
                onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))}
                className="w-full h-12 rounded-[12px] border border-[#DDE8E3] px-4 text-[14px] text-[#081C13] outline-none focus:border-[#27AE78] bg-[#F9FCFA]"
              />
              <div className="flex gap-3">
                <input
                  placeholder="Age (yrs)"
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                  className="flex-1 h-12 rounded-[12px] border border-[#DDE8E3] px-4 text-[14px] text-[#081C13] outline-none focus:border-[#27AE78] bg-[#F9FCFA]"
                />
                <input
                  placeholder="Weight (kg)"
                  type="number"
                  value={form.weight}
                  onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                  className="flex-1 h-12 rounded-[12px] border border-[#DDE8E3] px-4 text-[14px] text-[#081C13] outline-none focus:border-[#27AE78] bg-[#F9FCFA]"
                />
              </div>
            </div>

            <button
              onClick={handleAddPet}
              disabled={!form.name.trim() || addingPet}
              className="w-full h-[52px] rounded-2xl text-white text-[15px] font-bold transition-all disabled:opacity-40"
              style={{ background: "#0B3B2A" }}
            >
              {addingPet ? "Adding..." : "Add Pet"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSection;
