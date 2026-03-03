/**
 * /api/paymongo/payment-intent/attach/route.ts
 * 
 * 
 * Accept: payment_intent_id, payment_method_id
 * Return: attached payment intent with next action (redirect URL)
 */

import { PAYMONGO_API_URL, PAYMONGO_SECRET_KEY } from "@/lib/paymongo";
import { AttachPaymentRequest, AttachPaymentData } from "@/types/paymongo";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
    try {
        const body: AttachPaymentRequest = await req.json();

        // Validate required fields
        if(!body.payment_intent_id) {
            return NextResponse.json(
                { success: false, error: 'Payment intent ID is required' },
                { status: 400 }
            );
        }

        if(!body.payment_method_id) {
            return NextResponse.json(
                { success: false, error: 'Payment method ID is required' },
                { status: 400 }
            );
        }

        // Extract the actual ID without the prefix if present
        const intentId = body.payment_intent_id;
        const methodId = body.payment_method_id;
        
        //  Prepare attach data
        const attachData: AttachPaymentData = {
            payment_method: methodId,
            client_key: body.client_key,
            ...(body.return_url && { return_url: body.return_url })
        };

        // Log the request details for debugging
        console.log('PayMongo Attach Request:', {
            url: `${PAYMONGO_API_URL}/payment_intents/${intentId}/attach`,
            intentId,
            methodId,
            attachData
        });

        // Attach  payment method to payment intent
        const response = await fetch(`${PAYMONGO_API_URL}/payment_intents/${intentId}/attach`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`
            },
            body: JSON.stringify({
                data: {
                    attributes: attachData
                }
            })
        })

        const responseData = await response.json();

        if(!response.ok) {
            console.error('PayMongo Attach Error:', JSON.stringify(responseData, null, 2));
            console.error('Request was:', { intentId, methodId, attachData });
            return NextResponse.json(
                {
                    success: false,
                    error: responseData.errors?.[0]?.detail || 'Failed to attach payment method',
                    details: responseData.errors
                },
                { status: response.status }
            );
        }

        // Extract important data from response
        const paymentIntent = responseData.data;
        const nextAction = paymentIntent.attributes.next_action;
        const status = paymentIntent.attributes.status;

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
                    payments: paymentIntent.attributes.payments,
                    next_action: nextAction,
                    created_at: paymentIntent.attributes.created_at,
                    updated_at: paymentIntent.attributes.updated_at
                },

                // include redirect URL if available (for e-wallets)
                redirect_url: nextAction?.redirect?.url || null,
                // inlcude checkout URL if available
                checkout_url: nextAction?.redirect?.url || null
            }
        }, { status: 200 })
    } catch(error) {
        console.error('Error attaching payment method:', error);
        return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
        );
    }
}