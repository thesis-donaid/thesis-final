"use client";

import { useState } from "react";
import Link from "next/link";

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
    reviewed_by?: string;
    reviewed_at?: string;
    rejection_reason?: string;
    disbursed_amount?: number;
    disbursed_at?: string;
    documents: Document[];
    beneficiary?: {
        firstName?: string;
        lastName?: string;
        username?: string;
    };
}

interface RequestListProps {
    requests: BeneficiaryRequest[];
    isAdmin: boolean;
    onRefresh: () => void;
}

const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    UNDER_REVIEW: "bg-blue-100 text-blue-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    DISBURSED: "bg-purple-100 text-purple-800",
};

const URGENCY_COLORS: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-800",
    MEDIUM: "bg-orange-100 text-orange-800",
    HIGH: "bg-red-100 text-red-800",
};

export default function RequestList({ requests, isAdmin, onRefresh }: RequestListProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [updating, setUpdating] = useState<number | null>(null);
    const [updateForm, setUpdateForm] = useState({
        status: "",
        rejection_reason: "",
        disbursed_amount: "",
    });

    const handleStatusUpdate = async (requestId: number) => {
        setUpdating(requestId);
        try {
            const res = await fetch(`/api/beneficiary/requests/${requestId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: updateForm.status,
                    rejection_reason: updateForm.rejection_reason || undefined,
                    disbursed_amount: updateForm.disbursed_amount || undefined,
                }),
            });

            if (res.ok) {
                onRefresh();
                setExpandedId(null);
                setUpdateForm({ status: "", rejection_reason: "", disbursed_amount: "" });
            } else {
                const data = await res.json();
                alert(data.error || "Failed to update");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to update request");
        } finally {
            setUpdating(null);
        }
    };


    const handleDeleteRequest = async (e: React.MouseEvent, requestId: number) => {
        e.stopPropagation(); // Prevent expanding the card when clicking delete
        
        if (!confirm("Are you sure you want to cancel this request? This action cannot be undone.")) {
            return;
        }

        try {
            const res = await fetch(`/api/beneficiary/requests/${requestId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                alert("Request successfully cancelled");
                onRefresh(); // Refresh the list after deletion
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete request");
            }
        } catch(error) {
            console.error(error);
            alert("Failed to delete request");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
        }).format(amount);
    };

    if (requests.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                No requests found
            </div>
        );
    }

    return (
        <div className="divide-y">
            {requests.map((request) => (
                <div key={request.id} className="p-4 hover:bg-gray-50">
                    {/* Request Header */}
                    <div
                        className="flex justify-between items-start cursor-pointer"
                        onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900">
                                    #{request.id}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[request.status]}`}>
                                    {request.status}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${URGENCY_COLORS[request.urgency_level]}`}>
                                    {request.urgency_level}
                                </span>
                            </div>
                            <p className="text-gray-700">{request.purpose}</p>
                            <p className="text-sm text-gray-500">
                                {formatCurrency(request.amount)} • Needed by {formatDate(request.date_needed)}
                            </p>
                            {isAdmin && request.beneficiary && (
                                <p className="text-sm text-gray-400">
                                    By: {request.beneficiary.firstName} {request.beneficiary.lastName} (@{request.beneficiary.username})
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">
                                {formatDate(request.created_at)}
                            </p>
                            <p className="text-xs text-gray-400">
                                {request.documents.length} document(s)
                            </p>
                        </div>

                        <button 
                            className="py-2 px-4 ml-3 rounded-lg text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all text-sm font-bold shadow-md shadow-red-100"
                            onClick={(e) => handleDeleteRequest(e, request.id)}
                        >
                            Delete
                        </button>

                        {!isAdmin && (
                            <Link
                                href={`/beneficiary/requests/${request.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className={`py-2 px-4 ml-2 rounded-lg text-white text-sm font-bold shadow-md transition-all active:scale-95 ${
                                    request.status === 'DISBURSED'
                                        ? 'bg-green-600 hover:bg-green-700 shadow-green-100'
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                                }`}
                            >
                                {request.status === 'DISBURSED' ? 'Submit Receipt' : 'View'}
                            </Link>
                        )}
                    </div>

                    {/* Expanded Details */}
                    {expandedId === request.id && (
                        <div className="mt-4 pt-4 border-t space-y-4">
                            {/* Additional Info */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Email:</span>{" "}
                                    <span className="text-gray-900">{request.email}</span>
                                </div>
                                {request.additional_notes && (
                                    <div className="col-span-2">
                                        <span className="text-gray-500">Notes:</span>{" "}
                                        <span className="text-gray-900">{request.additional_notes}</span>
                                    </div>
                                )}
                                {request.reviewed_by && (
                                    <div>
                                        <span className="text-gray-500">Reviewed by:</span>{" "}
                                        <span className="text-gray-900">{request.reviewed_by}</span>
                                    </div>
                                )}
                                {request.rejection_reason && (
                                    <div className="col-span-2">
                                        <span className="text-gray-500">Rejection Reason:</span>{" "}
                                        <span className="text-red-600">{request.rejection_reason}</span>
                                    </div>
                                )}
                                {request.disbursed_amount && (
                                    <div>
                                        <span className="text-gray-500">Disbursed:</span>{" "}
                                        <span className="text-green-600">
                                            {formatCurrency(request.disbursed_amount)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Documents */}
                            {request.documents.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Documents</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {request.documents.map((doc) => (
                                            <a
                                                key={doc.id}
                                                href={doc.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-lg text-sm text-blue-600 hover:bg-gray-200"
                                            >
                                                📄 {doc.file_name}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}


             

                            {/* Admin Actions */}
                            {isAdmin && request.status !== "DISBURSED" && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-gray-700 mb-3">Update Status</h4>
                                    <div className="flex flex-wrap gap-3 items-end">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">
                                                New Status
                                            </label>
                                            <select
                                                value={updateForm.status}
                                                onChange={(e) =>
                                                    setUpdateForm((prev) => ({
                                                        ...prev,
                                                        status: e.target.value,
                                                    }))
                                                }
                                                className="px-3 py-2 border rounded-lg text-sm"
                                            >
                                                <option value="">Select...</option>
                                                <option value="UNDER_REVIEW">Under Review</option>
                                                <option value="APPROVED">Approved</option>
                                                <option value="REJECTED">Rejected</option>
                                                <option value="DISBURSED">Disbursed</option>
                                            </select>
                                        </div>

                                        {updateForm.status === "REJECTED" && (
                                            <div className="flex-1">
                                                <label className="block text-xs text-gray-500 mb-1">
                                                    Rejection Reason
                                                </label>
                                                <input
                                                    type="text"
                                                    value={updateForm.rejection_reason}
                                                    onChange={(e) =>
                                                        setUpdateForm((prev) => ({
                                                            ...prev,
                                                            rejection_reason: e.target.value,
                                                        }))
                                                    }
                                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                                    placeholder="Enter reason..."
                                                />
                                            </div>
                                        )}

                                        {updateForm.status === "DISBURSED" && (
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">
                                                    Disbursed Amount
                                                </label>
                                                <input
                                                    type="number"
                                                    value={updateForm.disbursed_amount}
                                                    onChange={(e) =>
                                                        setUpdateForm((prev) => ({
                                                            ...prev,
                                                            disbursed_amount: e.target.value,
                                                        }))
                                                    }
                                                    className="px-3 py-2 border rounded-lg text-sm"
                                                    placeholder={request.amount.toString()}
                                                />
                                            </div>
                                        )}

                                        <button
                                            onClick={() => handleStatusUpdate(request.id)}
                                            disabled={!updateForm.status || updating === request.id}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {updating === request.id ? "Updating..." : "Update"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
