import 'server-only'
import crypto from 'crypto';

const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_PUBLIC_KEY = process.env.PAYMONGO_PUBLIC_KEY;

// Encode secret key for Basci Auth
const authHeader = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString("base64");

interface CreatePaymentIntentParams {
    amount: number;
    description?: string;
    reference_code: string;
    email?: string;
    name?: string;
    redirect_success?: string;
    redirect_failed?: string;
    payment_method?: string;
}


// Map user-selected payment method to PayMongo payment_method_types
function getPaymentMethodTypes(method?: string): string[] {
    const methodMap: Record<string, string[]> = {
        gcash: ["gcash"],
        paymaya: ["paymaya"],
        qrph: ["qrph"],
        paypal: ["card", "gcash", "paymaya", "qrph"], // PayPal not natively supported, show all options
    };
    return methodMap[method || ""] || ["card", "qrph", "gcash", "paymaya"];
}

export async function createPaymentIntent({
    amount,
    description,
    reference_code,
    email,
    name,
    redirect_success = `${process.env.NEXTAUTH_URL}/donation/success`,
    redirect_failed = `${process.env.NEXTAUTH_URL}/donation/failed`,
    payment_method,
}: CreatePaymentIntentParams) {
    // PayMongo expects amount in centavos(100 PHP = 10000 centavos)
    const amountInCentavos = Math.round(amount * 100);

    // Build checkout attributes
    const checkoutAttributes: Record<string, unknown> = {
        amount: amountInCentavos,
        currency: "PHP",
        description: description || `Donation - ${reference_code}`,
        payment_method_types: getPaymentMethodTypes(payment_method),
        reference_number: reference_code,
        send_email_receipt: true,
        success_url: `${redirect_success}?ref=${reference_code}`,
        cancel_url: `${redirect_failed}?ref=${reference_code}`,
        line_items: [
            {
                name: "Donation",
                amount: amountInCentavos,
                currency: "PHP",
                quantity: 1,
            }
        ]
    };

    // Pre-fill billing info if provided (so user doesn't re-type email)
    if (email) {
        checkoutAttributes.billing = {
            email: email,
            name: name || "Donor",
        };
    }

    const response = await fetch(`${PAYMONGO_API_URL}/checkout_sessions`, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${authHeader}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            data: {
                attributes: checkoutAttributes
            }
        })
    });

    if(!response.ok) {
        const error = await response.json();
        console.error("PayMongo error:", error);
        throw new Error(error.errors?.[0]?.detail || "Payment creation failed");
    }


    const data = await response.json();

    return {
        id: data.data.id,
        checkout_url: data.data.attributes.checkout_url,
        payment_intent_id: data.data.attributes.payment_intent?.id,
        reference_code,
    }
}

// Verify webhook signature
// export function verifyWebhookSignature(
//     payload: string,
//     signature: string,
//     webhookSecretKey: string
// ): boolean {
//     const crypto = require("crypto");


//     return false
// }

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookSecretKey: string
): boolean {
  // PayMongo sends signature in format: t=timestamp,te=test_signature,li=live_signature
  const parts = signature.split(",");
  const timestamp = parts.find((p: string) => p.startsWith("t="))?.split("=")[1];
  const testSig = parts.find((p: string) => p.startsWith("te="))?.split("=")[1];
  const liveSig = parts.find((p: string) => p.startsWith("li="))?.split("=")[1];
  
  const sig = liveSig || testSig;
  if (!timestamp || !sig) return false;
  
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSig = crypto
    .createHmac("sha256", webhookSecretKey)
    .update(signedPayload)
    .digest("hex");
  
  return sig === expectedSig;
}

export { PAYMONGO_API_URL, PAYMONGO_SECRET_KEY, PAYMONGO_PUBLIC_KEY }