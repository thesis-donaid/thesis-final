import { useLastVisitedPage } from "@/hooks/useLastVisitedPage";
import { useRouter } from "next/router";
import { useEffect } from "react";



export function LastVisitedRedirect({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { getLastVisitedPage } = useLastVisitedPage();

    useEffect(() => {
        // Check if this is the first visit or reload
        const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');

        if(!hasVisitedBefore) {
            // First time visitor - set flag and don't redirect
            localStorage.setItem('hasVisitedBefore', 'true');
        } else {
            // Return visitor - redirect to last page
            const lastPage = getLastVisitedPage();
            const currentPath = window.location.pathname;

            // Only redirect if we're not already on that page and it's not the home page
            if (lastPage && lastPage !== '/' && lastPage !== currentPath) {
                router.push(lastPage);
            }
        }
    }, [router, getLastVisitedPage])
    return <>{children}</>
}