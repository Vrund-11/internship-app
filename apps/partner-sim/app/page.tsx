"use client";

import { useEffect, useState } from "react";

type Booking = {
  id: string;
  serviceType: string;
  slotStart: string;
  slotEnd: string;
  status: string;
};

type Partner = {
  id: string;
  name: string;
  isOnline: boolean;
  isVerified: boolean;
  activeBookings: number;
  todayCompletedBookings: number;
  rating: number;
  totalCompleted: number;
  city: {
    name: string;
    state: string;
  };
  services: Array<{
    id: string;
    serviceType: string;
  }>;
  bookings: Booking[];
};

const formatSlot = (start: string, end: string) => {
  const s = new Date(start).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const e = new Date(end).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${s} - ${e}`;
};

export default function Page() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("http://localhost:5000/partners");
      const data = await res.json();
      setPartners(data as Partner[]);
    } catch {
      setError("Could not load partners.");
    } finally {
      setLoading(false);
    }
  };

  const seed = async () => {
    try {
      setBusy(true);
      setError("");
      await fetch("http://localhost:5000/partners/seed", { method: "POST" });
      await load();
    } catch {
      setError("Could not seed test partners.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-8 text-stone-900">
      <section className="mx-auto max-w-6xl rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Partner Simulator</h1>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
              disabled={loading || busy}
              onClick={load}
              type="button"
            >
              Refresh
            </button>
            <button
              className="rounded-lg bg-stone-900 px-3 py-2 text-sm font-medium text-white disabled:bg-stone-400"
              disabled={busy}
              onClick={seed}
              type="button"
            >
              {busy ? "Seeding..." : "Seed Test Partners"}
            </button>
          </div>
        </div>

        <p className="mt-2 text-sm text-stone-600">
          Check fairness metrics and upcoming assigned bookings for each partner.
        </p>

        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-5 grid gap-3">
          {loading ? (
            <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
              Loading partners...
            </div>
          ) : null}

          {partners.map((partner) => (
            <article
              key={partner.id}
              className="rounded-lg border border-stone-200 bg-stone-50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{partner.name}</div>
                  <div className="text-sm text-stone-600">
                    {partner.city.name}, {partner.city.state}
                  </div>
                  <div className="mt-1 text-xs text-stone-500">{partner.id}</div>
                </div>
                <div className="text-right text-sm">
                  <div>{partner.isOnline ? "Online" : "Offline"}</div>
                  <div className="text-stone-600">
                    {partner.isVerified ? "Verified" : "Unverified"}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div className="rounded-md border border-stone-200 bg-white px-3 py-2">
                  Active: {partner.activeBookings}
                </div>
                <div className="rounded-md border border-stone-200 bg-white px-3 py-2">
                  Completed: {partner.todayCompletedBookings}
                </div>
                <div className="rounded-md border border-stone-200 bg-white px-3 py-2">
                  Rating: {partner.rating}
                </div>
                <div className="rounded-md border border-stone-200 bg-white px-3 py-2">
                  Total Jobs: {partner.totalCompleted}
                </div>
              </div>

              <div className="mt-3 text-sm text-stone-700">
                Services:{" "}
                {partner.services.map((service) => service.serviceType).join(", ")}
              </div>

              <div className="mt-3 rounded-md border border-stone-200 bg-white p-3">
                <div className="text-sm font-medium">Upcoming Bookings</div>
                {partner.bookings.length === 0 ? (
                  <div className="mt-1 text-sm text-stone-500">None</div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {partner.bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="rounded-md border border-stone-100 bg-stone-50 px-3 py-2 text-sm"
                      >
                        <div className="font-medium">{booking.serviceType}</div>
                        <div className="text-stone-600">
                          {formatSlot(booking.slotStart, booking.slotEnd)}
                        </div>
                        <div className="text-xs text-stone-500">
                          {booking.id} • {booking.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}

          {!loading && partners.length === 0 ? (
            <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
              No partners available.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
