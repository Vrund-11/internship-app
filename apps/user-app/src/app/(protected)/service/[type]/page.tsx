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
import { useAuth } from "@/context/AuthContext";
import { useCity } from "@/context/CityContext";
import { api } from "@/lib/api";
import type { Pet, Address, BookingState, Clinic } from "@/shared/types";
import { calcTotal } from "@/shared/types";

import PetSelector from "@/features/booking/components/PetSelector";
import ServicePicker from "@/features/booking/components/ServicePicker";
import DateTimePicker from "@/features/booking/components/DateTimePicker";
import AddressPicker from "@/features/booking/components/AddressPicker";
import ClinicSearchPicker from "@/features/booking/components/ClinicSearchPicker";
import PaymentOptions from "@/features/booking/components/PaymentOptions";
import SearchingPartner from "@/features/booking/components/SearchingPartner";
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
  const [availableSlots, setAvailableSlots] = useState<Array<{ label: string; available: boolean }>>([]);
  const [noPartnersNearby, setNoPartnersNearby] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Booking flow state
  const [isCreating, setIsCreating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    id: string;
    partner?: { id?: string; name?: string; phone?: string; rating?: number; totalCompleted?: number } | null;
    clinic?: { id?: string; name?: string; phone?: string; rating?: number; totalCompleted?: number } | null;
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
  const lastServiceCountRef = useRef(0);
  const confirmingRef = useRef(false);

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

  // Default first address for VET_ON_CALL if available
  useEffect(() => {
    if (allAddresses.length > 0 && !booking.address && isVetOnCall) {
      setBooking((prev) => ({ ...prev, address: allAddresses[0] }));
    }
  }, [allAddresses, booking.address, isVetOnCall]);

  const fetchSlots = useCallback(async () => {
    if (!booking.selectedDate || !city?.id || !effectiveServiceType) return;

    const addressId = booking.address?.id ?? null;
    const clinicId = booking.selectedClinic?.id ?? null;

    if (effectiveServiceType === ServiceType.VET_CLINIC && !clinicId) return;

    if (effectiveServiceType !== ServiceType.VET_CLINIC && !addressId) {
      const labels = getDefaultSlotLabels(booking.selectedDate);
      const filtered = filterPastSlotLabels(labels, booking.selectedDate);
      setAvailableSlots(filtered.map(l => ({ label: l, available: true })));
      setNoPartnersNearby(false);
      return;
    }

    type SlotApi = { slotStart: string; slotEnd: string; available: boolean };

    setSlotsLoading(true);
    const year = booking.selectedDate.getFullYear();
    const month = String(booking.selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(booking.selectedDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    try {
      // Single API call – removed the /partners pre-check to reduce latency
      const res = await api.get("/booking/slots", {
        params: {
          date: dateStr,
          serviceType: effectiveServiceType,
          cityId: city.id,
          addressId: addressId ?? undefined,
          clinicId: clinicId ?? undefined,
        },
      });

      const slots = (res.data.slots ?? []) as SlotApi[];
      const isNoPartners = Boolean(res.data.noPartnersNearby);
      setNoPartnersNearby(isNoPartners);

      const mapped = slots.map((slot) => {
        const start = new Date(slot.slotStart);
        const end = new Date(slot.slotEnd);
        const fmt = (d: Date) => {
          const h = d.getHours();
          const m = d.getMinutes();
          const ampm = h >= 12 ? "PM" : "AM";
          const h12 = h % 12 || 12;
          return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
        };
        const label = `${fmt(start)} - ${fmt(end)}`;
        return { label, available: slot.available };
      });

      // Filter out past slots
      const today = new Date();
      const sameDay =
        booking.selectedDate.getFullYear() === today.getFullYear() &&
        booking.selectedDate.getMonth() === today.getMonth() &&
        booking.selectedDate.getDate() === today.getDate();

      const finalSlots = mapped.filter((slot) => {
        if (!sameDay) return true;

        const endLabel = slot.label.split("-")[1]?.trim();
        if (!endLabel) return false;

        const [time, ampm] = endLabel.split(" ");
        const [hStr, mStr] = time.split(":");
        let h = Number(hStr);
        const m = Number(mStr || 0);

        if (ampm === "PM" && h !== 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;

        const endTime = new Date(booking.selectedDate!);
        endTime.setHours(h, m, 0, 0);
        return endTime.getTime() > today.getTime();
      });

      if (finalSlots.length > 0) {
        setAvailableSlots(finalSlots);
      } else {
        const fallback = getDefaultSlotLabels(booking.selectedDate);
        const filteredFallback = filterPastSlotLabels(fallback, booking.selectedDate);
        setAvailableSlots(filteredFallback.map(l => ({ label: l, available: false })));
      }
    } catch {
      // On any error fall back to static slots
      const labels = getDefaultSlotLabels(booking.selectedDate);
      const filtered = filterPastSlotLabels(labels, booking.selectedDate);
      setAvailableSlots(filtered.map(l => ({ label: l, available: true })));
      setNoPartnersNearby(false);
    } finally {
      setSlotsLoading(false);
    }
  }, [booking.address?.id, booking.selectedClinic?.id, booking.selectedDate, city?.id, effectiveServiceType]);

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
    if (confirmingRef.current) return;
    const clinicId = booking.selectedClinic?.id ?? null;
    const addressId = booking.address?.id ?? null;

    if (
      !booking.selectedPets[0] ||
      booking.selectedServices.length === 0 ||
      !booking.selectedTime ||
      !booking.selectedDate ||
      !city?.id ||
      !effectiveServiceType
    ) {
      setError("Missing required booking information");
      return;
    }

    if (effectiveServiceType === ServiceType.VET_CLINIC && !clinicId) {
      setError("Please select a clinic");
      return;
    }

    if (effectiveServiceType === ServiceType.GROOMING && !addressId) {
      setError("Please select an address");
      return;
    }

    setIsCreating(true);
    setIsSearching(true);
    setError("");
    confirmingRef.current = true;

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
        addressId: effectiveServiceType === ServiceType.VET_CLINIC ? null : addressId,
        clinicId: effectiveServiceType === ServiceType.VET_CLINIC ? clinicId : null,
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
    } finally {
      confirmingRef.current = false;
    }
  };

  const handlePartnerFound = useCallback(() => {
    setIsSearching(false);
    setIsSuccess(true);
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
    if (booking.selectedPets.length === 0) return;
    if (serviceType === ServiceType.VET_ON_CALL) {
      scrollToRef(modeRef);
      return;
    }
    scrollToRef(servicesRef);
  }, [booking.selectedPets.length, scrollToRef, serviceType]);

  useEffect(() => {
    if (isClinic ? booking.selectedClinic : booking.address) {
      scrollToRef(dateTimeRef);
    }
  }, [booking.address, booking.selectedClinic, isClinic, scrollToRef]);

  useEffect(() => {
    if (booking.selectedDate && booking.selectedTime) scrollToRef(paymentRef);
  }, [booking.selectedDate, booking.selectedTime, scrollToRef]);

  useEffect(() => {
    if (careMode) scrollToRef(servicesRef);
  }, [careMode, scrollToRef]);

  // Prevent back navigation during creation process
  useEffect(() => {
    if (isCreating) {
      window.history.pushState(null, "", window.location.href);

      const handlePopState = () => {
        window.history.pushState(null, "", window.location.href);
      };

      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [isCreating]);

  // Redirect to home if user tries to go back after successful booking
  useEffect(() => {
    if (isSuccess) {
      const handlePopState = () => {
        router.push("/home");
      };

      window.history.pushState(null, "", window.location.href);
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [isSuccess, router]);

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
    serviceType === ServiceType.GROOMING && canShowServices && booking.selectedServices.length > 0;
  const canShowDateTime = isClinic
    ? canShowClinic && Boolean(booking.selectedClinic)
    : isVetOnCall
      ? canShowServices && booking.selectedServices.length > 0
      : canShowAddress && Boolean(booking.address);
  useEffect(() => {
    if (!canShowServices) {
      lastServiceCountRef.current = booking.selectedServices.length;
      return;
    }
    if (
      booking.selectedServices.length > 0 &&
      lastServiceCountRef.current === 0
    ) {
      scrollToRef(isClinic ? clinicRef : addressRef);
    }
    lastServiceCountRef.current = booking.selectedServices.length;
  }, [booking.selectedServices.length, canShowServices, isClinic, scrollToRef]);
  const canShowPayment = Boolean(
    booking.selectedDate &&
      booking.selectedTime &&
      booking.selectedServices.length > 0
  );

  const headerTitle = useMemo(() => {
    if (isClinic && !booking.selectedClinic) return "Your Nearby Clinics";
    if (isHeroEntry && booking.selectedPets.length === 0) return "Add Your Pet";
    if (careMode === "vet-on-call") return "Vet on Call";
    if (careMode === "at-clinic") return "At Clinic";
    return getServiceCategoryName(type);
  }, [booking.selectedClinic, booking.selectedPets.length, isClinic, isHeroEntry, type, careMode]);

  // --- Guard ---
  if (!serviceType || !user) {
    return null;
  }

  // --- Success popup (fixed overlay, rendered on top of main wizard) ---
  const successOverlay = (isSuccess || bookingResult?.partner?.id || bookingResult?.clinic?.id) ? (() => {
    const displayAddress = booking.address || (booking.selectedClinic ? {
      id: booking.selectedClinic.id || "clinic",
      label: "Clinic",
      house: booking.selectedClinic.name || "Clinic",
      area: booking.selectedClinic.address || "",
      city: booking.selectedClinic.city || "",
      state: "Gujarat",
      pincode: "",
    } : null);
    const partner = bookingResult?.partner?.id ? {
      name: bookingResult.partner.name || "Assigned Partner",
      rating: 4.8,
      sessions: 200,
      experience: 5,
      specialization: effectiveServiceType === ServiceType.GROOMING ? "Pet Groomer" : "Veterinarian",
      description: undefined,
      phone: bookingResult.partner.phone || null,
    } : bookingResult?.clinic?.id ? {
      name: bookingResult.clinic.name || "Clinic Partner",
      rating: 4.8,
      sessions: 100,
      experience: 5,
      specialization: "Veterinary Clinic",
      description: undefined,
      phone: bookingResult.clinic.phone || null,
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
        serviceType={effectiveServiceType}
      />
    );
  })() : null;

  // --- Searching / Partner found screen ---
  if (isCreating) {
    if (isSearching) {
      // SearchingPartner now covers the entire screen via fixed positioning
      return <SearchingPartner onFound={handlePartnerFound} />;
    }

    if (isSuccess || bookingResult?.partner?.id || bookingResult?.clinic?.id) {
      return successOverlay;
    }

    // Partner found or no partner scenario
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto pb-10 px-4 lg:px-6">
          {bookingResult ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No partner is available for this slot. Please pick a different time.
              </p>
              <button
                onClick={handleNoPartnerReset}
                className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-[#A7009D] px-5 text-sm font-semibold text-white"
              >
                Choose another slot
              </button>
            </div>
          ) : (
            <div className="px-4 py-12 text-center">
              {error ? (
                <p className="text-destructive">{error}</p>
              ) : (
                <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                  <div className="h-8 w-8 rounded-full border-2 border-[#EDE4EB] border-t-[#A7009D] animate-spin" />
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
    <>
      {/* ===== MOBILE VIEW (unchanged) ===== */}
      <div className="md:hidden min-h-screen bg-background">
        {/* Booking Confirmed popup overlay */}
        {successOverlay}
        <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border pt-safe">
          <div className="max-w-4xl mx-auto flex items-center gap-3 px-4 h-14">
            <button onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-base font-semibold text-foreground">{headerTitle}</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto pb-10 px-4">
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
                <div className="text-[12px] text-[#5C3A58] font-bold uppercase tracking-[0.8px] mb-3">
                  Choose Consultation Mode
                </div>
                <div className="grid gap-3">
                  <button
                    onClick={() => setCareMode("vet-on-call")}
                    className={`w-full rounded-[18px] border bg-white p-4 text-left transition-all ${
                      careMode === "vet-on-call"
                        ? "border-[#A7009D] bg-[#FBF0FB] shadow-sm"
                        : "border-[#EDE4EB]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[18px] ${
                        careMode === "vet-on-call" ? "bg-[#F5D6F5]" : "bg-[#F3EEF1]"
                      }`}>🏠</div>
                      <div>
                        <div className="text-[14px] font-bold text-[#1a0a18]">Vet on Call</div>
                        <div className="text-[12px] text-[#5C3A58] mt-0.5">A vet visits your home</div>
                      </div>
                      {careMode === "vet-on-call" && (
                        <div className="ml-auto w-5 h-5 rounded-full bg-[#A7009D] flex items-center justify-center">
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => setCareMode("at-clinic")}
                    className={`w-full rounded-[18px] border bg-white p-4 text-left transition-all ${
                      careMode === "at-clinic"
                        ? "border-[#A7009D] bg-[#FBF0FB] shadow-sm"
                        : "border-[#EDE4EB]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[18px] ${
                        careMode === "at-clinic" ? "bg-[#F5D6F5]" : "bg-[#F3EEF1]"
                      }`}>🏥</div>
                      <div>
                        <div className="text-[14px] font-bold text-[#1a0a18]">At Clinic</div>
                        <div className="text-[12px] text-[#5C3A58] mt-0.5">Visit a nearby partner clinic</div>
                      </div>
                      {careMode === "at-clinic" && (
                        <div className="ml-auto w-5 h-5 rounded-full bg-[#A7009D] flex items-center justify-center">
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
                  style={{ background: careMode ? "#A7009D" : "#8A6888" }}
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
                onSelect={(selectedClinic) => {
                  setBooking((prev) => ({ ...prev, selectedClinic, address: null }));
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
                minDate={undefined}
                allowFallback={false}
                slotsLoading={slotsLoading}
                noPartnersNearby={noPartnersNearby}
              />
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
                  className="w-full h-[52px] rounded-2xl bg-[#A7009D] text-white text-[15px] shadow-elevated transition-colors hover:bg-[#6B0068] disabled:opacity-50 flex items-center justify-center font-semibold"
                >
                  {isCreating ? "Confirming..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== DESKTOP VIEW ===== */}
      <div className="hidden md:block bg-[#F9FAFB] min-h-screen pb-24">
        {/* Booking Confirmed popup overlay */}
        {successOverlay}

        {/* Top Navigation Bar */}
        <nav className="fixed top-0 left-0 w-full z-50 flex items-center h-16 px-10 bg-white border-b border-slate-200">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-3 cursor-pointer hover:opacity-70 transition-opacity text-slate-800"
          >
            <ArrowLeft className="w-5 h-5 text-[#6c005f]" />
            <h1 className="text-xl font-bold">{headerTitle}</h1>
          </button>
        </nav>

        <main className="max-w-[1280px] mx-auto mt-16 px-10 py-10">
          {error && (
            <div className="mb-6 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive max-w-4xl mx-auto">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Booking Flow */}
            <div className="lg:col-span-8 space-y-10">
              {/* Section: Pet Profile */}
              {canShowPets && (
                <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Pet Profile</h2>
                  <PetSelector
                    pets={allPets}
                    selectedPets={booking.selectedPets}
                    onSelect={(selectedPets) => setBooking((prev) => ({ ...prev, selectedPets }))}
                    onAddPet={handleAddPet}
                    onNext={() => {}}
                    showBackButton={false}
                    showContinueButton={false}
                  />
                </section>
              )}

              {/* Section: Choose Services */}
              {canShowServices && services.length > 0 && (
                <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Choose Services</h2>
                  <ServicePicker
                    services={services}
                    selectedServices={booking.selectedServices}
                    selectedPets={booking.selectedPets}
                    onSelect={(selectedServices) => setBooking((prev) => ({ ...prev, selectedServices }))}
                    onNext={() => {}}
                    showBackButton={false}
                    showContinueButton={false}
                  />
                </section>
              )}

              {/* Section: Delivery Address / Clinic */}
              {canShowAddress && (
                <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Delivery Address</h2>
                  <AddressPicker
                    addresses={allAddresses}
                    selectedAddress={booking.address}
                    onSelect={(address) => setBooking((prev) => ({ ...prev, address }))}
                    onAddAddress={handleAddAddress}
                    onNext={() => {}}
                    showBackButton={false}
                    showContinueButton={false}
                  />
                </section>
              )}

              {canShowClinic && (
                <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Select Clinic</h2>
                  <ClinicSearchPicker
                    selectedClinic={booking.selectedClinic}
                    onSelect={(selectedClinic) => {
                      setBooking((prev) => ({ ...prev, selectedClinic, address: null }));
                    }}
                    onNext={() => {}}
                  />
                </section>
              )}

              {/* Section: Schedule */}
              {canShowDateTime && (
                <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Schedule</h2>
                  <DateTimePicker
                    selectedDate={booking.selectedDate}
                    selectedTime={booking.selectedTime}
                    timeSlots={availableSlots}
                    onSelectDate={(selectedDate) => {
                      setBooking((prev) => ({ ...prev, selectedDate, selectedTime: null }));
                    }}
                    onSelectTime={(selectedTime) => setBooking((prev) => ({ ...prev, selectedTime }))}
                    onNext={() => {}}
                    showBackButton={false}
                    showContinueButton={false}
                    minDate={undefined}
                    allowFallback={false}
                    slotsLoading={slotsLoading}
                    noPartnersNearby={noPartnersNearby}
                  />
                </section>
              )}
            </div>

            {/* Right Column: Order Summary & Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                {/* Order Summary Card */}
                <div className="p-6 bg-white border border-[#d9c0ce]/30 rounded-3xl shadow-sm space-y-6">
                  <h2 className="font-headline-sm text-[#151c27] mb-6 pb-4 border-b border-[#d9c0ce]/20">Order Summary</h2>
                  
                  {booking.selectedPets.length > 0 && booking.selectedServices.length > 0 ? (
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <span className="text-[#6c005f] text-lg">🐾</span>
                          <div>
                            <p className="font-bold text-slate-900">{booking.selectedPets.map(p => p.name).join(", ")}</p>
                            <p className="text-xs text-slate-500">{booking.selectedServices.map(s => s.name).join(", ")}</p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900">₹{calcTotal(booking.selectedPets, booking.selectedServices)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Select a pet and service to view pricing.</p>
                  )}

                  <div className="space-y-3 py-6 border-y border-[#d9c0ce]/20 border-dashed">
                    <div className="flex justify-between text-slate-600 text-sm">
                      <span>Subtotal</span>
                      <span>₹{calcTotal(booking.selectedPets, booking.selectedServices)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-sm">
                      <span>Service Fee</span>
                      <span>₹{booking.selectedServices.length > 0 ? 50 : 0}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-[#6c005f]">
                      <span>Total Amount</span>
                      <span>₹{calcTotal(booking.selectedPets, booking.selectedServices) + (booking.selectedServices.length > 0 ? 50 : 0)}</span>
                    </div>
                  </div>

                  {/* Payment Method Selector inside sidebar */}
                  {canShowPayment && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Payment Method</h3>
                      <div className="space-y-3">
                        <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                          booking.paymentMethod === "online" ? "border-[#A7009D] bg-[#FBF0FB]" : "border-slate-200 hover:border-[#A7009D]"
                        }`}>
                          <input
                            type="radio"
                            name="payment-desktop"
                            checked={booking.paymentMethod === "online"}
                            onChange={() => setBooking((prev) => ({ ...prev, paymentMethod: "online" }))}
                            className="w-5 h-5 text-[#A7009D] border-slate-300 focus:ring-[#A7009D]"
                          />
                          <div className="flex items-center gap-3">
                            <span className="text-lg">💳</span>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">Pay Online</p>
                              <p className="text-xs text-slate-400">UPI, Cards, Net Banking</p>
                            </div>
                          </div>
                        </label>

                        {!isVetOnCall && (
                          <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                            booking.paymentMethod === "offline" ? "border-[#A7009D] bg-[#FBF0FB]" : "border-slate-200 hover:border-[#A7009D]"
                          }`}>
                            <input
                              type="radio"
                              name="payment-desktop"
                              checked={booking.paymentMethod === "offline"}
                              onChange={() => setBooking((prev) => ({ ...prev, paymentMethod: "offline" }))}
                              className="w-5 h-5 text-[#A7009D] border-slate-300 focus:ring-[#A7009D]"
                            />
                            <div className="flex items-center gap-3">
                              <span className="text-lg">💵</span>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">Pay After Service</p>
                                <p className="text-xs text-slate-400">Cash or UPI after completion</p>
                              </div>
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Confirm Booking Button */}
                  <button
                    onClick={handleConfirmBooking}
                    disabled={!booking.paymentMethod || isCreating}
                    className="w-full py-4 bg-[#6c005f] hover:bg-[#6c005f]/95 text-white font-bold rounded-full text-base flex items-center justify-center gap-2 shadow-sm hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
                  >
                    <span>{isCreating ? "Confirming..." : "Confirm Booking"}</span>
                    <span className="rotate-180">←</span>
                  </button>
                </div>

                {/* Info Alert */}
                <div className="p-4 bg-[#f0f3ff] text-slate-600 rounded-xl flex items-start gap-3">
                  <span className="text-lg">ℹ️</span>
                  <p className="text-xs leading-relaxed">
                    You can reschedule or cancel your appointment up to 2 hours before the scheduled time for free.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
