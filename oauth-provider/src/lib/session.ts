import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export interface SessionUser {
    id: string;
    email: string | null;
    name: string | null;
    role: string;
}

export interface CustomSession {
    user: SessionUser;
}

export async function getSession(req: NextRequest): Promise<CustomSession | null> {
    // First try nextAuth's built-in session
    const nextAuthSession = await getServerSession(authOptions);

    if(nextAuthSession?.user) {
        return {
            user: {
                id: nextAuthSession.user.id,
                email: nextAuthSession.user.email ?? null,
                name: nextAuthSession.user.name ?? null,
                role: nextAuthSession.user.role,
            }
        };
    }


    // Fallback : check for manually created session (beneficiary login)
    const sessionToken = req.cookies.get("next-auth.session-token")?.value
        || req.cookies.get("_Secure-next-auth.session-token")?.value;

    if (!sessionToken) {
        return null;
    }

    // Look up session in database
    const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true }
    });


    if (!session || session.expires < new Date()) {
        return null;
    }

    return {
        user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: session.user.role
        }
    }
}