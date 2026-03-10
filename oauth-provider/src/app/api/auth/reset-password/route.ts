import { prisma } from "@/lib/prisma";
import { setStringToHash } from "@/lib/bcrypt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token, password } = body;

        if (!token || typeof token !== "string") {
            return NextResponse.json({ error: "Invalid reset link." }, { status: 400 });
        }

        if (!password || typeof password !== "string" || password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
        }

        // Find the token
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetToken) {
            return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
        }

        if (resetToken.used) {
            return NextResponse.json({ error: "This reset link has already been used." }, { status: 400 });
        }

        if (new Date() > resetToken.expires) {
            return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await setStringToHash(password, 24);

        // Update user password and mark token as used in a transaction
        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetToken.userId },
                data: { password: hashedPassword },
            }),
            prisma.passwordResetToken.update({
                where: { id: resetToken.id },
                data: { used: true },
            }),
        ]);

        // If user is a beneficiary, also update the beneficiary password
        const beneficiary = await prisma.beneficiary.findUnique({
            where: { userId: resetToken.userId },
        });

        if (beneficiary) {
            await prisma.beneficiary.update({
                where: { id: beneficiary.id },
                data: { password: hashedPassword },
            });
        }

        return NextResponse.json({ message: "Password reset successfully." });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
}
