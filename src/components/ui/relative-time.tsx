"use client";

import { useState, useEffect } from "react";

function formatRelativeTimeValue(timestamp: number, updatedAt?: number): string {
    const effectiveTime = updatedAt && updatedAt !== timestamp ? updatedAt : timestamp;
    const seconds = Math.floor((Date.now() - effectiveTime) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;

    return new Date(effectiveTime).toLocaleDateString();
}

interface RelativeTimeProps {
    timestamp: number;
    updatedAt?: number;
    className?: string;
}

/**
 * Client-only relative time display to avoid hydration mismatches.
 * Shows nothing during SSR, then hydrates with correct time.
 */
export function RelativeTime({ timestamp, updatedAt, className }: RelativeTimeProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // During SSR and initial hydration, show a static placeholder
    if (!mounted) {
        return <span className={className}>—</span>;
    }

    return (
        <span className={className}>
            {formatRelativeTimeValue(timestamp, updatedAt)}
        </span>
    );
}
