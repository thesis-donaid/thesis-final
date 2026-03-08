"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { RefreshCw, FileText, ArrowUpRight, ArrowDownRight, Minus, CalendarDays, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PoolStat {
    pool_id: string;
    pool_name: string;
    previous_amount: number;
    current_amount: number;
    allocated_amount: number;
    total_remaining: number;
    difference: number;
}

interface ReportSummary {
    donations_count: number;
    donations_amount: number;
    disbursed_count: number;
    disbursed_amount: number;
    requests_by_status: Record<string, number>;
}

interface Report {
    id: string;
    start_date: string;
    end_date: string;
    total_beneficiary_requests: number;
    pool_statistics: PoolStat[];
    summary: ReportSummary | null;
    generated_by: string;
    created_at: string;
}

const fmt = (n: number) =>
    `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusColors: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-600 border-amber-100",
    UNDER_REVIEW: "bg-blue-50 text-blue-600 border-blue-100",
    APPROVED: "bg-green-50 text-green-600 border-green-100",
    REJECTED: "bg-red-50 text-red-600 border-red-100",
    DISBURSED: "bg-gray-50 text-gray-600 border-gray-100",
};

export default function ReportPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await fetch("/api/admin/report");
            if (!res.ok) throw new Error("Failed to fetch reports");
            const data = await res.json();
            setReports(data.reports);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = async () => {
        setGenerating(true);
        try {
            const res = await fetch("/api/admin/report", {
                method: "POST",
            });
            if (!res.ok) throw new Error("Failed to generate report");
            const data = await res.json();
            toast.success("Report generated successfully!");
            setReports([data.report, ...reports]);
            setExpandedId(data.report.id);
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate report");
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadPdf = async (reportId: string) => {
        setDownloadingId(reportId);
        try {
            const res = await fetch(`/api/admin/report/${reportId}?format=pdf`);
            if (!res.ok) throw new Error("Failed to download PDF");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `report-${reportId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            toast.error("Failed to download PDF");
        } finally {
            setDownloadingId(null);
        }
    };

    const formatDateRange = (report: Report) => {
        const start = new Date(report.start_date).getTime() === 0
            ? "Initial"
            : new Date(report.start_date).toLocaleDateString();
        const end = new Date(report.end_date).toLocaleDateString();
        return `${start} — ${end}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">System Reports</h1>
                        <p className="text-sm text-gray-500 mt-1">Generate and view financial snapshots across periods</p>
                    </div>
                    <Button
                        onClick={handleGenerateReport}
                        disabled={generating}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {generating ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <FileText className="w-4 h-4 mr-2" />
                                Generate Report
                            </>
                        )}
                    </Button>
                </div>

                {/* Reports */}
                {reports.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900">No reports yet</h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                            Click &quot;Generate Report&quot; to create your first system snapshot.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reports.map((report) => {
                            const isExpanded = expandedId === report.id;
                            return (
                                <div key={report.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                    {/* Report Header — clickable */}
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : report.id)}
                                        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-red-50 p-2 rounded-lg">
                                                <CalendarDays className="w-5 h-5 text-red-500" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{formatDateRange(report)}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Generated {new Date(report.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-xs text-gray-500">Requests</p>
                                                <p className="text-lg font-bold text-gray-900">{report.total_beneficiary_requests}</p>
                                            </div>
                                            <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="border-t border-gray-100">
                                            {/* Actions bar */}
                                            <div className="flex justify-end px-5 pt-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownloadPdf(report.id)}
                                                    disabled={downloadingId === report.id}
                                                    className="text-gray-600 hover:text-gray-900"
                                                >
                                                    {downloadingId === report.id ? (
                                                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                                    ) : (
                                                        <Download className="w-4 h-4 mr-2" />
                                                    )}
                                                    Download PDF
                                                </Button>
                                            </div>

                                            {/* Summary Stats */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5">
                                                <SummaryCard
                                                    label="New Requests"
                                                    value={String(report.total_beneficiary_requests)}
                                                />
                                                <SummaryCard
                                                    label="Donations"
                                                    value={String(report.summary?.donations_count ?? 0)}
                                                    sub={fmt(report.summary?.donations_amount ?? 0)}
                                                />
                                                <SummaryCard
                                                    label="Disbursed"
                                                    value={String(report.summary?.disbursed_count ?? 0)}
                                                    sub={fmt(report.summary?.disbursed_amount ?? 0)}
                                                />
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <p className="text-xs text-gray-500 mb-2">Requests by Status</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {report.summary?.requests_by_status && Object.entries(report.summary.requests_by_status).length > 0 ? (
                                                            Object.entries(report.summary.requests_by_status).map(([status, count]) => (
                                                                <span key={status} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-semibold border ${statusColors[status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                                                                    {status.replace("_", " ")}: {count}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">None</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Pool Statistics Table */}
                                            <div className="border-t border-gray-100 overflow-x-auto">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                                        <tr>
                                                            <th className="px-5 py-3 font-medium">Pool</th>
                                                            <th className="px-5 py-3 font-medium">Previous</th>
                                                            <th className="px-5 py-3 font-medium">Current</th>
                                                            <th className="px-5 py-3 font-medium">Change</th>
                                                            <th className="px-5 py-3 font-medium">Allocated</th>
                                                            <th className="px-5 py-3 font-medium">Remaining</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {report.pool_statistics.length > 0 ? report.pool_statistics.map((stat, i) => (
                                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                                <td className="px-5 py-3 font-medium text-gray-900">{stat.pool_name}</td>
                                                                <td className="px-5 py-3 text-gray-500">{fmt(stat.previous_amount ?? 0)}</td>
                                                                <td className="px-5 py-3 text-gray-900">{fmt(stat.current_amount ?? 0)}</td>
                                                                <td className="px-5 py-3">
                                                                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                                                        stat.difference > 0
                                                                            ? "text-emerald-600"
                                                                            : stat.difference < 0
                                                                            ? "text-red-600"
                                                                            : "text-gray-400"
                                                                    }`}>
                                                                        {stat.difference > 0 ? (
                                                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                                                        ) : stat.difference < 0 ? (
                                                                            <ArrowDownRight className="w-3.5 h-3.5" />
                                                                        ) : (
                                                                            <Minus className="w-3.5 h-3.5" />
                                                                        )}
                                                                        {fmt(Math.abs(stat.difference))}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-3 text-gray-500">{fmt(stat.allocated_amount ?? 0)}</td>
                                                                <td className="px-5 py-3 font-semibold text-gray-900">{fmt(stat.total_remaining ?? 0)}</td>
                                                            </tr>
                                                        )) : (
                                                            <tr>
                                                                <td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">
                                                                    No pool statistics available
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
    );
}

