"use client";

import { useEffect, useState } from "react";

interface SearchingPartnerProps {
  onFound: () => void;
}

const SearchingPartner = ({ onFound }: SearchingPartnerProps) => {
  const [dotIndex, setDotIndex] = useState(0);
  const totalTime = 6;

  useEffect(() => {
    const elapsed = { count: 0 };
    const timer = setInterval(() => {
      elapsed.count += 1;
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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "#0B3B2A" }}
    >
      {/* Ripple rings */}
      <div className="relative flex items-center justify-center w-44 h-44 mb-10">
        <div
          className="absolute inset-0 rounded-full opacity-10 animate-ping"
          style={{ background: "#27AE78", animationDuration: "2s" }}
        />
        <div
          className="absolute inset-4 rounded-full opacity-15"
          style={{ background: "rgba(39,174,120,0.2)" }}
        />
        {/* Icon circle */}
        <div
          className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #27AE78 0%, #1D8F60 100%)" }}
        >
          <span className="text-[36px] select-none">🐾</span>
        </div>
      </div>

      <h2 className="text-white font-bold text-[24px] mb-3 text-center px-8">
        Finding your partner...
      </h2>
      <p className="text-white/50 text-[14px] text-center px-10 leading-relaxed">
        Matching you with the best available vet near you
      </p>

      {/* Three dot indicator */}
      <div className="flex gap-2 mt-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{ background: dotIndex === i ? "#27AE78" : "rgba(255,255,255,0.25)" }}
          />
        ))}
      </div>
    </div>
  );
};

export default SearchingPartner;
