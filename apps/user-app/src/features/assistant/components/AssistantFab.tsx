"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import AssistantChat from "./AssistantChat";

const HIDE_ON = ["/login", "/select-city", "/"];

export type AskCanoContext = {
  intent?: "report" | "feedback" | "help" | "reschedule";
  bookingId?: string;
  category?: string;
};

export default function AssistantFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<AskCanoContext | null>(null);

  useEffect(() => { setOpen(false); }, [pathname]);

  // Listen for programmatic open events from other components
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AskCanoContext>).detail;
      setContext(detail ?? null);
      setOpen(true);
    };

    window.addEventListener("open-ask-cano", handler);
    return () => window.removeEventListener("open-ask-cano", handler);
  }, []);

  const handleClose = () => {
    setOpen(false);
    setContext(null);
  };

  if (HIDE_ON.some(p => pathname === p || pathname.startsWith("/booking/"))) return null;

  return (
    <>
      {/* FAB button */}
      <button
        id="ask-cano-fab"
        onClick={() => { setContext(null); setOpen(true); }}
        aria-label="Open Ask Cano assistant"
        className={cn(
          "fixed z-40 right-4 lg:right-6 rounded-full shadow-elevated",
          "bottom-20 lg:bottom-6",
          "h-14 px-5 flex items-center gap-2",
          "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all duration-200",
        )}
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-semibold text-sm">Ask Cano</span>
      </button>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={cn(
          "fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      />

      {/* Drawer: bottom sheet on mobile, right panel on desktop */}
      <aside
        className={cn(
          "fixed z-50 bg-card flex flex-col transition-transform duration-300 ease-out",
          "inset-x-0 bottom-0 mx-auto max-w-2xl h-[88vh] rounded-t-3xl",
          "lg:inset-y-0 lg:right-0 lg:left-auto lg:top-0 lg:bottom-0 lg:mx-0",
          "lg:h-screen lg:max-h-screen lg:w-[440px] lg:rounded-none lg:rounded-l-3xl",
          open
            ? "translate-y-0 lg:translate-x-0"
            : "translate-y-full lg:translate-y-0 lg:translate-x-full",
        )}
      >
        <header className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-serif text-lg leading-none">Ask Cano</p>
              <p className="text-[11px] text-muted-foreground">Tap to book, no typing needed</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <AssistantChat onClose={handleClose} active={open} context={context} />
      </aside>
    </>
  );
}
