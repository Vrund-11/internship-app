"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Check, 
  Scissors, 
  Calendar, 
  Clock, 
  User, 
  CreditCard, 
  Info, 
  Phone, 
  MessageSquare, 
  Copy, 
  Stethoscope, 
  Building2, 
  Sparkles
} from "lucide-react";
import type { Pet, ServiceItem, Address } from "@/shared/types";
import { calcTotal } from "@/shared/types";
import { format } from "date-fns";
import { ServiceType } from "@canovet/shared";

interface BookingSuccessPartner {
  name: string;
  rating: number;
  sessions?: number;
  experience: number;
  specialization?: string;
  description?: string;
  phone?: string | null;
}

interface BookingSuccessProps {
  pets: Pet[];
  services: ServiceItem[];
  address?: Address | null;
  selectedDate?: Date | null;
  selectedTime?: string | null;
  bookingId?: string | null;
  confirmationTitle?: string;
  confirmationMessage?: string;
  partner?: BookingSuccessPartner | null;
  serviceType?: ServiceType | string | null;
}

// Generate a short booking ID like "CNV-ILV2"
function makeBookingId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return `CNV-${id}`;
}

const FALLBACK_BOOKING_ID = makeBookingId();

const themeConfig = {
  [ServiceType.GROOMING]: {
    name: "Pet Grooming",
    primary: "#A7009D",
    gradientClass: "from-[#A7009D] to-[#FF10F0]",
    bgSoft: "bg-[#FDF0FD]",
    borderSoft: "border-[#FBCDF5]/50",
    textPrimary: "text-[#A7009D]",
    textOnSoft: "text-[#6B0068]",
    accentChip: "bg-[#FF10F0]/10 text-[#FF10F0] border-[#FF10F0]/20",
    btnColor: "bg-[#FF10F0] hover:bg-[#A7009D] text-white shadow-lg shadow-[#FF10F0]/20",
    btnOutline: "border-[#FF10F0] text-[#FF10F0] hover:bg-[#FF10F0]/5",
    specialistTitle: "Specialist Assigned",
    roleDefault: "Senior Groomer",
    avatarBg: "bg-[#FF10F0]/10 text-[#FF10F0] border-[#FF10F0]/20",
    icon: Scissors,
  },
  [ServiceType.VET_ON_CALL]: {
    name: "Vet On Call",
    primary: "#A7009D",
    gradientClass: "from-[#A7009D] to-[#FF10F0]",
    bgSoft: "bg-[#FDF0FD]",
    borderSoft: "border-[#FBCDF5]/50",
    textPrimary: "text-[#A7009D]",
    textOnSoft: "text-[#6B0068]",
    accentChip: "bg-[#FF10F0]/10 text-[#FF10F0] border-[#FF10F0]/20",
    btnColor: "bg-[#FF10F0] hover:bg-[#A7009D] text-white shadow-lg shadow-[#FF10F0]/20",
    btnOutline: "border-[#FF10F0] text-[#FF10F0] hover:bg-[#FF10F0]/5",
    specialistTitle: "Specialist Assigned",
    roleDefault: "Senior Veterinarian",
    avatarBg: "bg-[#FF10F0]/10 text-[#FF10F0] border-[#FF10F0]/20",
    icon: Stethoscope,
  },
  [ServiceType.VET_CLINIC]: {
    name: "Clinic Visit",
    primary: "#A7009D",
    gradientClass: "from-[#A7009D] to-[#FF10F0]",
    bgSoft: "bg-[#FDF0FD]",
    borderSoft: "border-[#FBCDF5]/50",
    textPrimary: "text-[#A7009D]",
    textOnSoft: "text-[#6B0068]",
    accentChip: "bg-[#FF10F0]/10 text-[#FF10F0] border-[#FF10F0]/20",
    btnColor: "bg-[#FF10F0] hover:bg-[#A7009D] text-white shadow-lg shadow-[#FF10F0]/20",
    btnOutline: "border-[#FF10F0] text-[#FF10F0] hover:bg-[#FF10F0]/5",
    specialistTitle: "Clinic Partner",
    roleDefault: "Veterinary Clinic",
    avatarBg: "bg-[#FF10F0]/10 text-[#FF10F0] border-[#FF10F0]/20",
    icon: Building2,
  },
};

