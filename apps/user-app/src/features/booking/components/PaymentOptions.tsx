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
  onAppliedPromoChange?: (promo: { code: string; discountPercent: number; discount: number; total: number } | null) => void;
}

const PaymentOptions = ({
  selectedPets,
  selectedServices,
  paymentMethod,
  onSelectPayment,
  allowOffline = true,
  onAppliedPromoChange,
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
      onAppliedPromoChange?.(res.data);
      setPromoCode("");
    } catch (err: any) {
      setPromoError(err.response?.data?.error || "Invalid promo code");
    } finally {
      setIsApplying(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    onAppliedPromoChange?.(null);
    setPromoError("");
  };

  const finalTotal = appliedPromo ? appliedPromo.total : subtotal;

  return (
    <div className="px-5 py-5 animate-fade-in-up">
      <div className="text-[12px] text-[#121212] font-extrabold uppercase tracking-[0.8px] mb-3 px-1">ORDER SUMMARY</div>

      {/* Bill Summary */}
      <div className="bg-white rounded-[18px] border border-[#EDE4EB] p-4 mb-5 shadow-card">
        <div className="space-y-3">
          {selectedPets.map((pet) => (
            <div key={pet.id}>
              <div className="text-[13px] font-extrabold text-[#121212] mb-1.5 flex items-center gap-1.5">
                <span className="text-[16px]">{pet.type === "dog" ? "🐕" : "🐈"}</span> {pet.name}
              </div>
              <div className="space-y-1.5">
                {selectedServices.map((service) => (
                  <div key={service.id} className="flex justify-between items-center text-[13px] pl-6 font-semibold">
                    <span className="text-[#4A4A4A]">{service.name}</span>
                    <span className="text-[#121212]">
                      ₹{pet.type === "dog" ? service.dogPrice : service.catPrice}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[#F8F8F8] mt-3.5 pt-3.5 space-y-2">
          <div className="flex justify-between items-center text-[13px] font-semibold">
            <span className="text-[#4A4A4A]">Subtotal</span>
            <span className="text-[#121212]">₹{subtotal}</span>
          </div>
          
          {appliedPromo && (
            <div className="flex justify-between items-center text-[13px] text-[#FF10F0] font-bold">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#FF10F0]" /> Discount ({appliedPromo.code})
              </span>
              <span>-₹{appliedPromo.discount}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-1 border-t border-[#F8F8F8] mt-2">
            <span className="text-[15px] font-extrabold text-[#121212]">Total Amount</span>
            <span className="text-[20px] font-extrabold text-[#FF10F0]">₹{finalTotal}</span>
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
                  <Tag className="w-4 h-4 text-[#EDE4EB]" />
                </div>
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="w-full h-[44px] bg-white border border-[#EDE4EB] rounded-xl pl-9 pr-3.5 text-[13px] outline-none uppercase placeholder:normal-case placeholder:text-[#4A4A4A] text-[#121212] font-semibold tracking-wide focus:border-[#FF10F0]"
                />
              </div>
              <button
                onClick={handleApplyPromo}
                disabled={!promoCode.trim() || isApplying}
                className="h-[44px] px-5 bg-[#FF10F0] hover:bg-[#FF10F0]/90 text-white font-bold text-[13px] rounded-xl transition-colors disabled:opacity-50 border-none cursor-pointer"
              >
                {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
              </button>
            </div>
            {promoError && (
              <div className="text-[11px] text-[#E05C35] mt-1.5 ml-1 flex items-center gap-1 font-bold">
                ⚠️ {promoError}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#FFF0FC] border border-[#FF10F0]/30 rounded-xl p-3.5 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2 text-[#FF10F0]">
              <div className="w-6 h-6 rounded-full bg-[#FF10F0]/10 flex items-center justify-center">
                <Tag className="w-3.5 h-3.5 text-[#FF10F0]" />
              </div>
              <div>
                <div className="text-[13px] font-extrabold uppercase tracking-wide">{appliedPromo.code} Applied</div>
                <div className="text-[11px] font-semibold opacity-90">You saved ₹{appliedPromo.discount}</div>
              </div>
            </div>
            <button onClick={removePromo} className="p-1.5 hover:bg-[#FF10F0]/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer">
              <X className="w-4 h-4 text-[#FF10F0]" />
            </button>
          </div>
        )}
      </div>

      <div className="text-[12px] text-[#121212] font-extrabold uppercase tracking-[0.8px] mb-3 px-1">Payment Method</div>

      <div className="space-y-3">
        <button
          onClick={() => onSelectPayment("online")}
          className="w-full flex items-center gap-3.5 p-4 rounded-[18px] transition-all bg-white text-left shadow-card"
          style={{
            border: `${paymentMethod === "online" ? 2 : 1}px solid ${paymentMethod === "online" ? "#FF10F0" : "#EDE4EB"}`,
            background: paymentMethod === "online" ? "rgba(255, 16, 240, 0.04)" : "#FFFFFF",
          }}
        >
          <div className="w-11 h-11 rounded-[14px] bg-[#FFF0FC] border border-[#FF10F0]/10 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-[#FF10F0]" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-extrabold text-[#121212]">Pay Online</div>
            <div className="text-[11px] text-[#4A4A4A] mt-0.5 leading-[1.3] font-semibold">UPI, Cards, Net Banking</div>
          </div>
          <div 
            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
            style={{ border: `2px solid ${paymentMethod === "online" ? "#FF10F0" : "#EDE4EB"}` }}
          >
            {paymentMethod === "online" && (
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF10F0]" />
            )}
          </div>
        </button>

        {allowOffline && (
          <button
            onClick={() => onSelectPayment("offline")}
            className="w-full flex items-center gap-3.5 p-4 rounded-[18px] transition-all bg-white text-left shadow-card"
            style={{
              border: `${paymentMethod === "offline" ? 2 : 1}px solid ${paymentMethod === "offline" ? "#FF10F0" : "#EDE4EB"}`,
              background: paymentMethod === "offline" ? "rgba(255, 16, 240, 0.04)" : "#FFFFFF",
            }}
          >
            <div className="w-11 h-11 rounded-[14px] bg-[#FFF0FC] border border-[#FF10F0]/10 flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5 text-[#FF10F0]" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-extrabold text-[#121212]">Pay After Service</div>
              <div className="text-[11px] text-[#4A4A4A] mt-0.5 leading-[1.3] font-semibold">Cash or UPI after completion</div>
            </div>
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={{ border: `2px solid ${paymentMethod === "offline" ? "#FF10F0" : "#EDE4EB"}` }}
            >
              {paymentMethod === "offline" && (
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF10F0]" />
              )}
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentOptions;
