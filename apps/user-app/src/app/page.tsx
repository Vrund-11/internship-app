"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const PawSvg = ({ color = "#fff", size = 48, className = "" }: { color?: string; size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 44 44" className={className}>
    <ellipse cx="12" cy="16" rx="4.2" ry="5.4" fill={color} />
    <ellipse cx="22" cy="11" rx="3.8" ry="4.8" fill={color} />
    <ellipse cx="32" cy="16" rx="4.2" ry="5.4" fill={color} />
    <ellipse cx="22" cy="6" rx="2.8" ry="3.4" fill={color} />
    <ellipse cx="22" cy="29" rx="9.5" ry="8.2" fill={color} />
  </svg>
);

export default function SplashPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      if (!loading) {
        router.replace(user ? "/home" : "/login");
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!show && !loading) {
      router.replace(user ? "/home" : "/login");
    }
  }, [show, loading, user, router]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #390035 0%, #A7009D 45%, #CC00BE 80%, #E040D0 100%)",
      }}
    >
      {/* Decorative circles - enhanced for desktop */}
      <div className="absolute -top-[80px] -right-[80px] w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full bg-white/5" />
      <div className="absolute w-[200px] h-[200px] md:w-[400px] md:h-[400px] rounded-full bg-white/[0.04]" style={{ bottom: 30, left: -60 }} />
      <div className="absolute right-0 bottom-[50px] opacity-[0.06] md:opacity-[0.04]">
        <PawSvg color="#fff" size={180} />
      </div>

      {/* Desktop-only floating paw prints */}
      <div className="hidden md:block">
        <div className="absolute top-[10%] left-[8%] opacity-[0.05]" style={{ animation: "particle-float 14s ease-in-out infinite" }}>
          <PawSvg color="#fff" size={60} />
        </div>
        <div className="absolute top-[20%] right-[12%] opacity-[0.04]" style={{ animation: "particle-float 18s ease-in-out infinite 3s" }}>
          <PawSvg color="#fff" size={90} />
        </div>
        <div className="absolute bottom-[20%] left-[15%] opacity-[0.06]" style={{ animation: "particle-float 12s ease-in-out infinite 1s" }}>
          <PawSvg color="#fff" size={45} />
        </div>
        <div className="absolute bottom-[30%] right-[8%] opacity-[0.03]" style={{ animation: "particle-float 20s ease-in-out infinite 5s" }}>
          <PawSvg color="#fff" size={120} />
        </div>
        {/* Decorative grid dots */}
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        {/* Extra orbs for desktop */}
        <div className="absolute w-[600px] h-[600px] rounded-full animate-float-subtle" style={{
          top: "-20%",
          right: "20%",
          background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
        }} />
        <div className="absolute w-[400px] h-[400px] rounded-full" style={{
          bottom: "10%",
          left: "30%",
          background: "radial-gradient(circle, rgba(167,255,215,0.04) 0%, transparent 70%)",
          animation: "float-subtle 8s ease-in-out infinite reverse",
        }} />
      </div>

      {/* Center content */}
      <div className="text-center animate-fade-in-up relative z-10">
        {/* Logo badge - larger on desktop */}
        <div
          className="rounded-[28px] md:rounded-[36px] px-[38px] py-5 md:px-[56px] md:py-7 mx-auto mb-5 md:mb-8 inline-block animate-pop"
          style={{
            background: "#fff",
            boxShadow: "0 24px 60px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.4)",
          }}
        >
          <div className="flex items-center">
            <span className="text-[24px] md:text-[36px] font-extrabold text-[#1a0a18] tracking-[-0.4px]">cano</span>
            <PawSvg color="#1a0a18" size={27} className="md:hidden" />
            <PawSvg color="#1a0a18" size={40} className="hidden md:block" />
            <span className="text-[24px] md:text-[36px] font-extrabold text-[#1a0a18] tracking-[-0.4px]">et</span>
          </div>
        </div>

        {/* Tagline */}
        <div className="flex items-center justify-center gap-1.5 bg-white/[0.12] rounded-full px-3.5 py-1.5 md:px-5 md:py-2 mx-auto w-fit mb-2 md:mb-4 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#A7FFD7] animate-blink" />
          <span className="text-[11px] md:text-[13px] font-bold text-white/90 tracking-[0.1em] uppercase">
            Premium Pet Care
          </span>
        </div>

        <div className="text-sm md:text-lg text-white/50 italic mt-1 md:mt-3">
          Because they deserve the best 🐾
        </div>

        {/* Desktop-only tagline */}
        <div className="hidden md:block mt-6 text-[15px] text-white/30 max-w-sm mx-auto leading-relaxed">
          Grooming · Veterinary Care · Premium Food · Accessories
        </div>
      </div>

      {/* Loading dots */}
      <div className="absolute bottom-[52px] md:bottom-[60px] flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-full animate-blink"
            style={{
              width: i === 0 ? 28 : 7,
              height: 7,
              background: i === 0 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)",
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </div>

      {/* Version badge */}
      <div className="absolute bottom-5 text-[11px] md:text-[12px] text-white/[0.22] font-medium tracking-[0.08em]">
        CANOVET v2.0 · AHMEDABAD
      </div>
    </div>
  );
}
