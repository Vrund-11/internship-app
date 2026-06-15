"use client";

import { Home, CalendarDays, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/shared/lib/utils";

const tabs = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: CalendarDays, label: "Bookings", path: "/bookings" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-[#E8E0E6] pb-safe lg:hidden">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {tabs.map(({ icon: Icon, label, path }) => {
          const isActive = pathname === path;
          return (
            <button
              key={path}
              onClick={() => router.push(path)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all min-w-[64px]",
                isActive ? "text-[#A7009D]" : "text-[#B090A8]"
              )}
            >
              <Icon className="w-[22px] h-[22px]" />
              <span className="text-[10px] font-semibold tracking-[0.02em]">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
