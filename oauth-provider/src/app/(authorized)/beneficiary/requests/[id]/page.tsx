'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    Eye,
    Upload,
    Send,
    Loader2,
    ExternalLink,
    Receipt,
    MessageSquare,
    AlertTriangle,
} from 'lucide-react';

interface RequestDocument {
    id: number;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
    uploaded_at: string;
}

interface ReceiptFile {
    id: number;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
    uploaded_at: string;
}

interface BeneficiaryInfo {
    id: number;
    username: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    type: string;
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
    reviewed_at: string | null;
    rejection_reason: string | null;
    disbursed_at: string | null;
    disbursed_amount: number | null;
    receipt_message: string | null;
    receipt_submitted_at: string | null;
    created_at: string;
    beneficiary: BeneficiaryInfo;
    documents: RequestDocument[];
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    PENDING:      { label: 'Pending',      className: 'bg-amber-50 text-amber-600 border border-amber-200', icon: Clock },
    UNDER_REVIEW: { label: 'Under Review', className: 'bg-blue-50 text-blue-600 border border-blue-200',   icon: Eye },
    APPROVED:     { label: 'Approved',     className: 'bg-green-50 text-green-600 border border-green-200', icon: CheckCircle2 },
    REJECTED:     { label: 'Rejected',     className: 'bg-red-50 text-red-600 border border-red-200',       icon: XCircle },
    DISBURSED:    { label: 'Disbursed',    className: 'bg-purple-50 text-purple-600 border border-purple-200', icon: CheckCircle2 },
};

const URGENCY_CONFIG: Record<string, { label: string; className: string }> = {
    LOW:    { label: 'Low',    className: 'bg-gray-100 text-gray-600' },
    MEDIUM: { label: 'Medium', className: 'bg-orange-100 text-orange-700' },
    HIGH:   { label: 'Critical', className: 'bg-red-100 text-red-700' },
};

