'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
    ArrowLeft,
    Search,
    Filter,
    Sparkles,
    Heart,
    Clock,
    CheckCircle2,
    Target,
    MessageSquare,
    FileText,
    ExternalLink,
    AlertTriangle,
    X,
    ChevronLeft,
    ChevronRight,
    Calendar,
    User,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    AlertCircle,
    BadgeCheck,
    Banknote,
    ClipboardList,
    ShieldCheck,
    Link2,
} from 'lucide-react';
import Link from 'next/link';

interface ImpactFile {
    id: number;
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: string;
}

interface BlockchainProof {
    allocationId: number;
    txHash: string;
    network: string;
    status: string;
    savedAt: string;
    donationReferenceCode: string;
}

interface ImpactItem {
    requestId: number;
    purpose: string;
    status: string;
    requestAmount: number;
    amountFromDonor: number;
    beneficiaryName: string;
    beneficiaryType: string | null;
    dateNeeded: string;
    additionalNotes: string | null;
    urgencyLevel: string;
    reviewedAt: string | null;
    rejectionReason: string | null;
    disbursedAt: string | null;
    disbursedAmount: number | null;
    receiptMessage: string | null;
    receiptSubmittedAt: string | null;
    receiptStatus: string;
    createdAt: string;
    updatedAt: string;
    documents: ImpactFile[];
    receipts: ImpactFile[];
    blockchainProofs: BlockchainProof[];
}

const requestStatusConfig: Record<string, { label: string; className: string }> = {
    APPROVED:     { label: 'Approved',     className: 'bg-blue-50 text-blue-600 border border-blue-100' },
    DISBURSED:    { label: 'Disbursed',    className: 'bg-green-50 text-green-600 border border-green-100' },
    PENDING:      { label: 'Pending',      className: 'bg-amber-50 text-amber-600 border border-amber-100' },
    UNDER_REVIEW: { label: 'Under Review', className: 'bg-purple-50 text-purple-600 border border-purple-100' },
    REJECTED:     { label: 'Rejected',     className: 'bg-red-50 text-red-600 border border-red-100' },
};

const urgencyConfig: Record<string, { label: string; className: string }> = {
    LOW:    { label: 'Low',    className: 'bg-gray-50 text-gray-500 border border-gray-200' },
    MEDIUM: { label: 'Medium', className: 'bg-amber-50 text-amber-600 border border-amber-100' },
    HIGH:   { label: 'High',   className: 'bg-red-50 text-red-600 border border-red-100' },
};

type SortField = 'date' | 'amount' | 'status';
type SortDir = 'asc' | 'desc';
const ITEMS_PER_PAGE = 8;

const EXPLORER_URLS: Record<string, string> = {
    sepolia: 'https://sepolia.etherscan.io',
    amoy: 'https://amoy.polygonscan.com',
    polygon: 'https://polygonscan.com',
};

function getExplorerTxUrl(txHash: string, network: string): string {
    const base = EXPLORER_URLS[network] || EXPLORER_URLS.sepolia;
    return `${base}/tx/${txHash}`;
}

