"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ServiceType } from "@canovet/shared";
import { useBooking } from "@/context/BookingContext";
import { useCity } from "@/context/CityContext";
import { api } from "@/lib/api";
import DateTimePicker from "@/features/booking/components/DateTimePicker";
import BookingSuccess from "@/features/booking/components/BookingSuccess";
import SearchingPartner from "@/features/booking/components/SearchingPartner";
import StepProgress from "@/features/booking/components/StepProgress";
import type { Address, Pet, ServiceItem } from "@/shared/types";
import { getServiceCategoryName, groomingServices, vetOnCallServices, atClinicServices } from "@/features/home/data/services";

type SlotWindow = {
  slotStart: string;
  slotEnd: string;
  available?: boolean;
};

const SLOT_RANGES: Array<[number, number]> = [
  [10, 12],
  [12, 14],
  [14, 16],
  [16, 18],
];

type ApiPet = {
  id: string;
  name: string;
  type?: "dog" | "cat";
  breed?: string;
  age?: number;
  weight?: number;
};

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

const toDateOnly = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const buildSlotWindow = (date: Date, startHour: number, endHour: number): SlotWindow => {
  const slotStart = new Date(date);
  slotStart.setHours(startHour, 0, 0, 0);
  const slotEnd = new Date(date);
  slotEnd.setHours(endHour, 0, 0, 0);

  return {
    slotStart: slotStart.toISOString(),
    slotEnd: slotEnd.toISOString(),
  };
};

const getDefaultSlotWindows = (date: Date) =>
  SLOT_RANGES.map(([start, end]) => buildSlotWindow(date, start, end));

const filterPastSlotWindows = (windows: SlotWindow[], date: Date) => {
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (!sameDay) return windows;

  return windows.filter((slot) => new Date(slot.slotEnd).getTime() > now.getTime());
};

const toDisplayPet = (pet: ApiPet): Pet => ({
  id: pet.id,
  name: pet.name,
  type: pet.type ?? "dog",
  breed: pet.breed ?? "Mixed",
  age: pet.age ?? 2,
  weight: pet.weight ?? 8,
});

const toDisplayAddress = (address: ApiAddress): Address => ({
  id: address.id,
  label: address.label ?? (address.text?.startsWith("Clinic") ? "Clinic" : "Home"),
  house: address.house ?? address.text ?? "",
  area: address.area ?? "",
  city: address.city ?? "Ahmedabad",
  state: address.state ?? "Gujarat",
  pincode: address.pincode ?? "000000",
});