export default function BeneficiaryRequestDetailPage() {
    const { status: authStatus } = useSession();
    const params = useParams();
    const requestId = params.id as string;

    const [request, setRequest] = useState<RequestDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Receipts state
    const [receipts, setReceipts] = useState<ReceiptFile[]>([]);
    const [existingMessage, setExistingMessage] = useState<string | null>(null);
    const [receiptSubmittedAt, setReceiptSubmittedAt] = useState<string | null>(null);

    // Receipt submission form
    const [thankYouMessage, setThankYouMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchRequest = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/beneficiary/requests/${requestId}`);
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setRequest(data);
        } catch {
            setError('Failed to load request details');
        } finally {
            setLoading(false);
        }
    }, [requestId]);

    const fetchReceipts = useCallback(async () => {
        try {
            const res = await fetch(`/api/beneficiary/requests/${requestId}/receipt`);
            if (res.ok) {
                const data = await res.json();
                setReceipts(data.receipts || []);
                setExistingMessage(data.message);
                setReceiptSubmittedAt(data.submittedAt);
            }
        } catch {
            console.error('Failed to fetch receipts');
        }
    }, [requestId]);

    useEffect(() => {
        if (authStatus === 'authenticated') {
            fetchRequest();
            fetchReceipts();
        }
        if (authStatus === 'unauthenticated') setLoading(false);
    }, [authStatus, fetchRequest, fetchReceipts]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

        const valid = files.filter(f => {
            if (!validTypes.includes(f.type)) {
                alert(`Invalid file type: ${f.name}. Allowed: PNG, JPG, PDF`);
                return false;
            }
            if (f.size > 10 * 1024 * 1024) {
                alert(`File too large: ${f.name}. Max 10MB`);
                return false;
            }
            return true;
        });

        setSelectedFiles(prev => [...prev, ...valid]);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmitReceipt = async () => {
        if (selectedFiles.length === 0 && !thankYouMessage.trim()) {
            alert('Please add at least a message or upload receipt files.');
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            if (thankYouMessage.trim()) {
                formData.append('message', thankYouMessage.trim());
            }
            for (const file of selectedFiles) {
                formData.append('files', file);
            }

            const res = await fetch(`/api/beneficiary/requests/${requestId}/receipt`, {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                setSubmitSuccess(true);
                setSelectedFiles([]);
                setThankYouMessage('');
                fetchReceipts();
                fetchRequest();
            } else {
                alert(data.error || 'Failed to submit receipt');
            }
        } catch {
            alert('An error occurred while submitting');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

    // Loading state
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
                    <Link href="/beneficiary/requests">
                        <button className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Back to Requests</button>
                    </Link>
                </div>
            </div>
        );
    }

    const statusBadge = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.PENDING;
    const urgency = URGENCY_CONFIG[request.urgency_level] ?? URGENCY_CONFIG.LOW;
    const StatusIcon = statusBadge.icon;
    const isDisbursed = request.status === 'DISBURSED';
    const hasSubmittedReceipt = !!receiptSubmittedAt;

    return (
        <div className="min-h-screen bg-gray-50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Back + Header */}
                <div>
                    <Link href="/beneficiary/requests" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 mb-3 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to My Requests
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Request #{request.id}
                                </h1>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.className}`}>
                                    <StatusIcon size={13} />
                                    {statusBadge.label}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${urgency.className}`}>
                                    {urgency.label}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">
                                Submitted on {formatDate(request.created_at)}
                                {request.reviewed_at && ` · Reviewed ${formatDate(request.reviewed_at)}`}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-gray-900">{formatCurrency(request.amount)}</div>
                            <p className="text-xs text-gray-400 mt-0.5">Requested Amount</p>
                        </div>
                    </div>
                </div>

                {/* Request Details Card */}
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
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase tracking-wider">Contact Email</label>
                                <p className="text-gray-900 mt-1">{request.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Supporting Documents */}
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

                {/* Rejection Info */}
                {request.status === 'REJECTED' && request.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-2">
                            <XCircle size={15} /> Rejection Reason
                        </h3>
                        <p className="text-sm text-red-600">{request.rejection_reason}</p>
                    </div>
                )}

                {/* Disbursement Info */}
                {isDisbursed && request.disbursed_at && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-green-700 mb-1 flex items-center gap-2">
                            <CheckCircle2 size={15} /> Funds Disbursed
                        </h3>
                        <p className="text-sm text-green-600">
                            Your funds were disbursed on {formatDate(request.disbursed_at)}.
                            {request.disbursed_amount && ` Amount: ${formatCurrency(request.disbursed_amount)}`}
                        </p>
                    </div>
                )}

                {/* Previously Submitted Receipts */}
                {hasSubmittedReceipt && (
                    <div className="bg-white rounded-xl border p-6 shadow-sm">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Receipt size={15} /> Submitted Receipts & Message
                        </h2>

                        {existingMessage && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-2">
                                    <MessageSquare size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-blue-500 font-medium mb-1">Your Message to Donors</p>
                                        <p className="text-sm text-blue-800 italic">&ldquo;{existingMessage}&rdquo;</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {receipts.length > 0 && (
                            <div className="space-y-2">
                                {receipts.map(r => (
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
                                                {r.file_type} · {(r.file_size / 1024).toFixed(1)} KB · Uploaded {formatDate(r.uploaded_at)}
                                            </p>
                                        </div>
                                        <ExternalLink size={14} className="text-gray-400 group-hover:text-green-500 transition-colors" />
                                    </a>
                                ))}
                            </div>
                        )}

                        <p className="text-xs text-gray-400 mt-3">
                            Submitted on {receiptSubmittedAt ? formatDate(receiptSubmittedAt) : '—'}. Donors have been notified.
                        </p>
                    </div>
                )}

                {/* Success Banner */}
                {submitSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-3">
                        <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-green-700">Receipt submitted successfully!</p>
                            <p className="text-xs text-green-600">Donors have been notified with your receipt and message. Thank you for your transparency!</p>
                        </div>
                    </div>
                )}

                {/* Receipt Submission Form — only show when DISBURSED */}
                {isDisbursed && (
                    <div className="bg-white rounded-xl border p-6 shadow-sm">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Upload size={15} /> {hasSubmittedReceipt ? 'Submit Additional Receipts' : 'Submit Receipt / Proof / Liquidation'}
                        </h2>
                        <p className="text-xs text-gray-400 mb-5">
                            Upload your receipts or proof of how the funds were used, and optionally add a thank-you message to your donors.
                            This will be shared with the donors for transparency.
                        </p>

                        <div className="space-y-5">
                            {/* Thank You Message */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                                    <MessageSquare size={14} />
                                    Message to Donors (optional)
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Write a thank-you message or comment to your donors... e.g. 'Thank you so much for your generosity! The funds were used for...'"
                                    value={thankYouMessage}
                                    onChange={(e) => setThankYouMessage(e.target.value)}
                                    className="w-full px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                                />
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                                    <Receipt size={14} />
                                    Receipt / Proof Files
                                </label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition-colors"
                                >
                                    <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-600">Click to upload files</p>
                                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, or PDF — Max 10MB each</p>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept=".png,.jpg,.jpeg,.pdf"
                                    multiple
                                    className="hidden"
                                />
                            </div>

                            {/* Selected Files List */}
                            {selectedFiles.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs text-gray-500 font-medium">{selectedFiles.length} file(s) selected</p>
                                    {selectedFiles.map((file, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText size={14} className="text-gray-500 shrink-0" />
                                                <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                                <span className="text-xs text-gray-400 shrink-0">
                                                    ({(file.size / 1024).toFixed(1)} KB)
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => removeFile(i)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Info Note */}
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-700">
                                    Once submitted, donors who contributed to your request will receive an email notification
                                    with your receipt and message for full transparency.
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmitReceipt}
                                disabled={submitting || (selectedFiles.length === 0 && !thankYouMessage.trim())}
                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Submit Receipt & Notify Donors
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
