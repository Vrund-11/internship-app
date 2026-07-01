"use client";

import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import Footer from "./Footer";
import AssistantFab from "@/features/assistant/components/AssistantFab";
import { cn } from "@/shared/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  hideNav?: boolean;
  hideMobileNav?: boolean;
  fullWidth?: boolean;
}

const AppShell = ({ children, hideNav = false, hideMobileNav = false, fullWidth = false }: AppShellProps) => {
  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-background relative flex flex-col">
      {!hideNav && (
        <div className={cn("shrink-0", hideMobileNav ? "hidden md:block" : "")}>
          <Navbar />
        </div>
      )}
      <main className={cn("flex-1 md:overflow-y-auto flex flex-col", hideNav ? "" : "safe-bottom lg:pb-0")}>
        {fullWidth ? (
          <div className="flex-1 flex flex-col w-full">{children}</div>
        ) : (
          <div className="w-full max-w-[1440px] mx-auto md:px-6 lg:px-8 flex-1 flex flex-col">{children}</div>
        )}
        {!hideNav && (
          <div className={cn("shrink-0 mt-auto", hideMobileNav ? "hidden md:block" : "")}>
            <Footer />
          </div>
        )}
      </main>
      {!hideNav && !hideMobileNav && <BottomNav />}
      {!hideNav && <AssistantFab />}
    </div>
  );
};

export default AppShell;
