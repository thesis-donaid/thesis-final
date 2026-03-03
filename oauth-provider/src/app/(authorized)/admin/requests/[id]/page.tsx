'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    User,
    FileText,
    DollarSign,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    Eye,
    HandCoins,
    PiggyBank,
    Send,
    Loader2,
    ExternalLink,
    Banknote,
    Receipt,
    MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

interface RequestDocument {
    id: number;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
    uploaded_at: string;
}

interface AllocationDetail {
    id: number;
    amount: number;
    source_type: string;
    is_disbursed: boolean;
    allocated_at: string;
    disbursement_date: string | null;
    disbursement_notes: string | null;
    pool: { id: string; name: string } | null;
    donationAllocations: {
        id: number;
        amount_used: number;
        donation: {
            id: number;
            email: string;
            amount: number;
            status: string;
        };
    }[];
}

interface ReceiptDetail {
    id: number;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
    uploaded_at: string;
}

interface RequestDetail {
    id: number;
    purpose: string;
    amount: number;
    date_needed: string;
    email: string;
    additional_notes: string | null;
    urgency_level: string;
    status: string;
    reviewed_by: string | null;
    reviewed_at: string | null;
    rejection_reason: string | null;
    disbursed_at: string | null;
    disbursed_amount: number | null;
    receipt_message: string | null;
    receipt_submitted_at: string | null;
    created_at: string;
    allocatedAmount: number;
    remainingToAllocate: number;
    beneficiary: {
        id: number;
        username: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        phone: string | null;
        address: string | null;
        type: string;
        user: { email: string | null; name: string | null };
    };
    documents: RequestDocument[];
    allocations: AllocationDetail[];
    receipts: ReceiptDetail[];
}

interface AvailableFunds {
    unrestricted: { available: number; total: number };
    restricted: { poolId: string; poolName: string; available: number; total: number }[];
}

interface AllocationEntry {
    sourceType: 'UNRESTRICTED' | 'RESTRICTED';
    poolId: string;
    amount: string;
}

const urgencyConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    LOW:    { label: 'Low Priority',  className: 'bg-blue-50 text-blue-600 border border-blue-200', icon: Clock },
    MEDIUM: { label: 'Medium',        className: 'bg-amber-50 text-amber-600 border border-amber-200', icon: AlertTriangle },
    HIGH:   { label: 'Critical',      className: 'bg-red-50 text-red-600 border border-red-200', icon: AlertTriangle },
};

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    PENDING:      { label: 'Pending',      className: 'bg-amber-50 text-amber-600 border border-amber-200', icon: Clock },
    UNDER_REVIEW: { label: 'Under Review', className: 'bg-blue-50 text-blue-600 border border-blue-200', icon: Eye },
    APPROVED:     { label: 'Approved',     className: 'bg-green-50 text-green-600 border border-green-200', icon: CheckCircle2 },
    REJECTED:     { label: 'Rejected',     className: 'bg-red-50 text-red-600 border border-red-200', icon: XCircle },
    DISBURSED:    { label: 'Disbursed',    className: 'bg-gray-100 text-gray-600 border border-gray-200', icon: CheckCircle2 },
};

