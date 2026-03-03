/**
 * /api/paymongo/payment-method/create/route.ts
 * Accept: payment type (gcash/paymaya/card), billing details
 * Return: payment method id
 */

import { PAYMONGO_API_URL, PAYMONGO_PUBLIC_KEY } from "@/lib/paymongo";
import { PaymentMethodRequest, PaymentMethodData } from "@/types/paymongo";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
    try {
        const body: PaymentMethodRequest = await req.json();

        // validate required fields
        if(!body.type) {
            return NextResponse.json(
                { success: false, error: 'payment type is requried' },
                { status: 400 }
            );
        }

        if(!body.billing || !body.billing.name || !body.billing.email) {
            return NextResponse.json(
                { success: false, error: 'Billing name and email are required' },
                { status: 400 }
            );
        }

        // Validate card details if payment type is card
        if(body.type === 'card') {
            if(!body.card || !body.card.number || !body.card.exp_month || !body.card.exp_year || !body.card.cvc) {
                return NextResponse.json(
                    { success: false, error: 'Card details are required for card payments' },
                    { status: 400 }
                );
            }
        }

        // Prepare payment method data
        const paymentMethodData: PaymentMethodData = {
            type: body.type,
            billing: {
                name: body.billing.name,
                email: body.billing.email,
                ...(body.billing.phone && { phone: body.billing.phone })
            }
        };

        //  Add card details if type is card
        if(body.type === 'card' && body.card) {
            paymentMethodData.details = {
                card_number: body.card.number.replace(/\s/g, ''),
                exp_month: body.card.exp_month,
                exp_year: body.card.exp_year,
                cvc: body.card.cvc
            };
        }


        // Create payment method with PayMongo
        const response = await fetch(`${PAYMONGO_API_URL}/payment_methods`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(PAYMONGO_PUBLIC_KEY + ':').toString('base64')}`
            },
            body: JSON.stringify({
                data: {
                    attributes: paymentMethodData
                }
            })
        });

        const responseData = await response.json();

        if(!response.ok) {
            console.error('PayMongo Payment Method Error:', responseData);
            return NextResponse.json(
                {
                    success: false,
                    error: responseData.errors?.[0]?.detail || 'Failed to create payment method',
                    details: responseData.errors
                },
                { status: response.status }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: responseData.data.id,
                type: responseData.data.type,
                billing: responseData.data.attributes.billing,
                created_at: responseData.data.attributes.created_at,
                updated_at: responseData.data.attributes.updated_at
            }
        }, { status: 201 })

        
    } catch(error) {
        console.error('Error creating payment method:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}