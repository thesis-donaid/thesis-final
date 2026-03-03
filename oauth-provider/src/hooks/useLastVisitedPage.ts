import { usePathname } from "next/navigation";
import { useEffect } from "react";


export function useLastVisitedPage() {
    const pathname = usePathname();

    useEffect(() => {
        // Store current path in localStorage whenever it changes
        if (pathname) {
            localStorage.setItem('lastVisitedPage', pathname);
        }
    }, [pathname]);

    // Function to get the last visited page
    const getLastVisitedPage = () => {
        return localStorage.getItem('lastVisitedPage') || '/';
    }
    return { getLastVisitedPage };
}