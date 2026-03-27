"use client";

import { useRouter } from "next/navigation";
import { ServiceType } from "@canovet/shared";
import { useCity } from "@/context/CityContext";
import { useAuth } from "@/context/AuthContext";
import { useBooking } from "@/context/BookingContext";
import { SERVICES } from "@/constants/services";

export default function HomePage() {
  const { city } = useCity();
  const { logout } = useAuth();
  const { reset, setService } = useBooking();
  const router = useRouter();

  const handleClick = (serviceId: ServiceType) => {
    reset();
    setService(serviceId);
    router.push("/booking/pet");
  };

  return (
    <div className="p-6">
      <h1>Canovet</h1>
      <p>{city?.name}</p>

      {SERVICES.map((service) => (
        <div key={service.id} onClick={() => handleClick(service.id)}>
          <h2>{service.title}</h2>
          <p>{service.description}</p>
        </div>
      ))}

      <button onClick={logout}>Logout</button>
    </div>
  );
}
