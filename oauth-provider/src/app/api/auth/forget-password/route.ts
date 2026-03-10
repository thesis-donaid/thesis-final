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

        // Delete any existing unused tokens for this user (so only the latest token works)
        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.id, used: false },
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

        try {
            await sendPasswordResetEmail(normalizedEmail, resetUrl);
            console.log(`Password reset flow completed for user: ${user.id}`);
        } catch (emailError) {
            console.error(`Email sending failed for ${normalizedEmail}:`, emailError);
        }

        return NextResponse.json({ message: "If an account with that email exists, a reset link has been sent." });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
}