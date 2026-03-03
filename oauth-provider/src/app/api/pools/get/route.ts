import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        const pools = await prisma.pool.findMany({
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true
            }
        });

        return NextResponse.json(pools)
    } catch(error) {
        console.error("Failed to fetch pools: ", error);
        return NextResponse.json(
            { error: "Failed to fetch Pools" }, 
            { status: 500 }
        )
    }
}