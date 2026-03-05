"use client"

import { Label } from "@/components/ui/label";
import { motion,AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle, Eye, EyeClosed, Heart, Lock, Mail, User, XCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function SignUp() {
    const [form ,setForm] = useState({ 
        name: "", 
        email: "",
        password: "",
        confirmedPassword: ""
    })
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [loading, setLoading] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();


    const checkPasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 6) strength += 1;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1;
        if (password.match(/[0-9]/)) strength += 1;
        if (password.match(/[^a-zA-Z0-9]/)) strength += 1;
        setPasswordStrength(strength);
    }

    const getPasswordStrengthColor = () => {
        switch(passwordStrength) {
            case 0: return "bg-gray-200";
            case 1: return "bg-red-500";
            case 2: return "bg-orange-500";
            case 3: return "bg-yellow-500";
            case 4: return "bg-green-500";
            default: return "bg-gray-200";
        }
    }



    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

        const { name, value } = e.target;
        setForm({ ...form, [name]: value });

        // Check password strength when password field changes
        if (name === "password") {
            checkPasswordStrength(value);
        }

    }

    const handleSubmit = async(e: React.FormEvent) => {
        e.preventDefault();
        setError("");


        if (form.password !== form.confirmedPassword) {
            setError("Password do not match");
            return;
        }

        if (form.password.length < 6) {
            setError("Password must be at least 6 characteres");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: {'Content-Type':"application/json"},
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong");
                setLoading(false);
                return;
            }

            // Auto sign-in after successful signup
            const loginRes = await fetch("/api/auth/donor-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                }),
            });

            if (!loginRes.ok) {
                // Account created but auto-login failed, redirect to sign in
                router.push("/login");
            } else {
                window.location.href = "/";
            }
        } catch {
            setError("Something went wrong")
        } finally {
            setLoading(false);
        }

    }

    const handleGoogleSignIn = async () => {
        setRedirecting(true);
        await signIn("google");
    }

    
    

    return(
        <div className="relative h-screen flex items-center justify-center overflow-hidden bg-red-50/20">
            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full mx-4"
                        initial={{ opacity: 0, y: -50, scale: 0.95 }}
                        animate= {{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.23, 1,0.32, 1] }}
                    >
                        <div className="bg-white border-l-4 border-red-600 rounde-lg p-4 shadow-2xl shadow-red-900/10 backdrop-blur-md">
                            <div className="flex items-start gap-3">
                                <div className="shrink-0 mt-0.5">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{error}</p>
                                </div>
                                <motion.button
                                    onClick={() => setError("")}
                                    className="shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    
                                >
                                    <XCircle className="w-5 h-5"/>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
                {redirecting && (
                    <motion.div
                        className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full mx-4"
                        initial={{ opacity: 0, y: -50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    >
                        <div className="bg-white border-l-4 border-green-600 rounded-lg p-4 shadow-2xl shadow-green-900/10 backdrop-blur-md">
                            <div className="flex items-start gap-3">
                                <div className="shrink-0 mt-0.5">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">Account created successfully! Redirecting...</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content - Centered Single column */}
            <div className="relative z-10 w-full max-w-md px-4">
                <motion.div
                    className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(220,38,38,0.1)] overflow-idden border border-red-50"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <div className="p-8 md:p-10 max-h-[calc(100vh-4rem)] overflow-y-auto">
                        {/* Logo and Header */}
                        <motion.div
                            className="mb-6"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                        >
                            {/* <motion.a
                                href="/"
                                className="text-red-600 hover:text-red-800 hover:underline font-medium mb-3 transition-colors"
                                whileHover={{ x: -2 }}
                            >
                                ← Go to home
                            </motion.a> */}

                            <div className="flex items-center justify-center gap-2 mb-3">
                                <motion.div 
                                    className="rounded-xl"
                                    whileHover={{ scale: 1.1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Image width={40} height={40} src={"/logo.jpg"} alt="logo"/>
                                </motion.div>
                                <span className="text-xl font-bold text-gray-900">Puso Ng Ama</span>
                            </div>
                            <motion.h1
                                className="text-2xl font-bold text-gray-900 mb-1"
                                initial= {{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                            >   
                                Create Account
                            </motion.h1>
                            <motion.p
                                className="text-sm text-gray-500"
                                initial= {{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                            >
                                Be one of our Donor.
                            </motion.p>


                        </motion.div>


                        {/* Sign Up Form */}
                        <motion.form
                            className="space-y-4"
                            onSubmit={handleSubmit}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                        >
                            {/* Name Field */}
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-sm font-medium text-gray-700 block">
                                    Full Name <span className="text-gray-400 font-normal">(Optional)</span>
                                </Label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors"/>
                                    <motion.input
                                        id="name"
                                        type="text"
                                        name="name"
                                        onChange={handleChange}
                                        value={form.name}
                                        className="w-full pl-9 py-3 border border-gray-200 focus:border-red-600 focus:ring-[3px] focus:ring-red-600/10 rounded-xl transition-all bg-white text-gray-900 text-sm placeholder-gray-400 outline-none"                           placeholder="John Doe"
                                        whileFocus={{ scale: 1.01 }}
                                    />
                                </div>
                            </div>

                            {/* Email Field */}
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700 block">
                                    Email Address
                                </Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                                    <motion.input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        onChange={handleChange}
                                        value={form.email}
                                        className="w-full pl-9 py-3 border border-gray-200 focus:border-red-600 focus:ring-[3px] focus:ring-red-600/10 rounded-xl transition-all bg-white text-gray-900 text-sm placeholder-gray-400 outline-none"
                                        placeholder="you@example.com"
                                        whileFocus={{ scale: 1.01 }}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700 block">
                                    Password
                                </Label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                                    <motion.input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={form.password}
                                        onChange={handleChange}
                                        className="w-full pl-9 py-3 pr-10 border border-gray-200 focus:border-red-600 focus:ring-[3px] focus:ring-red-600/10 rounded-xl transition-all bg-white text-gray-900 text-sm placeholder-gray-400 outline-none"
                                        placeholder="At least 6 characters"
                                        required
                                        whileFocus={{ scale: 1.01 }}
                                    />
                                    <motion.button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-600 focus:outline-none transition-colors"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        {showPassword ? <Eye size={16}/> : <EyeClosed size={16}/>}
                                    </motion.button>
                                </div>

                                {/* Password Strength Indicator */}
                                {form.password && (
                                    <motion.div 
                                        className="mt-1.5"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className="flex gap-1 h-1">
                                            {[1, 2, 3, 4].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`flex-1 rounded-full transition-all duration-300 ${
                                                        level <= passwordStrength 
                                                            ? getPasswordStrengthColor() 
                                                            : "bg-gray-200"
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {passwordStrength === 0 && "Enter a password"}
                                            {passwordStrength === 1 && "Weak password"}
                                            {passwordStrength === 2 && "Fair password"}
                                            {passwordStrength === 3 && "Good password"}
                                            {passwordStrength === 4 && "Strong password"}
                                        </p>
                                    </motion.div>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 block">
                                    Confirm Password
                                </Label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                                    <motion.input
                                        id="confirmPassword"
                                        name="confirmedPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={form.confirmedPassword}
                                        onChange={handleChange}
                                        className="w-full pl-9 py-3 pr-10 border border-gray-200 focus:border-red-600 focus:ring-[3px] focus:ring-red-600/10 rounded-xl transition-all bg-white text-gray-900 text-sm placeholder-gray-400 outline-none"
                                        placeholder="Repeat your password"
                                        required
                                        whileFocus={{ scale: 1.01 }}
                                    />
                                    {form.confirmedPassword && (
                                        <motion.div 
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                        >
                                            {form.password === form.confirmedPassword ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <motion.button
                                type="submit"
                                disabled={loading || redirecting}
                                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-semibold rounded-xl transition-all duration-300 shadow-xl shadow-red-700/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(220, 38, 38, 0.4)" }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {loading ? "Creating Account..." : redirecting ? "Redirecting..." : "Sign Up"}
                                {!loading && !redirecting && <ArrowRight className="h-4 w-4" />}
                            </motion.button>

                            {/* Divider */}
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-100"></div>
                                </div>
                                <div className="relative flex items-center justify-center text-xs">
                                    <hr className="flex-1 text-gray-400"/>
                                    <span className="px-3 text-gray-400 font-medium">Or continue with</span>
                                    <hr className="flex-1 text-gray-400"/>
                                </div>
                            </div>

                            {/* Google Sign Up */}
                            <motion.button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={redirecting}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50/50 hover:text-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm text-gray-700 font-medium text-sm"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="text-gray-700 font-semibold group-hover:text-red-700 transition-colors">
                                    {redirecting ? "Redirecting..." : "Google"}
                                </span>
                            </motion.button>

                            {/* Sign In Link */}
                            <p className="w-full text-center text-xs text-gray-600 pt-2">
                                Already have an account? {" "}
                                <Link href="/login" className="text-red-600 hover:text-red-800 hover:underline font-medium">
                                    Sign in
                                </Link>
                            </p>
                        </motion.form>
                    </div>


                </motion.div>
            </div>
        </div>
    )
}