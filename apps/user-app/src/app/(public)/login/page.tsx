"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ArrowLeft, Loader2 } from "lucide-react";

type LoginStep = "phone" | "otp" | "name";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/home";
  const { login, user, setUser } = useAuth();

  const [step, setStep] = useState<LoginStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhoneSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      await api.post("/auth/send-otp", { phone });
      setStep("otp");
    } catch {
      setError("Could not send OTP. Check the phone number and backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      const loggedInUser = await login(phone, otp);
      if (loggedInUser?.name?.trim()) {
        router.push(redirect);
        return;
      }
      setStep("name");
    } catch {
      setError("OTP verification failed. Use the test OTP 123456.");
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.patch("/auth/profile", { name: name.trim() });
      setUser(res.data);
      router.push(redirect);
    } catch {
      setError("Could not save name. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipName = () => {
    router.push(redirect);
  };

  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 pt-safe">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => {
            if (step === "otp") setStep("phone");
            else if (step === "name") router.push(redirect);
            else router.back();
          }}
          className="flex items-center gap-2 text-muted-foreground py-4 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <div className="pt-8 pb-12">
          {/* Paw icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-elevated">
              <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
                <ellipse cx="24" cy="32" rx="10" ry="9" fill="white" opacity="0.95"/>
                <ellipse cx="13" cy="22" rx="5" ry="6.5" fill="white" opacity="0.8"/>
                <ellipse cx="35" cy="22" rx="5" ry="6.5" fill="white" opacity="0.8"/>
                <ellipse cx="18" cy="15" rx="4" ry="5" fill="white" opacity="0.7"/>
                <ellipse cx="30" cy="15" rx="4" ry="5" fill="white" opacity="0.7"/>
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="font-serif text-3xl text-foreground mb-1 text-center">
            {step === "phone" && "Welcome to Canovet"}
            {step === "otp" && "Verify Your Number"}
            {step === "name" && "What's Your Name?"}
          </h1>
          <p className="text-sm text-muted-foreground mb-8 text-center">
            {step === "phone" && "Enter your phone number to continue"}
            {step === "otp" && `We sent a code to +91 ${phone}`}
            {step === "name" && "Let's get to know you better ❤️"}
          </p>

          {/* Phone Step */}
          {step === "phone" && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="flex gap-2">
                <div className="h-12 px-3 rounded-2xl bg-muted flex items-center text-sm font-medium text-foreground border border-border">
                  +91
                </div>
                <Input
                  type="tel"
                  placeholder="Enter mobile number"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  className="rounded-2xl h-12 text-base"
                  autoFocus
                />
              </div>
              <Button
                onClick={handlePhoneSubmit}
                disabled={phone.length !== 10 || loading}
                className="w-full rounded-full h-12 text-base font-semibold shadow-elevated"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</>
                ) : (
                  "Send OTP"
                )}
              </Button>
            </div>
          )}

          {/* OTP Step */}
          {step === "otp" && (
            <div className="space-y-4 animate-fade-in-up">
              <Input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="rounded-2xl h-12 text-center text-2xl tracking-[0.35em] font-bold"
                autoFocus
              />
              <Button
                onClick={handleOtpSubmit}
                disabled={otp.length !== 6 || loading}
                className="w-full rounded-full h-12 text-base font-semibold shadow-elevated"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying...</>
                ) : (
                  "Verify OTP"
                )}
              </Button>
              <button
                onClick={() => setStep("phone")}
                className="text-sm text-primary font-medium mx-auto block hover:opacity-80 transition-opacity"
              >
                Change number?
              </button>
            </div>
          )}

          {/* Name Step */}
          {step === "name" && (
            <div className="space-y-4 animate-fade-in-up">
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-2xl h-12 text-base text-center"
                autoFocus
              />
              <Button
                onClick={handleNameSubmit}
                disabled={name.trim().length === 0 || loading}
                className="w-full rounded-full h-12 text-base font-semibold shadow-elevated"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
                ) : (
                  "Let's Go! 🐾"
                )}
              </Button>
              <button
                onClick={handleSkipName}
                className="text-sm text-muted-foreground font-medium mx-auto block hover:text-foreground transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}

          {error ? (
            <div className="mt-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
