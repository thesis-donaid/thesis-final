'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
    Clock,
    CheckCircle2,
    FileText,
    Search,
    Eye,
    Bell,
    Filter,
    X,
    ClipboardCheck,
    AlertCircle,
    CheckCircle,
    FileSearch,
    Layers,
    Users,
    TrendingUp,
    ChevronDown,
    LayoutGrid,
    List,
    RefreshCw,
} from 'lucide-react';
import { pusherClient } from '@/lib/pusher-client';
import RequestList from '@/components/features/requests/RequestList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// === Types ===
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
    beneficiary?: {
        firstName?: string;
        lastName?: string;
        username?: string;
    };
}

type RequestStatusTab = 'ALL' | 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'DISBURSED';
type ReceiptStatusFilter = 'ALL' | 'MISSING' | 'COMPLETED' | 'PENDING';

const statusColors: Record<string, { bg: string; text: string; border: string; icon: any }> = {
    ALL: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', icon: Layers },
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock },
    UNDER_REVIEW: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Search },
    APPROVED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle2 },
    DISBURSED: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: TrendingUp },
};

const receiptColors: Record<string, { bg: string; text: string; border: string; icon: any }> = {
    ALL: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', icon: FileSearch },
    MISSING: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertCircle },
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock },
    COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle },
};

