"use client";

import AppShell from "@/features/layout/components/AppShell";
import HeroSection from "@/features/home/components/HeroSection";
import ServiceGrid from "@/features/home/components/ServiceGrid";
import TrustBadges from "@/features/home/components/TrustBadges";

export default function HomePage() {
  return (
    <AppShell>
      <div
        className="min-h-screen flex flex-col justify-between"
        style={{ background: "#F8F4F8" }}
      >
        {/* Desktop: subtle background pattern */}
        <div className="hidden md:block fixed inset-0 pointer-events-none z-0" style={{
          backgroundImage: "radial-gradient(rgba(167,0,157,0.015) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
        
        <div className="relative z-10 w-full flex-1">
          <HeroSection />
          <ServiceGrid />
          <TrustBadges />
        </div>
      </div>
    </AppShell>
  );
}
