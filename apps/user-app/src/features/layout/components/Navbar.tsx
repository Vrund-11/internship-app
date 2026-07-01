"use client";


import { Bell, MapPin } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCity } from "@/context/CityContext";
import { useAuth } from "@/context/AuthContext";


import { cn } from "@/shared/lib/utils";

const PawSvg = ({ color = "#1a0a18", size = 21 }: { color?: string; size?: number }) => (
  <svg width={size} height={Math.round(size * 1.12)} viewBox="0 0 44 44" style={{ display: "block", margin: "0 1px" }}>
    <ellipse cx="12" cy="16" rx="4.2" ry="5.4" fill={color} />
    <ellipse cx="22" cy="11" rx="3.8" ry="4.8" fill={color} />
    <ellipse cx="32" cy="16" rx="4.2" ry="5.4" fill={color} />
    <ellipse cx="22" cy="6" rx="2.8" ry="3.4" fill={color} />
    <ellipse cx="22" cy="29" rx="9.5" ry="8.2" fill={color} />
  </svg>
);



const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { city } = useCity();
  const { user } = useAuth();


  
  const firstName = user?.name ? user.name.split(" ")[0] : "Guest";
  const initials = firstName.charAt(0).toUpperCase();

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  };



  // Only show greeting on the home page
  const showGreeting = pathname === "/home";

  return (
    <header className="sticky top-0 z-50">
      {/* Mobile Navbar */}
      <div className="md:hidden bg-white pt-safe border-b border-[#EDE4EB]">
        <div className="px-6 pt-4 pb-3">
          <div className="flex justify-between items-center">
            {/* Brand logo & Location pill */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center">
                <span className="text-[18px] font-extrabold text-[#121212] tracking-[-0.4px]">cano</span>
                <PawSvg color="#FF10F0" size={17} />
                <span className="text-[18px] font-extrabold text-[#121212] tracking-[-0.4px]">et</span>
              </div>
              <div className="flex">
                <div className="inline-flex items-center gap-1 bg-[#F8F8F8] px-2.5 py-0.5 rounded-full border border-[#EDE4EB] text-[11px] text-[#4A4A4A] font-semibold">
                  <span className="text-[10px]">📍</span>
                  {city?.name ? `${city.name}` : "Select City"}
                </div>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex gap-2.5 items-center">
              <button className="w-10 h-10 rounded-xl bg-[#FFF9E6] border-none flex items-center justify-center relative animate-pulse-soft" aria-label="Notifications">
                <Bell className="w-5 h-5 text-[#E0A800]" />
                <div className="absolute top-2 right-[9px] w-[7px] h-[7px] rounded-full bg-[#FF10F0] border-2 border-white" />
              </button>
              <button 
                onClick={() => router.push("/profile")}
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(255,16,240,0.2)]"
                style={{ background: "linear-gradient(135deg, #FF10F0, #A7009D)" }}
              >
                <span className="text-white font-extrabold text-[14px]">{initials}</span>
              </button>
            </div>
          </div>
          {showGreeting && (
            <div className="pb-1 pt-3.5">
              <div className="text-[24px] font-extrabold text-[#121212] leading-[1.2] tracking-[-0.5px]">
                {getGreeting()}, {firstName} 👋
              </div>
            </div>
          )}

          {/* Search bar removed per user request */}
        </div>
      </div>

      {/* ===== DESKTOP NAVBAR ===== */}
      <div className="hidden md:block bg-white border-b border-[#EDE4EB] shadow-card">
        <div className="flex items-center justify-between px-6 lg:px-8 py-3 max-w-[1440px] mx-auto w-full">
          {/* Left: Brand */}
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-1 cursor-pointer group"
              onClick={() => router.push("/home")}
            >
              <span className="text-[24px] font-extrabold text-[#1a0a18] tracking-[-0.5px] group-hover:text-[#FF10F0] transition-colors">cano</span>
              <PawSvg color="#FF10F0" size={24} />
              <span className="text-[24px] font-extrabold text-[#1a0a18] tracking-[-0.5px] group-hover:text-[#FF10F0] transition-colors">et</span>
            </div>
            <div className="h-6 w-px bg-[#EDE4EB]" />
            <div className="flex items-center gap-1.5 text-[12px] text-[#8A6888] font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#FF10F0]" />
              <span>{city?.name ?? "Select City"}</span>
            </div>
          </div>

          {/* Center: Navigation Pills */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-1 bg-[#F8F4F8] px-2 py-1.5 rounded-full border border-[#EDE4EB]">
              {[
                { label: "Home", path: "/home", emoji: "🏠" },
                { label: "Bookings", path: "/bookings", emoji: "📅" },
                { label: "Pets", path: "/pets", emoji: "🐾" },
                { label: "Profile", path: "/profile", emoji: "👤" },
              ].map((item) => {
                const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
                return (
                  <Link
                    key={item.label}
                    href={item.path}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all duration-300",
                      isActive
                        ? "bg-gradient-to-r from-[#A7009D] to-[#FF10F0] text-white shadow-[0_4px_16px_rgba(255,16,240,0.3)]"
                        : "text-[#5C3A58] hover:bg-white/80 hover:text-[#FF10F0] hover:shadow-sm"
                    )}
                  >
                    <span className="text-[14px]">{item.emoji}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: Actions (no search on /home, no Ask Cano) */}
          <div className="flex items-center gap-3">
            {/* Search bar removed per user request */}

            {/* Notification bell */}
            <button className="relative w-10 h-10 rounded-full bg-white border border-[#EDE4EB] flex items-center justify-center hover:bg-[#FBF0FB] hover:border-[#FF10F0]/20 hover:shadow-sm transition-all group">
              <Bell className="w-[18px] h-[18px] text-[#5C3A58] group-hover:text-[#FF10F0] transition-colors" />
              <div className="absolute top-[8px] right-[8px] w-2 h-2 rounded-full bg-[#FF10F0] animate-blink" />
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-3 ml-1">
              <div className="text-right hidden lg:block">
                <div className="text-[14px] font-bold text-[#1a0a18] leading-tight">{firstName}</div>
                <div className="text-[11px] text-[#8A6888] font-medium">Pet Parent</div>
              </div>
              <button 
                onClick={() => router.push("/profile")}
                className="w-11 h-11 rounded-full flex items-center justify-center ring-2 ring-white shadow-[0_4px_16px_rgba(255,16,240,0.2)] hover:shadow-[0_6px_24px_rgba(255,16,240,0.3)] hover:scale-105 transition-all"
                style={{ background: "linear-gradient(135deg, #A7009D, #FF10F0)" }}
              >
                <span className="text-white font-extrabold text-[15px]">{initials}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
