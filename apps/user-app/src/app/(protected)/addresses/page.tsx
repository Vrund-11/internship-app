"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, Heart, ArrowLeft, MapPin, Home, Briefcase, AlertCircle } from "lucide-react";
import AppShell from "@/features/layout/components/AppShell";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Address } from "@/shared/types";
import { cn } from "@/shared/lib/utils";
import { states, cities } from "@/features/booking/data/locations";
import { validateHouse, validateArea, validatePincode } from "@canovet/shared";

const labelIcons: Record<string, React.ReactNode> = {
  Home: <Home className="w-6 h-6 text-[#FF10F0]" />,
  Office: <Briefcase className="w-6 h-6 text-[#FF10F0]" />,
  Other: <MapPin className="w-6 h-6 text-[#FF10F0]" />,
};

interface AddressForm {
  label: string;
  house: string;
  area: string;
  state: string;
  city: string;
  pincode: string;
}

type ApiAddress = {
  id: string;
  text?: string;
  label?: string;
  house?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

const toDisplayAddress = (address: ApiAddress): Address => ({
  id: address.id,
  label: address.label ?? (address.text?.startsWith("Clinic") ? "Clinic" : "Home"),
  house: address.house ?? address.text ?? "",
  area: address.area ?? "",
  city: address.city ?? "Ahmedabad",
  state: address.state ?? "Gujarat",
  pincode: address.pincode ?? "000000",
});

export default function AddressesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Add Address modal states
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [form, setForm] = useState<AddressForm>({
    label: "Home",
    house: "",
    area: "",
    state: "",
    city: "",
    pincode: "",
  });
  const [formError, setFormError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);

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
    setForm((prev) => ({
      ...prev,
      city: s.city,
      state: s.state,
      area: s.area,
      pincode: s.pincode,
    }));
    setSelectedCoords({
      latitude: s.latitude,
      longitude: s.longitude,
    });
    setSuggestions([]);
  };

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/booking/addresses");
      const apiAddresses = (res.data.addresses ?? []) as ApiAddress[];
      
      // Filter out clinic addresses for profile management
      const userAddresses = apiAddresses
        .map((addr) => toDisplayAddress(addr))
        .filter((addr) => addr.label !== "Clinic");
        
      setAddresses(userAddresses);
      setError("");
    } catch {
      setError("Failed to load your addresses list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  const handleAddAddress = async () => {
    if (!form.state) {
      setFormError("Please select a state or enter an address");
      return;
    }
    if (!form.city) {
      setFormError("Please select a valid city");
      return;
    }
    
    const houseErr = validateHouse(form.house);
    if (houseErr) {
      setFormError(houseErr);
      return;
    }

    const areaErr = validateArea(form.area);
    if (areaErr) {
      setFormError(areaErr);
      return;
    }

    const pincodeErr = validatePincode(form.pincode);
    if (pincodeErr) {
      setFormError(pincodeErr);
      return;
    }

    setAddingAddress(true);
    setFormError("");

    try {
      const res = await api.post("/booking/addresses", {
        label: form.label,
        house: form.house.trim(),
        area: form.area.trim(),
        city: form.city,
        state: form.state,
        pincode: form.pincode.trim(),
        latitude: selectedCoords?.latitude,
        longitude: selectedCoords?.longitude,
      });

      const created = toDisplayAddress(res.data as ApiAddress);
      setAddresses((prev) => [...prev, created]);
      setShowAddAddress(false);
      setForm({ label: "Home", house: "", area: "", state: "", city: "", pincode: "" });
      setSearchQuery("");
      setSelectedCoords(null);
    } catch {
      setFormError("Failed to add address. Please try again.");
    } finally {
      setAddingAddress(false);
    }
  };

  const isSelectedCityActive = form.city ? (form.city.toLowerCase() === "ahmedabad") : false;

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
              <h1 className="font-extrabold text-[24px] text-[#121212]">My Addresses</h1>
            </div>
            <button
              onClick={() => setShowAddAddress(true)}
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
                    <div className="w-12 h-12 rounded-[14px] bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-2/3" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-dashed border-[#EDE4EB] p-8 text-center shadow-sm">
              <div className="text-[32px] opacity-50 mb-2">🏠</div>
              <div className="text-[14px] text-[#121212] font-bold mb-1">No addresses saved</div>
              <div className="text-[12px] text-[#4A4A4A]">Save addresses to easily book services</div>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="bg-white p-5 rounded-2xl shadow-sm flex items-start gap-4 hover:shadow-md transition-all border border-[#EDE4EB]/50">
                  <div className="w-[44px] h-[44px] rounded-xl bg-[#FFF0FC] flex items-center justify-center shrink-0 mt-0.5">
                    {labelIcons[addr.label] || <MapPin className="w-5 h-5 text-[#FF10F0]" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-extrabold text-[15px] text-[#121212]">{addr.label}</div>
                    <div className="text-[12px] text-[#4A4A4A] mt-1.5 leading-[1.4] font-semibold">
                      {addr.house}, {addr.area}
                    </div>
                    <div className="text-[12px] text-[#4A4A4A] mt-0.5 leading-[1.4] font-semibold">
                      {addr.city}, {addr.state} - {addr.pincode}
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
                  Location Registry
                </span>
                <h1 className="font-extrabold text-3xl mt-3">Saved Addresses</h1>
                <p className="text-white/80 text-sm mt-2 max-w-xl font-medium">
                  Manage your locations here to quickly schedule at-home services with certified partners.
                </p>
              </div>
              <button
                onClick={() => setShowAddAddress(true)}
                className="flex items-center gap-2 bg-white text-[#A7009D] hover:bg-white/95 active:scale-95 transition-all font-extrabold px-6 py-4 rounded-xl shadow-lg shrink-0 text-sm"
              >
                <Plus className="w-4.5 h-4.5" />
                Add New Address
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl p-4">
              {error}
            </div>
          )}

          {/* Addresses Grid (Desktop) */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-[24px] border border-[#EDE4EB] p-6 animate-pulse space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[14px] bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-2/3" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-dashed border-[#EDE4EB] p-12 text-center max-w-md mx-auto shadow-sm">
              <div className="text-[40px] mb-4">🏠</div>
              <h3 className="font-bold text-[18px] text-[#121212] mb-1">No saved addresses</h3>
              <p className="text-xs text-muted-foreground mb-6">Save addresses to quickly book services</p>
              <button
                onClick={() => setShowAddAddress(true)}
                className="inline-flex items-center gap-2 bg-[#A7009D] hover:bg-[#A7009D]/90 text-white font-bold px-6 py-3 rounded-full transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Your First Address
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-white rounded-[24px] border border-[#EDE4EB] p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group hover:border-[#FF10F0]/20"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FFF0FC] flex items-center justify-center shrink-0">
                      {labelIcons[addr.label] || <MapPin className="w-6 h-6 text-[#FF10F0]" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-[17px] text-[#121212]">{addr.label}</h3>
                      <p className="text-[13px] text-[#4A4A4A] mt-2 font-semibold leading-relaxed">
                        {addr.house}, {addr.area}
                      </p>
                      <p className="text-[13px] text-[#4A4A4A] mt-0.5 font-semibold">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Address Popup Modal (Centered overlay matching user design) */}
      {showAddAddress && (
        <div
          className="fixed inset-0 bg-[#121212]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setShowAddAddress(false)}
        >
          <div
            className="bg-white p-8 rounded-[24px] shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#121212]">Add New Address</h3>
              <button
                onClick={() => setShowAddAddress(false)}
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

            {/* Address Label Picker */}
            <div className="flex gap-3 mb-5">
              {["Home", "Office", "Other"].map((l) => (
                <button
                  key={l}
                  onClick={() => setForm((f) => ({ ...f, label: l }))}
                  className="flex-1 h-11 rounded-xl text-xs font-bold capitalize transition-all flex items-center justify-center gap-1.5 border"
                  style={{
                    borderColor: form.label === l ? "#FF10F0" : "#EDE4EB",
                    background: form.label === l ? "#FFF0FC" : "white",
                    color: form.label === l ? "#FF10F0" : "#4A4A4A",
                  }}
                >
                  <span className="shrink-0 scale-90">
                    {l === "Home" ? <Home className="w-4 h-4" /> : l === "Office" ? <Briefcase className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                  </span>
                  <span>{l}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4 mb-5">
              <div className="relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Search Address (Mapbox suggestions)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search area, landmark or neighborhood..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full h-12 rounded-xl border border-[#EDE4EB] px-4 text-sm text-[#121212] outline-none focus:border-[#FF10F0] bg-white transition-colors font-semibold"
                  />
                  {loadingSuggestions && (
                    <div className="absolute right-3.5 top-4 animate-spin w-4 h-4 border-2 border-[#FF10F0] border-t-transparent rounded-full" />
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

              {form.city && !isSelectedCityActive && (
                <div className="flex items-start gap-2 bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 leading-snug font-medium">
                    We are not available in {form.city} yet. Stay tuned!
                  </p>
                </div>
              )}

              {form.city && isSelectedCityActive && (
                <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">House / Flat / Floor *</label>
                    <input
                      placeholder="e.g. Flat 402, Shahpur"
                      value={form.house}
                      onChange={(e) => setForm((f) => ({ ...f, house: e.target.value }))}
                      className="w-full h-12 rounded-xl border border-[#EDE4EB] px-4 text-sm text-[#121212] outline-none focus:border-[#FF10F0] bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Area / Landmark *</label>
                    <input
                      placeholder="e.g. Near Riverfront"
                      value={form.area}
                      onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                      className="w-full h-12 rounded-xl border border-[#EDE4EB] px-4 text-sm text-[#121212] outline-none focus:border-[#FF10F0] bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pincode *</label>
                    <input
                      placeholder="e.g. 380001"
                      value={form.pincode}
                      onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                      className="w-full h-12 rounded-xl border border-[#EDE4EB] px-4 text-sm text-[#121212] outline-none focus:border-[#FF10F0] bg-white transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleAddAddress}
              disabled={!form.house.trim() || !form.area.trim() || !form.pincode.trim() || !form.city || !isSelectedCityActive || addingAddress}
              className="w-full h-12 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-40 hover:shadow-lg hover:shadow-[#FF10F0]/20 flex items-center justify-center bg-[#FF10F0] mt-2"
            >
              {addingAddress ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Address...
                </>
              ) : (
                "Save Address"
              )}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
