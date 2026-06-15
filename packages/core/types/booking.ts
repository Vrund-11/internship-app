import { ServiceType } from "@canovet/shared";

export type BookingState = {
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

export const INITIAL_BOOKING_STATE: BookingState = {
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
};

export type BookingAssignment = {
  bookingId: string;
  slotStart: string;
  slotEnd: string;
  status: string;
  partnerId: string | null;
  partnerName: string | null;
};
