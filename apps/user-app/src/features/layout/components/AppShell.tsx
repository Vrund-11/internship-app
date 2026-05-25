"use client";

import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import AssistantFab from "@/features/assistant/components/AssistantFab";
import { cn } from "@/shared/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

const AppShell = ({ children, hideNav = false }: AppShellProps) => {
  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      {!hideNav && <Navbar />}
      <main className={cn("flex-1", hideNav ? "" : "safe-bottom lg:pb-0")}>
        <div className="w-full max-w-[1440px] mx-auto md:px-6 lg:px-8">{children}</div>
      </main>
      {!hideNav && <BottomNav />}
      {!hideNav && <AssistantFab />}
    </div>
  );
};

export default AppShell;
