import { prisma } from "../utils/prisma";
import { BookingStatus } from "@canovet/shared";
import { complaintRepository } from "../repositories/complaint.repository";
import { classifyComplaint } from "./classifier.service";

type CreateComplaintInput = {
  userId: string;
  bookingId?: string;
  message: string;
  phone: string;
  whatsapp: string;
  category: string;
};

const MAX_DAILY_COMPLAINTS = 2;
const COMPLAINT_WINDOW_HOURS = 48;

export const complaintService = {
  async createComplaint(data: CreateComplaintInput) {
    // ── Rate Limiting: Max 2 complaints per calendar day per user ──
    const todayCount = await complaintRepository.countTodayByUserId(data.userId);
    if (todayCount >= MAX_DAILY_COMPLAINTS) {
      throw new Error(
        "You have reached the maximum limit of 2 support requests for today. Please try again tomorrow."
      );
    }

    // ── Booking-specific validations (if bookingId provided) ──
    if (data.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: data.bookingId },
        select: { id: true, userId: true, status: true, slotEnd: true },
      });

      if (!booking || booking.userId !== data.userId) {
        throw new Error("Booking not found");
      }

      // Rule C: 48-hour deadline — complaints must be filed within 48h of slot end
      if (booking.status === BookingStatus.COMPLETED) {
        const hoursSinceEnd =
          (Date.now() - new Date(booking.slotEnd).getTime()) / (1000 * 60 * 60);

        if (hoursSinceEnd > COMPLAINT_WINDOW_HOURS) {
          throw new Error(
            "Complaints must be filed within 48 hours of booking completion. Please contact support@canovet.com for further assistance."
          );
        }
      }
    }

    // ── Classify complaint using Regex + BERT/Fallback ──
    const classification = await classifyComplaint(data.message);

    // Fetch booking details if bookingId is provided
    let bookingType: string | null = null;
    let paymentStatus: string | null = null;
    if (data.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: data.bookingId },
        select: { serviceType: true, payments: { select: { status: true } } },
      });
      bookingType = booking?.serviceType ?? null;
      paymentStatus = booking?.payments?.[0]?.status ?? null;
    }

    // Determine effective priority and override category name for clean admin panel visibility
    let effectivePriority = classification.priority;
    let effectiveCategory = data.category;
    const flags = classification.regexFlags;

    // Edge Cases for Grooming & Clinic Overcharging / Fraud
    if (bookingType === "GROOMING" || bookingType === "VET_CLINIC") {
      const isBillingIssue = flags.includes("OVERCHARGE") || flags.includes("FRAUD");
      if (isBillingIssue) {
        if (paymentStatus === "PAID") {
          // Extremely severe: user already paid via platform but is asked for cash or extra charges
          effectivePriority = "HIGH";
          effectiveCategory = "DOUBLE_BILLING";
        } else {
          // Medium priority: payment is pending, so direct request could be COD / standard offline collection
          effectivePriority = "MEDIUM";
          effectiveCategory = "OVERCHARGE";
        }
      }
    }

    // Edge Cases for Vet on Call Communication Issues
    if (bookingType === "VET_ON_CALL") {
      if (flags.includes("NO_CALL")) {
        // High priority: The doctor failed to call/perform checkup
        effectivePriority = "HIGH";
        effectiveCategory = "CALL_DISPUTE";
      } else if (flags.includes("NO_ANSWER")) {
        // Low priority: Vet tried calling but user didn't pick up/receive
        effectivePriority = "LOW";
        effectiveCategory = "CALL_DISPUTE";
      }
    }

    // If category indicates safety concern, always escalate
    if (
      data.category === "SAFETY" ||
      data.category === "PET_HANDLING"
    ) {
      effectivePriority = "HIGH";
    }

    // Determine initial status based on priority and category
    let status = "OPEN";
    if (effectivePriority === "HIGH") {
      status = "UNDER_REVIEW";

      // Log escalation (in production, this would trigger an email to complaints@canovet.com)
      console.log(
        `[ESCALATION] HIGH-priority complaint from user ${data.userId}:`,
        {
          category: effectiveCategory,
          regexFlags: classification.regexFlags,
          sentiment: classification.sentiment,
          message: data.message.substring(0, 200),
        }
      );
    } else if (effectivePriority === "LOW" && effectiveCategory === "OTHER") {
      // Auto-resolve low-priority, general/unclassified chat to keep queue clean.
      // Specific issues like APP_ISSUE, BILLING, LATE, etc. stay OPEN for admin action.
      status = "AUTO_RESOLVED";
    }

    // ── Save complaint to database ──
    const complaint = await complaintRepository.create({
      userId: data.userId,
      bookingId: data.bookingId,
      message: data.message,
      phone: data.phone,
      whatsapp: data.whatsapp,
      category: effectiveCategory,
      priority: effectivePriority,
    });

    // Update status if escalated
    if (status !== "OPEN") {
      await prisma.complaint.update({
        where: { id: complaint.id },
        data: { status },
      });
    }

    return {
      ...complaint,
      status,
      priority: effectivePriority,
      classification: {
        regexFlags: classification.regexFlags,
        sentiment: classification.sentiment,
      },
    };
  },

  async getUserComplaints(userId: string) {
    return complaintRepository.findByUserId(userId);
  },
};
