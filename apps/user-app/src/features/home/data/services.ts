import { ServiceType } from "@canovet/shared";
import type { ServiceCategory, ServiceItem } from "@/shared/types";

const SERVICE_SLUGS: Record<ServiceType, string> = {
  [ServiceType.GROOMING]: "grooming",
  [ServiceType.VET_ON_CALL]: "vet-consultation",
  [ServiceType.VET_CLINIC]: "at-clinic",
};

const SERVICE_TYPE_BY_PARAM: Record<string, ServiceType> = {
  grooming: ServiceType.GROOMING,
  "vet-consultation": ServiceType.VET_ON_CALL,
  "vet-on-call": ServiceType.VET_ON_CALL,
  "vet_on_call": ServiceType.VET_ON_CALL,
  "at-clinic": ServiceType.VET_CLINIC,
  "vet_clinic": ServiceType.VET_CLINIC,
  [ServiceType.GROOMING]: ServiceType.GROOMING,
  [ServiceType.VET_ON_CALL]: ServiceType.VET_ON_CALL,
  [ServiceType.VET_CLINIC]: ServiceType.VET_CLINIC,
};

export function resolveServiceType(type: string): ServiceType | null {
  if (!type) return null;
  return (
    SERVICE_TYPE_BY_PARAM[type] ||
    SERVICE_TYPE_BY_PARAM[type.toLowerCase()] ||
    SERVICE_TYPE_BY_PARAM[type.toUpperCase()] ||
    null
  );
}

export function getServiceSlug(type: string): string {
  const resolved = resolveServiceType(type);
  return resolved ? SERVICE_SLUGS[resolved] : type;
}

export const serviceCategories: ServiceCategory[] = [
  {
    id: ServiceType.GROOMING,
    name: "Pet Grooming",
    description: "Bath, haircut, nail trim & more at your doorstep",
    tagline: "Spa-level pampering at your doorstep",
    icon: "scissors",
    route: `/service/${getServiceSlug(ServiceType.GROOMING)}/detail`,
    active: true,
    price: 499,
    tag: null,
    emoji: "✂",
    accentColor: "#27AE78",
    softColor: "#E3F6EE",
    rating: "4.9",
    reviews: "3.2k",
    includes: [
      "Full bath with premium shampoo & conditioner",
      "Blow-dry and breed-specific styling",
      "Nail trimming, filing & paw balm",
      "Ear cleaning & cotton swab treatment",
      "Teeth brushing with pet-safe paste",
      "Bandana or bow finishing touch",
      "Post-session health report card",
    ],
    variants: [
      { id: "bath", name: "Bath & Brush", price: 499, time: "45 min" },
      { id: "full", name: "Full Groom", price: 899, time: "90 min" },
      { id: "spa", name: "Spa Package", price: 1299, time: "2 hrs" },
      { id: "nail", name: "Nail Trim", price: 199, time: "20 min" },
    ],
  },
  {
    id: ServiceType.VET_ON_CALL,
    name: "Vet Consultation",
    description: "Expert vet visits your home for checkups",
    tagline: "Certified vets, any time, any mode",
    icon: "stethoscope",
    route: `/service/${getServiceSlug(ServiceType.VET_ON_CALL)}/detail`,
    active: true,
    price: 199,
    tag: "Most Popular",
    emoji: "♥",
    accentColor: "#2E7BD4",
    softColor: "#E8F3FF",
    rating: "4.8",
    reviews: "5.1k",
    includes: [
      "Consult via chat, video call or in-clinic",
      "Certified & experienced veterinarians",
      "Digital prescription & lab referrals",
      "Vaccination schedule tracking",
      "Diet & nutrition guidance",
      "Follow-up message within 24 hrs",
    ],
    variants: [
      { id: "vet-on-call", name: "Vet on Call", price: 499, time: "Home Visit" },
    ],
  },
  {
    id: ServiceType.VET_CLINIC,
    name: "At Clinic",
    description: "Visit our partner clinics near you",
    tagline: "Walk-in consultations at partner clinics",
    icon: "hospital",
    route: `/service/${getServiceSlug(ServiceType.VET_CLINIC)}/detail`,
    active: false,
    price: 399,
    tag: null,
    emoji: "🏥",
    accentColor: "#F5922A",
    softColor: "#FEF1E4",
    rating: "4.7",
    reviews: "1.8k",
    includes: [
      "In-person consultation at verified clinics",
      "X-Ray & diagnostic imaging",
      "Blood test & lab panels",
      "Vaccination & boosters",
      "Minor surgical procedures",
      "Post-visit digital prescription",
    ],
    variants: [
      { id: "checkup", name: "General Checkup", price: 399, time: "30 min" },
      { id: "vaccination", name: "Vaccination", price: 599, time: "20 min" },
      { id: "blood-test", name: "Blood Test", price: 799, time: "20 min" },
      { id: "followup", name: "Follow-up Visit", price: 299, time: "15 min" },
    ],
  },
  {
    id: "pet-food",
    name: "Pet Food & Treats",
    description: "Vet-approved nutrition delivered fast",
    tagline: "Vet-approved nutrition delivered fast",
    icon: "beef",
    route: "/service/pet-food/detail",
    active: true,
    price: 299,
    tag: "New",
    emoji: "◈",
    accentColor: "#F5922A",
    softColor: "#FEF1E4",
    rating: "4.7",
    reviews: "1.8k",
    includes: [
      "Royal Canin, Pedigree, Hills Science Diet",
      "Purina Pro Plan, Drools, Whiskas",
      "Vet-formulated prescription diets",
      "Natural & organic treat range",
      "Puppy, adult & senior formulas",
      "Free delivery on orders above ₹999",
      "Subscribe & save up to 20%",
    ],
    variants: [],
  },
  {
    id: "pet-pharma",
    name: "Canovet Pharma",
    description: "Medicines, vaccines & supplements",
    tagline: "Medicines, vaccines & supplements",
    icon: "pill",
    route: "/service/pet-pharma/detail",
    active: false,
    soon: true,
    price: null,
    tag: "Soon",
    emoji: "⊕",
    accentColor: "#7B5CC4",
    softColor: "#F2F0F8",
    rating: null,
    reviews: null,
    includes: [
      "Prescription medicines & OTC products",
      "Vaccines, dewormers & tick prevention",
      "Joint care, vitamins & supplements",
      "Upload prescription for home delivery",
      "Vet-verified product catalogue",
      "Temperature-controlled cold chain",
      "Pharmacist helpline support",
    ],
    variants: [],
  },
  {
    id: "pet-insurance",
    name: "Pet Insurance",
    description: "Comprehensive coverage, zero worry",
    tagline: "Comprehensive coverage, zero worry",
    icon: "shield",
    route: "/service/pet-insurance/detail",
    active: false,
    soon: true,
    price: null,
    tag: "Soon",
    emoji: "◉",
    accentColor: "#E05C35",
    softColor: "#FFF4F0",
    rating: null,
    reviews: null,
    includes: [
      "Accident & emergency cover",
      "Illness & hospitalisation cover",
      "Routine wellness & vaccination",
      "Surgery & specialist consultations",
      "Third-party liability protection",
      "Cashless claims at 5000+ clinics",
      "No breed or age exclusions",
    ],
    variants: [],
  },
];

