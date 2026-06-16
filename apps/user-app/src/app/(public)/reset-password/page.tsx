"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Loader2, Check, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import { validatePassword } from "@canovet/shared";

const PawSvg = ({ color = "#fff", size = 48, className = "" }: { color?: string; size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 44 44" className={className}>
    <ellipse cx="12" cy="16" rx="4.2" ry="5.4" fill={color} />
    <ellipse cx="22" cy="11" rx="3.8" ry="4.8" fill={color} />
    <ellipse cx="32" cy="16" rx="4.2" ry="5.4" fill={color} />
    <ellipse cx="22" cy="6" rx="2.8" ry="3.4" fill={color} />
    <ellipse cx="22" cy="29" rx="9.5" ry="8.2" fill={color} />
  </svg>
);

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await api.post("/auth/verify-reset-token", { token });
        setTokenValid(res.data.valid);
      } catch (err) {
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passError = validatePassword(password);
    if (passError) {
      setError(passError);
      return;
    }

    try {
      setLoading(true);
      setError("");
      await api.post("/auth/reset-password", { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  // Real-time password check indicators
  const passLength = password.length >= 8;
  const passUpper = /[A-Z]/.test(password);
  const passLower = /[a-z]/.test(password);
  const passNumber = /[0-9]/.test(password);
  const passSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const formContent = (
    <div className="w-full">
      {verifying ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-semibold text-muted-foreground">Verifying secure link...</p>
        </div>
      ) : !tokenValid ? (
        <div className="text-center py-8 space-y-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive border border-destructive/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl text-foreground tracking-tight mb-2">Invalid or Expired Link</h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              This password reset link is invalid or has expired. Please request a new link from the login page.
            </p>
          </div>
          <Button
            onClick={() => router.push("/login")}
            className="rounded-full px-6 h-12 font-bold bg-primary text-white"
          >
            Back to Login
          </Button>
        </div>
      ) : success ? (
        <div className="text-center py-8 space-y-6 animate-fade-in-up">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500 border border-green-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl text-foreground tracking-tight mb-2">Password Reset Successful</h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Your password has been successfully updated. You can now log in using your new password.
            </p>
          </div>
          <Button
            onClick={() => router.push("/login")}
            className="w-full rounded-full h-12 md:h-14 text-base font-bold bg-gradient-to-r from-accent to-primary text-white"
          >
            Go to Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <h1 className="font-extrabold text-3xl text-foreground mb-1 text-center md:text-left tracking-tight">
            Create New Password
          </h1>
          <p className="text-sm text-muted-foreground mb-6 text-center md:text-left">
            Please choose a secure, strong password for your account.
          </p>

          <div className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                className="rounded-2xl h-12 md:h-14 text-base px-4 border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary"
                required
                autoFocus
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError("");
                }}
                className="rounded-2xl h-12 md:h-14 text-base px-4 border-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            {/* Interactive checklist */}
            {password.length > 0 && (
              <div className="p-4 bg-muted/40 rounded-2xl border border-border/50 text-xs space-y-2 animate-fade-in-up">
                <span className="font-semibold text-muted-foreground block mb-1">Password Strength Checklist:</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`flex items-center gap-1.5 ${passLength ? "text-green-500" : "text-muted-foreground/75"}`}>
                    {passLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passUpper ? "text-green-500" : "text-muted-foreground/75"}`}>
                    {passUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>Uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passLower ? "text-green-500" : "text-muted-foreground/75"}`}>
                    {passLower ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>Lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passNumber ? "text-green-500" : "text-muted-foreground/75"}`}>
                    {passNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>Number</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passSymbol ? "text-green-500" : "text-muted-foreground/75"}`}>
                    {passSymbol ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>Special character</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium border border-destructive/20">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full h-12 md:h-14 text-base md:text-lg font-bold shadow-elevated bg-gradient-to-r from-accent to-primary text-white"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Resetting...
              </span>
            ) : (
              "Save Password 🐾"
            )}
          </Button>
        </form>
      )}
    </div>
  );

  return (
    <>
      {/* MOBILE VIEW */}
      <div className="md:hidden min-h-screen bg-background flex flex-col justify-center px-4 pt-safe pb-8">
        <div className="w-full max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-elevated">
              <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
                <ellipse cx="24" cy="32" rx="10" ry="9" fill="white" opacity="0.95" />
                <ellipse cx="13" cy="22" rx="5" ry="6.5" fill="white" opacity="0.8" />
                <ellipse cx="35" cy="22" rx="5" ry="6.5" fill="white" opacity="0.8" />
                <ellipse cx="18" cy="15" rx="4" ry="5" fill="white" opacity="0.7" />
                <ellipse cx="30" cy="15" rx="4" ry="5" fill="white" opacity="0.7" />
              </svg>
            </div>
          </div>
          {formContent}
        </div>
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden md:flex min-h-screen">
        <div
          className="w-1/2 relative overflow-hidden flex flex-col justify-between p-12 lg:p-16"
          style={{
            background: "linear-gradient(160deg, #1a0a18 0%, #390035 25%, #A7009D 60%, #CC00BE 85%, #E040D0 100%)",
          }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute w-[500px] h-[500px] rounded-full animate-float-subtle"
              style={{
                top: "-15%",
                right: "-10%",
                background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
              }}
            />
            <div
              className="absolute w-[400px] h-[400px] rounded-full"
              style={{
                bottom: "-10%",
                left: "-15%",
                background: "radial-gradient(circle, rgba(167,255,215,0.06) 0%, transparent 70%)",
                animation: "float-subtle 6s ease-in-out infinite reverse",
              }}
            />
            {/* Paw prints */}
            <div className="absolute top-[15%] left-[10%] opacity-[0.08]" style={{ animation: "particle-float 12s ease-in-out infinite" }}>
              <PawSvg color="#fff" size={40} />
            </div>
            <div className="absolute bottom-[25%] left-[20%] opacity-[0.07]" style={{ animation: "particle-float 10s ease-in-out infinite 4s" }}>
              <PawSvg color="#fff" size={35} />
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center mb-8">
              <span className="text-[32px] font-extrabold text-white tracking-[-0.5px]">cano</span>
              <PawSvg color="#fff" size={32} />
              <span className="text-[32px] font-extrabold text-white tracking-[-0.5px]">et</span>
            </div>
          </div>

          <div className="relative z-10 my-auto">
            <h2 className="text-[48px] lg:text-[56px] font-extrabold text-white leading-[1.1] tracking-[-1px] mb-6">
              Create a secure<br />
              <span className="text-white/60">new password.</span>
            </h2>
            <p className="text-[18px] text-white/50 leading-[1.6] max-w-md">
              Ensure it satisfies all the required criteria to keep your pet and account details safe.
            </p>
          </div>
        </div>

        <div className="w-1/2 flex items-center justify-center p-12 bg-background relative animate-fade-in-right">
          <div className="w-full max-w-md relative z-10">
            {formContent}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
