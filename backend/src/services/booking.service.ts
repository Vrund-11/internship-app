import { matchingService } from "./matching.service";
import { bookingRepository } from "../repositories/booking.repository";
import { ServiceType, BookingStatus } from "@canovet/shared";
import { prisma } from "../utils/prisma";
import { getDistanceKm } from "../utils/geo";
import { redisClient } from "../utils/redis";

const invalidateSlotsCache = async () => {
  if (redisClient.isOpen) {
    try {
      const keys = await redisClient.keys("cache:slots:*");
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`[REDIS_CACHE] Invalidated ${keys.length} slots cache keys`);
      }
    } catch (err) {
      console.error("[REDIS_CACHE] Error invalidating slots cache:", err);
    }
  }
};

type CreateBookingInput = {
  userId: string;
  cityId: string;
  serviceType: string;
  petId: string;
  addressId?: string | null;
  clinicId?: string | null;
  clinicAddressId?: string | null;
  slotStart: Date;
  slotEnd: Date;
  preferredPartnerId?: string;
  amount?: number;
  paymentMethod?: string;
};

export const bookingService = {
  async createBooking(data: CreateBookingInput) {
    const { preferredPartnerId, amount, paymentMethod, ...bookingData } = data;

    const isClinicBooking = bookingData.serviceType === ServiceType.VET_CLINIC;

    const requiresAddress = bookingData.serviceType === ServiceType.GROOMING;
    let address = null as null | { city: string; userId: string; latitude: number; longitude: number };
    if (requiresAddress) {
      if (!bookingData.addressId) {
        throw new Error("Invalid address selected");
      }
      address = await prisma.address.findUnique({
        where: { id: bookingData.addressId },
        select: { city: true, userId: true, latitude: true, longitude: true },
      });
      if (!address || address.userId !== bookingData.userId) {
        throw new Error("Invalid address selected");
      }
    } else if (bookingData.addressId) {
      address = await prisma.address.findUnique({
        where: { id: bookingData.addressId },
        select: { city: true, userId: true, latitude: true, longitude: true },
      });
    }

    const pet = await prisma.pet.findUnique({
      where: { id: bookingData.petId },
    });
    if (!pet || pet.userId !== bookingData.userId) {
      throw new Error("Invalid pet selected");
    }

    let city = bookingData.cityId
      ? await prisma.city.findUnique({ where: { id: bookingData.cityId } })
      : null;

    if (isClinicBooking) {
      if (!bookingData.clinicId) {
        throw new Error("Clinic selection is required");
      }
      const clinic = await prisma.partner.findUnique({
        where: { id: bookingData.clinicId },
        include: { services: true },
      });
      if (!clinic) {
        throw new Error("Invalid clinic selected");
      }
      const hasClinicService = clinic.services.some(
        (service) => service.serviceType === ServiceType.VET_CLINIC
      );
      if (!hasClinicService || !clinic.isVerified) {
        throw new Error("Selected clinic is unavailable");
      }

      bookingData.cityId = clinic.cityId;
      bookingData.addressId = null;
      bookingData.clinicId = clinic.id;

      // Resolve clinic address
      const clinicAddr = await prisma.clinicAddress.findFirst({
        where: { partnerId: clinic.id },
      });
      if (clinicAddr) {
        bookingData.clinicAddressId = clinicAddr.id;
      }

      const bookingsCount = await prisma.booking.count({
        where: {
          partnerId: clinic.id,
          status: {
            in: [BookingStatus.CONFIRMED, BookingStatus.AWAITING_PAYMENT],
          },
          slotStart: {
            lt: bookingData.slotEnd,
          },
          slotEnd: {
            gt: bookingData.slotStart,
          },
        },
      });

      if (bookingsCount >= 5) {
        throw new Error("Selected clinic slot is not available");
      }

      const verificationOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const clinicBooking = await bookingRepository.create({
        ...bookingData,
        partnerId: clinic.id,
        status: BookingStatus.AWAITING_PAYMENT,
        verificationOtp,
      });

      await prisma.payment.create({
        data: {
          bookingId: clinicBooking.id,
          amount: amount !== undefined ? Math.round(amount) : 500,
          status: "PENDING",
          method: paymentMethod || "online",
        },
      });

      await prisma.partner.update({
        where: { id: clinic.id },
        data: { activeBookings: { increment: 1 } },
      });

      return bookingRepository.findById(clinicBooking.id);
    }

    if (!city) {
      city = await prisma.city.findFirst({
        where: {
          name: {
            equals: address?.city ?? "",
            mode: "insensitive",
          },
          isActive: true,
        },
      });
    }

    if (!city) {
      city = await prisma.city.findFirst({
        where: { isActive: true },
        orderBy: { id: "asc" },
      });
    }

    if (!city) {
      throw new Error("No active cities available in the system");
    }

    bookingData.cityId = city.id;

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    const todayCount = await bookingRepository.countBookingsByUserInRange(
      bookingData.userId,
      dayStart,
      dayEnd
    );

    if (todayCount >= 10) {
      throw new Error("Daily booking limit reached (10). Try again tomorrow.");
    }

    const verificationOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const booking = await bookingRepository.create({
      ...bookingData,
      verificationOtp,
    });

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: amount !== undefined ? Math.round(amount) : (bookingData.serviceType === "GROOMING" ? 999 : 599),
        status: "PENDING",
        method: paymentMethod || "online",
      },
    });

    console.log("BOOKING_CREATED:", booking.id);
    await matchingService.assignPartner(
      {
        ...booking,
        addressId: booking.addressId!,
      },
      preferredPartnerId
    );

    await invalidateSlotsCache();
    return bookingRepository.findById(booking.id);
  },

  async getOrCreateTestData(userId: string) {
    let pets = await bookingRepository.findPetsByUserId(userId);

    if (pets.length === 0) {
      await bookingRepository.createPet(userId, "Buddy", "dog", "Mixed", 2, 8);
      await bookingRepository.createPet(userId, "Luna", "cat", "Mixed", 1, 4);
      pets = await bookingRepository.findPetsByUserId(userId);
    }

    const seedAddresses = [
      { text: "Home: Satellite, Ahmedabad", latitude: 23.03096, longitude: 72.51857, label: "Home" },
      { text: "Home: Prahlad Nagar, Ahmedabad", latitude: 23.01191, longitude: 72.50456, label: "Home" },
    ];

    for (const item of seedAddresses) {
      const existing = await bookingRepository.findAddressByUserAndText(
        userId,
        item.text
      );

      if (!existing) {
        await bookingRepository.createAddress(
          userId,
          item.text,
          item.latitude,
          item.longitude,
          item.label,
          item.text,
          "",
          "Ahmedabad",
          "Gujarat",
          "000000"
        );
      }
    }

    const addresses = await bookingRepository.findAddressesByUserId(userId);

    return { pets, addresses };
  },

  async listPets(userId: string) {
    return bookingRepository.findPetsByUserId(userId);
  },

  async createPet(
    userId: string,
    input: {
      name: string;
      type: string;
      breed: string;
      age: number;
      weight: number;
    }
  ) {
    return bookingRepository.createPet(
      userId,
      input.name,
      input.type,
      input.breed,
      input.age,
      input.weight
    );
  },

  async listAddresses(userId: string) {
    return bookingRepository.findAddressesByUserId(userId);
  },

  async createAddress(
    userId: string,
    input: {
      label: string;
      house: string;
      area: string;
      city: string;
      state: string;
      pincode: string;
      latitude?: number;
      longitude?: number;
    }
  ) {
    const fallbackCoords: Record<string, { latitude: number; longitude: number }> = {
      Ahmedabad: { latitude: 23.03096, longitude: 72.51857 },
      Mumbai: { latitude: 19.076, longitude: 72.877 },
    };

    const coords =
      input.latitude !== undefined && input.longitude !== undefined
        ? { latitude: input.latitude, longitude: input.longitude }
        : fallbackCoords[input.city] ?? { latitude: 0, longitude: 0 };

    const text = `${input.label}: ${input.house}, ${input.area}, ${input.city}, ${input.state} - ${input.pincode}`;

    return bookingRepository.createAddress(
      userId,
      text,
      coords.latitude,
      coords.longitude,
      input.label,
      input.house,
      input.area,
      input.city,
      input.state,
      input.pincode
    );
  },

  async listBookings(userId: string, page = 1, limit = 10, status?: string) {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 10;
    const skip = (safePage - 1) * safeLimit;
    const rows = await bookingRepository.findBookingsByUserId(
      userId,
      skip,
      safeLimit + 1,
      status
    );

    const hasMore = rows.length > safeLimit;
    const bookings = hasMore ? rows.slice(0, safeLimit) : rows;

    return { bookings, hasMore };
  },

  async getBooking(userId: string, bookingId: string) {
    const booking = await bookingRepository.findById(bookingId);

    if (!booking || booking.userId !== userId) {
      throw new Error("Booking not found");
    }

    return booking;
  },

  async cancelBooking(userId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.userId !== userId) {
      throw new Error("Booking not found");
    }

    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.FAILED
    ) {
      throw new Error(`Cannot cancel a booking that is already ${booking.status.toLowerCase()}`);
    }

    const now = new Date();
    const slotStart = new Date(booking.slotStart);
    const hoursToStart = (slotStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    let penaltyAmount = 0;
    let refundAmount = 0;
    let isFreeCancellation = hoursToStart >= 8;

    const payment = await prisma.payment.findFirst({
      where: { bookingId },
    });
    // Refund/penalty applies only if the booking has already been PAID online
    const totalAmount = payment && payment.status === "PAID" ? payment.amount : 0;

    // Rule D: Cancellation Timing: Cancellation is completely blocked within 4 hours of slot start.
    if (hoursToStart < 4) {
      throw new Error("Cannot cancel booking within 4 hours of scheduled start. Please contact support at complaints@canovet.com to request manual cancellation.");
    }

    if (isFreeCancellation) {
      refundAmount = totalAmount;
    } else {
      penaltyAmount = Math.round(totalAmount * 0.2);
      refundAmount = totalAmount - penaltyAmount;
    }

    // Update booking status to CANCELLED
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    // If partner was assigned, decrement activeBookings
    if (booking.partnerId) {
      await prisma.partner.update({
        where: { id: booking.partnerId },
        data: {
          activeBookings: { decrement: 1 },
        },
      });
    }

    // Update payment status if there is one
    if (payment) {
      if (payment.status === "PAID") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: isFreeCancellation ? "REFUNDED" : "PARTIALLY_REFUNDED" },
        });
      } else {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "CANCELLED" },
        });
      }
    }

    await invalidateSlotsCache();

    return {
      booking: updatedBooking,
      isFreeCancellation,
      penaltyAmount,
      refundAmount,
    };
  },

  validateServiceWindow(serviceType: string, slotStart: Date) {
    const now = new Date();
    if (slotStart.getTime() <= now.getTime()) {
      throw new Error("Bookings must be scheduled in the future");
    }
  },

  async rescheduleBooking(userId: string, bookingId: string, slotStart: Date, slotEnd: Date) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.userId !== userId) {
      throw new Error("Booking not found");
    }

    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.FAILED
    ) {
      throw new Error(`Cannot reschedule a booking that is already ${booking.status.toLowerCase()}`);
    }

    const diffMs = slotEnd.getTime() - slotStart.getTime();
    const diffHours = diffMs / (60 * 60 * 1000);

    if (diffHours !== 2 || diffMs <= 0) {
      throw new Error("Slots must be 2-hour windows");
    }

    const now = new Date();
    if (slotStart.getTime() <= now.getTime()) {
      throw new Error("Rescheduled slot must be in the future");
    }

    this.validateServiceWindow(booking.serviceType, slotStart);

    // Rate limiting: count reschedule logs for today
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    const todayRescheduleCount = await prisma.rescheduleLog.count({
      where: {
        userId,
        createdAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    if (todayRescheduleCount >= 2) {
      throw new Error("Daily rescheduling limit reached (2). Try again tomorrow.");
    }

    if (booking.serviceType === ServiceType.VET_CLINIC) {
      const clinicId = booking.partnerId ?? booking.clinicId;
      if (!clinicId) {
        throw new Error("Clinic booking is missing clinic information");
      }

      const conflict = await prisma.booking.findFirst({
        where: {
          partnerId: clinicId,
          id: { not: booking.id },
          status: {
            in: [BookingStatus.CONFIRMED, BookingStatus.AWAITING_PAYMENT],
          },
          slotStart: {
            lt: slotEnd,
          },
          slotEnd: {
            gt: slotStart,
          },
        },
        select: { id: true },
      });

      if (conflict) {
        throw new Error("Selected clinic slot is not available");
      }

      const updatedClinicBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          slotStart,
          slotEnd,
          partnerId: clinicId,
          clinicId: booking.clinicId ?? clinicId,
        },
      });

      return updatedClinicBooking;
    }

    if (!booking.addressId) {
      throw new Error("Booking address not found");
    }

    const address = await prisma.address.findUnique({
      where: { id: booking.addressId },
    });

    if (!address) {
      throw new Error("Booking address not found");
    }

    let newPartnerId: string | null = null;

    // 1. Try original partner
    if (booking.partnerId) {
      const originalPartner = await prisma.partner.findUnique({
        where: { id: booking.partnerId },
        include: { services: true },
      });

      if (originalPartner) {
        const hasService = originalPartner.services.some(
          (s) => s.serviceType === booking.serviceType
        );

        const distance = getDistanceKm(
          address.latitude,
          address.longitude,
          originalPartner.latitude,
          originalPartner.longitude
        );

        const isEligible =
          originalPartner.isOnline &&
          originalPartner.isVerified &&
          originalPartner.cityId === booking.cityId &&
          hasService &&
          distance <= 10;

        if (isEligible) {
          const conflict = await prisma.booking.findFirst({
            where: {
              partnerId: originalPartner.id,
              id: { not: booking.id },
              status: {
                in: [BookingStatus.CONFIRMED, BookingStatus.AWAITING_PAYMENT],
              },
              slotStart: {
                lt: slotEnd,
              },
              slotEnd: {
                gt: slotStart,
              },
            },
            select: { id: true },
          });

          if (!conflict) {
            newPartnerId = originalPartner.id;
          }
        }
      }
    }

    // 2. Matchmaking fallback if original partner not eligible or conflicted
    if (!newPartnerId) {
      const partners = await prisma.partner.findMany({
        where: {
          isOnline: true,
          isVerified: true,
          cityId: booking.cityId,
        },
        include: {
          services: true,
        },
      });

      const eligible = partners.filter((partner) =>
        partner.services.some((s) => s.serviceType === booking.serviceType)
      );

      const availablePartners: any[] = [];

      for (const partner of eligible) {
        const conflict = await prisma.booking.findFirst({
          where: {
            partnerId: partner.id,
            id: { not: booking.id },
            status: {
              in: [BookingStatus.CONFIRMED, BookingStatus.AWAITING_PAYMENT],
            },
            slotStart: {
              lt: slotEnd,
            },
            slotEnd: {
              gt: slotStart,
            },
          },
          select: { id: true },
        });

        if (!conflict) {
          availablePartners.push(partner);
        }
      }

      const nearby = availablePartners.filter((partner) => {
        const distance = getDistanceKm(
          address.latitude,
          address.longitude,
          partner.latitude,
          partner.longitude
        );
        return distance <= 10;
      });

      if (nearby.length === 0) {
        throw new Error(
          "No partners available at the selected time slot. Please select a different slot."
        );
      }

      const scored = nearby.map((partner) => {
        const distance = getDistanceKm(
          address.latitude,
          address.longitude,
          partner.latitude,
          partner.longitude
        );

        const score =
          distance * 1 +
          partner.activeBookings * 2 +
          partner.todayCompletedBookings * 1;

        return { partner, score };
      });

      scored.sort((a, b) => a.score - b.score);
      newPartnerId = scored[0].partner.id;
    }

    // Update DB
    return prisma.$transaction(async (tx) => {
      if (booking.partnerId && booking.partnerId !== newPartnerId) {
        await tx.partner.update({
          where: { id: booking.partnerId },
          data: { activeBookings: { decrement: 1 } },
        });
      }

      if (newPartnerId && booking.partnerId !== newPartnerId) {
        await tx.partner.update({
          where: { id: newPartnerId },
          data: { activeBookings: { increment: 1 } },
        });
      }

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          slotStart,
          slotEnd,
          partnerId: newPartnerId,
        },
      });

      await tx.rescheduleLog.create({
        data: {
          userId,
          bookingId,
        },
      });

      return updatedBooking;
    }).then(async (result) => {
      await invalidateSlotsCache();
      return result;
    });
  },

  async completeBookingWithOtp(bookingId: string, verificationOtp: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new Error("Booking is already completed");
    }

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.FAILED) {
      throw new Error(`Cannot complete booking that is already ${booking.status.toLowerCase()}`);
    }

    if (!booking.verificationOtp) {
      throw new Error("No verification OTP set for this booking");
    }

    if (booking.verificationOtp !== verificationOtp) {
      throw new Error("Invalid verification OTP");
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.COMPLETED },
    });

    if (booking.partnerId) {
      await prisma.partner.update({
        where: { id: booking.partnerId },
        data: {
          totalCompleted: { increment: 1 },
          todayCompletedBookings: { increment: 1 },
          activeBookings: { decrement: 1 },
        },
      });
    }

    const payment = await prisma.payment.findFirst({
      where: { bookingId },
    });
    if (payment && payment.status === "PENDING") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "PAID" },
      });
    }

    return updatedBooking;
  },

  async checkInBookingWithOtp(bookingId: string, verificationOtp: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (
      booking.status !== BookingStatus.CONFIRMED &&
      booking.status !== BookingStatus.AWAITING_PAYMENT
    ) {
      throw new Error(`Cannot check in a booking with status ${booking.status}`);
    }

    if (!booking.verificationOtp) {
      throw new Error("No verification OTP set for this booking");
    }

    if (booking.verificationOtp !== verificationOtp) {
      throw new Error("Invalid verification OTP");
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CHECKED_IN },
    });

    return updatedBooking;
  },

  async getAutocompleteSuggestions(query: string) {
    const LOCAL_FALLBACKS = [
      { label: "Shahpur Cross Road, Shahpur, Ahmedabad, Gujarat", houseNumber: "", area: "Shahpur", city: "Ahmedabad", state: "Gujarat", pincode: "380001", latitude: 23.0362, longitude: 72.5811 },
      { label: "Dariapur Circle, Dariapur, Ahmedabad, Gujarat", houseNumber: "", area: "Dariapur", city: "Ahmedabad", state: "Gujarat", pincode: "380001", latitude: 23.0333, longitude: 72.5954 },
      { label: "Jamalpur Gate, Jamalpur, Ahmedabad, Gujarat", houseNumber: "", area: "Jamalpur", city: "Ahmedabad", state: "Gujarat", pincode: "380001", latitude: 23.0129, longitude: 72.5848 },
      { label: "Khadia Cross Road, Khadia, Ahmedabad, Gujarat", houseNumber: "", area: "Khadia", city: "Ahmedabad", state: "Gujarat", pincode: "380001", latitude: 23.0214, longitude: 72.5891 },
      { label: "Asarwa Lake, Asarwa, Ahmedabad, Gujarat", houseNumber: "", area: "Asarwa", city: "Ahmedabad", state: "Gujarat", pincode: "380016", latitude: 23.0469, longitude: 72.6089 },
      { label: "Shahibaug Underbridge, Shahibaug, Ahmedabad, Gujarat", houseNumber: "", area: "Shahibaug", city: "Ahmedabad", state: "Gujarat", pincode: "380004", latitude: 23.0582, longitude: 72.5932 },
      { label: "Behrampura Police Station, Behrampura, Ahmedabad, Gujarat", houseNumber: "", area: "Behrampura", city: "Ahmedabad", state: "Gujarat", pincode: "380022", latitude: 23.0092, longitude: 72.5807 },
      { label: "Raipur Darwaja, Raipur, Ahmedabad, Gujarat", houseNumber: "", area: "Raipur", city: "Ahmedabad", state: "Gujarat", pincode: "380001", latitude: 23.0396, longitude: 72.5660 },
      { label: "Kankaria Lake, Kankaria, Ahmedabad, Gujarat", houseNumber: "", area: "Kankaria", city: "Ahmedabad", state: "Gujarat", pincode: "380022", latitude: 23.0067, longitude: 72.5962 },
      { label: "Bapunagar Cross Road, Bapunagar, Ahmedabad, Gujarat", houseNumber: "", area: "Bapunagar", city: "Ahmedabad", state: "Gujarat", pincode: "380024", latitude: 23.0384, longitude: 72.6305 }
    ];

    const token = process.env.MAPBOX_ACCESS_TOKEN;
    if (token && token.trim().startsWith("pk.") && query.trim().length > 2) {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=IN&types=address,neighborhood,locality,postcode&access_token=${token}&limit=5`;
        const response = await fetch(url);
        const data: any = await response.json();
        
        if (data && data.features) {
          return data.features.map((feature: any) => {
            let pincode = "";
            let city = "";
            let state = "";
            let area = feature.text || "";
            
            if (feature.context) {
              for (const ctx of feature.context) {
                if (ctx.id.startsWith("postcode")) {
                  pincode = ctx.text;
                } else if (ctx.id.startsWith("place")) {
                  city = ctx.text;
                } else if (ctx.id.startsWith("region")) {
                  state = ctx.text;
                }
              }
            }
            
            if (!city) {
              if (feature.place_name.includes("Ahmedabad")) city = "Ahmedabad";
              else if (feature.place_name.includes("Mumbai")) city = "Mumbai";
            }
            if (!state) {
              if (city === "Ahmedabad") state = "Gujarat";
              else if (city === "Mumbai") state = "Maharashtra";
            }

            return {
              label: feature.place_name,
              houseNumber: "",
              area,
              city: city || "Ahmedabad",
              state: state || "Gujarat",
              pincode: pincode || "380015",
              latitude: feature.center ? feature.center[1] : 23.0225,
              longitude: feature.center ? feature.center[0] : 72.5714,
            };
          });
        }
      } catch (err) {
        console.error("Mapbox API request failed, falling back to local matches:", err);
      }
    }

    // Fallback search logic
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) {
      return LOCAL_FALLBACKS.slice(0, 5);
    }

    return LOCAL_FALLBACKS.filter(item => 
      item.label.toLowerCase().includes(searchTerm) ||
      item.area.toLowerCase().includes(searchTerm) ||
      item.city.toLowerCase().includes(searchTerm)
    ).slice(0, 5);
  },
};
// Trigger nodemon restart
