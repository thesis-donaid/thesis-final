import { setStringToHash } from "@/lib/bcrypt";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        // Only admins can create beneficiary accounts
        const session = await getSession(req);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized. Admin access required." },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { username, password, type, firstName, lastName, email, phone, address } = body;

        // Validation
        if (!username || !password || !type) {
            return NextResponse.json(
                { error: "Username, password, and beneficiary type are required." },
                { status: 400 }
            );
        }

        const validTypes = ["SCHOLAR", "EMPLOYEE", "COMMUNITY"];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: `Invalid beneficiary type. Must be one of: ${validTypes.join(", ")}` },
                { status: 400 }
            );
        }

        // Check if username already exists in Beneficiary table
        const existingBeneficiary = await prisma.beneficiary.findUnique({
            where: { username },
        });

        if (existingBeneficiary) {
            return NextResponse.json(
                { error: "Username already taken." },
                { status: 409 }
            );
        }

        // Check if email already exists as a User (if email provided)
        if (email) {
            const existingUser = await prisma.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                return NextResponse.json(
                    { error: "Email already registered." },
                    { status: 409 }
                );
            }
        }

        // Hash password
        const hashedPassword = await setStringToHash(password, 12);

        // Create User + Account + Beneficiary in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create User with role "beneficiary"
            const user = await tx.user.create({
                data: {
                    email: email || null,
                    name: firstName && lastName ? `${firstName} ${lastName}` : username,
                    role: "beneficiary",
                    emailVerified: new Date(),
                },
            });

            // 2. Create credentials Account (for login)
            await tx.account.create({
                data: {
                    userId: user.id,
                    type: "credentials",
                    provider: "credentials",
                    providerAccountId: user.id,
                    access_token: hashedPassword,
                },
            });

            // 3. Create Beneficiary profile
            const beneficiary = await tx.beneficiary.create({
                data: {
                    userId: user.id,
                    username,
                    password: hashedPassword,
                    type: type as "SCHOLAR" | "EMPLOYEE" | "COMMUNITY",
                    firstName: firstName || null,
                    lastName: lastName || null,
                    email: email || null,
                    phone: phone || null,
                    address: address || null,
                    createdBy: session.user.id,
                },
            });

            return { user, beneficiary };
        });

        return NextResponse.json({
            success: true,
            message: "Beneficiary account created successfully.",
            data: {
                id: result.beneficiary.id,
                userId: result.user.id,
                username: result.beneficiary.username,
                type: result.beneficiary.type,
                firstName: result.beneficiary.firstName,
                lastName: result.beneficiary.lastName,
                email: result.beneficiary.email,
            },
        });
    } catch (error) {
        console.error("Error creating beneficiary:", error);
        return NextResponse.json(
            { error: "Failed to create beneficiary account." },
            { status: 500 }
        );
    }
}
