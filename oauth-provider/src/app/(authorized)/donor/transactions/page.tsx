'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
    ArrowLeft,
    Search,
    Filter,
    Heart,
    Calendar,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronLeft,
    ChevronRight,
    Receipt,
    AlertTriangle,
    Eye,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Donation {
    id: number;
    amount: number;
    donation_type: string;
    status: string;
    reference_code: string;
    payment_method: string | null;
    is_anonymous: boolean;
    message: string | null;
    email: string;
    currency: string;
    payment_fee: number | null;
    net_amount: number | null;
    blockchain_txt_hash: string | null;
    blockchain_network: string | null;
    blockchain_status: string | null;
    created_at: string;
    paid_at: string | null;
    pool: { id: string; name: string } | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    completed:  { label: 'Completed',  className: 'bg-green-50 text-green-600 border border-green-100' },
    pending:    { label: 'Pending',    className: 'bg-amber-50 text-amber-600 border border-amber-100' },
    processing: { label: 'Processing', className: 'bg-blue-50 text-blue-600 border border-blue-100' },
    failed:     { label: 'Failed',     className: 'bg-red-50 text-red-600 border border-red-100' },
    refunded:   { label: 'Refunded',   className: 'bg-gray-50 text-gray-500 border border-gray-100' },
};

type SortField = 'date' | 'amount' | 'status';
type SortDir = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

