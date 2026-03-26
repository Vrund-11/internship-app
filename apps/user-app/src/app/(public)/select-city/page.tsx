"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useCity } from "@/context/CityContext";

type City = {
  id: string;
  name: string;
  state: string;
};

export default function SelectCityPage() {
  const [cities, setCities] = useState<City[]>([]);
  const { setCity } = useCity();
  const router = useRouter();

  useEffect(() => {
    api.get("/cities").then((res) => setCities(res.data as City[]));
  }, []);

  const handleSelect = (city: City) => {
    setCity(city);
    router.push("/");
  };

  return (
    <div className="p-10">
      <h1>Select City</h1>

      {cities.map((city) => (
        <button key={city.id} onClick={() => handleSelect(city)}>
          {city.name}
        </button>
      ))}
    </div>
  );
}
