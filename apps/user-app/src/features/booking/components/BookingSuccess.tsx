"use client";

import { useRouter } from "next/navigation";
import { Check, Scissors } from "lucide-react";
import type { Pet, ServiceItem, Address } from "@/shared/types";
import { calcTotal } from "@/shared/types";
import { format } from "date-fns";

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
  address: Address;
  selectedDate?: Date | null;
  selectedTime?: string | null;
  bookingId?: string | null;
  confirmationTitle?: string;
  confirmationMessage?: string;
  partner?: BookingSuccessPartner | null;
}

// Generate a short booking ID like "CNV-ILV2"
function makeBookingId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return `CNV-${id}`;
}

const BOOKING_ID = makeBookingId();

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
}: BookingSuccessProps) => {
  const router = useRouter();
  const total = calcTotal(pets, services);
  const displayId = bookingId || BOOKING_ID;

  const dateLabel = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");

  const timeLabel = selectedTime || "As soon as possible";

  const serviceLabel = services.length > 0
    ? services.map((s) => s.name).join(", ")
    : "Service";

  const addressLabel =
    address.label === "Clinic"
      ? `At Clinic \u2013 ${serviceLabel}`
      : `At Home \u2013 ${serviceLabel}`;

  const isClinic = address.label === "Clinic";
  const subtitle = isClinic
    ? "Your clinic slot is booked."
    : (confirmationMessage || "Your specialist is on the way. Reminder 30 min before arrival.");

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white animate-fade-in-up overflow-y-auto">
      {/* TOP: dark green header */}
      <div
        className="relative flex flex-col items-center pt-14 pb-10 px-6"
        style={{ background: "linear-gradient(160deg, #0B3B2A 0%, #1A5C3B 100%)" }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #27AE78, transparent)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #27AE78, transparent)", transform: "translate(-30%, 30%)" }} />

        {/* Check circle */}
        <div className="relative z-10 w-[72px] h-[72px] rounded-full flex items-center justify-center mb-5 shadow-[0_8px_32px_rgba(39,174,120,0.4)]"
          style={{ background: "linear-gradient(135deg, #27AE78 0%, #1D8F60 100%)" }}>
          <Check className="w-8 h-8 text-white stroke-[3px]" />
        </div>

        <h1 className="text-white font-bold text-[26px] mb-2 text-center z-10">
          Booking Confirmed!
        </h1>
        <p className="text-white/60 text-[13px] text-center z-10 mb-6">
          {subtitle}
        </p>

        {/* Booking ID chip */}
        <div className="z-10 rounded-2xl border border-white/10 px-6 py-3 text-center"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="text-white/40 text-[10px] font-bold uppercase tracking-[1.5px] mb-1">
            Booking ID
          </div>
          <div className="text-[#27AE78] font-bold text-[20px] tracking-[2px]">
            {displayId}
          </div>
        </div>
      </div>

      {/* BOTTOM: white details */}
      <div className="flex-1 bg-white px-4 pt-5 pb-6">
        {/* Details card */}
        <div className="rounded-[20px] border border-[#E8F0EC] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-5 mb-4">
          {/* Service */}
          <div className="flex items-start gap-3 mb-5">
            <div className="w-9 h-9 rounded-[10px] bg-[#F0F5F2] flex items-center justify-center shrink-0">
              <Scissors className="w-4 h-4 text-[#3E6255]" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#3E6255] mb-0.5">Service</div>
              <div className="text-[14px] font-semibold text-[#081C13]">{isClinic ? `At Clinic \u2013 ${serviceLabel}` : serviceLabel}</div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-start gap-3 mb-5">
            <div className="w-9 h-9 rounded-[10px] bg-[#F0F5F2] flex items-center justify-center shrink-0 text-[18px]">
              📅
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#3E6255] mb-0.5">Date &amp; Time</div>
              <div className="text-[14px] font-semibold text-[#081C13]">{dateLabel} · {timeLabel}</div>
            </div>
          </div>

          {/* Pets */}
          <div className="flex items-start gap-3 mb-5">
            <div className="w-9 h-9 rounded-[10px] bg-[#F0F5F2] flex items-center justify-center shrink-0 text-[18px]">
              🐕
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#3E6255] mb-0.5">Pets</div>
              <div className="text-[14px] font-semibold text-[#081C13]">
                {pets.map((p) => p.name).join(", ") || "Your pet"}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#F0F5F2] flex items-center justify-center shrink-0 text-[18px]">
              💳
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#3E6255] mb-0.5">Amount</div>
              <div className="text-[14px] font-semibold text-[#081C13]">
                ₹{total > 0 ? Math.round(total * 1.18) : "—"}{total > 0 ? " (incl. GST)" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Partner section (if assigned) */}
        {partner && (
          <div className="mb-4">
            <div className="text-[11px] font-bold uppercase tracking-[1px] text-[#3E6255] mb-2">Your Partner</div>
            <div className="rounded-[16px] border border-[#E8F0EC] bg-[#F5FAF7] p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-full bg-[#DDE8E3] flex items-center justify-center text-[16px] font-bold text-[#0B3B2A] shrink-0">
                  {partner.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[15px] text-[#081C13]">{partner.name}</div>
                  <div className="text-[12px] text-[#3E6255] mt-0.5">
                    ★ {partner.rating}
                    {partner.sessions ? ` · ${partner.sessions}+ sessions` : ""}
                    {` · ${partner.experience} yrs exp`}
                  </div>
                </div>
              </div>
              {partner.description && (
                <p className="text-[12px] text-[#3E6255]">{partner.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => router.push("/bookings")}
            className="flex-1 h-[50px] rounded-[14px] border border-[#DDE8E3] bg-white text-[14px] font-bold text-[#081C13] transition-colors hover:bg-[#F0F5F2]"
          >
            View Booking
          </button>
          <button
            onClick={() => router.push("/home")}
            className="flex-1 h-[50px] rounded-[14px] text-[14px] font-bold text-white shadow-lg transition-colors hover:opacity-90"
            style={{ background: "#0B3B2A" }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