export default function TransactionHistoryPage() {
    const { status: authStatus } = useSession();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Sorting
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Detail modal
    const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);

    useEffect(() => {
        if (authStatus !== 'authenticated') {
            if (authStatus !== 'loading') setLoading(false);
            return;
        }
        fetchDonations();
    }, [authStatus]);

    const fetchDonations = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/donor/donations');
            const data = await res.json();
            if (data.success) {
                setDonations(data.data.donations);
            } else {
                setError(data.error || 'Failed to load transactions');
            }
        } catch {
            setError('An error occurred while loading your transactions');
        } finally {
            setLoading(false);
        }
    };

    // Filtered + sorted + paginated list
    const filtered = useMemo(() => {
        let result = [...donations];

        // Search by reference code or pool name
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(d =>
                d.reference_code.toLowerCase().includes(q) ||
                (d.pool?.name ?? '').toLowerCase().includes(q) ||
                (d.message ?? '').toLowerCase().includes(q)
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(d => d.status === statusFilter);
        }

        // Type filter
        if (typeFilter !== 'all') {
            result = result.filter(d => d.donation_type === typeFilter);
        }

        // Date range
        if (dateFrom) {
            const from = new Date(dateFrom);
            result = result.filter(d => new Date(d.created_at) >= from);
        }
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            result = result.filter(d => new Date(d.created_at) <= to);
        }

        // Sorting
        result.sort((a, b) => {
            let cmp = 0;
            if (sortField === 'date') {
                cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            } else if (sortField === 'amount') {
                cmp = a.amount - b.amount;
            } else if (sortField === 'status') {
                cmp = a.status.localeCompare(b.status);
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });

        return result;
    }, [donations, searchQuery, statusFilter, typeFilter, dateFrom, dateTo, sortField, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, typeFilter, dateFrom, dateTo]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-300" />;
        return sortDir === 'asc'
            ? <ArrowUp className="w-3.5 h-3.5 text-red-500" />
            : <ArrowDown className="w-3.5 h-3.5 text-red-500" />;
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const formatDateTime = (dateStr: string) =>
        new Date(dateStr).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setTypeFilter('all');
        setDateFrom('');
        setDateTo('');
    };

    const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all' || dateFrom || dateTo;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Loading transactions...</p>
                </div>
            </div>
        );
    }

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
                                <Receipt className="w-6 h-6 text-red-500" />
                                Transaction History
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} found
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2">
                        <AlertTriangle size={15} /> {error}
                    </div>
                )}

                {/* Search & Filter Bar */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by reference code, pool name, or message..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-colors"
                            />
                        </div>

                        {/* Filter toggle */}
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
                            {hasActiveFilters && (
                                <span className="w-2 h-2 bg-red-500 rounded-full" />
                            )}
                        </button>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="completed">Completed</option>
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="failed">Failed</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Type</label>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
                                >
                                    <option value="all">All Types</option>
                                    <option value="unrestricted">Unrestricted</option>
                                    <option value="restricted">Restricted</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">From Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">To Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
                                    />
                                </div>
                            </div>

                            {hasActiveFilters && (
                                <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                                    <button
                                        onClick={clearFilters}
                                        className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                                    >
                                        <X className="w-3 h-3" />
                                        Clear all filters
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Transaction Table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50/50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                            onClick={() => toggleSort('date')}
                            className="col-span-2 flex items-center gap-1 hover:text-gray-700 transition-colors"
                        >
                            Date <SortIcon field="date" />
                        </button>
                        <div className="col-span-2">Reference</div>
                        <div className="col-span-2">Destination</div>
                        <div className="col-span-1">Type</div>
                        <button
                            onClick={() => toggleSort('status')}
                            className="col-span-2 flex items-center gap-1 hover:text-gray-700 transition-colors"
                        >
                            Status <SortIcon field="status" />
                        </button>
                        <button
                            onClick={() => toggleSort('amount')}
                            className="col-span-2 flex items-center gap-1 justify-end hover:text-gray-700 transition-colors"
                        >
                            Amount <SortIcon field="amount" />
                        </button>
                        <div className="col-span-1"></div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-gray-50">
                        {paginated.length === 0 ? (
                            <div className="py-20 text-center">
                                <Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm font-medium">No transactions found</p>
                                <p className="text-gray-300 text-xs mt-1">
                                    {hasActiveFilters || searchQuery
                                        ? 'Try adjusting your filters'
                                        : 'Your donations will appear here'}
                                </p>
                            </div>
                        ) : (
                            paginated.map((donation) => {
                                const badge = statusConfig[donation.status] ?? statusConfig.pending;
                                return (
                                    <div
                                        key={donation.id}
                                        className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors items-center"
                                    >
                                        {/* Date */}
                                        <div className="md:col-span-2">
                                            <p className="text-sm text-gray-900 font-medium">
                                                {formatDate(donation.paid_at || donation.created_at)}
                                            </p>
                                            <p className="text-[11px] text-gray-400 md:hidden">
                                                {donation.reference_code}
                                            </p>
                                        </div>

                                        {/* Reference */}
                                        <div className="hidden md:block md:col-span-2">
                                            <p className="text-xs font-mono text-gray-500 truncate">{donation.reference_code}</p>
                                        </div>

                                        {/* Destination */}
                                        <div className="md:col-span-2">
                                            <p className="text-sm text-gray-700 truncate">
                                                {donation.pool
                                                    ? donation.pool.name
                                                    : donation.donation_type === 'unrestricted'
                                                    ? 'General Fund'
                                                    : 'Donation'}
                                            </p>
                                        </div>

                                        {/* Type */}
                                        <div className="md:col-span-1">
                                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                                donation.donation_type === 'restricted'
                                                    ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                                    : 'bg-blue-50 text-blue-600 border border-blue-100'
                                            }`}>
                                                {donation.donation_type}
                                            </span>
                                        </div>

                                        {/* Status */}
                                        <div className="md:col-span-2">
                                            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
                                                {badge.label}
                                            </span>
                                        </div>

                                        {/* Amount */}
                                        <div className="md:col-span-2 text-right">
                                            <p className="text-sm font-bold text-gray-900">
                                                ₱{donation.amount.toLocaleString()}
                                            </p>
                                        </div>

                                        {/* View */}
                                        <div className="md:col-span-1 flex justify-end">
                                            <button
                                                onClick={() => setSelectedDonation(donation)}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                                                title="View details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination & Summary */}
                    {filtered.length > 0 && (
                        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div className="text-xs text-gray-400">
                                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} transactions
                                <span className="mx-2">•</span>
                                <span className="font-semibold text-gray-600">
                                    Total: ₱{filtered.reduce((s, d) => s + d.amount, 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page => {
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
                                    ))
                                }
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedDonation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setSelectedDonation(null)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                            <h3 className="text-lg font-bold text-gray-900">Transaction Details</h3>
                            <button
                                onClick={() => setSelectedDonation(null)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Amount */}
                            <div className="text-center py-4 bg-gray-50 rounded-xl">
                                <p className="text-3xl font-bold text-gray-900">
                                    ₱{selectedDonation.amount.toLocaleString()}
                                </p>
                                <span className={`inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full ${
                                    (statusConfig[selectedDonation.status] ?? statusConfig.pending).className
                                }`}>
                                    {(statusConfig[selectedDonation.status] ?? statusConfig.pending).label}
                                </span>
                            </div>

                            {/* Details grid */}
                            <div className="space-y-3">
                                <DetailRow label="Reference Code" value={selectedDonation.reference_code} mono />
                                <DetailRow
                                    label="Date"
                                    value={formatDateTime(selectedDonation.paid_at || selectedDonation.created_at)}
                                />
                                <DetailRow
                                    label="Destination"
                                    value={
                                        selectedDonation.pool
                                            ? selectedDonation.pool.name
                                            : selectedDonation.donation_type === 'unrestricted'
                                            ? 'General Fund'
                                            : 'Donation'
                                    }
                                />
                                <DetailRow
                                    label="Type"
                                    value={selectedDonation.donation_type}
                                    badge={
                                        selectedDonation.donation_type === 'restricted'
                                            ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                                    }
                                />
                                {selectedDonation.payment_method && (
                                    <DetailRow
                                        label="Payment Method"
                                        value={selectedDonation.payment_method.replace('_', ' ')}
                                    />
                                )}
                                {selectedDonation.payment_fee != null && (
                                    <DetailRow
                                        label="Payment Fee"
                                        value={`₱${selectedDonation.payment_fee.toLocaleString()}`}
                                    />
                                )}
                                {selectedDonation.net_amount != null && (
                                    <DetailRow
                                        label="Net Amount"
                                        value={`₱${selectedDonation.net_amount.toLocaleString()}`}
                                    />
                                )}
                                <DetailRow
                                    label="Anonymous"
                                    value={selectedDonation.is_anonymous ? 'Yes' : 'No'}
                                />
                                {selectedDonation.message && (
                                    <DetailRow label="Message" value={selectedDonation.message} />
                                )}

                                {/* Blockchain info */}
                                {selectedDonation.blockchain_txt_hash && (
                                    <>
                                        <div className="pt-2 border-t border-gray-100">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Blockchain Record</p>
                                        </div>
                                        <DetailRow
                                            label="Transaction Hash"
                                            value={selectedDonation.blockchain_txt_hash}
                                            mono
                                            truncate
                                        />
                                        {selectedDonation.blockchain_network && (
                                            <DetailRow label="Network" value={selectedDonation.blockchain_network} />
                                        )}
                                        {selectedDonation.blockchain_status && (
                                            <DetailRow label="Status" value={selectedDonation.blockchain_status} />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailRow({
    label,
    value,
    mono,
    badge,
    truncate,
}: {
    label: string;
    value: string | number;
    mono?: boolean;
    badge?: string;
    truncate?: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="text-xs text-gray-400 shrink-0">{label}</span>
            {badge ? (
                <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${badge} capitalize`}>
                    {value}
                </span>
            ) : (
                <span
                    className={`text-sm text-gray-900 text-right ${mono ? 'font-mono text-xs' : ''} ${
                        truncate ? 'truncate max-w-50' : ''
                    }`}
                    title={truncate ? String(value) : undefined}
                >
                    {value}
                </span>
            )}
        </div>
    );
}
