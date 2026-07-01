"use client";

import { CheckCircle2, Star, ShieldCheck, RefreshCw, Heart, UserCheck, Leaf } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const badges = [
  { icon: UserCheck, label: "Verified Pros", sub: "Every specialist goes through rigorous background checks.", color: "text-primary", bg: "bg-primary-fixed", stat: "500+" },
  { icon: Star, label: "4.9 Rated", sub: "Rated excellence by over 8.2k verified pet parent reviews.", color: "text-amber-600", bg: "bg-amber-100", stat: "4.9★" },
  { icon: Leaf, label: "Pet-Safe Only", sub: "We use only organic, non-toxic products in all our services.", color: "text-green-600", bg: "bg-green-100", stat: "100%" },
  { icon: RefreshCw, label: "Redo Promise", sub: "Not satisfied? We’ll redo the service for free. 100% satisfaction.", color: "text-blue-600", bg: "bg-blue-100", stat: "Free" },
];

const TrustBadges = () => {
  return (
    <section className="px-4 py-5 pb-8">
      {/* Mobile layout */}
      <div className="md:hidden">
        <h2 className="text-[20px] font-extrabold text-[#121212] tracking-[-0.5px] mb-4 px-1">Why Canovet 🐾</h2>

        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.label}
                className="min-w-[128px] bg-white rounded-[16px] p-4 border border-[#EDE4EB] shrink-0 shadow-card"
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                  style={{ background: "rgba(255, 16, 240, 0.08)" }}
                >
                  <Icon className="w-5 h-5 text-[#FF10F0]" />
                </div>
                <div className="text-[13px] font-extrabold text-[#121212] leading-tight">
                  {b.label}
                </div>
                <div className="text-[10px] text-[#4A4A4A] mt-1 leading-snug font-semibold">
                  {b.label === "Verified Pros" ? "Verified" : b.label === "4.9 Rated" ? "8.2k+ reviews" : b.label === "Pet-Safe Only" ? "100% Organic" : "Satisfaction Guaranteed"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== DESKTOP LAYOUT (Premium Trust Section) ===== */}
      <div className="hidden md:block bg-surface-container-lowest rounded-[40px] p-12 shadow-sm mb-stack-lg border border-outline-variant/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h2 className="font-headline-lg text-on-surface flex items-center gap-3">
              Why Pet Parents Love Us <Heart className="w-6 h-6 text-primary fill-primary animate-pulse" />
            </h2>
            <p className="text-on-surface-variant font-body-lg">Trusted by thousands of pet families across India</p>
          </div>
          <div className="bg-green-100 text-green-700 px-6 py-3 rounded-full flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-700" /> All services verified
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.label}
                className="p-8 rounded-3xl bg-surface-container-low/50 hover:bg-surface-container-low transition-colors border border-outline-variant/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", b.bg)}>
                    <Icon className={cn("w-5 h-5", b.color)} />
                  </div>
                  <span className={cn("text-3xl font-extrabold", b.color)}>{b.stat}</span>
                </div>
                <h4 className="font-headline-sm text-on-surface mb-2">{b.label}</h4>
                <p className="text-on-surface-variant font-body-md">{b.sub}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
