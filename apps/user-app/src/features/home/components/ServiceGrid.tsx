"use client";

import { ServiceType } from "@canovet/shared";
import { serviceCategories } from "@/features/home/data/services";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { ArrowUpRight, Scissors, Stethoscope, Beef, Pill, Shield, ChevronRight } from "lucide-react";

const ServiceGrid = () => {
  const router = useRouter();

  return (
    <section id="services-section" className="px-4 pt-3">
      {/* Mobile layout */}
      <div className="md:hidden">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-[20px] font-extrabold text-[#121212] tracking-[-0.5px]">All Services</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {serviceCategories.filter((svc) => svc.id !== ServiceType.VET_CLINIC).map((svc) => {
            const isWide = svc.id === "pet-insurance";
            const inactive = svc.soon;

            const cardClass = cn(
              "bg-white rounded-[16px] p-4 cursor-pointer border border-[#EDE4EB] relative overflow-hidden transition-shadow duration-150 shadow-card hover:shadow-card active:scale-[0.98]",
              isWide ? "col-span-2" : ""
            );

            if (isWide) {
              return (
                <div
                  key={svc.id}
                  onClick={() => router.push(svc.route)}
                  className={cardClass}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-[46px] h-[46px] rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "rgba(255, 16, 240, 0.08)" }}
                    >
                      <span className="text-[20px]">🛡️</span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-[14px] font-extrabold text-[#121212]">
                          {svc.name}
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0FC] text-[#FF10F0] tracking-[0.05em] uppercase">
                          SOON
                        </span>
                      </div>
                      <div className="text-[11px] text-[#4A4A4A] mt-0.5">{svc.tagline}</div>
                    </div>
                  </div>
                </div>
              );
            }

            const tagBg = svc.tag === "Popular" ? "bg-[#FFF0FC] text-[#FF10F0]" : "bg-[#F3EEF1] text-[#4A4A4A]";

            return (
              <div
                key={svc.id}
                onClick={() => router.push(svc.route)}
                className={cardClass}
              >
                {svc.tag && (
                  <div className="absolute top-3 right-3">
                    <span
                      className={cn("text-[9px] font-extrabold px-2.5 py-[3px] rounded-full tracking-[0.05em] uppercase", tagBg)}
                    >
                      {svc.tag}
                    </span>
                  </div>
                )}

                <div
                  className="w-[46px] h-[46px] rounded-full flex items-center justify-center mb-3.5"
                  style={{ background: svc.softColor }}
                >
                  <span className="text-[22px]">{svc.emoji}</span>
                </div>

                <div className="text-[14px] font-extrabold leading-[1.3] mb-1 text-[#121212]">
                  {svc.name}
                </div>
                <div className="text-[11px] text-[#4A4A4A] leading-[1.4] mb-3 line-clamp-2">
                  {svc.tagline}
                </div>

                {!inactive && svc.price ? (
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[15px] font-extrabold text-[#FF10F0]">
                      ₹{svc.price}
                    </span>
                    <span className="text-[10px] text-[#4A4A4A] font-semibold"> onwards</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-[#4A4A4A] italic font-semibold">
                    Launching soon…
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== DESKTOP LAYOUT (Premium Layout) ===== */}
      <div className="hidden md:block">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="font-headline-lg text-on-surface">Our Services</h2>
            <p className="text-on-surface-variant font-body-md">Everything your pet needs, in one place</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary-fixed/30 text-primary rounded-full font-label-md">
            <span>📍</span> Ahmedabad, IN
          </div>
        </div>

        {/* 4-column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-gutter">
          {serviceCategories
            .filter((svc) => svc.id !== ServiceType.VET_CLINIC && svc.id !== "pet-insurance")
            .map((svc) => {
              const inactive = svc.soon;

              // Icon mapping
              let IconComponent = Scissors;
              let iconColorClass = "text-primary";
              let iconBgClass = "bg-primary-fixed";

              if (svc.id === ServiceType.VET_ON_CALL) {
                IconComponent = Stethoscope;
                iconColorClass = "text-blue-600";
                iconBgClass = "bg-blue-100";
              } else if (svc.id === "pet-food") {
                IconComponent = Beef;
                iconColorClass = "text-amber-600";
                iconBgClass = "bg-amber-100";
              } else if (svc.id === "pet-pharma") {
                IconComponent = Pill;
                iconColorClass = "text-green-600";
                iconBgClass = "bg-green-100";
              }

              return (
                <div
                  key={svc.id}
                  onClick={() => router.push(svc.route)}
                  className={cn(
                    "bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group relative",
                    inactive ? "opacity-80" : ""
                  )}
                >
                  {svc.tag && (
                    <span
                      className={cn(
                        "absolute top-4 right-4 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase",
                        svc.tag === "Soon" ? "bg-surface-container-high text-on-surface-variant" : "bg-primary text-on-primary"
                      )}
                    >
                      {svc.tag}
                    </span>
                  )}

                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform",
                      iconBgClass
                    )}
                  >
                    <IconComponent className={cn("w-6 h-6", iconColorClass)} />
                  </div>

                  <h3 className="font-headline-sm text-on-surface mb-2">{svc.name}</h3>
                  <p className="text-on-surface-variant font-body-md mb-6">{svc.tagline}</p>

                  <div className="flex items-center justify-between">
                    {!inactive && svc.price ? (
                      <span className="font-headline-sm text-primary">
                        ₹{svc.price} <span className="text-xs font-normal text-on-surface-variant">from</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-primary font-bold text-xs uppercase italic">
                        🚀 Launching soon
                      </span>
                    )}
                    {!inactive && (
                      <ChevronRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Wide Insurance Card below */}
        {(() => {
          const insuranceService = serviceCategories.find((svc) => svc.id === "pet-insurance");
          if (!insuranceService) return null;

          return (
            <div
              onClick={() => router.push(insuranceService.route)}
              className="p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8 group cursor-pointer hover:bg-surface-container transition-colors bg-primary-fixed"
            >
              <div className="w-20 h-20 rounded-2xl bg-primary-fixed-dim flex items-center justify-center flex-shrink-0">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-grow text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h3 className="font-headline-md text-on-surface">{insuranceService.name}</h3>
                  <span className="bg-surface-container-highest text-on-surface-variant text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {insuranceService.tag || "Soon"}
                  </span>
                </div>
                <p className="text-on-surface-variant font-body-lg max-w-xl">
                  {insuranceService.tagline}. Protect your furry friend from the unexpected with our upcoming insurance plans.
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="flex items-center gap-2 text-primary font-bold text-sm uppercase italic">
                  🚀 Launching soon
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
};

export default ServiceGrid;
