"use client";

import { useState, useEffect } from "react";
import RequestForm from "@/components/features/requests/RequestForm";
import RequestList from "@/components/features/requests/RequestList";
import { SessionData } from "@/types/session";

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

interface Document {
    id: number;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
}


export default function RequestsTestPage() {
    const [requests, setRequests] = useState<BeneficiaryRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<SessionData | null>(null);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);

    // Check session
    useEffect(() => {
        fetch("/api/auth/session-check")
            .then(res => res.json())
            .then((data: SessionData) => {
                setSession(data);
                if (data.authenticated) {
                    console.log("user",data.user?.beneficiary)
                    fetchRequests();
                } else {
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch("/api/beneficiary/requests");
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

    const handleRequestCreated = () => {
        setShowForm(false);
        fetchRequests();
    };

    if(showForm && session?.user?.beneficiary) {
        console.log(showForm);
        console.log("Beneficiary: ", session)
    } else {
        console.log("Something went wrong")
    }



    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    if (!session?.authenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
                    <p className="text-gray-500 mt-2">Please login to view requests</p>
                    <a href="/profile" className="text-blue-500 underline mt-4 block">
                        Go to Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 mt-28 text-gray-900">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Beneficiary Requests Test
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Logged in as: {session.user?.email} ({session.user?.role})
                        </p>
                    </div>
                    {session.user?.role === "beneficiary" && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            {showForm ? "Cancel" : "+ New Request"}
                        </button>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {/* Request Form */}
                {showForm && session.user?.beneficiary && (
                    <div className="bg-white rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-4">Create New Request</h2>
                        <RequestForm
                            beneficiaryId={session.user.beneficiary.id}
                            onSuccess={handleRequestCreated}
                        />
                    </div>
                )}

                {/* Requests List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-semibold">
                            {session.user?.role === "admin" ? "All Requests" : "My Requests"}
                        </h2>
                    </div>
                    <RequestList
                        requests={requests}
                        isAdmin={session.user?.role === "admin"}
                        onRefresh={fetchRequests}
                    />
                </div>
            </div>
        </div>
    );
}
