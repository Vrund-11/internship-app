"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ArrowLeft, Loader2, Shield, Star, Heart, Check, X } from "lucide-react";
import { validateEmail, validatePassword } from "@canovet/shared";

const PawSvg = ({ color = "#fff", size = 48, className = "" }: { color?: string; size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 44 44" className={className}>
    <ellipse cx="12" cy="16" rx="4.2" ry="5.4" fill={color} />
    <ellipse cx="22" cy="11" rx="3.8" ry="4.8" fill={color} />
    <ellipse cx="32" cy="16" rx="4.2" ry="5.4" fill={color} />
    <ellipse cx="22" cy="6" rx="2.8" ry="3.4" fill={color} />
    <ellipse cx="22" cy="29" rx="9.5" ry="8.2" fill={color} />
  </svg>
);


type LoginStep = "credentials" | "forgot";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/home";
  const { login } = useAuth();

  const [step, setStep] = useState<LoginStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
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
      await login(email, password);
      router.push(redirect);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Login failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = validateEmail(forgotEmail);
    if (emailError) {
      setError(emailError);
      return;
    }

    try {
      setLoading(true);
      setError("");
      await api.post("/auth/forgot-password", { email: forgotEmail });
      setForgotSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to submit request.");
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
      {step === "credentials" && (
        <form onSubmit={handleCredentialsSubmit} className="space-y-5">
          <h1 className="font-extrabold text-3xl md:text-4xl text-foreground mb-1 text-center md:text-left tracking-tight">
            Welcome to Canovet
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mb-6 text-center md:text-left">
            Enter your credentials. If you are new, we will set up a new account for you.
          </p>

          <div className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                className="rounded-xl h-12 md:h-14 text-base px-4 border-muted-foreground/30 focus:border-[#FF10F0] focus:ring-1 focus:ring-[#FF10F0]"
                required
                autoFocus
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                className="rounded-xl h-12 md:h-14 text-base px-4 border-muted-foreground/30 focus:border-[#FF10F0] focus:ring-1 focus:ring-[#FF10F0]"
                required
              />
            </div>

            {/* Compact single-line password hint */}
            {password.length > 0 && (
              <p className="text-[11px] text-[#4A4A4A] bg-[#F8F8F8] rounded-xl px-3 py-2 border border-[#EDE4EB] animate-fade-in-up">
                <span className={passLength ? "text-[#FF10F0] font-semibold" : ""}>8+ chars</span>
                {" · "}
                <span className={passUpper ? "text-[#FF10F0] font-semibold" : ""}>Uppercase</span>
                {" · "}
                <span className={passLower ? "text-[#FF10F0] font-semibold" : ""}>Lowercase</span>
                {" · "}
                <span className={passNumber ? "text-[#FF10F0] font-semibold" : ""}>Number</span>
                {" · "}
                <span className={passSymbol ? "text-[#FF10F0] font-semibold" : ""}>Symbol</span>
              </p>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                setStep("forgot");
                setError("");
              }}
              className="text-sm font-semibold text-[#FF10F0] hover:opacity-80 transition-opacity"
            >
              Forgot Password?
            </button>
          </div>

          {error && (
            <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium border border-destructive/20 animate-shake">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full h-12 md:h-14 text-base md:text-lg font-bold shadow-elevated bg-[#FF10F0] hover:bg-[#FF10F0]/90 text-white transition-all border-none cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Connecting...
              </span>
            ) : (
              "Continue 🐾"
            )}
          </Button>


        </form>
      )}

      {step === "forgot" && (
        <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
          <h1 className="font-extrabold text-3xl md:text-4xl text-foreground mb-1 text-center md:text-left tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mb-6 text-center md:text-left">
            Enter your email and we&apos;ll send you a link to choose a new password.
          </p>

          {forgotSuccess ? (
            <div className="space-y-6 animate-fade-in-up">
              <div className="rounded-2xl bg-green-500/10 px-4 py-4 text-sm text-green-600 font-semibold border border-green-500/20 text-center">
                If an account exists with that email address, a password reset link has been sent. Check your inbox!
              </div>
              <Button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setForgotSuccess(false);
                  setForgotEmail("");
                }}
                className="w-full rounded-full h-12 md:h-14 text-base font-bold text-white bg-[#FF10F0] hover:bg-[#FF10F0]/90 transition-all"
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    if (error) setError("");
                  }}
                  className="rounded-xl h-12 md:h-14 text-base px-4 border-muted-foreground/30 focus:border-[#FF10F0] focus:ring-1 focus:ring-[#FF10F0]"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium border border-destructive/20">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-full h-12 md:h-14 text-base md:text-lg font-bold shadow-elevated bg-[#FF10F0] hover:bg-[#FF10F0]/90 text-white transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Sending...
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setError("");
                }}
                className="text-sm font-semibold text-muted-foreground flex items-center justify-center mx-auto hover:text-foreground transition-colors py-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to sign in
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );

  return (
    <>
      {/* ===== MOBILE VIEW (Glassmorphism layout) ===== */}
      <div className="md:hidden min-h-screen bg-background flex flex-col justify-center px-5 pt-safe pb-8">
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-elevated">
              <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
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

      {/* ===== DESKTOP VIEW (Premium split-screen) ===== */}
      <div className="hidden md:flex min-h-screen">
        {/* Left Side: Brand Showcase */}
        <div
          className="w-1/2 relative overflow-hidden flex flex-col justify-between p-12 lg:p-16"
          style={{
            background: "linear-gradient(160deg, #121212 0%, #390035 30%, #A7009D 70%, #FF10F0 100%)",
          }}
        >
          {/* Animated background elements */}
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
            <div
              className="absolute w-[300px] h-[300px] rounded-full"
              style={{
                top: "40%",
                left: "50%",
                background: "radial-gradient(circle, rgba(204,0,190,0.1) 0%, transparent 70%)",
                animation: "float-subtle 5s ease-in-out infinite 1s",
              }}
            />
            {/* Floating paw prints */}
            <div className="absolute top-[15%] left-[10%] opacity-[0.08]" style={{ animation: "particle-float 12s ease-in-out infinite" }}>
              <PawSvg color="#fff" size={40} />
            </div>
            <div className="absolute top-[35%] right-[15%] opacity-[0.06]" style={{ animation: "particle-float 15s ease-in-out infinite 2s" }}>
              <PawSvg color="#fff" size={60} />
            </div>
            <div className="absolute bottom-[25%] left-[20%] opacity-[0.07]" style={{ animation: "particle-float 10s ease-in-out infinite 4s" }}>
              <PawSvg color="#fff" size={35} />
            </div>
            <div className="absolute bottom-[15%] right-[25%] opacity-[0.05]" style={{ animation: "particle-float 18s ease-in-out infinite 1s" }}>
              <PawSvg color="#fff" size={80} />
            </div>
            {/* Decorative dot matrix */}
            <div className="absolute inset-0" style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }} />
          </div>

          {/* Top Brand */}
          <div className="relative z-10">
            <div className="flex items-center mb-8">
              <span className="text-[32px] font-extrabold text-white tracking-[-0.5px]">cano</span>
              <PawSvg color="#fff" size={32} />
              <span className="text-[32px] font-extrabold text-white tracking-[-0.5px]">et</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/[0.12] rounded-full px-4 py-2 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-[#A7FFD7] animate-blink" />
              <span className="text-[12px] font-bold text-white/90 tracking-[0.1em] uppercase">
                Premium Pet Care Platform
              </span>
            </div>
          </div>

          {/* Mid Header */}
          <div className="relative z-10 my-auto">
            <h2 className="text-[48px] lg:text-[56px] font-extrabold text-white leading-[1.1] tracking-[-1px] mb-6">
              Your pet deserves<br />
              <span className="text-white/60">the very best.</span>
            </h2>
            <p className="text-[18px] text-white/50 leading-[1.6] max-w-md">
              Grooming, veterinary care, premium food & accessories — all in one platform. Book in under 60 seconds.
            </p>
          </div>

          {/* Bottom Trust Info */}
          <div className="relative z-10 flex gap-6">
            {[
              { icon: Shield, label: "Verified Pros", value: "500+" },
              { icon: Star, label: "Average Rating", value: "4.9★" },
              { icon: Heart, label: "Happy Pets", value: "12K+" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.1] backdrop-blur-sm flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-white/80" />
                </div>
                <div>
                  <div className="text-[18px] font-extrabold text-white">{item.value}</div>
                  <div className="text-[11px] text-white/40 font-medium">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Authentication card */}
        <div className="w-1/2 flex items-center justify-center p-12 lg:p-16 bg-background relative">
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "radial-gradient(rgba(167,0,157,0.02) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }} />

          <div className="w-full max-w-md relative z-10">

            <div className="mb-8">
              <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-elevated animate-glow-pulse">
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

            <div className="mt-12 pt-6 border-t border-border/50">
              <p className="text-[12px] text-muted-foreground/60 leading-relaxed">
                By continuing, you agree to Canovet&apos;s Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
