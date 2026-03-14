"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SessionData } from "@/types/session";
import { toTitleCase } from "@/utils/stringUtils";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion";
import { 
    Heart, 
    Mail, 
    PhilippinePeso, 
    ShieldCheck, 
    MessageSquare, 
    ArrowRight,
    ArrowLeft,
    Check,
    Smartphone,
    QrCode,
    Globe,
    CreditCard,
    Eye,
    EyeOff,
    Gift,
    Target,
    Sparkles,

    Copy,
} from "lucide-react";

type Pool = {
    id: string;
    name: string;
    description: string;
    status: "ACTIVE"
}

type DonationResponse = {
    success: boolean;
    checkout_url: string;
    reference_code: string;
}

const STEPS = [
    { id: 1, label: "Type" },
    { id: 2, label: "Amount" },
    { id: 3, label: "Details" },
    { id: 4, label: "Payment" },
    { id: 5, label: "Review" },
];

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

const PAYMENT_METHODS = [
    { 
        id: "gcash", 
        name: "GCash", 
        icon: Smartphone,
        color: "bg-blue-500",
        description: "Pay with your GCash wallet",
        fee: "2%-2.5% transaction fee",
        fees: 0.025
    },
    { 
        id: "paymaya", 
        name: "Maya", 
        icon: CreditCard,
        color: "bg-green-500",
        description: "Pay with your Maya account",
        fee: "1%-2% transaction fee",
        fees: 0.02
    },
    // { 
    //     id: "qrph", 
    //     name: "QR Ph", 
    //     icon: QrCode,
    //     color: "bg-purple-500",
    //     description: "Scan QR code to pay",
    //     fee: "1%-1.5% transaction fee",
    //     fees: 0.015
    // },
    { 
        id: "card", 
        name: "Credit Card", 
        icon: Globe,
        color: "bg-indigo-500",
        description: "Pay with Card",
        fee: "3%-3.5% + ₱13-₱15 transaction fee",
        fees: 0.035,
        extraFee: 15,
    },
];

