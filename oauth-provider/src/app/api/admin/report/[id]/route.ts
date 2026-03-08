import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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

const fmt = (n: number) =>
    `PHP ${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession(req);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const format = searchParams.get("format");

        const report = await prisma.generatedReport.findUnique({ where: { id } });
        if (!report) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        // JSON response
        if (format !== "pdf") {
            return NextResponse.json({ report });
        }

        // --- PDF Generation ---
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let y = margin;

        // Header
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("Puso Ng Ama Foundation Inc.", margin, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("System Generated Report", margin, y);
        y += 6;

        // Divider
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

        // Report period
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        const startLabel = new Date(report.start_date).getTime() === 0
            ? "Initial"
            : new Date(report.start_date).toLocaleDateString();
        const endLabel = new Date(report.end_date).toLocaleDateString();
        doc.text(`Report Period: ${startLabel} — ${endLabel}`, margin, y);
        y += 6;

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated: ${new Date(report.created_at).toLocaleString()}`, margin, y);
        y += 10;

        // Summary section
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Summary", margin, y);
        y += 7;

        const summary = report.summary as ReportSummary | null;

        const summaryData = [
            ["New Beneficiary Requests", String(report.total_beneficiary_requests)],
            ["Donations Received", `${summary?.donations_count ?? 0} (${fmt(summary?.donations_amount ?? 0)})`],
            ["Disbursements Made", `${summary?.disbursed_count ?? 0} (${fmt(summary?.disbursed_amount ?? 0)})`],
        ];

        if (summary?.requests_by_status) {
            const statusStr = Object.entries(summary.requests_by_status)
                .map(([s, c]) => `${s.replace("_", " ")}: ${c}`)
                .join(", ");
            summaryData.push(["Requests by Status", statusStr]);
        }

        autoTable(doc, {
            startY: y,
            head: [["Metric", "Value"]],
            body: summaryData,
            margin: { left: margin, right: margin },
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: "bold" },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            theme: "grid",
        });

        y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 40;
        y += 10;

        // Pool Statistics
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Pool Statistics", margin, y);
        y += 7;

        const poolStats = (report.pool_statistics as unknown as PoolStat[]) ?? [];

        if (poolStats.length > 0) {
            const poolBody = poolStats.map((p) => [
                p.pool_name,
                fmt(p.previous_amount ?? 0),
                fmt(p.current_amount ?? 0),
                `${p.difference >= 0 ? "+" : "-"}${fmt(p.difference)}`,
                fmt(p.allocated_amount ?? 0),
                fmt(p.total_remaining ?? 0),
            ]);

            autoTable(doc, {
                startY: y,
                head: [["Pool", "Previous", "Current", "Change", "Allocated", "Remaining"]],
                body: poolBody,
                margin: { left: margin, right: margin },
                styles: { fontSize: 8, cellPadding: 3 },
                headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [250, 250, 250] },
                theme: "grid",
                columnStyles: {
                    0: { cellWidth: 35 },
                },
            });
        } else {
            doc.setFontSize(9);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(150, 150, 150);
            doc.text("No pool statistics available for this period.", margin, y);
        }

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(150, 150, 150);
            const footerY = doc.internal.pageSize.getHeight() - 10;
            doc.text(
                `Page ${i} of ${pageCount} • Puso Ng Ama Foundation Inc. • Confidential`,
                pageWidth / 2,
                footerY,
                { align: "center" }
            );
        }

        const pdfBuffer = doc.output("arraybuffer");

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="report-${startLabel}-${endLabel}.pdf"`,
            },
        });
    } catch (error) {
        console.error("Report PDF error:", error);
        return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession(req);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await prisma.generatedReport.delete({ where: { id } });

        return NextResponse.json({ message: "Report deleted" });
    } catch (error) {
        console.error("Delete report error:", error);
        return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
    }
}