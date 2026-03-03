import { setStringToHash } from "@/lib/bcrypt";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
    try {
        // only existing admins can create new admins
        const session = await getSession(req);
        if(!session || session.user.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized. Admin access required." },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { email, password, name } = body;

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "email already registered" },
                { status: 400 }
            );
        }

        // Hash password
        const hash = await setStringToHash(password, 12);

        // Create admin user with account for credentials login
        const result = await prisma.$transaction(async (tx) => {
            // Create user with role="admin"
            const user = await tx.user.create({
                data: {
                    email,
                    name: name || email.split('@')[0],
                    role: "admin",
                    emailVerified: new Date(),
                },
            });

            // Create credentials account to store hashed password
            await tx.account.create({
                data: {
                    userId: user.id,
                    type: "credentials",
                    provider: "credentials",
                    providerAccountId: user.id,
                    access_token: hash,
                },
            });

            return user;
        });

        return NextResponse.json({
            success: true,
            message: "Admin account created successfully",
            data: {
                id: result.id,
                email: result.email,
                name: result.name,
                role: result.role,
            }
        })
    } catch (error) {
        console.error("Error creating admin:", error);
        return NextResponse.json(
            { error: "Failed to create admin account" },
            { status: 500 }
        );
    }
}