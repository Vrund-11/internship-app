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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#EDE4EB] pb-safe lg:hidden shadow-[0_-4px_20px_rgba(18,18,18,0.02)]">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {tabs.map(({ icon: Icon, label, path }) => {
          const isActive = pathname === path;
          return (
            <button
              key={path}
              onClick={() => router.push(path)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all min-w-[64px]",
                isActive ? "text-[#FF10F0]" : "text-[#4A4A4A]"
              )}
            >
              <Icon className="w-[22px] h-[22px]" />
              <span className="text-[10px] font-bold tracking-[0.02em]">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