export default function ConfirmPage() {
  const router = useRouter();
  const { booking, setSlot, setAssignment } = useBooking();
  const { city } = useCity();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotWindow[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [assignedPartner, setAssignedPartner] = useState<{
    name: string;
    rating: number;
    totalCompleted: number;
  } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [noPartnersNearby, setNoPartnersNearby] = useState(false);

  const minDate = useMemo(
    () => new Date(),
    []
  );

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(minDate);
    }
  }, [minDate, selectedDate]);

  const slotMap = useMemo(() => {
    return slots.reduce<Record<string, SlotWindow>>((acc, slot) => {
      const label = `${formatTime(slot.slotStart)} - ${formatTime(slot.slotEnd)}`;
      acc[label] = slot;
      return acc;
    }, {});
  }, [slots]);

  const timeSlots = useMemo(() => Object.keys(slotMap), [slotMap]);

  useEffect(() => {
    if (!selectedDate) return;
    if (booking.service !== ServiceType.GROOMING) {
      return;
    }
    const minDateOnly = toDateOnly(minDate);
    if (toDateOnly(selectedDate) < minDateOnly) {
      setSelectedDate(minDate);
      setSelectedTime(null);
      setSlot(null);
    }
  }, [booking.service, minDate, selectedDate, setSlot]);

  const isClinicBooking = booking.service === ServiceType.VET_CLINIC;

  const dateTimeSlots = useMemo(() => {
    return slots.map((slot) => {
      const label = `${formatTime(slot.slotStart)} - ${formatTime(slot.slotEnd)}`;
      return {
        label,
        available: slot.available !== false,
      };
    });
  }, [slots]);

  const fetchSlots = useCallback(async () => {
    if (!booking.service || !city || !selectedDate) {
      setSlots([]);
      return;
    }

    // For clinic bookings, use clinicId; for others, use addressId
    if (isClinicBooking && !booking.clinicId) {
      setSlots([]);
      return;
    }
    if (!isClinicBooking && !booking.addressId) {
      setSlots([]);
      return;
    }

    try {
      setLoadingSlots(true);
      setError("");

      const partnerRes = await api.get("/partners");
      const partners = (partnerRes.data ?? []) as Array<{ isOnline?: boolean | null }>;
      const hasOnline = partners.some((partner) => partner.isOnline);

      if (!hasOnline) {
        setNoPartnersNearby(true);
        const fallback = getDefaultSlotWindows(selectedDate);
        setSlots(filterPastSlotWindows(fallback, selectedDate).map(s => ({ ...s, available: false })));
        return;
      }

      const res = await api.get("/booking/slots", {
        params: {
          date: toDateOnly(selectedDate),
          serviceType: booking.service,
          cityId: city.id,
          ...(isClinicBooking
            ? { clinicId: booking.clinicId }
            : { addressId: booking.addressId }),
        },
      });

      const nextSlots = (res.data.slots ?? []) as SlotWindow[];
      const isNoPartners = Boolean(res.data.noPartnersNearby);
      setNoPartnersNearby(isNoPartners);

      const fallback = getDefaultSlotWindows(selectedDate);
      const next = nextSlots.length > 0 ? nextSlots : fallback;
      setSlots(filterPastSlotWindows(next, selectedDate));

      if (selectedTime && !nextSlots.some((slot) => {
        const label = `${formatTime(slot.slotStart)} - ${formatTime(slot.slotEnd)}`;
        return label === selectedTime && slot.available !== false;
      })) {
        setSelectedTime(null);
        setSlot(null);
      }
    } catch (err) {
      const fallback = getDefaultSlotWindows(selectedDate);
      setSlots(filterPastSlotWindows(fallback, selectedDate));
      setSelectedTime(null);
      setSlot(null);
      setError(err instanceof Error ? err.message : "Failed to load slots");
      setNoPartnersNearby(false);
    } finally {
      setLoadingSlots(false);
    }
  }, [booking.addressId, booking.clinicId, booking.service, city, isClinicBooking, selectedDate, selectedTime, setSlot]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleSelectTime = (label: string) => {
    const slot = slotMap[label];
    if (slot && slot.available !== false) {
      setSelectedTime(label);
      setSlot(slot);
    }
  };

  const [pets, setPets] = useState<Pet[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    Promise.all([api.get("/booking/pets"), api.get("/booking/addresses")])
      .then(([petsRes, addressesRes]) => {
        const apiPets = (petsRes.data.pets ?? []) as ApiPet[];
        const apiAddresses = (addressesRes.data.addresses ?? []) as ApiAddress[];
        setPets(apiPets.map((pet) => toDisplayPet(pet)));
        setAddresses(apiAddresses.map((address) => toDisplayAddress(address)));
      })
      .catch(() => {
        setPets([]);
        setAddresses([]);
      });
  }, []);

  const selectedPet = pets.find((pet) => pet.id === booking.petId) ?? null;
  const selectedAddress = addresses.find((address) => address.id === booking.addressId) ?? null;

  const selectedServices: ServiceItem[] = useMemo(() => {
    if (!booking.service) return [];
    switch (booking.service) {
      case ServiceType.GROOMING:
        return groomingServices.slice(0, 1);
      case ServiceType.VET_ON_CALL:
        return vetOnCallServices.slice(0, 1);
      case ServiceType.VET_CLINIC:
        return atClinicServices.slice(0, 1);
      default:
        return [];
    }
  }, [booking.service]);

  const createBooking = async () => {
    if (!booking.service || !booking.petId || !city) {
      return;
    }

    // For clinic bookings, clinicId is required; for others, addressId is required
    if (isClinicBooking && !booking.clinicId) return;
    if (!isClinicBooking && !booking.addressId) return;

    const slot = booking.slotStart && booking.slotEnd
      ? { slotStart: booking.slotStart, slotEnd: booking.slotEnd }
      : null;

    if (!slot) return;

    try {
      setSubmitting(true);
      setError("");

      const res = await api.post("/booking", {
        serviceType: booking.service,
        petId: booking.petId,
        addressId: isClinicBooking ? null : booking.addressId,
        clinicId: isClinicBooking ? booking.clinicId : null,
        cityId: city.id,
        slotStart: slot.slotStart,
        slotEnd: slot.slotEnd,
      });

      setAssignment({
        bookingId: res.data.id,
        slotStart: res.data.slotStart,
        slotEnd: res.data.slotEnd,
        status: res.data.status,
        partnerId: res.data.partner?.id ?? null,
        partnerName: res.data.partner?.name ?? null,
      });

      // Store partner data and show searching animation first
      setAssignedPartner({
        name: res.data.partner?.name ?? "Assigned Partner",
        rating: res.data.partner?.rating ?? 4.8,
        totalCompleted: res.data.partner?.totalCompleted ?? 0,
      });
      setSearching(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = () => {
    setIsSuccess(true);
  };

  // For clinic bookings, we don't need an address — just a pet
  if (!selectedPet || (!isClinicBooking && !selectedAddress)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        Missing booking details. Please restart the flow.
      </div>
    );
  }

  if (searching) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="max-w-lg mx-auto w-full">
          <SearchingPartner
            onFound={() => {
              setSearching(false);
              setIsSuccess(true);
            }}
          />
        </div>
      </div>
    );
  }

  if (isSuccess || assignedPartner) {
    return (
      <BookingSuccess
        pets={[selectedPet]}
        services={selectedServices}
        address={selectedAddress}
        selectedDate={selectedDate}
        selectedTime={selectedTime ?? undefined}
        bookingId={booking.bookingId}
        partner={assignedPartner ? {
          name: assignedPartner.name,
          rating: assignedPartner.rating,
          experience: Math.max(1, Math.round(assignedPartner.totalCompleted / 20)),
          specialization: "Certified Pet Care Specialist",
        } : null}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border pt-safe">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 h-14">
          <button onClick={() => router.back()} className="text-sm font-medium text-muted-foreground">
            Back
          </button>
          <h1 className="text-base font-semibold text-foreground">
            {getServiceCategoryName(booking.service ?? "")}
          </h1>
        </div>
        <StepProgress currentStep={3} totalSteps={3} labels={["Pets", "Address", "Schedule"]} />
      </div>

      <div className="max-w-lg mx-auto pb-10">
        <DateTimePicker
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          timeSlots={loadingSlots ? [] : dateTimeSlots}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setSelectedTime(null);
            setSlot(null);
          }}
          onSelectTime={handleSelectTime}
          onNext={createBooking}
          showBackButton={false}
          continueLabel={submitting ? "Creating..." : "Create booking"}
          minDate={minDate}
          allowFallback={false}
          noPartnersNearby={noPartnersNearby}
        />

        {!loadingSlots && slots.length === 0 && !assignedPartner ? (
          <p className="px-4 text-xs text-muted-foreground">
            No slots available for this date.
          </p>
        ) : null}

        {booking.service === ServiceType.GROOMING ? (
          <p className="px-4 text-xs text-muted-foreground">
            Grooming slots are subject to partner availability.
          </p>
        ) : null}

        {error ? (
          <div className="mx-4 mt-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
