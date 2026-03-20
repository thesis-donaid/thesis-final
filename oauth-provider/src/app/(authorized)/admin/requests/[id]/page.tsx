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
    Plus,
    Trash2,
    Calendar,
    Mail,
    Phone,
    MapPin,
    Tag,
    Percent,
    Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

// ---- Interfaces (unchanged) ----
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
        donation: { id: number; email: string; amount: number; status: string };
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
    receipt_status: 'PENDING' | 'COMPLETED' | 'MISSING';
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
interface PoolDonor {
    donationId: number;
    donorName: string;
    email: string;
    totalDonated: number;
    remainingAmount: number;
    paidAt: string | null;
    isAnonymous: boolean;
}

// ---- Config (unchanged) ----
const urgencyConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    LOW:    { label: 'Low Priority',  className: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
    MEDIUM: { label: 'Medium',        className: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle },
    HIGH:   { label: 'Critical',      className: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
};
const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    PENDING:      { label: 'Pending',      className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    UNDER_REVIEW: { label: 'Under Review', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: Eye },
    APPROVED:     { label: 'Approved',     className: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
    REJECTED:     { label: 'Rejected',     className: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
    DISBURSED:    { label: 'Disbursed',    className: 'bg-gray-100 text-gray-700 border-gray-200', icon: CheckCircle2 },
};

export default function AdminRequestReviewPage() {
    // ---- All state and hooks (exactly as before) ----
    const { data: session, status: authStatus } = useSession();
    const params = useParams();
    const router = useRouter();
    const requestId = params.id as string;

    const [request, setRequest] = useState<RequestDetail | null>(null);
    const [availableFunds, setAvailableFunds] = useState<AvailableFunds | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [showAllocateForm, setShowAllocateForm] = useState(false);
    const [allocations, setAllocations] = useState<AllocationEntry[]>([
        { sourceType: 'UNRESTRICTED', poolId: '', amount: '' },
    ]);
    const [disbursementDate, setDisbursementDate] = useState('');
    const [disbursementNotes, setDisbursementNotes] = useState('');
    const [notifyDonors, setNotifyDonors] = useState(true);
    const [notifyBeneficiary, setNotifyBeneficiary] = useState(true);
    const [showDisburseForm, setShowDisburseForm] = useState(false);
    const [disbursementMethod, setDisbursementMethod] = useState('cash');
    const [receiptStatusLoading, setReceiptStatusLoading] = useState(false);
    const [poolDonors, setPoolDonors] = useState<Record<string, PoolDonor[]>>({});
    const [loadingDonors, setLoadingDonors] = useState<Record<string, boolean>>({});

    const fetchPoolDonors = async (source: string, poolId?: string) => {
        const key = source === 'UNRESTRICTED' ? 'unrestricted' : poolId ?? '';
        if (!key) return;
        setLoadingDonors(prev => ({ ...prev, [key]: true }));
        try {
            const params = new URLSearchParams({ source });
            if (poolId) params.set('poolId', poolId);
            const res = await fetch(`/api/admin/pool-donors?${params}`);
            const data = await res.json();
            if (data.success) {
                setPoolDonors(prev => ({ ...prev, [key]: data.data }));
            }
        } catch (err) {
            console.error('Failed to fetch pool donors:', err);
        } finally {
            setLoadingDonors(prev => ({ ...prev, [key]: false }));
        }
    };

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

        const entry = updated[index];
        if (field === 'sourceType' && value === 'UNRESTRICTED') {
            fetchPoolDonors('UNRESTRICTED');
        } else if (field === 'poolId' && value && entry.sourceType === 'RESTRICTED') {
            fetchPoolDonors('RESTRICTED', value);
        } else if (field === 'sourceType' && value === 'RESTRICTED' && entry.poolId) {
            fetchPoolDonors('RESTRICTED', entry.poolId);
        }
    };

    const handleReceiptStatusUpdate = async (newStatus: 'PENDING' | 'COMPLETED' | 'MISSING') => {
        setReceiptStatusLoading(true);
        try {
            const res = await fetch(`/api/admin/requests/${requestId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receipt_status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                setRequest(prev => prev ? { ...prev, receipt_status: newStatus } : prev);
            } else {
                alert(data.error || 'Failed to update receipt status');
            }
        } catch {
            alert('Failed to update receipt status');
        } finally {
            setReceiptStatusLoading(false);
        }
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
                    <XCircle className="w-12 h-12 text-gray-300 mx-auto" />
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
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Back + Header */}
                <div>
                    <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 mb-3 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    {formatReqId(request.id, request.created_at)}
                                </h1>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusBadge.className}`}>
                                    <StatusIcon size={14} />
                                    {statusBadge.label}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${urgency.className}`}>
                                    <urgency.icon size={14} />
                                    {urgency.label}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">
                                Submitted {formatDate(request.created_at)}
                                {request.reviewed_at && ` · Reviewed ${formatDate(request.reviewed_at)}`}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl md:text-4xl font-bold text-gray-900">₱{request.amount.toLocaleString()}</div>
                            <p className="text-xs text-gray-400 mt-1">Requested Amount</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column — Request Details */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Purpose */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <FileText size={16} /> Request Details
                            </h2>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase tracking-wider">Purpose</label>
                                    <p className="text-gray-900 mt-1 text-lg">{request.purpose}</p>
                                </div>
                                {request.additional_notes && (
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider">Additional Notes</label>
                                        <p className="text-gray-700 mt-1 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-100">{request.additional_notes}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-6 pt-2">
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1"><Calendar size={12} /> Date Needed</label>
                                        <p className="text-gray-900 mt-1 font-medium">{formatDate(request.date_needed)}</p>
                                        <p className={`text-xs mt-1 ${daysUntilNeeded <= 7 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                            {daysUntilNeeded > 0 ? `${daysUntilNeeded} days from now` : daysUntilNeeded === 0 ? 'Today' : `${Math.abs(daysUntilNeeded)} days overdue`}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1"><Mail size={12} /> Contact Email</label>
                                        <p className="text-gray-900 mt-1">{request.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        {request.documents.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FileText size={16} /> Supporting Documents ({request.documents.length})
                                </h2>
                                <div className="space-y-2">
                                    {request.documents.map(doc => (
                                        <a
                                            key={doc.id}
                                            href={doc.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group bg-gray-50/30"
                                        >
                                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                                                <FileText size={18} className="text-red-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{doc.file_name}</p>
                                                <p className="text-xs text-gray-400">{doc.file_type} · {(doc.file_size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <ExternalLink size={16} className="text-gray-300 group-hover:text-red-500 transition-colors" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Existing Allocations */}
                        {request.allocations.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <HandCoins size={16} /> Fund Allocations
                                </h2>
                                <div className="space-y-4">
                                    {request.allocations.map(a => (
                                        <div key={a.id} className="p-5 rounded-xl border border-gray-100 bg-gray-50/50">
                                            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                                        a.source_type === 'RESTRICTED' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                                    }`}>
                                                        {a.source_type}
                                                    </span>
                                                    {a.pool && (
                                                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
                                                            {a.pool.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xl font-bold text-gray-900">₱{a.amount.toLocaleString()}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                                                <span>Allocated {new Date(a.allocated_at).toLocaleDateString()}</span>
                                                {a.disbursement_date && (
                                                    <span>Disbursement: {new Date(a.disbursement_date).toLocaleDateString()}</span>
                                                )}
                                                <span className={`inline-flex items-center gap-1 ${a.is_disbursed ? 'text-green-600' : 'text-amber-600'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${a.is_disbursed ? 'bg-green-600' : 'bg-amber-600'}`} />
                                                    {a.is_disbursed ? 'Disbursed' : 'Pending disbursement'}
                                                </span>
                                            </div>
                                            {a.donationAllocations.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                                    <p className="text-[11px] text-gray-400 uppercase tracking-wider">Linked Donations</p>
                                                    {a.donationAllocations.map(da => (
                                                        <div key={da.id} className="text-xs text-gray-600 flex justify-between">
                                                            <span>{da.donation.email}</span>
                                                            <span className="font-medium">₱{da.amount_used.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div className="flex justify-between pt-3 text-base border-t border-gray-200">
                                        <span className="text-gray-500">Total Allocated</span>
                                        <span className="font-bold text-gray-900">₱{request.allocatedAmount.toLocaleString()}</span>
                                    </div>
                                    {request.remainingToAllocate > 0 && (
                                        <div className="flex justify-between text-base">
                                            <span className="text-gray-500">Remaining</span>
                                            <span className="font-bold text-red-600">₱{request.remainingToAllocate.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Rejection Info */}
                        {request.status === 'REJECTED' && request.rejection_reason && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                                <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                                    <XCircle size={16} /> Rejection Reason
                                </h3>
                                <p className="text-sm text-red-600 bg-white p-4 rounded-xl border border-red-100">{request.rejection_reason}</p>
                            </div>
                        )}

                        {/* Receipt / Liquidation Section */}
                        {request.status === 'DISBURSED' && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <Receipt size={16} /> Receipt / Proof / Liquidation
                                    </h2>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                                        request.receipt_status === 'COMPLETED'
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : request.receipt_status === 'MISSING'
                                            ? 'bg-red-50 text-red-700 border-red-200'
                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                        {request.receipt_status === 'COMPLETED' ? <CheckCircle2 size={12} /> : request.receipt_status === 'MISSING' ? <XCircle size={12} /> : <Clock size={12} />}
                                        {request.receipt_status === 'COMPLETED' ? 'Completed' : request.receipt_status === 'MISSING' ? 'Missing' : 'Pending Review'}
                                    </span>
                                </div>

                                {request.receipt_submitted_at ? (
                                    <div className="space-y-5">
                                        {request.receipt_message && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                                                <div className="flex items-start gap-3">
                                                    <MessageSquare size={18} className="text-blue-600 mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="text-xs text-blue-600 font-medium mb-1">Beneficiary&apos;s Message</p>
                                                        <p className="text-sm text-blue-800 italic">&ldquo;{request.receipt_message}&rdquo;</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {request.receipts.length > 0 ? (
                                            <div className="space-y-3">
                                                {request.receipts.map(r => (
                                                    <a
                                                        key={r.id}
                                                        href={r.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-gray-50/30"
                                                    >
                                                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                                                            <Receipt size={18} className="text-green-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-800 truncate">{r.file_name}</p>
                                                            <p className="text-xs text-gray-400">
                                                                {r.file_type} · {(r.file_size / 1024).toFixed(1)} KB · {new Date(r.uploaded_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <ExternalLink size={16} className="text-gray-300 group-hover:text-green-500 transition-colors" />
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-200">No receipt files uploaded (message only).</p>
                                        )}

                                        <p className="text-xs text-gray-400">
                                            Submitted on {new Date(request.receipt_submitted_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
                                            Linked donors were notified.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <Receipt size={32} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-sm text-gray-400">Beneficiary has not yet submitted receipts or a message.</p>
                                        <p className="text-xs text-gray-300 mt-1">They will be prompted to upload proof and a thank-you message.</p>
                                    </div>
                                )}

                                {/* Admin Receipt Status Actions */}
                                <div className="mt-5 pt-5 border-t border-gray-200">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Update Receipt Status</p>
                                    <div className="bg-gray-100/80 p-1 rounded-xl flex gap-1">
                                        <button
                                            onClick={() => handleReceiptStatusUpdate('COMPLETED')}
                                            disabled={receiptStatusLoading}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                                request.receipt_status === 'COMPLETED'
                                                    ? 'bg-white text-green-600 shadow-sm ring-1 ring-black/5'
                                                    : 'text-gray-500 hover:text-green-600 hover:bg-white/50'
                                            } ${receiptStatusLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {receiptStatusLoading && request.receipt_status === 'COMPLETED' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                            Completed
                                        </button>
                                        <button
                                            onClick={() => handleReceiptStatusUpdate('PENDING')}
                                            disabled={receiptStatusLoading}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                                request.receipt_status === 'PENDING'
                                                    ? 'bg-white text-amber-600 shadow-sm ring-1 ring-black/5'
                                                    : 'text-gray-500 hover:text-amber-600 hover:bg-white/50'
                                            } ${receiptStatusLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {receiptStatusLoading && request.receipt_status === 'PENDING' ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                                            Pending
                                        </button>
                                        <button
                                            onClick={() => handleReceiptStatusUpdate('MISSING')}
                                            disabled={receiptStatusLoading}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                                request.receipt_status === 'MISSING'
                                                    ? 'bg-white text-red-600 shadow-sm ring-1 ring-black/5'
                                                    : 'text-gray-500 hover:text-red-600 hover:bg-white/50'
                                            } ${receiptStatusLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {receiptStatusLoading && request.receipt_status === 'MISSING' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                            Missing
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column — Beneficiary Info + Actions */}
                    <div className="space-y-8">

                        {/* Beneficiary Card */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                                <User size={16} /> Beneficiary
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
                                        <User size={24} className="text-red-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-lg">
                                            {request.beneficiary.firstName && request.beneficiary.lastName
                                                ? `${request.beneficiary.firstName} ${request.beneficiary.lastName}`
                                                : request.beneficiary.username}
                                        </p>
                                        <p className="text-xs text-gray-400">@{request.beneficiary.username}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 flex items-center gap-1"><Tag size={12} /> Type</span>
                                        <span className="font-medium text-gray-700 px-3 py-1 bg-red-50 rounded-full text-xs border border-red-200">{request.beneficiary.type.toLowerCase()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 flex items-center gap-1"><Mail size={12} /> Email</span>
                                        <span className="text-gray-700">{request.beneficiary.email || request.beneficiary.user.email || '—'}</span>
                                    </div>
                                    {request.beneficiary.phone && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 flex items-center gap-1"><Phone size={12} /> Phone</span>
                                            <span className="text-gray-700">{request.beneficiary.phone}</span>
                                        </div>
                                    )}
                                    {request.beneficiary.address && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 flex items-center gap-1"><MapPin size={12} /> Address</span>
                                            <span className="text-gray-700 text-right max-w-[180px]">{request.beneficiary.address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Funding Summary */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                                <DollarSign size={16} /> Funding Summary
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Requested</span>
                                    <span className="text-xl font-bold text-gray-900">₱{request.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Allocated</span>
                                    <span className="text-xl font-bold text-green-600">₱{request.allocatedAmount.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div
                                        className="bg-red-500 h-2.5 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, (request.allocatedAmount / request.amount) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 text-center">
                                    {Math.round((request.allocatedAmount / request.amount) * 100)}% funded
                                </p>
                                {request.remainingToAllocate > 0 && (
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                        <span className="text-sm text-gray-500">Remaining</span>
                                        <span className="text-sm font-bold text-red-600">₱{request.remainingToAllocate.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {canReview && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Actions</h2>

                                {request.status === 'PENDING' && (
                                    <Button
                                        onClick={() => handleStatusUpdate('UNDER_REVIEW')}
                                        disabled={actionLoading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11"
                                    >
                                        {actionLoading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Eye size={18} className="mr-2" />}
                                        Mark Under Review
                                    </Button>
                                )}

                                <Button
                                    onClick={() => {
                                        setShowAllocateForm(true);
                                        fetchPoolDonors('UNRESTRICTED');
                                    }}
                                    disabled={actionLoading}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-11"
                                >
                                    <HandCoins size={18} className="mr-2" />
                                    Allocate Funds
                                </Button>

                                {!showRejectForm ? (
                                    <Button
                                        onClick={() => setShowRejectForm(true)}
                                        variant="outline"
                                        className="w-full border-red-200 text-red-600 hover:bg-red-50 rounded-xl h-11"
                                    >
                                        <XCircle size={18} className="mr-2" />
                                        Reject Request
                                    </Button>
                                ) : (
                                    <div className="space-y-3 pt-2">
                                        <Textarea
                                            placeholder="Provide a reason for rejection..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            rows={3}
                                            className="text-sm border-gray-200 focus:border-red-300 focus:ring-red-200 rounded-xl"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => { setShowRejectForm(false); setRejectionReason(''); }}
                                                variant="outline"
                                                className="flex-1 rounded-xl"
                                                size="sm"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={() => handleStatusUpdate('REJECTED')}
                                                disabled={actionLoading || !rejectionReason.trim()}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl"
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
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <PiggyBank size={16} /> Available Funds
                                </h2>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                                        <span className="text-xs font-medium text-blue-700">Unrestricted</span>
                                        <span className="text-sm font-bold text-blue-800">₱{availableFunds.unrestricted.available.toLocaleString()}</span>
                                    </div>
                                    {availableFunds.restricted.map(pool => (
                                        <div key={pool.poolId} className="flex justify-between items-center p-3 rounded-xl bg-purple-50/70 border border-purple-100">
                                            <span className="text-xs font-medium text-purple-700 truncate mr-2">{pool.poolName}</span>
                                            <span className="text-sm font-bold text-purple-800 shrink-0">₱{pool.available.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Disburse Action */}
                        {canDisburse && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Banknote size={16} /> Disbursement
                                </h2>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    This request has been approved and funds are allocated. Mark as disbursed to release funds and notify the beneficiary and linked donors.
                                </p>

                                {!showDisburseForm ? (
                                    <Button
                                        onClick={() => setShowDisburseForm(true)}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-11"
                                    >
                                        <Banknote size={18} className="mr-2" />
                                        Mark as Disbursed
                                    </Button>
                                ) : (
                                    <div className="space-y-4 pt-1">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">Disbursement Method *</label>
                                            <select
                                                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm focus:border-red-300 focus:ring-red-200"
                                                value={disbursementMethod}
                                                onChange={(e) => setDisbursementMethod(e.target.value)}
                                            >
                                                <option value="cash">Cash (pick up at office)</option>
                                                <option value="check">Check</option>
                                                <option value="bank_transfer">Bank Transfer</option>
                                            </select>
                                        </div>
                                        <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-sm">
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
                                                className="flex-1 rounded-xl"
                                                size="sm"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={() => handleStatusUpdate('DISBURSED', { disbursement_method: disbursementMethod })}
                                                disabled={actionLoading}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl"
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
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                                <h3 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                                    <CheckCircle2 size={18} /> Disbursed
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

            {/* Allocate Funds Modal — refined */}
            {showAllocateForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAllocateForm(false)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Allocate Funds</h3>
                                <p className="text-sm text-gray-500">
                                    {formatReqId(request.id, request.created_at)} · ₱{request.remainingToAllocate.toLocaleString()} remaining
                                </p>
                            </div>
                            <button onClick={() => setShowAllocateForm(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Allocation Sources */}
                            <div className="space-y-4">
                                <label className="text-sm font-semibold text-gray-700">Fund Sources</label>
                                {allocations.map((alloc, i) => (
                                    <div key={i} className="p-5 rounded-xl border border-gray-200 space-y-4 bg-gray-50/30">
                                        <div className="flex items-center gap-3">
                                            <select
                                                className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:border-red-300 focus:ring-red-200"
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
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                        {alloc.sourceType === 'RESTRICTED' && availableFunds && (
                                            <select
                                                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:border-red-300 focus:ring-red-200"
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

                                        {/* Donors list for selected source */}
                                        {(() => {
                                            const donorKey = alloc.sourceType === 'UNRESTRICTED' ? 'unrestricted' : alloc.poolId;
                                            const donors = donorKey ? poolDonors[donorKey] : null;
                                            const isLoading = donorKey ? loadingDonors[donorKey] : false;

                                            if (alloc.sourceType === 'UNRESTRICTED' || (alloc.sourceType === 'RESTRICTED' && alloc.poolId)) {
                                                return (
                                                    <div className="rounded-xl border border-gray-200 bg-white max-h-48 overflow-y-auto">
                                                        <div className="px-4 py-2 bg-gray-50 border-b sticky top-0">
                                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Donors ({donors?.length ?? 0})
                                                            </span>
                                                        </div>
                                                        {isLoading ? (
                                                            <div className="p-4 text-center">
                                                                <Loader2 size={16} className="animate-spin mx-auto text-gray-400" />
                                                            </div>
                                                        ) : donors && donors.length > 0 ? (
                                                            <div className="divide-y divide-gray-100">
                                                                {donors.map(d => (
                                                                    <div key={d.donationId} className="px-4 py-3 flex items-center justify-between text-xs">
                                                                        <div className="min-w-0">
                                                                            <p className="font-medium text-gray-800 truncate">{d.donorName}</p>
                                                                            {!d.isAnonymous && (
                                                                                <p className="text-gray-400 truncate">{d.email}</p>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-right shrink-0 ml-4">
                                                                            <p className="font-semibold text-gray-700">₱{d.remainingAmount.toLocaleString()}</p>
                                                                            <p className="text-gray-400">of ₱{d.totalDonated.toLocaleString()}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="p-4 text-xs text-gray-400 text-center">No donors with available balance</p>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                        <Input
                                            type="number"
                                            placeholder="Amount (₱)"
                                            min="1"
                                            value={alloc.amount}
                                            onChange={(e) => updateAllocation(i, 'amount', e.target.value)}
                                            className="h-10 rounded-xl border-gray-200 focus:border-red-300 focus:ring-red-200"
                                        />
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addAllocationRow}
                                    className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                                >
                                    <Plus size={16} /> Add another source
                                </button>
                            </div>

                            {/* Disbursement Date */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Disbursement Date</label>
                                <Input
                                    type="date"
                                    value={disbursementDate}
                                    onChange={(e) => setDisbursementDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="h-10 rounded-xl border-gray-200 focus:border-red-300 focus:ring-red-200"
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
                                <Textarea
                                    placeholder="Any notes about this allocation..."
                                    value={disbursementNotes}
                                    onChange={(e) => setDisbursementNotes(e.target.value)}
                                    rows={2}
                                    className="text-sm border-gray-200 focus:border-red-300 focus:ring-red-200 rounded-xl"
                                />
                            </div>

                            {/* Notification toggles */}
                            <div className="space-y-3">
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
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Total to allocate</span>
                                    <span className="font-bold text-gray-900">
                                        ₱{allocations.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setShowAllocateForm(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAllocate}
                                    disabled={actionLoading || !disbursementDate || allocations.some(a => !a.amount || parseFloat(a.amount) <= 0)}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-11"
                                >
                                    {actionLoading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Send size={18} className="mr-2" />}
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