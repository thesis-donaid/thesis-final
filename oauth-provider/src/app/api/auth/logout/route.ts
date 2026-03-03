import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        // Get the session token from cookies
        const sessionToken = req.cookies.get("next-auth.session-token")?.value 
            || req.cookies.get("__Secure-next-auth.session-token")?.value;

        if (sessionToken) {
            // Delete session from database
            await prisma.session.delete({
                where: { sessionToken }
            }).catch(() => {
                // Session might not exist, ignore error
            });
        }

        // Create response and clear cookies
        const response = NextResponse.json({ success: true, message: "Logged out" });

        // Clear both possible cookie names
        response.cookies.set("next-auth.session-token", "", {
            expires: new Date(0),
            path: "/",
        });
        response.cookies.set("__Secure-next-auth.session-token", "", {
            expires: new Date(0),
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Error logging out:", error);
        return NextResponse.json(
            { error: "Failed to logout" },
            { status: 500 }
        );
    }
}
