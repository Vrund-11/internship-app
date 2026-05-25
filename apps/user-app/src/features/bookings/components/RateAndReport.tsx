"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { api } from "@/lib/api";

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
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<"review" | null>(null);
  const [error, setError] = useState("");

  const latestComplaint = booking.complaints?.[0];

  const submitReview = async () => {
    try {
      setBusy("review");
      setError("");
      await api.post("/review", {
        bookingId: booking.id,
        rating: Number(rating),
        comment: comment.trim() || undefined,
      });
      setComment("");
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setBusy(null);
    }
  };

  const openAskCanoReport = () => {
    window.dispatchEvent(
      new CustomEvent("open-ask-cano", {
        detail: { intent: "report", bookingId: booking.id },
      })
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">Rate this booking</h3>
        {booking.review ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Submitted {booking.review.rating}/5
            {booking.review.comment ? ` - ${booking.review.comment}` : ""}
          </p>
        ) : (
          <>
            <div className="mt-3 flex gap-2">
              <Input
                type="number"
                min="1"
                max="5"
                value={rating}
                onChange={(event) => setRating(event.target.value)}
                className="max-w-20 rounded-2xl"
              />
              <Input
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Add a short comment"
                className="rounded-2xl"
              />
            </div>
            <Button
              onClick={submitReview}
              disabled={busy !== null}
              className="mt-3 rounded-full"
            >
              {busy === "review" ? "Submitting..." : "Submit review"}
            </Button>
          </>
        )}
      </div>

      <div className="rounded-3xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">Report an issue</h3>
        {latestComplaint ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Complaint status: {latestComplaint.status}
          </p>
        ) : null}
        <Button
          variant="outline"
          onClick={openAskCanoReport}
          className="mt-3 rounded-full"
        >
          🚩 Report via Ask Cano
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}
