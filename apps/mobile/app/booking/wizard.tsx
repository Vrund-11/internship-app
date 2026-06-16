import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useCity } from "@/context/CityContext";
import { api } from "@/lib/api";
import Colors from "@/constants/Colors";
import { ServiceType } from "@canovet/shared";

// Modular Sub-Components
import PetSelector, { ApiPet } from "@/components/booking/PetSelector";
import ServicePicker, { ServiceItem } from "@/components/booking/ServicePicker";
import AddressPicker, { Address } from "@/components/booking/AddressPicker";
import ClinicSearchPicker, { Clinic } from "@/components/booking/ClinicSearchPicker";
import DateTimePicker from "@/components/booking/DateTimePicker";
import PaymentOptions from "@/components/booking/PaymentOptions";
import SearchingPartnerOverlay from "@/components/booking/SearchingPartnerOverlay";
import AssignedPartnerCard from "@/components/booking/AssignedPartnerCard";
import BookingSuccessOverlay from "@/components/booking/BookingSuccessOverlay";

// Service Resolvers
const SERVICE_TYPE_BY_PARAM: Record<string, ServiceType> = {
  grooming: ServiceType.GROOMING,
  "vet-consultation": ServiceType.VET_ON_CALL,
  "vet-on-call": ServiceType.VET_ON_CALL,
  "vet_on_call": ServiceType.VET_ON_CALL,
  "at-clinic": ServiceType.VET_CLINIC,
  "vet_clinic": ServiceType.VET_CLINIC,
};

function resolveServiceType(type: string): ServiceType | null {
  if (!type) return null;
  return SERVICE_TYPE_BY_PARAM[type.toLowerCase()] || null;
}

const groomingServices: ServiceItem[] = [
  { id: "bath", name: "Full Bath & Blow Dry", description: "Deep cleansing bath with premium shampoo", dogPrice: 699, catPrice: 899, icon: "bath", duration: "45 min" },
  { id: "haircut", name: "Haircut & Styling", description: "Breed-specific haircut & styling", dogPrice: 999, catPrice: 1199, icon: "scissors", duration: "60 min" },
  { id: "nails", name: "Nail Trimming", description: "Safe nail clipping & filing", dogPrice: 299, catPrice: 349, icon: "hand", duration: "15 min" },
  { id: "ear", name: "Ear Cleaning", description: "Gentle ear cleaning & inspection", dogPrice: 249, catPrice: 299, icon: "ear", duration: "15 min" },
  { id: "teeth", name: "Teeth Brushing", description: "Dental hygiene with pet-safe toothpaste", dogPrice: 349, catPrice: 399, icon: "smile", duration: "20 min" },
  { id: "spa", name: "Full Spa Package", description: "Bath + haircut + nails + ear + teeth", dogPrice: 1999, catPrice: 2499, icon: "sparkles", duration: "2 hrs" },
];

const vetOnCallServices: ServiceItem[] = [
  { id: "checkup", name: "General Checkup", description: "Complete physical examination", dogPrice: 599, catPrice: 499, icon: "stethoscope", duration: "30 min" },
  { id: "vaccination", name: "Vaccination", description: "Core & non-core vaccines", dogPrice: 799, catPrice: 699, icon: "syringe", duration: "20 min" },
  { id: "deworming", name: "Deworming", description: "Internal parasite treatment", dogPrice: 399, catPrice: 349, icon: "pill", duration: "15 min" },
  { id: "skin", name: "Skin Treatment", description: "Dermatology consultation & treatment", dogPrice: 899, catPrice: 799, icon: "shield-plus", duration: "30 min" },
];

const atClinicServices: ServiceItem[] = [
  { id: "clinic-checkup", name: "Clinic Consultation", description: "In-clinic vet consultation", dogPrice: 400, catPrice: 300, icon: "hospital", duration: "30 min" },
  { id: "xray", name: "X-Ray", description: "Digital X-ray imaging", dogPrice: 1500, catPrice: 1200, icon: "scan", duration: "30 min" },
  { id: "blood-test", name: "Blood Test", description: "Complete blood panel", dogPrice: 1200, catPrice: 1000, icon: "droplets", duration: "20 min" },
  { id: "surgery", name: "Minor Surgery", description: "Minor surgical procedures", dogPrice: 3500, catPrice: 3000, icon: "activity", duration: "1-2 hrs" },
];

