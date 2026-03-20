/**
 * /api/paymongo/webhook/route.ts
 * PayMongo Webhook Handler
 * Receives payment events from PayMongo
 */

import { prisma } from "@/lib/prisma";
import { sendDonationConfirmation } from "@/lib/email";
import { pusherServer } from "@/lib/pusher";
import { NextRequest, NextResponse } from "next/server";

// GET endpoint to test if webhook route is accessible
export async function GET() {
  return NextResponse.json({ 
    status: "Webhook endpoint is working!",
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  console.log("=== WEBHOOK RECEIVED ===");
  console.log("Timestamp:", new Date().toISOString());
  
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("paymongo-signature");

    console.log("Raw body length:", rawBody.length);
    console.log("Has signature:", !!signature);
    console.log("Raw body preview:", rawBody.substring(0, 500));

    const event = JSON.parse(rawBody);
    console.log("Full event:", JSON.stringify(event, null, 2));
    
    const eventType = event.data.attributes.type;

    console.log("PayMongo webhook received:", eventType);
    console.log("Webhook payload:", JSON.stringify(event, null, 2));

    if (eventType === "checkout_session.payment.paid") {
      const checkoutSession = event.data.attributes.data;
      const referenceCode = checkoutSession.attributes.reference_number;
      const checkoutSessionId = checkoutSession.id;
      
      // Extract payment details from the payments array
      const payments = checkoutSession.attributes.payments || [];
      const payment = payments[0]; // First payment
      
      // Get payment method and fee info
      const paymentMethod = checkoutSession.attributes.payment_method_used || 
                           payment?.attributes?.source?.type || 
                           "unknown";
      
      // PayMongo fee is typically in the payment object
      // Fee is in centavos, convert to PHP
      const feeInCentavos = payment?.attributes?.fee || 0;
      const paymentFee = feeInCentavos / 100;
      
      // Debug: Log all potential amount sources
      console.log("Amount sources:", {
        checkoutSessionAmount: checkoutSession.attributes.amount,
        paymentAmount: payment?.attributes?.amount,
        paymentNetAmount: payment?.attributes?.net_amount,
      });

      // Net amount = donation amount - fee
      // Try multiple paths for amount: checkout session, then payment object
      const grossAmountCentavos = checkoutSession.attributes.amount || 
                                   payment?.attributes?.amount || 
                                   0;
      const grossAmount = grossAmountCentavos / 100;
      
      // PayMongo may provide net_amount directly in payment object
      const paymongoNetAmount = payment?.attributes?.net_amount ? 
                                payment.attributes.net_amount / 100 : null;
      
      // Use PayMongo's net_amount if available, otherwise calculate it
      const netAmount = paymongoNetAmount ?? (grossAmount - paymentFee);

      console.log("Processing payment:", {
        referenceCode,
        paymentMethod,
        grossAmount,
        paymentFee,
        paymongoNetAmount,
        netAmount,
      });

      // Check if donation exists
      const existingDonation = await prisma.donation.findUnique({
        where: { reference_code: referenceCode },
      });

      if (!existingDonation) {
        console.error("Donation not found:", referenceCode);
        return NextResponse.json(
          { error: "Donation not found", referenceCode },
          { status: 404 }
        );
      }

      // Calculate final net amount - use existing donation amount as fallback
      const finalNetAmount = netAmount > 0 ? netAmount : 
                            (existingDonation.amount - paymentFee);
      
      console.log("Final net_amount to save:", finalNetAmount);

      // Find and update donation
      const donation = await prisma.donation.update({
        where: { reference_code: referenceCode },
        data: {
          status: "completed",
          payment_intent_id: checkoutSessionId,
          payment_method: paymentMethod,
          payment_fee: paymentFee > 0 ? paymentFee : null,
          net_amount: finalNetAmount,
          paid_at: new Date(),
          remaining_amount: finalNetAmount
        },
        include: {
          guestDonor: true,
          registeredDonor: {
            include: {
              user: true,  // Include user to get email
            }
          },
        },
      });

      // Update donor statistics
      if (donation.guest_donor_id) {
        await prisma.guestDonor.update({
          where: { id: donation.guest_donor_id },
          data: {
            donation_count: { increment: 1 },
            total_donated: { increment: donation.amount },
            last_donation_date: new Date(),
            first_donation_date: donation.guestDonor?.first_donation_date || new Date(),
          },
        });
        
      } else if (donation.registered_donor_id) {
        await prisma.registeredDonor.update({
          where: { id: donation.registered_donor_id },
          data: {
            donation_count: { increment: 1 },
            total_donated: { increment: donation.amount },
            available_funds: { increment: donation.amount }
          },
        });
      }

      

      // Update pool if restricted donation
      if (donation.pool_id) {
        await prisma.pool.update({
          where: { 
            id: donation.pool_id, 
          },
          data: {
            total_received: { increment: donation.net_amount || 0 },
            available_amount: { increment: donation.net_amount || 0 },
          },
        });
      }

      // Trigger Pusher for Admin
      try {
        await pusherServer.trigger("admin-events", "donation-received", {
          amount: donation.amount,
          donorName: donation.guestDonor?.email || donation.registeredDonor?.user?.name || "Anonymous",
          type: donation.donation_type,
        });
      } catch (pusherError) {
        console.error("Pusher admin trigger failed:", pusherError);
      }

      // TODO: Save to blockchain here
      // const txHash = await saveToBlockchain(donation);
      // await prisma.donation.update({
      //   where: { id: donation.id },
      //   data: { blockchain_tx_hash: txHash }
      // });

      // Send email confirmation to donor
      const donorEmail = donation.guestDonor?.email || donation.registeredDonor?.user?.email;
      if (donorEmail) {
        try {
          await sendDonationConfirmation({
            email: donorEmail,
            amount: donation.amount,
            reference: referenceCode,
            date: new Date(),
            purpose: "Donation"
          });
          console.log("Confirmation email sent to:", donorEmail);
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
          // Don't fail the webhook if email fails
        }
      }

      console.log("Donation completed:", referenceCode);
    }


    // Handle failed payments
    if (eventType === "payment.failed") {
      const payment = event.data.attributes.data;
      const referenceCode = payment.attributes.metadata?.reference_code;
      
      if (referenceCode) {
        await prisma.donation.update({
          where: { reference_code: referenceCode },
          data: { status: "failed" },
        });
        console.log("Donation failed:", referenceCode);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