const BookingSuccess = ({
  pets,
  services,
  address,
  selectedDate,
  selectedTime,
  bookingId,
  confirmationTitle,
  confirmationMessage,
  partner,
  serviceType,
}: BookingSuccessProps) => {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const resolvedType = (serviceType && themeConfig[serviceType as ServiceType])
    ? (serviceType as ServiceType)
    : ServiceType.GROOMING;

  const theme = themeConfig[resolvedType];
  const displayId = bookingId || FALLBACK_BOOKING_ID;
  const total = calcTotal(pets, services);

  const dateLabel = selectedDate
    ? format(selectedDate, "MMM dd, yyyy")
    : format(new Date(), "MMM dd, yyyy");

  const timeLabel = selectedTime || "As soon as possible";

  const serviceLabel = services.length > 0
    ? services.map((s) => s.name).join(", ")
    : "General Consultation";

  const petLabel = pets.length > 0
    ? pets.map((p) => `${p.name} (${p.breed || p.type})`).join(", ")
    : "Luna (Samoyed)";

  const isClinic = resolvedType === ServiceType.VET_CLINIC;
  
  const infoText = isClinic
    ? "Arrive 15 mins early"
    : (confirmationMessage || "Your specialist is on the way. Reminder 30 min before arrival.");

  const displayPartner = partner || {
    name: isClinic ? "Canovet Animal Clinic" : "Elena Rodriguez",
    rating: 4.9,
    experience: 6,
    specialization: theme.roleDefault,
    phone: "+91 98765 43210",
  };

  const getInitials = (name?: string) => {
    if (!name) return "SP";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(displayId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F9FAFB] animate-fade-in-up overflow-y-auto font-sans">


      <main className="flex-1 pb-24">
        {/* Hero Section: Full-Width Gradient Header */}
        <section className={`bg-gradient-to-br ${theme.gradientClass} text-white py-16 w-full relative overflow-hidden shrink-0`}>
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center px-4 relative z-10">
            {/* Success check badge */}
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 border border-white/20 animate-scale-in">
              <Check className="w-8 h-8 text-white stroke-[3px]" />
            </div>

            <div className="inline-block px-4.5 py-1 bg-white/10 rounded-full text-[11px] font-extrabold uppercase tracking-widest mb-4 border border-white/25">
              {theme.name}
            </div>

            <h1 className="text-3xl md:text-4.5xl font-extrabold tracking-tight mb-3">
              Booking Confirmed!
            </h1>
            <p className="text-white/85 text-[15px] md:text-base mb-8 max-w-xl mx-auto font-medium">
              Your pet's health and happiness is our ultimate priority. We look forward to serving you!
            </p>

            {/* Booking ID Container */}
            <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 flex items-center gap-4 backdrop-blur-md transition-all shadow-inner">
              <div className="text-left">
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Booking ID</p>
                <p className="text-[13px] font-bold tracking-wide text-white font-mono truncate max-w-[200px]">{displayId}</p>
              </div>
              <button 
                onClick={handleCopy}
                className={`p-2 rounded-xl transition-all duration-300 border ${
                  copied 
                    ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-400" 
                    : "hover:bg-white/10 border-white/10 text-white"
                }`}
              >
                {copied ? <Check className="w-[18px] h-[18px] stroke-[2.5px]" /> : <Copy className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>

          {/* Decorative backdrop shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 bg-radial-gradient" 
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 bg-radial-gradient" 
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />
        </section>

        {/* 2-Column Summary Section */}
        <section className="mx-auto px-6 -mt-8 relative z-20 max-w-5xl w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Summary Card */}
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <div className="p-8 flex-grow">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                  <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
                    <span className={`${theme.textPrimary}`}>
                      {resolvedType === ServiceType.GROOMING ? <Scissors className="w-5 h-5" /> : resolvedType === ServiceType.VET_ON_CALL ? <Stethoscope className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                    </span>
                    Summary
                  </h2>
                  <span className={`px-3 py-1 font-bold text-[10px] uppercase rounded-full border ${theme.accentChip}`}>
                    CONFIRMED
                  </span>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Service</p>
                    <p className="text-[15px] font-extrabold text-gray-800">{serviceLabel}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pet Name</p>
                    <p className="text-[15px] font-extrabold text-gray-800">{petLabel}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Date &amp; Time</p>
                    <p className="text-[15px] font-extrabold text-gray-800">{dateLabel} • {timeLabel}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Amount</p>
                    <p className="text-[15px] font-extrabold text-gray-800">
                      ₹{total > 0 ? Math.round(total * 1.18) : "589"} <span className="font-semibold text-gray-400 text-xs">(incl. GST)</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Info banner at bottom of card */}
              <div className={`p-5 ${theme.bgSoft} border-t ${theme.borderSoft} flex items-start gap-2.5`}>
                <Info className={`w-4 h-4 mt-0.5 shrink-0 ${theme.textPrimary}`} />
                <p className="text-[13px] font-semibold text-gray-700">
                  {infoText}
                </p>
              </div>
            </div>

            {/* Right Column: Specialist Assigned Card */}
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
              <div className="p-8 flex-grow">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-50">
                  <span className={`${theme.textPrimary}`}>
                    <User className="w-5 h-5" />
                  </span>
                  <h2 className="text-[18px] font-bold text-gray-900">{theme.specialistTitle}</h2>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    {/* Avatar Initials Badge */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-lg border ${theme.avatarBg}`}>
                      {getInitials(displayPartner.name)}
                    </div>
                    <div>
                      <h3 className="text-[16px] font-extrabold text-gray-950">{displayPartner.name}</h3>
                      <div className="flex items-center gap-1.5 font-bold mt-1 text-gray-500">
                        <span className="text-[13px] text-amber-500">★</span>
                        <span className="text-[13px]">{displayPartner.rating} stars • {displayPartner.specialization}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <a 
                      href={`tel:${displayPartner.phone}`}
                      className="flex-1 py-3 border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-[13px] font-extrabold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                      <Phone className="w-4.5 h-4.5 text-gray-500" />
                      Call
                    </a>
                    <a 
                      href={`sms:${displayPartner.phone}`}
                      className="flex-1 py-3 border border-gray-200 rounded-xl flex items-center justify-center gap-2 text-[13px] font-extrabold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                      <MessageSquare className="w-4.5 h-4.5 text-gray-500" />
                      SMS
                    </a>
                  </div>
                </div>
              </div>

              {/* Specialist Action Button at bottom of card */}
              <div className={`p-6 bg-gray-50 border-t border-gray-100`}>
                <a
                  href={`tel:${displayPartner.phone}`}
                  className={`w-full px-6 py-3.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all text-center cursor-pointer ${theme.btnColor}`}
                >
                  <Sparkles className="w-4.5 h-4.5" />
                  Contact Specialist
                </a>
              </div>
            </div>

          </div>

          {/* Core Page Action Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4.5 max-w-lg mx-auto px-4">
            <button 
              onClick={() => router.push(`/bookings/${displayId}`)}
              className="w-full py-4 px-8 bg-[#FF10F0] hover:bg-[#FF10F0]/90 text-white rounded-full text-[14px] font-extrabold transition-all border-none cursor-pointer shadow-md active:scale-[0.98]"
            >
              View Booking Summary
            </button>
            <button 
              onClick={() => router.push("/home")}
              className="w-full py-4 px-8 border border-[#FF10F0] text-[#FF10F0] bg-transparent hover:bg-[#FFF0FC] rounded-full text-[14px] font-extrabold transition-all cursor-pointer active:scale-[0.98]"
            >
              Back to Home
            </button>
          </div>
        </section>
      </main>


    </div>
  );
};

export default BookingSuccess;
