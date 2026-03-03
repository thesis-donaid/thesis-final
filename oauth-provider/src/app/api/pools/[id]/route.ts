// src/app/api/pools/[id]/route.ts

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Validation
        if(!id) {
            return NextResponse.json(
                { error: "Pool ID is required" },
                { status: 400 }
            );
        }

        // Check if pool exists
        const pool = await prisma.pool.findUnique({
            where: { id },
            include: { donation: true },
        });

        if(!pool) {
            return NextResponse.json({ error: "Pool not found" }, { status: 404 });
        }

        // Optional: Prevent deletion if pool has donations
        if(pool.donation.length > 0) {
            return NextResponse.json({ erorr: "Cannot delete pool with existing donations" }, { status: 400 })
        }

        // Delete the pool
        await prisma.pool.delete({
            where: { id },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Pool deleted successfully",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting pool:", error);
        return NextResponse.json(
            { error: "Failed to delete pool" },
            { status: 500 }
        )
    }
}