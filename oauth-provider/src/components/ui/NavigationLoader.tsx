"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationLoader() {
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [prevPathname, setPrevPathname] = useState(pathname);
    const [navigating, setNavigating] = useState(false);

    // Render-time: detect route change arrived
    if (prevPathname !== pathname) {
        setPrevPathname(pathname);
        setProgress(100);
        setNavigating(false);
    }

    // When progress hits 100, schedule hide
    useEffect(() => {
        if (progress === 100 && loading) {
            const timer = setTimeout(() => {
                setLoading(false);
                setProgress(0);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [progress, loading]);

    // When navigating starts, animate progress
    useEffect(() => {
        if (!navigating) return;
        let current = 20;
        const timer = setInterval(() => {
            current += Math.random() * 10;
            if (current > 90) current = 90;
            setProgress(current);
        }, 200);

        // Safety timeout: auto-cancel after 8s if route never changed
        const safetyTimer = setTimeout(() => {
            setProgress(100);
            setNavigating(false);
        }, 8000);

        return () => {
            clearInterval(timer);
            clearTimeout(safetyTimer);
        };
    }, [navigating]);

    // Listen for link clicks + popstate (back/forward)
    useEffect(() => {
        const startLoading = () => {
            setLoading(true);
            setProgress(20);
            setNavigating(true);
        };

        const handleClick = (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement).closest("a");
            if (!anchor) return;
            const href = anchor.getAttribute("href");
            if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) return;
            if (anchor.getAttribute("target") === "_blank") return;

            // Extract just the pathname (strip query/hash) for comparison
            const linkPath = href.split("?")[0].split("#")[0];
            if (linkPath === pathname) return;

            startLoading();
        };

        const handlePopState = () => {
            startLoading();
        };

        document.addEventListener("click", handleClick, true);
        window.addEventListener("popstate", handlePopState);
        return () => {
            document.removeEventListener("click", handleClick, true);
            window.removeEventListener("popstate", handlePopState);
        };
    }, [pathname]);

    if (!loading) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px]">
            <div
                className="h-full bg-red-600 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
