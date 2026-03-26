"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const { login } = useAuth();
  const router = useRouter();

  const sendOTP = async () => {
    await api.post("/auth/send-otp", { phone });
    setStep("otp");
  };

  const verifyOTP = async () => {
    await login(phone, otp);
    router.push("/");
  };

  return (
    <div className="p-10">
      <h1>Login</h1>

      {step === "phone" && (
        <>
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button onClick={sendOTP}>Send OTP</button>
        </>
      )}

      {step === "otp" && (
        <>
          <input
            placeholder="OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button onClick={verifyOTP}>Verify OTP</button>
        </>
      )}
    </div>
  );
}
