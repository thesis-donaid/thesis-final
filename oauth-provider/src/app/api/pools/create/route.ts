
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
    try {
        const session = await getSession(req);
        if(!session || session.user.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized. Admin access required" },
                { status: 401 }
            )
        }



        const body = await req.json();
        const { name, description, total_amount, status = "active" } = body;

        // Validation
        if(!name || typeof name !== "string" || name.trim() === "") {
            return NextResponse.json(
                { error: "Pool name is required" },
                { status: 400 }
            );
        }

        const startingAmount = parseFloat(total_amount) || 0;
        if (startingAmount < 0) {
            return NextResponse.json(
                { error: "Starting amount cannot be negative" },
                { status: 400 }
            );
        }

        // Auto-determine donation type based on pool name
        // "Unrestricted" pool → unrestricted donations, all others → restricted
        const isUnrestricted = name.trim().toLowerCase() === "unrestricted";
        const donationType = isUnrestricted ? "unrestricted" : "restricted";

        // Check if pool name already exists
        const existingPool = await prisma.pool.findUnique({
            where: { name: name.trim() }
        })

        if(existingPool) {
            return NextResponse.json(
                { error: "Pool name already exists" },
                { status: 409 }
            );
        }

        const pool = await prisma.pool.create({
            data: {
                name: name.trim(),
                description: description || null,
                allocated_amount: 0,
                total_received: startingAmount,
                available_amount: startingAmount,
                createdById: session.user.id,
                status: status || "active",
            },
        });

        // If there's a starting amount for unrestricted pool, update UnrestrictedFund
        if (isUnrestricted && startingAmount > 0) {
            await prisma.unrestrictedFund.upsert({
                where: { id: 1 },
                update: {
                    total_received: { increment: startingAmount },
                    available_balance: { increment: startingAmount },
                },
                create: {
                    total_received: startingAmount,
                    total_allocated: 0,
                    available_balance: startingAmount,
                },
            });
        }

        return NextResponse.json(
            {
                success: true,
                message: "Pool created successfully",
                data: { ...pool, donation_type: donationType },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating pool:", error);
        return NextResponse.json(
        { error: "Failed to create pool" },
        { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getSession(req);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized. Admin access required." },
                { status: 401 }
            )
        }

        const pools = await prisma.pool.findMany({
            include: {
                donation: {
                    select: {
                        id: true,
                        amount: true,
                        status: true,
                        email: true,
                        is_anonymous: true,
                        donation_type: true,
                        created_at: true,
                        paid_at: true,
                        guestDonor: { select: { email: true } },
                        registeredDonor: { select: { name: true, user: { select: { name: true } } } },
                    },
                    orderBy: { created_at: "desc" },
                },
                allocations: {
                    select: {
                        id: true,
                        amount: true,
                        source_type: true,
                        is_disbursed: true,
                        disbursed_at: true,
                        allocated_at: true,
                        allocated_by: true,
                        request: {
                            select: {
                                id: true,
                                purpose: true,
                                amount: true,
                                status: true,
                                beneficiary: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
                        donationAllocations: {
                            select: {
                                amount_used: true,
                                donation: {
                                    select: { id: true, email: true, amount: true },
                                },
                            },
                        },
                    },
                    orderBy: { allocated_at: "desc" },
                },
                createdBy: {
                    select: {name: true },
                },
            },
            orderBy: { created_at: "desc" },
        });

        // Compute summary stats
        const summary = {
            totalPools: pools.length,
            activePools: pools.filter(p => p.status === "active").length,
            totalReceived: pools.reduce((s, p) => s + p.total_received, 0),
            totalAllocated: pools.reduce((s, p) => s + p.allocated_amount, 0),
            totalAvailable: pools.reduce((s, p) => s + p.available_amount, 0),
            totalDonations: pools.reduce((s, p) => s + p.donation.length, 0),
            totalAllocations: pools.reduce((s, p) => s + p.allocations.length, 0),
        };

        return NextResponse.json(
            {
                success: true,
                data: pools,
                summary,
            },
            { status: 200 }
        );
    } catch(error) {
        console.error("Error fetching pools:", error);
        return NextResponse.json(
            { error: "Failed to fetch pools" },
            { status: 500 }
        )
    }
}