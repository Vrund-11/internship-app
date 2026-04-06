"use client";

import { createContext, useContext, useState } from "react";
import { ServiceType } from "@canovet/shared";

type BookingState = {
  service: ServiceType | null;
  petId: string | null;
  addressId: string | null;
  bookingId: string | null;
};

type BookingContextType = {
  booking: BookingState;
  setService: (service: ServiceType) => void;
  setPet: (id: string) => void;
  setAddress: (id: string) => void;
  setBookingId: (id: string | null) => void;
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
    bookingId: null,
  });

  const setService = (service: ServiceType) =>
    setBooking((prev) => ({ ...prev, service }));

  const setPet = (petId: string) =>
    setBooking((prev) => ({ ...prev, petId }));

  const setAddress = (addressId: string) =>
    setBooking((prev) => ({ ...prev, addressId }));

  const setBookingId = (bookingId: string | null) =>
    setBooking((prev) => ({ ...prev, bookingId }));

  const reset = () =>
    setBooking({ service: null, petId: null, addressId: null, bookingId: null });

  return (
    <BookingContext.Provider
      value={{ booking, setService, setPet, setAddress, setBookingId, reset }}
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
