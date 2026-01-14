"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { ColumnType, Priority, Task } from "@/types";
import { SortableTaskCard } from "@/components/Board/SortableTaskCard";
import { InlineAddTask } from "@/components/InlineAdd/InlineAddTask";
import { CircleDashed, Circle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// DROP INDICATOR — Shows when dragging over empty column
// ============================================================================
function DropIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 100 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-b from-primary/10 to-transparent mb-3 flex flex-col items-center justify-center gap-2 backdrop-blur-sm"
        >
            <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
                <CircleDashed className="w-6 h-6 text-primary/50" />
            </motion.div>
            <span className="text-xs text-muted-foreground font-medium">Drop task here</span>
        </motion.div>
    );
}

// ============================================================================
// COLUMN COMPONENT — Renders a column with dnd-kit sortable support
// ============================================================================

interface ColumnProps {
    column: ColumnType;
    onAddTask: (title: string, columnId: ColumnType["id"]) => Promise<void>;
    onUpdatePriority: (taskId: string, priority: Priority) => void;
    onUpdateStatus: (taskId: string, status: ColumnType["id"]) => void;
    onAddDependency: (taskId: string, dependencyId: string, type: "blocking" | "blockedBy") => void;
    onTaskClick: (task: Task) => void;
    allTasks: { id: string; title: string }[];
}

const statusConfig = {
    "todo": {
        icon: CircleDashed,
        color: "text-muted-foreground",
        ring: "ring-muted-foreground/20",
        dot: "bg-muted-foreground/50",
        glow: ""
    },
    "in-progress": {
        icon: Circle,
        color: "text-blue-500",
        ring: "ring-blue-500/30",
        dot: "bg-blue-500",
        glow: "shadow-[0_0_8px_rgba(59,130,246,0.5)]"
    },
    "done": {
        icon: CheckCircle2,
        color: "text-green-500",
        ring: "ring-green-500/30",
        dot: "bg-green-500",
        glow: "shadow-[0_0_8px_rgba(34,197,94,0.4)]"
    },
};

export function Column({
    column,
    onAddTask,
    onUpdatePriority,
    onUpdateStatus,
    onAddDependency,
    onTaskClick,
    allTasks
}: ColumnProps) {
    const { setNodeRef, isOver, active } = useDroppable({
        id: column.id,
    });

    const config = statusConfig[column.id];
    const taskIds = column.tasks.map(t => t.id);

    // Count urgent/high priority tasks
    const urgentCount = column.tasks.filter(t => t.priority === "urgent" || t.priority === "high").length;

    // Show drop indicator when dragging over empty column
    const showDropIndicator = isOver && active && column.tasks.length === 0;

    return (
        <motion.div
            ref={setNodeRef}
            data-column-id={column.id}
            animate={{
                scale: isOver ? 1.01 : 1,
            }}
            transition={{
                scale: { type: "spring", stiffness: 400, damping: 30 },
            }}
            className={cn(
                "flex flex-col shrink-0 h-full max-h-full rounded-xl p-4",
                "w-full md:w-[360px]",
                "transition-all duration-200",
                "bg-gradient-to-b from-white/[0.02] to-transparent",
                "border border-white/[0.03]",
                isOver && "bg-primary/[0.03] ring-2 ring-primary/20 ring-inset border-primary/20"
            )}
        >
            {/* Header — Two-line layout */}
            <div className="mb-5 px-1">
                {/* Line 1: Status dot + Title */}
                <div className="flex items-center gap-2.5 mb-1">
                    <motion.div
                        animate={{
                            scale: isOver ? 1.2 : 1,
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            config?.dot,
                            config?.glow
                        )}
                    />
                    <h2 className="font-semibold text-lg text-foreground tracking-tight">{column.title}</h2>
                </div>

                {/* Line 2: Task count + urgent count */}
                <div className="flex items-center gap-2 ml-5 text-xs text-muted-foreground/50">
                    <span>{column.tasks.length} task{column.tasks.length !== 1 ? "s" : ""}</span>
                    {urgentCount > 0 && (
                        <>
                            <span className="text-muted-foreground/30">·</span>
                            <span className="text-orange-400/70">{urgentCount} urgent</span>
                        </>
                    )}
                </div>
            </div>

            {/* Content — Scrollable area with sortable tasks */}
            <div className="flex-1 overflow-y-auto pr-2 pb-10 scrollbar-thin scrollbar-thumb-accent scrollbar-track-transparent">
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    <AnimatePresence mode="popLayout">
                        {/* Drop indicator for empty columns */}
                        {showDropIndicator && <DropIndicator key="drop-indicator" />}

                        <div className="space-y-3">
                            {column.tasks.map((task) => (
                                <SortableTaskCard
                                    key={task.id}
                                    task={task}
                                    onUpdatePriority={onUpdatePriority}
                                    onUpdateStatus={onUpdateStatus}
                                    onAddDependency={onAddDependency}
                                    onClick={onTaskClick}
                                    allTasks={allTasks}
                                />
                            ))}
                        </div>
                    </AnimatePresence>
                </SortableContext>

                {/* Add Task */}
                <div className="mt-4">
                    <InlineAddTask onAdd={(title) => onAddTask(title, column.id)} />
                </div>
            </div>
        </motion.div>
    );
}
