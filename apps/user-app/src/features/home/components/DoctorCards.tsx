import { doctors } from "@/features/home/data/doctors";
import { Star } from "lucide-react";

const DoctorCards = () => {
  return (
    <section className="px-4 py-6">
      <h2 className="text-lg font-serif text-foreground mb-4 lg:text-xl">Meet Our Experts</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {doctors.map((doctor, i) => (
          <div
            key={doctor.id}
            className="flex-shrink-0 w-40 lg:w-auto bg-card rounded-3xl border border-border p-4 shadow-card animate-fade-in-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="text-4xl mb-3 text-center">{doctor.avatar}</div>
            <h3 className="text-sm font-semibold text-foreground text-center truncate">
              {doctor.name}
            </h3>
            <p className="text-[10px] text-muted-foreground text-center mt-0.5 lg:text-xs">
              {doctor.specialization}
            </p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <Star className="w-3 h-3 fill-primary text-primary" />
              <span className="text-xs font-medium text-foreground">{doctor.rating}</span>
              <span className="text-[10px] text-muted-foreground">• {doctor.experience}y</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DoctorCards;
