import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";


export async function POST(req: NextRequest) {
    try {



        
        const body = await req.json();
        const { username_email, password } = body;

        if(!username_email || !password) {
            return NextResponse.json(
                { error: "username and password are required" },
                { status: 400 }
            );
        }


        const [beneficiary, donor] = await Promise.all([
            prisma.beneficiary.findUnique({
                where: { username: username_email },
                include: { user: true }
            }),
            prisma.user.findUnique({
                where: { email: username_email }
            })
        ]);

        console.log("Login attempt for username:", username_email);
        console.log("Beneficiary found:", beneficiary ? "Yes" : "No");

        if(beneficiary) {
            // Check if account is active
            if(!beneficiary.isActive) {
                return NextResponse.json(
                    { error: "Account is deactivated" },
                    { status: 403 }
                );
            }
            const isValidPassword = await bcrypt.compare(password, beneficiary.password);
            console.log("Password valid:", isValidPassword);
            // Verify password
    
    
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
        } else if(donor) {
            if (!donor || !donor.password) {
                return NextResponse.json(
                    { error: "Invalid email or password" },
                    { status: 401 }
                );
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, donor.password);

            if (!isValidPassword) {
                return NextResponse.json(
                    { error: "Invalid email or password" },
                    { status: 401 }
                );
            }

            // Create session
            const sessionToken = randomUUID();
            const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            
            await prisma.session.create({
                data: {
                    sessionToken,
                    userId: donor.id,
                    expires,
                },
            });


            // Create response 
            const response = NextResponse.json({
                success: true,
                message: "Login successful",
                data: {
                    user: {
                        id: donor.id,
                        email: donor.email,
                        name: donor.name,
                        role: donor.role
                    },
                },
            });


            // set the session cookie (same name as NextAuth uses)
            const cookieName = process.env.NODE_ENV === "production"
                ? "__Secure-next-auth.session-token"
                : "next-auth.session-token";

            response.cookies.set(cookieName, sessionToken, {
                expires,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
            })

            return response;
        } else {
            return NextResponse.json(
                { error: "Account not found" },
                { status: 401 }
            )
        }

    } catch(error) {
        console.error("Error logging in: ", error);
        return NextResponse.json(
            { error: "Failed to login" },
            { status: 500 }
        )
    }
}