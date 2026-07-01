"use client";

import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { Sparkles, HelpCircle, AlertCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";

type BookingLite = {
  id: string;
  review?: { id: string; rating: number; comment?: string | null } | null;
  complaints?: { id: string; message: string; status: string }[];
};

export default function RateAndReport({
  booking,
  onUpdated,
}: {
  booking: BookingLite;
  onUpdated: () => Promise<void> | void;
}) {
  const openAskCanoReview = () => {
    window.dispatchEvent(
      new CustomEvent("open-ask-cano", {
        detail: { intent: "review", bookingId: booking.id },
      })
    );
  };

  const openAskCanoComplaint = () => {
    window.dispatchEvent(
      new CustomEvent("open-ask-cano", {
        detail: { intent: "complain", bookingId: booking.id },
      })
    );
  };

  return (
    <div className="space-y-4">
      {/* Review Section */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-2">Rate this booking</h3>
        {booking.review ? (
          <div className="text-xs text-[#4A4A4A] bg-[#FFF0FC] p-3 rounded-2xl border border-[#FF10F0]/10">
            <p className="font-bold">
              Submitted rating: <span className="text-[#FF10F0]">{"★".repeat(booking.review.rating)}</span>
            </p>
            {booking.review.comment && (
              <p className="mt-1 italic text-muted-foreground">"{booking.review.comment}"</p>
            )}
          </div>
        ) : (
          <Button
            onClick={openAskCanoReview}
            className="w-full rounded-full flex items-center justify-center gap-2 bg-[#FFF0FC] hover:bg-[#FFF0FC]/80 text-[#FF10F0] border border-[#FF10F0]/20 shadow-none font-bold"
          >
            <Sparkles className="w-4 h-4" />
            Review via Ask Cano
          </Button>
        )}
      </div>

      {/* Issues / FAQ Section */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-2">Report an issue</h3>
        
        {booking.complaints && booking.complaints.length > 0 ? (
          <div className="mb-3 space-y-2">
            <p className="text-xs font-bold text-[#4A4A4A] mb-1">Your Filed Complaints:</p>
            {booking.complaints.map((complaint) => (
              <div key={complaint.id} className="text-xs bg-rose-50/50 border border-rose-100 p-3 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-rose-600">ID: {complaint.id.slice(0, 8).toUpperCase()}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border",
                    complaint.status === "RESOLVED"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200/20"
                      : "bg-amber-100 text-amber-700 border-amber-200/20"
                  )}>
                    {complaint.status}
                  </span>
                </div>
                <p className="text-[#4A4A4A] leading-relaxed">{complaint.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Need help or faced an issue? Describe your concerns and file a complaint directly.
          </p>
        )}

        <div className="flex gap-2">
          <Button
            onClick={openAskCanoComplaint}
            className="flex-1 rounded-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 shadow-none font-bold text-xs"
          >
            <AlertCircle className="w-4 h-4" />
            File Complaint
          </Button>
          <Link href="/faq" passHref className="flex-1">
            <Button
              variant="outline"
              className="w-full rounded-full flex items-center justify-center gap-2 font-bold text-xs"
            >
              <HelpCircle className="w-4 h-4" />
              FAQ & Help
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
