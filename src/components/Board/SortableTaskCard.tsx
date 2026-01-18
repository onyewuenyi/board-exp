"use client";

import React, { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { Task, User } from "@/types";
import { TaskCard } from "@/components/TaskCard/TaskCard";
import { cn } from "@/lib/utils";

// ============================================================================
// INSERTION LINE — Shows where the card will be inserted
// ============================================================================
function InsertionLine() {
    return (
        <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 35 }}
            className="absolute -top-1.5 left-0 right-0 flex items-center gap-1 z-10"
        >
            <div className="w-1.5 h-1.5 rounded-full bg-accent-linear" />
            <div className="flex-1 h-0.5 bg-accent-linear rounded-full" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent-linear" />
        </motion.div>
    );
}

interface SortableTaskCardProps {
    task: Task;
    onOpenDrawer: () => void;
    allTasks: Task[];
    availableAssignees: User[];
    availableTags: string[];
}

export function SortableTaskCard({
    task,
    onOpenDrawer,
    allTasks,
    availableAssignees,
    availableTags,
}: SortableTaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isOver,
        active,
    } = useSortable({
        id: task.id,
    });

    // Use dnd-kit's transform for position changes during drag
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    // Show insertion line when another card is being dragged over this one
    const showInsertionLine = isOver && active && active.id !== task.id;

    // Track pointer position to distinguish click from drag
    // Using pointer events because dnd-kit's PointerSensor prevents click events
    const pointerStart = useRef<{ x: number; y: number } | null>(null);

    const handlePointerDown = (e: React.PointerEvent) => {
        pointerStart.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!pointerStart.current) return;

        // Check if pointer moved significantly (drag vs click)
        const dx = Math.abs(e.clientX - pointerStart.current.x);
        const dy = Math.abs(e.clientY - pointerStart.current.y);
        pointerStart.current = null;

        // If moved more than 5px, it was a drag attempt - don't open drawer
        if (dx > 5 || dy > 5) return;

        // Don't open drawer if currently dragging
        if (isDragging) return;

        // Don't trigger if clicking on buttons, popovers, or other interactive elements
        // Note: We exclude [role="button"] because dnd-kit adds that to the sortable wrapper itself
        const target = e.target as HTMLElement;
        if (target.closest('button, [role="menuitem"], [data-state="open"], [data-radix-popper-content-wrapper], input, textarea')) {
            return;
        }

        onOpenDrawer();
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            initial={false}
            animate={{
                opacity: isDragging ? 0.5 : 1,
                scale: isDragging ? 0.98 : 1,
                y: 0,
            }}
            transition={{
                opacity: { duration: 0.1 },
                scale: { type: "spring", stiffness: 500, damping: 30 },
                y: { type: "spring", stiffness: 500, damping: 30 },
            }}
            className={cn(
                "relative",
                isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            {...attributes}
            {...listeners}
        >
            {/* Insertion line indicator */}
            <AnimatePresence>
                {showInsertionLine && <InsertionLine />}
            </AnimatePresence>

            {/* Clickable wrapper - uses pointer events since dnd-kit prevents click events */}
            <div
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                className={cn(
                    "rounded-lg transition-all duration-100",
                    isDragging && "border-2 border-dashed border-accent-linear/40 bg-accent-linear-subtle"
                )}
            >
                <div className={cn(isDragging && "opacity-0")}>
                    <TaskCard
                        task={task}
                        onOpenDrawer={onOpenDrawer}
                        allTasks={allTasks}
                        availableAssignees={availableAssignees}
                        availableTags={availableTags}
                    />
                </div>
            </div>
        </motion.div>
    );
}

