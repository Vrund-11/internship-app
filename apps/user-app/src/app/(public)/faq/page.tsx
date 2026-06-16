"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, HelpCircle, ArrowLeft, Mail, AlertTriangle } from "lucide-react";

type FAQItem = {
  question: string;
  answer: string;
};

const FAQ_LIST: FAQItem[] = [
  {
    question: "How do I book a care appointment?",
    answer: "You can easily book any pet care service (Grooming, Vet on Call, or Clinic visits) from the home page. Choose the service type, select your pet, pick a convenient date and time slot, confirm the details, and complete payment secure online."
  },
  {
    question: "Can I cancel or reschedule my booking?",
    answer: "Yes. Go to 'My Bookings', select the booking card, and choose 'Reschedule Visit' or 'Cancel Booking'. You can select a new date and time slot directly, or use our Ask Cano virtual assistant for guided support."
  },
  {
    question: "What is the cancellation and refund policy?",
    answer: "Cancellations made 8 hours or more before the scheduled appointment start time are free, and you will receive a 100% refund. Cancellations made within 8 hours of the appointment start time will incur a 20% penalty fee (80% refund)."
  },
  {
    question: "What should I do if the groomer or vet is late?",
    answer: "All service partners are given a 15-minute grace period. If they are delayed beyond that, please contact support so we can track their location or assign an immediate replacement."
  },
  {
    question: "How are the vets and groomers verified?",
    answer: "Every service partner undergoes thorough background checks, professional credentials verification, and hands-on skill training before onboarding. We maintain high rating thresholds to ensure quality care."
  },
  {
    question: "Can I pay offline or in cash?",
    answer: "No, all payments must be processed securely through the app using card, net banking, or UPI. Partners are not authorized to accept cash or offline payments."
  },
  {
    question: "What if the partner demands extra fees or direct cash?",
    answer: "Direct offline payment requests are strictly prohibited. If a partner demands cash or charges extra fees outside the app, do not pay them and contact us immediately via support or email so we can take immediate action."
  },
  {
    question: "What happens if my pet is aggressive or hard to handle?",
    answer: "Please specify your pet's temperament, breed, and weight when adding them to your profile. If your pet is anxious or aggressive, our partners use gentle holding techniques, but you should assist them during the visit for safety."
  },
  {
    question: "How do I add a new pet or address?",
    answer: "You can add pets and addresses directly from your Profile section, from the home screen, or through the conversational prompt in Ask Cano."
  },
  {
    question: "I didn't receive my OTP during login. What should I do?",
    answer: "Please check that you have entered a valid 10-digit mobile number. If the OTP does not arrive within 2 minutes, verify your network connection and click 'Resend OTP'."
  },
  {
    question: "How do I get my pet's medical reports or prescriptions?",
    answer: "After a vet consultation, the digital prescription and medical summary are automatically uploaded and linked to the specific booking. You can view them under 'My Bookings' by selecting the completed appointment."
  },
  {
    question: "Is my payment data safe on the platform?",
    answer: "Yes, all transactions are processed securely through certified payment gateways. We do not store raw card details or banking credentials on our servers."
  },
  {
    question: "Who do I contact in case of a medical emergency?",
    answer: "If your pet needs urgent medical attention, please take them to the nearest animal clinic or emergency hospital immediately. Our services are for scheduled care and are not emergency medical services."
  },
  {
    question: "How do I rate a completed service?",
    answer: "Go to 'My Bookings', switch to 'Past' appointments, and click 'Review or Complain' on the booking card. This will open Ask Cano where you can submit a 1-5 star rating and comment."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const openAskCanoSupport = () => {
    window.dispatchEvent(
      new CustomEvent("open-ask-cano", {
        detail: { intent: "complain" },
      })
    );
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] px-4 py-8 md:py-16">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link 
          href="/bookings" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Bookings
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Frequently Asked Questions</h1>
          <p className="text-sm text-muted-foreground">
            Quick solutions to common queries regarding bookings, payments, and pet care.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3 mb-12">
          {FAQ_LIST.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className="bg-card rounded-2xl border border-border overflow-hidden transition-all duration-200 shadow-sm"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between text-left p-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors hover:bg-muted/30"
                >
                  <span className="font-semibold text-sm pr-4">{faq.question}</span>
                  <ChevronDown 
                    className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? "transform rotate-180" : ""
                    }`}
                  />
                </button>
                <div 
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-[300px] border-t border-border" : "max-h-0"
                  } overflow-hidden`}
                >
                  <p className="p-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Big Fallback Complaint CTA */}
        <div className="bg-primary/5 rounded-3xl border border-primary/20 p-6 text-center animate-fade-in-up">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold mb-2">Didn't find your related issue?</h2>
          <p className="text-xs text-muted-foreground mb-5 max-w-md mx-auto">
            If you have a specific complaint, issue, or feedback that is not covered above, get in touch with our team.
          </p>
          <button
            onClick={openAskCanoSupport}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold px-6 py-3 rounded-full transition-all duration-200 active:scale-95 shadow-md"
          >
            <Mail className="w-4 h-4" />
            Contact Ask Cano Support
          </button>
        </div>
      </div>
    </div>
  );
}
