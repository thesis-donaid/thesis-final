"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * A perfectly centered, premium red progress bar for page navigations.
 * It simulates progress (0 -> 90%) when a link is clicked, 
 * and finishes (90 -> 100%) when the new page is actually rendered.
 */
export default function NavigationLoader() {
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const progressInterval = useRef<NodeJS.Timeout | null>(null);
    const navigatingToPath = useRef<string | null>(null);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        let navigationTimeout: NodeJS.Timeout;

        const handleStart = (targetPath: string) => {
            // Store which path we're navigating to
            navigatingToPath.current = targetPath;
            
            // Clear existing intervals
            if (progressInterval.current) clearInterval(progressInterval.current);
            
            // Wait slightly before showing to avoid "flashing" on fast pages
            timeoutId = setTimeout(() => {
                setIsLoading(true);
                setProgress(10); // Initial jump

                // Simulate progress from 10% to 90%
                progressInterval.current = setInterval(() => {
                    setProgress((prev) => {
                        if (prev >= 90) {
                            if (progressInterval.current) clearInterval(progressInterval.current);
                            return 90;
                        }
                        // Move slower as it gets closer to 90%
                        const diff = (90 - prev) * 0.1;
                        return prev + Math.max(diff, 0.5);
                    });
                }, 150);
            }, 100);
        };

        const handleComplete = () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
            setProgress(100);
            
            // Brief delay before hiding at 100%
            setTimeout(() => {
                setIsLoading(false);
                setProgress(0);
                navigatingToPath.current = null;
            }, 300);
            
            clearTimeout(timeoutId);
        };

        // Intercept link clicks
        const handleLinkClick = (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement).closest("a");
            if (!anchor) return;
            
            const href = anchor.getAttribute("href");
            if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) return;
            if (anchor.getAttribute("target") === "_blank") return;
            
            const linkPath = href.split("?")[0].split("#")[0];
            if (linkPath === pathname) return;
            
            handleStart(linkPath);
            
            // Safety timeout - hide loader after 5 seconds if navigation fails/hangs
            navigationTimeout = setTimeout(() => {
                handleComplete();
            }, 5000);
        };

        // Handle browser navigation (back/forward)
        const handlePopState = () => {
            handleStart(window.location.pathname);
            navigationTimeout = setTimeout(() => {
                handleComplete();
            }, 5000);
        };

        document.addEventListener("click", handleLinkClick, true);
        window.addEventListener("popstate", handlePopState);
        
        return () => {
            document.removeEventListener("click", handleLinkClick, true);
            window.removeEventListener("popstate", handlePopState);
            if (progressInterval.current) clearInterval(progressInterval.current);
            clearTimeout(timeoutId);
            clearTimeout(navigationTimeout);
        };
    }, [pathname]); // Remove isLoading and progress from dependencies

    // Handle route change completion separately
    useEffect(() => {
        // If we're loading and the pathname matches what we were navigating to
        // OR if we're loading and the pathname has changed (navigation completed)
        if (isLoading && navigatingToPath.current) {
            // If we've arrived at the target path, complete the progress
            if (pathname === navigatingToPath.current) {
                handleComplete();
            }
        }
    }, [pathname, isLoading]);

    // We need to define handleComplete in the component scope to use it in the second effect
    const handleComplete = () => {
        if (progressInterval.current) clearInterval(progressInterval.current);
        setProgress(100);
        
        setTimeout(() => {
            setIsLoading(false);
            setProgress(0);
            navigatingToPath.current = null;
        }, 300);
    };

    if (!isLoading) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none">
            {/* The actual progress bar */}
            <div 
                className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300 ease-out relative"
                style={{
                    width: `${progress}%`,
                    boxShadow: "0 0 10px rgba(239, 68, 68, 0.5), 0 0 5px rgba(239, 68, 68, 0.3)"
                }}
            >
                {/* Shiny effect at the tip */}
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/30 skew-x-[-20deg]" />
            </div>
        </div>
    );
}