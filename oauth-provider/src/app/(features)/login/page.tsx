// /login/page.tsx
"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Lock, ArrowRight, Heart, Phone, User, Eye, EyeClosed, Mail } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";

export default function LoginPage() {
    const [loginMode, setLoginMode] = useState<"beneficiary" | "donor">("donor");
    const [beneficiaryLoading, setBeneficiaryLoading] = useState(false);
    const [donorLoading, setDonorLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));
    const dragStartX = useRef(0);
    const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);
    const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Program carousel items
    const programs = useMemo(() => [
        {
            id: 1,
            title: "Educational Support",
            description: "Quality education for underprivileged children",
            image: "/images/educational_support_1772187215069.png",
            color: "from-red-600 to-red-800"
        },
        {
            id: 2,
            title: "Health & Wellness",
            description: "Medical assistance and health programs",
            image: "/images/health_wellness_1772187277594.png",
            color: "from-red-600 to-red-800"
        },
        {
            id: 3,
            title: "Community Development",
            description: "Building stronger communities together",
            image: "/images/community_development_1772187291365.png",
            color: "from-red-600 to-red-800"
        },
        {
            id: 4,
            title: "Youth Empowerment",
            description: "Empowering young leaders and innovators",
            image: "/images/youth_empowerment_1772187330023.png",
            color: "from-red-600 to-red-800"
        }
    ], []);

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % programs.length);
    }, [programs.length]);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + programs.length) % programs.length);
    }, [programs.length]);

    const resetAutoPlay = useCallback(() => {
        if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
        autoPlayTimer.current = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % programs.length);
        }, 5000);
    }, [programs.length]);

    // Preload images for next and previous slides
    useEffect(() => {
        const preloadIndex = (currentSlide + 1) % programs.length;
        if (!loadedImages.has(preloadIndex)) {
            const img = new window.Image();
            img.src = programs[preloadIndex].image;
            img.onload = () => {
                setLoadedImages(prev => new Set([...prev, preloadIndex]));
            };
        }
    }, [currentSlide, loadedImages, programs]);

    // Auto-play carousel infinitely
    useEffect(() => {
        resetAutoPlay();
        return () => {
            if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
        };
    }, [resetAutoPlay]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") nextSlide();
            if (e.key === "ArrowLeft") prevSlide();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [nextSlide, prevSlide]);

    // Handle drag/swipe
    const handleDragStart = (e: React.MouseEvent) => {
        dragStartX.current = e.clientX;
        if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };

    const handleDragEnd = (e: React.MouseEvent) => {
        const dragEndX = e.clientX;
        const diff = dragStartX.current - dragEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) nextSlide();
            else prevSlide();
        }
        resetAutoPlay();
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        await signIn("google", { callbackUrl: "/dashboard" });
    };

    const handleDonorLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setDonorLoading(true);
        try {
            const res = await fetch('/api/auth/donor-login', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                const errorMsg = data.error || "Login failed";
                setError(errorMsg);
                if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
                errorTimeoutRef.current = setTimeout(() => setError(""), 5000);
                return;
            }

            window.location.href = "/";
        } catch {
            setError("An error occurred. Please try again.");
            if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
            errorTimeoutRef.current = setTimeout(() => setError(""), 5000);
        } finally {
            setDonorLoading(false);
        }
    };

    const handleBeneficiaryLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setBeneficiaryLoading(true);
        // Handle form submission
        try {
            const res = await fetch('/api/auth/login', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            })

            const data = await res.json();

            if (!res.ok) {
                const errorMsg = data.error || "Login failed";
                setError(errorMsg);
                if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
                errorTimeoutRef.current = setTimeout(() => setError(""), 5000);
                return;
            }

            window.location.href = "/";
        } catch {
            setError("An error occurred. Please try again.");
            if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
            errorTimeoutRef.current = setTimeout(() => setError(""), 5000);
        } finally {
            setBeneficiaryLoading(false);
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
                                <motion.button
                                    onClick={() => setError("")}
                                    className="shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            



            {/* Content */}
            <div className="relative z-10 w-full max-w-6xl px-4 py-8">
                <motion.div 
                    className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(220,38,38,0.1)] overflow-hidden border border-red-50"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <div className="grid lg:grid-cols-2 shadow-lg">
                        {/* Left Column - Login Form */}
                        <div className="p-8 md:p-12">
                            {/* Logo and Header with Go to Home */}
                            <motion.div 
                                className="mb-8 text-center lg:text-left"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                            >
                                <motion.a 
                                    href="/"
                                    className="inline-block text-sm text-red-600 hover:text-red-800 hover:underline font-medium mb-4 transition-colors"
                                    whileHover={{ x: -2 }}
                                >
                                    ← Go to home
                                </motion.a>
                                <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                                    <motion.div 
                                        className="bg-red-600 p-2 rounded-xl"
                                        whileHover={{ scale: 1.1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Heart className="h-8 w-8 text-white fill-white" />
                                    </motion.div>
                                    <span className="text-2xl font-bold text-gray-900">Puso Ng Ama</span>
                                </div>
                                <motion.h1 
                                    className="text-3xl font-bold text-gray-900 mb-2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.6 }}
                                >
                                    Sign In
                                </motion.h1>
                            </motion.div>

                            {/* Login Mode Tabs */}
                            <motion.div
                                className="flex bg-gray-100 rounded-xl p-1 mb-6"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25, duration: 0.5 }}
                            >
                                <button
                                    type="button"
                                    onClick={() => { setLoginMode("donor"); setError(""); }}
                                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                        loginMode === "donor"
                                            ? "bg-white text-red-700 shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    Donor
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setLoginMode("beneficiary"); setError(""); }}
                                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                        loginMode === "beneficiary"
                                            ? "bg-white text-red-700 shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    Beneficiary
                                </button>
                            </motion.div>

                            {/* Login Form */}
                            <AnimatePresence mode="wait">
                            {loginMode === "beneficiary" ? (
                            <motion.form
                                key="beneficiary-form" 
                                onSubmit={handleBeneficiaryLogin} 
                                className="space-y-5"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <p className="text-sm text-gray-500">
                                    Login as Beneficiary
                                </p>

                                <div className="space-y-2">
                                    <label htmlFor="username" className="text-sm font-medium text-gray-700 block">
                                        Username
                                    </label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                                        <motion.input
                                            id="username"
                                            type="text"
                                            placeholder="Enter your username"
                                            className="w-full pl-12 py-4 border border-gray-200 focus:border-red-600 focus:ring-[3px] focus:ring-red-600/10 rounded-xl transition-all bg-white text-gray-900 font-medium placeholder-gray-400 outline-none"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                            whileFocus={{ scale: 1.01 }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="ben-password" className="text-sm font-medium text-gray-700 block">
                                            Password
                                        </label>
                                        <motion.a 
                                            href="/forgot-password" 
                                            className="text-sm text-red-600 hover:text-red-800 hover:underline font-medium"
                                            whileHover={{ x: 2 }}
                                        >
                                            Forgot Password?
                                        </motion.a>
                                    </div>

                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                                        <motion.input
                                            id="ben-password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            className="w-full pl-12 py-4 pr-12 border border-gray-200 focus:border-red-600 focus:ring-[3px] focus:ring-red-600/10 rounded-xl transition-all bg-white text-gray-900 font-medium placeholder-gray-400 outline-none"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            whileFocus={{ scale: 1.01 }}
                                        />

                                        <motion.button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-600 focus:outline-none transition-colors"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            {showPassword ? <Eye size={20}/> : <EyeClosed size={20}/>}
                                        </motion.button>
                                    </div>
                                </div>

                                <motion.button
                                    type="submit"
                                    disabled={beneficiaryLoading}
                                    className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-semibold rounded-xl transition-all duration-300 shadow-xl shadow-red-700/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(220, 38, 38, 0.4)" }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {beneficiaryLoading ? "Signing In..." : "Sign In"}
                                    {!beneficiaryLoading && <ArrowRight className="h-5 w-5" />}
                                </motion.button>
                            </motion.form>
                            ) : (
                            <motion.form
                                key="donor-form"
                                onSubmit={handleDonorLogin}
                                className="space-y-5"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <p className="text-sm text-gray-500">
                                    Login as Registered Donor
                                </p>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-gray-700 block">
                                        Email
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                                        <motion.input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            className="w-full pl-12 py-4 border border-gray-200 focus:border-red-600 focus:ring-[3px] focus:ring-red-600/10 rounded-xl transition-all bg-white text-gray-900 font-medium placeholder-gray-400 outline-none"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            whileFocus={{ scale: 1.01 }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label htmlFor="donor-password" className="text-sm font-medium text-gray-700 block">
                                            Password
                                        </label>
                                    </div>

                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                                        <motion.input
                                            id="donor-password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            className="w-full pl-12 py-4 pr-12 border border-gray-200 focus:border-red-600 focus:ring-[3px] focus:ring-red-600/10 rounded-xl transition-all bg-white text-gray-900 font-medium placeholder-gray-400 outline-none"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            whileFocus={{ scale: 1.01 }}
                                        />

                                        <motion.button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-600 focus:outline-none transition-colors"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            {showPassword ? <Eye size={20}/> : <EyeClosed size={20}/>}
                                        </motion.button>
                                    </div>
                                </div>

                                <motion.button
                                    type="submit"
                                    disabled={donorLoading}
                                    className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-semibold rounded-xl transition-all duration-300 shadow-xl shadow-red-700/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(220, 38, 38, 0.4)" }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {donorLoading ? "Signing In..." : "Sign In"}
                                    {!donorLoading && <ArrowRight className="h-5 w-5" />}
                                </motion.button>

                                {/* Divider */}
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-100"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-white text-gray-400 font-medium">Or continue with</span>
                                    </div>
                                </div>

                                {/* Google Sign In */}
                                <motion.button
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    disabled={googleLoading}
                                    className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-white border border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50/50 hover:text-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm text-gray-700 font-medium"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span className="text-gray-700 font-semibold group-hover:text-red-700 transition-colors">
                                        {googleLoading ? "Redirecting..." : "Continue with Google"}
                                    </span>
                                </motion.button>

                                
                                <p className="w-full text-center">
                                    Don&apos;t have an account yet? {" "}
                                    <span>
                                        <Link href={"/signup"} className="text-red-500 hover:underline"> 
                                            Sign Up
                                        </Link>
                                    </span>
                                </p>
                            </motion.form>
                            )}
                            </AnimatePresence>

                            {/* Mobile-only contact info */}
                            <motion.div 
                                className="mt-8 pt-6 border-t border-gray-200 lg:hidden text-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.6 }}
                            >
                                <p className="text-sm text-gray-600">
                                    Need help? Contact us at{" "}
                                    <a href="tel:+1234567890" className="text-red-600 font-medium">
                                        (123) 456-7890
                                    </a>
                                </p>
                            </motion.div>
                        </div>

                        {/* Right Column - Program Carousel */}
                        <div className="hidden lg:flex relative bg-red-800 p-12 text-white flex-col overflow-hidden">
                            {/* Decorative Pattern */}
                            <div className="absolute inset-0 opacity-5">
                                <div className="absolute top-0 left-0 w-[40rem] h-[40rem] border border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                                <div className="absolute bottom-0 right-0 w-[50rem] h-[50rem] border border-white rounded-full translate-x-1/3 translate-y-1/3"></div>
                            </div>

                            {/* Carousel Content */}
                            <motion.div
                                className="relative z-10 flex flex-col h-full"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                            >
                                {/* Carousel Image with Description Overlay */}
                                <div 
                                    className="flex-1 relative rounded-2xl overflow-hidden mb-8 shadow-2xl cursor-grab active:cursor-grabbing bg-gray-800"
                                    onMouseDown={handleDragStart}
                                    onMouseUp={handleDragEnd}
                                >
                                    {/* Loading Skeleton */}
                                    {!loadedImages.has(currentSlide) && (
                                        <div className="absolute inset-0 bg-linear-to-r from-gray-700 via-gray-600 to-gray-700 animate-pulse" />
                                    )}
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentSlide}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="absolute inset-0"
                                        >
                                            <Image
                                                src={programs[currentSlide].image}
                                                alt={programs[currentSlide].title}
                                                fill
                                                className="object-cover"
                                                priority={currentSlide === 0}
                                                draggable={false}
                                                unoptimized={true}
                                                sizes="(max-width: 1024px) 100vw, 50vw"
                                                onLoad={() => {
                                                    setLoadedImages(prev => new Set([...prev, currentSlide]));
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-red-950/90 via-red-900/40 to-transparent"></div>
                                            
                                            {/* Text Overlay at Bottom */}
                                            <motion.div 
                                                className="absolute bottom-0 left-0 right-0 p-6"
                                                key={`overlay-${currentSlide}`}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ duration: 0.4 }}
                                            >
                                                <h2 className="text-3xl font-bold mb-2">
                                                    {programs[currentSlide].title}
                                                </h2>
                                                <p className="text-white/90 font-light text-base leading-relaxed">
                                                    {programs[currentSlide].description}
                                                </p>
                                            </motion.div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Navigation Controls */}
                                <div className="flex justify-center">
                                    {/* Carousel Indicators */}
                                    <div className="flex gap-2">
                                        {programs.map((_, index) => (
                                            <motion.button
                                                key={index}
                                                onClick={() => {
                                                    setCurrentSlide(index);
                                                    resetAutoPlay();
                                                }}
                                                className={`h-2 rounded-full transition-all ${
                                                    index === currentSlide 
                                                        ? 'bg-white w-8 shadow-[0_0_10px_rgba(255,255,255,0.5)]' 
                                                        : 'bg-white/30 w-2 hover:bg-white/50'
                                                }`}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <motion.div 
                                    className="mt-8 pt-8 border-t border-white/30"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5, duration: 0.6 }}
                                >
                                    <div className="flex items-center gap-3 text-red-100">
                                        <Phone className="h-5 w-5" />
                                        <span>Need assistance? Call us at (123) 456-7890</span>
                                    </div>
                                    <p className="text-sm text-red-100 mt-3">
                                        or email{" "}
                                        <a href="mailto:support@pusongama.org" className="underline hover:text-white font-medium transition-colors">
                                            support@pusongama.org
                                        </a>
                                    </p>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Credit (Optional) */}
            <motion.div 
                className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-sm z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
            >
                © 2024 Puso Ng Ama Foundation Inc. All rights reserved.
            </motion.div>
        </div>
    );
}