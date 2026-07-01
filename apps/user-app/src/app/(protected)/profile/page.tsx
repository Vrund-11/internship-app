"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import AppShell from "@/features/layout/components/AppShell";
import { Button } from "@/shared/components/ui/button";
import { LogOut, ChevronRight, Plus, MapPin, Check, Calendar, Heart, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Address, Pet } from "@/shared/types";
import { cn } from "@/shared/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      api.get("/booking/pets"),
      api.get("/booking/addresses"),
      api.get("/booking/history", { params: { page: 1, limit: 5 } })
    ])
      .then(([petsRes, addressesRes, bookingsRes]) => {
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

        setRecentBookings(bookingsRes.data.bookings ?? []);
      })
      .catch((err) => {
        console.error("Failed to load profile data:", err);
        setPets([]);
        setAddresses([]);
        setRecentBookings([]);
      });
  }, [user]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.push("/login");
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!user) {
    return (
      <AppShell>
        <div className="px-4 py-16 text-center max-w-md mx-auto">
          <span className="text-5xl block mb-4">🐾</span>
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
      {/* Mobile View */}
      <div className="md:hidden bg-[#F8F8F8] min-h-screen pb-28">
        <div className="bg-white border-b border-[#EDE4EB] px-6 pt-10 pb-6 rounded-b-[24px] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-[68px] h-[68px] rounded-[22px] bg-gradient-to-br from-[#FF10F0] to-[#A7009D] flex items-center justify-center shadow-md shrink-0">
              <span className="text-[28px] text-white font-extrabold">{initials}</span>
            </div>
            <div>
              <h1 className="font-extrabold text-[24px] text-[#121212] leading-tight mb-1">{user.name || "Pet Parent"}</h1>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8F4F8] text-[#4A4A4A] text-[13px] font-semibold border border-[#EDE4EB]">
                <span className="text-[12px]">✉️</span> {user.email}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pt-6 space-y-6 max-w-3xl mx-auto">
          {/* Pets Section */}
          <div>
            <div className="flex justify-between items-center mb-3.5">
              <h2 className="font-extrabold text-[18px] text-[#121212]">My Pets</h2>
              <button 
                onClick={() => router.push("/pets")}
                className="w-8 h-8 rounded-full border border-[#FF10F0]/30 hover:bg-[#FF10F0]/10 flex items-center justify-center text-[#FF10F0] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {pets.length === 0 ? (
                <div className="bg-white rounded-[18px] border border-dashed border-[#EDE4EB] p-8 text-center shadow-sm">
                  <div className="text-[32px] opacity-50 mb-2">🐾</div>
                  <div className="text-[14px] text-[#121212] font-bold mb-1">No pets yet</div>
                  <div className="text-[12px] text-[#4A4A4A]">Add a pet to quickly book services</div>
                </div>
              ) : (
                pets.map((pet) => (
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
                    <ChevronRight className="w-4 h-4 text-[#4A4A4A]" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Addresses Section */}
          <div>
            <div className="flex justify-between items-center mb-3.5">
              <h2 className="font-extrabold text-[18px] text-[#121212]">Saved Addresses</h2>
              <button 
                onClick={() => router.push("/addresses")}
                className="w-8 h-8 rounded-full border border-[#EDE4EB] hover:bg-neutral-100 flex items-center justify-center text-[#4A4A4A] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {addresses.length === 0 ? (
                <div className="bg-white rounded-[18px] border border-dashed border-[#EDE4EB] p-8 text-center shadow-sm">
                  <div className="text-[32px] opacity-50 mb-2">🏠</div>
                  <div className="text-[14px] text-[#121212] font-bold mb-1">No addresses</div>
                  <div className="text-[12px] text-[#4A4A4A]">Saved addresses will appear here</div>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="bg-white p-5 rounded-2xl shadow-sm flex items-start gap-4 hover:shadow-md transition-all border border-[#EDE4EB]/50">
                    <div className="w-[44px] h-[44px] rounded-xl bg-[#FFF0FC] flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5 text-[#FF10F0]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-bold text-[#121212]">{addr.label}</div>
                      <div className="text-[12px] text-[#4A4A4A] mt-1.5 leading-[1.4] font-semibold">
                        {addr.house}, {addr.area}
                      </div>
                      <div className="text-[12px] text-[#4A4A4A] mt-0.5 leading-[1.4] font-semibold">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#4A4A4A] mt-2.5" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Logout */}
          <div className="pt-4 pb-8">
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-4 px-5 rounded-full border-2 border-[#121212] bg-transparent text-[#121212] font-bold text-[14px] hover:bg-[#121212]/5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-[14px] font-extrabold">Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block min-h-screen bg-[#F8F8F8] pb-24 px-10 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Horizontal Profile Header Banner */}
          <div className="bg-white rounded-[24px] border border-[#EDE4EB] p-8 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-[#FF10F0] text-white flex items-center justify-center font-extrabold text-3xl shadow-lg shadow-[#FF10F0]/20">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-extrabold text-[#121212] tracking-tight">{user.name || "Pet Parent"}</h2>
                  <span className="px-3 py-1 rounded-full bg-[#FF10F0]/10 text-[#FF10F0] text-[10px] uppercase tracking-widest font-bold">
                    Premium Member
                  </span>
                </div>
                <p className="text-[#54414d] text-sm mt-1">{user.email}</p>
              </div>
            </div>
            <div>
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="flex items-center gap-3 px-5 py-3 rounded-xl text-[#54414d] hover:text-[#ba1a1a] hover:bg-[#ba1a1a]/5 transition-all font-bold text-sm border border-[#EDE4EB]"
              >
                <LogOut className="w-4.5 h-4.5" />
                Log Out
              </button>
            </div>
          </div>



          {/* Dashboard Main Grid Content */}
          <div className="space-y-8">
            {/* 1. Pets Section */}
            <section id="pets" className="space-y-4 scroll-mt-24">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#121212] flex items-center gap-2">
                  <span className="text-[#FF10F0]">🐾</span>
                  Your Pets
                </h3>
                <button 
                  onClick={() => router.push("/pets")}
                  className="text-xs font-bold text-[#FF10F0] hover:underline"
                >
                  Manage Pets
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pets.length === 0 ? (
                  <div className="col-span-full bg-white p-8 rounded-2xl text-center border border-[#EDE4EB]">
                    <p className="text-[#54414d] text-sm">No pets registered yet.</p>
                    <button 
                      onClick={() => router.push("/pets")}
                      className="text-sm font-bold text-[#FF10F0] hover:underline mt-2 inline-block"
                    >
                      Add a pet
                    </button>
                  </div>
                ) : (
                  pets.map((pet) => (
                    <div key={pet.id} className="bg-white p-6 rounded-2xl shadow-sm border border-[#EDE4EB] hover:border-[#FF10F0]/20 transition-all group flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-[#FF10F0]/5 flex items-center justify-center text-3xl text-[#FF10F0] group-hover:bg-[#FF10F0] group-hover:text-white transition-colors">
                        {pet.type === "dog" ? "🐕" : "🐈"}
                      </div>
                      <div>
                        <h4 className="font-bold text-[17px] text-[#121212]">{pet.name}</h4>
                        <p className="text-[#54414d] text-[13px] capitalize mt-0.5">{pet.breed} • {pet.age} years</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* 2. Addresses Section */}
            <section id="addresses" className="space-y-4 scroll-mt-24">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#121212] flex items-center gap-2">
                  <span className="text-[#FF10F0]">📍</span>
                  Saved Addresses
                </h3>
                <button 
                  onClick={() => router.push("/addresses")}
                  className="text-xs font-bold text-[#FF10F0] hover:underline"
                >
                  Manage Addresses
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.length === 0 ? (
                  <div className="col-span-full bg-white p-8 rounded-2xl text-center border border-[#EDE4EB]">
                    <p className="text-[#54414d] text-sm">No addresses saved yet.</p>
                  </div>
                ) : (
                  addresses.map((addr) => (
                    <div key={addr.id} className="bg-white p-5 rounded-2xl border border-[#EDE4EB] shadow-sm flex items-start gap-3">
                      <span className="text-2xl mt-0.5">🏠</span>
                      <div>
                        <p className="font-bold text-[#121212] text-sm">{addr.label}</p>
                        <p className="text-[#54414d] text-xs mt-1">{addr.house}, {addr.area}</p>
                        <p className="text-[#54414d] text-xs">{addr.city}, {addr.state} - {addr.pincode}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* 3. Recent Bookings Section */}
            <section id="bookings" className="space-y-4 scroll-mt-24">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#121212] flex items-center gap-2">
                  <span className="text-[#FF10F0]">📅</span>
                  Recent Bookings
                </h3>
                <button 
                  onClick={() => router.push("/bookings")}
                  className="text-xs font-bold text-[#FF10F0] hover:underline"
                >
                  View History
                </button>
              </div>
              <div className="bg-white rounded-[24px] shadow-sm border border-[#EDE4EB] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#f0f3ff]/30 border-b border-[#EDE4EB]">
                    <tr>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-[#54414d]">Service</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-[#54414d]">Booking ID</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-[#54414d]">Date</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-[#54414d]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE4EB]/50">
                    {recentBookings.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-[#54414d]">
                          No bookings found.
                        </td>
                      </tr>
                    ) : (
                      recentBookings.map((b) => {
                        const isCompleted = b.status === "COMPLETED";
                        const isCancelled = b.status === "CANCELLED";
                        const isConfirmed = b.status === "CONFIRMED";
                        const isFailed = b.status === "FAILED";
                        
                        let statusClass = "bg-yellow-50 text-yellow-600 border border-yellow-200/50";
                        if (isCompleted) statusClass = "bg-green-50 text-green-600 border border-green-200/50";
                        if (isCancelled || isFailed) statusClass = "bg-red-50 text-red-600 border border-red-200/50";
                        if (isConfirmed) statusClass = "bg-purple-50 text-purple-600 border border-purple-200/50";

                        let serviceIcon = "🩺";
                        if (b.serviceType === "GROOMING") serviceIcon = "✂️";
                        if (b.serviceType === "VET_ON_CALL") serviceIcon = "📞";
                        if (b.serviceType === "VET_CLINIC") serviceIcon = "🏥";

                        return (
                          <tr key={b.id} className="hover:bg-[#F8F8F8]/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#FF10F0]/10 flex items-center justify-center text-sm">
                                  {serviceIcon}
                                </div>
                                <span className="font-bold text-sm capitalize">{b.serviceType.replace(/_/g, " ").toLowerCase()}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-[#54414d] font-mono">#{b.id.slice(-6)}</td>
                            <td className="px-6 py-4 text-sm text-[#54414d]">
                              {format(new Date(b.slotStart), "MMM dd, yyyy")}
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn("px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", statusClass)}>
                                {b.status.toLowerCase()}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 4. Available Coupons Section */}
            <section id="coupons" className="space-y-4 scroll-mt-24">
              <h3 className="text-lg font-bold text-[#121212] flex items-center gap-2">
                <span className="text-[#FF10F0]">🎟️</span>
                Available Coupons
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-[#FF10F0]/5 border border-[#FF10F0]/20 p-5 rounded-[24px] flex justify-between items-center relative overflow-hidden group hover:bg-[#FF10F0]/10 transition-all cursor-pointer">
                  <div className="z-10">
                    <span className="text-[10px] font-bold text-[#FF10F0] uppercase tracking-widest block mb-1">Limited Time</span>
                    <h4 className="font-extrabold text-lg text-[#FF10F0] tracking-tighter">PAW50</h4>
                    <p className="text-xs text-[#54414d] mt-0.5 font-medium">Flat 50% off on all grooming</p>
                  </div>
                  <div className="z-10 bg-[#FF10F0] text-white px-3 py-1 rounded-lg font-bold text-xs">
                    USE
                  </div>
                </div>

                <div className="bg-white border border-[#EDE4EB] p-5 rounded-[24px] flex justify-between items-center relative overflow-hidden group hover:border-[#FF10F0]/20 transition-all cursor-pointer">
                  <div className="z-10">
                    <span className="text-[10px] font-bold text-[#54414d] uppercase tracking-widest block mb-1">New User</span>
                    <h4 className="font-extrabold text-lg text-[#121212] tracking-tighter">WELCOME10</h4>
                    <p className="text-xs text-[#54414d] mt-0.5 font-medium">Get 10% off your next booking</p>
                  </div>
                  <div className="z-10 bg-[#121212] text-white px-3 py-1 rounded-lg font-bold text-xs">
                    USE
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-[#121212]/40 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white p-8 rounded-[24px] shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-[#ba1a1a]/10 text-[#ba1a1a] rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <LogOut className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#121212] text-center mb-2">Ready to leave?</h3>
            <p className="text-[#54414d] text-center mb-8">Are you sure you want to log out of your PawCare dashboard?</p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-3 border border-[#EDE4EB] rounded-xl font-bold hover:bg-[#F8F8F8] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 py-3 bg-[#ba1a1a] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-[#ba1a1a]/20 transition-all"
              >
                {isLoggingOut ? "Leaving..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
