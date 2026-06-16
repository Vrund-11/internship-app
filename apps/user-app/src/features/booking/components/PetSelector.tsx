"use client";

import { validateName } from "@canovet/shared";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import { Plus, Check } from "lucide-react";
import type { Pet, PetType } from "@/shared/types";
import { generateId } from "@/shared/types";
import { dogBreeds, catBreeds } from "@/features/booking/data/mock-data";

interface PetSelectorProps {
  pets: Pet[];
  selectedPets: Pet[];
  onSelect: (pets: Pet[]) => void;
  onAddPet: (pet: Pet) => void;
  onNext: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  showContinueButton?: boolean;
  continueLabel?: string;
}

const PetSelector = ({
  pets,
  selectedPets,
  onSelect,
  onAddPet,
  onNext,
  onBack,
  showBackButton = true,
  showContinueButton = true,
  continueLabel = "Continue",
}: PetSelectorProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPet, setNewPet] = useState({
    name: "",
    type: "dog" as PetType,
    breed: "",
    age: "",
    weight: "",
  });

  const togglePet = (pet: Pet) => {
    const isSelected = selectedPets.some((p) => p.id === pet.id);
    if (isSelected) {
      onSelect(selectedPets.filter((p) => p.id !== pet.id));
    } else {
      onSelect([pet]);
    }
  };

  const handleAddPet = () => {
    setError(null);
    const nameError = validateName(newPet.name);
    if (nameError) {
      setError(nameError);
      return;
    }
    if (!newPet.breed) {
      setError("Please select a breed");
      return;
    }
    const ageNum = Number(newPet.age);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 30) {
      setError("Please enter a valid age (1-30)");
      return;
    }
    const weightNum = Number(newPet.weight);
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 150) {
      setError("Please enter a valid weight (1-150)");
      return;
    }

    const pet: Pet = {
      id: generateId(),
      name: newPet.name,
      type: newPet.type,
      breed: newPet.breed,
      age: ageNum,
      weight: weightNum,
    };
    onAddPet(pet);
    onSelect([pet]);
    setNewPet({ name: "", type: "dog", breed: "", age: "", weight: "" });
    setShowAddForm(false);
  };

  const breeds = newPet.type === "dog" ? dogBreeds : catBreeds;

  return (
    <div className="px-4 py-5 animate-fade-in-up lg:px-0">
      <div className="text-[12px] text-[#5C3A58] font-bold uppercase tracking-[0.8px] mb-3">Pet Profile</div>

      <div className="space-y-3.5 mb-4">
        {pets.map((pet) => {
          const isSelected = selectedPets.some((p) => p.id === pet.id);
          return (
            <button
              key={pet.id}
              onClick={() => togglePet(pet)}
              className="w-full flex items-center gap-3.5 p-4 rounded-[18px] transition-all bg-white text-left"
              style={{
                border: `${isSelected ? 2 : 1.5}px solid ${isSelected ? "#A7009D" : "#EDE4EB"}`,
                background: isSelected ? "#FBF0FB" : "#FFFFFF",
              }}
            >
              <div className="w-[52px] h-[52px] rounded-[16px] bg-[#F5D6F5] flex items-center justify-center text-[26px] shrink-0">
                {pet.type === "dog" ? "🐕" : "🐈"}
              </div>
              <div className="flex-1">
                <div className="text-[16px] font-bold text-[#1a0a18]">{pet.name}</div>
                <div className="text-[12px] text-[#5C3A58] mt-0.5">
                  {pet.breed} · {pet.age} yrs · {pet.weight} kg
                </div>
              </div>
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ border: `2px solid ${isSelected ? "#A7009D" : "#D4B8D0"}` }}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-[#A7009D]" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-[18px] border border-dashed border-[#D4B8D0] text-[#A7009D] hover:bg-[#FBF0FB]/50 transition-colors bg-transparent"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[13px] font-bold">Add a Pet</span>
        </button>
      ) : (
        <div className="bg-white rounded-[18px] border border-[#EDE4EB] p-4 space-y-3.5 animate-scale-in">
          <div className="flex gap-2.5">
            <button
              onClick={() => setNewPet((prev) => ({ ...prev, type: "dog", breed: "" }))}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-colors"
              style={{
                background: newPet.type === "dog" ? "#F5D6F5" : "#F3EEF1",
                color: newPet.type === "dog" ? "#A7009D" : "#8A6888",
              }}
            >
              🐕 Dog
            </button>
            <button
              onClick={() => setNewPet((prev) => ({ ...prev, type: "cat", breed: "" }))}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-colors"
              style={{
                background: newPet.type === "cat" ? "#FEF3C7" : "#F3EEF1",
                color: newPet.type === "cat" ? "#b45309" : "#8A6888",
              }}
            >
              🐈 Cat
            </button>
          </div>
          <Input
            placeholder="Pet name"
            value={newPet.name}
            onChange={(event) => setNewPet((prev) => ({ ...prev, name: event.target.value }))}
            className="rounded-xl h-[44px] text-[14px]"
          />
          <select
            value={newPet.breed}
            onChange={(event) => setNewPet((prev) => ({ ...prev, breed: event.target.value }))}
            className="w-full h-[44px] rounded-xl border border-input bg-background px-3 text-[14px] outline-none"
          >
            <option value="">Select breed</option>
            {breeds.map((breed) => (
              <option key={breed} value={breed}>
                {breed}
              </option>
            ))}
          </select>
          <div className="flex gap-2.5">
            <Input
              placeholder="Age (yrs)"
              type="number"
              value={newPet.age}
              onChange={(event) => setNewPet((prev) => ({ ...prev, age: event.target.value }))}
              className="rounded-xl h-[44px] text-[14px]"
            />
            <Input
              placeholder="Weight (kg)"
              type="number"
              value={newPet.weight}
              onChange={(event) => setNewPet((prev) => ({ ...prev, weight: event.target.value }))}
              className="rounded-xl h-[44px] text-[14px]"
            />
          </div>
          {error && <div className="text-[12px] text-red-500 font-semibold px-1">⚠️ {error}</div>}
          <div className="flex gap-2.5 pt-1">
            <Button
              variant="outline"
              onClick={() => setShowAddForm(false)}
              className="flex-1 rounded-xl h-[44px] text-[13px] border-[#EDE4EB] text-[#5C3A58]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPet}
              className="flex-1 rounded-xl h-[44px] text-[13px] bg-[#A7009D] text-white"
              disabled={!newPet.name || !newPet.breed}
            >
              Save Pet
            </Button>
          </div>
        </div>
      )}

      {(showBackButton || showContinueButton) && (
        <div className="flex gap-3 mt-6">
          {showBackButton && onBack && (
            <Button variant="outline" onClick={onBack} className="flex-1 rounded-2xl h-12 border-[#EDE4EB]">
              Back
            </Button>
          )}
          {showContinueButton && (
            <Button
              onClick={onNext}
              disabled={selectedPets.length === 0}
              className="flex-1 rounded-2xl h-[48px] bg-[#A7009D] hover:bg-[#6B0068] text-white text-[14px] font-bold shadow-elevated"
            >
              {continueLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default PetSelector;