export const groomingServices: ServiceItem[] = [
  {
    id: "bath",
    name: "Full Bath & Blow Dry",
    description: "Deep cleansing bath with premium shampoo",
    dogPrice: 699,
    catPrice: 899,
    icon: "bath",
    duration: "45 min",
  },
  {
    id: "haircut",
    name: "Haircut & Styling",
    description: "Breed-specific haircut & styling",
    dogPrice: 999,
    catPrice: 1199,
    icon: "scissors",
    duration: "60 min",
  },
  {
    id: "nails",
    name: "Nail Trimming",
    description: "Safe nail clipping & filing",
    dogPrice: 299,
    catPrice: 349,
    icon: "hand",
    duration: "15 min",
  },
  {
    id: "ear",
    name: "Ear Cleaning",
    description: "Gentle ear cleaning & inspection",
    dogPrice: 249,
    catPrice: 299,
    icon: "ear",
    duration: "15 min",
  },
  {
    id: "teeth",
    name: "Teeth Brushing",
    description: "Dental hygiene with pet-safe toothpaste",
    dogPrice: 349,
    catPrice: 399,
    icon: "smile",
    duration: "20 min",
  },
  {
    id: "spa",
    name: "Full Spa Package",
    description: "Bath + haircut + nails + ear + teeth",
    dogPrice: 1999,
    catPrice: 2499,
    icon: "sparkles",
    duration: "2 hrs",
  },
];

export const vetOnCallServices: ServiceItem[] = [
  {
    id: "checkup",
    name: "General Checkup",
    description: "Complete physical examination",
    dogPrice: 599,
    catPrice: 499,
    icon: "stethoscope",
    duration: "30 min",
  },
  {
    id: "vaccination",
    name: "Vaccination",
    description: "Core & non-core vaccines",
    dogPrice: 799,
    catPrice: 699,
    icon: "syringe",
    duration: "20 min",
  },
  {
    id: "deworming",
    name: "Deworming",
    description: "Internal parasite treatment",
    dogPrice: 399,
    catPrice: 349,
    icon: "pill",
    duration: "15 min",
  },
  {
    id: "skin",
    name: "Skin Treatment",
    description: "Dermatology consultation & treatment",
    dogPrice: 899,
    catPrice: 799,
    icon: "shield-plus",
    duration: "30 min",
  },
];

export const atClinicServices: ServiceItem[] = [
  {
    id: "clinic-checkup",
    name: "Clinic Consultation",
    description: "In-clinic vet consultation",
    dogPrice: 400,
    catPrice: 300,
    icon: "hospital",
    duration: "30 min",
  },
  {
    id: "xray",
    name: "X-Ray",
    description: "Digital X-ray imaging",
    dogPrice: 1500,
    catPrice: 1200,
    icon: "scan",
    duration: "30 min",
  },
  {
    id: "blood-test",
    name: "Blood Test",
    description: "Complete blood panel",
    dogPrice: 1200,
    catPrice: 1000,
    icon: "droplets",
    duration: "20 min",
  },
  {
    id: "surgery",
    name: "Minor Surgery",
    description: "Minor surgical procedures",
    dogPrice: 3500,
    catPrice: 3000,
    icon: "activity",
    duration: "1-2 hrs",
  },
];

export function getServicesForType(type: string): ServiceItem[] {
  const resolved = resolveServiceType(type);
  switch (resolved) {
    case ServiceType.GROOMING:
      return groomingServices;
    case ServiceType.VET_ON_CALL:
      return vetOnCallServices;
    case ServiceType.VET_CLINIC:
      return atClinicServices;
    default:
      return groomingServices;
  }
}

export function getServiceCategoryName(type: string): string {
  const resolved = resolveServiceType(type);
  const cat = serviceCategories.find(
    (category) => category.id === (resolved ?? type)
  );
  return cat?.name ?? "Service";
}

export function getServiceCategory(type: string): ServiceCategory | undefined {
  const resolved = resolveServiceType(type);
  return serviceCategories.find(
    (category) => category.id === (resolved ?? type)
  );
}
