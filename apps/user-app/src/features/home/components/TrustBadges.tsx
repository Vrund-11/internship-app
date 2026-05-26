"use client";

import { CheckCircle2, Star, ShieldCheck, RefreshCw } from "lucide-react";

const badges = [
  { icon: CheckCircle2, label: "Verified Pros", sub: "Background checked" },
  { icon: Star, label: "4.9 Rated", sub: "8.2k+ reviews" },
  { icon: ShieldCheck, label: "Pet-Safe Only", sub: "Certified products" },
  { icon: RefreshCw, label: "Redo Guarantee", sub: "100% satisfaction" },
];

const TrustBadges = () => {
  return (
    <section className="px-4 py-5 pb-8">
      <h2 className="font-serif text-[17px] font-normal text-[#081C13] mb-3">Why Canovet</h2>

      <div className="flex md:grid md:grid-cols-4 gap-2.5 md:gap-4 lg:gap-6 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {badges.map((b) => {
          const Icon = b.icon;
          return (
            <div
              key={b.label}
              className="min-w-[112px] bg-white rounded-[16px] p-3.5 border border-[#DDE8E3] shrink-0 text-center"
            >
              <div className="text-[#1D8F60] mb-1 flex justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-[12px] font-bold text-[#081C13] leading-tight">
                {b.label}
              </div>
              <div className="text-[10px] text-[#3E6255] mt-1 leading-snug">
                {b.sub}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TrustBadges;
