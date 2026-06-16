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
      <div className="text-[12px] text-[#5C3A58] font-bold uppercase tracking-[0.8px] mb-3 text-center">Partner Assigned</div>

      <div className="bg-white rounded-[24px] border border-[#EDE4EB] p-5 mb-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-start gap-4 border-b border-[#F3EEF1] pb-5 mb-5">
          <div className="w-[60px] h-[60px] rounded-[18px] bg-[#F5D6F5] flex items-center justify-center text-[30px] shrink-0 border border-[#A7009D]/20">
            {partner.avatar}
          </div>
          <div className="flex-1 pt-1">
            <h3 className="font-bold text-[18px] text-[#1a0a18] leading-tight flex items-center gap-1.5">
              {partner.name}
              <ShieldCheck className="w-4 h-4 text-[#2E7BD4]" />
            </h3>
            <p className="text-[13px] text-[#5C3A58] mt-0.5">{partner.specialization}</p>
            
            <div className="flex flex-wrap gap-2 mt-2.5">
              <span className="inline-flex items-center gap-1 bg-[#FFF4F0] px-2 py-0.5 rounded-md text-[11px] font-bold text-[#b45309]">
                <Star className="w-3 h-3 text-[#b45309] fill-[#b45309]" />
                {partner.rating}
              </span>
              <span className="bg-[#F3EEF1] px-2 py-0.5 rounded-md text-[11px] font-bold text-[#5C3A58]">
                {partner.experience} yrs exp
              </span>
              {partner.eta ? (
                <span className="bg-[#F5D6F5] px-2 py-0.5 rounded-md text-[11px] font-bold text-[#A7009D]">
                  ETA {partner.eta}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {partner.phone ? (
          <div>
            <div className="text-[12px] text-[#5C3A58] font-semibold mb-2">Contact Partner</div>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={`tel:${partner.phone}`}
                className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-[#EDE4EB] bg-[#F3EEF1]/50 h-[72px] text-[12px] font-bold text-[#1a0a18] transition-colors hover:bg-[#F5D6F5] hover:border-[#A7009D]/30"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <Phone className="w-4 h-4 text-[#2E7BD4]" />
                </div>
                Call
              </a>
              <a
                href={`sms:${partner.phone}`}
                className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-[#EDE4EB] bg-[#F3EEF1]/50 h-[72px] text-[12px] font-bold text-[#1a0a18] transition-colors hover:bg-[#F5D6F5] hover:border-[#A7009D]/30"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <MessageSquare className="w-4 h-4 text-[#b45309]" />
                </div>
                SMS
              </a>
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-[#EDE4EB] bg-[#F3EEF1]/50 h-[72px] text-[12px] font-bold text-[#1a0a18] transition-colors hover:bg-[#F5D6F5] hover:border-[#A7009D]/30"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <MessageCircle className="w-4 h-4 text-[#A7009D]" />
                </div>
                WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-[#FEF3C7] rounded-[14px] p-3 border border-[#b45309]/20">
            <p className="text-[12px] text-[#b45309] font-medium text-center">
              Partner contact details will appear once the booking is fully confirmed.
            </p>
          </div>
        )}
      </div>

      <Button 
        onClick={onContinue} 
        className="w-full rounded-[18px] h-[52px] bg-[#A7009D] hover:bg-[#6B0068] text-white font-bold text-[15px] shadow-elevated"
      >
        View Booking Summary
      </Button>
    </div>
  );
};

export default AssignedPartnerCard;
