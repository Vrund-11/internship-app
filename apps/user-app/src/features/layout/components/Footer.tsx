"use client";

import Link from "next/link";
import { cn } from "@/shared/lib/utils";

const Footer = () => {
  return (
    <>
      {/* Desktop Footer */}
      <footer className="hidden md:block bg-white border-t border-[#EDE4EB] w-full mt-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 lg:px-8 py-8 max-w-[1440px] mx-auto gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-lg font-extrabold text-[#121212] tracking-[-0.4px]">
              canovet
            </span>
            <p className="text-[13px] text-[#4A4A4A] font-normal">
              © 2026 canovet. Concierge Pet Care Excellence.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="#" className="text-[13px] text-[#4A4A4A] hover:text-[#A7009D] hover:underline transition-colors font-medium">
              Privacy Policy
            </Link>
            <Link href="#" className="text-[13px] text-[#4A4A4A] hover:text-[#A7009D] hover:underline transition-colors font-medium">
              Terms of Service
            </Link>
            <Link href="#" className="text-[13px] text-[#4A4A4A] hover:text-[#A7009D] hover:underline transition-colors font-medium">
              Contact Us
            </Link>
            <Link href="#" className="text-[13px] text-[#4A4A4A] hover:text-[#A7009D] hover:underline transition-colors font-medium">
              Careers
            </Link>
          </div>
          <div className="flex gap-3">
            <button className="w-9 h-9 rounded-full bg-[#F8F4F8] flex items-center justify-center text-[#121212] hover:bg-[#A7009D] hover:text-white transition-colors" aria-label="Share">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Footer */}
      <footer className="md:hidden bg-white border-t border-[#EDE4EB] w-full py-5 pb-24 mt-auto relative z-10">
        <div className="flex flex-col items-center gap-1 px-4">
          <span className="text-[15px] font-extrabold text-[#121212] tracking-[-0.3px]">
            canovet
          </span>
          <p className="text-[11px] text-[#4A4A4A] font-normal">
            © 2026 canovet. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
};

export default Footer;
