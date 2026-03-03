
export interface PaymentIntentRequest {
    amount: number;
    currency?: string;
    description?: string;
    statement_descriptor?: string;   
}

export type PaymentType = 'gcash' | 'paymaya' | 'card';

export interface BillingDetails {
    name: string;
    email: string;
    phone?: string;
}

export interface CardDetails {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
}

export interface CardDetailsProcessed {
    card_number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
}

export interface PaymentMethodRequest {
    type: PaymentType;
    billing: BillingDetails;
    card?: CardDetails;
}

export interface PaymentMethodData {
    type: PaymentType;
    billing: BillingDetails;
    details?: CardDetailsProcessed;
}


export interface AttachPaymentRequest {
    payment_intent_id: string;
    payment_method_id: string;
    client_key?: string;
    return_url?: string;
}

export interface AttachPaymentData {
    payment_method: string;
    client_key?: string;
    return_url?: string;
}