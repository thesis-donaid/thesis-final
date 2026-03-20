import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const requestId = parseInt(id);

        // 1. Fetch Request Details
        const request = await prisma.beneficiaryRequest.findUnique({
            where: { id: requestId },
            include: {
                beneficiary: {
                    select: {
                        firstName: true,
                        lastName: true,
                        type: true,
                    }
                }
            }
        });

        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        // 2. Fetch Donor's specific contributions to this request
        const registeredDonor = await prisma.registeredDonor.findUnique({
            where: { userId: session.user.id }
        });

        if (!registeredDonor) {
            return NextResponse.json({ error: "Donor profile not found" }, { status: 404 });
        }

        const donationAllocations = await prisma.donationAllocation.findMany({
            where: {
                allocation: { requestId },
                donation: { registered_donor_id: registeredDonor.id }
            },
            include: {
                donation: true
            }
        });

        if (donationAllocations.length === 0) {
            return NextResponse.json({ error: "No contributions found for this request" }, { status: 404 });
        }

        const totalContributed = donationAllocations.reduce((sum, da) => sum + da.amount_used, 0);
        const beneficiaryName = `${request.beneficiary.firstName} ${request.beneficiary.lastName}`.trim();

        // Helper for formatting dates to matching user's request (Mar 16, 2026, 01:04 PM)
        const formatDt = (d: Date | null) => {
            if (!d) return "N/A";
            return d.toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        };

        const formatDOnly = (d: Date | null) => {
            if (!d) return "N/A";
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
            });
        };

        // --- PDF Generation ---
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let y = 25;

        // Foundation Header
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(220, 38, 38); // Red-600
        doc.text("Puso Ng Ama Foundation Inc.", margin, y);
        y += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("A Non-Profit Organization Committed to Spreading Hope", margin, y);
        y += 15;

        // Divider
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 12;

        // Receipt Title
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("DONATION IMPACT RECEIPT", pageWidth / 2, y, { align: "center" });
        y += 15;

        // Receipt Details Table
        const receiptData = [
            ["Receipt Date", formatDOnly(new Date())],
            ["Donor Name", session.user.name || "Valued Donor"],
            ["Purpose", request.purpose],
            ["Beneficiary", beneficiaryName],
            ["Type", (request.beneficiary.type || "N/A").toUpperCase()],
            ["Your Contribution", `PHP ${totalContributed.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
            ["Date Needed", formatDOnly(request.date_needed)],
            ["Requested", formatDt(request.created_at)],
            ["Reviewed", formatDt(request.reviewed_at)],
            ["Disbursed", formatDt(request.disbursed_at)],
            ["Disbursed Amount", request.disbursed_amount ? `PHP ${request.disbursed_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "N/A"],
        ];

        autoTable(doc, {
            startY: y,
            body: receiptData,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 3.5 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40, textColor: [100, 100, 100] } },
            margin: { left: margin, right: margin }
        });

        y = (doc as any).lastAutoTable.finalY + 20;

        // Description / Message
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        const text = `This receipt acknowledges your generous contribution towards "${request.purpose}". Your support has directly impacted the life of ${beneficiaryName} and their family. Through the Puso Ng Ama Foundation, we ensure that every peso is handled with transparency and reaches those in need.`;
        const splitText = doc.splitTextToSize(text, pageWidth - (margin * 2));
        doc.text(splitText, margin, y);
        y += (splitText.length * 7) + 10;

        // Blockchain Proofs
        const proofs = donationAllocations.filter(da => da.blockchain_tx_hash).map(da => [
            da.donation.reference_code,
            da.blockchain_tx_hash?.slice(0, 20) + "..."
        ]);

        if (proofs.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text("Blockchain Verification Records", margin, y);
            y += 7;
            autoTable(doc, {
                startY: y,
                head: [["Ref Code", "Transaction Hash"]],
                body: proofs,
                theme: 'grid',
                styles: { fontSize: 9, font: 'courier' },
                headStyles: { fillColor: [240, 240, 240], textColor: 50, fontStyle: 'bold' },
                margin: { left: margin, right: margin }
            });
            y = (doc as any).lastAutoTable.finalY + 15;
        }

        // Thank you note
        doc.setFont("helvetica", "italic");
        doc.setFontSize(12);
        doc.setTextColor(220, 38, 38);
        doc.text("Thank you for your kindness!", pageWidth / 2, y, { align: "center" });
        y += 25;


        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(180, 180, 180);
            const footerY = doc.internal.pageSize.getHeight() - 10;
            
            // Left: Document info
            doc.text(
                `System-generated document • Page ${i} of ${pageCount}`,
                margin,
                footerY
            );

            // Right: Platform branding
            doc.setFont("helvetica", "bold");
            doc.text(
                "POWERED BY DONAID",
                pageWidth - margin,
                footerY,
                { align: "right" }
            );
        }

        const pdfBuffer = doc.output("arraybuffer");

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Donation_Receipt_${id}.pdf"`,
            },
        });

    } catch (error) {
        console.error("Receipt generation error:", error);
        return NextResponse.json({ error: "Failed to generate receipt" }, { status: 500 });
    }
}
