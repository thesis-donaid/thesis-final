"use client";

import { useState, useEffect, useCallback } from "react";
import RequestForm from "@/components/features/requests/RequestForm";
import RequestList from "@/components/features/requests/RequestList";
import { useSession } from "next-auth/react";
import { pusherClient } from "@/lib/pusher-client";
import { Clock, CheckCircle2, AlertCircle, Plus, FileText, Bell, DollarSign, XCircle } from "lucide-react";

interface Document {
    id: number;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
}

interface BeneficiaryRequest {
    id: number;
    purpose: string;
    amount: number;
    date_needed: string;
    email: string;
    additional_notes?: string;
    urgency_level: string;
    status: string;
    created_at: string;
    documents: Document[];
    receipt_status: string;
}

type Tab = 'all' | 'pending' | 'approved' | 'disbursed' | 'rejected';

export default function BeneficiaryRequestsPage() {
    const [requests, setRequests] = useState<BeneficiaryRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('all');
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, disbursed: 0, rejected: 0 });
    const [notification, setNotification] = useState<string | null>(null);

    const { data: session, status } = useSession();

    const fetchRequests = useCallback(async (silent = false) => {
        try {
            if(!silent) setLoading(true);
            const res = await fetch("/api/beneficiary/requests");
            const data = await res.json();
            if (res.ok) {
                setRequests(data);
                setStats({
                    total: data.length,
                    pending: data.filter((r: BeneficiaryRequest) => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length,
                    approved: data.filter((r: BeneficiaryRequest) => r.status === 'APPROVED').length,
                    disbursed: data.filter((r: BeneficiaryRequest) => r.status === 'DISBURSED').length,
                    rejected: data.filter((r: BeneficiaryRequest) => r.status === 'REJECTED').length,
                });
            } else {
                setError(data.error || "Failed to fetch requests");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to fetch requests");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === "authenticated") {
            fetchRequests();
        } else if (status === "unauthenticated") {
            setLoading(false);
        }
    }, [status, fetchRequests]);

    // Pusher real-time listener
    useEffect(() => {
        if (status !== "authenticated" || !session?.user?.id) return;

        const channel = pusherClient.subscribe(`beneficiary-${session.user.id}`);

        channel.bind("request-updated", (data: { requestId: number; status: string; purpose: string }) => {
            // Show notification
            setNotification(`Request "${data.purpose}" has been updated to ${data.status}`);
            setTimeout(() => setNotification(null), 5000);

            // Auto-refresh the list
            fetchRequests(true);
        });

        return () => {
            channel.unbind_all();
            pusherClient.unsubscribe(`beneficiary-${session.user.id}`);
        };
    }, [status, session?.user?.id, fetchRequests]);

    const handleRequestCreated = () => {
        setShowForm(false);
        fetchRequests();
    };

    const filteredRequests = requests.filter(r => {
        if (activeTab === 'pending') return r.status === 'PENDING' || r.status === 'UNDER_REVIEW';
        if (activeTab === 'approved') return r.status === 'APPROVED';
        if (activeTab === 'disbursed') return r.status === 'DISBURSED';
        if (activeTab === 'rejected') return r.status === 'REJECTED';
        return true;
    });

    const tabs: { key: Tab; label: string }[] = [
        { key: 'all', label: `All (${stats.total})` },
        { key: 'pending', label: `Pending (${stats.pending})` },
        { key: 'approved', label: `Approved (${stats.approved})` },
        { key: 'disbursed', label: `Disbursed (${stats.disbursed})` },
        { key: 'rejected', label: `Rejected (${stats.rejected})` },
    ];

    const statCards = [
        {
            label: 'Total Requests',
            value: stats.total,
            icon: FileText,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
        },
        {
            label: 'Pending',
            value: stats.pending,
            icon: Clock,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
        },
        {
            label: 'Approved',
            value: stats.approved,
            icon: CheckCircle2,
            iconBg: 'bg-green-50',
            iconColor: 'text-green-600',
        },
        {
            label: 'Disbursed',
            value: stats.disbursed,
            icon: DollarSign,
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
        },
        {
            label: 'Rejected',
            value: stats.rejected,
            icon: XCircle,
            iconBg: 'bg-red-50',
            iconColor: 'text-red-600',
        },
    ];

    if (loading && status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Loading requests...</p>
                </div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-xl border border-gray-200 shadow-sm max-w-md w-full">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-500 mb-8">Please log in to view your requests.</p>
                    <a
                        href="/login"
                        className="block w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        Go to Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Requests
                        </h1>
                        <p className="text-gray-500 mt-1">Track and manage your assistance requests</p>
                    </div>
                    {session?.user?.role === "beneficiary" && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                                showForm
                                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                    : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                        >
                            <Plus className="w-5 h-5" />
                            {showForm ? "Cancel" : "New Request"}
                        </button>
                    )}
                </div>

                {/* Real-time Notification Banner */}
                {notification && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded-lg flex items-center gap-3 animate-in fade-in">
                        <Bell className="w-5 h-5 shrink-0" />
                        <p className="font-medium text-sm flex-1">{notification}</p>
                        <button onClick={() => setNotification(null)} className="text-blue-400 hover:text-blue-600 text-sm font-bold">✕</button>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5" />
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                {/* Stats Cards (template style) */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {statCards.map((card, idx) => {
                        const Icon = card.icon;
                        return (
                            <div
                                key={idx}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">{card.label}</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                                    </div>
                                    <div className={`p-3 rounded-xl ${card.iconBg}`}>
                                        <Icon className={`w-5 h-5 ${card.iconColor}`} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Form Section */}
                {showForm && session?.user?.beneficiary && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-lg font-semibold text-gray-800">New Request</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Fill in the details for your assistance request</p>
                        </div>
                        <div className="p-6">
                            <RequestForm
                                beneficiaryId={session.user.beneficiary.id}
                                onSuccess={handleRequestCreated}
                            />
                        </div>
                    </div>
                )}

                {/* Tabs & List */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Tabs Navigation */}
                    <div className="border-b border-gray-200 bg-gray-50/50">
                        <div className="flex items-center gap-6 px-6 py-2 overflow-x-auto no-scrollbar">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`text-sm font-medium transition-colors whitespace-nowrap py-3 border-b-2 ${
                                        activeTab === tab.key
                                            ? 'text-red-600 border-red-600'
                                            : 'text-gray-500 border-transparent hover:text-gray-700'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">Loading requests...</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No requests found</p>
                            <p className="text-gray-400 text-sm mt-1">
                                {activeTab === 'all' ? 'Create your first request to get started' : `No ${activeTab} requests`}
                            </p>
                        </div>
                    ) : (
                        <RequestList
                            requests={filteredRequests}
                            isAdmin={false}
                            onRefresh={fetchRequests}
                        />
                    )}
                </div>
            </div>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}