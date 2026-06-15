"use client";

import { useEffect, useState } from "react";
import { Plus, X, Check, Loader2, Award, Heart } from "lucide-react";
import AppShell from "@/features/layout/components/AppShell";
import { Button } from "@/shared/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Pet } from "@/shared/types";

const PET_EMOJIS: Record<string, string> = {
  dog: "🐕",
  cat: "🐈",
};

interface PetForm {
  name: string;
  type: "dog" | "cat";
  breed: string;
  age: string;
  weight: string;
}

export default function PetsPage() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Add Pet modal states
  const [showAddPet, setShowAddPet] = useState(false);
  const [addingPet, setAddingPet] = useState(false);
  const [form, setForm] = useState<PetForm>({
    name: "",
    type: "dog",
    breed: "",
    age: "2",
    weight: "8",
  });
  const [formError, setFormError] = useState("");

  const loadPets = async () => {
    try {
      setLoading(true);
      const res = await api.get("/booking/pets");
      const apiPets = (res.data.pets ?? []) as Array<{
        id: string;
        name: string;
        type?: "dog" | "cat";
        breed?: string;
        age?: number;
        weight?: number;
      }>;
      
      setPets(
        apiPets.map((pet) => ({
          id: pet.id,
          name: pet.name,
          type: pet.type ?? "dog",
          breed: pet.breed ?? "Mixed",
          age: pet.age ?? 2,
          weight: pet.weight ?? 8,
        }))
      );
      setError("");
    } catch {
      setError("Failed to load your pets list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPets();
    }
  }, [user]);

  const handleAddPet = async () => {
    if (!form.name.trim()) {
      setFormError("Pet name is required");
      return;
    }

    setAddingPet(true);
    setFormError("");

    try {
      const res = await api.post("/booking/pets", {
        name: form.name.trim(),
        type: form.type,
        breed: form.breed.trim() || "Mixed",
        age: Number(form.age) || 2,
        weight: Number(form.weight) || 8,
      });

      const newPet: Pet = {
        id: res.data.id,
        name: res.data.name,
        type: res.data.type || form.type,
        breed: res.data.breed || form.breed || "Mixed",
        age: res.data.age ?? Number(form.age),
        weight: res.data.weight ?? Number(form.weight),
      };

      setPets((prev) => [...prev, newPet]);
      setShowAddPet(false);
      setForm({ name: "", type: "dog", breed: "", age: "2", weight: "8" });
    } catch {
      setFormError("Failed to add pet. Please try again.");
    } finally {
      setAddingPet(false);
    }
  };

  return (
    <AppShell>
      <div className="bg-background min-h-screen pb-24 px-4 pt-6 max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#390035] via-[#A7009D] to-[#E040D0] rounded-3xl p-6 md:p-8 text-white shadow-[0_12px_40px_rgba(167,0,157,0.15)] mb-8">
          <div className="absolute right-4 bottom-0 opacity-10 pointer-events-none">
            <Heart className="w-48 h-48" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Pet Directory
                </span>
              </div>
              <h1 className="font-extrabold text-[28px] md:text-[34px] leading-tight">My Furry Family</h1>
              <p className="text-white/70 text-[13px] md:text-[15px] mt-1 max-w-md">
                Manage your pets details here to quickly schedule grooming and vet checkups.
              </p>
            </div>
            
            <button
              onClick={() => setShowAddPet(true)}
              className="flex items-center gap-2 bg-white text-[#A7009D] hover:bg-white/95 active:scale-95 transition-all font-bold px-6 py-3.5 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.1)] self-start md:self-auto shrink-0 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Pet
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* Pets Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-[24px] border border-[#EDE4EB] p-6 animate-pulse space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-[20px] bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-2/3" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="pt-4 border-t border-[#EDE4EB] flex gap-2">
                  <div className="h-6 bg-muted rounded-full w-20" />
                  <div className="h-6 bg-muted rounded-full w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : pets.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-dashed border-[#EDE4EB] p-12 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-20 h-20 rounded-[28px] bg-[#FBF0FB] flex items-center justify-center mx-auto mb-5 text-[40px]">
              🐾
            </div>
            <h3 className="font-extrabold text-[19px] text-[#1a0a18] mb-1">No Registered Pets</h3>
            <p className="text-[13px] text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
              Register your pets to easily track medical records, schedules, and make one-click bookings.
            </p>
            <button
              onClick={() => setShowAddPet(true)}
              className="inline-flex items-center gap-2 bg-[#A7009D] hover:bg-[#A7009D]/90 text-white font-bold px-6 py-3 rounded-full transition-all text-sm shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add Your First Pet
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => {
              const theme = pet.type === "dog" 
                ? { soft: "bg-orange-50/50 hover:bg-orange-50", border: "border-orange-100 hover:border-orange-300", badge: "bg-orange-100 text-orange-800", emojiBg: "bg-orange-100/50" }
                : { soft: "bg-purple-50/50 hover:bg-purple-50", border: "border-purple-100 hover:border-purple-300", badge: "bg-purple-100 text-purple-800", emojiBg: "bg-purple-100/50" };

              return (
                <div
                  key={pet.id}
                  className={`bg-white rounded-[24px] border border-[#EDE4EB] p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-[20px] ${theme.emojiBg} flex items-center justify-center text-[32px] shadow-sm transition-transform group-hover:scale-105 duration-300`}>
                          {PET_EMOJIS[pet.type] ?? "🐾"}
                        </div>
                        <div>
                          <h3 className="font-bold text-[18px] text-[#1a0a18] group-hover:text-[#A7009D] transition-colors">
                            {pet.name}
                          </h3>
                          <p className="text-[12px] text-muted-foreground capitalize mt-0.5">{pet.breed}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-[#F8F4F8] rounded-xl p-2.5">
                        <span className="text-[10px] text-muted-foreground font-semibold block uppercase tracking-wider">Age</span>
                        <span className="text-[13px] font-bold text-foreground mt-0.5 block">{pet.age} years</span>
                      </div>
                      <div className="bg-[#F8F4F8] rounded-xl p-2.5">
                        <span className="text-[10px] text-muted-foreground font-semibold block uppercase tracking-wider">Weight</span>
                        <span className="text-[13px] font-bold text-foreground mt-0.5 block">{pet.weight} kg</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#EDE4EB]/70 flex items-center justify-between">
                    <span className="bg-[#D1FAE5] text-[#065F46] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Check className="w-3 h-3" /> Vaccinated
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${theme.badge}`}>
                      {pet.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Pet Popup Modal */}
        {showAddPet && (
          <div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[rgba(26,10,24,0.5)] backdrop-blur-sm p-0 md:p-4 animate-fade-in"
            onClick={() => setShowAddPet(false)}
          >
            <div
              className="w-full max-w-lg bg-white rounded-t-[28px] md:rounded-[28px] p-6 pb-10 md:pb-8 shadow-[0_20px_60px_rgba(26,10,24,0.2)] animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold text-[19px] text-[#1a0a18]">Add Your Pet</h3>
                <button
                  onClick={() => setShowAddPet(false)}
                  className="w-8 h-8 rounded-full bg-[#F3EEF1] flex items-center justify-center hover:bg-[#EDE4EB] transition-colors"
                >
                  <X className="w-4 h-4 text-[#5C3A58]" />
                </button>
              </div>

              {formError && (
                <div className="bg-destructive/10 text-destructive text-[12px] font-medium rounded-xl p-3 mb-4">
                  {formError}
                </div>
              )}

              {/* Pet Type Picker */}
              <div className="flex gap-3 mb-4">
                {(["dog", "cat"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className="flex-1 h-12 rounded-[14px] text-[14px] font-bold capitalize transition-all flex items-center justify-center gap-2 border-2"
                    style={{
                      borderColor: form.type === t ? "#A7009D" : "#EDE4EB",
                      background: form.type === t ? "#FBF0FB" : "white",
                      color: form.type === t ? "#390035" : "#5C3A58",
                    }}
                  >
                    <span>{PET_EMOJIS[t]}</span>
                    <span>{t}</span>
                  </button>
                ))}
              </div>

              {/* Form Inputs */}
              <div className="space-y-3 mb-6">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Pet Name *</label>
                  <input
                    placeholder="Enter name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full h-12 rounded-[14px] border border-[#DDD0DA] px-4 text-[14px] text-[#1a0a18] outline-none focus:border-[#A7009D] bg-white transition-colors"
                  />
                </div>
                
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Breed</label>
                  <input
                    placeholder="e.g. Golden Retriever, Mixed"
                    value={form.breed}
                    onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))}
                    className="w-full h-12 rounded-[14px] border border-[#DDD0DA] px-4 text-[14px] text-[#1a0a18] outline-none focus:border-[#A7009D] bg-white transition-colors"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Age (Years)</label>
                    <input
                      placeholder="Age"
                      type="number"
                      value={form.age}
                      onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                      className="w-full h-12 rounded-[14px] border border-[#DDD0DA] px-4 text-[14px] text-[#1a0a18] outline-none focus:border-[#A7009D] bg-white transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Weight (KG)</label>
                    <input
                      placeholder="Weight"
                      type="number"
                      value={form.weight}
                      onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                      className="w-full h-12 rounded-[14px] border border-[#DDD0DA] px-4 text-[14px] text-[#1a0a18] outline-none focus:border-[#A7009D] bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddPet}
                disabled={!form.name.trim() || addingPet}
                className="w-full h-[52px] rounded-full text-white text-[15px] font-bold transition-all disabled:opacity-40 hover:shadow-[0_8px_24px_rgba(167,0,157,0.3)] hover:scale-[1.01] flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #A7009D, #CC00BE)" }}
              >
                {addingPet ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving Pet...
                  </>
                ) : (
                  "Add Pet"
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
