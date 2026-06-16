"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Bell, CheckCircle2, Phone, Star } from "lucide-react";
import { ServiceType } from "@canovet/shared";
import {
  getServiceCategory,
  resolveServiceType,
  getServiceSlug,
} from "@/features/home/data/services";
import { Button } from "@/shared/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// Indian phone: 10 digits starting with 6-9
const PHONE_REGEX = /^[6-9]\d{9}$/;

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const type = (params?.type as string) || "grooming";
  const serviceType = resolveServiceType(type);
  const service = getServiceCategory(type);
  const clinicService = getServiceCategory(ServiceType.VET_CLINIC);

  const { user } = useAuth();
  const [notifyPhone, setNotifyPhone] = useState("");
  const [notifyError, setNotifyError] = useState("");
  const [notifySubmitted, setNotifySubmitted] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [wantsFaster, setWantsFaster] = useState(false);

  // Redesign Plan States
  const [groomingPlan, setGroomingPlan] = useState<"bath" | "haircut" | "spa" | "nails">("bath");
  const [vetPlan, setVetPlan] = useState<"vet-on-call" | "at-clinic">("vet-on-call");

  const activeGroomingPlanInfo = useMemo(() => {
    const plans = {
      bath: { name: "Bath & Brush", price: 499, duration: "45 min", id: "bath" },
      haircut: { name: "Full Groom", price: 899, duration: "90 min", id: "haircut" },
      spa: { name: "Spa Package", price: 1299, duration: "2 hrs", id: "spa" },
      nails: { name: "Nail Trim", price: 199, duration: "20 min", id: "nails" },
    };
    return plans[groomingPlan];
  }, [groomingPlan]);

  const activeVetPlanInfo = useMemo(() => {
    const plans = {
      "vet-on-call": { name: "Vet on Call", price: 199, duration: "30 min", mode: "vet-on-call", id: "vet-on-call" },
      "at-clinic": { name: "At Clinic", price: 399, duration: "30 min", mode: "at-clinic", id: "at-clinic" },
    };
    return plans[vetPlan];
  }, [vetPlan]);

  // Waitlist status check when user manually enters phone
  const checkWaitlistStatus = async (phone: string) => {
    if (!service || !phone || phone.length !== 10) return;
    try {
      const res = await api.get("/waitlist/check", {
        params: {
          phone,
          serviceType: service.id,
        },
      });
      if (res.data.registered) {
        setNotifySubmitted(true);
      }
    } catch (err) {
      console.error("Error checking waitlist status:", err);
    }
  };

  const handleNotifySubmit = async () => {
    const cleaned = notifyPhone.replace(/\s+/g, "").replace(/^\+91/, "");
    
    if (!cleaned) {
      setNotifyError("Please enter your phone number");
      return;
    }
    if (!PHONE_REGEX.test(cleaned)) {
      setNotifyError("Enter a valid 10-digit Indian mobile number (starting with 6-9)");
      return;
    }

    setNotifyError("");
    setNotifyLoading(true);

    if (!service) return;

    try {
      await api.post("/waitlist", {
        phone: cleaned,
        serviceType: service.id,
        wantsFaster,
      });
      setNotifyLoading(false);
      setNotifySubmitted(true);
    } catch (err: any) {
      setNotifyLoading(false);
      const errMsg = err.response?.data?.error || "Failed to join waitlist. Please try again.";
      setNotifyError(errMsg);
    }
  };

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <p className="mb-4">Service not found.</p>
        <Button onClick={() => router.push("/home")}>Go Home</Button>
      </div>
    );
  }

  // ---- Coming Soon Design (pet-food, pet-pharma, pet-insurance) ----
  if (service.soon || service.id === "pet-food") {
    const isComingSoon = !!service.soon;

    // determine colors and texts for desktop layout
    let themeColor = "#FFD700"; // Food (Yellow)
    let themeBg = "rgba(255, 215, 0, 0.1)";
    let themeText = "text-[#332200]";
    let bentoTheme = {
      largeTitle: "Premium Brands",
      largeDesc: "Access world-class pet nutrition labels from global leaders, ensuring your companion receives the highest quality proteins and micronutrients available.",
      largeBullets: ["Ethically sourced proteins", "Non-GMO ingredients only", "Clinically tested formulas", "Vet-exclusive access"],
      smallTitle: "Prescription Diets",
      smallDesc: "Specialized formulas for renal, digestive, and metabolic health needs.",
      smallTag: "THERAPEUTIC CARE",
      progressTitle: "Leading Selection",
      progressDesc: "Over 500+ types of wet, dry, and fresh food options curated for every life stage.",
      progressLabel: "500+ Varieties Ready",
      progressVal: "80%",
      deliveryTitle: "Fast Delivery",
      deliveryDesc: "Priority shipping and temperature-controlled logistics for fresh food orders.",
      ctaDesc: "Join our exclusive waitlist and be the first to experience the future of premium pet nutrition and clinical-grade treats."
    };

    if (service.id === "pet-pharma") {
      themeColor = "#10b981"; // Pharma (Mint green)
      themeBg = "rgba(16, 185, 129, 0.1)";
      themeText = "text-[#064e3b]";
      bentoTheme = {
        largeTitle: "Prescription Medicines",
        largeDesc: "A curated selection of specialized pharmaceuticals focusing on complex chronic conditions and preventative health for all breeds.",
        largeBullets: ["Chronic condition management", "Dermatology therapeutics", "Cardiology support", "Oncology prescriptions"],
        smallTitle: "Vaccines",
        smallDesc: "Ultra-refined vaccine protocols to minimize reactivity while maximizing long-term protection.",
        smallTag: "NEXT GEN FORMULA",
        progressTitle: "Joint Care",
        progressDesc: "Advanced structural support using medical-grade hyaluronic acid and Type-II collagen for senior pets.",
        progressLabel: "80% Development Complete",
        progressVal: "80%",
        deliveryTitle: "Specialized Supplements",
        deliveryDesc: "Gut-biome focused nutrition and cognitive support blends formulated by leading clinical researchers.",
        ctaDesc: "Join our exclusive waitlist and be the first to know when our premium pharmaceutical line launches."
      };
    } else if (service.id === "pet-insurance") {
      themeColor = "#930082"; // Insurance (Purple)
      themeBg = "rgba(147, 0, 130, 0.1)";
      themeText = "text-[#3a0032]";
      bentoTheme = {
        largeTitle: "Emergency & Illness",
        largeDesc: "Comprehensive coverage for the unexpected, including advanced surgeries, hospitalisation, and specialist consultations.",
        largeBullets: ["Accident & emergency cover", "Illness & hospitalisation cover", "Surgery & specialist consultations", "No breed or age exclusions"],
        smallTitle: "Routine Wellness",
        smallDesc: "Routine wellness & vaccination coverage to keep your pet healthy year-round.",
        smallTag: "PREVENTATIVE CARE",
        progressTitle: "Cashless Network",
        progressDesc: "Cashless claims at 5000+ clinics nationwide. Focus on your pet, not the paperwork.",
        progressLabel: "5000+ Clinics Ready",
        progressVal: "90%",
        deliveryTitle: "Legal Protection",
        deliveryDesc: "Third-party liability protection built-in to every plan for total peace of mind.",
        ctaDesc: "Join our exclusive waitlist and be the first to know when our comprehensive pet insurance launches."
      };
    }

    return (
      <>
        {/* MOBILE VIEW (unchanged) */}
        <div className="md:hidden min-h-screen bg-white flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div 
              style={{ background: `linear-gradient(140deg, ${service.softColor} 0%, ${service.accentColor}15 100%)` }}
              className="px-5 pt-safe pb-8"
            >
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6 pt-4">
                  <button 
                    onClick={() => router.back()} 
                    className="group w-10 h-10 bg-white/80 backdrop-blur-md border border-white/60 rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)] hover:-translate-x-0.5 active:scale-95 transition-all duration-200"
                  >
                    <ArrowLeft className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
                  </button>
                  <div className="text-[13px] text-muted-foreground font-medium">
                    {isComingSoon ? "Coming Soon" : "Service Details"}
                  </div>
                  <div className="w-10" />
                </div>
                
                <div className="flex items-end">
                  <div>
                    <div 
                      className="w-[72px] h-[72px] rounded-[22px] bg-white flex items-center justify-center mb-4"
                      style={{ boxShadow: `0 8px 24px ${service.accentColor}25` }}
                    >
                      <span className="text-[28px]" style={{ color: service.accentColor }}>{service.emoji}</span>
                    </div>
                    
                    <div className="font-bold text-[28px] text-foreground leading-tight">{service.name}</div>
                    <div className="text-[14px] text-muted-foreground mt-1">{service.tagline}</div>
                    
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <div 
                        className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full tracking-[0.6px] uppercase"
                        style={{ color: service.accentColor, background: `${service.accentColor}20` }}
                      >
                        {isComingSoon ? "Launching Soon" : "Available"}
                      </div>
                      {service.rating && (
                        <div className="text-[13px] font-bold text-foreground">
                          ★ {service.rating} <span className="text-muted-foreground font-normal text-[12px]">({service.reviews})</span>
                        </div>
                      )}
                      {service.price && (
                        <div className="text-[13px] font-bold" style={{ color: service.accentColor }}>
                          From ₹{service.price}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="px-5 py-6">
              <div className="max-w-4xl mx-auto">
                {/* Left: What's included */}
                <div>
                  <div className="font-bold text-[17px] text-foreground mb-3.5">
                    {isComingSoon ? "What's Coming" : "What's Included"}
                  </div>
                  <div className="flex flex-col">
                    {service.includes?.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                        <div 
                          className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: `${service.accentColor}18` }}
                        >
                          <Check className="w-3 h-3" style={{ color: service.accentColor }} />
                        </div>
                        <span className="text-[14px] text-foreground leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Notify Me box */}
                <div className="mt-6">
                  {!notifySubmitted ? (
                    <div className="bg-muted rounded-[18px] p-5 border border-border">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-10 h-10 rounded-[12px] flex items-center justify-center"
                          style={{ background: `${service.accentColor}15` }}
                        >
                          <Bell className="w-5 h-5" style={{ color: service.accentColor }} />
                        </div>
                        <div>
                          <div className="font-bold text-[17px] text-foreground">
                            {isComingSoon ? "Get Early Access" : "Get Notified"}
                          </div>
                          <div className="text-[12px] text-muted-foreground">
                            Be the first to know when we launch
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex gap-2">
                            <div className="h-12 px-3 rounded-xl bg-white flex items-center text-sm font-medium text-foreground border border-border shrink-0">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
                              +91
                            </div>
                            <input 
                              type="tel"
                              inputMode="numeric"
                              placeholder="Enter 10-digit mobile number"
                              value={notifyPhone}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                setNotifyPhone(val);
                                if (notifyError) setNotifyError("");
                              }}
                              className="flex-1 border border-border rounded-xl px-3.5 py-2.5 text-[14px] outline-none text-foreground bg-white focus:border-[#A7009D] transition-colors"
                            />
                          </div>
                          {notifyError && (
                            <div className="mt-2 text-[12px] text-destructive font-medium flex items-center gap-1.5 px-1">
                              <span>⚠️</span> {notifyError}
                            </div>
                          )}
                        </div>

                        <label className="flex items-center gap-2.5 px-1 py-1 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={wantsFaster}
                            onChange={(e) => setWantsFaster(e.target.checked)}
                            className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 accent-primary"
                          />
                          <span className="text-[12px] text-muted-foreground font-medium">
                            I want this service faster (Priority Access)
                          </span>
                        </label>

                        <Button
                          onClick={handleNotifySubmit}
                          disabled={notifyLoading}
                          className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 text-[14px] font-bold"
                        >
                          {notifyLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Submitting...
                            </div>
                          ) : (
                            <>
                              <Bell className="w-4 h-4 mr-2" />
                              Notify Me
                            </>
                          )}
                        </Button>
                        <div className="text-[11px] text-muted-foreground text-center">
                          We&apos;ll send a one-time SMS when this service launches. No spam.
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Success state */
                    <div className="bg-[#D1FAE5] rounded-[18px] p-6 border border-[#16a34a]/10 text-center">
                      <div className="w-16 h-16 rounded-full bg-[#16a34a] flex items-center justify-center mx-auto mb-4 shadow-[0_8px_24px_rgba(22,163,106,0.3)]">
                        <CheckCircle2 className="w-8 h-8 text-white" />
                      </div>
                      <div className="font-extrabold text-[20px] text-[#065F46] mb-2">You&apos;re on the list! 🎉</div>
                      <div className="text-[14px] text-[#065F46]/70 leading-relaxed">
                        We&apos;ll notify you at <strong className="text-[#065F46]">+91 {notifyPhone}</strong> as soon as {service.name} launches.
                      </div>
                      <button
                        onClick={() => router.push("/home")}
                        className="mt-5 text-[13px] font-semibold text-[#065F46] hover:underline"
                      >
                        ← Back to Home
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP VIEW */}
        <div className="hidden md:block min-h-screen bg-[#F9FAFB] pb-24">
          <main className="max-w-[1280px] mx-auto px-10 pt-8">
            {/* Header Top Bar */}
            <div className="flex justify-between items-center mb-10">
              <button
                onClick={() => router.back()}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-white border border-[#d9c0ce]/30 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <ArrowLeft className="w-5 h-5 text-[#54414d]" />
              </button>
              <div className="text-xl font-extrabold text-[#6c005f] tracking-tight">canovet</div>
              <div className="w-12" />
            </div>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-12 pb-20 rounded-3xl mb-12" style={{ background: `linear-gradient(135deg, ${service.accentColor}12 0%, ${service.accentColor}05 100%)` }}>
              <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
                <span className="inline-block px-4 py-1.5 mb-6 rounded-full text-white font-label-sm text-label-sm uppercase tracking-widest font-bold" style={{ background: service.accentColor }}>
                  {isComingSoon ? "Coming Soon" : "Vet-Grade Quality"}
                </span>
                <h1 className="font-display-lg text-[#151c27] mb-6">
                  {service.name}: <span style={{ color: service.accentColor }}>Next-Gen</span> Pet Wellness
                </h1>
                <p className="font-body-lg text-[#54414d] max-w-2xl mx-auto mb-10 leading-relaxed font-semibold">
                  {service.tagline || "Optimize your pet's health with professional-grade support."}
                </p>

                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => {
                      const el = document.getElementById("waitlist-form-desktop");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-white px-10 py-4 rounded-full font-headline-sm flex items-center justify-center gap-2 group hover:shadow-xl transition-all font-bold"
                    style={{ background: service.accentColor }}
                  >
                    Join Waitlist
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Bento Grid */}
            <section className="mb-20">
              <div className="flex flex-col items-center mb-16 text-center">
                <h2 className="font-headline-lg text-[#151c27] mb-4">What&apos;s Coming</h2>
                <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: service.accentColor }}></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Feature Card 1 (Large) */}
                <div className="md:col-span-8 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:border-[#d9c0ce] hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-16 h-16 flex items-center justify-center rounded-2xl mb-6 shadow-sm" style={{ backgroundColor: `${service.accentColor}18`, color: service.accentColor }}>
                      <span className="text-3xl font-bold">✓</span>
                    </div>
                    <h3 className="font-headline-md text-slate-900 mb-4">{bentoTheme.largeTitle}</h3>
                    <p className="font-body-md text-slate-600 mb-6 leading-relaxed font-medium">
                      {bentoTheme.largeDesc}
                    </p>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 font-body-md text-slate-700 font-semibold border-t border-slate-100 pt-6">
                    {bentoTheme.largeBullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span style={{ color: service.accentColor }} className="font-bold">✓</span> {bullet}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Feature Card 2 (Small) */}
                <div className="md:col-span-4 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:border-[#d9c0ce] hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-16 h-16 flex items-center justify-center rounded-2xl mb-6 shadow-sm" style={{ backgroundColor: `${service.accentColor}18`, color: service.accentColor }}>
                      <span className="text-3xl font-bold">📦</span>
                    </div>
                    <h3 className="font-headline-sm text-slate-900 mb-4">{bentoTheme.smallTitle}</h3>
                    <p className="font-body-md text-slate-600 mb-6 font-medium">
                      {bentoTheme.smallDesc}
                    </p>
                  </div>
                  <div className="pt-6 border-t border-slate-100">
                    <span className="px-3 py-1.5 rounded-full font-label-sm uppercase tracking-wider font-extrabold text-white" style={{ backgroundColor: service.accentColor }}>
                      {bentoTheme.smallTag}
                    </span>
                  </div>
                </div>

                {/* Feature Card 3 (Medium) */}
                <div className="md:col-span-6 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:border-[#d9c0ce] hover:shadow-md transition-all">
                  <div className="w-16 h-16 flex items-center justify-center rounded-2xl mb-6 shadow-sm" style={{ backgroundColor: `${service.accentColor}18`, color: service.accentColor }}>
                    <span className="text-3xl font-bold">📊</span>
                  </div>
                  <h3 className="font-headline-md text-slate-900 mb-4">{bentoTheme.progressTitle}</h3>
                  <p className="font-body-md text-slate-600 mb-4 font-medium">
                    {bentoTheme.progressDesc}
                  </p>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: bentoTheme.progressVal, backgroundColor: service.accentColor }}></div>
                    </div>
                    <p className="text-right font-label-sm font-extrabold" style={{ color: service.accentColor }}>{bentoTheme.progressLabel}</p>
                  </div>
                </div>

                {/* Feature Card 4 (Medium) */}
                <div className="md:col-span-6 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:border-[#d9c0ce] hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-16 h-16 flex items-center justify-center rounded-2xl mb-6 shadow-sm" style={{ backgroundColor: `${service.accentColor}18`, color: service.accentColor }}>
                      <span className="text-3xl font-bold">🚚</span>
                    </div>
                    <h3 className="font-headline-md text-slate-900 mb-4">{bentoTheme.deliveryTitle}</h3>
                    <p className="font-body-md text-slate-600 mb-6 font-medium">
                      {bentoTheme.deliveryDesc}
                    </p>
                  </div>
                  <button className="font-label-md flex items-center gap-1 font-extrabold self-start hover:opacity-85" style={{ color: service.accentColor }}>
                    LEARN MORE <span className="rotate-180">←</span>
                  </button>
                </div>
              </div>
            </section>

            {/* CTA Section / Waitlist form */}
            <section id="waitlist-form-desktop" className="bg-white border border-[#d9c0ce]/35 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-sm">
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="font-display-lg text-[#151c27] mb-4">Get Early Access</h2>
                <p className="font-body-lg text-[#54414d] mb-12 font-medium">
                  {bentoTheme.ctaDesc}
                </p>

                {!notifySubmitted ? (
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="flex gap-4">
                      <div className="relative flex-1 group">
                        <div className="relative">
                          <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                            📱
                          </span>
                          <input 
                            type="tel"
                            placeholder="Enter 10-digit mobile number"
                            value={notifyPhone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                              setNotifyPhone(val);
                              if (notifyError) setNotifyError("");
                            }}
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:border-[#6c005f] focus:ring-2 focus:ring-[#6c005f]/20 bg-white text-on-surface placeholder-slate-400 font-body-md outline-none font-bold transition-all"
                          />
                        </div>
                        {notifyError && (
                          <div className="text-left mt-2 text-[12px] text-destructive font-medium flex items-center gap-1.5 px-1">
                            <span>⚠️</span> {notifyError}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleNotifySubmit}
                        disabled={notifyLoading}
                        className="text-white px-8 py-4 rounded-xl font-headline-sm hover:brightness-110 active:scale-95 transition-all shadow-md font-extrabold whitespace-nowrap"
                        style={{ backgroundColor: service.accentColor }}
                      >
                        {notifyLoading ? "Submitting..." : "Notify Me"}
                      </button>
                    </div>

                    <label className="flex items-center gap-2.5 px-1 py-1 cursor-pointer select-none justify-center">
                      <input 
                        type="checkbox"
                        checked={wantsFaster}
                        onChange={(e) => setWantsFaster(e.target.checked)}
                        className="w-4 h-4 rounded focus:ring-[#6c005f] border-gray-300 accent-[#6c005f]"
                      />
                      <span className="text-[12px] text-[#54414d] font-semibold">
                        I want this service faster (Priority Access)
                      </span>
                    </label>
                    
                    <p className="text-xs text-slate-400">Limited to 500 early access spots. We&apos;ll send an SMS when we launch.</p>
                  </div>
                ) : (
                  /* Success state */
                  <div className="bg-[#D1FAE5] max-w-md mx-auto rounded-3xl p-8 border border-[#16a34a]/10 text-center animate-fade-in-up">
                    <div className="w-16 h-16 rounded-full bg-[#16a34a] flex items-center justify-center mx-auto mb-4 shadow-md">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="font-extrabold text-[22px] text-[#065F46] mb-2">You&apos;re on the list! 🎉</div>
                    <div className="text-[15px] text-[#065F46]/70 leading-relaxed mb-4">
                      We&apos;ll notify you at <strong className="text-[#065F46]">+91 {notifyPhone}</strong> as soon as {service.name} launches.
                    </div>
                    <button
                      onClick={() => router.push("/home")}
                      className="text-[14px] font-bold text-[#065F46] hover:underline"
                    >
                      ← Back to Home
                    </button>
                  </div>
                )}
              </div>
            </section>
          </main>
        </div>
      </>
    );
  }

  // ---- Active Service Design ----
  const isGrooming = serviceType === ServiceType.GROOMING;
  const isVetConsultation = serviceType === ServiceType.VET_ON_CALL;

  if (isGrooming) {
    return (
      <>
        {/* MOBILE VIEW (unchanged) */}
        <div className="md:hidden min-h-screen bg-[#F8F8F8] flex flex-col pb-24">
          <div className="flex-1 overflow-y-auto">
            {/* Header Gradient */}
            <div className="bg-gradient-to-b from-[#8b008b] to-[#a7009d] text-white px-5 pt-6 pb-8 flex flex-col items-center relative">
              {/* Header top bar */}
              <div className="w-full flex justify-between items-center mb-6 max-w-md">
                <button
                  onClick={() => router.back()}
                  className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="text-[18px] font-extrabold tracking-wide">cano vet</div>
                <div className="w-10" />
              </div>

              {/* Large Scissor Card */}
              <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center shadow-lg mb-4">
                <span className="text-[34px] select-none">✂️</span>
              </div>

              <h1 className="font-extrabold text-[26px] tracking-tight text-center">Pet Grooming</h1>
              <p className="text-[14px] text-white/80 text-center mt-1.5 px-4">Professional grooming at your doorstep.</p>

              <div className="flex items-center gap-1.5 mt-3 bg-white/10 px-3 py-1 rounded-full text-[12px] font-semibold">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span>4.9</span>
                <span className="text-white/70">(3.2k reviews)</span>
              </div>

              {/* Quick Info Row */}
              <div className="w-full max-w-md grid grid-cols-2 gap-3 mt-6">
                <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-3 text-center">
                  <div className="text-[9px] text-white/60 font-bold tracking-wider uppercase">Duration</div>
                  <div className="text-[14px] font-extrabold mt-0.5">45 min</div>
                </div>
                <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-3 text-center">
                  <div className="text-[9px] text-white/60 font-bold tracking-wider uppercase">For</div>
                  <div className="text-[14px] font-extrabold mt-0.5">All Pets</div>
                </div>
              </div>
            </div>

            {/* Plan Selector */}
            <div className="max-w-md mx-auto px-5 mt-7">
              <h2 className="font-bold text-[16px] text-foreground mb-4">Select Grooming Plan</h2>
              <div className="space-y-3">
                {[
                  { id: "bath", name: "Bath & Brush", price: 499, time: "45 min" },
                  { id: "haircut", name: "Full Groom", price: 899, time: "90 min" },
                  { id: "spa", name: "Spa Package", price: 1299, time: "2 hrs" },
                  { id: "nails", name: "Nail Trim", price: 199, time: "20 min" },
                ].map((plan) => {
                  const isSelected = groomingPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setGroomingPlan(plan.id as any)}
                      className={`w-full flex items-center justify-between bg-white border-2 rounded-2xl p-4 text-left transition-all ${
                        isSelected ? "border-[#a7009d] bg-pink-50/10" : "border-gray-100 hover:border-gray-200"
                      }`}
                      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? "border-[#a7009d]" : "border-gray-300"
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#a7009d]" />}
                        </div>
                        <div>
                          <div className="font-bold text-[15px] text-gray-900">{plan.name}</div>
                          <div className="text-[12px] text-gray-500 mt-0.5">⏱ {plan.time}</div>
                        </div>
                      </div>
                      <div className="font-extrabold text-[17px] text-gray-900">₹{plan.price}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* What's Included */}
            <div className="max-w-md mx-auto px-5 mt-7 mb-8">
              <h2 className="font-bold text-[16px] text-foreground mb-4">What's Included</h2>
              <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3.5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.01)" }}>
                {[
                  "Full bath with premium natural shampoo",
                  "Blow dry & thorough brush out",
                  "Breed-specific custom haircut & style",
                  "Nail trimming, filing & paw massage",
                  "Ear cleaning & eye check",
                  "Complimentary styling bow/bandana",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-pink-50 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-[#a7009d] stroke-[3]" />
                    </div>
                    <span className="text-[13px] font-medium text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Bottom Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-between z-40 max-w-md mx-auto shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
            <div>
              <div className="text-[11px] text-gray-500 font-semibold">{activeGroomingPlanInfo.name}</div>
              <div className="font-extrabold text-[22px] text-gray-900 leading-tight">
                ₹{activeGroomingPlanInfo.price}
                <span className="text-[11px] text-gray-400 font-normal ml-0.5">/session</span>
              </div>
            </div>
            <Button
              onClick={() => router.push(`/service/grooming`)}
              className="h-11 rounded-full bg-[#a7009d] hover:bg-[#a7009d]/90 text-white font-bold px-6 text-[13px]"
            >
              Book Now <ArrowLeft className="w-4 h-4 ml-1.5 rotate-180 text-white" />
            </Button>
          </div>
        </div>

        {/* DESKTOP VIEW */}
        <div className="hidden md:block min-h-screen bg-[#F9FAFB] pb-24">
          <main className="max-w-[1280px] mx-auto px-10 pt-8">
            {/* Header Top Bar */}
            <div className="flex justify-between items-center mb-10">
              <button
                onClick={() => router.back()}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-white border border-[#d9c0ce]/30 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <ArrowLeft className="w-5 h-5 text-[#54414d]" />
              </button>
              <div className="text-xl font-extrabold text-[#6c005f] tracking-tight">canovet</div>
              <div className="w-12" />
            </div>

            {/* Hero Section */}
            <section className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-[#d9c0ce]/20">
                <span className="text-3xl select-none">✂️</span>
              </div>
              <h1 className="font-display-lg text-[#151c27] mb-4">Expert Pet Grooming</h1>
              <p className="font-body-lg text-[#54414d] max-w-2xl mb-8 leading-relaxed">
                Compassionate, high-quality grooming services tailored to your pet&apos;s specific needs, delivered in the comfort of your home.
              </p>

              {/* Stats Row */}
              <div className="flex justify-center gap-6 mb-8 flex-wrap">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[#d9c0ce]/20 shadow-sm">
                  <Star className="w-4 h-4 text-[#FF10F0] fill-[#FF10F0]" />
                  <span className="font-label-md text-[#151c27]">4.9/5.0 Community Rating</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[#d9c0ce]/20 shadow-sm">
                  <span className="text-[#FF10F0] text-sm">✓</span>
                  <span className="font-label-md text-[#151c27]">100% Certified Groomers</span>
                </div>
              </div>

              {/* Status Chips Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                <div className="bg-[#f6d9ff] text-[#603378] px-4 py-3 rounded-xl flex flex-col items-center justify-center border border-[#e6b0ff]">
                  <span className="font-label-sm uppercase opacity-70">Status</span>
                  <span className="font-label-md font-bold text-green-600">Available</span>
                </div>
                <div className="bg-[#f6d9ff] text-[#603378] px-4 py-3 rounded-xl flex flex-col items-center justify-center border border-[#e6b0ff]">
                  <span className="font-label-sm uppercase opacity-70">Next Slot</span>
                  <span className="font-label-md font-bold">2:30 PM</span>
                </div>
                <div className="bg-[#f6d9ff] text-[#603378] px-4 py-3 rounded-xl flex flex-col items-center justify-center border border-[#e6b0ff]">
                  <span className="font-label-sm uppercase opacity-70">Duration</span>
                  <span className="font-label-md font-bold">Varies</span>
                </div>
                <div className="bg-[#f6d9ff] text-[#603378] px-4 py-3 rounded-xl flex flex-col items-center justify-center border border-[#e6b0ff]">
                  <span className="font-label-sm uppercase opacity-70">Ideal For</span>
                  <span className="font-label-md font-bold">Dogs &amp; Cats</span>
                </div>
              </div>
            </section>

            {/* Two Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
              {/* Left Side: Grooming Info & Process */}
              <div className="lg:col-span-7 space-y-8">
                {/* Choose Your Experience - At Home Only */}
                <div className="bg-white p-8 rounded-3xl border border-[#d9c0ce]/30 soft-shadow neon-border-active relative flex flex-col">
                  <div className="absolute top-6 right-6">
                    <span className="text-[#FF10F0] text-3xl">✓</span>
                  </div>
                  <div className="w-16 h-16 bg-[#ffd7f0] rounded-2xl flex items-center justify-center mb-6">
                    <span className="text-[#6c005f] text-2xl">🏠</span>
                  </div>
                  <h3 className="font-headline-md text-[#151c27] mb-3">At Home Grooming</h3>
                  <p className="font-body-md text-[#54414d] mb-6">
                    Professional grooming in the comfort of your home. Ideal for pets who prefer familiar surroundings and a stress-free environment.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 font-body-md text-[#151c27]">
                      <span className="text-[#FF10F0] text-lg">✓</span> Personalised 1-on-1 attention
                    </li>
                    <li className="flex items-center gap-3 font-body-md text-[#151c27]">
                      <span className="text-[#FF10F0] text-lg">✓</span> Zero travel stress for your pet
                    </li>
                    <li className="flex items-center gap-3 font-body-md text-[#151c27]">
                      <span className="text-[#FF10F0] text-lg">✓</span> Clean and sanitary process
                    </li>
                  </ul>
                </div>

                {/* Process Steps */}
                <div>
                  <h3 className="font-headline-md text-[#151c27] mb-6 text-center">The canovet Process</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { step: "01", title: "Consultation", desc: "Understanding breed standards and styling preferences." },
                      { step: "02", title: "Deep Cleanse", desc: "Organic, pet-safe shampoos and deep bathing." },
                      { step: "03", title: "The Groom", desc: "Precision haircut, nail filing, and cleanups." },
                      { step: "04", title: "Final Touch", desc: "Fresh bow/bandana and health report card." }
                    ].map((step, idx) => (
                      <div key={idx} className="bg-white p-6 rounded-2xl border border-[#d9c0ce]/20 soft-shadow relative overflow-hidden group hover:border-[#FF10F0] transition-colors">
                        <div className="text-[#FF10F0] text-4xl opacity-10 absolute top-2 right-4 font-bold group-hover:opacity-20 transition-opacity">{step.step}</div>
                        <h4 className="font-headline-sm text-[#151c27] mb-2">{step.title}</h4>
                        <p className="font-body-md text-[#54414d]">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side: Plan Selection & Booking Sidebar */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-[#d9c0ce]/30 soft-shadow sticky top-24">
                  <h3 className="font-headline-sm text-[#151c27] mb-4">Select Grooming Plan</h3>
                  <div className="space-y-3 mb-6">
                    {[
                      { id: "bath", name: "Bath & Brush", price: 499, time: "45 min" },
                      { id: "haircut", name: "Full Groom", price: 899, time: "90 min" },
                      { id: "spa", name: "Spa Package", price: 1299, time: "2 hrs" },
                      { id: "nails", name: "Nail Trim", price: 199, time: "20 min" },
                    ].map((plan) => {
                      const isSelected = groomingPlan === plan.id;
                      return (
                        <button
                          key={plan.id}
                          onClick={() => setGroomingPlan(plan.id as any)}
                          className={`w-full flex items-center justify-between bg-white border-2 rounded-2xl p-4 text-left transition-all ${
                            isSelected ? "border-[#FF10F0] bg-pink-50/10" : "border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? "border-[#FF10F0]" : "border-gray-300"
                            }`}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#FF10F0]" />}
                            </div>
                            <div>
                              <div className="font-bold text-[15px] text-gray-900">{plan.name}</div>
                              <div className="text-[12px] text-gray-500 mt-0.5">⏱ {plan.time}</div>
                            </div>
                          </div>
                          <div className="font-extrabold text-[17px] text-gray-900">₹{plan.price}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Summary & Button */}
                  <div className="pt-6 border-t border-[#d9c0ce]/20 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs text-gray-500">{activeGroomingPlanInfo.name}</div>
                        <div className="font-extrabold text-2xl text-[#151c27]">₹{activeGroomingPlanInfo.price}</div>
                      </div>
                      <span className="text-[11px] text-gray-400 font-normal">/session</span>
                    </div>

                    <button
                      onClick={() => router.push(`/service/grooming`)}
                      className="w-full h-12 rounded-full bg-[#6c005f] hover:bg-[#6c005f]/95 text-white font-bold transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shadow-sm text-sm"
                    >
                      Book Now <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  if (isVetConsultation) {
    return (
      <>
        {/* MOBILE VIEW (unchanged) */}
        <div className="md:hidden min-h-screen bg-[#F8F8F8] flex flex-col pb-24">
          <div className="flex-1 overflow-y-auto">
            {/* Header Gradient */}
            <div className="bg-gradient-to-b from-[#002984] to-[#1d4ed8] text-white px-5 pt-6 pb-8 flex flex-col items-center relative">
              {/* Header top bar */}
              <div className="w-full flex justify-between items-center mb-6 max-w-md">
                <button
                  onClick={() => router.back()}
                  className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div className="text-[18px] font-extrabold tracking-wide">cano vet</div>
                <div className="w-10" />
              </div>

              {/* Large Heart Card */}
              <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center shadow-lg mb-4">
                <span className="text-[34px] select-none">❤️</span>
              </div>

              <h1 className="font-extrabold text-[26px] tracking-tight text-center">Vet Consultation</h1>
              <p className="text-[14px] text-white/80 text-center mt-1.5 px-4">Certified vets, any time, any mode.</p>

              <div className="flex items-center gap-1.5 mt-3 bg-white/10 px-3 py-1 rounded-full text-[12px] font-semibold">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span>4.8</span>
                <span className="text-white/70">(5.1k reviews)</span>
              </div>

              {/* Quick Info Row */}
              <div className="w-full max-w-md grid grid-cols-2 gap-3 mt-6">
                <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-3 text-center">
                  <div className="text-[9px] text-white/60 font-bold tracking-wider uppercase">Duration</div>
                  <div className="text-[14px] font-extrabold mt-0.5">15-30 min</div>
                </div>
                <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-3 text-center">
                  <div className="text-[9px] text-white/60 font-bold tracking-wider uppercase">For</div>
                  <div className="text-[14px] font-extrabold mt-0.5">All Pets</div>
                </div>
              </div>
            </div>

            {/* Plan Selector */}
            <div className="max-w-md mx-auto px-5 mt-7">
              <h2 className="font-bold text-[16px] text-foreground mb-4">Select Consultation Mode</h2>
              <div className="space-y-3">
                {[
                  { id: "vet-on-call", name: "Vet on Call", price: 199, label: "Expert vet visits your home" },
                  { id: "at-clinic", name: "At Clinic", price: 399, label: "Visit partner clinic near you" },
                ].map((plan) => {
                  const isSelected = vetPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setVetPlan(plan.id as any)}
                      className={`w-full flex items-center justify-between bg-white border-2 rounded-2xl p-4 text-left transition-all ${
                        isSelected ? "border-[#1d4ed8] bg-blue-50/10" : "border-gray-100 hover:border-gray-200"
                      }`}
                      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? "border-[#1d4ed8]" : "border-gray-300"
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#1d4ed8]" />}
                        </div>
                        <div>
                          <div className="font-bold text-[15px] text-gray-900">{plan.name}</div>
                          <div className="text-[12px] text-gray-500 mt-0.5">{plan.label}</div>
                        </div>
                      </div>
                      <div className="font-extrabold text-[17px] text-gray-900">Starts from ₹{plan.price}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* What's Included */}
            <div className="max-w-md mx-auto px-5 mt-7 mb-8">
              <h2 className="font-bold text-[16px] text-foreground mb-4">What's Included</h2>
              <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3.5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.01)" }}>
                {[
                  "Consultation with certified senior vet",
                  "Detailed physical & wellness examination",
                  "Digital prescription instantly on app",
                  "Dietary & nutritional guidance",
                  "Vaccination tracker setup & advice",
                  "Free follow-up chat support for 24 hrs",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-[#1d4ed8] stroke-[3]" />
                    </div>
                    <span className="text-[13px] font-medium text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Bottom Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-between z-40 max-w-md mx-auto shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
            <div>
              <div className="text-[11px] text-gray-500 font-semibold">{activeVetPlanInfo.name}</div>
              <div className="font-extrabold text-[22px] text-gray-900 leading-tight">
                Starts from ₹{activeVetPlanInfo.price}
              </div>
            </div>
            <Button
              onClick={() => router.push(`/service/vet-consultation?mode=${activeVetPlanInfo.mode}`)}
              className="h-11 rounded-full bg-[#1d4ed8] hover:bg-[#1d4ed8]/90 text-white font-bold px-6 text-[13px]"
            >
              Book Now <ArrowLeft className="w-4 h-4 ml-1.5 rotate-180 text-white" />
            </Button>
          </div>
        </div>

        {/* DESKTOP VIEW */}
        <div className="hidden md:block min-h-screen bg-[#F8FAFC] pb-24">
          <main className="max-w-[1280px] mx-auto px-10 pt-8">
            {/* Header Top Bar */}
            <div className="flex justify-between items-center mb-10">
              <button
                onClick={() => router.back()}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="text-xl font-extrabold text-[#1e40af] tracking-tight">canovet</div>
              <div className="w-12" />
            </div>

            {/* Hero Section */}
            <section className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-200">
                <span className="text-[#1e40af] text-3xl font-bold">🩺</span>
              </div>
              <h1 className="font-display-lg text-[#0f172a] mb-4">Expert Vet Consultations</h1>
              <p className="font-body-lg text-[#475569] max-w-2xl mb-8 leading-relaxed">
                Certified veterinarians, any time, any mode. Access veterinary specialists for personalized, high-quality medical guidance.
              </p>

              {/* Stats Row */}
              <div className="flex justify-center gap-6 mb-8 flex-wrap">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-label-md text-slate-800">4.8/5.0 Community Rating</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm">
                  <span className="text-[#1e40af] text-sm">✓</span>
                  <span className="font-label-md text-slate-800">100% Certified Vets</span>
                </div>
              </div>

              {/* Status Chips Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 soft-shadow">
                  <span className="font-label-sm text-slate-500 uppercase mb-1">Status</span>
                  <p className="font-headline-sm text-[#1e40af]">Available</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 soft-shadow">
                  <span className="font-label-sm text-slate-500 uppercase mb-1">Next Slot</span>
                  <p className="font-headline-sm text-[#1e40af]">2:30 PM</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 soft-shadow">
                  <span className="font-label-sm text-slate-500 uppercase mb-1">Duration</span>
                  <p className="font-headline-sm text-[#1e40af]">30-60m</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 soft-shadow">
                  <span className="font-label-sm text-slate-500 uppercase mb-1">Patients</span>
                  <p className="font-headline-sm text-[#1e40af]">All Pets</p>
                </div>
              </div>
            </section>

            {/* Choose Care Type Grid */}
            <section className="mb-20">
              <h2 className="font-headline-lg text-[#0f172a] mb-12 text-center">Choose Care Type</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Option 1: Vet on Call */}
                <div className="bg-[#f0f4ff] p-8 rounded-3xl shadow-[0_0_20px_rgba(63,81,181,0.15)] border-2 border-[#3f51b5] flex flex-col justify-between hover:scale-[1.01] transition-transform">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-16 h-16 bg-[#e8eaf6] rounded-2xl flex items-center justify-center">
                        <span className="text-[#3f51b5] text-3xl">🏠</span>
                      </div>
                      <span className="bg-white text-[#3f51b5] font-label-md px-4 py-1.5 rounded-full border border-[#3f51b5]/20">
                        AT HOME
                      </span>
                    </div>
                    <h3 className="font-headline-md text-slate-900 mb-2">Vet on Call</h3>
                    <p className="font-body-lg text-slate-600 mb-6 leading-relaxed">
                      Professional veterinary visits in the comfort of your home. Ideal for vaccinations and regular checkups without travel stress.
                    </p>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-2 font-body-md text-slate-700">
                        <span className="text-[#3f51b5] font-bold text-lg">✓</span> Personalized 1-on-1 attention
                      </li>
                      <li className="flex items-center gap-2 font-body-md text-slate-700">
                        <span className="text-[#3f51b5] font-bold text-lg">✓</span> Stress-free home environment
                      </li>
                    </ul>
                  </div>
                  <div className="pt-6 border-t border-slate-200/50 flex justify-between items-center">
                    <div>
                      <span className="font-label-sm text-slate-500 uppercase block mb-0.5">Starts from</span>
                      <span className="font-headline-md text-[#3f51b5]">₹199</span>
                    </div>
                    <button
                      onClick={() => router.push("/service/vet-consultation?mode=vet-on-call")}
                      className="bg-[#3f51b5] text-white px-8 py-3 rounded-full font-label-md hover:bg-[#3f51b5]/90 transition-all shadow-sm"
                    >
                      Select Plan
                    </button>
                  </div>
                </div>

                {/* Option 2: At Clinic */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 soft-shadow flex flex-col justify-between hover:scale-[1.01] transition-transform">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center">
                        <span className="text-orange-500 text-3xl">🏥</span>
                      </div>
                      <span className="bg-orange-500 text-white font-label-md px-4 py-1.5 rounded-full">
                        CLINIC VISIT
                      </span>
                    </div>
                    <h3 className="font-headline-md text-slate-900 mb-2">At Clinic</h3>
                    <p className="font-body-lg text-slate-600 mb-6 leading-relaxed">
                      Full access to our partner clinical facilities for advanced diagnostics, surgery, and comprehensive pet health screens.
                    </p>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-2 font-body-md text-slate-700">
                        <span className="text-orange-500 font-bold text-lg">✓</span> State-of-the-art diagnostic tools
                      </li>
                      <li className="flex items-center gap-2 font-body-md text-slate-700">
                        <span className="text-orange-500 font-bold text-lg">✓</span> Multi-specialist medical team
                      </li>
                    </ul>
                  </div>
                  <div className="pt-6 border-t border-slate-200/50 flex justify-between items-center">
                    <div>
                      <span className="font-label-sm text-slate-500 uppercase block mb-0.5">Starts from</span>
                      <span className="font-headline-md text-orange-500">₹399</span>
                    </div>
                    <button
                      onClick={() => router.push("/service/vet-consultation?mode=at-clinic")}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-label-md transition-all shadow-sm"
                    >
                      Select Plan
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Process / What to expect */}
            <section className="bg-slate-100 rounded-3xl p-10 mb-16">
              <h3 className="font-headline-lg text-[#0f172a] mb-10 text-center">What to Expect</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { idx: "1", title: "Assessment", desc: "Thorough physical examination and checkups." },
                  { idx: "2", title: "Diagnosis", desc: "Professional explanation of findings & status." },
                  { idx: "3", title: "Care Plan", desc: "Customized long-term wellness plan." },
                  { idx: "4", title: "Follow-up", desc: "Digital prescription and priority support." }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-[#1e40af] font-bold flex items-center justify-center mx-auto mb-4 text-lg">
                      {item.idx}
                    </div>
                    <h4 className="font-headline-sm text-slate-900 mb-2">{item.title}</h4>
                    <p className="font-body-md text-slate-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      </>
    );
  }

  // Fallback active service layout (legacy fallback)
  const displayPrice = service.price ?? 0;
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div
          style={{ background: `linear-gradient(135deg, ${service.softColor} 0%, ${service.accentColor}18 100%)` }}
          className="px-4 pt-safe pb-6 md:px-8 md:pb-8"
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-5 pt-4">
              <button 
                onClick={() => router.back()} 
                className="group w-10 h-10 bg-white/80 backdrop-blur-md border border-white/60 rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)] hover:-translate-x-0.5 active:scale-95 transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
              </button>
              <div className="text-[13px] text-muted-foreground font-medium">Service Details</div>
              <div className="w-10" />
            </div>

            <div
              className="w-[72px] h-[72px] rounded-[22px] bg-white flex items-center justify-center mb-4"
              style={{ boxShadow: `0 8px 24px ${service.accentColor}30` }}
            >
              <span className="text-[28px]" style={{ color: service.accentColor }}>{service.emoji}</span>
            </div>

            <div className="font-bold text-[26px] text-foreground leading-tight">{service.name}</div>
            <div className="text-[14px] text-muted-foreground mt-1">{service.tagline}</div>

            {service.rating && (
              <div className="flex items-center gap-1.5 mt-2.5">
                <span className="text-[14px] font-bold text-foreground">★ {service.rating}</span>
                <span className="text-[12px] text-muted-foreground">({service.reviews} reviews)</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-6 md:px-8">
          <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="font-bold text-[17px] text-foreground mb-4">What's Included</div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {service.includes?.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
                    <div
                      className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${service.accentColor}18` }}
                    >
                      <Check className="w-3 h-3" style={{ color: service.accentColor }} />
                    </div>
                    <span className="text-[13px] text-foreground leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-border shrink-0 pb-safe md:hidden">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="text-[12px] text-muted-foreground">Starting from</div>
            <div className="font-bold text-[26px] text-foreground leading-tight">
              ₹{displayPrice}
              <span className="text-[13px] text-muted-foreground font-sans ml-0.5">/session</span>
            </div>
          </div>
        </div>
        <Button 
          onClick={() => router.push(`/service/${getServiceSlug(serviceType ?? type)}`)}
          className="w-full h-[52px] rounded-2xl bg-primary hover:bg-primary/90 text-white text-[15px] shadow-elevated transition-colors"
        >
          Book Now <ArrowLeft className="w-4 h-4 ml-1.5 rotate-180" />
        </Button>
      </div>
    </div>
  );
}
