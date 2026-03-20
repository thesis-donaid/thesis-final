'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
    ShieldCheck, 
    Search, 
    ExternalLink, 
    FileText, 
    CheckCircle2, 
    Clock, 
    Loader2, 
    ArrowLeft,
    Box
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

export default function AdminLedgerPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (authStatus === 'unauthenticated' || (session && session.user.role !== 'admin')) {
            router.push('/login');
            return;
        }

        if (authStatus === 'authenticated') {
            fetchLedger();
        }
    }, [authStatus, router, session]);

    const fetchLedger = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/ledger');
            if (!res.ok) throw new Error('Failed to fetch');
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
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto" />
                    <p className="mt-4 text-sm text-gray-500">Loading blockchain records...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 pt-28 pb-20 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Back Button & Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors mb-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Admin Dashboard
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="bg-red-50 p-2 rounded-xl">
                                <ShieldCheck className="w-8 h-8 text-red-600" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                                Transparency Ledger
                            </h2>
                        </div>
                        <p className="text-gray-500 mt-2">
                            Immutable database of all blockchain-anchored donation proofs and disbursements.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-white p-2 border border-gray-100 rounded-2xl shadow-sm pr-4">
                        <div className="bg-green-50 p-2 rounded-xl text-green-600">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Sync Status</p>
                            <p className="text-sm font-semibold text-gray-900">Blockchain Synced</p>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 sm:grid-cols-2 grid-cols-1">
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Proofs</p>
                            <ShieldCheck className="h-5 w-5 text-red-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{entries.length}</p>
                        <p className="text-xs text-gray-500 mt-1 italic">Publicly verifiable records</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Network</p>
                            <Box className="h-5 w-5 text-blue-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900 capitalize">
                            {entries.length > 0 ? entries[0].network : 'Polygon'}
                        </p>
                        <p className="text-xs text-blue-600 mt-1 font-medium underline">Mainnet / Testnet</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Recorded</p>
                            <Clock className="h-5 w-5 text-amber-500" />
                        </div>
                        <p className="text-xl font-bold text-gray-900 truncate">
                            {entries.length > 0 ? format(new Date(entries[0].recordedAt), 'MMM dd, HH:mm') : 'None'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Latest block timestamp</p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-200 border-dashed flex flex-col items-center justify-center text-center">
                        <p className="text-xs font-medium text-gray-400">Public Explorer Access</p>
                        <span className="text-[10px] text-gray-400 mt-1">Verified via Smart Contract</span>
                    </div>
                </div>

                {/* Table & Controls Section */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search tx hash, beneficiary..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 transition-all"
                            />
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={fetchLedger}
                                className="text-xs h-9 rounded-lg border-gray-200 hover:bg-gray-100"
                            >
                                <Clock className="w-3.5 h-3.5 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto scbar-none">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-500 font-bold border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Transaction / Block</th>
                                    <th className="px-6 py-4">Allocation Detail</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4 text-right">Verification</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-gray-700">
                                {filteredEntries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50/70 transition-colors group">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-gray-900 font-bold text-xs bg-gray-100 px-2 py-1 rounded-lg border border-gray-200 group-hover:bg-red-50 group-hover:text-red-700 group-hover:border-red-100 transition-colors">
                                                        {truncateHash(entry.txHash)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date(entry.recordedAt), 'MMM dd, yyyy • hh:mm a')}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-gray-900">{entry.beneficiaryName}</div>
                                            <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]" title={entry.purpose}>
                                                {entry.purpose}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="text-base font-black text-gray-900">₱{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
                                                {entry.sourceType}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2.5">
                                                {entry.proofUrl && (
                                                    <a 
                                                        href={entry.proofUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors shadow-sm cursor-pointer"
                                                        title="View Receipt Document"
                                                    >
                                                        <FileText size={16} />
                                                    </a>
                                                )}
                                                {entry.explorerUrl ? (
                                                    <a 
                                                        href={entry.explorerUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-900 border border-transparent hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-all shadow-sm"
                                                    >
                                                        Explorer <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                ) : (
                                                    <span className="text-[11px] font-bold text-amber-500 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                                                        Processing...
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredEntries.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center text-gray-500">
                                            <div className="max-w-xs mx-auto">
                                                <Box className="mx-auto h-12 w-12 text-gray-200 mb-4" />
                                                <p className="text-base font-bold text-gray-900">No blockchain transaction found</p>
                                                <p className="text-sm text-gray-400 mt-1">Disbursements were not yet recorded on the blockchain network.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                        <p className="text-[11px] text-gray-400">
                            Verified through Decentralized Smart Contract Ledger — Immutability Guaranteed
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
