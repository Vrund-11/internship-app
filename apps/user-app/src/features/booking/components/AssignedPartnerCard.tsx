import { Button } from "@/shared/components/ui/button";
import { MessageCircle, MessageSquare, Phone, Star, ShieldCheck } from "lucide-react";

interface AssignedPartner {
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  avatar: string;
  phone?: string | null;
  eta?: string | null;
}

interface AssignedPartnerCardProps {
  partner: AssignedPartner;
  onContinue: () => void;
}

const AssignedPartnerCard = ({ partner, onContinue }: AssignedPartnerCardProps) => {
  const whatsappNumber = partner.phone ? partner.phone.replace(/\D/g, "") : "";

  return (
    <div className="px-4 py-8 animate-fade-in-up">
      <div className="text-[12px] text-[#3E6255] font-bold uppercase tracking-[0.8px] mb-3 text-center">Partner Assigned</div>

      <div className="bg-white rounded-[24px] border border-[#DDE8E3] p-5 mb-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-start gap-4 border-b border-[#F0F5F2] pb-5 mb-5">
          <div className="w-[60px] h-[60px] rounded-[18px] bg-[#E3F6EE] flex items-center justify-center text-[30px] shrink-0 border border-[#27AE78]/20">
            {partner.avatar}
          </div>
          <div className="flex-1 pt-1">
            <h3 className="font-serif text-[18px] text-[#081C13] leading-tight flex items-center gap-1.5">
              {partner.name}
              <ShieldCheck className="w-4 h-4 text-[#2E7BD4]" />
            </h3>
            <p className="text-[13px] text-[#3E6255] mt-0.5">{partner.specialization}</p>
            
            <div className="flex flex-wrap gap-2 mt-2.5">
              <span className="inline-flex items-center gap-1 bg-[#FFF4F0] px-2 py-0.5 rounded-md text-[11px] font-bold text-[#C8731A]">
                <Star className="w-3 h-3 text-[#F5922A] fill-[#F5922A]" />
                {partner.rating}
              </span>
              <span className="bg-[#F0F5F2] px-2 py-0.5 rounded-md text-[11px] font-bold text-[#3E6255]">
                {partner.experience} yrs exp
              </span>
              {partner.eta ? (
                <span className="bg-[#E3F6EE] px-2 py-0.5 rounded-md text-[11px] font-bold text-[#1D8F60]">
                  ETA {partner.eta}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {partner.phone ? (
          <div>
            <div className="text-[12px] text-[#3E6255] font-semibold mb-2">Contact Partner</div>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={`tel:${partner.phone}`}
                className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-[#DDE8E3] bg-[#F0F5F2]/50 h-[72px] text-[12px] font-bold text-[#081C13] transition-colors hover:bg-[#E3F6EE] hover:border-[#27AE78]/30"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <Phone className="w-4 h-4 text-[#2E7BD4]" />
                </div>
                Call
              </a>
              <a
                href={`sms:${partner.phone}`}
                className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-[#DDE8E3] bg-[#F0F5F2]/50 h-[72px] text-[12px] font-bold text-[#081C13] transition-colors hover:bg-[#E3F6EE] hover:border-[#27AE78]/30"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <MessageSquare className="w-4 h-4 text-[#F5922A]" />
                </div>
                SMS
              </a>
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-[#DDE8E3] bg-[#F0F5F2]/50 h-[72px] text-[12px] font-bold text-[#081C13] transition-colors hover:bg-[#E3F6EE] hover:border-[#27AE78]/30"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <MessageCircle className="w-4 h-4 text-[#27AE78]" />
                </div>
                WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-[#FEF1E4] rounded-[14px] p-3 border border-[#C8731A]/20">
            <p className="text-[12px] text-[#C8731A] font-medium text-center">
              Partner contact details will appear once the booking is fully confirmed.
            </p>
          </div>
        )}
      </div>

      <Button 
        onClick={onContinue} 
        className="w-full rounded-[18px] h-[52px] bg-[#0B3B2A] hover:bg-[#155E41] text-white font-bold text-[15px] shadow-elevated"
      >
        View Booking Summary
      </Button>
    </div>
  );
};

export default AssignedPartnerCard;
