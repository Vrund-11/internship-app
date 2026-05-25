"use client";

import AppShell from "@/features/layout/components/AppShell";
import HeroSection from "@/features/home/components/HeroSection";
import ServiceGrid from "@/features/home/components/ServiceGrid";
import TrustBadges from "@/features/home/components/TrustBadges";

export default function HomePage() {
  return (
    <AppShell>
      <div className="bg-[#F5FAF7] min-h-screen pb-16">
        <HeroSection />
        <ServiceGrid />
        <TrustBadges />
      </div>
    </AppShell>
  );
}
