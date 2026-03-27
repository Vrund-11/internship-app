"use client";

import { useRouter } from "next/navigation";
import { useBooking } from "@/context/BookingContext";

export default function AddressPage() {
  const { setAddress } = useBooking();
  const router = useRouter();

  const selectAddress = (id: string) => {
    setAddress(id);
    router.push("/booking/confirm");
  };

  return (
    <div className="p-6">
      <h1>Select Address</h1>

      <button onClick={() => selectAddress("addr1")}>Address 1</button>
    </div>
  );
}
