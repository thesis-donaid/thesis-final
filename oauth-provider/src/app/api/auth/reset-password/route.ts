import { prisma } from "@/lib/prisma";
import { setStringToHash } from "@/lib/bcrypt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        console.log("[Reset Password API] Request received");
        
        const body = await req.json();
        const { token, password } = body;

        console.log("[Reset Password API] Token received:", token?.substring(0, 10) + "...");

        if (!token || typeof token !== "string") {
            console.log("[Reset Password API] Invalid token format");
            return NextResponse.json({ error: "Invalid reset link." }, { status: 400 });
        }

        if (!password || typeof password !== "string" || password.length < 6) {
            console.log("[Reset Password API] Invalid password format");
            return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
        }

        // Find the token
        console.log("[Reset Password API] Looking up token in database...");
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetToken) {
            console.log("[Reset Password API] Token not found");
            return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
        }

        if (resetToken.used) {
            console.log("[Reset Password API] Token already used");
            return NextResponse.json({ error: "This reset link has already been used." }, { status: 400 });
        }

        if (new Date() > resetToken.expires) {
            console.log("[Reset Password API] Token expired");
            return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
        }

        // Hash new password (10 rounds = standard bcrypt cost)
        console.log("[Reset Password API] Hashing password...");
        const hashedPassword = await setStringToHash(password, 10);

        // Update user password and mark token as used in a transaction
        console.log("[Reset Password API] Updating user password and marking token as used...");
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

        console.log("[Reset Password API] User password updated");

        // If user is a beneficiary, also update the beneficiary password
        console.log("[Reset Password API] Checking if user is a beneficiary...");
        const beneficiary = await prisma.beneficiary.findUnique({
            where: { userId: resetToken.userId },
        });

        if (beneficiary) {
            console.log("[Reset Password API] Updating beneficiary password...");
            await prisma.beneficiary.update({
                where: { id: beneficiary.id },
                data: { password: hashedPassword },
            });
            console.log("[Reset Password API] Beneficiary password updated");
        }

        console.log("[Reset Password API] Password reset completed successfully");
        return NextResponse.json({ message: "Password reset successfully." });
    } catch (error) {
        console.error("[Reset Password API] Error:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("[Reset Password API] Error details:", errorMessage);
        return NextResponse.json({ error: "Something went wrong. Please try again.", details: errorMessage }, { status: 500 });
    }
}
