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
      {/* Mobile layout (unchanged) */}
      <div className="md:hidden rounded-[24px] bg-white/80 border border-[#EDE4EB] p-4 shadow-[0_12px_30px_rgba(26,10,24,0.06)]">
        <h2 className="text-[17px] font-bold text-[#1a0a18] tracking-[-0.2px] mb-3">Why Canovet 🐾</h2>

        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.label}
                className="min-w-[106px] bg-white rounded-[18px] p-3.5 border border-[#EDE4EB] shrink-0"
              >
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-2.5 bg-primary-fixed/30">
                  <Icon className="w-[18px] h-[18px] text-primary" />
                </div>
                <div className="text-[12px] font-bold text-[#1a0a18] leading-tight">
                  {b.label}
                </div>
                <div className="text-[10px] text-[#8A6888] mt-0.5 leading-snug">
                  {b.label === "Verified Pros" ? "Verified" : b.label === "4.9 Rated" ? "8.2k+ reviews" : b.label === "Pet-Safe Only" ? "Organic" : "Satisfaction"}
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
