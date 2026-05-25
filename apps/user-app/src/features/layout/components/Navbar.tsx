"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCity } from "@/context/CityContext";
import { useAuth } from "@/context/AuthContext";
import { serviceCategories } from "@/features/home/data/services";

import { cn } from "@/shared/lib/utils";

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

  return (
    <header className="sticky top-0 z-50 bg-white pt-safe border-b border-[#DDE8E3]">
      {/* Mobile Navbar */}
      <div className="md:hidden px-5 pt-3 pb-2">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[12px] text-[#3E6255] font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#1D8F60]" />
              {city?.name ?? "Select City"}
            </div>
            <div className="font-serif text-[22px] font-normal text-[#081C13] mt-1">
              Hello, {firstName} <span className="text-[20px]">👋</span>
            </div>
          </div>
          
          <div className="flex gap-2.5 items-center">
            <button className="w-[38px] h-[38px] rounded-xl bg-[#F0F5F2] border border-[#DDE8E3] flex items-center justify-center relative">
              <Bell className="w-[18px] h-[18px] text-[#3B5C52]" />
              <div className="absolute top-[9px] right-[10px] w-1.5 h-1.5 rounded-full bg-[#F5922A]" />
            </button>
            <button 
              onClick={() => router.push("/profile")}
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center bg-gradient-to-br from-[#0B3B2A] to-[#155E41]"
            >
              <span className="text-white font-bold text-[15px] font-serif">{initials}</span>
            </button>
          </div>
        </div>

        {/* Search bar mobile */}
        {pathname !== "/home" && !pathname.startsWith("/bookings") && (
          <div className="mt-3.5">
            <div className="bg-[#F0F5F2] rounded-2xl px-4 py-3 flex items-center gap-2.5 border border-[#DDE8E3]">
              <Search className="w-4 h-4 text-[#6E8F83]" />
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
                placeholder="Search grooming, vet, food..."
                className="flex-1 bg-transparent text-[14px] text-[#081C13] placeholder:text-[#6E8F83] focus:outline-none"
              />
            </div>

            {isOpen && debouncedQuery.trim() && (
              <div className="mt-2 rounded-2xl border border-[#DDE8E3] bg-white shadow-card overflow-hidden absolute left-5 right-5 z-50">
                {results.length === 0 ? (
                  <div className="px-4 py-3 text-[13px] text-[#6E8F83]">
                    No matches found.
                  </div>
                ) : (
                  results.map((svc) => (
                    <button
                      key={svc.id}
                      onMouseDown={() => {
                        if (!svc.active) return;
                        setQuery("");
                        setIsOpen(false);
                        router.push(svc.route);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-[#F5FAF7] transition-colors flex items-center justify-between"
                      disabled={!svc.active}
                    >
                      <div>
                        <div className="text-[14px] text-[#081C13] font-medium">
                          {svc.name}
                        </div>
                        <div className="text-[11px] text-[#6E8F83]">
                          {svc.tagline || svc.description}
                        </div>
                      </div>
                      {!svc.active && (
                        <span className="text-[10px] uppercase text-[#C8731A] font-semibold">
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

      {/* Desktop Navbar */}
      <div className="hidden md:flex items-center justify-between px-6 lg:px-8 py-4 max-w-[1440px] mx-auto w-full">
        {/* Left: Brand */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/home")}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#27AE78] to-[#1D8F60] shadow-md shadow-[#27AE78]/20">
            <span className="text-[20px]">🐾</span>
          </div>
          <div className="font-serif text-[24px] text-[#0B3B2A] font-bold leading-none">Canovet</div>
        </div>

        {/* Center: Navigation Links */}
        <div className="flex flex-1 items-center justify-center px-8">
          <div className="flex items-center gap-8 bg-[#F5FAF7] px-6 py-2 rounded-full border border-[#DDE8E3]">
            {[
              { label: "Home", path: "/home" },
              { label: "Bookings", path: "/bookings" },
              { label: "Pets", path: "/pets" },
              { label: "Profile", path: "/profile" },
            ].map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
              return (
                <Link 
                  key={item.label} 
                  href={item.path} 
                  className={cn(
                    "text-[15px] font-medium transition-colors hover:text-[#1D8F60]", 
                    isActive ? "text-[#1D8F60]" : "text-[#3E6255]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: User & Area */}
        <div className="flex items-center gap-5">
          {/* Desktop Search bar - compact */}
          {pathname !== "/home" && !pathname.startsWith("/bookings") && (
            <div className="relative">
              <div className="bg-[#F0F5F2] rounded-full px-4 py-2.5 flex items-center gap-2.5 border border-[#DDE8E3] w-[240px]">
                <Search className="w-4 h-4 text-[#6E8F83]" />
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
                  placeholder="Search..."
                  className="flex-1 bg-transparent text-[14px] text-[#081C13] placeholder:text-[#6E8F83] focus:outline-none w-full"
                />
              </div>
              
              {isOpen && debouncedQuery.trim() && (
                <div className="absolute top-[120%] right-0 w-[300px] rounded-2xl border border-[#DDE8E3] bg-white shadow-xl overflow-hidden z-50">
                  {results.length === 0 ? (
                    <div className="px-4 py-3 text-[13px] text-[#6E8F83]">
                      No matches found.
                    </div>
                  ) : (
                    results.map((svc) => (
                      <button
                        key={svc.id}
                        onMouseDown={() => {
                          if (!svc.active) return;
                          setQuery("");
                          setIsOpen(false);
                          router.push(svc.route);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-[#F5FAF7] transition-colors flex items-center justify-between"
                        disabled={!svc.active}
                      >
                        <div>
                          <div className="text-[14px] text-[#081C13] font-medium">
                            {svc.name}
                          </div>
                          <div className="text-[11px] text-[#6E8F83]">
                            {svc.tagline || svc.description}
                          </div>
                        </div>
                        {!svc.active && (
                          <span className="text-[10px] uppercase text-[#C8731A] font-semibold">
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

          <div className="text-right flex flex-col justify-center h-full">
            <div className="font-serif text-[16px] text-[#081C13] leading-tight">Hi, {firstName} <span className="text-[14px]">👋</span></div>
            <div className="text-[12px] text-[#3E6255] flex items-center justify-end gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-[#1D8F60]" />
              {city?.name ?? "Select City"}
            </div>
          </div>
          
          <div className="flex gap-3 items-center">
            <button className="w-10 h-10 rounded-full bg-[#F0F5F2] border border-[#DDE8E3] flex items-center justify-center relative hover:bg-[#E3F6EE] transition-colors">
              <Bell className="w-[18px] h-[18px] text-[#3B5C52]" />
              <div className="absolute top-[10px] right-[10px] w-1.5 h-1.5 rounded-full bg-[#F5922A]" />
            </button>
            <button 
              onClick={() => router.push("/profile")}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#0B3B2A] to-[#155E41] hover:shadow-lg transition-shadow"
            >
              <span className="text-white font-bold text-[15px] font-serif">{initials}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