export default function BookingWizard() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const typeParam = (searchParams.type as string) || "grooming";
  const serviceType = resolveServiceType(typeParam);
  const { user } = useAuth();
  const { city } = useCity();

  // Route modes
  const [careMode, setCareMode] = useState<"vet-on-call" | "at-clinic" | null>(() => {
    if (serviceType === ServiceType.VET_CLINIC) return "at-clinic";
    const modeParam = searchParams.mode as string | undefined;
    if (modeParam === "vet-on-call" || modeParam === "at-clinic") return modeParam;
    return null;
  });

  useEffect(() => {
    if (serviceType === ServiceType.VET_CLINIC) {
      setCareMode("at-clinic");
    } else {
      const modeParam = searchParams.mode as string | undefined;
      if (modeParam === "vet-on-call" || modeParam === "at-clinic") {
        setCareMode(modeParam);
      }
    }
  }, [searchParams.mode, serviceType]);

  const effectiveServiceType = useMemo(() => {
    if (serviceType === ServiceType.VET_CLINIC) return ServiceType.VET_CLINIC;
    if (serviceType === ServiceType.VET_ON_CALL && careMode === "at-clinic") {
      return ServiceType.VET_CLINIC;
    }
    return serviceType;
  }, [careMode, serviceType]);

  const isClinic = effectiveServiceType === ServiceType.VET_CLINIC;
  const isVetOnCall = effectiveServiceType === ServiceType.VET_ON_CALL;

  // Master Wizard State
  const [booking, setBooking] = useState({
    selectedPets: [] as ApiPet[],
    selectedServices: [] as ServiceItem[],
    selectedDate: null as Date | null,
    selectedTime: null as string | null,
    address: null as Address | null,
    selectedClinic: null as Clinic | null,
    paymentMethod: null as "online" | "offline" | null,
  });

  // DB Data
  const [allPets, setAllPets] = useState<ApiPet[]>([]);
  const [allAddresses, setAllAddresses] = useState<Address[]>([]);
  const [clinicsList, setClinicsList] = useState<Clinic[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingClinics, setLoadingClinics] = useState(false);

  // Time Slots
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Checkout Stages
  const [isCreating, setIsCreating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    id: string;
    partner?: { id?: string; name?: string; phone?: string; rating?: number; totalCompleted?: number } | null;
    status?: string;
  } | null>(null);
  const [error, setError] = useState("");

  const scrollRef = useRef<ScrollView>(null);

  // Active theme calculation based on resolved type/mode
  const activeTheme = useMemo(() => {
    const defaultColor = Colors.light.primary;
    const defaultSoft = Colors.light.primarySoft;

    if (effectiveServiceType === ServiceType.GROOMING) {
      return { primary: "#FF10F0", soft: "#FFF0FB" };
    }
    if (effectiveServiceType === ServiceType.VET_ON_CALL) {
      return { primary: "#002984", soft: "#e0e7ff" };
    }
    if (effectiveServiceType === ServiceType.VET_CLINIC) {
      return { primary: "#ea580c", soft: "#fff7ed" };
    }
    return { primary: defaultColor, soft: defaultSoft };
  }, [effectiveServiceType]);

  const scrollToNext = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, []);

  // Pricing formula
  const subtotal = useMemo(() => {
    return booking.selectedPets.reduce((total, pet) => {
      return total + booking.selectedServices.reduce((sub, svc) => {
        return sub + (pet.type === "cat" ? svc.catPrice : svc.dogPrice);
      }, 0);
    }, 0);
  }, [booking.selectedPets, booking.selectedServices]);

  // Promo Code State
  const [promoCode, setPromoCode] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountPercent: number;
    discount: number;
    total: number;
  } | null>(null);
  const [promoError, setPromoError] = useState("");

  // Load profiles
  useEffect(() => {
    if (!user) return;

    api.get("/booking/pets")
      .then((res) => {
        const pets = (res.data.pets ?? []) as any[];
        setAllPets(pets.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type ?? "dog",
          breed: p.breed ?? "Mixed",
          age: p.age ?? 2,
          weight: p.weight ?? 8,
        })));
      })
      .catch(() => {});

    api.get("/booking/addresses")
      .then((res) => {
        const addresses = (res.data.addresses ?? []) as any[];
        setAllAddresses(addresses.map(addr => ({
          id: addr.id,
          label: addr.label ?? "Home",
          house: addr.house ?? addr.text ?? "",
          area: addr.area ?? "",
          city: addr.city ?? "Ahmedabad",
          state: addr.state ?? "Gujarat",
          pincode: addr.pincode ?? "000000",
        })));
      })
      .catch(() => {});
  }, [user]);

  // Load clinics
  useEffect(() => {
    if (!isClinic) return;
    setLoadingClinics(true);
    api.get("/partners/clinics", { params: { search: searchQuery } })
      .then((res) => {
        setClinicsList(res.data.clinics ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingClinics(false));
  }, [isClinic, searchQuery]);

  // Progressive reveal auto-scroll
  const prevRevealStateRef = useRef({
    mode: false,
    services: false,
    clinic: false,
    address: false,
    datetime: false,
    payment: false,
  });

  // Calculate reveal indicators first so they are available in useEffect
  const canShowPets = true;
  const canShowMode = serviceType === ServiceType.VET_ON_CALL && booking.selectedPets.length > 0;
  const canShowServices = booking.selectedPets.length > 0 && (serviceType !== ServiceType.VET_ON_CALL || careMode !== null);
  const canShowClinic = isClinic && canShowServices && booking.selectedServices.length > 0;
  const canShowAddress = serviceType === ServiceType.GROOMING && canShowServices && booking.selectedServices.length > 0;
  const canShowDateTime = isClinic
    ? canShowClinic && booking.selectedClinic !== null
    : isVetOnCall
      ? canShowServices && booking.selectedServices.length > 0
      : canShowAddress && booking.address !== null;
  const canShowPayment = booking.selectedDate !== null && booking.selectedTime !== null && booking.selectedServices.length > 0;

  useEffect(() => {
    const prev = prevRevealStateRef.current;
    let shouldScroll = false;

    if (canShowMode && !prev.mode) {
      prev.mode = true;
      shouldScroll = true;
    }
    if (canShowServices && !prev.services) {
      prev.services = true;
      shouldScroll = true;
    }
    if (canShowClinic && !prev.clinic) {
      prev.clinic = true;
      shouldScroll = true;
    }
    if (canShowAddress && !prev.address) {
      prev.address = true;
      shouldScroll = true;
    }
    if (canShowDateTime && !prev.datetime) {
      prev.datetime = true;
      shouldScroll = true;
    }
    if (canShowPayment && !prev.payment) {
      prev.payment = true;
      shouldScroll = true;
    }

    // Reset when moving backwards
    if (!canShowMode) prev.mode = false;
    if (!canShowServices) prev.services = false;
    if (!canShowClinic) prev.clinic = false;
    if (!canShowAddress) prev.address = false;
    if (!canShowDateTime) prev.datetime = false;
    if (!canShowPayment) prev.payment = false;

    if (shouldScroll) {
      scrollToNext();
    }
  }, [canShowMode, canShowServices, canShowClinic, canShowAddress, canShowDateTime, canShowPayment, scrollToNext]);

  // Horizontal date setup (next 7 days)
  const dateOptions = useMemo(() => {
    const options: Date[] = [];
    const minDate = effectiveServiceType === ServiceType.GROOMING 
      ? (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })() 
      : new Date();
      
    for (let i = 0; i < 7; i++) {
      const d = new Date(minDate);
      d.setDate(minDate.getDate() + i);
      options.push(d);
    }
    return options;
  }, [effectiveServiceType]);

  // Fetch Slots
  const SLOT_RANGES: [number, number][] = [[10, 12], [12, 14], [14, 16], [16, 18]];
  
  const formatSlotLabel = (date: Date, startHour: number, endHour: number) => {
    const fmt = (h: number) => {
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12}:00 ${ampm}`;
    };
    return `${fmt(startHour)} - ${fmt(endHour)}`;
  };

  const filterPastSlots = (labels: string[], date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    if (!isToday) return labels;

    return labels.filter((label) => {
      const endLabel = label.split(" - ")[1];
      const [time, ampm] = endLabel.split(" ");
      let [h] = time.split(":").map(Number);
      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return h > today.getHours();
    });
  };

  const fetchSlots = useCallback(async () => {
    if (!booking.selectedDate || !city?.id || !effectiveServiceType) return;
    
    const addressId = booking.address?.id || null;
    const clinicId = booking.selectedClinic?.id || null;

    if (isClinic && !clinicId) return;
    if (!isClinic && !addressId) {
      const fallback = SLOT_RANGES.map(([s, e]) => formatSlotLabel(booking.selectedDate!, s, e));
      setAvailableSlots(filterPastSlots(fallback, booking.selectedDate));
      return;
    }

    setSlotsLoading(true);
    const year = booking.selectedDate.getFullYear();
    const month = String(booking.selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(booking.selectedDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    try {
      const res = await api.get("/booking/slots", {
        params: {
          date: dateStr,
          serviceType: effectiveServiceType,
          cityId: city.id,
          addressId: addressId || undefined,
          clinicId: clinicId || undefined,
        },
      });
      const slots = (res.data.slots ?? []) as { slotStart: string; slotEnd: string }[];
      const labels = slots.map(s => {
        const start = new Date(s.slotStart);
        const end = new Date(s.slotEnd);
        const fmt = (d: Date) => {
          const h = d.getHours();
          const ampm = h >= 12 ? "PM" : "AM";
          const h12 = h % 12 || 12;
          return `${h12}:00 ${ampm}`;
        };
        return `${fmt(start)} - ${fmt(end)}`;
      });
      const fallback = SLOT_RANGES.map(([s, e]) => formatSlotLabel(booking.selectedDate!, s, e));
      const next = labels.length > 0 ? labels : fallback;
      setAvailableSlots(filterPastSlots(next, booking.selectedDate));
    } catch {
      const fallback = SLOT_RANGES.map(([s, e]) => formatSlotLabel(booking.selectedDate!, s, e));
      setAvailableSlots(filterPastSlots(fallback, booking.selectedDate));
    } finally {
      setSlotsLoading(false);
    }
  }, [booking.selectedDate, booking.address, booking.selectedClinic, city, effectiveServiceType, isClinic]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Save new pet to API
  const handleAddPet = async (petForm: { name: string; type: "dog" | "cat"; breed: string; age: string; weight: string }) => {
    try {
      const res = await api.post("/booking/pets", {
        name: petForm.name,
        type: petForm.type,
        breed: petForm.breed,
        age: Number(petForm.age) || 2,
        weight: Number(petForm.weight) || 8,
      });
      const pet = {
        id: res.data.id,
        name: res.data.name,
        type: res.data.type || petForm.type,
        breed: res.data.breed || petForm.breed,
        age: res.data.age ?? Number(petForm.age),
        weight: res.data.weight ?? Number(petForm.weight),
      };
      setAllPets(prev => [...prev, pet]);
      setBooking(prev => ({ ...prev, selectedPets: [pet] }));
    } catch {
      const pet = {
        id: `local-${Date.now()}`,
        name: petForm.name,
        type: petForm.type,
        breed: petForm.breed,
        age: Number(petForm.age) || 2,
        weight: Number(petForm.weight) || 8,
      };
      setAllPets(prev => [...prev, pet]);
      setBooking(prev => ({ ...prev, selectedPets: [pet] }));
    }
  };

  // Save address to API
  const handleAddAddress = async (addrForm: { label: string; house: string; area: string; state: string; city: string; pincode: string }) => {
    try {
      let latitude = 23.0225;
      let longitude = 72.5714;
      if (addrForm.city === "Mumbai") {
        latitude = 19.0760;
        longitude = 72.8777;
      }
      const res = await api.post("/booking/addresses", {
        label: addrForm.label,
        house: addrForm.house,
        area: addrForm.area,
        city: addrForm.city,
        state: addrForm.state || "Gujarat",
        pincode: addrForm.pincode,
        latitude,
        longitude,
      });
      const addr = {
        id: res.data.id,
        label: res.data.label || addrForm.label,
        house: res.data.house || addrForm.house,
        area: res.data.area || addrForm.area,
        city: res.data.city || addrForm.city,
        state: res.data.state || addrForm.state || "Gujarat",
        pincode: res.data.pincode || addrForm.pincode,
      };
      setAllAddresses(prev => [...prev, addr]);
      setBooking(prev => ({ ...prev, address: addr }));
    } catch {
      const addr = {
        id: `local-${Date.now()}`,
        label: addrForm.label,
        house: addrForm.house,
        area: addrForm.area,
        city: addrForm.city,
        state: addrForm.state || "Gujarat",
        pincode: addrForm.pincode,
      };
      setAllAddresses(prev => [...prev, addr]);
      setBooking(prev => ({ ...prev, address: addr }));
    }
  };

  // Promo code apply
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsApplyingPromo(true);
    setPromoError("");
    try {
      const res = await api.post("/promo/apply", {
        code: promoCode,
        amount: subtotal,
      });
      setAppliedPromo(res.data);
      setPromoCode("");
    } catch (err: any) {
      setPromoError(err.response?.data?.error || "Invalid promo code");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError("");
  };

  const handleConfirmBooking = async () => {
    if (
      booking.selectedPets.length === 0 ||
      booking.selectedServices.length === 0 ||
      !booking.selectedDate ||
      !booking.selectedTime ||
      !city?.id ||
      !booking.paymentMethod
    ) {
      setError("Please complete all sections.");
      return;
    }

    if (isClinic && !booking.selectedClinic) {
      setError("Please select a clinic.");
      return;
    }

    if (effectiveServiceType === ServiceType.GROOMING && !booking.address) {
      setError("Please select a delivery address.");
      return;
    }

    setIsCreating(true);
    setIsSearching(true);
    setError("");

    try {
      const slotParts = booking.selectedTime.split(" - ");
      const parseTime = (timeStr: string): Date => {
        const [time, ampm] = timeStr.trim().split(" ");
        const [hStr] = time.split(":");
        let h = parseInt(hStr, 10);
        if (ampm === "PM" && h !== 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;
        const d = new Date(booking.selectedDate!);
        d.setHours(h, 0, 0, 0);
        return d;
      };

      const slotStart = parseTime(slotParts[0]);
      const slotEnd = parseTime(slotParts[1]);

      const res = await api.post("/booking", {
        serviceType: effectiveServiceType,
        petId: booking.selectedPets[0].id,
        addressId: isClinic ? null : booking.address?.id,
        clinicId: isClinic ? booking.selectedClinic?.id : null,
        cityId: city.id,
        slotStart: slotStart.toISOString(),
        slotEnd: slotEnd.toISOString(),
      });

      setBookingResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Booking failed. Please try again.");
      setIsSearching(false);
      setIsCreating(false);
    }
  };

  const handlePartnerFound = () => {
    setIsSearching(false);
  };

  const handleFinalConfirm = () => {
    setIsSuccess(true);
  };

  const handleNoPartnerReset = () => {
    setIsCreating(false);
    setIsSearching(false);
    setBookingResult(null);
  };

  // Services list mapping
  const servicesList = useMemo(() => {
    if (careMode === "at-clinic") return atClinicServices;
    if (careMode === "vet-on-call") return vetOnCallServices;
    return groomingServices;
  }, [careMode]);

  // Header title
  const headerTitle = useMemo(() => {
    if (isClinic && !booking.selectedClinic) return "Your Nearby Clinics";
    if (serviceType === ServiceType.GROOMING) return "Pet Grooming";
    if (serviceType === ServiceType.VET_ON_CALL) return "Vet Consultation";
    return "Book Service";
  }, [isClinic, booking.selectedClinic, serviceType]);

  // ─── Render Searching Partner Overlay ──────────────────────────────────────
  if (isCreating && isSearching) {
    return <SearchingPartnerOverlay onFound={handlePartnerFound} />;
  }

  // ─── Render Assigned Partner Screen ────────────────────────────────────────
  if (isCreating && !isSearching && bookingResult) {
    if (bookingResult.partner?.id) {
      const partner = bookingResult.partner;
      return (
        <SafeAreaView style={styles.container}>
          <BookingSuccessOverlay
            booking={{
              pets: booking.selectedPets,
              services: booking.selectedServices,
              address: isClinic ? { label: "Clinic", house: booking.selectedClinic?.name || "Clinic", area: booking.selectedClinic?.address || "", city: city?.name || "Ahmedabad", state: "Gujarat", pincode: "" } : booking.address,
              selectedDate: booking.selectedDate,
              selectedTime: booking.selectedTime,
              bookingId: bookingResult.id,
            }}
            partner={{
              name: partner.name || "Assigned Partner",
              rating: partner.rating ?? 4.8,
              experience: partner.totalCompleted ? Math.max(1, Math.round(partner.totalCompleted / 20)) : 5,
              specialization: isClinic ? "Veterinarian" : "Pet Groomer",
              phone: partner.phone || null,
            }}
            onClose={() => {
              setBookingResult(null);
              setIsCreating(false);
              setIsSuccess(false);
              router.replace("/home" as any);
            }}
            onViewSummary={(bookingId) => {
              setBookingResult(null);
              setIsCreating(false);
              setIsSuccess(false);
              router.replace(`/bookings/${bookingId}` as any);
            }}
          />
        </SafeAreaView>
      );
    } else {
      return (
        <SafeAreaView style={[styles.container, styles.centerAlign]}>
          <Text style={styles.emptyText}>No partner is available for this slot. Please pick a different time.</Text>
          <Pressable onPress={handleNoPartnerReset} style={styles.resetBtn}>
            <Text style={styles.resetBtnText}>Choose another slot</Text>
          </Pressable>
        </SafeAreaView>
      );
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.navbar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.navbarTitle} numberOfLines={1}>
            {headerTitle}
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {/* 1. Pet selector section */}
          {canShowPets && (
            <PetSelector
              pets={allPets}
              selectedPets={booking.selectedPets}
              onSelect={selectedPets => setBooking(prev => ({ ...prev, selectedPets }))}
              onAddPet={handleAddPet}
              themeColor={activeTheme.primary}
              softThemeColor={activeTheme.soft}
            />
          )}

          {/* 2. Care Mode section */}
          {canShowMode && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>CHOOSE CONSULTATION MODE</Text>
              <View style={styles.listGap}>
                <Pressable
                  onPress={() => {
                    setCareMode("vet-on-call");
                    setBooking(prev => ({ ...prev, selectedClinic: null, selectedServices: [] }));
                  }}
                  style={[
                    styles.modeCard,
                    careMode === "vet-on-call" ? { borderColor: "#002984", backgroundColor: "#e0e7ff" } : styles.modeCardInactive,
                  ]}
                >
                  <View style={[styles.modeAvatar, careMode === "vet-on-call" ? { backgroundColor: "#c7d2fe" } : null]}>
                    <Text style={{ fontSize: 18 }}>🏠</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>Vet on Call</Text>
                    <Text style={styles.itemMeta}>A vet visits your home</Text>
                  </View>
                  {careMode === "vet-on-call" && (
                    <View style={[styles.checkmarkIcon, { backgroundColor: "#002984" }]}>
                      <Text style={styles.checkmarkIconText}>✓</Text>
                    </View>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => {
                    setCareMode("at-clinic");
                    setBooking(prev => ({ ...prev, address: null, selectedServices: [] }));
                  }}
                  style={[
                    styles.modeCard,
                    careMode === "at-clinic" ? { borderColor: "#ea580c", backgroundColor: "#fff7ed" } : styles.modeCardInactive,
                  ]}
                >
                  <View style={[styles.modeAvatar, careMode === "at-clinic" ? { backgroundColor: "#ffedd5" } : null]}>
                    <Text style={{ fontSize: 18 }}>🏥</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>At Clinic</Text>
                    <Text style={styles.itemMeta}>Visit a nearby partner clinic</Text>
                  </View>
                  {careMode === "at-clinic" && (
                    <View style={[styles.checkmarkIcon, { backgroundColor: "#ea580c" }]}>
                      <Text style={styles.checkmarkIconText}>✓</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* 3. Service Picker section */}
          {canShowServices && servicesList.length > 0 && (
            <ServicePicker
              services={servicesList}
              selectedServices={booking.selectedServices}
              selectedPets={booking.selectedPets}
              onSelect={selectedServices => setBooking(prev => ({ ...prev, selectedServices }))}
              themeColor={activeTheme.primary}
              softThemeColor={activeTheme.soft}
            />
          )}

          {/* 4. Address picker section */}
          {canShowAddress && (
            <AddressPicker
              addresses={allAddresses}
              selectedAddress={booking.address}
              onSelect={address => setBooking(prev => ({ ...prev, address }))}
              onAddAddress={handleAddAddress}
              themeColor={activeTheme.primary}
              softThemeColor={activeTheme.soft}
            />
          )}

          {/* 4b. Clinic search section */}
          {canShowClinic && (
            <ClinicSearchPicker
              selectedClinic={booking.selectedClinic}
              onSelect={selectedClinic => setBooking(prev => ({ ...prev, selectedClinic, address: null }))}
              clinicsList={clinicsList}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              loadingClinics={loadingClinics}
              themeColor={activeTheme.primary}
              softThemeColor={activeTheme.soft}
            />
          )}

          {/* 5. Schedule selection section */}
          {canShowDateTime && (
            <View>
              <DateTimePicker
                selectedDate={booking.selectedDate}
                selectedTime={booking.selectedTime}
                onSelectDate={selectedDate => setBooking(prev => ({ ...prev, selectedDate, selectedTime: null }))}
                onSelectTime={selectedTime => setBooking(prev => ({ ...prev, selectedTime }))}
                dateOptions={dateOptions}
                availableSlots={availableSlots}
                themeColor={activeTheme.primary}
                softThemeColor={activeTheme.soft}
              />
              {slotsLoading && (
                <View style={{ padding: 12, alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: Colors.light.textSecondary, fontStyle: "italic", fontFamily: Colors.fonts.medium }}>
                    Loading available slots...
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* 6. Order summary & Payment options */}
          {canShowPayment && (
            <PaymentOptions
              selectedPets={booking.selectedPets}
              selectedServices={booking.selectedServices}
              paymentMethod={booking.paymentMethod}
              onSelectPayment={paymentMethod => setBooking(prev => ({ ...prev, paymentMethod }))}
              allowOffline={!isVetOnCall}
              onConfirm={handleConfirmBooking}
              isCreating={isCreating}
              promoCode={promoCode}
              onPromoCodeChange={setPromoCode}
              appliedPromo={appliedPromo}
              onApplyPromo={handleApplyPromo}
              onRemovePromo={handleRemovePromo}
              isApplyingPromo={isApplyingPromo}
              promoError={promoError}
              themeColor={activeTheme.primary}
              softThemeColor={activeTheme.soft}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centerAlign: {
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 80,
    gap: 16,
  },
  navbar: {
    height: 56,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  backButton: {
    paddingVertical: 4,
  },
  backButtonText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Colors.fonts.semiBold,
  },
  navbarTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
    flex: 1,
    fontFamily: Colors.fonts.bold,
  },
  errorBanner: {
    backgroundColor: "rgba(224, 92, 53, 0.1)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorBannerText: {
    color: Colors.light.destructive,
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
    fontFamily: Colors.fonts.bold,
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
    fontFamily: Colors.fonts.bold,
  },
  listGap: {
    gap: 12,
  },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    backgroundColor: "#ffffff",
  },
  modeCardActive: {
    borderColor: Colors.light.primary,
    backgroundColor: "#FBF0FB",
  },
  modeCardInactive: {
    borderColor: Colors.light.border,
  },
  modeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3EEF1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modeAvatarActive: {
    backgroundColor: "#F5D6F5",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
    fontFamily: Colors.fonts.bold,
  },
  itemMeta: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
    lineHeight: 16,
    fontFamily: Colors.fonts.medium,
  },
  checkmarkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  checkmarkIconText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: Colors.fonts.bold,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    fontFamily: Colors.fonts.medium,
  },
  resetBtn: {
    height: 44,
    paddingHorizontal: 20,
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  resetBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Colors.fonts.bold,
  },
});
