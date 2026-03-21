'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Search, ExternalLink, FileText, Globe, Clock, Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { pusherClient } from '@/lib/pusher-client';

interface LedgerEntry {
    id: number;
    allocationId: number;
    requestId: number;
    beneficiaryName: string;
    amount: number;
    purpose: string;
    sourceType: string;
    txHash: string;
    network: string;
    explorerUrl: string;
    status: string;
    recordedAt: string;
    proofUrl: string;
    proofType: string;
    proofHash: string;
}

export default function DonorLedgerPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (authStatus === 'unauthenticated' || (session && session.user.role !== 'registered')) {
            router.push('/login');
            return;
        }

        if (authStatus === 'authenticated') {
            fetchLedger();

            if (session?.user?.id) {
                const channelName = `user-${session.user.id}`;
                const channel = pusherClient.subscribe(channelName);

                channel.bind("notification", () => {
                    fetchLedger();
                });

                return () => {
                    channel.unbind_all();
                    pusherClient.unsubscribe(channelName);
                };
            }
        }
    }, [authStatus, router, session]);

    const fetchLedger = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/ledger');
            const result = await res.json();
            if (result.success) {
                setEntries(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch ledger:', error);
        } finally {
            setLoading(false);
        }
    };

    const truncateHash = (hash: string) => {
        if (!hash) return '';
        return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
    };

    // Filter records
    const filteredEntries = entries.filter(entry => 
        entry.txHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.beneficiaryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.purpose.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (authStatus === 'loading' || loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-8 h-8 text-indigo-600" />
                            <h1 className="text-2xl font-bold text-gray-900">
                                Public Transparency Ledger
                            </h1>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                            Verify that donations reached their intended beneficiaries. Every closed request is cryptographically anchored to the Polygon blockchain, mathematically proving exactly what happened to the funds.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/donor">
                            <Button variant="outline" className="flex items-center gap-2 border-gray-200 text-gray-600 hover:bg-gray-50">
                                Back to Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-start justify-between">
                        <div className="space-y-1">
                            <p className="text-xs text-gray-500">Immutable Records</p>
                            <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
                            <p className="text-xs font-medium text-indigo-500">Proofs anchored on chain</p>
                        </div>
                        <div className="bg-indigo-50 p-2.5 rounded-xl">
                            <Globe className="w-5 h-5 text-indigo-600" />
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-start justify-between md:col-span-2">
                        <div className="space-y-1 w-full">
                            <p className="text-xs text-gray-500">How it works</p>
                            <p className="text-sm text-gray-700 mt-2">
                                When our organization disburses funds to a beneficiary, the receipt and transaction details are hashed and permanently recorded on the blockchain. Not even administrators can alter this data once it is recorded. You can click <strong>Explorer</strong> to independently verify the data on the Polygon network.
                            </p>
                        </div>
                        <div className="hidden sm:block ml-4 bg-amber-50 p-2.5 rounded-xl shrink-0">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                        </div>
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-gray-100 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search hash, purpose, or beneficiary..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100 text-[11px] uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Transaction Identity</th>
                                    <th className="px-6 py-4">Beneficiary & Purpose</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4 text-right">Verification Links</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-gray-700">
                                {filteredEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-indigo-700 font-medium bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100 text-xs">
                                                        {truncateHash(entry.txHash)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date(entry.recordedAt), 'MMM dd, yyyy • h:mm a')}
                                                    <span className="mx-1">•</span>    
                                                    <span className="capitalize">{entry.network}</span>                                                
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-semibold text-gray-900">{entry.beneficiaryName}</div>
                                            <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[250px]" title={entry.purpose}>
                                                {entry.purpose}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className="font-bold text-gray-900">₱{entry.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                            <div className="text-[11px] text-gray-500 mt-1 capitalize">{entry.sourceType.toLowerCase()} Fund</div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {entry.proofUrl && (
                                                    <a 
                                                        href={entry.proofUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-[11px] text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" />
                                                        View Receipt
                                                    </a>
                                                )}
                                                {entry.explorerUrl ? (
                                                    <a 
                                                        href={entry.explorerUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs bg-gray-900 hover:bg-gray-800 text-white px-3.5 py-2 rounded-full font-medium transition-transform active:scale-95"
                                                    >
                                                        Verify on Explorer <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-amber-500 bg-amber-50 px-3 py-1.5 rounded-full font-medium border border-amber-100">Pending</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredEntries.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-16 text-center text-gray-500">
                                            <ShieldCheck className="mx-auto h-12 w-12 text-gray-200 mb-4" />
                                            <p className="text-sm font-semibold text-gray-900">No blockchain records found</p>
                                            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">There are currently no disbursement proofs recorded on the blockchain, or your search didn't match any records.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
