'use client'

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Clock,
  CheckCircle2,
  FileText,
  Plus,
  Eye,
  XCircle,
  AlertTriangle,
  PiggyBank,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface BeneficiaryRequest {
    id: number;
    purpose: string;
    amount: number;
    date_needed: string;
    urgency_level: string;
    status: string;
    created_at: string;
    allocatedAmount?: number;
    documents: { id: number }[];
}

const urgencyConfig: Record<string, { label: string; className: string }> = {
    LOW:    { label: 'low',      className: 'bg-blue-50 text-blue-600 border border-blue-100' },
    MEDIUM: { label: 'medium',   className: 'bg-amber-50 text-amber-600 border border-amber-100' },
    HIGH:   { label: 'critical', className: 'bg-red-50 text-red-600 border border-red-100' },
};

const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING:      { label: 'Pending',      className: 'bg-amber-50 text-amber-600 border border-amber-100' },
    UNDER_REVIEW: { label: 'Under Review', className: 'bg-blue-50 text-blue-600 border border-blue-100' },
    APPROVED:     { label: 'Approved',     className: 'bg-green-50 text-green-600 border border-green-100' },
    REJECTED:     { label: 'Rejected',     className: 'bg-red-50 text-red-600 border border-red-100' },
    DISBURSED:    { label: 'Disbursed',    className: 'bg-gray-50 text-gray-600 border border-gray-100' },
};

type Tab = 'active' | 'approved' | 'all';

function formatReqId(id: number, createdAt: string) {
    const year = new Date(createdAt).getFullYear();
    return `REQ-${year}-${String(id).padStart(3, '0')}`;
}

export default function BeneficiaryDashboard() {
    const { data: session, status: authStatus } = useSession();
    const [requests, setRequests] = useState<BeneficiaryRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('active');

    useEffect(() => {
        if (authStatus !== 'authenticated') {
            if (authStatus !== 'loading') setLoading(false);
            return;
        }
        fetchRequests();
    }, [authStatus]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/beneficiary/requests');
            const data = await res.json();
            if (Array.isArray(data)) {
                setRequests(data);
            } else {
                setError(data.error || 'Failed to load requests');
            }
        } catch {
            setError('An error occurred while loading requests');
        } finally {
            setLoading(false);
        }
    };

    const pendingCount   = requests.filter(r => r.status === 'PENDING').length;
    const reviewCount    = requests.filter(r => r.status === 'UNDER_REVIEW').length;
    const approvedCount  = requests.filter(r => r.status === 'APPROVED').length;
    const disbursedCount = requests.filter(r => r.status === 'DISBURSED').length;
    const totalReceived  = requests
        .filter(r => r.status === 'DISBURSED' || r.status === 'APPROVED')
        .reduce((s, r) => s + r.amount, 0);

    const filteredRequests = requests.filter(r => {
        if (activeTab === 'active')   return r.status === 'PENDING' || r.status === 'UNDER_REVIEW';
        if (activeTab === 'approved') return r.status === 'APPROVED' || r.status === 'DISBURSED';
        return true;
    });

    const activeCount   = pendingCount + reviewCount;
    const completedCount = approvedCount + disbursedCount;

    const tabs: { key: Tab; label: string }[] = [
        { key: 'active',   label: `Active (${activeCount})` },
        { key: 'approved', label: `Approved (${completedCount})` },
        { key: 'all',      label: 'All Requests' },
    ];

    const statCards = [
        {
            label: 'Pending',
            value: pendingCount,
            sub: 'Awaiting review',
            subColor: 'text-amber-500',
            icon: Clock,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-500',
        },
        {
            label: 'Under Review',
            value: reviewCount,
            sub: 'Being reviewed',
            subColor: 'text-blue-500',
            icon: Eye,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-500',
        },
        {
            label: 'Approved',
            value: approvedCount,
            sub: 'Ready for disbursement',
            subColor: 'text-green-500',
            icon: CheckCircle2,
            iconBg: 'bg-green-50',
            iconColor: 'text-green-500',
        },
        {
            label: 'Rejected',
            value: requests.filter(r => r.status === 'REJECTED').length,
            sub: 'See details',
            subColor: 'text-red-400',
            icon: XCircle,
            iconBg: 'bg-red-50',
            iconColor: 'text-red-400',
        },
        {
            label: 'Total Received',
            value: `₱${totalReceived.toLocaleString()}`,
            sub: `${disbursedCount} disbursed`,
            subColor: 'text-emerald-500',
            icon: PiggyBank,
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-500',
        },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Welcome, {session?.user?.name?.split(' ')[0] || 'Member'}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Track and manage your assistance requests</p>
                    </div>
                    <Link href="/beneficiary/requests/new">
                        <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 shadow-sm">
                            <Plus size={16} />
                            New Request
                        </Button>
                    </Link>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2">
                        <AlertTriangle size={15} /> {error}
                    </div>
                )}

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {statCards.map((card) => (
                        <div key={card.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500">{card.label}</p>
                                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                                <p className={`text-xs font-medium ${card.subColor}`}>{card.sub}</p>
                            </div>
                            <div className={`${card.iconBg} p-2.5 rounded-xl`}>
                                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Requests Panel */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-5 py-4 text-sm font-medium transition-colors relative ${
                                    activeTab === tab.key
                                        ? 'text-red-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab.label}
                                {activeTab === tab.key && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Request List */}
                    <div className="divide-y divide-gray-50">
                        {filteredRequests.length === 0 ? (
                            <div className="py-16 text-center">
                                <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">No requests found</p>
                                {activeTab === 'active' && (
                                    <Link href="/beneficiary/requests/new">
                                        <Button variant="outline" className="mt-4 text-sm border-red-200 text-red-600 hover:bg-red-50">
                                            <Plus size={14} className="mr-1.5" /> Submit your first request
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            filteredRequests.map((req) => {
                                const urgency     = urgencyConfig[req.urgency_level] ?? urgencyConfig.LOW;
                                const statusBadge = statusConfig[req.status] ?? statusConfig.PENDING;
                                const daysLeft    = Math.ceil((new Date(req.date_needed).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                const date        = new Date(req.created_at).toLocaleDateString('en-US', {
                                    month: '2-digit', day: '2-digit', year: 'numeric',
                                });

                                return (
                                    <div key={req.id} className="flex items-center justify-between px-6 py-5 hover:bg-gray-50/60 transition-colors">
                                        <div className="space-y-1.5 min-w-0 flex-1 pr-6">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-gray-900 line-clamp-1">{req.purpose}</span>
                                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusBadge.className}`}>
                                                    {statusBadge.label}
                                                </span>
                                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${urgency.className}`}>
                                                    {urgency.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                <span>{date}</span>
                                                <span className="mx-1">â€¢</span>
                                                <span className="font-mono">{formatReqId(req.id, req.created_at)}</span>
                                                {req.documents?.length > 0 && (
                                                    <>
                                                        <span className="mx-1">â€¢</span>
                                                        <span>{req.documents.length} doc{req.documents.length > 1 ? 's' : ''}</span>
                                                    </>
                                                )}
                                                {daysLeft > 0 && (
                                                    <>
                                                        <span className="mx-1">â€¢</span>
                                                        <span className={daysLeft <= 7 ? 'text-red-500 font-medium' : ''}>
                                                            needed in {daysLeft}d
                                                        </span>
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                            <p className="text-base font-bold text-gray-900">₱{req.amount.toLocaleString()}</p>
                                            <Link href={`/beneficiary/requests/${req.id}`}>
                                                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 text-sm px-4 py-2 h-9 rounded-lg">
                                                    View
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
