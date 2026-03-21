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
  Eye,
  ShieldCheck,
  Bell,
  Sparkles
} from 'lucide-react';
import { pusherClient } from '@/lib/pusher-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

// === Types ===

interface ChartData {
    donationTrends: { date: string; amount: number }[];
    requestDistribution: { name: string; value: number }[];
    poolAnalytics: { name: string; allocated: number; available: number; total: number }[];
}

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

const CHART_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

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
    const [chartData, setChartData] = useState<ChartData | null>(null);
    
    // UI states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mainTab, setMainTab] = useState<MainTab>('requests');
    const [reqSubTab, setReqSubTab] = useState<RequestsSubTab>('pending');
    const [donSubTab, setDonSubTab] = useState<DonationsSubTab>('all');
    const [notification, setNotification] = useState<string | null>(null);
    const [chartFontSize, setChartFontSize] = useState(10);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 640) {
                setChartFontSize(12);
            } else {
                setChartFontSize(10);
            }
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchDashboardData = React.useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const [statsRes, reqRes, donRes, poolsRes] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/admin/requests?limit=200'),
                fetch('/api/admin/donations?limit=200'),
                fetch('/api/pools/create')
            ]);

            if (!statsRes.ok || !reqRes.ok || !donRes.ok || !poolsRes.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const statsData = await statsRes.json();
            const reqData = await reqRes.json();
            const donData = await donRes.json();
            const poolsData = await poolsRes.json();

            const allRequests: Request[] = reqData.data?.requests ?? [];
            setRequests(allRequests);
            setDonations(donData.data?.donations ?? []);
            setPools(poolsData.data ?? []);
            setChartData(statsData.charts);

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
    }, []);

    useEffect(() => {
        if (authStatus !== 'authenticated' || session?.user?.role !== 'admin') {
            if (authStatus !== 'loading') setLoading(false);
            return;
        }

        fetchDashboardData();

        if (!session?.user?.id) return;

        // Pusher Real-time Listener for Admin
        const channelName = `user-${session.user.id}`;
        const channel = pusherClient.subscribe(channelName);

        channel.bind('notification', (data: any) => {
            // Show notification toast if data contains message
            if (data.title && data.message) {
                setNotification(`${data.title}: ${data.message}`);
                setTimeout(() => setNotification(null), 8000);
            }

            // Silent refresh of all data whenever any notification happens (new request, donation, etc)
            fetchDashboardData(true);
        });

        return () => {
            channel.unbind_all();
            pusherClient.unsubscribe(channelName);
        };
    }, [authStatus, session, fetchDashboardData]);

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
        <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 md:pt-28 pb-20 px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Comprehensive overview of platform operations</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin/ledger">
                            <Button variant="outline" className="flex items-center gap-2 border-gray-200 text-indigo-600 hover:bg-indigo-50 border-indigo-100 bg-indigo-50/30 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2">
                                <ShieldCheck size={16} />
                                Transparency Ledger
                            </Button>
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Stat Cards Grid - Fully responsive */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {statCards.map((card, i) => (
                        <div key={i} className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm flex flex-col justify-between min-h-[80px] sm:min-h-[96px] hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start gap-2">
                                <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight break-words flex-1">
                                    {card.label}
                                </p>
                                <div className={`${card.bg} p-1.5 rounded-lg shrink-0`}>
                                    <card.icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${card.color}`} />
                                </div>
                            </div>
                            <p className="text-sm sm:text-base lg:text-lg font-black text-gray-900 truncate mt-1">
                                {card.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Analytics Charts Section */}
                {chartData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 sm:mt-8">
                        {/* Donation Trends */}
                        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider">Donation Trends (Last 30 Days)</h3>
                                <Sparkles className="w-4 h-4 text-amber-500" />
                            </div>
                            <div className="h-[240px] sm:h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData.donationTrends}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="date" fontSize={chartFontSize} tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} />
                                        <YAxis fontSize={chartFontSize} tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} tickFormatter={(v) => `₱${(v/1000)}k`} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(v: any) => [`₱${Number(v).toLocaleString()}`, 'Amount']}
                                        />
                                        <Line type="monotone" dataKey="amount" stroke="#EF4444" strokeWidth={2} dot={{ r: 3, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {/* Request Status Distribution */}
                            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 sm:mb-6">Request Distribution</h3>
                                <div className="h-[200px] sm:h-[250px] w-full flex items-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData.requestDistribution}
                                                innerRadius={40}
                                                outerRadius={60}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {chartData.requestDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: `${chartFontSize - 2}px` }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Pool Analytics */}
                            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 sm:mb-6">Funding Pools Utilization</h3>
                                <div className="h-[180px] sm:h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData.poolAnalytics} layout="vertical">
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={70} fontSize={chartFontSize - 1} tickLine={false} axisLine={false} />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                formatter={(v: any) => [`₱${Number(v).toLocaleString()}`, 'Balance']}
                                            />
                                            <Legend wrapperStyle={{ fontSize: `${chartFontSize - 2}px` }} />
                                            <Bar name="Available" dataKey="available" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                                            <Bar name="Allocated" dataKey="allocated" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Tabs Navigation - Horizontal scroll with better mobile handling */}
                <div className="mt-6 sm:mt-8 border-b border-gray-200 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
                    <nav className="-mb-px flex space-x-4 sm:space-x-6 min-w-max px-1">
                        {[
                            { id: 'donations', name: 'Donations', count: donations.length },
                            { id: 'requests', name: 'Requests', count: requests.length },
                            { id: 'pools', name: 'Pools', count: pools.length },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setMainTab(tab.id as MainTab)}
                                className={`
                                    whitespace-nowrap pb-3 sm:pb-4 px-1 border-b-2 font-bold text-xs sm:text-sm transition-all
                                    ${mainTab === tab.id
                                        ? 'border-red-600 text-red-600'
                                        : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
                                    }
                                `}
                            >
                                <span className="uppercase tracking-wide">{tab.name}</span>
                                <span className={`ml-2 py-0.5 px-2 rounded-full text-[9px] sm:text-[10px] font-black ${
                                    mainTab === tab.id ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500'
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
                            <div className="bg-gray-50 p-2 sm:p-3 border-b border-gray-200 flex space-x-2 overflow-x-auto scrollbar-thin">
                                {['all', 'pending', 'completed'].map(sub => (
                                    <button
                                        key={sub}
                                        onClick={() => setDonSubTab(sub as DonationsSubTab)}
                                        className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg capitalize transition-colors whitespace-nowrap ${
                                            donSubTab === sub ? 'bg-white shadow-sm border border-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                    >
                                        {sub}
                                    </button>
                                ))}
                            </div>
                            {/* Desktop View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white border-b border-gray-100 text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                                        <tr>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4">ID / Date</th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4">Donor</th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4">Amount</th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4">Type / Pool</th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredDonations.length === 0 ? (
                                            <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">No donations found</td></tr>
                                        ) : filteredDonations.map(d => (
                                            <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                    <div className="font-mono text-xs text-gray-900 font-bold">#DON-{d.id}</div>
                                                    <div className="text-xs text-gray-400 font-medium">{new Date(d.created_at).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                    <div className="font-bold text-gray-900 truncate max-w-[200px]">{getDonorName(d)}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                        {d.registeredDonor ? 'Registered' : d.guestDonor ? 'Guest' : 'Anonymous'}
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                    <div className="font-black text-gray-900">₱{d.amount.toLocaleString()}</div>
                                                    {d.net_amount && <div className="text-[10px] font-bold text-emerald-600">NET: ₱{d.net_amount.toLocaleString()}</div>}
                                                </td>
                                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                        d.donation_type === 'restricted' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {d.donation_type}
                                                    </span>
                                                    {d.pool && <div className="mt-1 text-[11px] font-bold text-gray-500 max-w-[150px] truncate" title={d.pool.name}>{d.pool.name}</div>}
                                                </td>
                                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                                        d.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-200' : 
                                                        'bg-amber-100 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {d.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Grid View (2 columns) */}
                            <div className="md:hidden grid grid-cols-2 gap-3 p-3 bg-gray-50/50">
                                {filteredDonations.length === 0 ? (
                                    <div className="col-span-2 p-12 text-center text-gray-400 font-medium bg-white rounded-xl border border-gray-100">No donations found</div>
                                ) : filteredDonations.map(d => (
                                    <div key={d.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-mono text-[9px] text-gray-900 font-bold">#DON-{d.id}</div>
                                                <div className="text-[9px] text-gray-400 font-bold">{new Date(d.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="mb-2">
                                            <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Donor</div>
                                            <div className="font-bold text-gray-900 text-[11px] truncate">{getDonorName(d)}</div>
                                        </div>

                                        <div className="mb-3">
                                            <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Amount</div>
                                            <div className="font-black text-gray-900 text-sm">₱{d.amount.toLocaleString()}</div>
                                            {d.net_amount && <div className="text-[8px] font-bold text-emerald-600">NET: ₱{d.net_amount.toLocaleString()}</div>}
                                        </div>

                                        <div className="flex flex-col gap-1.5 mt-auto">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-center ${
                                                d.donation_type === 'restricted' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {d.donation_type}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider text-center ${
                                                d.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-200' : 
                                                'bg-amber-100 text-amber-700 border border-amber-200'
                                            }`}>
                                                {d.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* === REQUESTS TAB === */}
                    {mainTab === 'requests' && (
                        <div>
                            <div className="bg-gray-50 p-2 sm:p-3 border-b border-gray-200 flex space-x-2 overflow-x-auto scrollbar-thin">
                                {['all', 'pending', 'under_review', 'approved', 'disbursed', 'receipt_proof', 'rejected'].map(sub => (
                                    <button
                                        key={sub}
                                        onClick={() => setReqSubTab(sub as RequestsSubTab)}
                                        className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg capitalize transition-colors whitespace-nowrap ${
                                            reqSubTab === sub ? 'bg-white shadow-sm border border-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                    >
                                        {sub.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                            {/* Desktop View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white border-b border-gray-100 text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                                        <tr>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4">ID / Urgency</th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4">Beneficiary</th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4">Purpose / Amount</th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4">Status / Receipt</th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredRequests.length === 0 ? (
                                            <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">No requests found</td></tr>
                                        ) : filteredRequests.map(req => {
                                            const urgency = urgencyConfig[req.urgency_level] ?? urgencyConfig.LOW;
                                            const statusBadge = statusConfig[req.status] ?? statusConfig.PENDING;
                                            const receiptStatus = receiptStatusConfig[req.receipt_status] ?? receiptStatusConfig.MISSING;
                                            
                                            return (
                                                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                        <div className="font-mono text-xs text-gray-900 font-black">{formatReqId(req.id, req.created_at)}</div>
                                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${urgency.className}`}>
                                                            {urgency.label}
                                                        </span>
                                                        <div className="text-[10px] text-gray-400 font-bold mt-1">{new Date(req.created_at).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                        <div className="font-bold text-gray-900 leading-tight">{req.beneficiary.firstName} {req.beneficiary.lastName}</div>
                                                        <div className="text-[10px] font-bold text-gray-400 mt-0.5 tracking-wider uppercase">@{req.beneficiary.username}</div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                        <div className="max-w-[200px] sm:max-w-[250px] truncate font-bold text-gray-800" title={req.purpose}>{req.purpose}</div>
                                                        <div className="text-sm font-black text-gray-900 mt-1 uppercase tracking-tight">₱{req.amount.toLocaleString()}</div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                        <div className="flex flex-col items-start gap-1.5">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusBadge.className}`}>
                                                                {statusBadge.label}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 uppercase tracking-wider ${receiptStatus.className}`}>
                                                                <FileText size={10} strokeWidth={3} />
                                                                {req.receipt_status === 'PENDING' ? 'Proof Review' : receiptStatus.label}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                                                        <Link href={`/admin/requests/${req.id}`}>
                                                            <Button size="sm" variant="outline" className="h-8 gap-2 font-bold text-xs hover:bg-red-50 hover:text-red-700 transition-all border-gray-200">
                                                                <Eye size={14} strokeWidth={3} /> VIEW
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Grid View (2 columns) */}
                            <div className="md:hidden grid grid-cols-2 gap-3 p-3 bg-gray-50/50">
                                {filteredRequests.length === 0 ? (
                                    <div className="col-span-2 p-12 text-center text-gray-400 font-medium bg-white rounded-xl border border-gray-100">No requests found</div>
                                ) : filteredRequests.map(req => {
                                    const urgency = urgencyConfig[req.urgency_level] ?? urgencyConfig.LOW;
                                    const statusBadge = statusConfig[req.status] ?? statusConfig.PENDING;
                                    const receiptStatus = receiptStatusConfig[req.receipt_status] ?? receiptStatusConfig.MISSING;

                                    return (
                                        <div key={req.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                                            <div className="mb-2">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="font-mono text-[9px] text-gray-900 font-black">{formatReqId(req.id, req.created_at)}</div>
                                                    <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter ${urgency.className}`}>
                                                        {urgency.label}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] font-bold text-gray-900 leading-tight line-clamp-1">{req.beneficiary.firstName} {req.beneficiary.lastName}</div>
                                                <div className="text-[8px] text-gray-500 line-clamp-1 mt-0.5">{req.purpose}</div>
                                            </div>

                                            <div className="mb-3">
                                                <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Amount</div>
                                                <div className="font-black text-gray-900 text-sm tracking-tight">₱{req.amount.toLocaleString()}</div>
                                            </div>

                                            <div className="flex flex-col gap-1.5 mt-auto">
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border text-center ${statusBadge.className}`}>
                                                    {statusBadge.label}
                                                </span>
                                                <Link href={`/admin/requests/${req.id}`} className="block">
                                                    <Button variant="outline" className="w-full h-7 gap-1 font-black text-[9px] uppercase tracking-widest border-gray-200 py-0">
                                                        <Eye size={10} strokeWidth={3} /> VIEW
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* === POOLS TAB === */}
                    {mainTab === 'pools' && (
                        <div>
                            <div className="bg-gray-50 p-2 sm:p-3 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
                                <span className="text-xs sm:text-sm font-medium text-gray-600 px-2 text-center sm:text-left">Manage all active and inactive funding pools</span>
                                <Link href="/admin/pools">
                                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs px-3 sm:px-4 rounded-md">
                                        Manage Pools / Create New
                                    </Button>
                                </Link>
                            </div>
                            {/* Desktop View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white border-b border-gray-100 text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                                        <tr>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4">Pool Name</th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4">Status / Date</th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4">Received</th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4">Allocated</th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4">Available</th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {pools.length === 0 ? (
                                            <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">No pools found</td></tr>
                                        ) : pools.map(pool => (
                                            <tr key={pool.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                    <div className="font-black text-gray-900">{pool.name}</div>
                                                    <div className="text-[11px] text-gray-400 font-bold max-w-[200px] truncate mt-0.5 uppercase tracking-tight" title={pool.description || ''}>{pool.description || 'No description'}</div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                        pool.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {pool.status}
                                                    </span>
                                                    <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase">{new Date(pool.created_at).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3 sm:py-4 font-black text-gray-900 text-sm">₱{pool.total_received.toLocaleString()}</td>
                                                <td className="px-4 sm:px-6 py-3 sm:py-4 font-black text-red-600 text-sm">₱{pool.allocated_amount.toLocaleString()}</td>
                                                <td className="px-4 sm:px-6 py-3 sm:py-4 font-black text-emerald-600 text-sm">₱{pool.available_amount.toLocaleString()}</td>
                                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                                                    <Link href="/admin/pools">
                                                        <Button size="sm" variant="outline" className="h-8 gap-2 font-bold text-xs hover:border-gray-900 transition-all">
                                                            DETAILS
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Grid View (2 columns) */}
                            <div className="md:hidden grid grid-cols-2 gap-3 p-3 bg-gray-50/50">
                                {pools.length === 0 ? (
                                    <div className="col-span-2 p-12 text-center text-gray-400 font-medium bg-white rounded-xl border border-gray-100">No pools found</div>
                                ) : pools.map(pool => (
                                    <div key={pool.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                                        <div className="mb-3">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                    pool.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {pool.status}
                                                </span>
                                            </div>
                                            <div className="font-black text-gray-900 text-[11px] leading-tight line-clamp-1">{pool.name}</div>
                                            <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">{new Date(pool.created_at).toLocaleDateString()}</div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div>
                                                <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Available</div>
                                                <div className="font-black text-emerald-600 text-[11px]">₱{pool.available_amount.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-[8px] text-red-400 font-bold uppercase tracking-wider mb-0.5">Allocated</div>
                                                <div className="font-black text-red-600 text-[11px]">₱{pool.allocated_amount.toLocaleString()}</div>
                                            </div>
                                        </div>

                                        <Link href="/admin/pools" className="block mt-auto">
                                            <Button variant="outline" className="w-full h-7 font-black text-[9px] uppercase tracking-widest border-gray-200 py-0">
                                                MANAGE
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

function delegationsCount(donations: any[]) {
    return Array.isArray(donations) ? donations.length : 0;
}