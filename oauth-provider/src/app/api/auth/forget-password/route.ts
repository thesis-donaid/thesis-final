import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email is required." }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Find user by email (works for both donors and beneficiaries since both have User records)
        const user = await prisma.user.findFirst({
            where: { email: normalizedEmail },
        });

        // Always return success to avoid email enumeration
        if (!user || !user.password) {
            return NextResponse.json({ message: "If an account with that email exists, a reset link has been sent." });
        }

        // Invalidate any existing unused tokens for this user
        await prisma.passwordResetToken.updateMany({
            where: { userId: user.id, used: false },
            data: { used: true },
        });

        // Generate a secure token
        const token = randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.passwordResetToken.create({
            data: {
                token,
                userId: user.id,
                expires,
            },
        });

        // Build reset URL
        const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.get("host")}`;
        const resetUrl = `${baseUrl}/reset-password?token=${token}`;

        await sendPasswordResetEmail(normalizedEmail, resetUrl);

        return NextResponse.json({ message: "If an account with that email exists, a reset link has been sent." });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
}