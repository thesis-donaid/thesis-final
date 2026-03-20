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

export default function AdminRequestsPage() {
    const { data: session, status: authStatus } = useSession();

    const [requests, setRequests] = useState<BeneficiaryRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusTab, setStatusTab] = useState<RequestStatusTab>('PENDING');
    const [receiptFilter, setReceiptFilter] = useState<ReceiptStatusFilter>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState<string | null>(null);

    const fetchRequests = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);

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
        } finally {
            setLoading(false);
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
            setNotification(`New request from ${data.beneficiaryName}: "${data.purpose}"`);
            setTimeout(() => setNotification(null), 8000);
            fetchRequests(true);
        });

        channel.bind('request-updated', () => {
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

    if (loading && requests.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Loading requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Request Management</h1>
                        <p className="text-gray-500 mt-1">Review and manage all beneficiary support requests</p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search name or purpose..."
                            className="pl-10 pr-10 py-2 border-gray-200 focus:border-red-400 focus:ring-red-400/20 rounded-xl bg-white shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Real-time Notification */}
                {notification && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 shadow-sm">
                        <div className="bg-red-600 p-2 rounded-lg text-white">
                            <Bell className="w-4 h-4" />
                        </div>
                        <p className="font-medium flex-1">{notification}</p>
                        <button onClick={() => setNotification(null)} className="text-red-400 hover:text-red-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        <div className="flex items-center gap-1.5 pr-3 border-r border-gray-200 text-gray-400">
                            <Filter size={14} />
                            <span className="text-[10px] font-semibold uppercase tracking-wider">Status</span>
                        </div>
                        {(['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED'] as RequestStatusTab[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setStatusTab(tab)}
                                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                                    statusTab === tab
                                        ? 'bg-red-600 text-white shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                                {tab.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Receipt Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pt-1 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 pr-3 border-r border-gray-200 text-gray-400">
                            <ClipboardCheck size={14} />
                            <span className="text-[10px] font-semibold uppercase tracking-wider">Receipt</span>
                        </div>
                        {[
                            { id: 'ALL', label: 'All Receipts', icon: FileSearch },
                            { id: 'MISSING', label: 'Missing', icon: AlertCircle },
                            { id: 'PENDING', label: 'Pending', icon: Clock },
                            { id: 'COMPLETED', label: 'Completed', icon: CheckCircle },
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setReceiptFilter(f.id as ReceiptStatusFilter)}
                                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${
                                    receiptFilter === f.id
                                        ? 'bg-red-50 border-red-200 text-red-700'
                                        : 'bg-white border-transparent text-gray-500 hover:border-gray-200'
                                }`}
                            >
                                <f.icon size={14} />
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Summary */}
                <div className="flex items-center justify-between text-sm text-gray-500 px-1">
                    <p>
                        Showing <span className="font-semibold text-gray-900">{filteredRequests.length}</span> requests
                        {loading && ' · updating...'}
                    </p>
                    {error && <p className="text-red-500 text-xs">{error}</p>}
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <RequestList
                        requests={filteredRequests}
                        isAdmin={true}
                        onRefresh={() => fetchRequests(true)}
                    />
                </div>
            </div>
        </div>
    );
}