export default function DonorImpactsPage() {
    const { status: authStatus } = useSession();
    const [impactItems, setImpactItems] = useState<ImpactItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    // Sort
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Detail view
    const [selectedItem, setSelectedItem] = useState<ImpactItem | null>(null);

    useEffect(() => {
        if (authStatus !== 'authenticated') {
            if (authStatus !== 'loading') setLoading(false);
            return;
        }
        fetchImpacts();
    }, [authStatus]);

    const fetchImpacts = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/donor/impacts');
            const data = await res.json();
            if (data.success) {
                setImpactItems(data.data.impactItems);
            } else {
                setError(data.error || 'Failed to load impacts');
            }
        } catch {
            setError('An error occurred while loading your impacts');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        let result = [...impactItems];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (item) =>
                    item.purpose.toLowerCase().includes(q) ||
                    item.beneficiaryName.toLowerCase().includes(q) ||
                    (item.additionalNotes ?? '').toLowerCase().includes(q)
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter((item) => item.status === statusFilter);
        }

        result.sort((a, b) => {
            let cmp = 0;
            if (sortField === 'date') {
                cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else if (sortField === 'amount') {
                cmp = a.amountFromDonor - b.amountFromDonor;
            } else if (sortField === 'status') {
                cmp = a.status.localeCompare(b.status);
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });

        return result;
    }, [impactItems, searchQuery, statusFilter, sortField, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortField(field); setSortDir('desc'); }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-300" />;
        return sortDir === 'asc'
            ? <ArrowUp className="w-3.5 h-3.5 text-red-500" />
            : <ArrowDown className="w-3.5 h-3.5 text-red-500" />;
    };

    const formatDate = (s: string) =>
        new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const formatDateTime = (s: string) =>
        new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const hasActiveFilters = statusFilter !== 'all';

    // Summary stats
    const totalContributed = impactItems.reduce((s, i) => s + i.amountFromDonor, 0);
    const totalDisbursed = impactItems.filter((i) => i.status === 'DISBURSED').length;
    const totalBeneficiaries = new Set(impactItems.map((i) => i.beneficiaryName)).size;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Loading your impact...</p>
                </div>
            </div>
        );
    }

    // ── Detail Modal ──
    if (selectedItem) {
        const badge = requestStatusConfig[selectedItem.status] ?? requestStatusConfig.PENDING;
        const urgency = urgencyConfig[selectedItem.urgencyLevel] ?? urgencyConfig.LOW;

        return (
            <div className="min-h-screen bg-gray-50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Back */}
                    <button
                        onClick={() => setSelectedItem(null)}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to all impacts
                    </button>

                    {/* Header card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-6 border-b border-gray-100 bg-linear-to-r from-amber-50/60 to-white">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <h1 className="text-xl font-bold text-gray-900">{selectedItem.purpose}</h1>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
                                            {badge.label}
                                        </span>
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${urgency.className}`}>
                                            {urgency.label} urgency
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-2xl font-bold text-gray-900">₱{selectedItem.requestAmount.toLocaleString()}</p>
                                    <p className="text-xs text-gray-400 mt-1">Total request</p>
                                </div>
                            </div>
                        </div>

                        {/* Info rows */}
                        <div className="divide-y divide-gray-50">
                            <InfoRow icon={User} label="Beneficiary" value={selectedItem.beneficiaryName} />
                            {selectedItem.beneficiaryType && (
                                <InfoRow icon={BadgeCheck} label="Type" value={selectedItem.beneficiaryType} capitalize />
                            )}
                            <InfoRow icon={Target} label="Your Contribution" value={`₱${selectedItem.amountFromDonor.toLocaleString()}`} highlight />
                            <InfoRow icon={Calendar} label="Date Needed" value={formatDate(selectedItem.dateNeeded)} />
                            <InfoRow icon={Clock} label="Requested" value={formatDateTime(selectedItem.createdAt)} />
                            {selectedItem.reviewedAt && (
                                <InfoRow icon={ClipboardList} label="Reviewed" value={formatDateTime(selectedItem.reviewedAt)} />
                            )}
                            {selectedItem.disbursedAt && (
                                <InfoRow icon={Banknote} label="Disbursed" value={formatDateTime(selectedItem.disbursedAt)} />
                            )}
                            {selectedItem.disbursedAmount != null && (
                                <InfoRow icon={Banknote} label="Disbursed Amount" value={`₱${selectedItem.disbursedAmount.toLocaleString()}`} />
                            )}
                        </div>
                    </div>

                    {/* Additional notes */}
                    {selectedItem.additionalNotes && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <h3 className="text-sm font-semibold text-gray-700">Additional Notes</h3>
                            </div>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{selectedItem.additionalNotes}</p>
                        </div>
                    )}

                    {/* Rejection reason */}
                    {selectedItem.status === 'REJECTED' && selectedItem.rejectionReason && (
                        <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <h3 className="text-sm font-semibold text-red-700">Rejection Reason</h3>
                            </div>
                            <p className="text-sm text-red-600">{selectedItem.rejectionReason}</p>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            Timeline
                        </h3>
                        <div className="relative pl-6 space-y-4">
                            <div className="absolute left-2 top-1 bottom-1 w-px bg-gray-200" />
                            <TimelineItem
                                label="Request Created"
                                date={formatDateTime(selectedItem.createdAt)}
                                active
                            />
                            {selectedItem.reviewedAt && (
                                <TimelineItem
                                    label={selectedItem.status === 'REJECTED' ? 'Request Rejected' : 'Request Reviewed / Approved'}
                                    date={formatDateTime(selectedItem.reviewedAt)}
                                    active
                                    color={selectedItem.status === 'REJECTED' ? 'red' : 'blue'}
                                />
                            )}
                            {selectedItem.disbursedAt && (
                                <TimelineItem
                                    label="Funds Disbursed"
                                    date={formatDateTime(selectedItem.disbursedAt)}
                                    active
                                    color="green"
                                />
                            )}
                            {selectedItem.receiptSubmittedAt && (
                                <TimelineItem
                                    label="Receipt Submitted"
                                    date={formatDateTime(selectedItem.receiptSubmittedAt)}
                                    active
                                    color="emerald"
                                />
                            )}
                            {selectedItem.blockchainProofs.length > 0 && (
                                <TimelineItem
                                    label="Recorded on Blockchain"
                                    date={selectedItem.blockchainProofs[0].savedAt ? formatDateTime(selectedItem.blockchainProofs[0].savedAt) : ''}
                                    active
                                    color="emerald"
                                />
                            )}
                            {selectedItem.status === 'DISBURSED' && !selectedItem.receiptSubmittedAt && (
                                <TimelineItem
                                    label="Awaiting receipt from beneficiary"
                                    date=""
                                    pending
                                />
                            )}
                        </div>
                    </div>

                    {/* Thank-you message */}
                    {selectedItem.receiptMessage && (
                        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <MessageSquare className="w-4 h-4 text-emerald-600" />
                                <h3 className="text-sm font-semibold text-emerald-700">Message from {selectedItem.beneficiaryName}</h3>
                            </div>
                            <p className="text-sm text-emerald-800 italic leading-relaxed">&ldquo;{selectedItem.receiptMessage}&rdquo;</p>
                            {selectedItem.receiptSubmittedAt && (
                                <p className="text-[11px] text-emerald-500 mt-3">{formatDate(selectedItem.receiptSubmittedAt)}</p>
                            )}
                        </div>
                    )}

                    {/* Supporting Documents */}
                    {selectedItem.documents.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <h3 className="text-sm font-semibold text-gray-700">Supporting Documents</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {selectedItem.documents.map((doc) => (
                                    <FileCard key={doc.id} file={doc} color="gray" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Receipts / Proof */}
                    {selectedItem.receipts.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="w-4 h-4 text-indigo-500" />
                                <h3 className="text-sm font-semibold text-gray-700">Disbursement Receipts / Proof</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {selectedItem.receipts.map((r) => (
                                    <FileCard key={r.id} file={r} color="indigo" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Blockchain Verification */}
                    {selectedItem.blockchainProofs.length > 0 && (
                        <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                <h3 className="text-sm font-semibold text-emerald-800">Blockchain Verification</h3>
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                    On-chain
                                </span>
                            </div>
                            <p className="text-xs text-emerald-700/70 mb-4">
                                This disbursement has been permanently recorded on the blockchain for full transparency and auditability.
                            </p>
                            <div className="space-y-3">
                                {selectedItem.blockchainProofs.map((proof) => {
                                    const explorerUrl = getExplorerTxUrl(proof.txHash, proof.network);
                                    return (
                                        <div key={proof.allocationId} className="bg-white rounded-xl border border-emerald-100 p-4 space-y-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1.5 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                            {proof.status === 'confirmed' ? '✓ Confirmed' : proof.status}
                                                        </span>
                                                        <span className="text-[11px] text-gray-400 capitalize">{proof.network}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Link2 className="w-3 h-3 text-gray-400 shrink-0" />
                                                        <span className="text-xs font-mono text-gray-600 truncate" title={proof.txHash}>
                                                            {proof.txHash.slice(0, 10)}...{proof.txHash.slice(-8)}
                                                        </span>
                                                    </div>
                                                    {proof.savedAt && (
                                                        <p className="text-[11px] text-gray-400">
                                                            Recorded {formatDateTime(proof.savedAt)}
                                                        </p>
                                                    )}
                                                </div>
                                                {explorerUrl && (
                                                    <a
                                                        href={explorerUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors shrink-0"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                        View on Explorer
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* No receipt yet */}
                    {selectedItem.status === 'DISBURSED' && selectedItem.receipts.length === 0 && !selectedItem.receiptMessage && (
                        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                <p className="text-sm text-amber-600">Waiting for the beneficiary to submit their receipt and thank-you message.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── List View ──
    return (
        <div className="min-h-screen bg-gray-50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/donor">
                            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-amber-500" />
                                Your Impact
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5">See how your donations are helping beneficiaries</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2">
                        <AlertTriangle size={15} /> {error}
                    </div>
                )}

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SummaryCard label="Total Contributed" value={`₱${totalContributed.toLocaleString()}`} sub={`Across ${impactItems.length} request${impactItems.length !== 1 ? 's' : ''}`} icon={Heart} iconBg="bg-red-50" iconColor="text-red-500" />
                    <SummaryCard label="Funds Disbursed" value={totalDisbursed.toString()} sub="Completed disbursements" icon={CheckCircle2} iconBg="bg-green-50" iconColor="text-green-500" />
                    <SummaryCard label="Beneficiaries Helped" value={totalBeneficiaries.toString()} sub="Unique beneficiaries" icon={User} iconBg="bg-blue-50" iconColor="text-blue-500" />
                </div>

                {/* Search & Filters */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by purpose, beneficiary name, or notes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-colors"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                                showFilters || hasActiveFilters
                                    ? 'bg-red-50 border-red-200 text-red-600'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            {hasActiveFilters && <span className="w-2 h-2 bg-red-500 rounded-full" />}
                        </button>
                    </div>

                    {showFilters && (
                        <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="UNDER_REVIEW">Under Review</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="DISBURSED">Disbursed</option>
                                    <option value="REJECTED">Rejected</option>
                                </select>
                            </div>
                            {hasActiveFilters && (
                                <div className="flex items-end">
                                    <button
                                        onClick={() => setStatusFilter('all')}
                                        className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 pb-2"
                                    >
                                        <X className="w-3 h-3" />
                                        Clear
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Impact Cards */}
                <div className="space-y-3">
                    {paginated.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-20 text-center">
                            <Sparkles className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm font-medium">No impact records found</p>
                            <p className="text-gray-300 text-xs mt-1">
                                {hasActiveFilters || searchQuery
                                    ? 'Try adjusting your filters'
                                    : 'Your impact will show here once your donations are allocated'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Sort bar */}
                            <div className="flex items-center gap-4 text-xs text-gray-400 px-1">
                                <span>Sort by:</span>
                                <button onClick={() => toggleSort('date')} className="flex items-center gap-1 hover:text-gray-600">
                                    Date <SortIcon field="date" />
                                </button>
                                <button onClick={() => toggleSort('amount')} className="flex items-center gap-1 hover:text-gray-600">
                                    Contribution <SortIcon field="amount" />
                                </button>
                                <button onClick={() => toggleSort('status')} className="flex items-center gap-1 hover:text-gray-600">
                                    Status <SortIcon field="status" />
                                </button>
                            </div>

                            {paginated.map((item) => {
                                const badge = requestStatusConfig[item.status] ?? requestStatusConfig.PENDING;
                                const urgency = urgencyConfig[item.urgencyLevel] ?? urgencyConfig.LOW;

                                return (
                                    <div
                                        key={item.requestId}
                                        className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                                        onClick={() => setSelectedItem(item)}
                                    >
                                        <div className="px-6 py-5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-2 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-sm font-semibold text-gray-900">{item.purpose}</h3>
                                                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
                                                            {badge.label}
                                                        </span>
                                                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${urgency.className}`}>
                                                            {urgency.label}
                                                        </span>
                                                        {item.receiptMessage && (
                                                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                                Thank you received
                                                            </span>
                                                        )}
                                                        {item.receipts.length > 0 && (
                                                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                                {item.receipts.length} receipt{item.receipts.length !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                        {item.blockchainProofs.length > 0 && (
                                                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                                                <ShieldCheck className="w-3 h-3" />
                                                                On-chain
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400">
                                                        <User className="w-3 h-3 inline mr-1" />
                                                        {item.beneficiaryName}
                                                        <span className="mx-1.5">•</span>
                                                        Your contribution: <span className="font-semibold text-gray-600">₱{item.amountFromDonor.toLocaleString()}</span>
                                                        <span className="mx-1.5">•</span>
                                                        {formatDate(item.createdAt)}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-base font-bold text-gray-900">₱{item.requestAmount.toLocaleString()}</p>
                                                    <p className="text-[11px] text-gray-400">Total request</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick preview bar */}
                                        <div className="px-6 py-2.5 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-[11px] text-gray-400">
                                                {item.disbursedAt && (
                                                    <span className="flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                        Disbursed {formatDate(item.disbursedAt)}
                                                    </span>
                                                )}
                                                {item.documents.length > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <FileText className="w-3 h-3" />
                                                        {item.documents.length} doc{item.documents.length !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                                {item.blockchainProofs.length > 0 && (
                                                    <span className="flex items-center gap-1 text-emerald-600">
                                                        <ShieldCheck className="w-3 h-3" />
                                                        Verified on-chain
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[11px] text-red-500 font-medium">View details →</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                {/* Pagination */}
                {filtered.length > ITEMS_PER_PAGE && (
                    <div className="flex justify-center items-center gap-1 pt-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                                if (totalPages <= 5) return true;
                                if (page === 1 || page === totalPages) return true;
                                return Math.abs(page - currentPage) <= 1;
                            })
                            .map((page, idx, arr) => (
                                <React.Fragment key={page}>
                                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                                        <span className="px-1 text-gray-300 text-xs">...</span>
                                    )}
                                    <button
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                                            currentPage === page
                                                ? 'bg-red-600 text-white'
                                                : 'text-gray-500 hover:bg-gray-200'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                </React.Fragment>
                            ))}
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Helper Components ──

function SummaryCard({
    label, value, sub, icon: Icon, iconBg, iconColor,
}: {
    label: string; value: string; sub: string;
    icon: React.ElementType; iconBg: string; iconColor: string;
}) {
    return (
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-start justify-between">
            <div className="space-y-1">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400">{sub}</p>
            </div>
            <div className={`${iconBg} p-2.5 rounded-xl`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
        </div>
    );
}

function InfoRow({
    icon: Icon, label, value, highlight, capitalize: cap,
}: {
    icon: React.ElementType; label: string; value: string;
    highlight?: boolean; capitalize?: boolean;
}) {
    return (
        <div className="flex items-center justify-between px-6 py-3.5">
            <div className="flex items-center gap-2 text-xs text-gray-400">
                <Icon className="w-3.5 h-3.5" />
                {label}
            </div>
            <span className={`text-sm ${highlight ? 'font-bold text-red-600' : 'text-gray-900'} ${cap ? 'capitalize' : ''}`}>
                {value}
            </span>
        </div>
    );
}

function TimelineItem({
    label, date, pending, color = 'gray',
}: {
    label: string; date: string; active?: boolean; pending?: boolean; color?: string;
}) {
    const dotColor = pending
        ? 'bg-gray-300'
        : color === 'green'
        ? 'bg-green-500'
        : color === 'blue'
        ? 'bg-blue-500'
        : color === 'red'
        ? 'bg-red-500'
        : color === 'emerald'
        ? 'bg-emerald-500'
        : 'bg-gray-400';

    return (
        <div className="relative flex items-start gap-3">
            <div className={`absolute -left-4.5 top-1.5 w-2.5 h-2.5 rounded-full ${dotColor} ring-2 ring-white`} />
            <div>
                <p className={`text-sm ${pending ? 'text-gray-400 italic' : 'text-gray-700'}`}>{label}</p>
                {date && <p className="text-[11px] text-gray-400 mt-0.5">{date}</p>}
            </div>
        </div>
    );
}

function FileCard({ file, color }: { file: ImpactFile; color: string }) {
    const bg = color === 'indigo' ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-100' : 'bg-gray-50 hover:bg-gray-100 border-gray-200';
    const textColor = color === 'indigo' ? 'text-indigo-700' : 'text-gray-700';
    const subColor = color === 'indigo' ? 'text-indigo-400' : 'text-gray-400';
    const iconColor = color === 'indigo' ? 'text-indigo-500' : 'text-gray-500';

    return (
        <a
            href={file.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 rounded-lg p-3 border transition-colors group ${bg}`}
        >
            <FileText className={`w-4 h-4 ${iconColor} shrink-0`} />
            <div className="min-w-0 flex-1">
                <p className={`text-xs font-medium ${textColor} truncate`}>{file.fileName}</p>
                <p className={`text-[11px] ${subColor}`}>
                    {new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
            </div>
            <ExternalLink className={`w-3.5 h-3.5 ${subColor} group-hover:${textColor} shrink-0`} />
        </a>
    );
}
