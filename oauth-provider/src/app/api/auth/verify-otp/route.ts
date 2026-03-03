import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { email, code } = await req.json();

        if (!email || !code) {
            return NextResponse.json({ error: "Email and code required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const otpRecord = await prisma.otpCode.findFirst({
            where: {
                userId: user.id,
                code,
                used: false,
                expires: { gt: new Date() },
            },
        });

        if (!otpRecord) {
            return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
        }

        // Mark OTP as used
        await prisma.otpCode.update({
            where: { id: otpRecord.id },
            data: { used: true },
        });

        // Create session in database
        const sessionToken = randomUUID();
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        // Update Email Verified
        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() }
        })

        await prisma.session.create({
            data: {
                sessionToken,
                userId: user.id,
                expires,
            },
        });

        // Determine cookie name based on protocol (HTTPS uses __Secure- prefix)
        const isSecure = process.env.NEXTAUTH_URL?.startsWith("https://");
        const cookieName = isSecure 
            ? "__Secure-next-auth.session-token" 
            : "next-auth.session-token";

        // Set session cookie
        const cookieStore = await cookies();
        cookieStore.set(cookieName, sessionToken, {
            expires,
            httpOnly: true,
            secure: isSecure,
            sameSite: "lax",
            path: "/",
        });

        

        return NextResponse.json({ 
            success: true, 
            user: { 
                id: user.id, 
                email: user.email, 
                name: user.name 
            } 
        });
    } catch (error) {
        console.error("Verify OTP error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}