import type { LocationOption } from "@/shared/types";

export const states: LocationOption[] = [
  { name: "Gujarat", active: true },
  { name: "Maharashtra", active: true },
  { name: "Rajasthan", active: false },
  { name: "Karnataka", active: false },
  { name: "Delhi", active: false },
];

export const cities: Record<string, LocationOption[]> = {
  Gujarat: [
    { name: "Ahmedabad", active: true },
    { name: "Surat", active: false },
    { name: "Vadodara", active: false },
    { name: "Rajkot", active: false },
  ],
  Maharashtra: [
    { name: "Mumbai", active: true },
    { name: "Pune", active: false },
  ],
  Rajasthan: [
    { name: "Jaipur", active: false },
    { name: "Udaipur", active: false },
  ],
  Karnataka: [
    { name: "Bangalore", active: false },
    { name: "Mysore", active: false },
  ],
  Delhi: [{ name: "New Delhi", active: false }],
};
