"use client";

import { useState, useEffect } from "react";
import RequestForm from "@/components/features/requests/RequestForm";
import RequestList from "@/components/features/requests/RequestList";
import { useSession } from "next-auth/react";
import { Clock, CheckCircle2, AlertCircle, Plus, FileText } from "lucide-react";

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

interface RequestStats {
    totalRequests: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
}

// Status options for styling
type Tab = 'all' | 'pending' | 'approved' | 'rejected';

// Status config for styling
const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-600 border border-amber-100' },
    UNDER_REVIEW: { label: 'Under Review', className: 'bg-blue-50 text-blue-600 border border-blue-100' },
    APPROVED: { label: 'Approved', className: 'bg-green-50 text-green-600 border border-green-100' },
    REJECTED: { label: 'Rejected', className: 'bg-red-50 text-red-600 border border-red-100' },
};

const urgencyConfig: Record<string, { label: string; className: string }> = {
    LOW: { label: 'Low', className: 'bg-blue-50 text-blue-600 border border-blue-100' },
    MEDIUM: { label: 'Medium', className: 'bg-amber-50 text-amber-600 border border-amber-100' },
    HIGH: { label: 'High', className: 'bg-red-50 text-red-600 border border-red-100' },
};

export default function BeneficiaryRequestsPage() {
    const [requests, setRequests] = useState<BeneficiaryRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('all');
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

    const { data: session, status } = useSession();

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/beneficiary/requests");
            const data = await res.json();
            if (res.ok) {
                setRequests(data);
                // Calculate stats
                setStats({
                    total: data.length,
                    pending: data.filter((r: BeneficiaryRequest) => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length,
                    approved: data.filter((r: BeneficiaryRequest) => r.status === 'APPROVED').length,
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
    };

    useEffect(() => {
        if (status === "authenticated") {
            fetchRequests();
        } else if (status === "unauthenticated") {
            setLoading(false);
        }
    }, [status]);

    const handleRequestCreated = () => {
        setShowForm(false);
        fetchRequests();
    };

    const filteredRequests = requests.filter(r => {
        if (activeTab === 'pending') return r.status === 'PENDING' || r.status === 'UNDER_REVIEW';
        if (activeTab === 'approved') return r.status === 'APPROVED';
        if (activeTab === 'rejected') return r.status === 'REJECTED';
        return true;
    });

    const tabs: { key: Tab; label: string }[] = [
        { key: 'all', label: `All (${stats.total})` },
        { key: 'pending', label: `Pending (${stats.pending})` },
        { key: 'approved', label: `Approved (${stats.approved})` },
        { key: 'rejected', label: `Rejected (${stats.rejected})` },
    ];

    const statCards = [
        {
            label: 'Total Requests',
            value: stats.total,
            icon: FileText,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-500',
        },
        {
            label: 'Pending',
            value: stats.pending,
            icon: Clock,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-500',
        },
        {
            label: 'Approved',
            value: stats.approved,
            icon: CheckCircle2,
            iconBg: 'bg-green-50',
            iconColor: 'text-green-500',
        },
        {
            label: 'Rejected',
            value: stats.rejected,
            icon: AlertCircle,
            iconBg: 'bg-red-50',
            iconColor: 'text-red-500',
        },
    ];

    if (loading && status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-400 text-sm">Loading requests...</p>
                </div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-md w-full">
                    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-500 mb-8">Please login to view your requests.</p>
                    <a 
                        href="/login" 
                        className="block w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all text-center"
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
                        <h1 className="text-3xl font-bold text-gray-900">Assistance <span className="text-red-600">Requests</span></h1>
                        <p className="text-gray-500 mt-1">Track and manage your requests</p>
                    </div>
                    {session?.user?.role === "beneficiary" && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all text-white ${
                                showForm 
                                ? 'bg-gray-600 hover:bg-gray-700' 
                                : 'bg-red-600 hover:bg-red-700'
                            }`}
                        >
                            <Plus className="w-5 h-5" />
                            {showForm ? "Cancel" : "New Request"}
                        </button>
                    )}
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5" />
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((card, idx) => {
                        const Icon = card.icon;
                        return (
                            <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm font-medium">{card.label}</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                                    </div>
                                    <div className={`p-3 rounded-xl ${card.iconBg}`}>
                                        <Icon className={`w-6 h-6 ${card.iconColor}`} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Form Section */}
                {showForm && session?.user?.beneficiary && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-in fade-in">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">New Request</h2>
                            <p className="text-sm text-gray-500 mt-1">Fill in the details for your assistance request</p>
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
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Tab Navigation */}
                    <div className="border-b border-gray-100">
                        <div className="flex items-center gap-6 px-6 py-4 overflow-x-auto no-scrollbar">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`text-sm font-semibold transition-colors whitespace-nowrap pb-2 border-b-2 ${
                                        activeTab === tab.key
                                            ? 'text-red-600 border-red-600'
                                            : 'text-gray-600 border-transparent hover:text-gray-900'
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
                            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
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
