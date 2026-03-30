"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  autoConnect: false,
});

type Booking = {
  id: string;
};

export default function Page() {
  const [connected, setConnected] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const onConnect = () => {
      console.log("Connected:", socket.id);
      setConnected(true);
    };

    const onDisconnect = () => {
      setConnected(false);
      setBooking(null);
    };

    const onBookingRequest = (data: Booking) => {
      console.log("BOOKING RECEIVED", data);
      setBooking(data);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("booking_request", onBookingRequest);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("booking_request", onBookingRequest);
    };
  }, []);

  const connect = () => {
    socket.connect();
  };

  const goOnline = () => {
    socket.emit("partner_online", {
      partnerId: socket.id,
    });
  };

  const accept = () => {
    if (!booking) {
      return;
    }

    socket.emit("booking_accept", {
      bookingId: booking.id,
    });
  };

  return (
    <div className="p-6">
      <h1>Partner Sim</h1>

      {!connected && <button onClick={connect}>Connect</button>}

      {connected && (
        <>
          <button onClick={goOnline}>Go Online</button>

          {booking && (
            <div>
              <h2>Booking</h2>
              <pre>{JSON.stringify(booking, null, 2)}</pre>
              <button onClick={accept}>Accept</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
