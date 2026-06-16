"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCity } from "@/context/CityContext";
import { useAuth } from "@/context/AuthContext";
import { serviceCategories } from "@/features/home/data/services";

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

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { city } = useCity();
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 250);
  
  const firstName = user?.name ? user.name.split(" ")[0] : "Guest";
  const initials = firstName.charAt(0).toUpperCase();

  const results = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase();
    if (!normalized) return [];

    return serviceCategories.filter((svc) => {
      const name = svc.name.toLowerCase();
      const description = svc.description?.toLowerCase() ?? "";
      const tagline = svc.tagline?.toLowerCase() ?? "";
      return (
        name.includes(normalized) ||
        description.includes(normalized) ||
        tagline.includes(normalized)
      );
    });
  }, [debouncedQuery]);

  useEffect(() => {
    if (!query.trim()) {
      setIsOpen(false);
    }
  }, [query]);

  const isHomePage = pathname === "/home";

  return (
    <header className="sticky top-0 z-50">
      {/* Mobile Navbar (unchanged) */}
      <div className="md:hidden bg-white pt-safe border-b border-[#EDE4EB]">
        <div className="px-5 pt-3 pb-2">
          <div className="flex justify-between items-center">
            {/* Brand logo */}
            <div className="flex items-center">
              <span className="text-[17px] font-extrabold text-[#1a0a18] tracking-[-0.4px]">cano</span>
              <PawSvg color="#1a0a18" size={17} />
              <span className="text-[17px] font-extrabold text-[#1a0a18] tracking-[-0.4px]">et</span>
            </div>

            <div className="flex gap-2.5 items-center">
              <button className="w-10 h-10 rounded-xl bg-[#FBF0FB] border-none flex items-center justify-center relative" aria-label="Notifications">
                <Bell className="w-5 h-5 text-[#A7009D]" />
                <div className="absolute top-2 right-[9px] w-[7px] h-[7px] rounded-full bg-[#A7009D] border-2 border-white" />
              </button>
              <button 
                onClick={() => router.push("/profile")}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #A7009D, #CC00BE)" }}
              >
                <span className="text-white font-extrabold text-[14px]">{initials}</span>
              </button>
            </div>
          </div>
          <div className="pb-3.5 pt-2">
            <div className="text-[12px] text-[#8A6888] font-medium flex items-center gap-1 mb-1.5">
              <MapPin className="w-3 h-3 text-[#A7009D]" />
              {city?.name ? `${city.name}` : "Select City"}
            </div>
            <div className="text-[22px] font-extrabold text-[#1a0a18] leading-[1.2] tracking-[-0.3px]">
              Good morning, {firstName} 👋
            </div>
          </div>

          {/* Search bar mobile */}
          {!isHomePage && (
            <div className="relative mt-2">
              <div className="bg-[#F8F4F8] rounded-[14px] px-4 py-3 flex items-center gap-2.5 border border-[#EDE4EB]">
                <Search className="w-[18px] h-[18px] text-[#8A6888]" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    if (!isOpen) setIsOpen(true);
                  }}
                  onFocus={() => setIsOpen(Boolean(query.trim()))}
                  onBlur={() => {
                    window.setTimeout(() => setIsOpen(false), 120);
                  }}
                  placeholder="Search grooming, vet, food…"
                  className="flex-1 bg-transparent text-[14px] text-[#1a0a18] placeholder:text-[#8A6888] focus:outline-none"
                />
              </div>

              {isOpen && debouncedQuery.trim() && (
                <div className="mt-2 rounded-2xl border border-[#EDE4EB] bg-white shadow-card overflow-hidden absolute left-0 right-0 z-50">
                  {results.length === 0 ? (
                    <div className="px-4 py-3 text-[13px] text-[#8A6888]">
                      No matches found.
                    </div>
                  ) : (
                    results.map((svc) => (
                      <button
                        key={svc.id}
                        onMouseDown={() => {
                          setQuery("");
                          setIsOpen(false);
                          router.push(svc.route);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-[#FBF0FB] transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="text-[14px] text-[#1a0a18] font-semibold">
                            {svc.name}
                          </div>
                          <div className="text-[11px] text-[#8A6888]">
                            {svc.tagline || svc.description}
                          </div>
                        </div>
                        {!svc.active && (
                          <span className="text-[10px] uppercase text-[#8A6888] font-bold">
                            Soon
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== DESKTOP NAVBAR ===== */}
      <div className="hidden md:block glass border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between px-6 lg:px-8 py-3 max-w-[1440px] mx-auto w-full">
          {/* Left: Brand */}
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-1 cursor-pointer group"
              onClick={() => router.push("/home")}
            >
              <span className="text-[24px] font-extrabold text-[#1a0a18] tracking-[-0.5px] group-hover:text-[#A7009D] transition-colors">cano</span>
              <PawSvg color="#A7009D" size={24} />
              <span className="text-[24px] font-extrabold text-[#1a0a18] tracking-[-0.5px] group-hover:text-[#A7009D] transition-colors">et</span>
            </div>
            <div className="h-6 w-px bg-[#EDE4EB]" />
            <div className="flex items-center gap-1.5 text-[12px] text-[#8A6888] font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#A7009D]" />
              <span>{city?.name ?? "Select City"}</span>
            </div>
          </div>

          {/* Center: Navigation Pills */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-1 bg-[#F8F4F8]/80 backdrop-blur-sm px-2 py-1.5 rounded-full border border-[#EDE4EB]/50">
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
                        ? "bg-gradient-to-r from-[#A7009D] to-[#CC00BE] text-white shadow-[0_4px_16px_rgba(167,0,157,0.3)]"
                        : "text-[#5C3A58] hover:bg-white/80 hover:text-[#A7009D] hover:shadow-sm"
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
            {/* Search — only shown when NOT on /home */}
            {!isHomePage && (
              <div className="relative">
                <div className="bg-white/60 backdrop-blur-sm rounded-full px-4 py-2.5 flex items-center gap-2.5 border border-[#EDE4EB]/60 w-[220px] hover:border-[#A7009D]/30 hover:shadow-sm transition-all group">
                  <Search className="w-4 h-4 text-[#8A6888] group-hover:text-[#A7009D] transition-colors" />
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(Boolean(query.trim()))}
                    onBlur={() => {
                      window.setTimeout(() => setIsOpen(false), 120);
                    }}
                    placeholder="Search services..."
                    className="flex-1 bg-transparent text-[14px] text-[#1a0a18] placeholder:text-[#8A6888] focus:outline-none w-full"
                  />
                </div>
                
                {isOpen && debouncedQuery.trim() && (
                  <div className="absolute top-[120%] right-0 w-[320px] rounded-2xl border border-[#EDE4EB] bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(26,10,24,0.15)] overflow-hidden z-50">
                    {results.length === 0 ? (
                      <div className="px-5 py-4 text-[13px] text-[#8A6888] flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        No matches found.
                      </div>
                    ) : (
                      results.map((svc, idx) => (
                        <button
                          key={svc.id}
                          onMouseDown={() => {
                            setQuery("");
                            setIsOpen(false);
                            router.push(svc.route);
                          }}
                          className="w-full px-5 py-3.5 text-left hover:bg-gradient-to-r hover:from-[#FBF0FB] hover:to-transparent transition-all flex items-center justify-between group"
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <div>
                            <div className="text-[14px] text-[#1a0a18] font-semibold group-hover:text-[#A7009D] transition-colors">
                              {svc.name}
                            </div>
                            <div className="text-[11px] text-[#8A6888]">
                              {svc.tagline || svc.description}
                            </div>
                          </div>
                          {!svc.active && (
                            <span className="text-[10px] uppercase text-[#8A6888] font-bold bg-[#F3EEF1] px-2 py-0.5 rounded-full">
                              Soon
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Notification bell */}
            <button className="relative w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm border border-[#EDE4EB]/50 flex items-center justify-center hover:bg-[#FBF0FB] hover:border-[#A7009D]/20 hover:shadow-sm transition-all group">
              <Bell className="w-[18px] h-[18px] text-[#5C3A58] group-hover:text-[#A7009D] transition-colors" />
              <div className="absolute top-[8px] right-[8px] w-2 h-2 rounded-full bg-[#A7009D] animate-blink" />
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-3 ml-1">
              <div className="text-right hidden lg:block">
                <div className="text-[14px] font-bold text-[#1a0a18] leading-tight">{firstName}</div>
                <div className="text-[11px] text-[#8A6888] font-medium">Pet Parent</div>
              </div>
              <button 
                onClick={() => router.push("/profile")}
                className="w-11 h-11 rounded-full flex items-center justify-center ring-2 ring-white shadow-[0_4px_16px_rgba(167,0,157,0.2)] hover:shadow-[0_6px_24px_rgba(167,0,157,0.3)] hover:scale-105 transition-all"
                style={{ background: "linear-gradient(135deg, #A7009D, #CC00BE, #E040D0)" }}
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
