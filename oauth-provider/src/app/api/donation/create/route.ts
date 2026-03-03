// api/donation/create/route.ts

import { authOptions } from "@/lib/auth";
import { createPaymentIntent } from "@/lib/paymongo";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {

    try {
        

        const body = await req.json();
        const { email, amount, donation_type, pool_id, message, is_anonymous, payment_method } = body;

        // Validation
        if(!amount || amount < 20) {
            return NextResponse.json(
                { error: "Email and amount (min ₱20) required" },
                { status: 400 }
            );
        }

        // Get session 
        const session = await getServerSession(authOptions);

        // Generate unique reference code
        const reference_code = `DON-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

        // Determine donor type
        let guest_donor_id = null;
        let registered_donor_id = null;

        if(session?.user?.id) {
            // Logged in user - find or create RegisteredDonor
            const registeredDonor = await prisma.registeredDonor.findUnique({
                where: { userId: session.user.id }
            })

            registered_donor_id = registeredDonor?.id;
        } else {
            // Guest donor - find or create by email
            const guestDonor = await prisma.guestDonor.upsert({
                where: { email },
                update: {},
                create: { email }
            })

            guest_donor_id = guestDonor?.id;
        }

        if(donation_type === "restricted" && pool_id) {
            console.log("checking donation type")
            const poolExists = await prisma.pool.findUnique({
                where: { id: pool_id }
            })

            if(!poolExists) {
                return NextResponse.json(
                    { error: "Pool not found. Please provide a valid pool_id." },
                    { status: 400 }
                );
            }
        }

        const unrestricted_default = await prisma.pool.findUnique({
            where: { name: "unrestricted" }
        })

        if(!unrestricted_default) {
            return NextResponse.json(
                { error: "Pool \"Unrestricted\" not found" },
                { status: 400 }
            )
        }


        // Create donation record
        const donation = await prisma.donation.create({
            data: {
                guest_donor_id,
                registered_donor_id,
                email,
                amount: parseFloat(amount),
                donation_type: donation_type || "unrestricted",
                pool_id: donation_type === "restricted" ? pool_id : unrestricted_default.id,
                message,
                is_anonymous: is_anonymous || false,
                reference_code,
                status: "pending"
            },
        });

        // Create PayMongo checkout session
        const payment = await createPaymentIntent({
            amount: parseFloat(amount),
            description: `Donation to Puso Ng Ama - ${reference_code}`,
            reference_code,
            email, // Pre-fill email in checkout
            payment_method, // User-selected payment method
        });

        // Update donation with payment intent ID
        await prisma.donation.update({
            where: { id: donation.id },
            data: { payment_intent_id: payment.id },
        });

        return NextResponse.json({
            success: true,
            checkout_url: payment.checkout_url,
            reference_code
        })


    } catch (error) {
        console.error("Create donation error:", error);
        return NextResponse.json(
        { error: "Failed to create donation" },
        { status: 500 }
        );
    }
    
}