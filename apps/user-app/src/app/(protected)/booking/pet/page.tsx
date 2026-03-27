"use client";

import { useRouter } from "next/navigation";
import { useBooking } from "@/context/BookingContext";

export default function PetPage() {
  const { setPet } = useBooking();
  const router = useRouter();

  const selectPet = (id: string) => {
    setPet(id);
    router.push("/booking/address");
  };

  return (
    <div className="p-6">
      <h1>Select Pet</h1>

      <button onClick={() => selectPet("pet1")}>Pet 1</button>
    </div>
  );
}
