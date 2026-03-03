/**
 * /api/paymongo/payment-intent/[id]/route.ts
 * GET: Retrieve payment intent status
 * Accept: payment_intent_id (in URL)
 * Return: payment intent details with status and payment info
 */

import { PAYMONGO_API_URL, PAYMONGO_SECRET_KEY } from "@/lib/paymongo";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }>}
) {
    try {
        const { id } = await params;
        const paymentIntentId = id;

        // Validate payment intent ID
        if (!paymentIntentId) {
            return NextResponse.json(
                { success: false, error: 'Payment intent ID is required' },
                { status: 400 }
            );
        }

        // Fetch payment intent from PayMongo
        const response = await fetch(`${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`
            }
        });

        const responseData = await response.json();

        if(!response.ok) {
            console.error('PayMongo Retrieve Error:', responseData);
            return NextResponse.json(
                {
                    success: false,
                    error: responseData.errors?.[0]?.detail || 'Failed to retrieve payment intent',
                    details: responseData.errors
                }, 
                { status: response.status }
            );
        }

        const paymentIntent = responseData.data;
        const status = paymentIntent.attributes.status;
        const payments = paymentIntent.attributes.payments || [];

        return NextResponse.json({
            success: true,
             data: {
                id: paymentIntent.id,
                type: paymentIntent.type,
                attributes: {
                    amount: paymentIntent.attributes.amount,
                    currency: paymentIntent.attributes.currency,
                    description: paymentIntent.attributes.description,
                    status: status,
                    client_key: paymentIntent.attributes.client_key,
                    payment_method_allowed: paymentIntent.attributes.payment_method_allowed,
                    payments: payments,
                    next_action: paymentIntent.attributes.next_action || null,
                    created_at: paymentIntent.attributes.created_at,
                    updated_at: paymentIntent.attributes.updated_at
                }, 
                // Check if payment was successful
                is_paid: status === 'succeeded' || (payments.length > 0 && payments[0].status === 'paid'),
                // Include payment details if available
                payment_details: payments.length > 0 ? {
                    id: payments[0].id,
                    amount: payments[0].amount,
                    currency: payments[0].currency,
                    status: payments[0].status,
                    created_at: paymentIntent.attributes.created_at,
                    updated_at: paymentIntent.attributes.updated_at
                } : null
             }
        }, { status: 200 });
    } catch(error) {
        console.error('Error retrieving payment intent:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}