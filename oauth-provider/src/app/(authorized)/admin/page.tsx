'use client'

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Clock,
  CheckCircle2,
  FileText,
  Users,
  PiggyBank,
  Wallet,
  HandCoins,
  DollarSign,
  UserCheck,
  UserPlus,
  BarChart3,
  Search,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// === Types ===

interface Request {
    id: number;
    purpose: string;
    amount: number;
    status: string;
    urgency_level: string;
    created_at: string;
    receipt_status: string;
    beneficiary: {
        firstName: string;
        lastName: string;
        username: string;
    };
    allocations: {
        id: number;
        amount: number;
        pool: { name: string } | null;
    }[];
    allocatedAmount: number;
}

interface Donation {
    id: number;
    amount: number;
    net_amount: number | null;
    status: string;
    donation_type: string;
    created_at: string;
    guestDonor: { email: string } | null;
    registeredDonor: { name: string | null; user: { name: string | null; email: string | null } } | null;
    pool: { name: string } | null;
}

interface Pool {
    id: string;
    name: string;
    description: string | null;
    total_received: number;
    allocated_amount: number;
    available_amount: number;
    status: string;
    created_at: string;
    createdBy: { name: string } | null;
}

interface Stats {
    pendingCount: number;
    approvedCount: number;
    totalAllocations: number;
    totalAllocatedFunds: number;
    totalDisbursed: number;
    availableFunds: number;
    totalRequests: number;
    totalDonations: number;
    totalNetDonations: number;
    totalRegisteredDonors: number;
    totalGuestDonors: number;
    totalBeneficiaries: number;
    activePools: number;
}

type MainTab = 'donations' | 'requests' | 'pools';
type RequestsSubTab = 'all' | 'pending' | 'under_review' | 'approved' | 'disbursed' | 'receipt_proof' | 'rejected';
type DonationsSubTab = 'all' | 'pending' | 'completed';

// === Configs ===

const urgencyConfig: Record<string, { label: string; className: string }> = {
    LOW:    { label: 'low',      className: 'bg-blue-50 text-blue-600 border border-blue-100' },
    MEDIUM: { label: 'medium',   className: 'bg-amber-50 text-amber-600 border border-amber-100' },
    HIGH:   { label: 'critical', className: 'bg-red-50 text-red-600 border border-red-100' },
};

const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING:      { label: 'pending',      className: 'bg-amber-50 text-amber-600 border border-amber-100' },
    UNDER_REVIEW: { label: 'under review', className: 'bg-blue-50 text-blue-600 border border-blue-100' },
    APPROVED:     { label: 'approved',     className: 'bg-green-50 text-green-600 border border-green-100' },
    ALLOCATED:    { label: 'allocated',    className: 'bg-purple-50 text-purple-600 border border-purple-100' },
    DISBURSED:    { label: 'disbursed',    className: 'bg-gray-50 text-gray-600 border border-gray-100' },
    REJECTED:     { label: 'rejected',     className: 'bg-red-50 text-red-600 border border-red-100' },
};

const receiptStatusConfig: Record<string, { label: string; className: string }> = {
    COMPLETED: { label: 'completed', className: 'bg-green-50 text-green-600 border border-green-100' },
    PENDING: { label: 'pending', className: 'bg-amber-50 text-amber-600 border border-amber-100' },
    MISSING: { label: 'missing', className: 'bg-red-50 text-red-600 border border-red-100' }, 
};

function formatReqId(id: number, createdAt: string) {
    const year = new Date(createdAt).getFullYear();
    return `REQ-${year}-${String(id).padStart(3, '0')}`;
}

