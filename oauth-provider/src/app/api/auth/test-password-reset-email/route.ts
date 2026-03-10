import { sendPasswordResetEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

/**
 * Test endpoint to verify password reset email is working
 * Usage: POST /api/auth/test-password-reset-email
 * Body: { "email": "your@email.com" }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email is required." }, { status: 400 });
        }

        const testUrl = "http://localhost:3000/reset-password?token=test-token-12345";
        
        console.log(`[TEST] Attempting to send test password reset email to: ${email}`);
        
        await sendPasswordResetEmail(email, testUrl);

        console.log(`[TEST] Test email sent successfully to ${email}`);
        
        return NextResponse.json({ 
            message: "Test email sent successfully! Check your inbox.",
            testEmail: email,
            timestamp: new Date().toISOString(),
            note: "This is a test email with a dummy reset link. Do not click it."
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("[TEST] Email sending failed:", errorMessage);
        
        return NextResponse.json({ 
            error: "Failed to send test email",
            details: errorMessage,
            hint: "Check server logs and verify EMAIL_FROM and EMAIL_PASSWORD env vars are correct"
        }, { status: 500 });
    }
}
