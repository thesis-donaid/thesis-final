import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { sendReceiptNotificationEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

type RouteParams = { params: Promise<{ id: string }> };

// POST — Beneficiary submits receipt/proof/liquidation + message
export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const requestId = parseInt(id);
        const session = await getSession(req);

        if (!session || session.user.role !== "beneficiary") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify request exists, belongs to user, and is DISBURSED
        const request = await prisma.beneficiaryRequest.findUnique({
            where: { id: requestId },
            include: {
                beneficiary: {
                    include: { user: true },
                },
                allocations: {
                    include: {
                        donationAllocations: {
                            include: { donation: true },
                        },
                    },
                },
            },
        });

        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        if (request.beneficiary.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (request.status !== "DISBURSED") {
            return NextResponse.json(
                { error: "Receipt can only be submitted for disbursed requests" },
                { status: 400 }
            );
        }

        const formData = await req.formData();
        const message = formData.get("message") as string | null;
        const files = formData.getAll("files") as File[];

        // At least message or files must be provided
        if ((!files || files.length === 0) && !message?.trim()) {
            return NextResponse.json(
                { error: "Please provide at least a message or receipt files" },
                { status: 400 }
            );
        }

        // Validate files
        const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
        const MAX_FILES = 10;

        if (files.length > MAX_FILES) {
            return NextResponse.json(
                { error: `Too many files. Maximum ${MAX_FILES} files per upload` },
                { status: 400 }
            );
        }

        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    { error: `Invalid file type: ${file.name}. Allowed: PNG, JPG, PDF` },
                    { status: 400 }
                );
            }
            if (file.size > 10 * 1024 * 1024) {
                return NextResponse.json(
                    { error: `File too large: ${file.name}. Max 10MB` },
                    { status: 400 }
                );
            }
        }

        // Upload receipt files
        const uploadedReceipts = [];
        for (const file of files) {
            let fileUrl: string;

            if (process.env.BLOB_READ_WRITE_TOKEN) {
                const blob = await put(`receipts/${id}/${file.name}`, file, {
                    access: "public",
                });
                fileUrl = blob.url;
            } else {
                const uploadDir = path.join(process.cwd(), "public", "uploads", "receipts", id);
                await mkdir(uploadDir, { recursive: true });

                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);
                const fileName = `${Date.now()}-${file.name}`;
                const filePath = path.join(uploadDir, fileName);
                await writeFile(filePath, buffer);

                fileUrl = `/uploads/receipts/${id}/${fileName}`;
            }

            const receipt = await prisma.disbursementReceipt.create({
                data: {
                    requestId,
                    file_name: file.name,
                    file_url: fileUrl,
                    file_type: file.type,
                    file_size: file.size,
                },
            });

            uploadedReceipts.push(receipt);
        }

        // Save the beneficiary's message
        if (message?.trim()) {
            await prisma.beneficiaryRequest.update({
                where: { id: requestId },
                data: {
                    receipt_message: message.trim(),
                    receipt_submitted_at: new Date(),
                },
            });
        } else if (uploadedReceipts.length > 0) {
            // Mark receipt as submitted even without a message
            await prisma.beneficiaryRequest.update({
                where: { id: requestId },
                data: {
                    receipt_submitted_at: new Date(),
                },
            });
        }

        // Notify donors via email
        const beneficiaryName =
            `${request.beneficiary.firstName ?? ""} ${request.beneficiary.lastName ?? ""}`.trim() ||
            request.beneficiary.user?.name ||
            "A Beneficiary";

        const notifiedEmails = new Set<string>();
        for (const allocation of request.allocations) {
            for (const da of allocation.donationAllocations) {
                const donorEmail = da.donation.email;
                if (donorEmail && !notifiedEmails.has(donorEmail)) {
                    notifiedEmails.add(donorEmail);
                    try {
                        await sendReceiptNotificationEmail({
                            to: donorEmail,
                            donorName: "Valued Donor",
                            beneficiaryName,
                            purpose: request.purpose,
                            amount: da.amount_used,
                            message: message?.trim() || null,
                            receiptUrls: uploadedReceipts.map((r) => r.file_url),
                        });
                    } catch (emailError) {
                        console.error(`Failed to send receipt email to ${donorEmail}:`, emailError);
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: "Receipt submitted successfully. Donors have been notified.",
            receipts: uploadedReceipts,
            donorsNotified: notifiedEmails.size,
        }, { status: 201 });
    } catch (error) {
        console.error("Receipt submission error:", error);
        return NextResponse.json(
            { error: "Failed to submit receipt" },
            { status: 500 }
        );
    }
}

// GET — Fetch receipts for a request
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const session = await getSession(req);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const requestId = parseInt(id);

        // Verify access — beneficiary (own) or admin
        if (session.user.role === "beneficiary") {
            const request = await prisma.beneficiaryRequest.findUnique({
                where: { id: requestId },
                include: { beneficiary: true },
            });
            if (!request || request.beneficiary.userId !== session.user.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        } else if (session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const receipts = await prisma.disbursementReceipt.findMany({
            where: { requestId },
            orderBy: { uploaded_at: "desc" },
        });

        const request = await prisma.beneficiaryRequest.findUnique({
            where: { id: requestId },
            select: {
                receipt_message: true,
                receipt_submitted_at: true,
            },
        });

        return NextResponse.json({
            receipts,
            message: request?.receipt_message ?? null,
            submittedAt: request?.receipt_submitted_at ?? null,
        });
    } catch (error) {
        console.error("Get receipts error:", error);
        return NextResponse.json(
            { error: "Failed to get receipts" },
            { status: 500 }
        );
    }
}
