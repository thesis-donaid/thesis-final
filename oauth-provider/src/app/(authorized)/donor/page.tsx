'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    Heart,
    CheckCircle2,
    Clock,
    DollarSign,
    Plus,
    AlertTriangle,
    HandCoins,
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
    created_at: string;
    paid_at: string | null;
    pool: { id: string; name: string } | null;
}

interface DonorStats {
    totalDonated: number;
    donationCount: number;
    completedCount: number;
    pendingCount: number;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    completed:  { label: 'Completed',  className: 'bg-green-50 text-green-600 border border-green-100' },
    pending:    { label: 'Pending',    className: 'bg-amber-50 text-amber-600 border border-amber-100' },
    processing: { label: 'Processing', className: 'bg-blue-50 text-blue-600 border border-blue-100' },
    failed:     { label: 'Failed',     className: 'bg-red-50 text-red-600 border border-red-100' },
    refunded:   { label: 'Refunded',   className: 'bg-gray-50 text-gray-500 border border-gray-100' },
};

type Tab = 'all' | 'completed' | 'pending';

export default function DonorDashboard() {
    const { data: session, status: authStatus } = useSession();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [stats, setStats] = useState<DonorStats>({
        totalDonated: 0, donationCount: 0, completedCount: 0, pendingCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('all');

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
                setStats(data.data.stats);
            } else {
                setError(data.error || 'Failed to load donations');
            }
        } catch {
            setError('An error occurred while loading your donations');
        } finally {
            setLoading(false);
        }
    };

    const filteredDonations = donations.filter(d => {
        if (activeTab === 'completed') return d.status === 'completed';
        if (activeTab === 'pending')   return d.status === 'pending' || d.status === 'processing';
        return true;
    });

    const tabs: { key: Tab; label: string }[] = [
        { key: 'all',       label: `All (${donations.length})` },
        { key: 'completed', label: `Completed (${stats.completedCount})` },
        { key: 'pending',   label: `Pending (${stats.pendingCount})` },
    ];

    const statCards = [
        {
            label: 'Total Donated',
            value: `₱${stats.totalDonated.toLocaleString()}`,
            sub: 'Lifetime contributions',
            subColor: 'text-emerald-500',
            icon: Heart,
            iconBg: 'bg-red-50',
            iconColor: 'text-red-500',
        },
        {
            label: 'Donations Made',
            value: stats.donationCount,
            sub: 'All time',
            subColor: 'text-gray-400',
            icon: HandCoins,
            iconBg: 'bg-purple-50',
            iconColor: 'text-purple-500',
        },
        {
            label: 'Completed',
            value: stats.completedCount,
            sub: 'Successful payments',
            subColor: 'text-green-500',
            icon: CheckCircle2,
            iconBg: 'bg-green-50',
            iconColor: 'text-green-500',
        },
        {
            label: 'Pending',
            value: stats.pendingCount,
            sub: 'Awaiting payment',
            subColor: 'text-amber-500',
            icon: Clock,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-500',
        },
        {
            label: 'Avg. Donation',
            value: stats.completedCount > 0
                ? `₱${Math.round(stats.totalDonated / stats.completedCount).toLocaleString()}`
                : '₱0',
            sub: 'Per completed donation',
            subColor: 'text-blue-500',
            icon: DollarSign,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-500',
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
                            Welcome, {session?.user?.name?.split(' ')[0] || 'Donor'}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Track your donations and impact</p>
                    </div>
                    <Link href="/donation">
                        <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 shadow-sm">
                            <Plus size={16} />
                            New Donation
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

                {/* Donations Panel */}
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

                    {/* Donation List */}
                    <div className="divide-y divide-gray-50">
                        {filteredDonations.length === 0 ? (
                            <div className="py-16 text-center">
                                <Heart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">No donations found</p>
                                {activeTab === 'all' && (
                                    <Link href="/donation">
                                        <Button variant="outline" className="mt-4 text-sm border-red-200 text-red-600 hover:bg-red-50">
                                            <Plus size={14} className="mr-1.5" /> Make your first donation
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            filteredDonations.map((donation) => {
                                const statusBadge = statusConfig[donation.status] ?? statusConfig.pending;
                                const date = new Date(donation.paid_at || donation.created_at).toLocaleDateString('en-US', {
                                    month: '2-digit', day: '2-digit', year: 'numeric',
                                });

                                return (
                                    <div key={donation.id} className="flex items-center justify-between px-6 py-5 hover:bg-gray-50/60 transition-colors">
                                        <div className="space-y-1.5 min-w-0 flex-1 pr-6">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {donation.pool
                                                        ? donation.pool.name
                                                        : donation.donation_type === 'unrestricted'
                                                        ? 'General Fund'
                                                        : 'Donation'}
                                                </span>
                                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusBadge.className}`}>
                                                    {statusBadge.label}
                                                </span>
                                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                                    donation.donation_type === 'restricted'
                                                        ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                }`}>
                                                    {donation.donation_type}
                                                </span>
                                                {donation.is_anonymous && (
                                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
                                                        anonymous
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                <span>{date}</span>
                                                <span className="mx-1">•</span>
                                                <span className="font-mono">{donation.reference_code}</span>
                                                {donation.payment_method && (
                                                    <>
                                                        <span className="mx-1">•</span>
                                                        <span className="capitalize">{donation.payment_method.replace('_', ' ')}</span>
                                                    </>
                                                )}
                                            </p>
                                            {donation.message && (
                                                <p className="text-xs text-gray-400 italic truncate max-w-sm">
                                                    &ldquo;{donation.message}&rdquo;
                                                </p>
                                            )}
                                        </div>
                                        <div className="shrink-0">
                                            <p className="text-base font-bold text-gray-900">
                                                ₱{donation.amount.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer summary */}
                    {filteredDonations.length > 0 && (
                        <div className="px-6 py-3 border-t bg-gray-50/50 flex justify-between items-center">
                            <span className="text-xs text-gray-400">
                                {filteredDonations.length} record{filteredDonations.length !== 1 ? 's' : ''}
                            </span>
                            <span className="text-sm font-bold text-gray-700">
                                ₱{filteredDonations.reduce((s, d) => s + d.amount, 0).toLocaleString()} total
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}