export default function AdminRequestsPage() {
    const { data: session, status: authStatus } = useSession();

    const [requests, setRequests] = useState<BeneficiaryRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusTab, setStatusTab] = useState<RequestStatusTab>('ALL');
    const [receiptFilter, setReceiptFilter] = useState<ReceiptStatusFilter>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [mobileStatusOpen, setMobileStatusOpen] = useState(false);
    const [mobileReceiptOpen, setMobileReceiptOpen] = useState(false);

    const fetchRequests = useCallback(async (silent = false) => {
        try {
            if (!silent) {
                setIsRefreshing(true);
                setLoading(true);
            }

            const params = new URLSearchParams();
            if (statusTab !== 'ALL') params.append('status', statusTab);
            if (receiptFilter !== 'ALL') params.append('receipt_status', receiptFilter);
            params.append('limit', '100');

            const res = await fetch(`/api/admin/requests?${params.toString()}`);
            const result = await res.json();

            if (res.ok) {
                setRequests(result.data?.requests || []);
            } else {
                throw new Error(result.error || 'Failed to fetch requests');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load requests.');
            setTimeout(() => setError(''), 5000);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [statusTab, receiptFilter]);

    useEffect(() => {
        if (authStatus !== 'authenticated' || session?.user?.role !== 'admin') {
            if (authStatus !== 'loading') setLoading(false);
            return;
        }

        fetchRequests();

        const channel = pusherClient.subscribe('admin-events');

        channel.bind('new-request', (data: { beneficiaryName: string; purpose: string }) => {
            setNotification(`📢 New request from ${data.beneficiaryName}: "${data.purpose}"`);
            setTimeout(() => setNotification(null), 8000);
            fetchRequests(true);
        });

        channel.bind('request-updated', () => {
            setNotification('🔄 Request status updated');
            setTimeout(() => setNotification(null), 5000);
            fetchRequests(true);
        });

        return () => {
            channel.unbind_all();
            pusherClient.unsubscribe('admin-events');
        };
    }, [authStatus, session, fetchRequests]);

    const filteredRequests = requests.filter(req => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        const purpose = req.purpose.toLowerCase();
        const name = `${req.beneficiary?.firstName} ${req.beneficiary?.lastName}`.toLowerCase();
        const username = req.beneficiary?.username?.toLowerCase() || '';
        return purpose.includes(search) || name.includes(search) || username.includes(search);
    });

    const getStatusCount = (status: RequestStatusTab) => {
        if (status === 'ALL') return requests.length;
        return requests.filter(r => r.status === status).length;
    };

    const getReceiptCount = (receipt: ReceiptStatusFilter) => {
        if (receipt === 'ALL') return requests.length;
        return requests.filter(r => r.receipt_status === receipt).length;
    };

    const handleRefresh = () => {
        fetchRequests(false);
    };

    if (loading && requests.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-red-600 animate-pulse" />
                        </div>
                    </div>
                    <p className="text-gray-500 font-medium">Loading requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-20 sm:pt-24 md:pt-28 pb-20">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
                {/* Real-time Notification */}
                {notification && (
                    <div className="absolute top-5 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-800 px-3 sm:px-6 py-3 sm:py-4 rounded-xl flex items-center gap-3 sm:gap-4 animate-in slide-in-from-top-2 shadow-md">
                        <div className="bg-red-500 p-1.5 sm:p-2 rounded-full text-white shadow-sm">
                            <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <p className="font-medium flex-1 text-xs sm:text-sm">{notification}</p>
                        <button 
                            onClick={() => setNotification(null)} 
                            className="text-red-400 hover:text-red-600 transition-colors"
                        >
                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                    </div>
                )}
                <div className="space-y-6 md:space-y-8">


                    {/* Header with Stats */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className='py-3 md:py-1'>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-red-50 rounded-xl">
                                        <FileText className="w-5 h-5 text-red-600" />
                                    </div>
                                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                        Request Management
                                    </h1>
                                </div>
                                <p className="text-gray-500 text-xs sm:text-sm ml-11">
                                    Review and manage all beneficiary support requests
                                </p>
                            </div>

                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search by name, username, or purpose..."
                                className="pl-9 sm:pl-11 pr-9 sm:pr-12 py-2 sm:py-3 border-gray-200 focus:border-red-400 focus:ring-red-400/20 rounded-xl bg-white shadow-sm text-sm sm:text-base"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mt-6 sm:mt-8">
                            {(['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED'] as RequestStatusTab[]).map(status => {
                                const colors = statusColors[status];
                                const Icon = colors.icon;
                                return (
                                    <div
                                        key={status}
                                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md"
                                    >
                                        <div className={`${colors.bg} ${colors.text} p-3 rounded-xl shrink-0 shadow-sm ring-1 ring-black/5`}>
                                            <Icon size={20} className="sm:w-6 sm:h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5 truncate">
                                                {status === 'ALL' ? 'Total' : status.replace('_', ' ')}
                                            </p>
                                            <p className={`text-xl sm:text-2xl font-black ${colors.text} leading-none`}>
                                                {getStatusCount(status)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>



                    {/* Search and Filters */}
                    <div className="space-y-3 sm:space-y-4">


                        {/* Mobile Filters - Dropdowns */}
                        <div className="flex flex-col sm:hidden gap-2">
                            {/* Status Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setMobileStatusOpen(!mobileStatusOpen)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-gray-500" />
                                        <span>Status: {statusTab === 'ALL' ? 'All' : statusTab.replace('_', ' ')}</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileStatusOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {mobileStatusOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                                        {(['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED'] as RequestStatusTab[]).map(tab => {
                                            const Icon = statusColors[tab].icon;
                                            return (
                                                <button
                                                    key={tab}
                                                    onClick={() => {
                                                        setStatusTab(tab);
                                                        setMobileStatusOpen(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                                                        statusTab === tab ? 'bg-red-50 text-red-600' : 'text-gray-700'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Icon className={`w-3.5 h-3.5 ${statusTab === tab ? 'text-red-600' : 'text-gray-400'}`} />
                                                        <span>{tab === 'ALL' ? 'All' : tab.replace('_', ' ')}</span>
                                                    </div>
                                                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-medium text-gray-600">
                                                        {getStatusCount(tab)}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Receipt Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setMobileReceiptOpen(!mobileReceiptOpen)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <ClipboardCheck className="w-4 h-4 text-gray-500" />
                                        <span>Receipt: {receiptFilter === 'ALL' ? 'All' : receiptFilter}</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileReceiptOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {mobileReceiptOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                                        {[
                                            { id: 'ALL', label: 'All Receipts' },
                                            { id: 'MISSING', label: 'Missing' },
                                            { id: 'PENDING', label: 'Pending' },
                                            { id: 'COMPLETED', label: 'Completed' },
                                        ].map(filter => {
                                            const Icon = receiptColors[filter.id as keyof typeof receiptColors].icon;
                                            return (
                                                <button
                                                    key={filter.id}
                                                    onClick={() => {
                                                        setReceiptFilter(filter.id as ReceiptStatusFilter);
                                                        setMobileReceiptOpen(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                                                        receiptFilter === filter.id ? 'bg-red-50 text-red-600' : 'text-gray-700'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Icon className={`w-3.5 h-3.5 ${receiptFilter === filter.id ? 'text-red-600' : 'text-gray-400'}`} />
                                                        <span>{filter.label}</span>
                                                    </div>
                                                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-medium text-gray-600">
                                                        {getReceiptCount(filter.id as ReceiptStatusFilter)}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Desktop Filters */}
                        <div className="hidden sm:block space-y-3 sm:space-y-4">
                            {/* Status Tabs */}
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                                    <Filter size={14} className="text-gray-500" />
                                    <span className="text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED'] as RequestStatusTab[]).map(tab => {
                                        const Icon = statusColors[tab].icon;
                                        return (
                                            <button
                                                key={tab}
                                                onClick={() => setStatusTab(tab)}
                                                className={`group relative px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
                                                    statusTab === tab
                                                        ? `${statusColors[tab].bg} ${statusColors[tab].text} shadow-sm border ${statusColors[tab].border}`
                                                        : 'text-gray-500 hover:bg-gray-100 border border-transparent'
                                                }`}
                                            >
                                                <Icon className={`w-3.5 h-3.5 ${statusTab === tab ? '' : 'text-gray-400 opacity-70'}`} />
                                                <span className="relative z-10">{tab === 'ALL' ? 'All' : tab.replace('_', ' ')}</span>
                                                <span className={`ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                                                    statusTab === tab
                                                        ? 'bg-white/50'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {getStatusCount(tab)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Receipt Filters */}
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                                    <ClipboardCheck size={14} className="text-gray-500" />
                                    <span className="text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Receipt Status</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'ALL', label: 'All' },
                                        { id: 'MISSING', label: 'Missing' },
                                        { id: 'PENDING', label: 'Pending' },
                                        { id: 'COMPLETED', label: 'Completed' },
                                    ].map(filter => {
                                        const colors = receiptColors[filter.id as keyof typeof receiptColors];
                                        const Icon = colors.icon;
                                        return (
                                            <button
                                                key={filter.id}
                                                onClick={() => setReceiptFilter(filter.id as ReceiptStatusFilter)}
                                                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
                                                    receiptFilter === filter.id
                                                        ? `${colors.bg} ${colors.text} ${colors.border}`
                                                        : 'bg-white border-transparent text-gray-500 hover:border-gray-200'
                                                }`}
                                            >
                                                <Icon size={12} className="sm:w-[14px] sm:h-[14px]" />
                                                <span>{filter.label}</span>
                                                <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                                                    receiptFilter === filter.id
                                                        ? 'bg-white/50'
                                                        : 'bg-gray-100'
                                                }`}>
                                                    {getReceiptCount(filter.id as ReceiptStatusFilter)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Summary */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 py-2">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-5 sm:h-6 bg-red-500 rounded-full" />
                            <p className="text-xs sm:text-sm text-gray-600">
                                Showing <span className="font-semibold text-gray-900">{filteredRequests.length}</span> of{' '}
                                <span className="font-semibold text-gray-900">{requests.length}</span> requests
                            </p>
                        </div>
                        {loading && !isRefreshing && (
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] sm:text-xs text-gray-400">Updating...</span>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                                <p className="text-xs sm:text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Main Content */}
                    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all ${
                        viewMode === 'grid' ? 'p-3 sm:p-4' : ''
                    }`}>
                        <RequestList
                            requests={filteredRequests}
                            isAdmin={true}
                            onRefresh={() => fetchRequests(true)}
                      
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}