"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, Heart, ArrowLeft } from "lucide-react";
import AppShell from "@/features/layout/components/AppShell";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Pet } from "@/shared/types";
import { cn } from "@/shared/lib/utils";

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
  const router = useRouter();
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
    <AppShell hideMobileNav={true} fullWidth={true}>
      {/* Mobile View */}
      <div className="md:hidden bg-[#F8F8F8] min-h-screen pb-24">
        {/* Mobile Header Sub-Navbar */}
        <div className="bg-white border-b border-[#EDE4EB] px-6 pt-10 pb-6 rounded-b-[24px] shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.back()} 
                className="w-10 h-10 rounded-full border border-[#EDE4EB] hover:bg-neutral-100 flex items-center justify-center text-[#4A4A4A] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="font-extrabold text-[24px] text-[#121212]">My Pets</h1>
            </div>
            <button
              onClick={() => setShowAddPet(true)}
              className="w-10 h-10 rounded-full bg-[#FF10F0] text-white flex items-center justify-center active:scale-95 transition-all shadow-sm"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 pt-6 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl p-4">
              {error}
            </div>
          )}

          {/* Loading / Empty / List State (Mobile) */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-[24px] border border-[#EDE4EB] p-6 animate-pulse space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-[20px] bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-2/3" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : pets.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-dashed border-[#EDE4EB] p-8 text-center shadow-sm">
              <div className="text-[32px] opacity-50 mb-2">🐾</div>
              <div className="text-[14px] text-[#121212] font-bold mb-1">No pets yet</div>
              <div className="text-[12px] text-[#4A4A4A]">Add a pet to quickly book services</div>
            </div>
          ) : (
            <div className="space-y-4">
              {pets.map((pet) => (
                <div key={pet.id} className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all border border-[#EDE4EB]/50">
                  <div className="w-[52px] h-[52px] rounded-full bg-[#FFF0FC] flex items-center justify-center text-[26px] shrink-0">
                    {pet.type === "dog" ? "🐕" : "🐈"}
                  </div>
                  <div className="flex-1">
                    <div className="font-extrabold text-[16px] text-[#121212]">{pet.name}</div>
                    <div className="text-[12px] text-[#4A4A4A] mt-0.5 font-semibold">
                      {pet.breed} · {pet.age} yrs · {pet.weight} kg
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <span className="bg-[#E6F9F0] text-[#10B981] text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-[0.4px] uppercase flex items-center gap-1">
                        ✓ Vaccinated
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block min-h-screen bg-[#F8F8F8] pb-24 px-10 py-8">
        <div className="max-w-[1440px] mx-auto space-y-6">
          {/* Back Button */}
          <div>
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-[#FF10F0]" />
            </button>
          </div>

          {/* Premium Header Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#390035] via-[#A7009D] to-[#E040D0] rounded-[24px] p-8 text-white shadow-[0_12px_40px_rgba(167,0,157,0.15)]">
            <div className="absolute right-12 bottom-0 opacity-10 pointer-events-none">
              <Heart className="w-64 h-64" />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Pet Directory
                </span>
                <h1 className="font-extrabold text-3xl mt-3">My Furry Family</h1>
                <p className="text-white/80 text-sm mt-2 max-w-xl font-medium">
                  Manage your pets details here to quickly schedule grooming and vet checkups.
                </p>
              </div>
              <button
                onClick={() => setShowAddPet(true)}
                className="flex items-center gap-2 bg-white text-[#A7009D] hover:bg-white/95 active:scale-95 transition-all font-extrabold px-6 py-4 rounded-xl shadow-lg shrink-0 text-sm"
              >
                <Plus className="w-4.5 h-4.5" />
                Add New Pet
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl p-4">
              {error}
            </div>
          )}

          {/* Pets Grid (Desktop) */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-[24px] border border-[#EDE4EB] p-6 animate-pulse space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-[20px] bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-2/3" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : pets.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-dashed border-[#EDE4EB] p-12 text-center max-w-md mx-auto shadow-sm">
              <div className="text-[40px] mb-4">🐾</div>
              <h3 className="font-bold text-[18px] text-[#121212] mb-1">No pets registered</h3>
              <p className="text-xs text-muted-foreground mb-6">Add a pet to quickly book services</p>
              <button
                onClick={() => setShowAddPet(true)}
                className="inline-flex items-center gap-2 bg-[#A7009D] hover:bg-[#A7009D]/90 text-white font-bold px-6 py-3 rounded-full transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Your First Pet
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pets.map((pet) => (
                <div
                  key={pet.id}
                  className="bg-white rounded-[24px] border border-[#EDE4EB] p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group hover:border-[#FF10F0]/20"
                >
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-[#FFF0FC] flex items-center justify-center text-[32px] shrink-0">
                        {pet.type === "dog" ? "🐕" : "🐈"}
                      </div>
                      <div>
                        <h3 className="font-bold text-[18px] text-[#121212]">{pet.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">{pet.breed}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
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
                    <span className="bg-[#E6F9F0] text-[#10B981] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      ✓ Vaccinated
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-[#FFF0FC] text-[#FF10F0] border border-[#FF10F0]/15">
                      {pet.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Pet Popup Modal (Centered overlay for both mobile/desktop) */}
      {showAddPet && (
        <div
          className="fixed inset-0 bg-[#121212]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setShowAddPet(false)}
        >
          <div
            className="bg-white p-8 rounded-[24px] shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#121212]">Add Your Pet</h3>
              <button
                onClick={() => setShowAddPet(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {formError && (
              <div className="bg-destructive/10 text-destructive text-xs rounded-xl p-3 mb-4">
                {formError}
              </div>
            )}

            {/* Pet Type Picker */}
            <div className="flex gap-4 mb-5">
              {(["dog", "cat"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className="flex-1 h-12 rounded-xl text-sm font-bold capitalize transition-all flex items-center justify-center gap-2 border-2"
                  style={{
                    borderColor: form.type === t ? "#FF10F0" : "#EDE4EB",
                    background: form.type === t ? "#FFF0FC" : "white",
                    color: form.type === t ? "#FF10F0" : "#4A4A4A",
                  }}
                >
                  <span className="text-lg">{t === "dog" ? "🐕" : "🐈"}</span>
                  <span>{t}</span>
                </button>
              ))}
            </div>

            {/* Form Inputs */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pet Name *</label>
                <input
                  placeholder="Enter name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full h-12 rounded-xl border border-[#EDE4EB] px-4 text-sm text-[#121212] outline-none focus:border-[#FF10F0] bg-white transition-colors"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Breed</label>
                <input
                  placeholder="e.g. Golden Retriever, Mixed"
                  value={form.breed}
                  onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))}
                  className="w-full h-12 rounded-xl border border-[#EDE4EB] px-4 text-sm text-[#121212] outline-none focus:border-[#FF10F0] bg-white transition-colors"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Age (Years)</label>
                  <input
                    placeholder="Age"
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                    className="w-full h-12 rounded-xl border border-[#EDE4EB] px-4 text-sm text-[#121212] outline-none focus:border-[#FF10F0] bg-white transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Weight (KG)</label>
                  <input
                    placeholder="Weight"
                    type="number"
                    value={form.weight}
                    onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                    className="w-full h-12 rounded-xl border border-[#EDE4EB] px-4 text-sm text-[#121212] outline-none focus:border-[#FF10F0] bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleAddPet}
              disabled={!form.name.trim() || addingPet}
              className="w-full h-12 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-40 hover:shadow-lg hover:shadow-[#FF10F0]/20 flex items-center justify-center bg-[#FF10F0]"
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
    </AppShell>
  );
}
