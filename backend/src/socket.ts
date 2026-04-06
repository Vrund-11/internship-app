import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { BookingStatus } from "@canovet/shared";
import { activeMatches } from "./services/matching.service";
import { prisma } from "./utils/prisma";

const partnerSocketMap = new Map<string, string>();
const socketPartners = new Map<string, string>();

let io: Server | null = null;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("partner_online", async ({ partnerId }: { partnerId?: string }) => {
      if (!partnerId) {
        return;
      }

      await prisma.partner.update({
        where: { id: partnerId },
        data: { isOnline: true },
      });

      partnerSocketMap.set(partnerId, socket.id);
      socketPartners.set(socket.id, partnerId);
      console.log("PARTNER_ONLINE:", partnerId);
    });

    socket.on("partner_offline", async ({ partnerId }: { partnerId?: string }) => {
      if (!partnerId) {
        return;
      }

      await prisma.partner.update({
        where: { id: partnerId },
        data: { isOnline: false },
      });

      partnerSocketMap.delete(partnerId);

      for (const [socketId, mappedPartnerId] of socketPartners.entries()) {
        if (mappedPartnerId === partnerId) {
          socketPartners.delete(socketId);
        }
      }

      console.log("PARTNER_OFFLINE:", partnerId);
    });

    socket.on("booking_accept", async ({ bookingId }) => {
      const partnerId = socketPartners.get(socket.id);

      const updated = await prisma.booking.updateMany({
        where: {
          id: bookingId,
          status: BookingStatus.SEARCHING_PARTNER,
        },
        data: {
          status: BookingStatus.AWAITING_PAYMENT,
        },
      });

      if (updated.count === 0) {
        console.log("ALREADY_TAKEN");
        return;
      }

      if (partnerId) {
        await prisma.partner.update({
          where: { id: partnerId },
          data: {
            activeBookings: { increment: 1 },
          },
        });
      }

      await prisma.payment.create({
        data: {
          bookingId,
          amount: 500,
          status: "PENDING",
        },
      });

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
      const partnerId = socketPartners.get(socket.id);

      if (partnerId) {
        partnerSocketMap.delete(partnerId);
        socketPartners.delete(socket.id);

        prisma.partner
          .update({
            where: { id: partnerId },
            data: { isOnline: false },
          })
          .catch(() => {});

        console.log("PARTNER_OFFLINE:", partnerId);
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

export const getPartnerSocketMap = () => partnerSocketMap;
