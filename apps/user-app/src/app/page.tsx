"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{
        background: "radial-gradient(circle at 65% 38%, #1D6B47 0%, #0B3B2A 65%)",
      }}
    >
      {/* Decorative rings */}
      <div className="absolute -top-[100px] -right-[100px] w-[320px] h-[320px] rounded-full border border-[rgba(39,174,120,0.18)]" />
      <div className="absolute -top-[50px] -right-[50px] w-[200px] h-[200px] rounded-full border border-[rgba(39,174,120,0.12)]" />
      <div className="absolute -bottom-[40px] -left-[80px] w-[260px] h-[260px] rounded-full border border-[rgba(39,174,120,0.10)]" />
      <div className="absolute bottom-[120px] -left-[20px] w-[140px] h-[140px] rounded-full border border-[rgba(245,146,42,0.15)]" />

      {/* Center content */}
      <div className="text-center animate-fade-in-up">
        {/* Logo mark */}
        <div
          className="w-[88px] h-[88px] rounded-[28px] flex items-center justify-center mx-auto mb-7"
          style={{
            background: "linear-gradient(145deg, #27AE78 0%, #1D8F60 100%)",
            boxShadow: "0 24px 48px rgba(39,174,120,0.35), 0 0 0 1px rgba(255,255,255,0.1)",
          }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <ellipse cx="24" cy="32" rx="10" ry="9" fill="white" opacity="0.95"/>
            <ellipse cx="13" cy="22" rx="5" ry="6.5" fill="white" opacity="0.8"/>
            <ellipse cx="35" cy="22" rx="5" ry="6.5" fill="white" opacity="0.8"/>
            <ellipse cx="18" cy="15" rx="4" ry="5" fill="white" opacity="0.7"/>
            <ellipse cx="30" cy="15" rx="4" ry="5" fill="white" opacity="0.7"/>
            <ellipse cx="24" cy="10" rx="3.5" ry="4.5" fill="white" opacity="0.6"/>
          </svg>
        </div>

        <div className="font-serif text-[40px] text-white tracking-tight leading-none">
          Canovet
        </div>
        <div className="text-[13px] text-white/40 mt-2 tracking-[2.5px] uppercase font-medium">
          Premium Pet Care
        </div>
        <div className="mt-1.5 text-[14px] text-white/55 italic font-serif">
          Because they deserve the best
        </div>
      </div>

      {/* Loading dots */}
      <div className="absolute bottom-16 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 rounded-full animate-pulse-soft"
            style={{
              width: i === 0 ? 24 : 6,
              background: i === 0 ? "#27AE78" : "rgba(255,255,255,0.2)",
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </div>

      {/* Version badge */}
      <div className="absolute bottom-6 text-[11px] text-white/25 tracking-wider">
        v1.0 · Canovet
      </div>
    </div>
  );
}
