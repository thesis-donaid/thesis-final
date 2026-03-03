

// export interface SessionData {
//     authenticated: boolean;
//     user: {
//         id: string;
//         email: string | null;
//         name: string | null;
//         role: string;
//         beneficiary?: {
//             id: number;
//         } | null;
//     } | null;
// }

interface SessionUser {
    id: string;
    email: string | null;
    name: string | null;
    role: string;
    image?: string | null;
    beneficiary?: {
        id: number;
        username: string;
        type: string;
        firstName: string | null;
        lastName: string | null;
    } | null;
}


export interface SessionData {
    authenticated: boolean;
    user: SessionUser | null;
    source?: string;
}
