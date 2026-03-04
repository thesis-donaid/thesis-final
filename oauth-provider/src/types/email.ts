

export interface RequestEmailData {
    email: string;
    purpose: string;
    amount: number;
    date: Date;
    reference: string;
}

export interface AllocationEmailParams {
    to: string;
    donorName: string;
    amountUsed: number;
    purpose: string;
    disbursementDate: Date | null;
    isBeneficiary?: boolean;
    beneficiaryName?: string;
}


export interface ApprovedEmail {
    name: string;
    email: string;
    amount: number;
    isApproved: boolean;
    approved_by: string;
    disbursement_date: Date
}

export interface DisbursementEmailParams {
    to: string;
    recipientName: string;
    amount: number;
    purpose: string;
    disbursementMethod: string; // e.g. 'cash', 'check', 'bank_transfer'
    disbursementNotes?: string;
    isBeneficiary: boolean;
    beneficiaryName?: string;
}

export interface ReceiptNotificationParams {
    to: string;
    donorName: string;
    beneficiaryName: string;
    purpose: string;
    amount: number;
    message: string | null;
    receiptUrls: string[];
}