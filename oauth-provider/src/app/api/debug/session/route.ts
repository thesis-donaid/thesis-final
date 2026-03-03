import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    // Get all cookies
    const cookies = req.cookies.getAll();
    
    // Check for session token cookie
    const sessionTokenCookie = cookies.find(c => 
        c.name === "next-auth.session-token" || 
        c.name === "__Secure-next-auth.session-token"
    );

    let dbSession = null;
    if (sessionTokenCookie) {
        dbSession = await prisma.session.findUnique({
            where: { sessionToken: sessionTokenCookie.value },
            include: { user: true }
        });
    }

    // Get NextAuth session
    const nextAuthSession = await getServerSession(authOptions);

    return NextResponse.json({
        cookies: cookies.map(c => ({ name: c.name, valuePreview: c.value.substring(0, 20) + "..." })),
        sessionTokenCookie: sessionTokenCookie ? {
            name: sessionTokenCookie.name,
            value: sessionTokenCookie.value
        } : null,
        dbSession: dbSession ? {
            id: dbSession.id,
            userId: dbSession.userId,
            expires: dbSession.expires,
            user: {
                id: dbSession.user.id,
                email: dbSession.user.email,
                role: dbSession.user.role
            }
        } : null,
        nextAuthSession
    });
}