export default function DonationPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [response, setResponse] = useState<DonationResponse | null>(null);
    const [pools, setPools] = useState<Pool[]>([]);
    const [copied, setCopied] = useState(false);
    const [total, setTotal] = useState();
    
    const [formData, setFormData] = useState({
        email: "",
        amount: 0,
        donation_type: "unrestricted",
        pool_id: "",
        message: "",
        is_anonymous: true,
        payment_method: "",
    });

    useSession();

    useEffect(() => {
        const init = async () => {
            try {
                const sessionRes = await fetch("/api/auth/session-check");
                const sessionData: SessionData = await sessionRes.json();
                if (sessionData.authenticated && sessionData.user?.email) {
                    setFormData(prev => ({ ...prev, email: sessionData.user!.email! }));
                }

                const poolsRes = await fetch("/api/pools/get");
                const poolsData = await poolsRes.json();
                setPools(poolsData);
                
                const unrestrictedPool = poolsData.find((p: Pool) => p.name.toLowerCase() === "unrestricted");
                if (unrestrictedPool) {
                    setFormData(prev => ({ ...prev, pool_id: unrestrictedPool.id }));
                }
            } catch (err) {
                console.error("Initialization error:", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleDonationTypeChange = (newType: string) => {
        if (newType === "unrestricted") {
            const unrestrictedPool = pools?.find(p => p.name.toLowerCase() === "unrestricted");
            setFormData(prev => ({ 
                ...prev, 
                donation_type: newType,
                pool_id: unrestrictedPool?.id || "" 
            }));
        } else {
            const restrictedPool = pools?.find(p => p.name.toLowerCase() !== "unrestricted");
            setFormData(prev => ({ 
                ...prev, 
                donation_type: newType,
                pool_id: restrictedPool?.id || "" 
            }));
        }
    };

    const canProceed = (): boolean => {
        switch (currentStep) {
            case 1: return !!formData.donation_type;
            case 2: return formData.amount >= 1;
            case 3: return !formData.email || !!formData.email;
            case 4: return !!formData.payment_method;
            case 5: return true;
            default: return false;
        }
    };

    const nextStep = () => {
        if (canProceed() && currentStep < 5) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError("");
        
        try {
            const res = await fetch("/api/donation/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    amount: formData.amount,
                    donation_type: formData.donation_type,
                    pool_id: formData.donation_type === "restricted" ? formData.pool_id : undefined,
                    message: formData.message,
                    is_anonymous: formData.is_anonymous,
                    payment_method: formData.payment_method,
                }),
            });

            const data = await res.json();
            if(!res.ok) {
                setError(data.error || "Something went wrong");
            } else {
                setResponse(data);
            }
        } catch {
            setError("Failed to connect to API");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(response?.reference_code || "");
            setCopied(true);
            // Reset the icon back to the copy icon after 2 seconds
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Preparing the donation platform...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans pt-20">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-red-50 to-transparent pointer-events-none" />
            <div className="absolute top-20 right-[-10%] w-96 h-96 bg-red-100/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-20 left-[-5%] w-72 h-72 bg-red-100/20 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-semibold mb-4 tracking-wide">
                        <Heart className="w-4 h-4 mr-2" />
                        EVERY PESO COUNTS
                    </span>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight">
                        Make a <span className="text-red-600">Donation</span>
                    </h1>
                    <p className="max-w-lg mx-auto text-gray-500 text-sm leading-relaxed">
                        Complete the steps below to make your generous contribution to our cause.
                    </p>
                </motion.div>

                {/* Step Indicator */}
                <div className="mb-10">
                    <div className="flex items-center justify-between relative">
                        {/* Progress Line */}
                        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 mx-10" />
                        <div 
                            className="absolute top-5 left-0 h-0.5 bg-red-500 mx-10 transition-all duration-500"
                            style={{ width: `calc(${((currentStep - 1) / (STEPS.length - 1)) * 100}% - 5rem)` }}
                        />

                        {STEPS.map((step) => (
                            <div key={step.id} className="flex flex-col items-center relative z-10">
                                <motion.div 
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                        currentStep > step.id 
                                            ? "bg-red-600 text-white shadow-lg shadow-red-200" 
                                            : currentStep === step.id 
                                                ? "bg-red-600 text-white shadow-lg shadow-red-200 ring-4 ring-red-100" 
                                                : "bg-white text-gray-400 border-2 border-gray-200"
                                    }`}
                                    animate={currentStep === step.id ? { scale: [1, 1.1, 1] } : {}}
                                    transition={{ duration: 0.3 }}
                                >
                                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                                </motion.div>
                                <span className={`mt-2 text-xs font-bold transition-colors ${
                                    currentStep >= step.id ? "text-red-600" : "text-gray-400"
                                }`}>
                                    {step.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content Card */}
                <motion.div 
                    className="bg-white rounded-3xl shadow-xl shadow-red-900/5 border border-red-50 p-8 md:p-10 min-h-[400px] flex flex-col"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <AnimatePresence mode="wait">
                        {/* STEP 1: Donation Type */}
                        {currentStep === 1 && (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1"
                            >
                                <div className="mb-8">
                                    <h2 className="text-2xl font-black text-gray-900 mb-2">Choose Donation Type</h2>
                                    <p className="text-gray-500 text-sm">Select how you would like your donation to be used.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div
                                        onClick={() => handleDonationTypeChange("unrestricted")}
                                        className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-md ${
                                            formData.donation_type === "unrestricted"
                                                ? "border-red-500 bg-red-50/50 shadow-md shadow-red-100"
                                                : "border-gray-200 bg-white hover:border-red-200"
                                        }`}
                                    >
                                        {formData.donation_type === "unrestricted" && (
                                            <div className="absolute top-4 right-4 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                                            <Gift className="w-6 h-6 text-red-600" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-1">General Funds</h3>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            Your donation will be allocated where it is needed the most by the foundation.
                                        </p>
                                    </div>

                                    <div
                                        onClick={() => handleDonationTypeChange("restricted")}
                                        className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-md ${
                                            formData.donation_type === "restricted"
                                                ? "border-red-500 bg-red-50/50 shadow-md shadow-red-100"
                                                : "border-gray-200 bg-white hover:border-red-200"
                                        }`}
                                    >
                                        {formData.donation_type === "restricted" && (
                                            <div className="absolute top-4 right-4 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                                            <Target className="w-6 h-6 text-red-600" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-1">Program Funds</h3>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            Choose a specific program or cause for your donation to support directly.
                                        </p>
                                    </div>
                                </div>

                                {formData.donation_type === "restricted" && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="mt-6"
                                    >
                                        <Label className="text-sm font-bold text-gray-700 mb-2 block">Select Program</Label>
                                        <select
                                            value={formData.pool_id}
                                            onChange={(e) => setFormData({ ...formData, pool_id: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 h-12 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-300 outline-none transition-all"
                                        >
                                            {pools.filter(pool => pool.name.toLowerCase() !== "unrestricted").map((pool) => (
                                                <option key={pool.id} value={pool.id}>
                                                    {toTitleCase(pool.name)}
                                                </option>
                                            ))}
                                        </select>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {/* STEP 2: Amount */}
                        {currentStep === 2 && (
                            <motion.div 
                                key="step2"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1"
                            >
                                <div className="mb-8">
                                    <h2 className="text-2xl font-black text-gray-900 mb-2">Set Your Amount</h2>
                                    <p className="text-gray-500 text-sm">Choose a preset amount or enter a custom value. No Minimum Amount.</p>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    {QUICK_AMOUNTS.map((amount) => (
                                        <button
                                            key={amount}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, amount }))}
                                            className={`h-14 rounded-xl font-bold text-sm transition-all duration-200 ${
                                                formData.amount === amount
                                                    ? "bg-red-600 text-white shadow-lg shadow-red-200 scale-105"
                                                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-red-300 hover:bg-red-50"
                                            }`}
                                        >
                                            ₱{amount.toLocaleString()}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-gray-700 flex items-center">
                                        <PhilippinePeso className="w-4 h-4 mr-2 text-red-500" />
                                        Custom Amount
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₱</span>
                                        <Input 
                                            value={formData.amount || ""}
                                            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                            type="number" 
                                            min={1}
                                            className="bg-gray-50 border border-gray-200 h-14 pl-10 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-300 font-bold text-xl"
                                            placeholder="Enter amount"
                                        />
                                    </div>
                                    {formData.amount <= 0 && (
                                        <p className="text-xs text-red-500 font-medium mt-1">Minimum donation amount must not be &apos;0&apos;</p>
                                    )}
                                </div>

                                {formData.amount >= 1 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6 bg-red-50 rounded-2xl p-5 border border-red-100"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 font-medium">Your donation</span>
                                            <span className="text-2xl font-black text-red-600">₱{formData.amount.toLocaleString()}</span>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {/* STEP 3: Details */}
                        {currentStep === 3 && (
                            <motion.div 
                                key="step3"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1"
                            >
                                <div className="mb-8">
                                    <h2 className="text-2xl font-black text-gray-900 mb-2">Your Details</h2>
                                    <p className="text-gray-500 text-sm">Provide your email and an optional message for the foundation.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700 flex items-center">
                                            <Mail className="w-4 h-4 mr-2 text-red-500" />
                                            Email Address 
                                            <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                                            <p className="italic font-light text-gray-400">— Want to know your donation flow?</p>
                                        </Label>
                                        <Input 
                                            value={formData.email}
                                            type="email" 
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="bg-gray-50 border border-gray-200 h-12 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-300 font-medium"
                                            placeholder="your@email.com"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700 flex items-center">
                                            <MessageSquare className="w-4 h-4 mr-2 text-red-500" />
                                            Personal Message
                                            <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                                        </Label>
                                        <Textarea
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="bg-gray-50 border border-gray-200 rounded-xl min-h-[100px] focus:ring-2 focus:ring-red-500/20 focus:border-red-300 p-4 resize-none"
                                            placeholder="Share a word of encouragement..."
                                        />
                                    </div>

                                    <div
                                        onClick={() => setFormData(prev => ({ ...prev, is_anonymous: !prev.is_anonymous }))}
                                        className={`flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                                            formData.is_anonymous 
                                                ? "border-red-500 bg-red-50/50" 
                                                : "border-gray-200 bg-gray-50 hover:border-red-200"
                                        }`}
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                formData.is_anonymous ? "bg-red-100" : "bg-gray-200"
                                            }`}>
                                                {formData.is_anonymous 
                                                    ? <EyeOff className="w-5 h-5 text-red-600" /> 
                                                    : <Eye className="w-5 h-5 text-gray-500" />
                                                }
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold text-gray-700 block">Donate Anonymously</span>
                                                <span className="text-xs text-gray-400">Your name will be hidden from the public</span>
                                            </div>
                                        </div>
                                        <div className={`w-11 h-6 rounded-full relative transition-colors ${
                                            formData.is_anonymous ? "bg-red-600" : "bg-gray-300"
                                        }`}>
                                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${
                                                formData.is_anonymous ? "translate-x-5.5" : "translate-x-0.5"
                                            }`} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: Payment Method */}
                        {currentStep === 4 && (
                            <motion.div 
                                key="step4"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1"
                            >
                                <div className="mb-8">
                                    <h2 className="text-2xl font-black text-gray-900 mb-2">Payment Method</h2>
                                    <p className="text-gray-500 text-sm">Select your preferred payment method to complete the donation.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {PAYMENT_METHODS.map((method) => (
                                        <div
                                            key={method.id}
                                            onClick={() => setFormData(prev => ({ ...prev, payment_method: method.id }))}
                                            className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all duration-200 hover:shadow-md ${
                                                formData.payment_method === method.id
                                                    ? "border-red-500 bg-red-50/50 shadow-md shadow-red-100"
                                                    : "border-gray-200 bg-white hover:border-red-200"
                                            }`}
                                        >
                                            {formData.payment_method === method.id && (
                                                <div className="absolute top-3 right-3 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-12 h-12 ${method.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                                    <method.icon className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{method.name}</h3>
                                                    <p className="text-xs text-gray-500">{method.description}</p>
                                                    <p className="text-xs text-red-500">{method.fee}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 5: Review */}
                        {currentStep === 5 && (
                            <motion.div 
                                key="step5"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1"
                            >
                                <div className="mb-8">
                                    <h2 className="text-2xl font-black text-gray-900 mb-2">Review Your Donation</h2>
                                    <p className="text-gray-500 text-sm">Confirm all the details below before proceeding to payment.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Donation Type</span>
                                            <span className="text-sm font-bold text-gray-900 capitalize">
                                                {formData.donation_type === "restricted"
                                                    ? `Program — ${toTitleCase(pools.find(p => p.id === formData.pool_id)?.name || "")}`
                                                    : "General Funds"
                                                }
                                            </span>
                                        </div>
                                        <div className="border-t border-gray-200" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Amount</span>
                                            <span className="text-sm font-bold text-gray-900">₱{formData.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="border-t border-gray-200" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Email</span>
                                            <span className="text-sm font-bold text-gray-900">{formData.email || "Not applicable"}</span>
                                        </div>
                                        <div className="border-t border-gray-200" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Visibility</span>
                                            <span className="text-sm font-bold text-gray-900">
                                                {formData.is_anonymous ? "Anonymous" : "Public"}
                                            </span>
                                        </div>
                                        <div className="border-t border-gray-200" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Payment Method</span>
                                            <span className="text-sm font-bold text-gray-900">
                                                {PAYMENT_METHODS.find(m => m.id === formData.payment_method)?.name || "—"}
                                            </span>
                                        </div>
                                        <div className="border-t border-gray-200" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Transaction fee</span>
                                            <span className="text-sm font-bold text-red-500">
                                                - ({(() => {
                                                    const method = PAYMENT_METHODS.find(m => m.id === formData.payment_method);
                                                    const feePercent = ((method?.fees || 0) * 100).toFixed(1);
                                                    return `${feePercent}%${method?.id === "card" ? ` + ₱${method.extraFee}` : ""}`;
                                                })()}) &nbsp;
                                                ₱{(() => {
                                                    const method = PAYMENT_METHODS.find(m => m.id === formData.payment_method);
                                                    const feeAmount = (method?.fees || 0) * formData.amount;
                                                    const extraFee = method?.id === "card" ? method.extraFee || 0 : 0;
                                                    return (feeAmount + extraFee).toFixed(2);
                                                })()}
                                                
                                            </span>
                                        </div>
                                        {formData.message && (
                                            <>
                                                <div className="border-t border-gray-200" />
                                                <div>
                                                    <span className="text-sm text-gray-500 block mb-1">Message</span>
                                                    <p className="text-sm text-gray-700 italic bg-white rounded-lg p-3">
                                                        &ldquo;{formData.message}&rdquo;
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                                                    <Heart className="w-5 h-5 text-white" />
                                                </div>
                                                <span className="font-bold text-gray-900">Total Donation</span>
                                            </div>
                                            <span className="text-3xl font-black text-red-600">
                                                ₱{(() => {
                                                    const method = PAYMENT_METHODS.find(m => m.id === formData.payment_method);
                                                    const feeAmount = (method?.fees || 0) * formData.amount;
                                                    const extraFee = method?.id === "card" ? method.extraFee || 0 : 0;
                                                    const total = formData.amount - feeAmount - extraFee;
                                                    return total.toLocaleString();
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
                        {currentStep > 1 ? (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={prevStep}
                                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl h-12 px-6"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="font-bold">Back</span>
                            </Button>
                        ) : (
                            <div />
                        )}

                        {currentStep < 5 ? (
                            <Button
                                type="button"
                                onClick={nextStep}
                                disabled={!canProceed()}
                                className="bg-red-600 hover:bg-red-700 text-white h-12 px-8 rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-200 flex items-center space-x-2"
                            >
                                <span>Continue</span>
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="bg-red-600 hover:bg-red-700 text-white h-14 px-10 rounded-xl text-lg font-black transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-200 flex items-center space-x-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        <span>Complete Donation</span>
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </motion.div>

                {/* Security Badge */}
                <div className="text-center mt-6">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold flex items-center justify-center space-x-2">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Secured by PayMongo &bull; 256-bit SSL Encryption</span>
                    </p>
                </div>
            </div>

            {/* ERROR TOAST */}
            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-4 border border-white/10 backdrop-blur-md"
                    >
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <p className="font-bold text-sm tracking-tight">{error}</p>
                        <button onClick={() => setError("")} className="text-gray-400 hover:text-white font-black text-xs uppercase ml-4">Dismiss</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SUCCESS MODAL */}
            <AnimatePresence>
                {response && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white rounded-[32px] shadow-3xl max-w-md w-full p-10 text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-400 to-red-600" />
                            
                            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <ShieldCheck className="w-10 h-10" />
                            </div>
                            
                            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Donation Created!</h2>
                            <p className="text-slate-500 font-light mb-8 leading-relaxed">
                                Complete your payment via {PAYMENT_METHODS.find(m => m.id === formData.payment_method)?.name || "PayMongo"} to finalize your donation.
                            </p>
                            
                            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                                <div className="flex justify-between items-center">

                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-2">Reference Code</span>
                                    <button
                                        onClick={handleCopy}
                                        className=" hover:bg-slate-100 rounded-full transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? (
                                            <Check className="w-5 text-green-500" />
                                            ) : (
                                            <Copy className="w-5 text-slate-500" />
                                        )}
                                        

                                    </button>
                                </div>
                                <code className="text-2xl font-black text-red-600 tracking-tighter">{response.reference_code}</code>
                            </div>

                            <div className="space-y-4">
                                <a
                                    href={response.checkout_url}
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center w-full bg-red-600 text-white h-16 rounded-2xl font-black text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-200 group"
                                >
                                    <span>Proceed to Payment</span>
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </a>
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setResponse(null)} 
                                    className="w-full text-slate-400 font-bold text-sm tracking-tight hover:bg-slate-50 h-12 rounded-xl"
                                >
                                    Cancel & Return
                                </Button>
                            </div>

                            <p className="mt-8 text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">Puso ng Ama Foundation</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
