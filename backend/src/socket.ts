import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { BookingStatus } from "@canovet/shared";
import { activeMatches } from "./services/matching.service";
import { prisma } from "./utils/prisma";

const onlinePartners = new Map<string, string>();

let io: Server | null = null;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("partner_online", ({ partnerId }: { partnerId?: string }) => {
      onlinePartners.set(socket.id, socket.id);
      console.log("PARTNER_ONLINE:", partnerId || socket.id);
    });

    socket.on("booking_accept", async ({ bookingId }) => {
      const updated = await prisma.booking.updateMany({
        where: {
          id: bookingId,
          status: BookingStatus.SEARCHING_PARTNER,
        },
        data: {
          status: BookingStatus.CONFIRMED,
        },
      });

      if (updated.count === 0) {
        console.log("ALREADY_TAKEN");
        return;
      }

      console.log("BOOKING_CONFIRMED");

      const match = activeMatches.get(bookingId);

      if (match) {
        if (match.timeoutId) {
          clearTimeout(match.timeoutId);
        }

        activeMatches.delete(bookingId);
      }
    });

    socket.on("booking_reject", ({ bookingId }) => {
      console.log("REJECTED:", bookingId);
    });

    socket.on("disconnect", () => {
      if (onlinePartners.has(socket.id)) {
        onlinePartners.delete(socket.id);
        console.log("PARTNER_OFFLINE:", socket.id);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO server not initialized");
  }

  return io;
};

export const getOnlinePartners = () => onlinePartners;
