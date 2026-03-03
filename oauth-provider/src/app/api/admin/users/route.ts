import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if(!session || session.user?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }


        const [admins, beneficiaries, registeredDonors, guestDonors] = await Promise.all([
            prisma.user.findMany({
                where: {role: 'admin' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    created_at: true,
                },
                orderBy: { created_at: "desc" }
            }),
            prisma.beneficiary.findMany({
                include: {
                    user: {
                        select: { email: true, name: true, created_at: true },
                    },
                },
                orderBy: { created_at: "desc" }
            }),
            prisma.registeredDonor.findMany({
                include: {
                    user: {
                        select: { email: true, name: true, created_at: true },
                    },
                },
                orderBy: {created_at: "desc"},
            }),
            prisma.guestDonor.findMany({
                where: {
                    email: {
                        notIn: (await prisma.user.findMany({ select: { email: true } }))
                            .map(u => u.email)
                            .filter((e): e is string => !!e),
                    },
                },
                orderBy: { created_at: "desc" },
            })
        ]);

        return NextResponse.json({
            admins,
            beneficiaries,
            registeredDonors,
            guestDonors,
            counts: {
                admins: admins.length,
                beneficiaries: beneficiaries.length,
                registeredDonors: registeredDonors.length,
                guestDonors: guestDonors.length,
            }
        })
    } catch (error) {
        console.error("Admin users error:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}