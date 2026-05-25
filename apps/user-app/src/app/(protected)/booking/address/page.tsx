"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useBooking } from "@/context/BookingContext";
import { ServiceType } from "@canovet/shared";
import AddressPicker from "@/features/booking/components/AddressPicker";
import StepProgress from "@/features/booking/components/StepProgress";
import type { Address } from "@/shared/types";

type ApiAddress = {
  id: string;
  text?: string;
  label?: string;
  house?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
};
const toDisplayAddress = (address: ApiAddress): Address => ({
  id: address.id,
  label: address.label ?? (address.text?.startsWith("Clinic") ? "Clinic" : "Home"),
  house: address.house ?? address.text ?? "",
  area: address.area ?? "",
  city: address.city ?? "Ahmedabad",
  state: address.state ?? "Gujarat",
  pincode: address.pincode ?? "000000",
});

export default function AddressPage() {
  const { booking, setAddress } = useBooking();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/booking/addresses")
      .then((res) => {
        const apiAddresses = (res.data.addresses ?? []) as ApiAddress[];
        setAddresses(apiAddresses.map((address) => toDisplayAddress(address)));
      })
      .finally(() => setLoading(false));
  }, []);

  const isClinicService = booking.service === ServiceType.VET_CLINIC;
  const visibleAddresses = addresses.filter((address) =>
    isClinicService ? address.label === "Clinic" : address.label !== "Clinic"
  );

  const handleAddAddress = async (address: Address) => {
    try {
      const res = await api.post("/booking/addresses", {
        label: address.label,
        house: address.house,
        area: address.area,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
      });
      const created = toDisplayAddress(res.data as ApiAddress);
      setAddresses((prev) => [...prev, created]);
      setSelectedAddress(created);
    } catch {
      setAddresses((prev) => [...prev, address]);
      setSelectedAddress(address);
    }
  };

  const handleNext = () => {
    if (!selectedAddress) return;
    setAddress(selectedAddress.id);
    router.push("/booking/confirm");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border pt-safe">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 h-14">
          <button onClick={() => router.back()} className="text-sm font-medium text-muted-foreground">
            Back
          </button>
          <h1 className="text-base font-semibold text-foreground">
            {isClinicService ? "Select Clinic" : "Select Address"}
          </h1>
        </div>
        <StepProgress currentStep={2} totalSteps={3} labels={["Pets", "Address", "Schedule"]} />
      </div>

      <div className="max-w-lg mx-auto pb-10">
        {loading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">Loading addresses...</div>
        ) : null}
        <AddressPicker
          addresses={visibleAddresses}
          selectedAddress={selectedAddress}
          onSelect={setSelectedAddress}
          onAddAddress={handleAddAddress}
          onNext={handleNext}
          showBackButton={false}
          continueLabel="Continue to schedule"
        />
      </div>
    </div>
  );
}
