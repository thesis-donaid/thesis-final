"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, FormEvent, useEffect, useRef } from "react";
import { Mail, ShieldCheck, Timer, RefreshCcw, ArrowRight } from "lucide-react";
import { cn } from "@/components/ui/utils";

// Helper to get initial cooldown from localStorage
function getInitialCooldown(): number {
  if (typeof window === "undefined") return 0;
  const stored = localStorage.getItem("otpCooldown");
  if (stored) {
    const remaining = Math.floor((Number(stored) - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }
  return 0;
}

export default function VerifyOtp() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(getInitialCooldown);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        setLoading(false);
        return;
      }

      // Full page redirect to force session reload
      window.location.href = "/";
    } catch (err) {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  // Handle the countdown timer
  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Start the countdown timer
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          // Clear the timer and localStorage when countdown reaches 0
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          localStorage.removeItem("otpCooldown");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup the timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [cooldown]);


  const handleResend = async () => {
    if (cooldown > 0) return;

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    await signIn("google");

    const expiry = Date.now() + 120 * 1000;
    localStorage.setItem("otpCooldown", expiry.toString());
    setCooldown(120);
  };



  

  return (
    <div className="h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-md p-8 bg-white border border-red-100 rounded-2xl shadow-2xl shadow-red-500/10 space-y-8 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="p-3 bg-red-50 rounded-full mb-2">
            <ShieldCheck className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Check your email
          </h1>
          <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-full text-sm">
            <Mail className="w-4 h-4" />
            <span className="font-semibold">{email}</span>
          </div>
          <p className="text-sm text-balance text-gray-500 pt-2">
            We&#39;ve sent a 6-digit verification code to your inbox. 
            Please enter it below to securely sign in.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-center block text-gray-400 uppercase tracking-wider">
              Verification Code
            </label>
            <div className="flex justify-center">
              <Input
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                maxLength={6}
                className={cn(
                  "h-16 text-center text-4xl font-mono tracking-[0.5em] border-red-100 focus:border-red-500 focus:ring-red-500/20 transition-all duration-200",
                  error && "border-red-500 ring-red-500/20"
                )}
                required
                autoFocus
                autoComplete="one-time-code"
              />
            </div>
            {error && (
              <p className="text-red-600 text-sm font-medium text-center animate-bounce mt-2 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            loading={loading}
            disabled={code.length !== 6 || loading}
            className="w-full h-12 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 group relative overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? "Verifying..." : "Verify Identity"}
              {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </span>
          </Button>
        </form>

        <div className="pt-4 border-t border-gray-100 flex flex-col items-center space-y-4">
          <div className="flex items-center gap-4 w-full">
            <div className="h-[1px] flex-1 bg-gray-100" />
            <span className="text-[10px] uppercase font-bold text-gray-300 tracking-widest">or</span>
            <div className="h-[1px] flex-1 bg-gray-100" />
          </div>

          <Button
            variant="ghost"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className={cn(
              "w-full h-10 gap-2 transition-all duration-300",
              cooldown > 0 ? "text-gray-400 bg-gray-50 cursor-not-allowed" : "text-red-600 hover:bg-red-50 cursor-pointer"
            )}
          >
            {cooldown > 0 ? (
              <>
                <Timer className="w-4 h-4 animate-pulse" />
                <span>Resend in {cooldown}s</span>
              </>
            ) : (
              <>
                <RefreshCcw className={cn("w-4 h-4", isResending && "animate-spin")} />
                <span>Resend Code</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
