"use client";

import React from "react";
import { Task } from "@/types";
import { Link2, Clock, GitBranch } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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
 * Now renders inline (not absolutely positioned) so it expands the card
 * height on hover instead of overlapping content.
 */
export function TaskCardSnack({ task, visible }: TaskCardSnackProps) {
    const hasLinks = task.links && task.links.length > 0;
    const hasTime = task.timeEstimate && task.timeEstimate > 0;
    const blockingCount = task.blocking?.length || 0;
    const hasDeps = blockingCount > 0;

    // Vanish rule: don't render container if nothing to show
    if (!hasLinks && !hasTime && !hasDeps) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                >
                    <div
                        className="px-3.5 py-2 flex items-center gap-3 border-t border-border/40"
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
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400/80">
                                <GitBranch className="w-3 h-3" />
                                <span>{blockingCount}</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
