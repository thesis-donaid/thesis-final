'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    Plus,
    Search,
    Trash2,
    XCircle,
    Clock,
    Wallet,
    TrendingUp,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    DollarSign,
    PiggyBank,
    HandCoins,
    BarChart3,
    Users,
    FileText,
    X,
    Target,
    ShieldCheck,
    Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AllocationData {
    id: number;
    amount: number;
    source_type: string;
    is_disbursed: boolean;
    disbursed_at: string | null;
    allocated_at: string;
    allocated_by: string;
    request: {
        id: number;
        purpose: string;
        amount: number;
        status: string;
        beneficiary: {
            firstName: string;
            lastName: string;
        };
    };
    donationAllocations: {
        amount_used: number;
        donation: { id: number; email: string; amount: number };
    }[];
}

interface DonationData {
    id: number;
    amount: number;
    status: string;
    email: string;
    is_anonymous: boolean;
    donation_type: string;
    created_at: string;
    paid_at: string | null;
    guestDonor: { email: string } | null;
    registeredDonor: { name: string | null; user: { firstName: string; lastName: string } } | null;
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
    createdBy: { firstName: string; lastName: string };
    donation: DonationData[];
    allocations: AllocationData[];
}

interface Summary {
    totalPools: number;
    activePools: number;
    totalReceived: number;
    totalAllocated: number;
    totalAvailable: number;
    totalDonations: number;
    totalAllocations: number;
}