export default function AdminRequestReviewPage() {
    const { data: session, status: authStatus } = useSession();
    const params = useParams();
    const router = useRouter();
    const requestId = params.id as string;

    const [request, setRequest] = useState<RequestDetail | null>(null);
    const [availableFunds, setAvailableFunds] = useState<AvailableFunds | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Action states
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);

    // Allocation form
    const [showAllocateForm, setShowAllocateForm] = useState(false);
    const [allocations, setAllocations] = useState<AllocationEntry[]>([
        { sourceType: 'UNRESTRICTED', poolId: '', amount: '' },
    ]);
    const [disbursementDate, setDisbursementDate] = useState('');
    const [disbursementNotes, setDisbursementNotes] = useState('');
    const [notifyDonors, setNotifyDonors] = useState(true);
    const [notifyBeneficiary, setNotifyBeneficiary] = useState(true);

    // Disbursement form
    const [showDisburseForm, setShowDisburseForm] = useState(false);
    const [disbursementMethod, setDisbursementMethod] = useState('cash');

    useEffect(() => {
        if (authStatus !== 'authenticated' || session?.user?.role !== 'admin') {
            if (authStatus !== 'loading') setLoading(false);
            return;
        }
        fetchRequest();
    }, [authStatus, session, requestId]);

    const fetchRequest = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/requests/${requestId}`);
            const data = await res.json();
            if (data.success) {
                setRequest(data.data.request);
                setAvailableFunds(data.data.availableFunds);
            } else {
                setError(data.error || 'Failed to load request');
            }
        } catch {
            setError('An error occurred while loading the request');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: string, extra?: Record<string, string>) => {
        setActionLoading(true);
        try {
            const body: Record<string, string> = { status: newStatus, ...extra };
            if (newStatus === 'REJECTED') body.rejection_reason = rejectionReason;

            const res = await fetch(`/api/admin/requests/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                fetchRequest();
                setShowRejectForm(false);
                setShowDisburseForm(false);
                setRejectionReason('');
            } else {
                alert(data.error || 'Failed to update status');
            }
        } catch {
            alert('An error occurred');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAllocate = async () => {
        setActionLoading(true);
        try {
            const payload = {
                requestId: request!.id,
                allocations: allocations.map(a => ({
                    sourceType: a.sourceType,
                    poolId: a.sourceType === 'RESTRICTED' ? a.poolId : undefined,
                    amount: parseFloat(a.amount),
                })),
                disbursementDate,
                disbursementNotes: disbursementNotes || undefined,
                notifyDonors,
                notifyBeneficiary,
            };

            const res = await fetch('/api/admin/allocations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                setShowAllocateForm(false);
                fetchRequest();
            } else {
                alert(data.errors?.join('\n') || data.error || 'Failed to allocate');
            }
        } catch {
            alert('An error occurred');
        } finally {
            setActionLoading(false);
        }
    };

    const addAllocationRow = () => {
        setAllocations([...allocations, { sourceType: 'UNRESTRICTED', poolId: '', amount: '' }]);
    };

    const removeAllocationRow = (index: number) => {
        if (allocations.length > 1) {
            setAllocations(allocations.filter((_, i) => i !== index));
        }
    };

    const updateAllocation = (index: number, field: keyof AllocationEntry, value: string) => {
        const updated = [...allocations];
        updated[index] = { ...updated[index], [field]: value };
        setAllocations(updated);
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const formatReqId = (id: number, createdAt: string) => {
        const year = new Date(createdAt).getFullYear();
        return `REQ-${year}-${String(id).padStart(3, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Loading request...</p>
                </div>
            </div>
        );
    }

    if (error || !request) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-3">
                    <XCircle className="w-12 h-12 text-red-300 mx-auto" />
                    <p className="text-gray-600">{error || 'Request not found'}</p>
                    <Link href="/admin">
                        <Button variant="outline">Back to Dashboard</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const urgency = urgencyConfig[request.urgency_level] ?? urgencyConfig.LOW;
    const statusBadge = statusConfig[request.status] ?? statusConfig.PENDING;
    const StatusIcon = statusBadge.icon;
    const canReview = ['PENDING', 'UNDER_REVIEW'].includes(request.status);
    const canAllocate = ['PENDING', 'UNDER_REVIEW'].includes(request.status);
    const canDisburse = request.status === 'APPROVED' && request.allocations.length > 0;
    const daysUntilNeeded = Math.ceil((new Date(request.date_needed).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return (
        <div className="min-h-screen bg-gray-50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Back + Header */}
                <div>
                    <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 mb-3 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {formatReqId(request.id, request.created_at)}
                                </h1>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.className}`}>
                                    <StatusIcon size={13} />
                                    {statusBadge.label}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${urgency.className}`}>
                                    {urgency.label}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">
                                Submitted {formatDate(request.created_at)}
                                {request.reviewed_at && ` · Reviewed ${formatDate(request.reviewed_at)}`}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-gray-900">₱{request.amount.toLocaleString()}</div>
                            <p className="text-xs text-gray-400 mt-0.5">Requested Amount</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column — Request Details */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Purpose */}
                        <div className="bg-white rounded-xl border p-6 shadow-sm">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <FileText size={15} /> Request Details
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase tracking-wider">Purpose</label>
                                    <p className="text-gray-900 mt-1">{request.purpose}</p>
                                </div>
                                {request.additional_notes && (
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider">Additional Notes</label>
                                        <p className="text-gray-700 mt-1 whitespace-pre-wrap">{request.additional_notes}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider">Date Needed</label>
                                        <p className="text-gray-900 mt-1 font-medium">{formatDate(request.date_needed)}</p>
                                        <p className={`text-xs mt-0.5 ${daysUntilNeeded <= 7 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                            {daysUntilNeeded > 0 ? `${daysUntilNeeded} days from now` : daysUntilNeeded === 0 ? 'Today' : `${Math.abs(daysUntilNeeded)} days overdue`}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider">Contact Email</label>
                                        <p className="text-gray-900 mt-1">{request.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        {request.documents.length > 0 && (
                            <div className="bg-white rounded-xl border p-6 shadow-sm">
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <FileText size={15} /> Supporting Documents ({request.documents.length})
                                </h2>
                                <div className="space-y-2">
                                    {request.documents.map(doc => (
                                        <a
                                            key={doc.id}
                                            href={doc.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors group"
                                        >
                                            <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                                                <FileText size={16} className="text-red-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{doc.file_name}</p>
                                                <p className="text-xs text-gray-400">{doc.file_type} · {(doc.file_size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <ExternalLink size={14} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Existing Allocations */}
                        {request.allocations.length > 0 && (
                            <div className="bg-white rounded-xl border p-6 shadow-sm">
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <HandCoins size={15} /> Fund Allocations
                                </h2>
                                <div className="space-y-3">
                                    {request.allocations.map(a => (
                                        <div key={a.id} className="p-4 rounded-lg border bg-gray-50/50">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                                        a.source_type === 'RESTRICTED' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                        {a.source_type}
                                                    </span>
                                                    {a.pool && <span className="text-xs text-gray-500">{a.pool.name}</span>}
                                                </div>
                                                <span className="text-lg font-bold text-gray-900">₱{a.amount.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                <span>Allocated {new Date(a.allocated_at).toLocaleDateString()}</span>
                                                {a.disbursement_date && (
                                                    <span>Disbursement: {new Date(a.disbursement_date).toLocaleDateString()}</span>
                                                )}
                                                <span className={`inline-flex items-center gap-1 ${a.is_disbursed ? 'text-green-500' : 'text-amber-500'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${a.is_disbursed ? 'bg-green-500' : 'bg-amber-500'}`} />
                                                    {a.is_disbursed ? 'Disbursed' : 'Pending disbursement'}
                                                </span>
                                            </div>
                                            {a.donationAllocations.length > 0 && (
                                                <div className="mt-2 pt-2 border-t space-y-1">
                                                    <p className="text-[11px] text-gray-400 uppercase tracking-wider">Linked Donations</p>
                                                    {a.donationAllocations.map(da => (
                                                        <div key={da.id} className="text-xs text-gray-500 flex justify-between">
                                                            <span>{da.donation.email}</span>
                                                            <span>₱{da.amount_used.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div className="flex justify-between pt-2 text-sm">
                                        <span className="text-gray-500">Total Allocated</span>
                                        <span className="font-bold text-gray-900">₱{request.allocatedAmount.toLocaleString()}</span>
                                    </div>
                                    {request.remainingToAllocate > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Remaining</span>
                                            <span className="font-bold text-red-600">₱{request.remainingToAllocate.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Rejection Info */}
                        {request.status === 'REJECTED' && request.rejection_reason && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                                <h3 className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-2">
                                    <XCircle size={15} /> Rejection Reason
                                </h3>
                                <p className="text-sm text-red-600">{request.rejection_reason}</p>
                            </div>
                        )}

                        {/* Receipt / Liquidation / Thank You — shown after disbursement */}
                        {request.status === 'DISBURSED' && (
                            <div className="bg-white rounded-xl border p-6 shadow-sm">
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Receipt size={15} /> Receipt / Proof / Liquidation
                                </h2>

                                {request.receipt_submitted_at ? (
                                    <div className="space-y-4">
                                        {/* Thank-you message */}
                                        {request.receipt_message && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <div className="flex items-start gap-2">
                                                    <MessageSquare size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="text-xs text-blue-500 font-medium mb-1">Beneficiary&apos;s Message</p>
                                                        <p className="text-sm text-blue-800 italic">&ldquo;{request.receipt_message}&rdquo;</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Receipt files */}
                                        {request.receipts.length > 0 ? (
                                            <div className="space-y-2">
                                                {request.receipts.map(r => (
                                                    <a
                                                        key={r.id}
                                                        href={r.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors group"
                                                    >
                                                        <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                                                            <Receipt size={16} className="text-green-500" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-800 truncate">{r.file_name}</p>
                                                            <p className="text-xs text-gray-400">
                                                                {r.file_type} · {(r.file_size / 1024).toFixed(1)} KB · {new Date(r.uploaded_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <ExternalLink size={14} className="text-gray-400 group-hover:text-green-500 transition-colors" />
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No receipt files uploaded (message only).</p>
                                        )}

                                        <p className="text-xs text-gray-400">
                                            Submitted on {new Date(request.receipt_submitted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
                                            Linked donors were notified.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <Receipt size={24} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-sm text-gray-400">Beneficiary has not yet submitted receipts or a message.</p>
                                        <p className="text-xs text-gray-300 mt-1">They will be prompted to upload proof and a thank-you message.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column — Beneficiary Info + Actions */}
                    <div className="space-y-6">

                        {/* Beneficiary Card */}
                        <div className="bg-white rounded-xl border p-6 shadow-sm">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <User size={15} /> Beneficiary
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                                        <User size={20} className="text-red-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {request.beneficiary.firstName && request.beneficiary.lastName
                                                ? `${request.beneficiary.firstName} ${request.beneficiary.lastName}`
                                                : request.beneficiary.username}
                                        </p>
                                        <p className="text-xs text-gray-400">@{request.beneficiary.username}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 pt-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Type</span>
                                        <span className="font-medium text-gray-700 px-2 py-0.5 bg-red-50 rounded-full text-xs">{request.beneficiary.type.toLowerCase()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Email</span>
                                        <span className="text-gray-700">{request.beneficiary.email || request.beneficiary.user.email || '—'}</span>
                                    </div>
                                    {request.beneficiary.phone && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Phone</span>
                                            <span className="text-gray-700">{request.beneficiary.phone}</span>
                                        </div>
                                    )}
                                    {request.beneficiary.address && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Address</span>
                                            <span className="text-gray-700 text-right max-w-[180px]">{request.beneficiary.address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Funding Summary */}
                        <div className="bg-white rounded-xl border p-6 shadow-sm">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <DollarSign size={15} /> Funding Summary
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Requested</span>
                                    <span className="text-lg font-bold text-gray-900">₱{request.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Allocated</span>
                                    <span className="text-lg font-bold text-green-600">₱{request.allocatedAmount.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className="bg-red-500 h-2 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, (request.allocatedAmount / request.amount) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 text-center">
                                    {Math.round((request.allocatedAmount / request.amount) * 100)}% funded
                                </p>
                                {request.remainingToAllocate > 0 && (
                                    <div className="flex justify-between items-center pt-1 border-t">
                                        <span className="text-sm text-gray-500">Remaining</span>
                                        <span className="text-sm font-bold text-red-600">₱{request.remainingToAllocate.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {canReview && (
                            <div className="bg-white rounded-xl border p-6 shadow-sm space-y-3">
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Actions</h2>

                                {request.status === 'PENDING' && (
                                    <Button
                                        onClick={() => handleStatusUpdate('UNDER_REVIEW')}
                                        disabled={actionLoading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {actionLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Eye size={16} className="mr-2" />}
                                        Mark Under Review
                                    </Button>
                                )}

                                <Button
                                    onClick={() => setShowAllocateForm(true)}
                                    disabled={actionLoading}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <HandCoins size={16} className="mr-2" />
                                    Allocate Funds
                                </Button>

                                {!showRejectForm ? (
                                    <Button
                                        onClick={() => setShowRejectForm(true)}
                                        variant="outline"
                                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                        <XCircle size={16} className="mr-2" />
                                        Reject Request
                                    </Button>
                                ) : (
                                    <div className="space-y-2 pt-1">
                                        <Textarea
                                            placeholder="Provide a reason for rejection..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            rows={3}
                                            className="text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => { setShowRejectForm(false); setRejectionReason(''); }}
                                                variant="outline"
                                                className="flex-1"
                                                size="sm"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={() => handleStatusUpdate('REJECTED')}
                                                disabled={actionLoading || !rejectionReason.trim()}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                                size="sm"
                                            >
                                                {actionLoading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                                                Confirm Reject
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Available Funds Quick View */}
                        {availableFunds && canAllocate && (
                            <div className="bg-white rounded-xl border p-6 shadow-sm">
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <PiggyBank size={15} /> Available Funds
                                </h2>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-2 rounded-lg bg-blue-50/50">
                                        <span className="text-xs font-medium text-blue-600">Unrestricted</span>
                                        <span className="text-sm font-bold text-blue-700">₱{availableFunds.unrestricted.available.toLocaleString()}</span>
                                    </div>
                                    {availableFunds.restricted.map(pool => (
                                        <div key={pool.poolId} className="flex justify-between items-center p-2 rounded-lg bg-purple-50/50">
                                            <span className="text-xs font-medium text-purple-600 truncate mr-2">{pool.poolName}</span>
                                            <span className="text-sm font-bold text-purple-700 shrink-0">₱{pool.available.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Disburse Action — only when APPROVED and has allocations */}
                        {canDisburse && (
                            <div className="bg-white rounded-xl border p-6 shadow-sm space-y-3">
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Banknote size={15} /> Disbursement
                                </h2>
                                <p className="text-xs text-gray-500">
                                    This request has been approved and funds are allocated. Mark as disbursed to release funds and notify the beneficiary and linked donors.
                                </p>

                                {!showDisburseForm ? (
                                    <Button
                                        onClick={() => setShowDisburseForm(true)}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <Banknote size={16} className="mr-2" />
                                        Mark as Disbursed
                                    </Button>
                                ) : (
                                    <div className="space-y-3 pt-1">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Disbursement Method *</label>
                                            <select
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                                value={disbursementMethod}
                                                onChange={(e) => setDisbursementMethod(e.target.value)}
                                            >
                                                <option value="cash">Cash (pick up at office)</option>
                                                <option value="check">Check</option>
                                                <option value="bank_transfer">Bank Transfer</option>
                                            </select>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-green-700">Amount to disburse</span>
                                                <span className="font-bold text-green-800">
                                                    ₱{request.allocatedAmount.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => setShowDisburseForm(false)}
                                                variant="outline"
                                                className="flex-1"
                                                size="sm"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={() => handleStatusUpdate('DISBURSED', { disbursement_method: disbursementMethod })}
                                                disabled={actionLoading}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                                size="sm"
                                            >
                                                {actionLoading ? <Loader2 size={14} className="animate-spin mr-1" /> : <Send size={14} className="mr-1" />}
                                                Confirm Disburse
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Disbursed Info */}
                        {request.status === 'DISBURSED' && request.disbursed_at && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                                <h3 className="text-sm font-semibold text-green-700 mb-1 flex items-center gap-2">
                                    <CheckCircle2 size={15} /> Disbursed
                                </h3>
                                <p className="text-sm text-green-600">
                                    Funds were disbursed on {new Date(request.disbursed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
                                    Beneficiary and linked donors have been notified.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Allocate Funds Modal */}
            {showAllocateForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAllocateForm(false)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b bg-red-600 text-white flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h3 className="text-lg font-bold">Allocate Funds</h3>
                                <p className="text-red-100 text-xs">
                                    {formatReqId(request.id, request.created_at)} · ₱{request.remainingToAllocate.toLocaleString()} remaining
                                </p>
                            </div>
                            <button onClick={() => setShowAllocateForm(false)} className="text-white/70 hover:text-white">
                                <XCircle size={22} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Allocation Sources */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700">Fund Sources</label>
                                {allocations.map((alloc, i) => (
                                    <div key={i} className="p-3 rounded-lg border space-y-3 bg-gray-50/50">
                                        <div className="flex items-center gap-3">
                                            <select
                                                className="flex-1 h-9 px-3 rounded-md border text-sm bg-white"
                                                value={alloc.sourceType}
                                                onChange={(e) => updateAllocation(i, 'sourceType', e.target.value)}
                                            >
                                                <option value="UNRESTRICTED">Unrestricted Fund</option>
                                                <option value="RESTRICTED">Restricted (Pool)</option>
                                            </select>
                                            {allocations.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeAllocationRow(i)}
                                                    className="text-gray-400 hover:text-red-500 p-1"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            )}
                                        </div>
                                        {alloc.sourceType === 'RESTRICTED' && availableFunds && (
                                            <select
                                                className="w-full h-9 px-3 rounded-md border text-sm bg-white"
                                                value={alloc.poolId}
                                                onChange={(e) => updateAllocation(i, 'poolId', e.target.value)}
                                            >
                                                <option value="">Select Pool</option>
                                                {availableFunds.restricted.map(p => (
                                                    <option key={p.poolId} value={p.poolId}>
                                                        {p.poolName} (₱{p.available.toLocaleString()} available)
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        <Input
                                            type="number"
                                            placeholder="Amount (₱)"
                                            min="1"
                                            value={alloc.amount}
                                            onChange={(e) => updateAllocation(i, 'amount', e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addAllocationRow}
                                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                                >
                                    + Add another source
                                </button>
                            </div>

                            {/* Disbursement Date */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Disbursement Date</label>
                                <Input
                                    type="date"
                                    value={disbursementDate}
                                    onChange={(e) => setDisbursementDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="h-9"
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
                                <Textarea
                                    placeholder="Any notes about this allocation..."
                                    value={disbursementNotes}
                                    onChange={(e) => setDisbursementNotes(e.target.value)}
                                    rows={2}
                                    className="text-sm"
                                />
                            </div>

                            {/* Notification toggles */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifyDonors}
                                        onChange={(e) => setNotifyDonors(e.target.checked)}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    Notify linked donors via email
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notifyBeneficiary}
                                        onChange={(e) => setNotifyBeneficiary(e.target.checked)}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    Notify beneficiary via email
                                </label>
                            </div>

                            {/* Summary */}
                            <div className="bg-gray-50 rounded-lg p-3 border text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Total to allocate</span>
                                    <span className="font-bold text-gray-900">
                                        ₱{allocations.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAllocateForm(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAllocate}
                                    disabled={actionLoading || !disbursementDate || allocations.some(a => !a.amount || parseFloat(a.amount) <= 0)}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {actionLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
                                    Confirm Allocation
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
