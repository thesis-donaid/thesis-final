"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, FileText, ExternalLink, Clock, CheckCircle2, XCircle, AlertTriangle, Eye } from "lucide-react";

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
    receipt_status: string;
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

const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING:      { label: 'Pending',      className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    UNDER_REVIEW: { label: 'Under Review', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
    APPROVED:     { label: 'Approved',     className: 'bg-green-50 text-green-700 border border-green-200' },
    REJECTED:     { label: 'Rejected',     className: 'bg-red-50 text-red-700 border border-red-200' },
    DISBURSED:    { label: 'Disbursed',    className: 'bg-purple-50 text-purple-700 border border-purple-200' },
};

const urgencyConfig: Record<string, { label: string; className: string }> = {
    LOW:    { label: 'Low',      className: 'bg-gray-50 text-gray-600 border border-gray-200' },
    MEDIUM: { label: 'Medium',   className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    HIGH:   { label: 'Critical', className: 'bg-red-50 text-red-700 border border-red-200' },
};

const receiptConfig: Record<string, { label: string; className: string }> = {
    COMPLETED: { label: 'Receipt Completed', className: 'bg-green-50 text-green-700 border border-green-200' },
    PENDING:   { label: 'Review Proof',      className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    MISSING:   { label: 'Missing Receipt',   className: 'bg-red-50 text-red-700 border border-red-200' },
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
        e.stopPropagation();
        if (!confirm("Are you sure you want to cancel this request? This action cannot be undone.")) {
            return;
        }

        try {
            const res = await fetch(`/api/beneficiary/requests/${requestId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                alert("Request successfully cancelled");
                onRefresh();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete request");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to delete request");
        }
    };

    if (requests.length === 0) {
        return (
            <div className="py-16 text-center text-gray-400 bg-white rounded-xl border border-gray-200">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">No requests found</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-100">
            {requests.map((request) => {
                const isExpanded = expandedId === request.id;
                const statusBadge = statusConfig[request.status] ?? statusConfig.PENDING;
                const urgencyBadge = urgencyConfig[request.urgency_level] ?? urgencyConfig.LOW;
                const receiptBadge = receiptConfig[request.receipt_status];

                const date = new Date(request.created_at).toLocaleDateString('en-US', {
                    month: '2-digit', day: '2-digit', year: 'numeric',
                });

                return (
                    <div key={request.id} className="transition-colors hover:bg-gray-50/50">
                        {/* Main Row */}
                        <button
                            onClick={() => setExpandedId(isExpanded ? null : request.id)}
                            className="w-full flex items-center justify-between px-6 py-5 text-left"
                        >
                            <div className="space-y-2 min-w-0 flex-1 pr-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-base font-semibold text-gray-900 truncate max-w-[300px]">
                                        {request.purpose}
                                    </span>
                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusBadge.className}`}>
                                        {statusBadge.label}
                                    </span>
                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${urgencyBadge.className}`}>
                                        {urgencyBadge.label}
                                    </span>
                                    {receiptBadge && (
                                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${receiptBadge.className}`}>
                                            {receiptBadge.label}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400">
                                    <span>{date}</span>
                                    <span className="mx-1">•</span>
                                    <span className="font-mono">REQ-{String(request.id).padStart(3, '0')}</span>
                                    <span className="mx-1">•</span>
                                    <span>Needed by {new Date(request.date_needed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </p>
                                {isAdmin && request.beneficiary && (
                                    <p className="text-xs text-gray-400">
                                        By: {request.beneficiary.firstName} {request.beneficiary.lastName} (@{request.beneficiary.username})
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                                {isAdmin && (
                                    <Link
                                        href={`/admin/requests/${request.id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                                        title="View Full Details"
                                    >
                                        <Eye size={18} className="group-hover:scale-110 transition-transform" />
                                    </Link>
                                )}
                                <div className="text-right">
                                    <p className="text-lg font-bold text-gray-900">
                                        ₱{request.amount.toLocaleString()}
                                    </p>
                                    <p className="text-[11px] text-gray-400">{request.documents.length} document(s)</p>
                                </div>
                                <div className="p-1 rounded-full bg-gray-100 text-gray-500">
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                            </div>
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <div className="px-6 pb-6 space-y-5">
                                {/* Timeline */}
                                <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        <span>Submitted: {new Date(request.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    {request.reviewed_at && (
                                        <div className="flex items-center gap-2 text-xs text-blue-600">
                                            <Eye className="w-4 h-4" />
                                            <span>Reviewed: {new Date(request.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                    )}
                                    {request.disbursed_at && (
                                        <div className="flex items-center gap-2 text-xs text-green-600">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>Disbursed: {new Date(request.disbursed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                    )}
                                    {request.disbursed_amount && (
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>Disbursed Amount: <span className="font-bold text-green-600">₱{request.disbursed_amount.toLocaleString()}</span></span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>Email: {request.email}</span>
                                    </div>
                                </div>

                                {/* Additional Notes */}
                                {request.additional_notes && (
                                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                        <p className="text-xs font-semibold text-blue-700 mb-1">Additional Notes</p>
                                        <p className="text-sm text-blue-800">{request.additional_notes}</p>
                                    </div>
                                )}

                                {/* Rejection Reason */}
                                {request.rejection_reason && (
                                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <XCircle className="w-4 h-4 text-red-600" />
                                            <span className="text-xs font-semibold text-red-700">Rejection Reason</span>
                                        </div>
                                        <p className="text-sm text-red-800">{request.rejection_reason}</p>
                                    </div>
                                )}

                                {/* Documents */}
                                {request.documents.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-indigo-500" />
                                            <span className="text-xs font-semibold text-gray-700">Attached Documents</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {request.documents.map((doc) => (
                                                <a
                                                    key={doc.id}
                                                    href={doc.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg p-3 border border-indigo-100 transition-colors group"
                                                >
                                                    <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-medium text-indigo-700 truncate">{doc.file_name}</p>
                                                    </div>
                                                    <ExternalLink className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 shrink-0" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 pt-2">
                                    {request.receipt_status !== "COMPLETED" && (
                                        <button
                                            className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 px-4 py-2 rounded-lg transition-colors"
                                            onClick={(e) => handleDeleteRequest(e, request.id)}
                                        >
                                            Cancel Request
                                        </button>
                                    )}
                                    {request.receipt_status !== "COMPLETED" && !isAdmin && (
                                        <Link
                                            href={`/beneficiary/requests/${request.id}`}
                                            className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
                                                request.status === 'DISBURSED'
                                                    ? 'text-white bg-green-600 hover:bg-green-700'
                                                    : 'text-white bg-gray-900 hover:bg-gray-800'
                                            }`}
                                        >
                                            {request.status === 'DISBURSED' ? 'Submit Receipt' : 'View Details'}
                                        </Link>
                                    )}
                                </div>

                                {/* Admin Actions */}
                                {isAdmin && request.status !== "DISBURSED" && (
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <h4 className="text-xs font-semibold text-gray-700 mb-3">Update Status</h4>
                                        <div className="flex flex-wrap gap-3 items-end">
                                            <div>
                                                <label className="block text-[11px] text-gray-500 mb-1">New Status</label>
                                                <select
                                                    value={updateForm.status}
                                                    onChange={(e) =>
                                                        setUpdateForm((prev) => ({
                                                            ...prev,
                                                            status: e.target.value,
                                                        }))
                                                    }
                                                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
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
                                                    <label className="block text-[11px] text-gray-500 mb-1">Rejection Reason</label>
                                                    <input
                                                        type="text"
                                                        value={updateForm.rejection_reason}
                                                        onChange={(e) =>
                                                            setUpdateForm((prev) => ({
                                                                ...prev,
                                                                rejection_reason: e.target.value,
                                                            }))
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                                                        placeholder="Enter reason..."
                                                    />
                                                </div>
                                            )}

                                            {updateForm.status === "DISBURSED" && (
                                                <div>
                                                    <label className="block text-[11px] text-gray-500 mb-1">Disbursed Amount</label>
                                                    <input
                                                        type="number"
                                                        value={updateForm.disbursed_amount}
                                                        onChange={(e) =>
                                                            setUpdateForm((prev) => ({
                                                                ...prev,
                                                                disbursed_amount: e.target.value,
                                                            }))
                                                        }
                                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                                                        placeholder={request.amount.toString()}
                                                    />
                                                </div>
                                            )}

                                            <button
                                                onClick={() => handleStatusUpdate(request.id)}
                                                disabled={!updateForm.status || updating === request.id}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {updating === request.id ? "Updating..." : "Update"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}