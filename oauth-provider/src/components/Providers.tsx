// @/components/Provider.tsx

"use client";

import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import { NotificationProvider } from "@/context/NotificationContext";
import NavigationLoader from "./ui/NavigationLoader";


interface ProvidersProps {
    children: React.ReactNode;
    session?: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {

    return (
        <SessionProvider 
            session={session}
            refetchInterval={0}
            refetchOnWindowFocus={false}
        >
            <NotificationProvider>
                <NavigationLoader />
                {children}
            </NotificationProvider>
        </SessionProvider>
    );
}
