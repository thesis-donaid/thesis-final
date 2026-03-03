import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, RequestStatus } from "../../../../../../generated/prisma/client";
import { del } from "@vercel/blob";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
    req: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const session = await getSession(req);

        const allowedRoles = ["admin", "beneficiary"];


        if(!session || !allowedRoles.includes(session.user.role)) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }
        
        const request = await prisma.beneficiaryRequest.findUnique({
            where: { id: parseInt(id) },
            include: {
                beneficiary: true,
                documents: true,
            },
        });

        if(!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 400 })
        }

        return NextResponse.json(request);
    } catch(error) {
        console.error("Get request error:", error);
        return NextResponse.json(
            { error: "Failed to get request" },
            { status: 500 }
        )
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const session = await getSession(req);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { status, rejection_reason, disbursed_amount } = body;
        
        const updateData: Prisma.BeneficiaryRequestUpdateInput = {
            status: status as RequestStatus,
            reviewed_by: session.user.id,
            reviewed_at: new Date(),
        };

        if (status === "REJECTED" && rejection_reason) {
            updateData.rejection_reason = rejection_reason;
        }

        if(status === "DISBURSED" && disbursed_amount) {
            updateData.disbursed_amount = parseFloat(disbursed_amount);
            updateData.disbursed_at = new Date();
        }

        const request = await prisma.beneficiaryRequest.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        return NextResponse.json(request);
    } catch(error) {
        console.error("Delete request error:", error);
        return NextResponse.json(
        { error: "Failed to delete request" },
        { status: 500 }
        );
    }
}


export async function DELETE(
    req: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const session = await getSession(req);

        console.log("under session");

        if(!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const request = await prisma.beneficiaryRequest.findUnique({
            where: { id: parseInt(id) },
            include: { 
                beneficiary: true,
                documents: true,  // Include documents to get blob URLs
            },
        });

        if(!request) {
            return NextResponse.json({ erro: "Request not found" }, { status: 404 });
        }

        // Only beneficiary can delete their own pending request
        if(
            session.user.role === "beneficiary" && 
            request.beneficiary.userId !== session.user.id
        ) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401})
        }

        if(request.status !== "PENDING") {
            return NextResponse.json(
                { error: "Can only cancel pending requests" },
                { status: 400 }
            );
        }

        // Delete blobs from Vercel Blob storage
        if (request.documents && request.documents.length > 0) {
            const blobUrls = request.documents
                .map(doc => doc.file_url)
                .filter(url => url.includes("blob.vercel-storage.com")); // Only Vercel blobs
            
            if (blobUrls.length > 0) {
                try {
                    await del(blobUrls);
                    console.log(`Deleted ${blobUrls.length} blob(s) from Vercel storage`);
                } catch (blobError) {
                    console.error("Failed to delete blobs:", blobError);
                    // Continue with database deletion even if blob deletion fails
                }
            }
        }

        await prisma.beneficiaryRequest.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ message: "Request cancelled"});
    } catch(error) {
        console.error("Delete request error:", error);
        return NextResponse.json(
        { error: "Failed to delete request" },
        { status: 500 }
        );
    }
}