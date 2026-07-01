"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Plus, X, Sparkles, ArrowRight, Clock, PartyPopper, Copy, CheckCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
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

const PawSvg = ({ color = "#A7009D", size = 18 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 44 44">
    <ellipse cx="12" cy="16" rx="4.2" ry="5.4" fill={color} />
    <ellipse cx="22" cy="11" rx="3.8" ry="4.8" fill={color} />
    <ellipse cx="32" cy="16" rx="4.2" ry="5.4" fill={color} />
    <ellipse cx="22" cy="6" rx="2.8" ry="3.4" fill={color} />
    <ellipse cx="22" cy="29" rx="9.5" ry="8.2" fill={color} />
  </svg>
);

/* ---- Confetti Particle Component ---- */
const ConfettiParticle = ({ delay, color, left }: { delay: number; color: string; left: number }) => (
  <div
    className="absolute w-3 h-3 rounded-sm"
    style={{
      left: `${left}%`,
      top: "-10px",
      background: color,
      animation: `confetti-fall 1.5s ease-out ${delay}s forwards`,
      transform: `rotate(${Math.random() * 360}deg)`,
    }}
  />
);

/* ---- Celebration Modal ---- */
const CelebrationModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("PAWS20").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  const confettiColors = ["#A7009D", "#CC00BE", "#E040D0", "#F5D6F5", "#A7FFD7", "#FEF3C7", "#DBEAFE", "#D1FAE5"];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(26,10,24,0.6)] backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-white rounded-[28px] p-8 md:p-10 max-w-md w-[90%] text-center animate-pop shadow-[0_40px_100px_rgba(26,10,24,0.3)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <ConfettiParticle
              key={i}
              delay={Math.random() * 0.5}
              color={confettiColors[i % confettiColors.length]}
              left={Math.random() * 100}
            />
          ))}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F3EEF1] flex items-center justify-center hover:bg-[#EDE4EB] transition-colors z-10"
        >
          <X className="w-4 h-4 text-[#5C3A58]" />
        </button>

        {/* Party icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#A7009D] to-[#E040D0] flex items-center justify-center mx-auto mb-5 shadow-[0_12px_40px_rgba(167,0,157,0.3)]">
          <PartyPopper className="w-10 h-10 text-white" />
        </div>

        <h3 className="text-[26px] font-extrabold text-[#1a0a18] mb-2">
          🎉 Coupon Claimed!
        </h3>
        <p className="text-[15px] text-[#8A6888] mb-6 leading-relaxed">
          You&apos;ve successfully claimed your <strong className="text-[#1a0a18]">20% discount</strong>. Apply it at checkout during payment.
        </p>

        {/* Coupon code card */}
        <div className="bg-gradient-to-r from-[#FBF0FB] to-[#F5D6F5] rounded-[18px] p-5 mb-6 border border-[#A7009D]/10">
          <div className="text-[11px] text-[#8A6888] font-bold uppercase tracking-[0.1em] mb-2">Your Coupon Code</div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-[32px] font-extrabold text-[#A7009D] tracking-[0.1em] font-mono">PAWS20</span>
            <button
              onClick={handleCopy}
              className="w-10 h-10 rounded-xl bg-white border border-[#A7009D]/20 flex items-center justify-center hover:bg-[#A7009D] hover:text-white transition-all group"
            >
              {copied ? (
                <CheckCheck className="w-4 h-4 text-[#16a34a]" />
              ) : (
                <Copy className="w-4 h-4 text-[#A7009D] group-hover:text-white" />
              )}
            </button>
          </div>
          {copied && (
            <div className="text-[12px] text-[#16a34a] font-semibold mt-2 animate-fade-in-up">
              ✓ Copied to clipboard!
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onClose();
              // Open Ask Cano to book
              const fab = document.getElementById("ask-cano-fab");
              if (fab) fab.click();
            }}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#A7009D] to-[#CC00BE] text-white text-[15px] font-bold flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(167,0,157,0.3)] hover:shadow-[0_12px_32px_rgba(167,0,157,0.4)] hover:scale-[1.01] transition-all"
          >
            Book Now & Apply
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="text-[13px] text-[#8A6888] font-medium hover:text-[#1a0a18] transition-colors"
          >
            I&apos;ll use it later
          </button>
        </div>

        <div className="mt-4 text-[11px] text-[#8A6888]/60">
          Valid on your first booking • No minimum order
        </div>
      </div>
    </div>
  );
};

