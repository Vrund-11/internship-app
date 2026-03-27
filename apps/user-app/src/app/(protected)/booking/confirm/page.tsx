"use client";

import { useBooking } from "@/context/BookingContext";

export default function ConfirmPage() {
  const { booking } = useBooking();

  return (
    <div className="p-6">
      <h1>Confirm Booking</h1>

      <pre>{JSON.stringify(booking, null, 2)}</pre>

      <button>Confirm</button>
    </div>
  );
}
