"use client";

import { api } from "@/lib/api";
import { useBooking } from "@/context/BookingContext";
import { useCity } from "@/context/CityContext";

export default function ConfirmPage() {
  const { booking } = useBooking();
  const { city } = useCity();

  const handleConfirm = async () => {
    if (!booking.service || !booking.petId || !booking.addressId || !city) {
      return;
    }

    await api.post("/booking", {
      serviceType: booking.service,
      petId: booking.petId,
      addressId: booking.addressId,
      cityId: city.id,
    });

    alert("Booking Created");
  };

  return (
    <div className="p-6">
      <h1>Confirm Booking</h1>

      <pre>{JSON.stringify(booking, null, 2)}</pre>

      <button onClick={handleConfirm}>Confirm</button>
    </div>
  );
}
