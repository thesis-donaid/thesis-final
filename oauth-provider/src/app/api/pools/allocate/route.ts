// src/app/api/pools/allocate/route.ts

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, allocation_amount } = body;

        // Validation
        if(!id) {
            return NextResponse.json(
                { error: "Pool ID is required" },
                { status: 400 }
            );
        }

        // get the pool
        const pool = await prisma.pool.findUnique({
            where: { id },
        });

        if(!pool) {
            return NextResponse.json(
                { error: "Pool not found!" },
                { status: 404 } 
            )
        }

        // Check if availalbe_amount is sufficient
        if(allocation_amount > pool.available_amount) {
            return NextResponse.json(
                {
                    error: `Insufficient available amount. Available: ${pool.available_amount}`
                },
                { status: 400 }
            );
        }


        // Update pool
        const updatedPool = await prisma.pool.update({
            where: { id },
            data: {
                allocated_amount: { increment: allocation_amount },
                available_amount: { decrement: allocation_amount }
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Funds allocated successfully",
                data: updatedPool,
            },
            { status: 200 }
        )
    } catch(error) {
        console.error("Error allocation funds:", error);
        return NextResponse.json(
            { error: "Failed to allocate funds" },
            { status: 500 }
        )
    }
}