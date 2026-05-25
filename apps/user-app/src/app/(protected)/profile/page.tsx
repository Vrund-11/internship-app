"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/features/layout/components/AppShell";
import { Button } from "@/shared/components/ui/button";
import { LogOut, ChevronRight, Plus, MapPin, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Address, Pet } from "@/shared/types";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  if (!user) {
    return (
      <AppShell>
        <div className="px-4 py-16 text-center max-w-md mx-auto">
          <span className="text-5xl block mb-4 animate-float">🐾</span>
          <h2 className="font-serif text-[22px] text-[#081C13] mb-2">Join Canovet</h2>
          <p className="text-[14px] text-[#3E6255] mb-6">
            Login to manage your pets and bookings
          </p>
          <Button
            onClick={() => router.push("/login?redirect=/profile")}
            className="rounded-full px-8 h-12 font-semibold bg-[#0B3B2A] text-white"
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
      <div className="bg-[#F5FAF7] min-h-screen pb-24">
        <div className="bg-white border-b border-[#DDE8E3] px-4 pt-10 pb-6 rounded-b-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4">
            <div className="w-[68px] h-[68px] rounded-[22px] bg-gradient-to-br from-[#0B3B2A] to-[#155E41] flex items-center justify-center shadow-elevated shrink-0">
              <span className="text-[28px] text-white font-serif font-bold">{initials}</span>
            </div>
            <div>
              <h1 className="font-serif text-[24px] text-[#081C13] leading-tight mb-1">{user.name || "Pet Parent"}</h1>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F0F5F2] text-[#3E6255] text-[13px] font-medium">
                <span className="text-[12px]">📱</span> +91 {user.phone}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-6 space-y-6 max-w-3xl mx-auto">
          {/* Pets Section */}
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-3.5">
              <h2 className="font-serif text-[18px] text-[#081C13]">My Pets</h2>
              <button className="w-8 h-8 rounded-[10px] bg-[#E3F6EE] flex items-center justify-center text-[#1D8F60]">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              {pets.length === 0 ? (
                <div className="bg-white rounded-[18px] border border-[#DDE8E3] border-dashed p-6 text-center">
                  <div className="text-[32px] opacity-50 mb-2">🐾</div>
                  <div className="text-[14px] text-[#081C13] font-bold mb-1">No pets yet</div>
                  <div className="text-[12px] text-[#6E8F83]">Add a pet to quickly book services</div>
                </div>
              ) : (
                pets.map((pet) => (
                  <div key={pet.id} className="bg-white p-4 rounded-[18px] border border-[#DDE8E3] flex items-center gap-3.5 hover:border-[#B8CEC5] transition-colors">
                    <div className="w-[52px] h-[52px] rounded-[16px] bg-[#E3F6EE] flex items-center justify-center text-[26px] shrink-0">
                      {pet.type === "dog" ? "🐕" : "🐈"}
                    </div>
                    <div className="flex-1">
                      <div className="font-serif text-[16px] font-normal text-[#081C13]">{pet.name}</div>
                      <div className="text-[12px] text-[#3E6255] mt-0.5">
                        {pet.breed} · {pet.age} yrs · {pet.weight} kg
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <span className="bg-[#E3F6EE] text-[#1D8F60] text-[10px] font-bold px-2 py-0.5 rounded-md tracking-[0.4px] uppercase flex items-center gap-1">
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
              <h2 className="font-serif text-[18px] text-[#081C13]">Saved Addresses</h2>
              <button className="w-8 h-8 rounded-[10px] bg-[#F0F5F2] flex items-center justify-center text-[#3E6255]">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {addresses.length === 0 ? (
                <div className="bg-white rounded-[18px] border border-[#DDE8E3] border-dashed p-6 text-center">
                  <div className="text-[32px] opacity-50 mb-2">🏠</div>
                  <div className="text-[14px] text-[#081C13] font-bold mb-1">No addresses</div>
                  <div className="text-[12px] text-[#6E8F83]">Saved addresses will appear here</div>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="bg-white p-4 rounded-[18px] border border-[#DDE8E3] flex items-start gap-3.5 hover:border-[#B8CEC5] transition-colors">
                    <div className="w-[44px] h-[44px] rounded-[14px] bg-[#F0F5F2] flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5 text-[#3E6255]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-bold text-[#081C13]">{addr.label}</div>
                      <div className="text-[12px] text-[#3E6255] mt-0.5 leading-[1.3]">
                        {addr.house}, {addr.area}
                      </div>
                      <div className="text-[12px] text-[#6E8F83] mt-0.5 leading-[1.3]">
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
    </AppShell>
  );
}
