import { setStringToHash } from "@/lib/bcrypt";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const exisitngUser = await prisma.user.findUnique({
            where: { email },
        });

        if (exisitngUser) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409}
            );
        }


        const hashedPassword = await setStringToHash(password, 10);

        // Create user + registered donor in a transaction 
        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email,
                    name: name || null,
                    password: hashedPassword,
                    role: "registered",
                    emailVerified: new Date(),
                },
            });

            await tx.registeredDonor.create({
                data: {
                    userId: newUser.id,
                    name: name || null,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });

            return newUser;
        });

        return NextResponse.json({
            success: true,
            message: "Account created successfully",
            data: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        }, { status: 200 })
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        )
    }
}