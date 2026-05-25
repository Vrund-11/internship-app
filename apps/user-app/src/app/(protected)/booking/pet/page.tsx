"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useBooking } from "@/context/BookingContext";
import PetSelector from "@/features/booking/components/PetSelector";
import StepProgress from "@/features/booking/components/StepProgress";
import type { Pet, PetType } from "@/shared/types";

type ApiPet = {
  id: string;
  name: string;
  type?: PetType;
  breed?: string;
  age?: number;
  weight?: number;
};
const toDisplayPet = (pet: ApiPet): Pet => ({
  id: pet.id,
  name: pet.name,
  type: pet.type ?? "dog",
  breed: pet.breed ?? "Mixed",
  age: pet.age ?? 2,
  weight: pet.weight ?? 8,
});

export default function PetPage() {
  const { setPet } = useBooking();
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPets, setSelectedPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/booking/pets")
      .then((res) => {
        const apiPets = (res.data.pets ?? []) as ApiPet[];
        setPets(apiPets.map((pet) => toDisplayPet(pet)));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddPet = async (pet: Pet) => {
    try {
      const res = await api.post("/booking/pets", {
        name: pet.name,
        type: pet.type,
        breed: pet.breed,
        age: pet.age,
        weight: pet.weight,
      });
      const created = toDisplayPet(res.data as ApiPet);
      setPets((prev) => [...prev, created]);
      setSelectedPets([created]);
    } catch {
      setPets((prev) => [...prev, pet]);
      setSelectedPets([pet]);
    }
  };

  const handleNext = () => {
    if (!selectedPets[0]) return;
    setPet(selectedPets[0].id);
    router.push("/booking/address");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border pt-safe">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 h-14">
          <button onClick={() => router.back()} className="text-sm font-medium text-muted-foreground">
            Back
          </button>
          <h1 className="text-base font-semibold text-foreground">Select Your Pet</h1>
        </div>
        <StepProgress currentStep={1} totalSteps={3} labels={["Pets", "Address", "Schedule"]} />
      </div>

      <div className="max-w-lg mx-auto pb-10">
        {loading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">Loading pets...</div>
        ) : null}
        <PetSelector
          pets={pets}
          selectedPets={selectedPets}
          onSelect={setSelectedPets}
          onAddPet={handleAddPet}
          onNext={handleNext}
          showBackButton={false}
          continueLabel="Continue to address"
        />
      </div>
    </div>
  );
}
