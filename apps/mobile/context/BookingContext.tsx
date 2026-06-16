import { createContext, useContext, useState } from "react";
import type { BookingState, BookingAssignment } from "@canovet/core";
import { INITIAL_BOOKING_STATE } from "@canovet/core";
import { ServiceType } from "@canovet/shared";

type BookingContextType = {
  booking: BookingState;
  setService: (service: ServiceType) => void;
  setPet: (id: string) => void;
  setAddress: (id: string) => void;
  setClinic: (id: string) => void;
  setSlot: (slot: { slotStart: string; slotEnd: string } | null) => void;
  setBookingId: (id: string | null) => void;
  setAssignment: (input: BookingAssignment) => void;
  reset: () => void;
};

const BookingContext = createContext<BookingContextType | null>(null);

export const BookingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [booking, setBooking] = useState<BookingState>(INITIAL_BOOKING_STATE);

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
  }: BookingAssignment) =>
    setBooking((prev) => ({
      ...prev,
      bookingId,
      slotStart,
      slotEnd,
      status,
      partnerId,
      partnerName,
    }));

  const reset = () => setBooking(INITIAL_BOOKING_STATE);

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
    throw new Error("useBooking must be used inside BookingProvider");
  }
  return ctx;
};
