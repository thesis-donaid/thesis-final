import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";


export async function POST(req: NextRequest) {
    try {



        
        const body = await req.json();
        const { username, password } = body;

        if(!username || !password) {
            return NextResponse.json(
                { error: "username and password are required" },
                { status: 400 }
            );
        }

        // Find beneficiary with user relation
        const beneficiary = await prisma.beneficiary.findUnique({
            where: { username },
            include: { user: true }
        });

        console.log("Login attempt for username:", username);
        console.log("Beneficiary found:", beneficiary ? "Yes" : "No");

        if(!beneficiary) {
            return NextResponse.json(
                { error: "Invalid username or password" },
                { status: 401 } 
            )
        }

        // Check if account is active
        if(!beneficiary.isActive) {
            return NextResponse.json(
                { error: "Account is deactivated" },
                { status: 403 }
            );
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, beneficiary.password);
        console.log("Password valid:", isValidPassword);

        if(!isValidPassword) {
            return NextResponse.json(
                { error: "Invalid username or password" },
                { status: 401 }
            )
        }

        // Create session for the beneficiary
        const sessionToken = randomUUID();
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await prisma.session.create({
            data: {
                sessionToken,
                userId: beneficiary.userId,
                expires,
            },
        });

        // Don't return password
        const { password: _, ...beneficiaryWithoutPassword } = beneficiary;

        // Create response with session cookie
        const response = NextResponse.json({
            success: true,
            message: "Login successful",
            data: {
                beneficiary: beneficiaryWithoutPassword,
                user: {
                    id: beneficiary.user.id,
                    email: beneficiary.user.email,
                    name: beneficiary.user.name,
                    role: beneficiary.user.role,
                }
            },
        });

        // Set the session cookie (same name as NextAuth uses)
        // In development, NextAuth uses "next-auth.session-token"
        // In production with HTTPS, it may use "__Secure-next-auth.session-token"
        const cookieName = process.env.NODE_ENV === "production" 
            ? "__Secure-next-auth.session-token" 
            : "next-auth.session-token";
        
        response.cookies.set(cookieName, sessionToken, {
            expires,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });

        return response;
    } catch(error) {
        console.error("Error logging in: ", error);
        return NextResponse.json(
            { error: "Failed to login" },
            { status: 500 }
        )
    }
}