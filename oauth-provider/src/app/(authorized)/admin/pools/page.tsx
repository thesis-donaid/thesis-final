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
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Donation Pools</h1>
                        <p className="text-gray-500 mt-1">Manage funds, monitor allocations, and track donations per pool.</p>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={18} />
                        Create Pool
                    </Button>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Total Received', value: `₱${summary.totalReceived.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
                            { label: 'Fund Allocated', value: `₱${summary.totalAllocated.toLocaleString()}`, icon: HandCoins, color: 'text-red-600', bg: 'bg-red-50' },
                            { label: 'Available Funds', value: `₱${summary.totalAvailable.toLocaleString()}`, icon: PiggyBank, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Active Pools', value: `${summary.activePools} / ${summary.totalPools}`, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
                        ].map((card) => (
                            <div key={card.label} className="bg-white rounded-xl border p-5 shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                                        <card.icon size={20} className={card.color} />
                                    </div>
                                    <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">{card.label}</span>
                                </div>
                                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Search */}
                <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Search pools by name or description..."
                            className="pl-10 h-11"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                        <XCircle size={18} /> {error}
                    </div>
                )}

                {/* Pools List */}
                <div className="space-y-5">
                    {filteredPools.length > 0 ? (
                        filteredPools.map((pool) => {
                            const utilization = pool.total_received > 0
                                ? Math.round((pool.allocated_amount / pool.total_received) * 100)
                                : 0;
                            const isExpanded = expandedPool === pool.id;
                            const tab = activeTab[pool.id] || 'donations';
                            const completedDonations = pool.donation.filter(d => d.status === 'completed').length;
                            const disbursedAllocations = pool.allocations.filter(a => a.is_disbursed).length;

                            return (
                                <div key={pool.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                    {/* Pool Header Row */}
                                    <div className="p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                                    pool.status === 'active' ? 'bg-green-50' :
                                                    pool.status === 'paused' ? 'bg-amber-50' : 'bg-gray-100'
                                                }`}>
                                                    <Wallet size={22} className={
                                                        pool.status === 'active' ? 'text-green-600' :
                                                        pool.status === 'paused' ? 'text-amber-600' : 'text-gray-400'
                                                    } />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <h3 className="text-lg font-bold text-gray-900 truncate">{pool.name}</h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                                                            pool.status === 'active' ? 'bg-green-100 text-green-700' :
                                                            pool.status === 'paused' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                            {pool.status}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                                            getPoolDonationType(pool.name) === 'unrestricted'
                                                                ? 'bg-blue-50 text-blue-600'
                                                                : 'bg-purple-50 text-purple-600'
                                                        }`}>
                                                            {getPoolDonationType(pool.name)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 line-clamp-1">{pool.description || 'No description'}</p>
                                                </div>
                                            </div>

                                            {/* Stats Row */}
                                            <div className="flex items-center gap-6 lg:gap-8">
                                                <div className="text-center">
                                                    <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Received</div>
                                                    <div className="text-lg font-bold text-gray-900">₱{pool.total_received.toLocaleString()}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Allocated</div>
                                                    <div className="text-lg font-bold text-red-600">₱{pool.allocated_amount.toLocaleString()}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Available</div>
                                                    <div className="text-lg font-bold text-green-600">₱{pool.available_amount.toLocaleString()}</div>
                                                </div>
                                                <div className="text-center min-w-[60px]">
                                                    <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Used</div>
                                                    <div className={`text-lg font-bold ${utilization >= 80 ? 'text-red-600' : utilization >= 50 ? 'text-amber-600' : 'text-blue-600'}`}>{utilization}%</div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleDeletePool(pool.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => toggleExpand(pool.id)}
                                                    className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-red-50 text-red-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                                                    title={isExpanded ? 'Collapse' : 'Expand'}
                                                >
                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mt-4">
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-500 ${
                                                        utilization >= 80 ? 'bg-red-500' : utilization >= 50 ? 'bg-amber-500' : 'bg-red-400'
                                                    }`}
                                                    style={{ width: `${Math.min(100, utilization)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-1.5 text-[11px] text-gray-400">
                                                <span>{pool.donation.length} donations · {pool.allocations.length} allocations</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={10} />
                                                    Created {new Date(pool.created_at).toLocaleDateString()}
                                                    {pool.createdBy && ` by ${pool.createdBy.firstName} ${pool.createdBy.lastName}`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Section */}
                                    {isExpanded && (
                                        <div className="border-t">
                                            {/* Tabs */}
                                            <div className="flex border-b bg-gray-50/50">
                                                <button
                                                    onClick={() => setActiveTab(prev => ({ ...prev, [pool.id]: 'donations' }))}
                                                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                                                        tab === 'donations'
                                                            ? 'border-red-600 text-red-600 bg-white'
                                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                                    }`}
                                                >
                                                    <DollarSign size={15} />
                                                    Donations ({pool.donation.length})
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab(prev => ({ ...prev, [pool.id]: 'allocations' }))}
                                                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                                                        tab === 'allocations'
                                                            ? 'border-red-600 text-red-600 bg-white'
                                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                                    }`}
                                                >
                                                    <HandCoins size={15} />
                                                    Fund Allocations ({pool.allocations.length})
                                                </button>
                                            </div>

                                            <div className="p-5">
                                                {/* Donations Tab */}
                                                {tab === 'donations' && (
                                                    <div>
                                                        {pool.donation.length > 0 ? (
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-sm">
                                                                    <thead>
                                                                        <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-b">
                                                                            <th className="pb-3 pr-4">Donor</th>
                                                                            <th className="pb-3 pr-4">Amount</th>
                                                                            <th className="pb-3 pr-4">Type</th>
                                                                            <th className="pb-3 pr-4">Status</th>
                                                                            <th className="pb-3">Date</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-50">
                                                                        {pool.donation.map(d => (
                                                                            <tr key={d.id} className="hover:bg-gray-50/50">
                                                                                <td className="py-3 pr-4">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
                                                                                            <Users size={12} className="text-red-500" />
                                                                                        </div>
                                                                                        <span className="font-medium text-gray-800">{getDonorName(d)}</span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-3 pr-4 font-semibold text-gray-900">₱{d.amount.toLocaleString()}</td>
                                                                                <td className="py-3 pr-4">
                                                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                                                                        d.donation_type === 'restricted' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                                                                    }`}>
                                                                                        {d.donation_type}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="py-3 pr-4">
                                                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                                                                        d.status === 'completed' ? 'bg-green-50 text-green-600' :
                                                                                        d.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                                                                        'bg-gray-100 text-gray-500'
                                                                                    }`}>
                                                                                        {d.status}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="py-3 text-gray-500 text-xs">
                                                                                    {new Date(d.paid_at || d.created_at).toLocaleDateString()}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-400">
                                                                    <span>{completedDonations} of {pool.donation.length} completed</span>
                                                                    <span className="font-medium text-gray-600">
                                                                        Total: ₱{pool.donation.reduce((s, d) => s + d.amount, 0).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-10 text-gray-400">
                                                                <DollarSign size={32} className="mx-auto mb-2 text-gray-300" />
                                                                <p className="text-sm">No donations received yet</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Allocations Tab — Where Funds Were Allocated */}
                                                {tab === 'allocations' && (
                                                    <div>
                                                        {pool.allocations.length > 0 ? (
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-sm">
                                                                    <thead>
                                                                        <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400 border-b">
                                                                            <th className="pb-3 pr-4">Beneficiary</th>
                                                                            <th className="pb-3 pr-4">Purpose</th>
                                                                            <th className="pb-3 pr-4">Amount</th>
                                                                            <th className="pb-3 pr-4">Source</th>
                                                                            <th className="pb-3 pr-4">Disbursed</th>
                                                                            <th className="pb-3">Date</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-50">
                                                                        {pool.allocations.map(a => (
                                                                            <tr key={a.id} className="hover:bg-gray-50/50">
                                                                                <td className="py-3 pr-4">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center">
                                                                                            <Users size={12} className="text-amber-600" />
                                                                                        </div>
                                                                                        <span className="font-medium text-gray-800">
                                                                                            {a.request.beneficiary.firstName} {a.request.beneficiary.lastName}
                                                                                        </span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-3 pr-4">
                                                                                    <div className="max-w-[200px]">
                                                                                        <p className="text-gray-700 truncate">{a.request.purpose}</p>
                                                                                        <p className="text-[11px] text-gray-400">Request #{a.request.id} · ₱{a.request.amount.toLocaleString()} requested</p>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-3 pr-4 font-semibold text-red-600">₱{a.amount.toLocaleString()}</td>
                                                                                <td className="py-3 pr-4">
                                                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                                                                        a.source_type === 'RESTRICTED' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                                                                    }`}>
                                                                                        {a.source_type}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="py-3 pr-4">
                                                                                    {a.is_disbursed ? (
                                                                                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                                                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                                                            Yes
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
                                                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                                                            Pending
                                                                                        </span>
                                                                                    )}
                                                                                </td>
                                                                                <td className="py-3 text-gray-500 text-xs">
                                                                                    {new Date(a.allocated_at).toLocaleDateString()}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-400">
                                                                    <span>{disbursedAllocations} of {pool.allocations.length} disbursed</span>
                                                                    <span className="font-medium text-gray-600">
                                                                        Total Allocated: ₱{pool.allocations.reduce((s, a) => s + a.amount, 0).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-10 text-gray-400">
                                                                <HandCoins size={32} className="mx-auto mb-2 text-gray-300" />
                                                                <p className="text-sm">No funds allocated from this pool yet</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-white rounded-xl border border-dashed p-12 text-center">
                            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Wallet className="text-red-300" size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No pools found</h3>
                            <p className="text-gray-500 mb-6">Create your first donation pool to start managing funds.</p>
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                <Plus size={18} className="mr-2" />
                                Create Pool
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Pool Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b bg-red-600 text-white flex justify-between items-center">
                            <h3 className="text-lg font-bold">Create New Pool</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                                <XCircle size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleCreatePool} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Pool Name</label>
                                <Input
                                    required
                                    placeholder="e.g., Youth Development, Staff Development"
                                    value={newPool.name}
                                    onChange={(e) => setNewPool({ ...newPool, name: e.target.value })}
                                />
                                {newPool.name.trim() && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-400">Donation type:</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                            getPoolDonationType(newPool.name) === 'unrestricted'
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'bg-purple-50 text-purple-600'
                                        }`}>
                                            {getPoolDonationType(newPool.name)}
                                        </span>
                                        <span className="text-[11px] text-gray-400">
                                            {getPoolDonationType(newPool.name) === 'unrestricted'
                                                ? '— General-purpose fund'
                                                : '— Donations are restricted to this pool'}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Starting Amount (₱)</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={newPool.total_amount}
                                    onChange={(e) => setNewPool({ ...newPool, total_amount: e.target.value })}
                                />
                                <p className="text-[11px] text-gray-400">Initial balance for this pool. Leave at 0 if starting fresh.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Description</label>
                                <Textarea
                                    placeholder="Brief description of this pool's purpose..."
                                    rows={3}
                                    value={newPool.description}
                                    onChange={(e) => setNewPool({ ...newPool, description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                    value={newPool.status}
                                    onChange={(e) => setNewPool({ ...newPool, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="paused">Paused</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCreateModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating...' : 'Create Pool'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