export default function AdminDashboard() {
    const { data: session, status: authStatus } = useSession();
    
    // Data states
    const [requests, setRequests] = useState<Request[]>([]);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [pools, setPools] = useState<Pool[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    
    // UI states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mainTab, setMainTab] = useState<MainTab>('requests');
    const [reqSubTab, setReqSubTab] = useState<RequestsSubTab>('pending');
    const [donSubTab, setDonSubTab] = useState<DonationsSubTab>('all');

    useEffect(() => {
        if (authStatus !== 'authenticated' || session?.user?.role !== 'admin') {
            if (authStatus !== 'loading') setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const [statsRes, reqRes, donRes, poolsRes] = await Promise.all([
                    fetch('/api/admin/stats'),
                    fetch('/api/admin/requests?limit=200'),
                    fetch('/api/admin/donations?limit=200'),
                    fetch('/api/pools/create') // Using the get endpoint via GET
                ]);

                if (!statsRes.ok || !reqRes.ok || !donRes.ok || !poolsRes.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }

                const statsData = await statsRes.json();
                const reqData = await reqRes.json();
                const donData = await donRes.json();
                const poolsData = await poolsRes.json();

                // Process Requests
                const allRequests: Request[] = reqData.data?.requests ?? [];
                setRequests(allRequests);

                // Process Donations
                const allDonations: Donation[] = donData.data?.donations ?? [];
                setDonations(allDonations);

                // Process Pools
                setPools(poolsData.data ?? []);

                // Process Stats
                const totalAllocations = allRequests.filter(r => r.allocations && r.allocations.length > 0).length;
                
                setStats({
                    pendingCount: allRequests.filter(r => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length,
                    approvedCount: allRequests.filter(r => r.status === 'APPROVED' || r.status === 'ALLOCATED').length,
                    totalAllocations,
                    totalAllocatedFunds: statsData.stats?.totalAllocatedFunds ?? 0,
                    totalDisbursed: statsData.stats?.totalDisbursed ?? 0,
                    availableFunds: statsData.stats?.availableFunds ?? 0,
                    totalRequests: statsData.stats?.totalRequests ?? 0,
                    totalDonations: statsData.stats?.totalDonations ?? 0,
                    totalNetDonations: statsData.stats?.totalNetDonations ?? 0,
                    totalRegisteredDonors: statsData.stats?.totalRegisteredDonors ?? 0,
                    totalGuestDonors: statsData.stats?.totalGuestDonors ?? 0,
                    totalBeneficiaries: statsData.stats?.totalBeneficiaries ?? 0,
                    activePools: statsData.stats?.activePools ?? 0,
                });

            } catch (err) {
                console.error(err);
                setError('Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [authStatus, session]);

    // Filtering logic
    const filteredRequests = requests.filter(r => {
        if (reqSubTab === 'all') return true;
        if (reqSubTab === 'pending') return r.status === 'PENDING';
        if (reqSubTab === 'under_review') return r.status === 'UNDER_REVIEW';
        if (reqSubTab === 'approved') return r.status === 'APPROVED' || r.status === 'ALLOCATED';
        if (reqSubTab === 'disbursed') return r.status === 'DISBURSED';
        if (reqSubTab === 'receipt_proof') return r.receipt_status === 'PENDING' || r.receipt_status === 'COMPLETED';
        if (reqSubTab === 'rejected') return r.status === 'REJECTED';
        return true;
    });

    const filteredDonations = donations.filter(d => {
        if (donSubTab === 'all') return true;
        if (donSubTab === 'pending') return d.status === 'pending';
        if (donSubTab === 'completed') return d.status === 'completed';
        return true;
    });

    const getDonorName = (d: Donation) => {
        if (d.registeredDonor) {
            if (d.registeredDonor.name) return d.registeredDonor.name;
            if (d.registeredDonor.user?.name) return d.registeredDonor.user.name;
            if (d.registeredDonor.user?.email) return d.registeredDonor.user.email;
        }
        if (d.guestDonor) {
            return d.guestDonor.email;
        }
        return 'Unknown Donor';
    };

    if (loading || !stats) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Loading comprehensive dashboard...</p>
                </div>
            </div>
        );
    }

    // Prepare stat cards
    const statCards = [
        { label: 'Net Donations', value: `₱${stats.totalNetDonations.toLocaleString()}`, icon: Wallet, bg: 'bg-indigo-50', color: 'text-indigo-500' },
        { label: 'Available Funds', value: `₱${stats.availableFunds.toLocaleString()}`, icon: PiggyBank, bg: 'bg-emerald-50', color: 'text-emerald-500' },
        { label: 'Allocated Funds', value: `₱${stats.totalAllocatedFunds.toLocaleString()}`, icon: HandCoins, bg: 'bg-pink-50', color: 'text-pink-500' },
        { label: 'Total Disbursed', value: `₱${stats.totalDisbursed.toLocaleString()}`, icon: DollarSign, bg: 'bg-gray-100', color: 'text-gray-600' },
        { label: 'Active Pools', value: `${stats.activePools} Pools`, icon: BarChart3, bg: 'bg-orange-50', color: 'text-orange-500' },
        { label: 'Pending Requests', value: stats.pendingCount, icon: Clock, bg: 'bg-amber-50', color: 'text-amber-500' },
        { label: 'Approved Requests', value: stats.approvedCount, icon: CheckCircle2, bg: 'bg-green-50', color: 'text-green-500' },
        { label: 'Allocated Requests', value: stats.totalAllocations, icon: FileText, bg: 'bg-purple-50', color: 'text-purple-500' },
        { label: 'Total Requests', value: stats.totalRequests, icon: FileText, bg: 'bg-blue-50', color: 'text-blue-500' },
        { label: 'Registered Donors', value: stats.totalRegisteredDonors, icon: UserCheck, bg: 'bg-teal-50', color: 'text-teal-500' },
        { label: 'Guest Donors', value: stats.totalGuestDonors, icon: UserPlus, bg: 'bg-sky-50', color: 'text-sky-500' },
        { label: 'Total Beneficiaries', value: stats.totalBeneficiaries, icon: Users, bg: 'bg-rose-50', color: 'text-rose-500' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Comprehensive overview of platform operations</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* 11 Stat Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {statCards.map((card, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between h-24">
                            <div className="flex justify-between items-start">
                                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider leading-tight">{card.label}</p>
                                <div className={`${card.bg} p-1.5 rounded-lg shrink-0 ml-2`}>
                                    <card.icon className={`w-4 h-4 ${card.color}`} />
                                </div>
                            </div>
                            <p className="text-lg font-bold text-gray-900 truncate">{card.value}</p>
                        </div>
                    ))}
                </div>

                {/* Main Tabs Navigation */}
                <div className="mt-8 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        {[
                            { id: 'donations', name: 'Donations', count: delegationsCount(donations) },
                            { id: 'requests', name: 'Requests', count: requests.length },
                            { id: 'pools', name: 'Pools', count: pools.length },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setMainTab(tab.id as MainTab)}
                                className={`
                                    whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                                    ${mainTab === tab.id
                                        ? 'border-red-500 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                            >
                                {tab.name}
                                <span className={`ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium ${
                                    mainTab === tab.id ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-900'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Contents */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">
                    
                    {/* === DONATIONS TAB === */}
                    {mainTab === 'donations' && (
                        <div>
                            <div className="bg-gray-50 p-3 border-b border-gray-200 flex space-x-2">
                                {['all', 'pending', 'completed'].map(sub => (
                                    <button
                                        key={sub}
                                        onClick={() => setDonSubTab(sub as DonationsSubTab)}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition-colors ${
                                            donSubTab === sub ? 'bg-white shadow-sm border border-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                    >
                                        {sub}
                                    </button>
                                ))}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">ID / Date</th>
                                            <th className="px-6 py-4">Donor</th>
                                            <th className="px-6 py-4">Amount</th>
                                            <th className="px-6 py-4">Type / Pool</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredDonations.length === 0 ? (
                                            <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No donations found</td></tr>
                                        ) : filteredDonations.map(d => (
                                            <tr key={d.id} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4">
                                                    <div className="font-mono text-xs text-gray-900">#DON-{d.id}</div>
                                                    <div className="text-xs text-gray-500">{new Date(d.created_at).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{getDonorName(d)}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {d.registeredDonor ? 'Registered' : d.guestDonor ? 'Guest' : 'Anonymous'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">₱{d.amount.toLocaleString()}</div>
                                                    {d.net_amount && <div className="text-xs text-emerald-600">Net: ₱{d.net_amount.toLocaleString()}</div>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                                        d.donation_type === 'restricted' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                        {d.donation_type}
                                                    </span>
                                                    {d.pool && <div className="mt-1 text-xs text-gray-500 max-w-[150px] truncate" title={d.pool.name}>{d.pool.name}</div>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-semibold capitalize ${
                                                        d.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-200' : 
                                                        'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {d.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* === REQUESTS TAB === */}
                    {mainTab === 'requests' && (
                        <div>
                            <div className="bg-gray-50 p-3 border-b border-gray-200 flex space-x-2 overflow-x-auto scbar-none">
                                {['all', 'pending', 'under_review', 'approved', 'disbursed', 'receipt_proof', 'rejected'].map(sub => (
                                    <button
                                        key={sub}
                                        onClick={() => setReqSubTab(sub as RequestsSubTab)}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition-colors whitespace-nowrap ${
                                            reqSubTab === sub ? 'bg-white shadow-sm border border-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                    >
                                        {sub.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">ID / Urgency</th>
                                            <th className="px-6 py-4">Beneficiary</th>
                                            <th className="px-6 py-4">Purpose / Amount</th>
                                            <th className="px-6 py-4">Status / Receipt</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredRequests.length === 0 ? (
                                            <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No requests found</td></tr>
                                        ) : filteredRequests.map(req => {
                                            const urgency = urgencyConfig[req.urgency_level] ?? urgencyConfig.LOW;
                                            const statusBadge = statusConfig[req.status] ?? statusConfig.PENDING;
                                            const receiptStatus = receiptStatusConfig[req.receipt_status] ?? receiptStatusConfig.MISSING;
                                            
                                            return (
                                                <tr key={req.id} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-4">
                                                        <div className="font-mono text-xs text-gray-900 font-semibold">{formatReqId(req.id, req.created_at)}</div>
                                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${urgency.className}`}>
                                                            {urgency.label}
                                                        </span>
                                                        <div className="text-[10px] text-gray-400 mt-1">{new Date(req.created_at).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-gray-900">{req.beneficiary.firstName} {req.beneficiary.lastName}</div>
                                                        <div className="text-xs text-gray-500">@{req.beneficiary.username}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="max-w-[250px] truncate font-medium text-gray-800" title={req.purpose}>{req.purpose}</div>
                                                        <div className="text-sm font-bold text-gray-900 mt-1">₱{req.amount.toLocaleString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col items-start gap-1.5">
                                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge.className}`}>
                                                                {statusBadge.label}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1 ${receiptStatus.className}`}>
                                                                <FileText size={10} />
                                                                {req.receipt_status === 'PENDING' ? 'Proof Review' : receiptStatus.label}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Link href={`/admin/requests/${req.id}`}>
                                                            <Button size="sm" variant="outline" className="h-8 gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                                                                <Eye size={14} /> View
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* === POOLS TAB === */}
                    {mainTab === 'pools' && (
                        <div>
                            <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600 px-2">Manage all active and inactive funding pools</span>
                                <Link href="/admin/pools">
                                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs px-4 rounded-md">
                                        Manage Pools / Create New
                                    </Button>
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Pool Name</th>
                                            <th className="px-6 py-4">Status / Date</th>
                                            <th className="px-6 py-4">Received</th>
                                            <th className="px-6 py-4">Allocated</th>
                                            <th className="px-6 py-4">Available</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {pools.length === 0 ? (
                                            <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No pools found</td></tr>
                                        ) : pools.map(pool => (
                                            <tr key={pool.id} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{pool.name}</div>
                                                    <div className="text-xs text-gray-500 max-w-[200px] truncate mt-0.5" title={pool.description || ''}>{pool.description || 'No description'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                        pool.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {pool.status}
                                                    </span>
                                                    <div className="text-[10px] text-gray-400 mt-1">{new Date(pool.created_at).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-gray-900">₱{pool.total_received.toLocaleString()}</td>
                                                <td className="px-6 py-4 font-semibold text-red-600">₱{pool.allocated_amount.toLocaleString()}</td>
                                                <td className="px-6 py-4 font-semibold text-emerald-600">₱{pool.available_amount.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link href="/admin/pools">
                                                        <Button size="sm" variant="outline" className="h-8 gap-2">
                                                            View Details
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

// Small helper since we can't do .length if it's undefined
function delegationsCount(donations: any[]) {
    return Array.isArray(donations) ? donations.length : 0;
}
