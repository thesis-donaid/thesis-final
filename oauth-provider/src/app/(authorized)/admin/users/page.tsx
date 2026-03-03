'use client'

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    ShieldCheck,
    Heart,
    UserCheck,
    UserX,
    ArrowLeft,
    Search,
    Plus,
    XCircle,
    Eye,
    EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

type Tab = 'beneficiaries' | 'admins' | 'registered' | 'guest';

interface Admin {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    created_at: string;
}

interface Beneficiary {
    id: number;
    username: string;
    type: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    isActive: boolean;
    created_at: string;
    user: { email: string | null; name: string | null; created_at: string };
}

interface RegisteredDonor {
    id: number;
    name: string | null;
    phone: string | null;
    donation_count: number;
    total_donated: number;
    created_at: string;
    user: { email: string | null; name: string | null; created_at: string };
}

interface GuestDonor {
    id: number;
    email: string;
    donation_count: number;
    total_donated: number;
    first_donation_date: string | null;
    last_donation_date: string | null;
    created_at: string;
}

interface Counts {
    admins: number;
    beneficiaries: number;
    registeredDonors: number;
    guestDonors: number;
}

export default function AdminUsersPage() {
    const { data: session, status: authStatus } = useSession();
    const [activeTab, setActiveTab] = useState<Tab>('beneficiaries');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const [admins, setAdmins] = useState<Admin[]>([]);
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [registeredDonors, setRegisteredDonors] = useState<RegisteredDonor[]>([]);
    const [guestDonors, setGuestDonors] = useState<GuestDonor[]>([]);
    const [counts, setCounts] = useState<Counts>({ admins: 0, beneficiaries: 0, registeredDonors: 0, guestDonors: 0 });

    // Create modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        type: 'SCHOLAR' as 'SCHOLAR' | 'EMPLOYEE' | 'COMMUNITY',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
    });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/users');
            if (!res.ok) throw new Error('Fetch failed');
            const data = await res.json();

            setAdmins(data.admins);
            setBeneficiaries(data.beneficiaries);
            setRegisteredDonors(data.registeredDonors);
            setGuestDonors(data.guestDonors);
            setCounts(data.counts);
        } catch {
            setError('Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authStatus !== 'authenticated' || session?.user?.role !== 'admin') {
            if (authStatus !== 'loading') setLoading(false);
            return;
        }
        fetchUsers();
    }, [authStatus, session]);

    const resetForm = () => {
        setFormData({ username: '', password: '', type: 'SCHOLAR', firstName: '', lastName: '', email: '', phone: '', address: '' });
        setFormError('');
        setShowPassword(false);
    };

    const handleCreateBeneficiary = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/admin/register/beneficiary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                setFormError(data.error || 'Failed to create beneficiary.');
                return;
            }

            // Success — close modal, refresh list
            setIsModalOpen(false);
            resetForm();
            fetchUsers();
        } catch {
            setFormError('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const tabs: { key: Tab; label: string; count: number; icon: React.ElementType; iconColor: string }[] = [
        { key: 'beneficiaries', label: 'Beneficiaries', count: counts.beneficiaries, icon: Heart, iconColor: 'text-red-500' },
        { key: 'admins', label: 'Admins', count: counts.admins, icon: ShieldCheck, iconColor: 'text-blue-500' },
        { key: 'registered', label: 'Registered Donors', count: counts.registeredDonors, icon: UserCheck, iconColor: 'text-green-500' },
        { key: 'guest', label: 'Guest Donors', count: counts.guestDonors, icon: UserX, iconColor: 'text-gray-500' },
    ];

    // Filter helpers
    const q = search.toLowerCase();

    const filteredBeneficiaries = beneficiaries.filter(b =>
        (b.firstName?.toLowerCase().includes(q) || b.lastName?.toLowerCase().includes(q) || b.username.toLowerCase().includes(q) || b.email?.toLowerCase().includes(q))
    );
    const filteredAdmins = admins.filter(a =>
        (a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q))
    );
    const filteredRegistered = registeredDonors.filter(r =>
        (r.name?.toLowerCase().includes(q) || r.user.email?.toLowerCase().includes(q))
    );
    const filteredGuest = guestDonors.filter(g =>
        g.email.toLowerCase().includes(q)
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 mb-2 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            View all users across the platform ({counts.admins + counts.beneficiaries + counts.registeredDonors + counts.guestDonors} total)
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{error}</div>
                )}

                <div className='flex items-center justify-between'>
                    {/* Search */}
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            className="pl-9 h-10 rounded-lg border-gray-200 bg-white text-sm"
                        />
                    </div>

                    <div>
                        <Button onClick={() => setIsModalOpen(true)} className='text-white bg-red-500 hover:bg-red-600'>
                            <Plus className='text-white w-4 h-4 mr-1'/>
                            Create Beneficiary
                        </Button>
                    </div>
                </div>



                {/* Main Panel */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
                                    activeTab === tab.key ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.key ? 'text-red-500' : tab.iconColor}`} />
                                {tab.label}
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    activeTab === tab.key ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {tab.count}
                                </span>
                                {activeTab === tab.key && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Table Content */}
                    <div className="overflow-x-auto">

                        {/* BENEFICIARIES TABLE */}
                        {activeTab === 'beneficiaries' && (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50/80 text-left text-xs text-gray-500 uppercase tracking-wider">
                                        <th className="px-6 py-3 font-medium">Name</th>
                                        <th className="px-6 py-3 font-medium">Username</th>
                                        <th className="px-6 py-3 font-medium">Type</th>
                                        <th className="px-6 py-3 font-medium">Email</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                        <th className="px-6 py-3 font-medium">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredBeneficiaries.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-12 text-gray-400">No beneficiaries found</td></tr>
                                    ) : filteredBeneficiaries.map((b) => (
                                        <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {b.firstName || b.lastName
                                                    ? `${b.firstName ?? ''} ${b.lastName ?? ''}`.trim()
                                                    : <span className="text-gray-400 italic">No name</span>}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 font-mono text-xs">{b.username}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                                                    {b.type.toLowerCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{b.email || b.user.email || '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                    b.isActive
                                                        ? 'bg-green-50 text-green-600 border border-green-100'
                                                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                                                }`}>
                                                    {b.isActive ? 'active' : 'inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(b.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* ADMINS TABLE */}
                        {activeTab === 'admins' && (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50/80 text-left text-xs text-gray-500 uppercase tracking-wider">
                                        <th className="px-6 py-3 font-medium">Name</th>
                                        <th className="px-6 py-3 font-medium">Email</th>
                                        <th className="px-6 py-3 font-medium">Role</th>
                                        <th className="px-6 py-3 font-medium">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredAdmins.length === 0 ? (
                                        <tr><td colSpan={4} className="text-center py-12 text-gray-400">No admins found</td></tr>
                                    ) : filteredAdmins.map((a) => (
                                        <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{a.name || <span className="text-gray-400 italic">No name</span>}</td>
                                            <td className="px-6 py-4 text-gray-600">{a.email || '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                                    admin
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(a.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* REGISTERED DONORS TABLE */}
                        {activeTab === 'registered' && (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50/80 text-left text-xs text-gray-500 uppercase tracking-wider">
                                        <th className="px-6 py-3 font-medium">Name</th>
                                        <th className="px-6 py-3 font-medium">Email</th>
                                        <th className="px-6 py-3 font-medium">Donations</th>
                                        <th className="px-6 py-3 font-medium">Total Donated</th>
                                        <th className="px-6 py-3 font-medium">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredRegistered.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-12 text-gray-400">No registered donors found</td></tr>
                                    ) : filteredRegistered.map((r) => (
                                        <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{r.name || r.user.name || <span className="text-gray-400 italic">No name</span>}</td>
                                            <td className="px-6 py-4 text-gray-600">{r.user.email || '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
                                                    {r.donation_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">₱{r.total_donated.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(r.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* GUEST DONORS TABLE */}
                        {activeTab === 'guest' && (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50/80 text-left text-xs text-gray-500 uppercase tracking-wider">
                                        <th className="px-6 py-3 font-medium">Email</th>
                                        <th className="px-6 py-3 font-medium">Donations</th>
                                        <th className="px-6 py-3 font-medium">Total Donated</th>
                                        <th className="px-6 py-3 font-medium">First Donation</th>
                                        <th className="px-6 py-3 font-medium">Last Donation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredGuest.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-12 text-gray-400">No guest donors found</td></tr>
                                    ) : filteredGuest.map((g) => (
                                        <tr key={g.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{g.email}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                                    {g.donation_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">₱{g.total_donated.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-gray-500 text-xs">{g.first_donation_date ? formatDate(g.first_donation_date) : '—'}</td>
                                            <td className="px-6 py-4 text-gray-500 text-xs">{g.last_donation_date ? formatDate(g.last_donation_date) : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Beneficiary Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); resetForm(); }} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b bg-red-600 text-white flex justify-between items-center sticky top-0 z-10">
                            <h3 className="text-lg font-bold">Create Beneficiary Account</h3>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-white/70 hover:text-white transition-colors">
                                <XCircle size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateBeneficiary} className="p-6 space-y-4">
                            {formError && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2">
                                    <XCircle size={16} /> {formError}
                                </div>
                            )}

                            {/* Username & Password */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Username <span className="text-red-500">*</span></label>
                                    <Input
                                        required
                                        placeholder="e.g., juan.delacruz"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Input
                                            required
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Min 6 characters"
                                            minLength={6}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Beneficiary Type */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Beneficiary Type <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['SCHOLAR', 'EMPLOYEE', 'COMMUNITY'] as const).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: t })}
                                            className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                                                formData.type === t
                                                    ? 'bg-red-50 border-red-300 text-red-700'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                        >
                                            {t.charAt(0) + t.slice(1).toLowerCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Name */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">First Name</label>
                                    <Input
                                        placeholder="Juan"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Last Name</label>
                                    <Input
                                        placeholder="Dela Cruz"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Email</label>
                                    <Input
                                        type="email"
                                        placeholder="juan@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Phone</label>
                                    <Input
                                        placeholder="09123456789"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Address</label>
                                <Input
                                    placeholder="Full address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            {/* Actions */}
                            <div className="pt-4 flex gap-3 border-t">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating...' : 'Create Beneficiary'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}