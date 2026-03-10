// /forgot-password/page.tsx
"use client";

import { useState } from "react";
import { Heart, Mail, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/forget-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong.");
                return;
            }

            setSent(true);
        } catch {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-red-50/20">
            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full mx-4"
                        initial={{ opacity: 0, y: -50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    >
                        <div className="bg-white border-l-4 border-red-600 rounded-lg p-4 shadow-2xl shadow-red-900/10 backdrop-blur-md">
                            <div className="flex items-start gap-3">
                                <div className="shrink-0 mt-0.5">
                                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{error}</p>
                                </div>
                                <button
                                    onClick={() => setError("")}
                                    className="shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10 w-full max-w-md px-4 py-8">
                <motion.div
                    className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(220,38,38,0.1)] overflow-hidden border border-red-50 p-8 md:p-12"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    {/* Header */}
                    <motion.div
                        className="mb-8 text-center"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800 hover:underline font-medium mb-4 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to Login
                        </Link>
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="bg-red-600 p-2 rounded-xl">
                                <Heart className="h-8 w-8 text-white fill-white" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">Puso Ng Ama</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password</h1>
                        <p className="text-sm text-gray-500">
                            Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
                        </p>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {!sent ? (
                            <motion.form
                                key="form"
                                onSubmit={handleSubmit}
                                className="space-y-5"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-gray-700 block">
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            className="w-full pl-12 py-4 border border-gray-200 focus:border-red-600 focus:ring-[3px] focus:ring-red-600/10 rounded-xl transition-all bg-white text-gray-900 font-medium placeholder-gray-400 outline-none"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-semibold rounded-xl transition-all duration-300 shadow-xl shadow-red-700/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(220, 38, 38, 0.4)" }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {loading ? "Sending..." : "Send Reset Link"}
                                    {!loading && <ArrowRight className="h-5 w-5" />}
                                </motion.button>
                            </motion.form>
                        ) : (
                            <motion.div
                                key="success"
                                className="text-center space-y-4"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div className="flex justify-center">
                                    <div className="bg-green-100 p-3 rounded-full">
                                        <CheckCircle className="h-10 w-10 text-green-600" />
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Check Your Email</h2>
                                <p className="text-sm text-gray-500">
                                    If an account with <strong>{email}</strong> exists, we&apos;ve sent a password reset link. Please check your inbox and spam folder.
                                </p>
                                <p className="text-xs text-gray-400">The link will expire in 1 hour.</p>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800 hover:underline font-medium mt-4 transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4" /> Back to Login
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