export default function AdminPoolsPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const [pools, setPools] = useState<Pool[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedPool, setExpandedPool] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Record<string, 'donations' | 'allocations'>>({});

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newPool, setNewPool] = useState({ name: '', description: '', total_amount: '', status: 'active' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-detect donation type based on pool name
    const getPoolDonationType = (name: string) =>
        name.trim().toLowerCase() === 'unrestricted' ? 'unrestricted' : 'restricted';

    useEffect(() => {
        if (authStatus === 'unauthenticated' || (authStatus === 'authenticated' && session?.user?.role !== 'admin')) {
            router.push('/');
            return;
        }
        if (authStatus === 'authenticated') fetchPools();
    }, [authStatus, session, router]);

    const fetchPools = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/pools/create');
            const data = await res.json();
            if (data.success) {
                setPools(data.data);
                setSummary(data.summary);
            } else {
                setError(data.error || 'Failed to fetch pools');
            }
        } catch {
            setError('An error occurred while fetching pools');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePool = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/pools/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPool),
            });
            const data = await res.json();
            if (data.success) {
                setIsCreateModalOpen(false);
                setNewPool({ name: '', description: '', total_amount: '', status: 'active' });
                fetchPools();
            } else {
                setError(data.error || 'Failed to create pool');
            }
        } catch {
            setError('An error occurred while creating the pool');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePool = async (id: string) => {
        if (!confirm('Are you sure you want to delete this pool?')) return;
        try {
            const res = await fetch(`/api/pools/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) fetchPools();
            else alert(data.error || 'Failed to delete pool');
        } catch {
            alert('An error occurred while deleting the pool');
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedPool(expandedPool === id ? null : id);
        if (!activeTab[id]) setActiveTab(prev => ({ ...prev, [id]: 'donations' }));
    };

    const getDonorName = (d: DonationData) => {
        if (d.is_anonymous) return 'Anonymous';
        if (d.registeredDonor) return d.registeredDonor.name || `${d.registeredDonor.user.firstName} ${d.registeredDonor.user.lastName}`;
        if (d.guestDonor) return d.guestDonor.email;
        return d.email;
    };

    const filteredPools = pools.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (authStatus === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-red-100 border-t-red-600" />
                    <p className="text-sm text-gray-500">Loading pools...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-20 sm:pt-24 md:pt-28 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-red-50 rounded-2xl shadow-sm border border-red-100">
                                <Target className="w-6 h-6 text-red-600" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                                Donation Pools
                            </h1>
                        </div>
                        <p className="text-gray-500 text-sm sm:text-base ml-[3.25rem]">
                            Organize funds and track community impact
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 px-6 h-11 rounded-xl shadow-lg shadow-red-200/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={18} />
                        <span className="font-bold">Create Pool</span>
                    </Button>
                </div>

                {/* Summary Stats Container */}
                {summary && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Total Received', value: `₱${summary.totalReceived.toLocaleString()}`, icon: Wallet, bg: 'bg-indigo-50', color: 'text-indigo-500' },
                            { label: 'Funds Allocated', value: `₱${summary.totalAllocated.toLocaleString()}`, icon: HandCoins, bg: 'bg-pink-50', color: 'text-pink-500' },
                            { label: 'Available Funds', value: `₱${summary.totalAvailable.toLocaleString()}`, icon: PiggyBank, bg: 'bg-emerald-50', color: 'text-emerald-500' },
                            { label: 'Active Pools', value: `${summary.activePools} / ${summary.totalPools}`, icon: BarChart3, bg: 'bg-orange-50', color: 'text-orange-500' },
                        ].map((card, i) => (
                            <div key={i} className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col justify-between min-h-[100px] hover:shadow-md transition-all duration-300">
                                <div className="flex justify-between items-start">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        {card.label}
                                    </p>
                                    <div className={`${card.bg} p-2 rounded-xl`}>
                                        <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.color}`} />
                                    </div>
                                </div>
                                <p className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
                                    {card.value}
                                </p>
                            </div>
                        ))}
                    </div>
                )}


                {/* Search Bar Container */}
                <div className="relative mb-8 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors group-focus-within:text-red-500" />
                    <Input
                        placeholder="Filter pools by name or description..."
                        className="pl-12 pr-12 h-14 border-gray-100 focus:border-red-400 focus:ring-red-400/10 rounded-2xl bg-white shadow-sm text-base placeholder:text-gray-400 border-2"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-all"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 text-red-700 p-4 rounded-xl mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                        <XCircle size={20} className="shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* Pool List Section */}
                <div className="space-y-4">
                    {filteredPools.length > 0 ? (
                        filteredPools.map((pool) => {
                            const isExpanded = expandedPool === pool.id;
                            const tab = activeTab[pool.id] || 'donations';
                            const utilization = pool.total_received > 0 
                                ? Math.min((pool.allocated_amount / pool.total_received) * 100, 100) 
                                : 0;

                            return (
                                <div
                                    key={pool.id}
                                    className={`group bg-white rounded-xl border transition-all duration-300 overflow-hidden ${
                                        isExpanded ? 'border-red-100 shadow-lg shadow-red-500/5 ring-1 ring-red-50' : 'border-gray-100 shadow-sm hover:shadow-md hover:border-red-100/50'
                                    }`}
                                >
                                    {/* Pool Main Info Wrapper */}
                                    <div className="p-4 sm:p-5">
                                        <div className="flex flex-col lg:flex-row gap-4">
                                            {/* Left Column: Title & Icons */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                                                        pool.status === 'active' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-400'
                                                    }`}>
                                                        <Wallet size={20} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                            <h3 className="text-md font-black text-gray-800 truncate uppercase tracking-tight">
                                                                {pool.name}
                                                            </h3>
                                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                                                                pool.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200'
                                                            }`}>
                                                                {pool.status}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                                                                getPoolDonationType(pool.name) === 'unrestricted' 
                                                                    ? 'bg-blue-50 text-blue-600 border-blue-100' 
                                                                    : 'bg-purple-50 text-purple-600 border-purple-100'
                                                            }`}>
                                                                {getPoolDonationType(pool.name)}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
                                                            {pool.description || "Mission-critical donation pool supporting Puso ng Ama community initiatives."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column: Stats Grid */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:items-center gap-3 sm:gap-4 shrink-0">
                                                <div className="lg:w-24">
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Received</p>
                                                    <p className="text-base font-black text-gray-900">₱{pool.total_received.toLocaleString()}</p>
                                                </div>
                                                <div className="lg:w-24">
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Allocated</p>
                                                    <p className="text-base font-black text-pink-500">₱{pool.allocated_amount.toLocaleString()}</p>
                                                </div>
                                                <div className="lg:w-24">
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Available</p>
                                                    <p className="text-base font-black text-emerald-600">₱{pool.available_amount.toLocaleString()}</p>
                                                </div>
                                                <div className="lg:w-12 text-center">
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Used</p>
                                                    <span className={`text-sm font-black ${utilization >= 90 ? 'text-red-500' : 'text-blue-500'}`}>
                                                        {utilization.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Section */}
                                        <div className="mt-5 pt-3">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                    <TrendingUp size={10} className="text-red-400" />
                                                    Allocation Utilization
                                                </div>
                                                <p className="text-[9px] font-bold space-x-1.5">
                                                    <span className="text-gray-400">{pool.donation.length} Contributions</span>
                                                    <span className="text-gray-300">|</span>
                                                    <span className="text-gray-400">{pool.allocations.length} Disbursements</span>
                                                </p>
                                            </div>
                                            <div className="h-2 w-full bg-gray-50 rounded-full border border-gray-100 overflow-hidden shadow-inner flex">
                                                <div 
                                                    className={`h-full transition-all duration-1000 relative ${
                                                        utilization >= 90 ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-red-600 to-red-500'
                                                    }`}
                                                    style={{ width: `${utilization}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                                </div>
                                            </div>
                                            <div className="mt-1.5 flex justify-between text-[9px] text-gray-400 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={10} />
                                                    Created {new Date(pool.created_at).toLocaleDateString()}
                                                </span>
                                                {pool.createdBy && <span>By {pool.createdBy.firstName} {pool.createdBy.lastName}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className={`px-4 sm:px-5 py-3 flex items-center justify-between border-t transition-colors ${
                                        isExpanded ? 'bg-red-50/30 border-red-100' : 'bg-gray-50/50 border-gray-100 group-hover:bg-red-50/20 group-hover:border-red-100/30'
                                    }`}>
                                        <button
                                            onClick={() => toggleExpand(pool.id)}
                                            className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                                                isExpanded ? 'text-red-600' : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            {isExpanded ? (
                                                <>Close Details <ChevronUp size={14} /></>
                                            ) : (
                                                <>Expand Details <ChevronDown size={14} /></>
                                            )}
                                        </button>
                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/admin/pools/${pool.id}`)}
                                                className="bg-white border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[9px] h-8 px-3 rounded-lg hover:bg-gray-50"
                                            >
                                                Manage
                                            </Button>
                                            <button
                                                onClick={() => handleDeletePool(pool.id)}
                                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all border border-transparent hover:border-red-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Content Area */}
                                    {isExpanded && (
                                        <div className="border-t border-red-100 bg-white animate-in slide-in-from-top-4 duration-300">
                                            {/* Top Tabs */}
                                            <div className="flex px-4 border-b border-gray-50">
                                                {(['donations', 'allocations'] as const).map((t) => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setActiveTab(prev => ({ ...prev, [pool.id]: t }))}
                                                        className={`px-4 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 ${
                                                            tab === t 
                                                                ? 'border-red-600 text-red-600' 
                                                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                                        }`}
                                                    >
                                                        {t} ({t === 'donations' ? pool.donation.length : pool.allocations.length})
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="p-4">
                                                {tab === 'donations' ? (
                                                    <div className="space-y-3">
                                                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                                                            <table className="w-full text-left text-[10px] border-collapse">
                                                                <thead>
                                                                    <tr className="bg-gray-50/80 border-b border-gray-100">
                                                                        <th className="px-3 py-2 font-black text-gray-400 uppercase tracking-tighter">Donor Entity</th>
                                                                        <th className="px-3 py-2 font-black text-gray-400 uppercase tracking-tighter">Amount</th>
                                                                        <th className="px-3 py-2 font-black text-gray-400 uppercase tracking-tighter">Date</th>
                                                                        <th className="px-3 py-2 font-black text-gray-400 uppercase tracking-tighter">Type</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50">
                                                                    {pool.donation.length === 0 ? (
                                                                        <tr>
                                                                            <td colSpan={4} className="px-3 py-6 text-center text-gray-300 italic">
                                                                                No donations recorded yet.
                                                                            </td>
                                                                        </tr>
                                                                    ) : (
                                                                        pool.donation.map((d) => (
                                                                            <tr key={d.id} className="hover:bg-gray-50/30 transition-colors">
                                                                                <td className="px-3 py-2.5">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                                                                                            <Users size={12} className="text-gray-400" />
                                                                                        </div>
                                                                                        <span className="font-bold text-gray-800 text-[10px]">{getDonorName(d)}</span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-3 py-2.5 font-black text-emerald-600 text-[11px]">+₱{d.amount.toLocaleString()}</td>
                                                                                <td className="px-3 py-2.5 text-gray-500 font-medium">
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <Calendar size={10} className="text-gray-300" />
                                                                                        {new Date(d.paid_at || d.created_at).toLocaleDateString()}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-3 py-2.5">
                                                                                    <span className="px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-400 text-[9px] font-bold uppercase">
                                                                                        {d.donation_type}
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        ))
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="overflow-x-auto rounded-xl border border-gray-100">
                                                            <table className="w-full text-left text-[10px] border-collapse">
                                                                <thead>
                                                                    <tr className="bg-gray-50/80 border-b border-gray-100">
                                                                        <th className="px-3 py-2 font-black text-gray-400 uppercase tracking-tighter">Beneficiary Target</th>
                                                                        <th className="px-3 py-2 font-black text-gray-400 uppercase tracking-tighter">Purpose</th>
                                                                        <th className="px-3 py-2 font-black text-gray-400 uppercase tracking-tighter">Amount</th>
                                                                        <th className="px-3 py-2 font-black text-gray-400 uppercase tracking-tighter">Status</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50">
                                                                    {pool.allocations.length === 0 ? (
                                                                        <tr>
                                                                            <td colSpan={4} className="px-3 py-6 text-center text-gray-300 italic">
                                                                                Resources awaiting allocation.
                                                                            </td>
                                                                        </tr>
                                                                    ) : (
                                                                        pool.allocations.map((a) => (
                                                                            <tr key={a.id} className="hover:bg-gray-50/30 transition-colors">
                                                                                <td className="px-3 py-2.5">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                                                                                            <FileText size={12} className="text-red-500" />
                                                                                        </div>
                                                                                        <span className="font-bold text-gray-800 text-[10px]">
                                                                                            {a.request.beneficiary.firstName} {a.request.beneficiary.lastName}
                                                                                        </span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-3 py-2.5 max-w-xs">
                                                                                    <p className="font-medium text-gray-600 truncate text-[10px]" title={a.request.purpose}>
                                                                                        {a.request.purpose}
                                                                                    </p>
                                                                                </td>
                                                                                <td className="px-3 py-2.5 font-black text-red-500 text-[11px]">-₱{a.amount.toLocaleString()}</td>
                                                                                <td className="px-3 py-2.5">
                                                                                    <span className={`px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest text-[8px] ${
                                                                                        a.is_disbursed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                                                    }`}>
                                                                                        {a.is_disbursed ? 'DISBURSED' : 'PENDING'}
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        ))
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-white rounded-xl border-2 border-dashed border-gray-100 p-10 text-center shadow-inner">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <ShieldCheck className="text-gray-300 w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-1 tracking-tight">System Ready for Deployment</h3>
                            <p className="text-gray-500 text-xs mb-6 max-w-md mx-auto">
                                No donation pools are currently initialized. Create your first pool to begin managing community resources.
                            </p>
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-red-600 hover:bg-red-700 text-white px-8 h-10 rounded-xl shadow-lg shadow-red-200 text-xs"
                            >
                                Get Started
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Create Pool Modal */}
{isCreateModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <div 
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => setIsCreateModalOpen(false)} 
        />
        <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header Section - Compact */}
            <div className="px-4 sm:px-5 py-4 sm:py-5 bg-gradient-to-br from-red-600 to-red-700 text-white relative">
                <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10">
                    <Plus size={60} className="sm:w-[70px] sm:h-[70px]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight mb-1">Initialize Pool</h3>
                <p className="text-red-100 text-xs font-medium">Define a new funding vector for the foundation</p>
            </div>
            
            <form onSubmit={handleCreatePool} className="p-4 sm:p-5 space-y-4">
                {/* Pool Name Field */}
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">
                        Pool Name
                    </label>
                    <Input
                        required
                        placeholder="e.g., Youth Education Sanctuary"
                        className="h-9 rounded-lg border-gray-100 focus:border-red-400 focus:ring-red-400/20 shadow-sm text-sm"
                        value={newPool.name}
                        onChange={(e) => setNewPool({ ...newPool, name: e.target.value })}
                    />
                    {newPool.name.trim() && (
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 pl-1">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                getPoolDonationType(newPool.name) === 'unrestricted' 
                                    ? 'bg-blue-50 text-blue-600 border-blue-100' 
                                    : 'bg-purple-50 text-purple-600 border-purple-100'
                            }`}>
                                {getPoolDonationType(newPool.name)}
                            </span>
                            <p className="text-[9px] text-gray-400 font-bold">
                                {getPoolDonationType(newPool.name) === 'unrestricted' 
                                    ? '→ Universal foundation support' 
                                    : '→ Specifically targeted funding'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Initial Target Field */}
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">
                        Initial Target (₱)
                    </label>
                    <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="h-9 rounded-lg border-gray-100 focus:border-red-400 focus:ring-red-400/20 shadow-sm text-sm"
                        value={newPool.total_amount}
                        onChange={(e) => setNewPool({ ...newPool, total_amount: e.target.value })}
                    />
                </div>

                {/* Core Objectives Field */}
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">
                        Core Objectives
                    </label>
                    <Textarea
                        placeholder="Describe the primary mission and expected impact of this pool..."
                        className="rounded-lg border-gray-100 focus:border-red-400 focus:ring-red-400/20 shadow-sm min-h-[80px] text-sm"
                        value={newPool.description}
                        onChange={(e) => setNewPool({ ...newPool, description: e.target.value })}
                    />
                </div>

                {/* Modal Footer Actions */}
                <div className="flex gap-2 pt-2">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        className="flex-1 h-9 rounded-lg font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest text-[10px]" 
                        onClick={() => setIsCreateModalOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        className="flex-1 h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-200 uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100" 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Processing...' : 'Deploy Pool'}
                    </Button>
                </div>
            </form>
        </div>
    </div>
)}
        </div>
    );
}
