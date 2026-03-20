
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, RequestStatus, UrgencyLevel } from "../../../../../generated/prisma/client";
import { getSession } from "@/lib/session";
import { pusherServer } from "@/lib/pusher";

function calculateUrgency(dateNeeded: Date): "LOW" | "MEDIUM" | "HIGH" {
    const today = new Date();
    const diffDays = Math.ceil(
        (dateNeeded.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if(diffDays < 7) return "HIGH";
    if(diffDays <= 30) return "MEDIUM";

    return "LOW";
}


export async function POST(req: NextRequest) {
    try {
        const session = await getSession(req);

        if(!session || session.user.role !== "beneficiary") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get beneficiary record
        const beneficiary  = await prisma.beneficiary.findUnique({
            where: { userId: session.user.id }
        });

        if(!beneficiary) {
            return NextResponse.json(
                { error: "Beneficiary not found" },
                { status: 404 }
            );
        }

        const body = await req.json();
        const { purpose, amount, date_needed, email, additional_notes } = body;

        // Validation 
        if(!purpose || !amount || !date_needed || !email) {
            return  NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if(amount < 50) {
            return NextResponse.json(
                { error: "Request amount is minimum of 50 PHP" },
                { status: 400 }
            )
        }

        const dateNeeded = new Date(date_needed);
        const urgencyLevel = calculateUrgency(dateNeeded);

        const request = await prisma.beneficiaryRequest.create({
            data: {
                beneficiaryId: beneficiary.id,
                purpose,
                amount: parseFloat(amount),
                date_needed: dateNeeded,
                email,
                additional_notes,
                urgency_level: urgencyLevel,
            },
            include: {
                beneficiary: true,
            }
        });

        // Notify all admins via persistent notification system
        try {
            const admins = await prisma.user.findMany({
                where: { role: 'admin' },
                select: { id: true }
            });

            const notificationData = {
                title: "New Request Submitted",
                message: `${request.beneficiary.firstName} ${request.beneficiary.lastName} requested ₱${request.amount.toLocaleString()} for ${request.purpose}`,
                type: 'system',
                link: `/admin/requests/${request.id}`
            };

            // 1. Create database notifications for all admins
            await prisma.userNotification.createMany({
                data: admins.map(admin => ({
                    userId: admin.id,
                    ...notificationData,
                }))
            });

            // 2. Trigger real-time Pusher events for all admins
            const pusherPromises = admins.map(admin => 
                pusherServer.trigger(`user-${admin.id}`, 'notification', notificationData)
            );
            
            await Promise.all(pusherPromises);

        } catch (notifyError) {
            console.error("Failed to notify admins:", notifyError);
        }

        return NextResponse.json(request, { status: 201 });
    } catch(error) {
        console.error("Create request error:", error);
        return NextResponse.json(
            { error: "Failed to create request" },
            { status: 500 }
        )
    }
}


// GET - List requests
export async function GET(req: NextRequest) {
    try {
        const session = await getSession(req);

        if(!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const urgency = searchParams.get("urgency");

        // Build where clause
        const where: Prisma.BeneficiaryRequestWhereInput = {};

        // If beneficiary, only show their requests
        if(session.user.role === "beneficiary") {
            const beneficiary = await prisma.beneficiary.findUnique({
                where: { userId: session.user.id },
            });

            if(!beneficiary) {
                return NextResponse.json(
                    { error: "Beneficiary not found" },
                    { status: 404 }
                );
            }
            where.beneficiaryId = beneficiary.id;
        }

        // Filters
        if(status) where.status = status as RequestStatus;
        if(urgency) where.urgency_level = urgency as UrgencyLevel;

        const request = await prisma.beneficiaryRequest.findMany({
            where,
            include: {
                beneficiary: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                        type: true,
                    },
                },
                documents: true,
            },
            orderBy: [
                { urgency_level: "desc" },
                { date_needed: "asc" },
            ],
        });

        return NextResponse.json(request);
        
    } catch(error) {
        console.error("Get requests error:", error);
        return NextResponse.json(
            { error: "Failed to get requests" },
            { status: 500 }
        );
    }
}