import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

interface BeneficiaryData {
    id: number;
    username: string;
    type: string;
    firstName: string | null;
    lastName: string | null;
}

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            beneficiary?: BeneficiaryData | null;
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        id: string;
        role: string;
        sessionToken?: string;
        beneficiary?: BeneficiaryData | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id: string;
        role: string;
    }
}