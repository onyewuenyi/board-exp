"use client";

import React from "react";
import { Task } from "@/types";
import { Link2, Clock, GitBranch } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TaskCardSnackProps {
    task: Task;
    visible: boolean;
}

/**
 * Formats duration in minutes to human-readable string.
 */
function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Layer 2 - Snack (Hover-revealed metadata row)
 *
 * Implements the "Vanish Rule": only render if data is non-empty.
 * Shows (if present):
 * - Link count badge
 * - Time estimate
 * - Dependency count
 *
 * Hidden on mobile (no hover).
 */
export function TaskCardSnack({ task, visible }: TaskCardSnackProps) {
    const hasLinks = task.links && task.links.length > 0;
    const hasTime = task.timeEstimate && task.timeEstimate > 0;
    const blockingCount = task.blocking?.length || 0;
    const blockedByCount = task.blockedBy?.length || 0;
    const hasDeps = blockingCount + blockedByCount > 0;

    // Vanish rule: don't render container if nothing to show
    if (!hasLinks && !hasTime && !hasDeps) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{
                opacity: visible ? 1 : 0,
                y: visible ? 0 : 5,
            }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
                "absolute bottom-0 left-0 right-0",
                "px-3.5 py-2 flex items-center gap-3",
                "bg-card/98 backdrop-blur-md border-t border-border/60",
                "shadow-[0_-8px_20px_rgba(0,0,0,0.12)]",
                "z-10",
                !visible && "pointer-events-none"
            )}
        >
            {/* Link Count */}
            {hasLinks && (
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                    <Link2 className="w-3 h-3" />
                    <span>{task.links!.length}</span>
                </div>
            )}

            {/* Time Estimate */}
            {hasTime && (
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(task.timeEstimate!)}</span>
                </div>
            )}

            {/* Dependencies */}
            {hasDeps && (
                <div
                    className={cn(
                        "flex items-center gap-1.5 text-[10px] font-bold",
                        blockedByCount > 0 ? "text-red-400/80" : "text-blue-400/80"
                    )}
                >
                    <GitBranch className="w-3 h-3" />
                    <span>{blockingCount + blockedByCount}</span>
                </div>
            )}
        </motion.div>
    );
}
