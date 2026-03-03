import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { setStringToHash } from "@/lib/bcrypt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export async function POST(req: NextRequest) {
    try {
        // Admin auth check
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
        }
        const body = await req.json();
        const { username, password, type, firstName, lastName, email, phone, address } = body;

        // Validation
        if (!username || !password || !type) {
            return NextResponse.json(
                { error: "Username, password, and type are required" },
                { status: 400 } 
            );
        }


        // Validate beneficiary type
        const validTypes = ["SCHOLAR", "EMPLOYEE", "COMMUNITY"];
        if(!validTypes.includes(type.toUpperCase())) {
            return NextResponse.json(
                { error: "Invalid beneficiary type. Must be SCHOLAR, EMPLOYEE, or COMMUNITY"},
                { status: 400 }
            );
        }


        
        // Check if username already exists
        const existingBeneficiary = await prisma.beneficiary.findUnique({
            where: { username },
        });
        
        if (existingBeneficiary) {
            return NextResponse.json(
                { error: "Username already exists" },
                { status: 400 }
            );
        }


        // Check if email already exists in User table (if provided)
        if (email) {
            const existingUserEmail = await prisma.user.findUnique({
                where: { email },
            });

            if (existingUserEmail) {
                return NextResponse.json(
                    { error: "Email already registered" },
                    { status: 400 }
                );
            }
        }

        // Hash Password
        const hashedPassword = await setStringToHash(password, 12);

        // Create user and beneficiary in a trasanction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create user with role="beneficiary"
            const user = await tx.user.create({
                data: {
                    email: email || null,
                    name: firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || username,
                    role: "beneficiary",
                },
            });

            // 2. Create Beneficiary linked to USer
            const beneficiary = await tx.beneficiary.create({
                data: {
                    userId: user.id,
                    username,
                    password: hashedPassword,
                    type: type.toUpperCase() as "SCHOLAR" | "EMPLOYEE" | "COMMUNITY",
                    firstName,
                    lastName,
                    email,
                    phone,
                    address
                }
            });

            return { user, beneficiary }
        })

        // Don't return password
        const { password: _, ...beneficiaryWithoutPassword } = result.beneficiary;

        return NextResponse.json({
            success: true,
            message: "Beneficiary account created successfully",
            data: {
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    name: result.user.name,
                    role: result.user.role,
                },
                beneficiary: beneficiaryWithoutPassword,
            }
        });
    } catch (error) {
        console.error("Error creating beneficiary:", error);
        return NextResponse.json(
            { error: "Failed to create beneficiary account" },
            { status: 500 }
        );
    }
}



export async function GET() {
    try {
        const beneficiaries = await prisma.beneficiary.findMany({
            select: {
                id: true,
                username: true,
                type: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                isActive: true,
                created_at: true
            }
        });

        return NextResponse.json({
            success: true,
            data: beneficiaries
        });
    } catch(error) {
        console.error("Error fetching beneficiaries:", error);
        return NextResponse.json(
        { error: "Failed to fetch beneficiaries" },
        { status: 500 }
        );
    }
}