export type PetType = "dog" | "cat";

export interface Pet {
  id: string;
  name: string;
  type: PetType;
  breed: string;
  age: number;
  weight: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  tagline?: string;
  icon: string;
  route: string;
  active: boolean;
  price?: number | null;
  tag?: string | null;
  accentColor?: string;
  softColor?: string;
  rating?: string | null;
  reviews?: string | null;
  soon?: boolean;
  emoji?: string;
  includes?: string[];
  variants?: { id: string; name: string; price: number; time: string }[];
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  dogPrice: number;
  catPrice: number;
  icon: string;
  duration: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  avatar: string;
}

export interface Address {
  id: string;
  label: string;
  house: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  rating: number;
  timing: string;
  distance: string;
  city: string;
}

export interface LocationOption {
  name: string;
  active: boolean;
}

export interface BookingState {
  step: number;
  selectedPets: Pet[];
  selectedServices: ServiceItem[];
  selectedDate: Date | null;
  selectedTime: string | null;
  address: Address | null;
  selectedClinic: Clinic | null;
  paymentMethod: "online" | "offline" | null;
}

export interface Booking {
  id: string;
  serviceType: string;
  pets: Pet[];
  services: ServiceItem[];
  address: Address;
  date: string;
  time: string;
  status: "upcoming" | "in-progress" | "completed" | "cancelled";
  total: number;
  partnerName: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  pets: Pet[];
  addresses: Address[];
}

export function calcTotal(selectedPets: Pet[], selectedServices: ServiceItem[]): number {
  return selectedPets.reduce((total, pet) => {
    return total + selectedServices.reduce((sum, service) => {
      const price = pet.type === "dog" ? service.dogPrice : service.catPrice;
      return sum + (Number.isFinite(price) ? price : 0);
    }, 0);
  }, 0);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
