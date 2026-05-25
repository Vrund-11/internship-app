"use client";

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
    if (!newPet.name || !newPet.breed) return;
    const pet: Pet = {
      id: generateId(),
      name: newPet.name,
      type: newPet.type,
      breed: newPet.breed,
      age: Number(newPet.age) || 1,
      weight: Number(newPet.weight) || 5,
    };
    onAddPet(pet);
    onSelect([pet]);
    setNewPet({ name: "", type: "dog", breed: "", age: "", weight: "" });
    setShowAddForm(false);
  };

  const breeds = newPet.type === "dog" ? dogBreeds : catBreeds;

  return (
    <div className="px-4 py-5 animate-fade-in-up">
      <div className="text-[12px] text-[#3E6255] font-bold uppercase tracking-[0.8px] mb-3">Pet Profile</div>

      <div className="space-y-3.5 mb-4">
        {pets.map((pet) => {
          const isSelected = selectedPets.some((p) => p.id === pet.id);
          return (
            <button
              key={pet.id}
              onClick={() => togglePet(pet)}
              className="w-full flex items-center gap-3.5 p-4 rounded-[18px] transition-all bg-white text-left"
              style={{
                border: `${isSelected ? 2 : 1}px solid ${isSelected ? "#27AE78" : "#DDE8E3"}`,
                background: isSelected ? "rgba(39,174,120,0.08)" : "#FFFFFF",
              }}
            >
              <div className="w-[52px] h-[52px] rounded-[16px] bg-[#E3F6EE] flex items-center justify-center text-[26px] shrink-0">
                {pet.type === "dog" ? "🐕" : "🐈"}
              </div>
              <div className="flex-1">
                <div className="font-serif text-[16px] font-normal text-[#081C13]">{pet.name}</div>
                <div className="text-[12px] text-[#3E6255] mt-0.5">
                  {pet.breed} · {pet.age} yrs · {pet.weight} kg
                </div>
              </div>
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ border: `2px solid ${isSelected ? "#27AE78" : "#B8CEC5"}` }}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-[#27AE78]" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-[18px] border border-dashed border-[#B8CEC5] text-[#1D8F60] hover:bg-[#E3F6EE]/50 transition-colors bg-transparent"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[13px] font-bold">Add a Pet</span>
        </button>
      ) : (
        <div className="bg-white rounded-[18px] border border-[#DDE8E3] p-4 space-y-3.5 animate-scale-in">
          <div className="flex gap-2.5">
            <button
              onClick={() => setNewPet((prev) => ({ ...prev, type: "dog", breed: "" }))}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-colors"
              style={{
                background: newPet.type === "dog" ? "#E3F6EE" : "#F0F5F2",
                color: newPet.type === "dog" ? "#1D8F60" : "#6E8F83",
              }}
            >
              🐕 Dog
            </button>
            <button
              onClick={() => setNewPet((prev) => ({ ...prev, type: "cat", breed: "" }))}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-colors"
              style={{
                background: newPet.type === "cat" ? "#FEF1E4" : "#F0F5F2",
                color: newPet.type === "cat" ? "#C8731A" : "#6E8F83",
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
          <div className="flex gap-2.5 pt-1">
            <Button
              variant="outline"
              onClick={() => setShowAddForm(false)}
              className="flex-1 rounded-xl h-[44px] text-[13px] border-[#DDE8E3] text-[#3E6255]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPet}
              className="flex-1 rounded-xl h-[44px] text-[13px] bg-[#0B3B2A] text-white"
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
            <Button variant="outline" onClick={onBack} className="flex-1 rounded-2xl h-12 border-[#DDE8E3]">
              Back
            </Button>
          )}
          {showContinueButton && (
            <Button
              onClick={onNext}
              disabled={selectedPets.length === 0}
              className="flex-1 rounded-2xl h-[48px] bg-[#0B3B2A] hover:bg-[#155E41] text-white text-[14px] font-bold shadow-elevated"
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
