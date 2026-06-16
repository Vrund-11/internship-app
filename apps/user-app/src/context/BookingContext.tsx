"use client";

import { createContext, useContext, useState } from "react";
import { ServiceType } from "@canovet/shared";

type BookingState = {
  service: ServiceType | null;
  petId: string | null;
  addressId: string | null;
  clinicId: string | null;
  slotStart: string | null;
  slotEnd: string | null;
  bookingId: string | null;
  status: string | null;
  partnerId: string | null;
  partnerName: string | null;
};

type BookingContextType = {
  booking: BookingState;
  setService: (service: ServiceType) => void;
  setPet: (id: string) => void;
  setAddress: (id: string) => void;
  setClinic: (id: string) => void;
  setSlot: (slot: { slotStart: string; slotEnd: string } | null) => void;
  setBookingId: (id: string | null) => void;
  setAssignment: (input: {
    bookingId: string;
    slotStart: string;
    slotEnd: string;
    status: string;
    partnerId: string | null;
    partnerName: string | null;
  }) => void;
  reset: () => void;
};

const BookingContext = createContext<BookingContextType | null>(null);

export const BookingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [booking, setBooking] = useState<BookingState>({
    service: null,
    petId: null,
    addressId: null,
    clinicId: null,
    slotStart: null,
    slotEnd: null,
    bookingId: null,
    status: null,
    partnerId: null,
    partnerName: null,
  });

  const setService = (service: ServiceType) =>
    setBooking((prev) => ({ ...prev, service }));

  const setPet = (petId: string) =>
    setBooking((prev) => ({ ...prev, petId }));

  const setAddress = (addressId: string) =>
    setBooking((prev) => ({ ...prev, addressId }));

  const setClinic = (clinicId: string) =>
    setBooking((prev) => ({ ...prev, clinicId, addressId: null }));

  const setSlot = (slot: { slotStart: string; slotEnd: string } | null) =>
    setBooking((prev) => ({
      ...prev,
      slotStart: slot?.slotStart ?? null,
      slotEnd: slot?.slotEnd ?? null,
    }));

  const setBookingId = (bookingId: string | null) =>
    setBooking((prev) => ({ ...prev, bookingId }));

  const setAssignment = ({
    bookingId,
    slotStart,
    slotEnd,
    status,
    partnerId,
    partnerName,
  }: {
    bookingId: string;
    slotStart: string;
    slotEnd: string;
    status: string;
    partnerId: string | null;
    partnerName: string | null;
  }) =>
    setBooking((prev) => ({
      ...prev,
      bookingId,
      slotStart,
      slotEnd,
      status,
      partnerId,
      partnerName,
    }));

  const reset = () =>
    setBooking({
      service: null,
      petId: null,
      addressId: null,
      clinicId: null,
      slotStart: null,
      slotEnd: null,
      bookingId: null,
      status: null,
      partnerId: null,
      partnerName: null,
    });

  return (
    <BookingContext.Provider
      value={{
        booking,
        setService,
        setPet,
        setAddress,
        setClinic,
        setSlot,
        setBookingId,
        setAssignment,
        reset,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const ctx = useContext(BookingContext);

  if (!ctx) {
    throw new Error("useBooking must be used inside provider");
  }

  return ctx;
};
