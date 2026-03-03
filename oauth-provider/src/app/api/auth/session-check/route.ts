// /api/auth/session-check

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    // First try NextAuth's built-in session
    const nextAuthSession = await getServerSession(authOptions);
    
    if (nextAuthSession) {
        // Fetch beneficiary data if not already present and user is a beneficiary
        const user = { ...nextAuthSession.user };
        if (user.role === "beneficiary" && !user.beneficiary) {
            const beneficiary = await prisma.beneficiary.findUnique({
                where: { userId: user.id },
                select: {
                    id: true,
                    username: true,
                    type: true,
                    firstName: true,
                    lastName: true,
                },
            });
            user.beneficiary = beneficiary;
        }
        return NextResponse.json({
            authenticated: true,
            user,
            source: "nextauth"
        });
    }

    // Fallback: Check for manually created session (beneficiary login)
    const sessionToken = req.cookies.get("next-auth.session-token")?.value 
        || req.cookies.get("__Secure-next-auth.session-token")?.value;

    if (!sessionToken) {
        return NextResponse.json({ authenticated: false, user: null });
    }

    // Look up session in database
    const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { 
            user: {
                include: {
                    beneficiary: true
                }
            } 
        }
    });

    if (!session || session.expires < new Date()) {
        return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
        authenticated: true,
        user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: session.user.role,
            image: session.user.image,
            beneficiary: session.user.beneficiary ? {
                id: session.user.beneficiary.id,
                username: session.user.beneficiary.username,
                type: session.user.beneficiary.type,
                firstName: session.user.beneficiary.firstName,
                lastName: session.user.beneficiary.lastName,
            } : null
        },
        source: "database"
    });
}
