"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ServiceType } from "@canovet/shared";
import {
  getServicesForType,
  getServiceCategoryName,
  resolveServiceType,
} from "@/features/home/data/services";
import { clinics } from "@/features/booking/data/clinics";
import { useAuth } from "@/context/AuthContext";
import { useCity } from "@/context/CityContext";
import { api } from "@/lib/api";
import type { Pet, Address, BookingState, Clinic } from "@/shared/types";

import PetSelector from "@/features/booking/components/PetSelector";
import ServicePicker from "@/features/booking/components/ServicePicker";
import DateTimePicker from "@/features/booking/components/DateTimePicker";
import AddressPicker from "@/features/booking/components/AddressPicker";
import ClinicSearchPicker from "@/features/booking/components/ClinicSearchPicker";
import PaymentOptions from "@/features/booking/components/PaymentOptions";
import SearchingPartner from "@/features/booking/components/SearchingPartner";
import AssignedPartnerCard from "@/features/booking/components/AssignedPartnerCard";
import BookingSuccess from "@/features/booking/components/BookingSuccess";

export default function ServiceBooking() {
  const params = useParams();
  const searchParams = useSearchParams();
  const type = (params?.type as string) || "grooming";
  const serviceType = resolveServiceType(type);
  const router = useRouter();
  const { user } = useAuth();
  const { city } = useCity();

  const modeParam = searchParams.get("mode");
  const variantParam = searchParams.get("variant");
  const [careMode, setCareMode] = useState<"vet-on-call" | "at-clinic" | null>(
    modeParam === "at-clinic" || modeParam === "vet-on-call" ? modeParam : null
  );

  const effectiveServiceType = useMemo(() => {
    if (serviceType === ServiceType.VET_CLINIC) return ServiceType.VET_CLINIC;
    if (serviceType === ServiceType.VET_ON_CALL && careMode === "at-clinic") {
      return ServiceType.VET_CLINIC;
    }
    return serviceType;
  }, [careMode, serviceType]);

  const services = getServicesForType(careMode ?? type);
  const isClinic = effectiveServiceType === ServiceType.VET_CLINIC;
  const isVetOnCall = effectiveServiceType === ServiceType.VET_ON_CALL;
  const isHeroEntry = searchParams.get("entry") === "hero";

  const SLOT_RANGES: Array<[number, number]> = [
    [10, 12],
    [12, 14],
    [14, 16],
    [16, 18],
  ];

  const formatSlotLabel = (date: Date, startHour: number, endHour: number) => {
    const start = new Date(date);
    start.setHours(startHour, 0, 0, 0);
    const end = new Date(date);
    end.setHours(endHour, 0, 0, 0);

    const fmt = (d: Date) => {
      const h = d.getHours();
      const m = d.getMinutes();
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
    };

    return `${fmt(start)} - ${fmt(end)}`;
  };

  const getDefaultSlotLabels = (date: Date) =>
    SLOT_RANGES.map(([start, end]) => formatSlotLabel(date, start, end));

  const filterPastSlotLabels = (labels: string[], date: Date) => {
    const today = new Date();
    const sameDay =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    if (!sameDay) return labels;

    return labels.filter((label) => {
      const endLabel = label.split("-")[1]?.trim();
      if (!endLabel) return false;

      const [time, ampm] = endLabel.split(" ");
      const [hStr, mStr] = time.split(":");
      let h = Number(hStr);
      const m = Number(mStr || 0);

      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;

      const endTime = new Date(date);
      endTime.setHours(h, m, 0, 0);
      return endTime.getTime() > today.getTime();
    });
  };

  const [booking, setBooking] = useState<BookingState>({
    step: 1,
    selectedPets: [],
    selectedServices: [],
    selectedDate: null,
    selectedTime: null,
    address: null,
    selectedClinic: null,
    paymentMethod: null,
  });

  // Data from backend
  const [allPets, setAllPets] = useState<Pet[]>([]);
  const [allAddresses, setAllAddresses] = useState<Address[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Booking flow state
  const [isCreating, setIsCreating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    id: string;
    partner?: { id?: string; name?: string; phone?: string } | null;
    status?: string;
  } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  // Refs for smooth scrolling
  const clinicRef = useRef<HTMLDivElement | null>(null);
  const petsRef = useRef<HTMLDivElement | null>(null);
  const modeRef = useRef<HTMLDivElement | null>(null);
  const servicesRef = useRef<HTMLDivElement | null>(null);
  const dateTimeRef = useRef<HTMLDivElement | null>(null);
  const addressRef = useRef<HTMLDivElement | null>(null);
  const paymentRef = useRef<HTMLDivElement | null>(null);

  // Redirect if invalid service type
  useEffect(() => {
    if (!serviceType) {
      router.replace("/home");
    }
  }, [serviceType, router]);

  useEffect(() => {
    if (serviceType === ServiceType.VET_CLINIC) {
      setCareMode("at-clinic");
      return;
    }
    if (serviceType === ServiceType.VET_ON_CALL && !careMode) {
      if (modeParam === "at-clinic") setCareMode("at-clinic");
      if (modeParam === "vet-on-call") setCareMode("vet-on-call");
    }
  }, [careMode, modeParam, serviceType]);

  useEffect(() => {
    if (serviceType !== ServiceType.VET_ON_CALL) return;
    setBooking((prev) => ({
      ...prev,
      selectedServices: [],
      selectedDate: null,
      selectedTime: null,
      address: null,
      selectedClinic: null,
      paymentMethod: null,
    }));
    setAvailableSlots([]);
  }, [careMode, serviceType]);

  useEffect(() => {
    if (serviceType === ServiceType.VET_ON_CALL && !careMode) return;
    if (services.length === 0) return;
    setBooking((prev) => {
      if (prev.selectedServices.length > 0) return prev;
      const match = variantParam
        ? services.find((service) => service.id === variantParam)
        : null;
      return {
        ...prev,
        selectedServices: match ? [match] : [services[0]],
      };
    });
  }, [careMode, serviceType, services, variantParam]);

  // Load pets & addresses from backend
  useEffect(() => {
    if (!user) return;

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

    api.get("/booking/pets").then((res) => {
      const pets = (res.data.pets ?? []) as ApiPet[];
      setAllPets(
        pets.map((pet) => ({
          id: pet.id,
          name: pet.name,
          type: pet.type ?? "dog",
          breed: pet.breed ?? "Mixed",
          age: pet.age ?? 2,
          weight: pet.weight ?? 8,
        }))
      );
    }).catch(() => {});

    api.get("/booking/addresses").then((res) => {
      const addresses = (res.data.addresses ?? []) as ApiAddress[];
      setAllAddresses(
        addresses.map((addr) => ({
          id: addr.id,
          label: addr.label ?? (addr.text?.startsWith("Clinic") ? "Clinic" : "Home"),
          house: addr.house ?? addr.text ?? "",
          area: addr.area ?? "",
          city: addr.city ?? "Ahmedabad",
          state: addr.state ?? "Gujarat",
          pincode: addr.pincode ?? "000000",
        }))
      );
    }).catch(() => {});
  }, [user]);

  const ensureClinicAddress = useCallback(
    async (clinic: Clinic) => {
      const existing = allAddresses.find(
        (addr) =>
          addr.label === "Clinic" &&
          addr.house === clinic.address &&
          addr.city === clinic.city
      );

      if (existing) {
        setBooking((prev) => ({ ...prev, address: existing }));
        return existing;
      }

      const state = clinic.city === "Mumbai" ? "Maharashtra" : "Gujarat";
      let latitude = 0;
      let longitude = 0;
      if (clinic.city === "Ahmedabad") {
        latitude = 23.0225;
        longitude = 72.5714;
      } else if (clinic.city === "Mumbai") {
        latitude = 19.0760;
        longitude = 72.8777;
      }

      try {
        const res = await api.post("/booking/addresses", {
          label: "Clinic",
          house: clinic.address,
          area: "",
          city: clinic.city,
          state,
          pincode: "000000",
          latitude,
          longitude,
        });

        const created: Address = {
          id: res.data.id,
          label: res.data.label || "Clinic",
          house: res.data.house || clinic.address,
          area: res.data.area || "",
          city: res.data.city || clinic.city,
          state: res.data.state || state,
          pincode: res.data.pincode || "000000",
        };

        setAllAddresses((prev) => [...prev, created]);
        setBooking((prev) => ({ ...prev, address: created }));
        return created;
      } catch {
        const fallback: Address = {
          id: `clinic-${clinic.id}`,
          label: "Clinic",
          house: clinic.address,
          area: "",
          city: clinic.city,
          state,
          pincode: "000000",
        };
        setBooking((prev) => ({ ...prev, address: fallback }));
        return fallback;
      }
    },
    [allAddresses]
  );

  const fetchSlots = useCallback(async () => {
    if (!booking.selectedDate || !city?.id || !effectiveServiceType) return;

    const addressId = booking.address?.id;
    if (!addressId) {
      // No address yet – show default fallback immediately (no API call needed)
      const labels = getDefaultSlotLabels(booking.selectedDate);
      setAvailableSlots(filterPastSlotLabels(labels, booking.selectedDate));
      return;
    }

    type SlotApi = { slotStart: string; slotEnd: string };

    setSlotsLoading(true);
    const dateStr = booking.selectedDate.toISOString().slice(0, 10);

    try {
      // Single API call – removed the /partners pre-check to reduce latency
      const res = await api.get("/booking/slots", {
        params: {
          date: dateStr,
          serviceType: effectiveServiceType,
          cityId: city.id,
          addressId,
        },
      });

      const slots = (res.data.slots ?? []) as SlotApi[];
      const labels = slots.map((slot) => {
        const start = new Date(slot.slotStart);
        const end = new Date(slot.slotEnd);
        const fmt = (d: Date) => {
          const h = d.getHours();
          const m = d.getMinutes();
          const ampm = h >= 12 ? "PM" : "AM";
          const h12 = h % 12 || 12;
          return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
        };
        return `${fmt(start)} - ${fmt(end)}`;
      });

      const fallback = getDefaultSlotLabels(booking.selectedDate);
      const nextLabels = labels.length > 0 ? labels : fallback;
      setAvailableSlots(filterPastSlotLabels(nextLabels, booking.selectedDate));
    } catch {
      // On any error fall back to static slots
      const labels = getDefaultSlotLabels(booking.selectedDate);
      setAvailableSlots(filterPastSlotLabels(labels, booking.selectedDate));
    } finally {
      setSlotsLoading(false);
    }
  }, [booking.address?.id, booking.selectedDate, city?.id, effectiveServiceType]);

  // Fetch available slots when date + address is selected
  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const scrollToRef = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  // --- Add pet via backend ---
  const handleAddPet = async (pet: Pet) => {
    try {
      const res = await api.post("/booking/pets", {
        name: pet.name,
        type: pet.type,
        breed: pet.breed,
        age: pet.age,
        weight: pet.weight,
      });
      const created: Pet = {
        id: res.data.id,
        name: res.data.name,
        type: res.data.type || pet.type,
        breed: res.data.breed || pet.breed,
        age: res.data.age ?? pet.age,
        weight: res.data.weight ?? pet.weight,
      };
      setAllPets((prev) => [...prev, created]);
      setBooking((prev) => ({ ...prev, selectedPets: [created] }));
    } catch {
      // Fallback: add locally
      setAllPets((prev) => [...prev, pet]);
      setBooking((prev) => ({ ...prev, selectedPets: [pet] }));
    }
  };

  // --- Add address via backend ---
  const handleAddAddress = async (address: Address) => {
    try {
      let latitude = 0;
      let longitude = 0;
      if (address.city === "Ahmedabad") {
        latitude = 23.0225;
        longitude = 72.5714;
      } else if (address.city === "Mumbai") {
        latitude = 19.0760;
        longitude = 72.8777;
      }

      const res = await api.post("/booking/addresses", {
        label: address.label,
        house: address.house,
        area: address.area,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        latitude,
        longitude,
      });
      const created: Address = {
        id: res.data.id,
        label: res.data.label || address.label,
        house: res.data.house || address.house,
        area: res.data.area || address.area,
        city: res.data.city || address.city,
        state: res.data.state || address.state,
        pincode: res.data.pincode || address.pincode,
      };
      setAllAddresses((prev) => [...prev, created]);
      setBooking((prev) => ({ ...prev, address: created }));
    } catch {
      setAllAddresses((prev) => [...prev, address]);
      setBooking((prev) => ({ ...prev, address }));
    }
  };

  // --- Create booking via backend ---
  const handleConfirmBooking = async () => {
    if (
      !booking.selectedPets[0] ||
      booking.selectedServices.length === 0 ||
      !booking.address ||
      !booking.selectedTime ||
      !booking.selectedDate ||
      !city?.id ||
      !effectiveServiceType
    ) {
      setError("Missing required booking information");
      return;
    }

    setIsCreating(true);
    setIsSearching(true);
    setError("");

    try {
      // Parse the slot time (e.g. "10:00 AM - 12:00 PM") into actual dates
      const slotParts = booking.selectedTime.split(" - ");
      const dateBase = new Date(booking.selectedDate);
      dateBase.setHours(0, 0, 0, 0);

      const parseTime = (timeStr: string): Date => {
        const [time, ampm] = timeStr.trim().split(" ");
        const [hStr, mStr] = time.split(":");
        let h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);
        if (ampm === "PM" && h !== 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;
        const d = new Date(dateBase);
        d.setHours(h, m, 0, 0);
        return d;
      };

      const slotStart = parseTime(slotParts[0]);
      const slotEnd = slotParts[1] ? parseTime(slotParts[1]) : new Date(slotStart.getTime() + 2 * 60 * 60 * 1000);

      const res = await api.post("/booking", {
        serviceType: effectiveServiceType,
        petId: booking.selectedPets[0].id,
        addressId: booking.address.id,
        cityId: city.id,
        slotStart: slotStart.toISOString(),
        slotEnd: slotEnd.toISOString(),
      });

      setBookingResult(res.data);
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response
          ?.data?.error === "string"
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "Booking failed. Please try again.";

      setError(message ?? "Booking failed. Please try again.");
      setIsSearching(false);
      setIsCreating(false);
    }
  };

  const handlePartnerFound = useCallback(() => {
    setIsSearching(false);
  }, []);

  const handleFinalConfirm = useCallback(() => {
    setIsSuccess(true);
  }, []);

  const handleNoPartnerReset = useCallback(() => {
    setIsCreating(false);
    setIsSearching(false);
    setBookingResult(null);
  }, []);

  // --- Scroll effects ---
  useEffect(() => {
    if (isClinic && booking.selectedClinic) scrollToRef(petsRef);
  }, [booking.selectedClinic, isClinic, scrollToRef]);

  useEffect(() => {
    if (booking.selectedPets.length === 0) return;
    if (serviceType === ServiceType.VET_ON_CALL) {
      scrollToRef(modeRef);
      return;
    }
    scrollToRef(servicesRef);
  }, [booking.selectedPets.length, scrollToRef, serviceType]);

  useEffect(() => {
    if (booking.selectedClinic) scrollToRef(dateTimeRef);
  }, [booking.selectedClinic, scrollToRef]);

  useEffect(() => {
    if (booking.address) scrollToRef(dateTimeRef);
  }, [booking.address, scrollToRef]);

  useEffect(() => {
    if (booking.selectedDate && booking.selectedTime) scrollToRef(paymentRef);
  }, [booking.selectedDate, booking.selectedTime, scrollToRef]);

  useEffect(() => {
    if (careMode) scrollToRef(servicesRef);
  }, [careMode, scrollToRef]);

  // --- Visibility conditions ---
  const canShowPets = true;
  // Hide mode selector if the mode was already pre-set via URL param
  const canShowMode =
    serviceType === ServiceType.VET_ON_CALL &&
    booking.selectedPets.length > 0 &&
    !modeParam;
  const canShowServices =
    booking.selectedPets.length > 0 &&
    (serviceType !== ServiceType.VET_ON_CALL || careMode !== null);
  const canShowClinic =
    isClinic && canShowServices && booking.selectedServices.length > 0;
  const canShowAddress =
    !isClinic && canShowServices && booking.selectedServices.length > 0;
  const canShowDateTime = isClinic
    ? canShowClinic && Boolean(booking.selectedClinic)
    : canShowAddress && Boolean(booking.address);
  const canShowPayment = Boolean(
    booking.selectedDate &&
      booking.selectedTime &&
      booking.selectedServices.length > 0
  );

  const headerTitle = useMemo(() => {
    if (isClinic && !booking.selectedClinic) return "Your Nearby Clinics";
    if (isHeroEntry && booking.selectedPets.length === 0) return "Add Your Pet";
    return getServiceCategoryName(type);
  }, [booking.selectedClinic, booking.selectedPets.length, isClinic, isHeroEntry, type]);

  // --- Guard ---
  if (!serviceType || !user) {
    return null;
  }

  // --- Success popup (fixed overlay, rendered on top of main wizard) ---
  const successOverlay = isSuccess && (booking.address || booking.selectedClinic) ? (() => {
    const displayAddress = booking.address || {
      id: "clinic",
      label: booking.selectedClinic?.name || "Clinic",
      house: booking.selectedClinic?.address || "",
      area: "",
      city: booking.selectedClinic?.city || "",
      state: "Gujarat",
      pincode: "",
    };
    const partner = bookingResult?.partner?.id ? {
      name: bookingResult.partner.name || "Assigned Partner",
      rating: 4.8,
      sessions: 200,
      experience: 5,
      specialization: effectiveServiceType === ServiceType.GROOMING ? "Pet Groomer" : "Veterinarian",
      description: undefined,
      phone: bookingResult.partner.phone || null,
    } : null;
    return (
      <BookingSuccess
        pets={booking.selectedPets}
        services={booking.selectedServices}
        address={displayAddress}
        selectedDate={booking.selectedDate}
        selectedTime={booking.selectedTime}
        bookingId={bookingResult?.id || null}
        confirmationMessage={isClinic ? "Your clinic slot is booked." : undefined}
        partner={partner}
      />
    );
  })() : null;

  // --- Searching / Partner found screen ---
  if (isCreating) {
    if (isSearching) {
      // SearchingPartner now covers the entire screen via fixed positioning
      return <SearchingPartner onFound={handlePartnerFound} />;
    }

    // Partner found or no partner scenario
    return (
      <div className="min-h-screen bg-background">
        {successOverlay}
        <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border pt-safe">
          <div className="max-w-lg mx-auto flex items-center px-4 h-14">
            <h1 className="text-base font-semibold text-foreground">{getServiceCategoryName(type)} Booking</h1>
          </div>
        </div>

        <div className="max-w-lg mx-auto pb-10">
          {bookingResult ? (
            bookingResult.partner?.id ? (
              <AssignedPartnerCard
                partner={{
                  name: bookingResult.partner?.name || "Partner Assigned",
                  specialization:
                    effectiveServiceType === ServiceType.GROOMING
                      ? "Pet Groomer"
                      : "Veterinarian",
                  experience: 5,
                  rating: 4.8,
                  avatar: effectiveServiceType === ServiceType.GROOMING ? "✂️" : "🩺",
                  phone: bookingResult.partner?.phone || null,
                  eta: "25-35 mins",
                }}
                onContinue={handleFinalConfirm}
              />
            ) : (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No partner is available for this slot. Please pick a different time.
                </p>
                <button
                  onClick={handleNoPartnerReset}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-[#0B3B2A] px-5 text-sm font-semibold text-white"
                >
                  Choose another slot
                </button>
              </div>
            )
          ) : (
            <div className="px-4 py-12 text-center">
              {error ? (
                <p className="text-destructive">{error}</p>
              ) : (
                <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                  <div className="h-8 w-8 rounded-full border-2 border-[#DDE8E3] border-t-[#0B3B2A] animate-spin" />
                  Finalizing your booking...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Main wizard ---
  return (
    <div className="min-h-screen bg-background">
      {/* Booking Confirmed popup overlay */}
      {successOverlay}
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border pt-safe">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 h-14">
          <button onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground">{headerTitle}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto pb-10">
        {error && (
          <div className="mx-4 mt-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {canShowPets && (
          <div ref={petsRef}>
            <PetSelector
              pets={allPets}
              selectedPets={booking.selectedPets}
              onSelect={(selectedPets) => setBooking((prev) => ({ ...prev, selectedPets }))}
              onAddPet={handleAddPet}
              onNext={() =>
                scrollToRef(
                  serviceType === ServiceType.VET_ON_CALL ? modeRef : servicesRef
                )
              }
              showBackButton={false}
              showContinueButton={false}
            />
          </div>
        )}

        {canShowMode && (
          <div ref={modeRef}>
            <div className="px-4 py-5 animate-fade-in-up">
              <div className="text-[12px] text-[#3E6255] font-bold uppercase tracking-[0.8px] mb-3">
                Choose Consultation Mode
              </div>
              <div className="grid gap-3">
                <button
                  onClick={() => setCareMode("vet-on-call")}
                  className={`w-full rounded-[18px] border bg-white p-4 text-left transition-all ${
                    careMode === "vet-on-call"
                      ? "border-[#27AE78] bg-[#F5FAF7] shadow-sm"
                      : "border-[#DDE8E3]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[18px] ${
                      careMode === "vet-on-call" ? "bg-[#E3F6EE]" : "bg-[#F0F5F2]"
                    }`}>🏠</div>
                    <div>
                      <div className="text-[14px] font-bold text-[#081C13]">Vet on Call</div>
                      <div className="text-[12px] text-[#3E6255] mt-0.5">A vet visits your home</div>
                    </div>
                    {careMode === "vet-on-call" && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-[#27AE78] flex items-center justify-center">
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setCareMode("at-clinic")}
                  className={`w-full rounded-[18px] border bg-white p-4 text-left transition-all ${
                    careMode === "at-clinic"
                      ? "border-[#27AE78] bg-[#F5FAF7] shadow-sm"
                      : "border-[#DDE8E3]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[18px] ${
                      careMode === "at-clinic" ? "bg-[#E3F6EE]" : "bg-[#F0F5F2]"
                    }`}>🏥</div>
                    <div>
                      <div className="text-[14px] font-bold text-[#081C13]">At Clinic</div>
                      <div className="text-[12px] text-[#3E6255] mt-0.5">Visit a nearby partner clinic</div>
                    </div>
                    {careMode === "at-clinic" && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-[#27AE78] flex items-center justify-center">
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </div>
                </button>
              </div>
              {/* Continue button – only active when a mode is selected */}
              <button
                disabled={!careMode}
                onClick={() => scrollToRef(servicesRef)}
                className="w-full mt-4 h-[50px] rounded-2xl text-[15px] font-bold text-white transition-all disabled:opacity-40"
                style={{ background: careMode ? "#0B3B2A" : "#6E8F83" }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {canShowServices && services.length > 0 && (
          <div ref={servicesRef}>
            <ServicePicker
              services={services}
              selectedServices={booking.selectedServices}
              selectedPets={booking.selectedPets}
              onSelect={(selectedServices) =>
                setBooking((prev) => ({ ...prev, selectedServices }))
              }
              onNext={() => scrollToRef(isClinic ? clinicRef : addressRef)}
              showBackButton={false}
              showContinueButton={false}
            />
          </div>
        )}

        {canShowClinic && (
          <div ref={clinicRef}>
            <ClinicSearchPicker
              selectedClinic={booking.selectedClinic}
              onSelect={async (selectedClinic) => {
                setBooking((prev) => ({ ...prev, selectedClinic }));
                await ensureClinicAddress(selectedClinic);
              }}
              onNext={() => scrollToRef(dateTimeRef)}
            />
          </div>
        )}

        {canShowAddress && (
          <div ref={addressRef}>
            <AddressPicker
              addresses={allAddresses}
              selectedAddress={booking.address}
              onSelect={(address) => setBooking((prev) => ({ ...prev, address }))}
              onAddAddress={handleAddAddress}
              onNext={() => scrollToRef(dateTimeRef)}
              showBackButton={false}
              showContinueButton={false}
            />
          </div>
        )}

        {canShowDateTime && (
          <div ref={dateTimeRef}>
            <DateTimePicker
              selectedDate={booking.selectedDate}
              selectedTime={booking.selectedTime}
              timeSlots={availableSlots}
              onSelectDate={(selectedDate) => {
                setBooking((prev) => ({ ...prev, selectedDate, selectedTime: null }));
              }}
              onSelectTime={(selectedTime) => setBooking((prev) => ({ ...prev, selectedTime }))}
              onNext={() => scrollToRef(paymentRef)}
              showBackButton={false}
              showContinueButton={false}
              minDate={effectiveServiceType === ServiceType.GROOMING ? (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })() : undefined}
              allowFallback={false}
            />
            {slotsLoading && (
              <div className="px-4 pb-4">
                <p className="text-xs text-muted-foreground animate-pulse-soft">Loading available slots...</p>
              </div>
            )}
          </div>
        )}

        {canShowPayment && (
          <div ref={paymentRef}>
            <PaymentOptions
              selectedPets={booking.selectedPets}
              selectedServices={booking.selectedServices}
              paymentMethod={booking.paymentMethod}
              onSelectPayment={(paymentMethod) => {
                setBooking((prev) => ({ ...prev, paymentMethod }));
              }}
              allowOffline={!isVetOnCall}
            />
            <div className="px-4 pb-10 mt-4">
              <button 
                onClick={handleConfirmBooking}
                disabled={!booking.paymentMethod || isCreating}
                className="w-full h-[52px] rounded-2xl bg-[#0B3B2A] text-white text-[15px] shadow-elevated transition-colors hover:bg-[#155E41] disabled:opacity-50 flex items-center justify-center font-semibold"
              >
                {isCreating ? "Confirming..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
