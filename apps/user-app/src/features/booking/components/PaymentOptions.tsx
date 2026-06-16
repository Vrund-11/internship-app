"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import { CreditCard, Banknote, Tag, Loader2, X } from "lucide-react";
import type { Pet, ServiceItem } from "@/shared/types";
import { calcTotal } from "@/shared/types";
import { api } from "@/lib/api";

interface PaymentOptionsProps {
  selectedPets: Pet[];
  selectedServices: ServiceItem[];
  paymentMethod: "online" | "offline" | null;
  onSelectPayment: (method: "online" | "offline") => void;
  allowOffline?: boolean;
}

const PaymentOptions = ({
  selectedPets,
  selectedServices,
  paymentMethod,
  onSelectPayment,
  allowOffline = true,
}: PaymentOptionsProps) => {
  const subtotal = calcTotal(selectedPets, selectedServices);
  
  const [promoCode, setPromoCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountPercent: number;
    discount: number;
    total: number;
  } | null>(null);
  const [promoError, setPromoError] = useState("");

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsApplying(true);
    setPromoError("");
    
    try {
      const res = await api.post("/promo/apply", {
        code: promoCode,
        amount: subtotal,
      });
      setAppliedPromo(res.data);
      setPromoCode("");
    } catch (err: any) {
      setPromoError(err.response?.data?.error || "Invalid promo code");
    } finally {
      setIsApplying(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoError("");
  };

  const finalTotal = appliedPromo ? appliedPromo.total : subtotal;

  return (
    <div className="px-4 py-5 animate-fade-in-up">
      <div className="text-[12px] text-[#5C3A58] font-bold uppercase tracking-[0.8px] mb-3">Order Summary</div>

      {/* Bill Summary */}
      <div className="bg-white rounded-[18px] border border-[#EDE4EB] p-4 mb-5">
        <div className="space-y-3">
          {selectedPets.map((pet) => (
            <div key={pet.id}>
              <div className="text-[13px] font-bold text-[#1a0a18] mb-1.5 flex items-center gap-1.5">
                <span className="text-[16px]">{pet.type === "dog" ? "🐕" : "🐈"}</span> {pet.name}
              </div>
              <div className="space-y-1.5">
                {selectedServices.map((service) => (
                  <div key={service.id} className="flex justify-between items-center text-[13px] pl-6">
                    <span className="text-[#5C3A58]">{service.name}</span>
                    <span className="font-semibold text-[#1a0a18]">
                      ₹{pet.type === "dog" ? service.dogPrice : service.catPrice}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[#F3EEF1] mt-3.5 pt-3.5 space-y-2">
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-[#5C3A58]">Subtotal</span>
            <span className="font-semibold text-[#1a0a18]">₹{subtotal}</span>
          </div>
          
          {appliedPromo && (
            <div className="flex justify-between items-center text-[13px] text-[#A7009D]">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Discount ({appliedPromo.code})
              </span>
              <span className="font-bold">-₹{appliedPromo.discount}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-1">
            <span className="text-[15px] font-bold text-[#1a0a18]">Total Amount</span>
            <span className="text-[20px] font-bold text-[#A7009D]">₹{finalTotal}</span>
          </div>
        </div>
      </div>

      {/* Promo Code Section */}
      <div className="mb-5">
        {!appliedPromo ? (
          <div>
            <div className="flex gap-2.5">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                  <Tag className="w-4 h-4 text-[#D4B8D0]" />
                </div>
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="w-full h-[44px] bg-white border border-[#EDE4EB] rounded-xl pl-9 pr-3.5 text-[13px] outline-none uppercase placeholder:normal-case placeholder:text-[#8A6888] text-[#1a0a18] font-medium tracking-wide"
                />
              </div>
              <button
                onClick={handleApplyPromo}
                disabled={!promoCode.trim() || isApplying}
                className="h-[44px] px-5 bg-[#F3EEF1] hover:bg-[#F5D6F5] text-[#A7009D] font-bold text-[13px] rounded-xl transition-colors disabled:opacity-50"
              >
                {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
              </button>
            </div>
            {promoError && (
              <div className="text-[11px] text-[#E05C35] mt-1.5 ml-1 flex items-center gap-1">
                {promoError}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#F5D6F5] border border-[#A7009D]/30 rounded-xl p-3.5 flex justify-between items-center">
            <div className="flex items-center gap-2 text-[#A7009D]">
              <div className="w-6 h-6 rounded-full bg-[#A7009D]/20 flex items-center justify-center">
                <Tag className="w-3.5 h-3.5 text-[#A7009D]" />
              </div>
              <div>
                <div className="text-[13px] font-bold uppercase tracking-wide">{appliedPromo.code} Applied</div>
                <div className="text-[11px] opacity-80">You saved ₹{appliedPromo.discount}</div>
              </div>
            </div>
            <button onClick={removePromo} className="p-1.5 hover:bg-[#A7009D]/20 rounded-lg transition-colors">
              <X className="w-4 h-4 text-[#A7009D]" />
            </button>
          </div>
        )}
      </div>

      <div className="text-[12px] text-[#5C3A58] font-bold uppercase tracking-[0.8px] mb-3">Payment Method</div>

      <div className="space-y-3">
        <button
          onClick={() => onSelectPayment("online")}
          className="w-full flex items-center gap-3.5 p-4 rounded-[18px] transition-all bg-white text-left"
          style={{
            border: `${paymentMethod === "online" ? 2 : 1}px solid ${paymentMethod === "online" ? "#A7009D" : "#EDE4EB"}`,
            background: paymentMethod === "online" ? "rgba(39,174,120,0.08)" : "#FFFFFF",
          }}
        >
          <div className="w-11 h-11 rounded-[14px] bg-[#F3EEF1] border border-[#EDE4EB] flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-[#A7009D]" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-bold text-[#1a0a18]">Pay Online</div>
            <div className="text-[11px] text-[#5C3A58] mt-0.5 leading-[1.3]">UPI, Cards, Net Banking</div>
          </div>
        </button>

        {allowOffline && (
          <button
            onClick={() => onSelectPayment("offline")}
            className="w-full flex items-center gap-3.5 p-4 rounded-[18px] transition-all bg-white text-left"
            style={{
              border: `${paymentMethod === "offline" ? 2 : 1}px solid ${paymentMethod === "offline" ? "#A7009D" : "#EDE4EB"}`,
              background: paymentMethod === "offline" ? "rgba(39,174,120,0.08)" : "#FFFFFF",
            }}
          >
            <div className="w-11 h-11 rounded-[14px] bg-[#F3EEF1] border border-[#EDE4EB] flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5 text-[#A7009D]" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-bold text-[#1a0a18]">Pay After Service</div>
              <div className="text-[11px] text-[#5C3A58] mt-0.5 leading-[1.3]">Cash or UPI after completion</div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentOptions;
