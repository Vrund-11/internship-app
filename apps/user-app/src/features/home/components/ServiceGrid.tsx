"use client";

import { ServiceType } from "@canovet/shared";
import { serviceCategories } from "@/features/home/data/services";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/utils";

const ServiceGrid = () => {
  const router = useRouter();

  return (
    <section className="px-4 pt-1">
      <div className="flex justify-between items-center mb-3.5">
        <div className="font-serif text-[19px] font-normal text-[#081C13]">Our Services</div>
        <div className="text-[12px] text-[#1D8F60] font-semibold">Ahmedabad, IN</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 lg:gap-6">
        {serviceCategories.filter((svc) => svc.id !== ServiceType.VET_CLINIC).map((svc, i) => {
          const isWide = svc.id === "pet-insurance";
          const inactive = svc.soon;

          const cardClass = cn(
            "bg-white rounded-[20px] p-[18px_16px] cursor-pointer border border-[#DDE8E3] relative overflow-hidden transition-shadow duration-150",
            isWide ? "col-span-2" : "",
            "hover:shadow-card active:scale-[0.98]"
          );

          if (isWide) {
            return (
              <div
                key={svc.id}
                onClick={() => !inactive && router.push(svc.route)}
                className={cardClass}
              >
                {svc.tag && (
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className="text-[10px] font-bold px-2.5 py-[3px] rounded-full tracking-[0.6px] uppercase"
                      style={{ color: inactive ? "#6E8F83" : svc.accentColor, background: inactive ? "#F0F5F2" : svc.softColor }}
                    >
                      {svc.tag}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0"
                    style={{ background: svc.softColor }}
                  >
                    <span className="text-[20px]" style={{ color: svc.accentColor }}>{svc.emoji}</span>
                  </div>
                  <div>
                    <div className={cn("font-serif text-[15px] font-normal", inactive ? "text-[#6E8F83]" : "text-[#081C13]")}>
                      {svc.name}
                    </div>
                    <div className="text-[11px] text-[#6E8F83] mt-0.5">{svc.tagline}</div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={svc.id}
              onClick={() => !inactive && router.push(svc.route)}
              className={cardClass}
            >
              {svc.tag && (
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className="text-[10px] font-bold px-2.5 py-[3px] rounded-full tracking-[0.6px] uppercase"
                    style={{ color: inactive ? "#6E8F83" : svc.accentColor, background: inactive ? "#F0F5F2" : svc.softColor }}
                  >
                    {svc.tag}
                  </span>
                </div>
              )}

              <div
                className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-3.5"
                style={{ background: svc.softColor, border: `1px solid ${svc.accentColor}20` }}
              >
                <span className="text-[18px] font-black" style={{ color: svc.accentColor }}>{svc.emoji}</span>
              </div>

              <div className={cn("font-serif text-[14px] font-normal leading-[1.2]", inactive ? "text-[#6E8F83]" : "text-[#081C13]")}>
                {svc.name}
              </div>
              <div className="text-[11px] text-[#3E6255] mt-[3px] leading-[1.4] line-clamp-2">
                {svc.tagline}
              </div>

              {!inactive && svc.price ? (
                <div className="mt-2.5 flex items-baseline gap-0.5">
                  <span className="font-serif text-[16px] font-normal" style={{ color: svc.accentColor }}>
                    ₹{svc.price}
                  </span>
                  <span className="text-[10px] text-[#6E8F83]"> onwards</span>
                </div>
              ) : (
                <div className="mt-2.5 text-[11px] text-[#6E8F83] italic">
                  Launching soon
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ServiceGrid;
