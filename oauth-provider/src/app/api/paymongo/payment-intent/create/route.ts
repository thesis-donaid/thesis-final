// /api/paymongo/payment-intent/create/route.ts
/**
 * Accept: amount, currency, description
 * Return: payment intent with client_key
 */

import { PAYMONGO_API_URL, PAYMONGO_SECRET_KEY } from "@/lib/paymongo";
import { PaymentIntentRequest } from "@/types/paymongo";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {

    try {
        const body: PaymentIntentRequest = await req.json();

        if(!body.amount || body.amount <= 0 ) {
            return NextResponse.json(
                { success: false, error: 'Amount is required and must be greater than 0 pesos'},
                { status: 400 }
            );
        }

        // PHP convert
        const amountInCentavos = Math.round(body.amount * 100);

        if(amountInCentavos < 10000) {
            return NextResponse.json(
                { success: false, error: 'Minimum donation amount is ₱100.00'},
                { status: 400 }
            );
        }

        const paymentIntentData = {
            amount: amountInCentavos,
            currency: body.currency || 'PHP',
            description: body.description || 'Donation',
            statement_descriptor: body.statement_descriptor || 'DONATION',
            payment_method_allowed: ['gcash', 'paymaya'],
            metadata: {
                donation_amount: String(body.amount),
                created_at: new Date().toISOString()
            }
        };

        const response = await fetch(`${PAYMONGO_API_URL}/payment_intents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`
            },
            body: JSON.stringify({ data: { attributes: paymentIntentData }})
        });

        const responseData = await response.json();

        if(!response.ok) {
            console.error('PayMongo API Error:', responseData);
            return NextResponse.json(
                {
                    success: false,
                    error: responseData.errors?.[0]?.detail || 'Failed to create payment intent',
                    details: responseData.errors
                },
                { status: response.status }
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                id: responseData.data.id,
                type: responseData.data.type,
                attributes: {
                    amount: responseData.data.attributes.amount,
                    currency: responseData.data.attributes.currency,
                    description: responseData.data.attributes.description,
                    status: responseData.data.attributes.status,
                    client_key: responseData.data.attributes.client_key,
                    created_at: responseData.data.attributes.created_at,
                    payment_method_allowed: responseData.data.attributes.payment_method_allowed
                }
            }
        }, { status: 201 });

    } catch(error) {
        console.error('Error creating payment intent:', error);
        return NextResponse.json(
            { success: false, error: 'internal server error' },
            { status: 500 }
        )
    }
}