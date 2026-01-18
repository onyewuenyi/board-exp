"use client";

import React, { useState } from "react";
import { Link2, Clock, GitBranch } from "lucide-react";
import { motion } from "framer-motion";
import { Task, Priority, User } from "@/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { TaskCardGlance } from "./TaskCardGlance";
import { TaskCardSnack } from "./TaskCardSnack";
import { TaskCardActions } from "./TaskCardActions";

// ============================================================================
// PRIORITY ACCENT LINES - Linear style (left edge indicator)
// ============================================================================
const PRIORITY_ACCENT: Record<Priority, string> = {
    urgent: "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-priority-urgent",
    high: "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-priority-high",
    med: "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-priority-med",
    low: "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-priority-low",
    none: "",
};

interface TaskCardProps {
    task: Task;
    onOpenDrawer: () => void;
    allTasks: Task[];
    availableAssignees: User[];
    availableTags: string[];
}

/**
 * TaskCard - Simplified for right-panel drawer pattern
 *
 * Two layers:
 * - Layer 1 (Glance): Title + Avatar + Failure Cost - always visible
 * - Layer 2 (Snack): Metadata row - hover only (desktop)
 *
 * Click opens the right-panel TaskEditDrawer for full editing.
 */
export function TaskCard({
    task,
    onOpenDrawer,
    allTasks,
    availableAssignees,
    availableTags,
}: TaskCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const isMobile = useIsMobile();

    // Handle action button clicks - open drawer (focused section could be added later)
    const handleActionClick = () => {
        onOpenDrawer();
    };

    // Handle keyboard interaction
    const handleKeyDown = (e: React.KeyboardEvent) => {
        const target = e.target as HTMLElement;
        const isInputElement =
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable;

        // Don't handle keyboard shortcuts when user is in an input field
        if (isInputElement) {
            return;
        }

        // Enter to open drawer
        if (e.key === "Enter") {
            e.preventDefault();
            onOpenDrawer();
        }
    };

    return (
        <Card
            role="button"
            tabIndex={0}
            aria-label={`Task: ${task.title}. Press Enter to edit.`}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => !isMobile && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                // Base styles
                "relative transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                "bg-card border border-border rounded-lg overflow-hidden",
                "min-h-[80px] flex flex-col justify-center",
                // Hover styles
                "hover:bg-card-hover hover:border-border-hover",
                "hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)]",
                // Touch feedback - active state for mobile
                "active:scale-[0.98] active:bg-card-hover text-left",
                // Priority accent line on left edge
                PRIORITY_ACCENT[task.priority],
                // Focus styles
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-linear"
            )}
        >
            {/* Layer 1: Glance (always visible) */}
            <TaskCardGlance task={task} isExpanded={false} isHovered={isHovered} />

            {/* Hover Actions (desktop only) */}
            {!isMobile && (
                <TaskCardActions
                    task={task}
                    visible={isHovered}
                    onActionClick={handleActionClick}
                />
            )}

            {/* Layer 2: Snack (hover only, not on mobile) */}
            {!isMobile && (
                <TaskCardSnack task={task} visible={isHovered} />
            )}
        </Card>
    );
}

