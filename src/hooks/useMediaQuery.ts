"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if a media query matches.
 * Used for responsive behavior (e.g., hiding hover states on mobile).
 *
 * @param query - CSS media query string (e.g., "(max-width: 768px)")
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        setMatches(media.matches);

        const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
    }, [query]);

    return matches;
}

/**
 * Convenience hook to check if the user is on a mobile device.
 * Uses 768px breakpoint (standard tablet/mobile threshold).
 */
export function useIsMobile(): boolean {
    return useMediaQuery("(max-width: 768px)");
}
