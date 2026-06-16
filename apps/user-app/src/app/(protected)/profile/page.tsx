"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/features/layout/components/AppShell";
import { Button } from "@/shared/components/ui/button";
import { LogOut, ChevronRight, Plus, MapPin, Check, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Address, Pet } from "@/shared/types";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Desktop accordion state
  const [openSection, setOpenSection] = useState<string | null>("pets");

  useEffect(() => {
    Promise.all([api.get("/booking/pets"), api.get("/booking/addresses")])
      .then(([petsRes, addressesRes]) => {
        const apiPets = (petsRes.data.pets ?? []) as Array<{
          id: string;
          name: string;
          type?: "dog" | "cat";
          breed?: string;
          age?: number;
          weight?: number;
        }>;
        const apiAddresses = (addressesRes.data.addresses ?? []) as Array<{
          id: string;
          text?: string;
          label?: string;
          house?: string;
          area?: string;
          city?: string;
          state?: string;
          pincode?: string;
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

        setAddresses(
          apiAddresses.map((addr) => ({
            id: addr.id,
            label: addr.label ?? (addr.text?.startsWith("Clinic") ? "Clinic" : "Home"),
            house: addr.house ?? addr.text ?? "",
            area: addr.area ?? "",
            city: addr.city ?? "Ahmedabad",
            state: addr.state ?? "Gujarat",
            pincode: addr.pincode ?? "000000",
          }))
        );
      })
      .catch(() => {
        setPets([]);
        setAddresses([]);
      });
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.push("/login");
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  if (!user) {
    return (
      <AppShell>
        <div className="px-4 py-16 text-center max-w-md mx-auto">
          <span className="text-5xl block mb-4 animate-float">🐾</span>
          <h2 className="font-bold text-[22px] text-foreground mb-2">Join Canovet</h2>
          <p className="text-[14px] text-muted-foreground mb-6">
            Login to manage your pets and bookings
          </p>
          <Button
            onClick={() => router.push("/login?redirect=/profile")}
            className="rounded-full px-8 h-12 font-semibold bg-primary hover:bg-primary/90 text-white"
          >
            Login / Sign Up
          </Button>
        </div>
      </AppShell>
    );
  }

  const initials = user.name ? user.name.charAt(0).toUpperCase() : "G";

  return (
    <AppShell>
      {/* ===== MOBILE VIEW (unchanged) ===== */}
      <div className="md:hidden bg-background min-h-screen pb-24">
        <div className="bg-white border-b border-border px-4 pt-10 pb-6 rounded-b-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4">
            <div className="w-[68px] h-[68px] rounded-[22px] bg-gradient-to-br from-[#A7009D] to-[#6B0068] flex items-center justify-center shadow-elevated shrink-0">
              <span className="text-[28px] text-white font-bold">{initials}</span>
            </div>
            <div>
              <h1 className="font-bold text-[24px] text-foreground leading-tight mb-1">{user.name || "Pet Parent"}</h1>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-[13px] font-medium">
                <span className="text-[12px]">✉️</span> {user.email}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-6 space-y-6 max-w-3xl mx-auto">
          {/* Pets Section */}
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-3.5">
              <h2 className="font-bold text-[18px] text-foreground">My Pets</h2>
              <button className="w-8 h-8 rounded-[10px] bg-primary/10 flex items-center justify-center text-primary">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              {pets.length === 0 ? (
                <div className="bg-white rounded-[18px] border border-border border-dashed p-6 text-center">
                  <div className="text-[32px] opacity-50 mb-2">🐾</div>
                  <div className="text-[14px] text-foreground font-bold mb-1">No pets yet</div>
                  <div className="text-[12px] text-muted-foreground">Add a pet to quickly book services</div>
                </div>
              ) : (
                pets.map((pet) => (
                  <div key={pet.id} className="bg-white p-4 rounded-[18px] border border-border flex items-center gap-3.5 hover:border-primary/30 transition-colors">
                    <div className="w-[52px] h-[52px] rounded-[16px] bg-primary/10 flex items-center justify-center text-[26px] shrink-0">
                      {pet.type === "dog" ? "🐕" : "🐈"}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-[16px] text-foreground">{pet.name}</div>
                      <div className="text-[12px] text-muted-foreground mt-0.5">
                        {pet.breed} · {pet.age} yrs · {pet.weight} kg
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md tracking-[0.4px] uppercase flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Vaccinated
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#B8CEC5]" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Addresses Section */}
          <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <div className="flex justify-between items-center mb-3.5">
              <h2 className="font-bold text-[18px] text-foreground">Saved Addresses</h2>
              <button className="w-8 h-8 rounded-[10px] bg-muted flex items-center justify-center text-muted-foreground">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {addresses.length === 0 ? (
                <div className="bg-white rounded-[18px] border border-border border-dashed p-6 text-center">
                  <div className="text-[32px] opacity-50 mb-2">🏠</div>
                  <div className="text-[14px] text-foreground font-bold mb-1">No addresses</div>
                  <div className="text-[12px] text-muted-foreground">Saved addresses will appear here</div>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="bg-white p-4 rounded-[18px] border border-border flex items-start gap-3.5 hover:border-primary/30 transition-colors">
                    <div className="w-[44px] h-[44px] rounded-[14px] bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-bold text-foreground">{addr.label}</div>
                      <div className="text-[12px] text-muted-foreground mt-0.5 leading-[1.3]">
                        {addr.house}, {addr.area}
                      </div>
                      <div className="text-[12px] text-muted-foreground mt-0.5 leading-[1.3]">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#B8CEC5] mt-2" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Logout */}
          <div className="pt-4 pb-8 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-[18px] border border-[#E05C35]/30 bg-[#FFF4F0] text-[#E05C35] hover:bg-[#E05C35]/10 transition-all disabled:opacity-70"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-[14px] font-bold">{isLoggingOut ? "Logging out..." : "Log Out"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===== DESKTOP VIEW (redesigned per design md) ===== */}
      <div className="hidden md:block min-h-screen pb-32" style={{ background: "#fbf9f8" }}>
        <main className="pt-12 pb-32 px-10 max-w-2xl mx-auto">
          <div className="flex flex-col gap-12">
            {/* Profile Header - Centered, Minimal */}
            <section className="text-center animate-fade-in-up">
              <div className="flex flex-col items-center">
                <div
                  className="w-24 h-24 rounded-full text-white flex items-center justify-center text-[40px] font-bold mb-6 soft-shadow"
                  style={{ background: "linear-gradient(135deg, #A7009D, #6c005f)" }}
                >
                  {initials}
                </div>
                <h1 className="font-headline-lg text-[#151c27]">{user.name || "Pet Parent"}</h1>
                <p className="text-[#54414d] font-body-md mt-1 tracking-wide">{user.email}</p>
                <div className="mt-4">
                  <span className="px-4 py-1 rounded-full bg-[#e2e8f8] text-[#54414d] font-label-md uppercase tracking-widest">
                    Premium Member
                  </span>
                </div>
              </div>
            </section>

            {/* Collapsible Sections */}
            <div className="flex flex-col w-full">
              {/* Your Pets */}
              <div className="border-b border-[#d9c0ce]/30">
                <button
                  onClick={() => toggleSection("pets")}
                  className="flex items-center justify-between py-6 w-full cursor-pointer hover:opacity-70 transition-opacity"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[#6c005f] text-xl">🐾</span>
                    <span className="font-headline-sm text-[#151c27]">Your Pets</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-[#54414d] transition-transform duration-300 ${openSection === "pets" ? "rotate-180" : ""}`}
                  />
                </button>
                {openSection === "pets" && (
                  <div className="pb-8 space-y-4 animate-fade-in-up" style={{ animationDuration: "0.3s" }}>
                    {pets.length === 0 ? (
                      <div className="p-4 rounded-xl bg-[#f0f3ff]/30 text-center">
                        <p className="text-[#54414d] font-body-md">No pets added yet</p>
                      </div>
                    ) : (
                      pets.map((pet) => (
                        <div key={pet.id} className="flex justify-between items-center p-4 rounded-xl bg-[#f0f3ff]/30 hover:bg-[#f0f3ff]/60 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#6c005f]/5 flex items-center justify-center text-[#6c005f]">
                              <span className="text-lg">{pet.type === "dog" ? "🐕" : "🐈"}</span>
                            </div>
                            <span className="font-body-lg font-bold text-[#151c27]">{pet.name}</span>
                          </div>
                          <span className="text-[#54414d] font-body-md">{pet.breed}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Your Addresses */}
              <div className="border-b border-[#d9c0ce]/30">
                <button
                  onClick={() => toggleSection("addresses")}
                  className="flex items-center justify-between py-6 w-full cursor-pointer hover:opacity-70 transition-opacity"
                >
                  <div className="flex items-center gap-4">
                    <MapPin className="w-5 h-5 text-[#6c005f]" />
                    <span className="font-headline-sm text-[#151c27]">Your Addresses</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-[#54414d] transition-transform duration-300 ${openSection === "addresses" ? "rotate-180" : ""}`}
                  />
                </button>
                {openSection === "addresses" && (
                  <div className="pb-8 space-y-4 animate-fade-in-up" style={{ animationDuration: "0.3s" }}>
                    {addresses.length === 0 ? (
                      <div className="p-4 rounded-xl bg-[#f0f3ff]/30 text-center">
                        <p className="text-[#54414d] font-body-md">No addresses saved yet</p>
                      </div>
                    ) : (
                      addresses.map((addr) => (
                        <div key={addr.id} className="p-4 rounded-xl bg-[#f0f3ff]/30 hover:bg-[#f0f3ff]/60 transition-colors">
                          <p className="font-bold text-[#151c27]">{addr.label}</p>
                          <p className="text-[#54414d] font-body-md">{addr.house}, {addr.area}{addr.city ? `, ${addr.city}` : ""}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Your Bookings */}
              <div className="border-b border-[#d9c0ce]/30">
                <button
                  onClick={() => toggleSection("bookings")}
                  className="flex items-center justify-between py-6 w-full cursor-pointer hover:opacity-70 transition-opacity"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[#6c005f] text-xl">📅</span>
                    <span className="font-headline-sm text-[#151c27]">Your Bookings</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-[#54414d] transition-transform duration-300 ${openSection === "bookings" ? "rotate-180" : ""}`}
                  />
                </button>
                {openSection === "bookings" && (
                  <div className="pb-8 space-y-4 animate-fade-in-up" style={{ animationDuration: "0.3s" }}>
                    <button
                      onClick={() => router.push("/bookings")}
                      className="w-full p-4 rounded-xl bg-[#f0f3ff]/30 hover:bg-[#f0f3ff]/60 transition-colors text-left flex justify-between items-center"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-[#6c005f]">📋</span>
                        <span className="font-bold text-[#151c27]">View All Bookings</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#54414d]" />
                    </button>
                  </div>
                )}
              </div>

              {/* Coupons */}
              <div className="border-b border-[#d9c0ce]/30">
                <button
                  onClick={() => toggleSection("coupons")}
                  className="flex items-center justify-between py-6 w-full cursor-pointer hover:opacity-70 transition-opacity"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[#6c005f] text-xl">🎟️</span>
                    <span className="font-headline-sm text-[#151c27]">Coupons</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-[#54414d] transition-transform duration-300 ${openSection === "coupons" ? "rotate-180" : ""}`}
                  />
                </button>
                {openSection === "coupons" && (
                  <div className="pb-8 animate-fade-in-up" style={{ animationDuration: "0.3s" }}>
                    <div className="flex justify-between items-center p-5 rounded-xl border border-[#6c005f]/20 bg-[#6c005f]/5">
                      <span className="font-bold text-[#6c005f] tracking-wider">PAW50</span>
                      <span className="text-[#6c005f] font-bold font-label-md">50% OFF</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Log Out */}
            <section className="mt-8 flex flex-col items-center">
              <div className="w-full max-w-xs flex flex-col items-center gap-4">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center justify-center gap-2 w-full py-3 text-[#54414d] font-medium hover:text-[#ba1a1a] transition-colors disabled:opacity-70"
                >
                  <LogOut className="w-5 h-5" />
                  <span>{isLoggingOut ? "Logging out..." : "Log Out"}</span>
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
