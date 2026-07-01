import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import Colors from "@/constants/Colors";

// ─── Types ───────────────────────────────────────────────────────────────────

type BookingDetail = {
  id: string;
  serviceType: string;
  status: string;
  slotStart: string;
  slotEnd: string;
  createdAt: string;
  pet?: { id: string; name: string; type: string; breed?: string; age?: number; weight?: number };
  address?: { id: string; house?: string; area?: string; city?: string; state?: string; text?: string };
  partner?: { id: string; name: string; phone?: string | null; rating?: number; totalCompleted?: number };
  review?: { id: string; rating: number; comment?: string | null } | null;
  complaints?: { id: string; message: string; status: string }[];
  amount?: number;
  payments?: Array<{ id: string; amount: number; status: string; method: string; createdAt: string }>;
};

// ─── Color Scheme Variables (view details button.txt) ────────────────────────

const PINK_PRIMARY = "#FF10F0";
const PINK_LIGHT = "#FFF0FD";
const DEEP_CHARCOAL = "#1e1e1e";
const SURFACE_BG = "#f8f9fc";

// ─── Date Formatting Helpers ──────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  } catch {
    return "-";
  }
};

const formatTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    let hours = date.getHours();
    const mins = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "AM" : "AM"; // keeping layout matching mockups
    const displayAmPm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${mins} ${displayAmPm}`;
  } catch {
    return "-";
  }
};

const formatSlotTime = (slotStart: string, slotEnd: string) =>
  `${formatTime(slotStart)} - ${formatTime(slotEnd)}`;

// ─── Main Screen Component ───────────────────────────────────────────────────

export default function BookingDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Complaint states
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintMsg, setComplaintMsg] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintError, setComplaintError] = useState("");

  // Collapsible accordion states
  const [expanded, setExpanded] = useState({
    specialist: true,
    payment: true,
    checklist: false,
    appointment: false,
  });

  const toggleSection = (key: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const loadBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/booking/${id}`);
      setBooking(res.data as BookingDetail);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to load booking");
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const performCancellation = async () => {
    try {
      setCancelling(true);
      setCancelError("");
      await api.post(`/booking/${id}/cancel`);
      setConfirmingCancel(false);
      await loadBooking();
      Alert.alert("Cancelled", "Your booking has been cancelled successfully.");
    } catch (err: any) {
      setCancelError(err.response?.data?.error || "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  const submitComplaint = async () => {
    if (!complaintMsg.trim()) return;
    try {
      setSubmittingComplaint(true);
      setComplaintError("");
      await api.post("/complaint", {
        bookingId: id,
        message: complaintMsg.trim(),
      });
      setComplaintMsg("");
      setShowComplaintModal(false);
      await loadBooking();
      Alert.alert("Escalated", "Your issue has been reported. Support will contact you shortly.");
    } catch (err: any) {
      setComplaintError(err.response?.data?.error || "Failed to report issue");
    } finally {
      setSubmittingComplaint(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerAlign]}>
        <ActivityIndicator size="large" color={PINK_PRIMARY} />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={[styles.container, styles.centerAlign]}>
        <Text style={styles.errorText}>{error || "Booking not found."}</Text>
        <Pressable onPress={() => router.replace("/bookings" as any)} style={styles.backCTA}>
          <Text style={styles.backCTAText}>Back to Bookings</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isActive = booking.status === "CONFIRMED" || booking.status === "AWAITING_PAYMENT";
  const slotStart = new Date(booking.slotStart);
  const hoursToStart = (slotStart.getTime() - Date.now()) / (1000 * 60 * 60);
  const isFreeCancellation = hoursToStart >= 8;

  const latestComplaint = booking.complaints?.[0];

  // Helper to fetch preparation checklist guidelines
  const getChecklistGuidelines = () => {
    const isGrooming = booking.serviceType.toUpperCase().includes("GROOMING");
    if (isGrooming) {
      return [
        "Ensure your pet has had a walk before the groomer arrives.",
        "Prepare a clean, well-lit space with access to a power outlet.",
        "Keep a towel and your pet's favorite treats handy.",
      ];
    }
    return [
      "Please arrive 10 minutes before your slot for check-in.",
      "Have previous vaccination logs or medical history records ready.",
      "Ensure your dog is leashed or cat is in a carrier.",
    ];
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header (Navbar) */}
      <View style={styles.navbar}>
        <View style={styles.navbarLeft}>
          <Pressable onPress={() => router.back()} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={24} color="#334155" />
          </Pressable>
          <Text style={styles.navbarTitle}>Booking Details</Text>
        </View>
        <View style={styles.navbarRight}>
          <Pressable onPress={() => {}} style={styles.navButton}>
            <Ionicons name="share-outline" size={22} color={PINK_PRIMARY} />
          </Pressable>
          <Pressable onPress={() => router.push("/faq")} style={styles.navButton}>
            <Ionicons name="help-circle-outline" size={24} color={PINK_PRIMARY} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Confirmed Alert header info if completed or cancelled */}
        {!isActive && (
          <View style={styles.confirmationAlertBox}>
            <View style={styles.alertCircleIcon}>
              <Ionicons
                name={booking.status === "COMPLETED" ? "checkmark-circle" : "close-circle"}
                size={28}
                color="#ffffff"
              />
            </View>
            <Text style={styles.alertTitle}>
              {booking.status === "COMPLETED" ? "Booking Completed" : "Booking Cancelled"}
            </Text>
            <Text style={styles.alertSubtitle}>
              {booking.status === "COMPLETED"
                ? "Your pet care session has been completed."
                : "This appointment was cancelled."}
            </Text>
            <View style={styles.idLabelGroup}>
              <Text style={styles.idLabelText}>ID:</Text>
              <Text style={styles.idValueText}>PC-{booking.id.slice(-5).toUpperCase()}</Text>
            </View>
          </View>
        )}

        {/* 1. Collapsible Specialist Details Section */}
        {booking.partner && (
          <View style={[styles.accordionSection, expanded.specialist && styles.accordionBorderExpanded]}>
            <Pressable
              onPress={() => toggleSection("specialist")}
              style={[styles.accordionHeader, expanded.specialist ? styles.accordionHeaderPink : null]}
            >
              <View style={styles.accordionHeaderLeft}>
                <Ionicons
                  name="briefcase-outline"
                  size={20}
                  color={expanded.specialist ? "#ffffff" : PINK_PRIMARY}
                />
                <Text style={[styles.accordionTitleText, expanded.specialist && styles.textWhite]}>
                  Specialist Details
                </Text>
              </View>
              <Ionicons
                name={expanded.specialist ? "chevron-up" : "chevron-down"}
                size={20}
                color={expanded.specialist ? "#ffffff" : "#64748b"}
              />
            </Pressable>

            {expanded.specialist && (
              <View style={styles.accordionContent}>
                <View style={styles.specialistInfo}>
                  <Text style={styles.specialistName}>{booking.partner.name}</Text>
                  <Text style={styles.specialistRole}>
                    {booking.serviceType.toUpperCase().includes("GROOMING") ? "Senior Groomer" : "Senior Veterinary Surgeon"}
                  </Text>
                </View>

                {/* Contact Actions Grid */}
                {booking.partner?.phone ? (
                  <View style={styles.contactGrid}>
                    <Pressable
                      onPress={() => {
                        if (booking.partner?.phone) {
                          Linking.openURL(`tel:${booking.partner.phone}`);
                        }
                      }}
                      style={styles.contactBtn}
                    >
                      <Ionicons name="call" size={20} color={PINK_PRIMARY} />
                      <Text style={styles.contactBtnText}>Call</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        if (booking.partner?.phone) {
                          Linking.openURL(`sms:${booking.partner.phone}`);
                        }
                      }}
                      style={styles.contactBtn}
                    >
                      <Ionicons name="mail" size={20} color={PINK_PRIMARY} />
                      <Text style={styles.contactBtnText}>SMS</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        if (booking.partner?.phone) {
                          const waNum = booking.partner.phone.replace(/\D/g, "");
                          Linking.openURL(`https://wa.me/${waNum}`);
                        }
                      }}
                      style={styles.contactBtn}
                    >
                      <Ionicons name="logo-whatsapp" size={20} color={PINK_PRIMARY} />
                      <Text style={styles.contactBtnText}>WhatsApp</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.noContactCard}>
                    <Text style={styles.noContactText}>
                      Partner contact details will appear once the booking is fully confirmed.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* 2. Collapsible Payment Summary Section */}
        {booking.amount !== undefined && (() => {
          const payment = booking.payments?.[0];
          const isPaid = payment?.status === "PAID" || payment?.status === "SUCCESS";
          const isOffline = payment?.method === "offline";
          const totalAmount = booking.amount ?? 0;
          const platformFee = totalAmount > 50 ? 50 : 0;
          const serviceFee = totalAmount - platformFee;

          return (
            <View style={styles.accordionSection}>
              <Pressable onPress={() => toggleSection("payment")} style={styles.accordionHeader}>
                <View style={styles.accordionHeaderLeft}>
                  <Ionicons name="receipt-outline" size={20} color={PINK_PRIMARY} />
                  <Text style={styles.accordionTitleText}>Payment Summary</Text>
                </View>
                <Ionicons
                  name={expanded.payment ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#64748b"
                />
              </Pressable>

              {expanded.payment && (
                <View style={[styles.accordionContent, styles.borderTop]}>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Consultation/Service Fee</Text>
                    <Text style={styles.paymentVal}>₹{serviceFee}</Text>
                  </View>
                  {platformFee > 0 && (
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Service Fee</Text>
                      <Text style={styles.paymentVal}>₹{platformFee}</Text>
                    </View>
                  )}
                  {payment?.id && (
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Payment ID</Text>
                      <Text style={[styles.paymentVal, { fontFamily: "monospace", fontSize: 12 }]}>{payment.id}</Text>
                    </View>
                  )}
                  {payment?.createdAt && (
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Payment Date</Text>
                      <Text style={styles.paymentVal}>{formatDate(payment.createdAt)}</Text>
                    </View>
                  )}
                  <View style={styles.paymentTotalRow}>
                    <Text style={styles.paymentTotalLabel}>Total Amount</Text>
                    <Text style={styles.paymentTotalVal}>₹{totalAmount}</Text>
                  </View>

                  {/* Status Indicator inside payment summary */}
                  <View style={styles.paymentStatusCard}>
                    <Text style={styles.statusCardTitle}>Payment Method & Status</Text>
                    <View style={styles.statusRow}>
                      <Ionicons
                        name={isPaid ? "checkmark-circle" : (payment?.status === "CANCELLED" ? "close-circle" : "card")}
                        size={18}
                        color={isPaid ? "#22c55e" : (payment?.status === "CANCELLED" ? "#ef4444" : "#d97706")}
                      />
                      <Text style={styles.statusCardText}>
                        <Text style={styles.boldText}>₹{totalAmount}</Text>
                        {isPaid
                          ? ` Paid Online (${payment?.method || "online"})`
                          : payment?.status === "REFUNDED"
                          ? " Refunded"
                          : payment?.status === "PARTIALLY_REFUNDED"
                          ? " Partially Refunded (80%)"
                          : payment?.status === "CANCELLED"
                          ? " Cancelled"
                          : isOffline
                          ? " Payable at Session (Cash/UPI)"
                          : " Awaiting Online Payment"}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })()}

        {/* 3. Collapsible Preparation Checklist Section */}
        <View style={styles.accordionSection}>
          <Pressable onPress={() => toggleSection("checklist")} style={styles.accordionHeader}>
            <View style={styles.accordionHeaderLeft}>
              <Ionicons name="checkbox-outline" size={20} color={PINK_PRIMARY} />
              <Text style={styles.accordionTitleText}>Preparation Checklist</Text>
            </View>
            <Ionicons
              name={expanded.checklist ? "chevron-up" : "chevron-down"}
              size={20}
              color="#64748b"
            />
          </Pressable>

          {expanded.checklist && (
            <View style={[styles.accordionContent, styles.borderTop, styles.checklistContent]}>
              {getChecklistGuidelines().map((tip, idx) => (
                <View key={idx} style={styles.checklistRow}>
                  <Ionicons name="information-circle-outline" size={16} color={PINK_PRIMARY} />
                  <Text style={styles.checklistText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 4. Collapsible Appointment Details Section */}
        <View style={styles.accordionSection}>
          <Pressable onPress={() => toggleSection("appointment")} style={styles.accordionHeader}>
            <View style={styles.accordionHeaderLeft}>
              <Ionicons name="calendar-outline" size={20} color={PINK_PRIMARY} />
              <Text style={styles.accordionTitleText}>Appointment Details</Text>
            </View>
            <Ionicons
              name={expanded.appointment ? "chevron-up" : "chevron-down"}
              size={20}
              color="#64748b"
            />
          </Pressable>

          {expanded.appointment && (
            <View style={[styles.accordionContent, styles.borderTop, styles.detailsContent]}>
              <View style={styles.detailsBlock}>
                <Text style={styles.detailsLabel}>Appointment ID</Text>
                <Text style={styles.detailsValue}>#PC-{booking.id.slice(-5).toUpperCase()}</Text>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailsBlock}>
                  <Text style={styles.detailsLabel}>Date</Text>
                  <Text style={styles.detailsSubValue}>{formatDate(booking.slotStart)}</Text>
                </View>
                <View style={styles.detailsBlock}>
                  <Text style={styles.detailsLabel}>Time Slot</Text>
                  <Text style={styles.detailsSubValue}>
                    {formatSlotTime(booking.slotStart, booking.slotEnd)}
                  </Text>
                </View>
              </View>

              {booking.pet && (
                <View style={styles.petBox}>
                  <View style={styles.petIconCircle}>
                    <Ionicons name="paw" size={18} color={PINK_PRIMARY} />
                  </View>
                  <View>
                    <Text style={styles.petName}>{booking.pet.name}</Text>
                    <Text style={styles.petMeta}>
                      {booking.pet.breed || "Breed Details"} · {booking.pet.age || 0} years
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Inline Cancel Confirmation Panel */}
        {isActive && confirmingCancel && (
          <View style={styles.cancellationCard}>
            <Text style={styles.cancellationTitle}>Confirm Cancellation</Text>
            <Text style={styles.cancellationMeta}>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </Text>

            {isFreeCancellation ? (
              <View style={styles.freeCancelBadge}>
                <Text style={styles.freeCancelText}>
                  ✨ Free cancellation is available. You will receive a full refund.
                </Text>
              </View>
            ) : (
              <View style={styles.penaltyCancelBadge}>
                <Text style={styles.penaltyCancelText}>
                  ⚠️ Cancelling now will incur a 20% penalty fee (80% refund).
                </Text>
              </View>
            )}

            {cancelError ? <Text style={styles.cancellationErrorText}>{cancelError}</Text> : null}

            <View style={styles.cancellationButtonGroup}>
              <Pressable
                disabled={cancelling}
                onPress={performCancellation}
                style={[styles.btn, styles.btnDestructive]}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.btnDestructiveText}>Yes, Cancel Booking</Text>
                )}
              </Pressable>
              <Pressable
                disabled={cancelling}
                onPress={() => setConfirmingCancel(false)}
                style={[styles.btn, styles.btnCancelOutline]}
              >
                <Text style={styles.btnCancelOutlineText}>Keep Booking</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* completed reviews & complaints log actions */}
        {booking.status === "COMPLETED" && (
          <View style={styles.completedActionsCard}>
            {booking.review ? (
              <View style={styles.reviewCompletedCard}>
                <Text style={styles.reviewCompletedTitle}>Submitted Review: {booking.review.rating}/5 ★</Text>
                {booking.review.comment ? (
                  <Text style={styles.reviewCompletedComment}>"{booking.review.comment}"</Text>
                ) : null}
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  router.push(`/ask-cano?intent=rate&bookingId=${booking.id}` as any);
                }}
                style={styles.reviewSubmitBtn}
              >
                <Text style={styles.reviewSubmitBtnText}>⭐ Review via Ask Cano</Text>
              </Pressable>
            )}

            {latestComplaint ? (
              <View style={styles.complaintStatusBadge}>
                <Text style={styles.complaintStatusText}>Complaint Status: {latestComplaint.status}</Text>
                <Text style={styles.complaintStatusSub}>"{latestComplaint.message}"</Text>
              </View>
            ) : (
              <Pressable onPress={() => setShowComplaintModal(true)} style={styles.reportBtn}>
                <Text style={styles.reportBtnText}>🚩 Report an Issue</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      {/* Sticky Footer Navigation Buttons */}
      {isActive && !confirmingCancel && (
        <View style={styles.stickyFooter}>
          <Pressable
            onPress={() => {
              router.push(`/ask-cano?bookingId=${booking.id}&intent=reschedule` as any);
            }}
            style={styles.footerPrimaryBtn}
          >
            <Ionicons name="calendar-outline" size={18} color="#ffffff" />
            <Text style={styles.footerPrimaryBtnText}>Reschedule Session</Text>
          </Pressable>
          <Pressable onPress={() => setConfirmingCancel(true)} style={styles.footerSecondaryBtn}>
            <Ionicons name="close-circle-outline" size={18} color="#475569" />
            <Text style={styles.footerSecondaryBtnText}>Cancel Booking</Text>
          </Pressable>
        </View>
      )}

      {/* Completed/Cancelled Rebook button footer */}
      {!isActive && (
        <View style={styles.stickyFooter}>
          <Pressable
            onPress={() => {
              router.push(`/booking/wizard?type=${booking.serviceType.toLowerCase()}` as any);
            }}
            style={styles.footerPrimaryBtn}
          >
            <Ionicons name="refresh-outline" size={18} color="#ffffff" />
            <Text style={styles.footerPrimaryBtnText}>Book Session Again</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace("/(tabs)/home")}
            style={styles.footerSecondaryBtn}
          >
            <Ionicons name="home-outline" size={18} color="#475569" />
            <Text style={styles.footerSecondaryBtnText}>Back to Home</Text>
          </Pressable>
        </View>
      )}

      {/* Complaint Submission Modal */}
      <Modal visible={showComplaintModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Report an Issue</Text>
              <Pressable onPress={() => setShowComplaintModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.modalMetaText}>
              Please describe the issue you experienced. Our support team will investigate and escalate if needed.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="What went wrong?"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              value={complaintMsg}
              onChangeText={setComplaintMsg}
            />

            {complaintError ? <Text style={styles.modalErrorText}>{complaintError}</Text> : null}

            <Pressable
              disabled={!complaintMsg.trim() || submittingComplaint}
              onPress={submitComplaint}
              style={[
                styles.modalSubmitBtn,
                !complaintMsg.trim() ? styles.modalSubmitBtnDisabled : null,
              ]}
            >
              {submittingComplaint ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Submit Complaint</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SURFACE_BG,
  },
  centerAlign: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  noContactCard: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "rgba(180, 83, 9, 0.2)",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  noContactText: {
    fontSize: 12,
    color: "#b45309",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 16,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444",
    textAlign: "center",
  },
  backCTA: {
    marginTop: 16,
    backgroundColor: PINK_PRIMARY,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backCTAText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },

  // ── Navbar Header ──
  navbar: {
    height: 60,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  navbarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backIcon: {
    padding: 4,
  },
  navbarTitle: {
    fontSize: 19,
    fontFamily: Colors.fonts.bold,
    color: "#0f172a",
  },
  navbarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  navButton: {
    padding: 4,
  },

  // ── Confirmation Box (completed / cancelled) ──
  confirmationAlertBox: {
    backgroundColor: PINK_PRIMARY,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 8,
  },
  alertCircleIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  alertTitle: {
    fontFamily: Colors.fonts.bold,
    fontSize: 22,
    color: "#ffffff",
    marginBottom: 4,
  },
  alertSubtitle: {
    fontFamily: Colors.fonts.regular,
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 16,
  },
  idLabelGroup: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 99,
  },
  idLabelText: {
    fontFamily: Colors.fonts.medium,
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  idValueText: {
    fontFamily: Colors.fonts.bold,
    fontSize: 12,
    color: "#ffffff",
    marginLeft: 4,
  },

  // ── Accordion Collapsible Sections ──
  accordionSection: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  accordionBorderExpanded: {
    borderColor: PINK_PRIMARY,
  },
  accordionHeader: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
  },
  accordionHeaderPink: {
    backgroundColor: PINK_PRIMARY,
  },
  accordionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  accordionTitleText: {
    fontFamily: Colors.fonts.bold,
    fontSize: 16,
    color: "#334155",
  },
  textWhite: {
    color: "#ffffff",
  },
  accordionContent: {
    padding: 20,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },

  // ── Specialist Details Content ──
  specialistInfo: {
    marginBottom: 20,
  },
  specialistName: {
    fontFamily: Colors.fonts.bold,
    fontSize: 20,
    color: "#1e293b",
    marginBottom: 4,
  },
  specialistRole: {
    fontFamily: Colors.fonts.medium,
    fontSize: 14,
    color: "#64748b",
  },
  contactGrid: {
    flexDirection: "row",
    gap: 12,
  },
  contactBtn: {
    flex: 1,
    backgroundColor: PINK_LIGHT,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  contactBtnText: {
    fontFamily: Colors.fonts.bold,
    fontSize: 11,
    color: PINK_PRIMARY,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Payment Summary Content ──
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  paymentLabel: {
    fontFamily: Colors.fonts.regular,
    fontSize: 14,
    color: "#64748b",
  },
  paymentVal: {
    fontFamily: Colors.fonts.semiBold,
    fontSize: 14,
    color: "#334155",
  },
  paymentTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  paymentTotalLabel: {
    fontFamily: Colors.fonts.bold,
    fontSize: 16,
    color: "#1e293b",
  },
  paymentTotalVal: {
    fontFamily: Colors.fonts.bold,
    fontSize: 20,
    color: PINK_PRIMARY,
  },
  paymentStatusCard: {
    backgroundColor: "#f1f5f9",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  statusCardTitle: {
    fontFamily: Colors.fonts.bold,
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusCardText: {
    fontFamily: Colors.fonts.regular,
    fontSize: 13.5,
    color: "#334155",
  },
  boldText: {
    fontFamily: Colors.fonts.bold,
  },

  // ── Preparation Checklist Content ──
  checklistContent: {
    gap: 12,
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checklistText: {
    fontFamily: Colors.fonts.regular,
    fontSize: 14,
    color: "#475569",
    lineHeight: 18,
    flex: 1,
  },

  // ── Appointment Details Content ──
  detailsContent: {
    gap: 16,
  },
  detailsBlock: {
    gap: 4,
  },
  detailsLabel: {
    fontFamily: Colors.fonts.bold,
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailsValue: {
    fontFamily: Colors.fonts.bold,
    fontSize: 18,
    color: "#1e293b",
  },
  detailsGrid: {
    flexDirection: "row",
  },
  detailsSubValue: {
    fontFamily: Colors.fonts.semiBold,
    fontSize: 14.5,
    color: "#1e293b",
    marginRight: 40,
  },
  petBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 12,
    marginTop: 4,
  },
  petIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PINK_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  petName: {
    fontFamily: Colors.fonts.bold,
    fontSize: 14,
    color: "#1e293b",
  },
  petMeta: {
    fontFamily: Colors.fonts.regular,
    fontSize: 12,
    color: "#64748b",
  },

  // ── Cancellation Card (inline panel) ──
  cancellationCard: {
    backgroundColor: "#fff8f8",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  cancellationTitle: {
    fontFamily: Colors.fonts.bold,
    fontSize: 15,
    color: "#dc2626",
  },
  cancellationMeta: {
    fontFamily: Colors.fonts.regular,
    fontSize: 12.5,
    color: "#64748b",
    lineHeight: 16,
  },
  freeCancelBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.06)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.15)",
    padding: 10,
  },
  freeCancelText: {
    fontFamily: Colors.fonts.semiBold,
    fontSize: 11,
    color: "#16a34a",
    lineHeight: 15,
  },
  penaltyCancelBadge: {
    backgroundColor: "rgba(220, 38, 38, 0.06)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.15)",
    padding: 10,
  },
  penaltyCancelText: {
    fontFamily: Colors.fonts.semiBold,
    fontSize: 11,
    color: "#dc2626",
    lineHeight: 15,
  },
  cancellationButtonGroup: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDestructive: {
    backgroundColor: "#dc2626",
  },
  btnDestructiveText: {
    fontFamily: Colors.fonts.bold,
    color: "#ffffff",
    fontSize: 13,
  },
  btnCancelOutline: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  btnCancelOutlineText: {
    fontFamily: Colors.fonts.bold,
    color: "#334155",
    fontSize: 13,
  },
  cancellationErrorText: {
    fontFamily: Colors.fonts.semiBold,
    color: "#dc2626",
    fontSize: 11,
  },

  // ── Completed reviews & complaints ──
  completedActionsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    gap: 12,
  },
  reviewSubmitBtn: {
    height: 40,
    borderRadius: 99,
    backgroundColor: PINK_PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewSubmitBtnText: {
    fontFamily: Colors.fonts.bold,
    color: "#ffffff",
    fontSize: 13,
  },
  reviewCompletedCard: {
    backgroundColor: SURFACE_BG,
    borderRadius: 12,
    padding: 12,
  },
  reviewCompletedTitle: {
    fontFamily: Colors.fonts.bold,
    fontSize: 13,
    color: "#1e293b",
  },
  reviewCompletedComment: {
    fontFamily: Colors.fonts.regular,
    fontSize: 12,
    color: "#64748b",
    fontStyle: "italic",
    marginTop: 4,
  },
  reportBtn: {
    height: 40,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  reportBtnText: {
    fontFamily: Colors.fonts.bold,
    fontSize: 13,
    color: "#334155",
  },
  complaintStatusBadge: {
    backgroundColor: "#fff8f8",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.15)",
    borderRadius: 12,
    padding: 12,
  },
  complaintStatusText: {
    fontFamily: Colors.fonts.bold,
    fontSize: 12,
    color: "#dc2626",
  },
  complaintStatusSub: {
    fontFamily: Colors.fonts.regular,
    fontSize: 11.5,
    color: "#64748b",
    marginTop: 2,
  },

  // ── Sticky Footer Buttons ──
  stickyFooter: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  footerPrimaryBtn: {
    backgroundColor: PINK_PRIMARY,
    height: 48,
    borderRadius: 999, // Pill shape
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: PINK_PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  footerPrimaryBtnText: {
    fontFamily: Colors.fonts.bold,
    fontSize: 14,
    color: "#ffffff",
  },
  footerSecondaryBtn: {
    backgroundColor: PINK_LIGHT,
    height: 48,
    borderRadius: 999, // Pill shape
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerSecondaryBtnText: {
    fontFamily: Colors.fonts.bold,
    fontSize: 14,
    color: "#475569",
  },

  // ── Complaint Modal ──
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    gap: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalHeaderTitle: {
    fontFamily: Colors.fonts.bold,
    fontSize: 18,
    color: "#0f172a",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseBtnText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
  },
  modalMetaText: {
    fontFamily: Colors.fonts.regular,
    fontSize: 12.5,
    color: "#64748b",
    lineHeight: 16,
  },
  modalInput: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 16,
    padding: 12,
    fontSize: 13,
    color: "#0f172a",
    backgroundColor: "#ffffff",
    textAlignVertical: "top",
  },
  modalErrorText: {
    fontFamily: Colors.fonts.semiBold,
    color: "#dc2626",
    fontSize: 11,
  },
  modalSubmitBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: PINK_PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitBtnDisabled: {
    opacity: 0.5,
  },
  modalSubmitBtnText: {
    fontFamily: Colors.fonts.bold,
    color: "#ffffff",
    fontSize: 14,
  },
});
