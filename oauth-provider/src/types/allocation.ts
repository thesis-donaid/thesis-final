import { FundSourceType } from "../../generated/prisma/enums";

// Request body for creating allocation
export interface CreateAllocationRequest {
    requestId: number;
    allocations: AllocationItem[];
    disbursementDate: string;
    disbursementNotes?: string;
    notifyDonors?: boolean;
    notifyBeneficiary?: boolean;
}

export interface AllocationItem {
    sourceType: FundSourceType;
    poolId?: string;
    amount: number;
}


// Response types
export interface AllocationResponse {
    success: boolean;
    message: string;
    data?: {
        allocations: AllocatedFund[];
        totalAllocated: number;
        request: {
            id: number;
            purpose: string;
            requestAmount: number;
            status: string;
        };
        notifications: {
            donorCount: number;
            beneficiarNotified: boolean;
        };
    };
    error?: string;
}

export interface AllocatedFund {
    id: number;
    sourceType: FundSourceType;
    poolName?: string;
    amount: number;
    donationLinked: number;
}

// For listing available funds
export interface AvailableFunds {
    unrestricted: {
        available: number;
        total: number;
    };
    restricted: {
        poolId: string;
        poolName: string;
        available: number;
        total: number;
    }[];
}
