"use client";

import { useState, useEffect } from "react";
import RequestForm from "@/components/features/requests/RequestForm";
import RequestList from "@/components/features/requests/RequestList";
import { useSession } from "next-auth/react";

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
}

const statuses = [
    { label: 'ALL', value: '' },
    { label: 'PENDING', value: 'PENDING' },
    { label: 'APPROVED', value: 'APPROVED' },
    { label: 'CANCELED', value: 'REJECTED' },
];

export default function RequestsPage() {
    const [requests, setRequests] = useState<BeneficiaryRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("");

    // Check session
    const { data: session, status } = useSession();

    const fetchRequests = async (filter?: string) => {
        try {
            setLoading(true);
            const currentFilter = filter !== undefined ? filter : statusFilter;
            const url = currentFilter 
                ? `/api/beneficiary/requests?status=${currentFilter}` 
                : "/api/beneficiary/requests";
            
            const res = await fetch(url);
            const data = await res.json();
            if (res.ok) {
                setRequests(data);
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

    // Fetch requests on mount or when session becomes available
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

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        fetchRequests(value);
    };

    if (loading && status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading session...</p>
                </div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-md w-full">
                    <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                        <span className="text-4xl text-red-600">!!</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-500 mb-8">Please login as a beneficiary to view and manage your requests.</p>
                    <a 
                        href="/login" 
                        className="block w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-200 text-center"
                    >
                        Go to Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pt-32 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                            My <span className="text-red-600">Requests</span>
                        </h1>
                        <p className="text-gray-500 mt-1 flex items-center gap-2">
                            Manage and track your assistance applications
                        </p>
                    </div>
                    {session?.user?.role === "beneficiary" && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all shadow-lg text-white ${
                                showForm 
                                ? 'bg-gray-800 hover:bg-gray-900 shadow-gray-200' 
                                : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                            }`}
                        >
                            {showForm ? (
                                <>Cancel Request</>
                            ) : (
                                <>
                                    <span className="text-xl">+</span>
                                    New Request
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-700 px-6 py-4 rounded-3xl flex items-center gap-3">
                        <span className="text-xl font-bold">!</span>
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                {/* Status Picker - Diagonal Rectangle Design */}
                <div className="flex flex-wrap items-center gap-3 py-2 overflow-x-auto no-scrollbar">
                    {statuses.map((s) => (
                        <button
                            key={s.label}
                            onClick={() => handleStatusChange(s.value)}
                            className={`
                                group relative px-8 py-2.5 transition-all duration-300 transform -skew-x-12 min-w-[120px]
                                ${statusFilter === s.value 
                                    ? 'bg-red-600 text-white shadow-[4px_4px_0px_0px_rgba(220,38,38,0.2)] translate-y-[-2px]' 
                                    : 'bg-white border-2 border-gray-100 text-gray-400 hover:border-red-200 hover:text-red-500'
                                }
                            `}
                        >
                            <span className="inline-block transform skew-x-12 text-xs font-black tracking-[0.2em]">
                                {s.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 gap-8">
                    {/* Form Section */}
                    {showForm && session?.user?.beneficiary && (
                        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                                <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
                                <p className="text-sm text-gray-500">Please provide accurate information for faster processing.</p>
                            </div>
                            <div className="p-8">
                                <RequestForm
                                    beneficiaryId={session.user.beneficiary.id}
                                    onSuccess={handleRequestCreated}
                                />
                            </div>
                        </div>
                    )}

                    {/* List Section */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                {session?.user?.role === "admin" ? "All Requests" : "Filtered Submissions"}
                            </h2>
                            <div className="px-4 py-1.5 bg-gray-100 rounded-full text-xs font-bold text-gray-500 uppercase tracking-wider">
                                {requests.length} Result{requests.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                        
                        {loading && !showForm ? (
                            <div className="p-20 text-center">
                                <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-400">Updating requests list...</p>
                            </div>
                        ) : (
                            <RequestList
                                requests={requests}
                                isAdmin={session?.user?.role === "admin"}
                                onRefresh={fetchRequests}
                            />
                        )}
                    </div>
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
