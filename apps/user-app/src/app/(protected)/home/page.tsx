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

        {/* Footer Anchor */}
        {/* Desktop Footer */}
        <footer className="hidden md:block bg-white border-t border-[#EDE4EB] w-full mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center w-full px-10 py-10 max-w-[1280px] mx-auto gap-8">
            <div className="flex flex-col gap-2">
              <span className="font-headline-sm text-[#6c005f] font-bold tracking-tight">canovet</span>
              <p className="font-body-md text-[#54414d] opacity-80">© 2025 canovet. Concierge Pet Care Excellence.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              <a className="font-body-md text-[#54414d] hover:text-[#A7009D] hover:underline transition-all" href="#">Privacy Policy</a>
              <a className="font-body-md text-[#54414d] hover:text-[#A7009D] hover:underline transition-all" href="#">Terms of Service</a>
              <a className="font-body-md text-[#54414d] hover:text-[#A7009D] hover:underline transition-all" href="#">Contact Us</a>
              <a className="font-body-md text-[#54414d] hover:text-[#A7009D] hover:underline transition-all" href="#">Careers</a>
            </div>
            <div className="flex gap-4">
              <button className="w-10 h-10 rounded-full bg-[#f0f3ff] flex items-center justify-center text-[#6c005f] hover:bg-[#A7009D] hover:text-white transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </button>
            </div>
          </div>
        </footer>
        {/* Mobile Footer (simple) */}
        <footer className="md:hidden bg-white border-t border-[#EDE4EB] w-full py-6 mt-4">
          <div className="flex flex-col items-center gap-2 px-4">
            <span className="font-headline-sm text-[#6c005f] font-bold text-sm tracking-tight">canovet</span>
            <p className="text-[11px] text-[#54414d] opacity-70">© 2025 canovet. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </AppShell>
  );
}