const HeroSection = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [pets, setPets] = useState<ApiPet[]>([]);
  const [petsLoaded, setPetsLoaded] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const [addingPet, setAddingPet] = useState(false);
  const [form, setForm] = useState({ name: "", type: "dog" as "dog" | "cat", breed: "", age: "2", weight: "8" });
  const [activePetIndex, setActivePetIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

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
      setActivePetIndex(pets.length);
      setShowAddPet(false);
      setForm({ name: "", type: "dog", breed: "", age: "2", weight: "8" });
    } catch {
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

  const openAskCano = () => {
    const fab = document.getElementById("ask-cano-fab");
    if (fab) fab.click();
  };

  const scrollToServices = () => {
    const el = document.getElementById("services-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const activePet = pets[activePetIndex];

  return (
    <section className="px-6 pt-5 pb-3">
      {/* ===== MOBILE LAYOUT ===== */}
      <div className="md:hidden">
        <div className="flex flex-col gap-4">
          {/* Pet card */}
          {!petsLoaded ? (
            <div className="bg-white rounded-[20px] border border-[#EDE4EB] p-4 flex items-center gap-3.5 animate-pulse">
              <div className="w-14 h-14 rounded-full bg-[#FFF0FC] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#FFF0FC] rounded w-24" />
                <div className="h-3 bg-[#FFF0FC] rounded w-40" />
              </div>
            </div>
          ) : pets.length === 0 ? (
            <button
              onClick={() => setShowAddPet(true)}
              className="bg-white rounded-[20px] border border-dashed border-[#FF10F0]/30 p-4 flex items-center gap-3.5 w-full text-left transition-all hover:bg-[#FFF0FC] active:scale-[0.99]"
            >
              <div className="w-14 h-14 rounded-full bg-[#FFF0FC] flex items-center justify-center shrink-0">
                <Plus className="w-6 h-6 text-[#FF10F0]" />
              </div>
              <div>
                <div className="font-bold text-[15px] text-[#121212]">Add Your Pet</div>
                <div className="text-[12px] text-[#4A4A4A] mt-0.5">Register your pet for custom scheduling</div>
              </div>
            </button>
          ) : (
            <div className="bg-white rounded-[20px] border border-[#EDE4EB] p-4 flex items-center gap-3.5 shadow-card">
              <div className="w-14 h-14 rounded-full bg-[#FFF0FC] flex items-center justify-center text-[28px] shrink-0">
                {PET_EMOJIS[activePet?.type ?? "dog"]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[17px] font-extrabold text-[#121212] truncate">{activePet?.name ?? "Your Pet"}</div>
                <div className="text-[12px] text-[#4A4A4A] mt-0.5 truncate">
                  {[activePet?.breed, activePet?.age ? `${activePet.age} yrs` : null, activePet?.weight ? `${activePet.weight} kg` : null]
                    .filter(Boolean).join(" · ")}
                </div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  <span className="bg-[#E6F9F0] text-[#10B981] text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-[0.6px] uppercase flex items-center gap-1">
                    ✓ Vaccinated
                  </span>
                  {pets.length > 1 && (
                    <span className="bg-[#FEF3C7] text-[#78350F] text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-[0.6px] uppercase">
                      +{pets.length - 1} more
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowAddPet(true)}
                className="w-8 h-8 rounded-full bg-[#FFF0FC] border-none flex items-center justify-center shrink-0 active:scale-90 transition-transform"
              >
                <Plus className="w-4 h-4 text-[#FF10F0]" />
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
                    background: i === activePetIndex ? "#FF10F0" : "#EDE4EB",
                  }}
                />
              ))}
            </div>
          )}
 
          {/* Hero promo banner */}
          <div className="rounded-[24px] p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #390035 0%, #A7009D 50%, #FF10F0 100%)" }}>
            <div className="absolute -top-[30px] -right-[30px] w-[140px] h-[140px] rounded-full bg-white/[0.08]" />
            <div className="absolute right-6 top-8 w-[80px] h-[80px] rounded-full bg-white/[0.04]" />
            <div className="absolute right-2.5 -bottom-[18px] opacity-[0.12]">
              <PawSvg color="#fff" size={84} />
            </div>
 
            <div className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-md mb-3">
              <div className="w-[6px] h-[6px] rounded-full bg-[#10B981] animate-blink" />
              <span className="text-[10px] text-white font-extrabold tracking-[0.08em] uppercase">INSTANT BOOKING</span>
            </div>
 
            <div className="text-[23px] font-extrabold text-white leading-[1.2] mb-1.5">
              Need a pet service<br />right now?
            </div>
            <div className="text-[12px] text-white/80 mb-5 leading-normal">
              Grooming, vet & food — book in under 30 seconds
            </div>
 
            <button
              onClick={openAskCano}
              className="w-full py-3.5 px-6 border-none rounded-full bg-white text-[#FF10F0] text-[15px] font-extrabold cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98]"
            >
              <PawSvg color="#FF10F0" size={16} /> Book Now — Instantly
              <ArrowRight className="w-4 h-4 text-[#FF10F0]" />
            </button>
          </div>
 
          {/* Promo strip */}
          <div className="bg-[#121212] rounded-[20px] px-5 py-4 flex items-center justify-between border border-white/5 shadow-card">
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-extrabold text-white leading-normal">First booking 20% off!</div>
              <div className="text-[12px] text-white/50 mt-0.5">
                Use code <strong className="text-[#FF10F0] font-mono tracking-[0.04em]">PAWS20</strong> at checkout
              </div>
            </div>
            <button
              onClick={() => setShowCelebration(true)}
              className="bg-[#FF10F0] text-white border-none rounded-full px-5 py-2.5 text-[12px] font-extrabold cursor-pointer whitespace-nowrap transition-transform active:scale-95"
            >
              Claim →
            </button>
          </div>
        </div>
      </div>
 
      {/* ===== DESKTOP LAYOUT ===== */}
      <div className="hidden md:block">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-stack-lg">
          {/* Left Column: User Profile & Promo */}
          <aside className="lg:col-span-3 space-y-stack-md flex flex-col gap-4">
            {!petsLoaded ? (
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 relative overflow-hidden p-4 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed-dim flex items-center justify-center mb-2" />
                <div className="h-5 bg-primary-fixed-dim rounded w-24 mb-2" />
                <div className="h-4 bg-surface-container-high rounded w-36" />
              </div>
            ) : pets.length === 0 ? (
              <button
                onClick={() => setShowAddPet(true)}
                className="group w-full bg-surface-container-lowest rounded-xl shadow-sm border-2 border-dashed border-primary/30 p-6 flex flex-col items-center gap-3 text-center hover:border-primary hover:bg-primary-fixed/10 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-fixed-dim flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-headline-sm text-on-surface">Add Your Pet</h3>
                  <p className="text-on-surface-variant font-body-md">Register your fur baby to get started</p>
                </div>
              </button>
            ) : (
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 relative overflow-hidden p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed-dim flex items-center justify-center text-[28px]">
                    {PET_EMOJIS[activePet?.type ?? "dog"]}
                  </div>
                  <button
                    onClick={() => setShowAddPet(true)}
                    className="bg-surface-container-high p-1.5 rounded-full hover:bg-primary-fixed transition-colors"
                  >
                    <Plus className="w-4 h-4 text-on-surface" />
                  </button>
                </div>
                <h2 className="font-headline-sm text-on-surface">{activePet?.name ?? "Doggo"}</h2>
                <p className="text-on-surface-variant font-body-md mb-3">
                  {[activePet?.breed, activePet?.age ? `${activePet.age} yrs` : null, activePet?.weight ? `${activePet.weight} kg` : null]
                    .filter(Boolean).join(" • ")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[9px] font-bold flex items-center gap-1 uppercase">
                    <Check className="w-2.5 h-2.5" /> Vaccinated
                  </span>
                  <span className="px-2 py-0.5 bg-primary-fixed text-primary rounded-full text-[9px] font-bold flex items-center gap-1 uppercase">
                    <Sparkles className="w-2.5 h-2.5" /> Premium
                  </span>
                </div>
 
                {/* Dynamic pet selector dots */}
                {pets.length > 1 && (
                  <div className="flex gap-1.5 justify-center mt-3 pt-3 border-t border-outline-variant/20">
                    {pets.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePetIndex(i)}
                        className="rounded-full transition-all"
                        style={{
                          width: i === activePetIndex ? 20 : 8,
                          height: 8,
                          background: i === activePetIndex ? "var(--color-primary)" : "#EDE4EB",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
 
            {/* Promo Card */}
            <div className="rounded-xl p-6 text-white shadow-lg relative overflow-hidden group" style={{ background: "linear-gradient(135deg, #390035 0%, #A7009D 55%, #CC00BE 100%)" }}>
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                  <PartyPopper className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-headline-sm mb-1 text-white">First booking 20% off!</h3>
                <p className="text-white/80 text-xs mb-6 font-medium">
                  Code <span className="bg-white/20 px-2 py-0.5 rounded font-mono">PAWS20</span>
                </p>
                <button
                  onClick={() => setShowCelebration(true)}
                  className="w-full bg-white text-[#A7009D] font-bold py-3 rounded-full flex items-center justify-center gap-2 hover:bg-white/90 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-[0.99] cursor-pointer"
                >
                  Claim Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
 
          {/* Right Column: Hero Banner */}
          <div className="lg:col-span-9">
            <div className="relative w-full h-full rounded-3xl overflow-hidden bg-primary-container group min-h-[320px] flex flex-col justify-center">
              <img
                alt="Happy dog playing"
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay scale-105 group-hover:scale-100 transition-transform duration-700"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwIHJfitccMzBfuBBTAmzIH29hPmcwvtI8rY1Zx9Hka_AiGVZ_-2z5Yxy47VtJCBy6x23Uup4yrplWXrvl6inJcTiFXxmo6ofpDJPfGN_ORZ16fyXgA9W40_PkY2ktapzGUH38UX78xAnEpzXPveBXeH7nm0VrErNwf7QJfiy56lrVC5HbJ3-pToewg6ZP9D3cs9BLUSuWounzX_j6sh8n8hM-m7tcGEA18DbtKtQiQQzUSkuebCVvYFa_Kd8PW7RgXW-o0aR-3sg"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/40 to-transparent"></div>
              <div className="relative h-full flex flex-col justify-center px-12 text-on-primary max-w-2xl py-8">
                <div className="flex items-center gap-4 mb-6">
                  <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-white">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Instant Booking Available
                  </span>
                  <span className="px-4 py-1.5 bg-black/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-white">
                    <Clock className="w-3.5 h-3.5" /> 60s to book
                  </span>
                </div>
                <h1 className="font-display-lg text-white mb-6 leading-tight">Need a pet service right now?</h1>
                <p className="font-body-lg text-white/90 mb-10 max-w-md">
                  Grooming, veterinary care & premium food — discover everything your pet needs, booked in under 60 seconds.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={openAskCano}
                    className="px-6 py-3 bg-white text-primary rounded-full font-bold flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm cursor-pointer"
                  >
                    <PawSvg color="var(--color-primary)" size={16} /> Book Now — Instantly <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={scrollToServices}
                    className="px-6 py-3 bg-transparent border-2 border-white/40 text-white rounded-full font-bold hover:bg-white/10 transition-all text-sm cursor-pointer"
                  >
                    Explore Services
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* Celebration Modal */}
      <CelebrationModal open={showCelebration} onClose={() => setShowCelebration(false)} />
 
      {/* Add Pet Popup */}
      {showAddPet && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[rgba(26,10,24,0.5)] backdrop-blur-sm" onClick={() => setShowAddPet(false)}>
          <div
            className="w-full max-w-lg bg-white rounded-t-[28px] md:rounded-[28px] p-6 pb-10 md:pb-8 animate-fade-in-up md:shadow-[0_40px_100px_rgba(26,10,24,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-[18px] text-[#121212]">Add Your Pet</h3>
              <button
                onClick={() => setShowAddPet(false)}
                className="w-8 h-8 rounded-full bg-[#F3EEF1] flex items-center justify-center hover:bg-[#EDE4EB] transition-colors"
              >
                <X className="w-4 h-4 text-[#5C3A58]" />
              </button>
            </div>
 
            <div className="flex gap-2 mb-4">
              {(["dog", "cat"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className="flex-1 h-12 rounded-[14px] text-[14px] font-bold capitalize transition-all"
                  style={{
                    border: form.type === t ? "2px solid #FF10F0" : "1.5px solid #EDE4EB",
                    background: form.type === t ? "rgba(255, 16, 240, 0.08)" : "white",
                    color: form.type === t ? "#121212" : "#4A4A4A",
                  }}
                >
                  {PET_EMOJIS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
 
            <div className="space-y-3 mb-5">
              <input placeholder="Pet name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full h-12 rounded-[14px] border border-[#DDD0DA] px-4 text-[14px] text-[#121212] outline-none focus:border-[#FF10F0] bg-white transition-colors" />
              <input placeholder="Breed (e.g. Labrador)" value={form.breed} onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))} className="w-full h-12 rounded-[14px] border border-[#DDD0DA] px-4 text-[14px] text-[#121212] outline-none focus:border-[#FF10F0] bg-white transition-colors" />
              <div className="flex gap-3">
                <input placeholder="Age (yrs)" type="number" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} className="flex-1 h-12 rounded-[14px] border border-[#DDD0DA] px-4 text-[14px] text-[#121212] outline-none focus:border-[#FF10F0] bg-white transition-colors animate-none" />
                <input placeholder="Weight (kg)" type="number" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} className="flex-1 h-12 rounded-[14px] border border-[#DDD0DA] px-4 text-[14px] text-[#121212] outline-none focus:border-[#FF10F0] bg-white transition-colors animate-none" />
              </div>
            </div>
 
            <button
              onClick={handleAddPet}
              disabled={!form.name.trim() || addingPet}
              className="w-full h-[52px] rounded-full text-white text-[15px] font-bold transition-all disabled:opacity-40 hover:shadow-[0_8px_24px_rgba(255,16,240,0.3)] hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg, #FF10F0, #A7009D)" }}
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
