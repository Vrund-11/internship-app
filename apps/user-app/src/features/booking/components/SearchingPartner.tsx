"use client";

import { useEffect, useState } from "react";
import { Sparkles, MapPin, ShieldCheck, Heart } from "lucide-react";

interface SearchingPartnerProps {
  onFound: () => void;
}

const SearchingPartner = ({ onFound }: SearchingPartnerProps) => {
  const [dotIndex, setDotIndex] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const totalTime = 6;

  const statusMessages = [
    "Locating certified specialists nearby...",
    "Verifying location and service coordinates...",
    "Checking real-time partner availability...",
    "Sending request to closest matching providers...",
    "Securing your appointment slot...",
    "Finalizing partner details and booking confirmation..."
  ];

  useEffect(() => {
    const elapsed = { count: 0 };
    const timer = setInterval(() => {
      elapsed.count += 1;
      if (elapsed.count < totalTime) {
        setStatusIndex(elapsed.count);
      }
      if (elapsed.count >= totalTime) {
        clearInterval(timer);
        setTimeout(onFound, 300);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [onFound]);

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDotIndex((prev) => (prev + 1) % 3);
    }, 500);
    return () => clearInterval(dotTimer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center font-sans overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1A0818 0%, #3D093B 40%, #760C74 80%, #A7009D 100%)" }}
    >
      {/* Decorative Floating Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#FF10F0]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#A7009D]/15 blur-[120px] pointer-events-none" />

      {/* Main Sonar Animation Container */}
      <div className="relative flex items-center justify-center w-64 h-64 mb-10">
        {/* Pulsating Sonar Rings */}
        <div className="absolute w-full h-full rounded-full border border-white/5 bg-white/[0.01] animate-ping" style={{ animationDuration: "3s" }} />
        <div className="absolute w-[80%] h-[80%] rounded-full border border-white/10 bg-white/[0.02] animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }} />
        <div className="absolute w-[60%] h-[60%] rounded-full border border-[#FF10F0]/20 bg-[#FF10F0]/[0.02] animate-ping" style={{ animationDuration: "2s", animationDelay: "1s" }} />
        
        {/* Glowing Center Ring */}
        <div className="absolute w-40 h-40 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center shadow-[0_0_50px_rgba(255,16,240,0.15)] animate-pulse" />

        {/* Central Paw Icon Container */}
        <div className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-tr from-[#A7009D] to-[#FF10F0] flex items-center justify-center shadow-lg border-2 border-white/30 animate-pulse-soft">
          <span className="text-[52px] select-none filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]">🐾</span>
        </div>
      </div>

      {/* Text Info Area */}
      <div className="relative z-10 text-center max-w-md px-6">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/10 rounded-full border border-white/25 text-[11px] font-extrabold text-white uppercase tracking-wider mb-4 animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-[#FF10F0]" /> Premium Matching Engine
        </div>

        <h2 className="text-white font-extrabold text-[26px] md:text-[30px] mb-3 tracking-tight leading-tight">
          Finding Your Partner
        </h2>
        
        {/* Status updates log */}
        <div className="h-12 flex items-center justify-center">
          <p className="text-white/90 text-[14px] leading-relaxed font-bold transition-all duration-300 animate-pulse">
            {statusMessages[statusIndex]}
          </p>
        </div>

        {/* Dynamic scanning log labels */}
        <div className="grid grid-cols-3 gap-3.5 mt-8 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/70 mb-2">
              <MapPin className="w-5 h-5 text-[#FF10F0]" />
            </div>
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Coordinates</span>
            <span className="text-[11px] font-extrabold text-white mt-0.5">Verified</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/70 mb-2">
              <ShieldCheck className="w-5 h-5 text-[#FF10F0]" />
            </div>
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Quality Gate</span>
            <span className="text-[11px] font-extrabold text-white mt-0.5">Certified Only</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/70 mb-2">
              <Heart className="w-5 h-5 text-[#FF10F0]" />
            </div>
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Match Priority</span>
            <span className="text-[11px] font-extrabold text-white mt-0.5">Top-Rated</span>
          </div>
        </div>
      </div>

      {/* Dot Indicators */}
      <div className="flex gap-2.5 mt-10 relative z-10">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full transition-all duration-300"
            style={{ background: dotIndex === i ? "#FF10F0" : "rgba(255,255,255,0.2)" }}
          />
        ))}
      </div>
    </div>
  );
};

export default SearchingPartner;
