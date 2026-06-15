"use client";

import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { Sparkles, HelpCircle } from "lucide-react";

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
        detail: { intent: "feedback", bookingId: booking.id },
      })
    );
  };

  return (
    <div className="space-y-4">
      {/* Review Section */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-2">Rate this booking</h3>
        {booking.review ? (
          <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-2xl">
            Submitted <strong className="text-primary">{booking.review.rating}/5 ★</strong>
            {booking.review.comment ? ` - "${booking.review.comment}"` : ""}
          </p>
        ) : (
          <Button
            onClick={openAskCanoReview}
            className="w-full rounded-full flex items-center justify-center gap-2 bg-[rgba(167,0,157,0.06)] hover:bg-[rgba(167,0,157,0.1)] text-primary border border-primary/10 shadow-none font-bold"
          >
            <Sparkles className="w-4 h-4" />
            Review via Ask Cano
          </Button>
        )}
      </div>

      {/* Issues / FAQ Section */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-2">Report an issue</h3>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          Need help? Browse our frequently asked questions or contact support directly.
        </p>
        <Link href="/faq" passHref className="w-full">
          <Button
            variant="outline"
            className="w-full rounded-full flex items-center justify-center gap-2 font-bold"
          >
            <HelpCircle className="w-4 h-4" />
            FAQ & Help Center
          </Button>
        </Link>
      </div>
    </div>
  );
}
