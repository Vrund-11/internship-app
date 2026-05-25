"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { ServiceType } from "@canovet/shared";
import {
  getServiceCategory,
  getServiceSlug,
  resolveServiceType,
} from "@/features/home/data/services";
import { Button } from "@/shared/components/ui/button";

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const type = (params?.type as string) || "grooming";
  const serviceType = resolveServiceType(type);
  const service = getServiceCategory(type);
  const clinicService = getServiceCategory(ServiceType.VET_CLINIC);

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <p className="mb-4">Service not found.</p>
        <Button onClick={() => router.push("/home")}>Go Home</Button>
      </div>
    );
  }

  // ---- Coming Soon Design ----
  if (service.soon) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div 
            style={{ background: `linear-gradient(140deg, ${service.softColor} 0%, ${service.accentColor}15 100%)` }}
            className="px-5 pt-safe pb-8"
          >
            <div className="flex justify-between items-center mb-6 pt-4">
              <button onClick={() => router.back()} className="w-10 h-10 bg-white/50 rounded-xl flex items-center justify-center hover:bg-white/70 transition-colors">
                <ArrowLeft className="w-5 h-5 text-[#081C13]" />
              </button>
              <div className="text-[13px] text-[#3E6255] font-medium">Coming Soon</div>
              <div className="w-10" />
            </div>
            
            <div 
              className="w-[72px] h-[72px] rounded-[22px] bg-white flex items-center justify-center mb-4"
              style={{ boxShadow: `0 8px 24px ${service.accentColor}25` }}
            >
              <span className="text-[28px]" style={{ color: service.accentColor }}>{service.emoji}</span>
            </div>
            
            <div className="font-serif text-[28px] text-[#081C13] leading-tight">{service.name}</div>
            <div className="text-[14px] text-[#3E6255] mt-1">{service.tagline}</div>
            
            <div 
              className="mt-3 inline-block text-[10px] font-bold px-2.5 py-1 rounded-full tracking-[0.6px] uppercase"
              style={{ color: service.accentColor, background: `${service.accentColor}20` }}
            >
              Launching Soon
            </div>
          </div>

          {/* Details */}
          <div className="px-5 py-5">
            <div className="font-serif text-[17px] text-[#081C13] mb-3.5">What's Coming</div>
            <div className="flex flex-col">
              {service.includes?.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-[#F0F5F2] last:border-0">
                  <div 
                    className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${service.accentColor}18` }}
                  >
                    <Check className="w-3 h-3" style={{ color: service.accentColor }} />
                  </div>
                  <span className="text-[14px] text-[#081C13] leading-snug">{item}</span>
                </div>
              ))}
            </div>

            {/* Notify box */}
            <div className="mt-6 bg-[#F0F5F2] rounded-[18px] p-5 text-center border border-[#DDE8E3]">
              <div className="font-serif text-[18px] text-[#081C13] mb-1.5">Get Early Access</div>
              <div className="text-[13px] text-[#3E6255] mb-4">Be the first to know when we launch</div>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="flex-1 border border-[#DDE8E3] rounded-xl px-3.5 py-2.5 text-[13px] outline-none text-[#081C13]"
                />
                <Button className="rounded-xl h-auto py-2.5 px-4 bg-[#0B3B2A] hover:bg-[#155E41]">
                  Notify Me
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Active Service Design ----
  const displayPrice = service.price ?? 0;
  const showConsultationModes = serviceType === ServiceType.VET_ON_CALL;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div 
          style={{ background: `linear-gradient(135deg, ${service.softColor} 0%, ${service.accentColor}18 100%)` }}
          className="px-5 pt-safe pb-7"
        >
          <div className="flex justify-between items-center mb-5 pt-4">
            <button onClick={() => router.back()} className="w-10 h-10 bg-white/50 rounded-xl flex items-center justify-center hover:bg-white/70 transition-colors border border-white/40 shadow-sm">
              <ArrowLeft className="w-5 h-5 text-[#081C13]" />
            </button>
            <div className="text-[13px] text-[#3E6255] font-medium">Service Details</div>
            <div className="w-10" />
          </div>

          <div 
            className="w-[72px] h-[72px] rounded-[22px] bg-white flex items-center justify-center mb-4"
            style={{ boxShadow: `0 8px 24px ${service.accentColor}30` }}
          >
            <span className="text-[28px]" style={{ color: service.accentColor }}>{service.emoji}</span>
          </div>
          
          <div className="font-serif text-[26px] text-[#081C13] leading-tight">{service.name}</div>
          <div className="text-[14px] text-[#3E6255] mt-1">{service.tagline}</div>
          
          {service.rating && (
            <div className="flex items-center gap-1.5 mt-2.5">
              <span className="text-[14px] font-bold text-[#081C13]">★ {service.rating}</span>
              <span className="text-[12px] text-[#3E6255]">({service.reviews} reviews)</span>
            </div>
          )}

          {/* Quick info boxes */}
          <div className="flex gap-2.5 mt-4">
            <div className="bg-white/75 rounded-xl p-2.5 flex-1 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="text-[10px] text-[#3E6255] uppercase tracking-[0.8px] font-semibold">Duration</div>
              <div className="text-[13px] font-bold text-[#081C13] mt-0.5">Varies</div>
            </div>
            <div className="bg-white/75 rounded-xl p-2.5 flex-1 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="text-[10px] text-[#3E6255] uppercase tracking-[0.8px] font-semibold">Ideal For</div>
              <div className="text-[13px] font-bold text-[#081C13] mt-0.5">Dogs & Cats</div>
            </div>
          </div>
        </div>

        {showConsultationModes && clinicService ? (
          <div className="px-5 py-5">
            <div className="font-serif text-[17px] text-[#081C13] mb-3.5">Choose Care Type</div>
            <div className="grid gap-3">
              <button
                onClick={() => router.push(`/service/${getServiceSlug(ServiceType.VET_ON_CALL)}?mode=vet-on-call`)}
                className="rounded-[18px] border border-[#DDE8E3] bg-white p-4 text-left transition-shadow hover:shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-bold text-[#081C13]">Vet on Call</div>
                    <div className="text-[12px] text-[#3E6255] mt-1">
                      {service.description}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] text-[#6E8F83]">Starts from</div>
                    <div className="text-[16px] font-semibold" style={{ color: service.accentColor }}>
                      ₹{service.price ?? 0}
                    </div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => router.push(`/service/${getServiceSlug(ServiceType.VET_ON_CALL)}?mode=at-clinic`)}
                className="rounded-[18px] border border-[#DDE8E3] bg-white p-4 text-left transition-shadow hover:shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-bold text-[#081C13]">At Clinic</div>
                    <div className="text-[12px] text-[#3E6255] mt-1">
                      {clinicService.description}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] text-[#6E8F83]">Starts from</div>
                    <div className="text-[16px] font-semibold" style={{ color: clinicService.accentColor }}>
                      ₹{clinicService.price ?? 0}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 py-5">
            <div className="font-serif text-[17px] text-[#081C13] mb-3.5">What's Included</div>
            <div className="flex flex-col">
              {service.includes?.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-[#F0F5F2] last:border-0">
                  <div 
                    className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${service.accentColor}18` }}
                  >
                    <Check className="w-3 h-3" style={{ color: service.accentColor }} />
                  </div>
                  <span className="text-[14px] text-[#081C13] leading-snug">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 bg-[#F0F5F2] rounded-2xl p-4">
              <div className="text-[12px] text-[#3E6255] font-semibold uppercase tracking-[0.8px] mb-1.5">Note</div>
              <div className="text-[13px] text-[#081C13] leading-relaxed">
                Price may vary slightly based on pet size or specific requirements assessed on-site.
              </div>
            </div>
          </div>
        )}
      </div>

      {!showConsultationModes && (
        <div className="p-4 bg-white border-t border-[#DDE8E3] shrink-0 pb-safe">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="text-[12px] text-[#3E6255]">Starting from</div>
              <div className="font-serif text-[26px] text-[#081C13] leading-tight">
                ₹{displayPrice}
                <span className="text-[13px] text-[#3E6255] font-sans ml-0.5">/session</span>
              </div>
            </div>
            {service.rating && (
              <div className="text-right">
                <div className="text-[12px] text-[#3E6255]">Rating</div>
                <div className="text-[16px] font-bold text-[#081C13]">★ {service.rating} <span className="text-[11px] text-[#3E6255] font-normal">({service.reviews})</span></div>
              </div>
            )}
          </div>
          
          {service.id === "pet-food" ? (
            <Button 
              disabled 
              className="w-full h-[52px] rounded-2xl bg-[#0B3B2A] text-white text-[15px] shadow-elevated"
            >
              Coming soon to Canovet
            </Button>
          ) : (
            <Button 
              onClick={() => router.push(`/service/${getServiceSlug(serviceType ?? type)}`)}
              className="w-full h-[52px] rounded-2xl bg-[#0B3B2A] hover:bg-[#155E41] text-white text-[15px] shadow-elevated transition-colors"
            >
              Book Now <ArrowLeft className="w-4 h-4 ml-1.5 rotate-180" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
