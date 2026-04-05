"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { ColumnType, Priority, Task, TaskType, User } from "@/types";
import { SortableTaskCard } from "@/components/Board/SortableTaskCard";
import { useEditingTask, useDoneColumnCollapsed } from "@/stores/boardStore";
import { CircleDashed, Circle, CheckCircle2, Plus, Filter, Inbox, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ColumnInlineAdd } from "./ColumnInlineAdd";
import { Button } from "@/components/ui/button";

interface AddTaskOptions {
    priority?: Priority;
    assignee?: User | null;
    taskType?: TaskType;
    tags?: string[];
}

// ============================================================================
// DROP INDICATOR — Shows when dragging over empty column
// ============================================================================
function DropIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 80 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className="rounded-lg border-2 border-dashed border-accent-linear/30 bg-accent-linear-subtle mb-3 flex flex-col items-center justify-center gap-1.5"
        >
            <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            >
                <CircleDashed className="w-5 h-5 text-accent-linear/50" />
            </motion.div>
            <span className="text-xs text-muted-foreground">Drop here</span>
        </motion.div>
    );
}

// ============================================================================
// EMPTY STATE — Shows when column has no tasks
// ============================================================================
interface EmptyStateProps {
    columnId: ColumnType["id"];
    hasFilters: boolean;
    onClearFilters?: () => void;
    onAddTask: () => void;
}

function EmptyState({ columnId, hasFilters, onClearFilters, onAddTask }: EmptyStateProps) {
    const emptyMessages: Record<ColumnType["id"], { title: string; subtitle: string }> = {
        "todo": {
            title: "Nothing to do",
            subtitle: "Add a task to get started",
        },
        "in-progress": {
            title: "All clear",
            subtitle: "Drag a task here to start working",
        },
        "done": {
            title: "No completed tasks",
            subtitle: "Complete tasks to see them here",
        },
    };

    const message = emptyMessages[columnId];

    if (hasFilters) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-8 px-4 text-center"
            >
                <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    <Filter className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">No matching tasks</p>
                <p className="text-xs text-muted-foreground/70 mb-3">Try adjusting your filters</p>
                {onClearFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        className="text-xs text-accent-linear hover:text-accent-linear/80"
                    >
                        Clear filters
                    </Button>
                )}
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-8 px-4 text-center"
        >
            <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                <Inbox className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">{message.title}</p>
            <p className="text-xs text-muted-foreground/70 mb-3">{message.subtitle}</p>
            {columnId === "todo" && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onAddTask}
                    className="text-xs text-accent-linear hover:text-accent-linear/80 gap-1"
                >
                    <Plus className="w-3 h-3" />
                    Add task
                </Button>
            )}
        </motion.div>
    );
}

// ============================================================================
// COLUMN COMPONENT — Renders a column with dnd-kit sortable support
// ============================================================================

interface ColumnProps {
    column: ColumnType;
    onAddTask: (title: string, columnId: ColumnType["id"], options?: AddTaskOptions) => Promise<void>;
    allTasks: Task[];
    availableAssignees: User[];
    availableTags: string[];
    hasFilters?: boolean;
    onClearFilters?: () => void;
    collapsible?: boolean;
}

// Linear-style status config (clean, no glows)
const statusConfig = {
    "todo": {
        icon: CircleDashed,
        color: "text-muted-foreground",
        dot: "bg-muted-foreground/40",
    },
    "in-progress": {
        icon: Circle,
        color: "text-[oklch(0.58_0.10_250)]",
        dot: "bg-[oklch(0.58_0.10_250)]",
    },
    "done": {
        icon: CheckCircle2,
        color: "text-[oklch(0.58_0.10_150)]",
        dot: "bg-[oklch(0.58_0.10_150)]",
    },
};

export function Column({
    column,
    onAddTask,
    allTasks,
    availableAssignees,
    availableTags,
    hasFilters = false,
    onClearFilters,
    collapsible = false,
}: ColumnProps) {
    const [isAddingTask, setIsAddingTask] = useState(false);
    const { openTaskEditor } = useEditingTask();
    const { doneColumnCollapsed, toggleDoneColumnCollapsed } = useDoneColumnCollapsed();
    const isCollapsed = collapsible && doneColumnCollapsed;
    const { setNodeRef, isOver, active } = useDroppable({
        id: column.id,
    });

    // Scroll fade edge state
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(false);
    const [scrollBottom, setScrollBottom] = useState(false);

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setScrollTop(el.scrollTop > 8);
        setScrollBottom(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
    }, []);

    useEffect(() => {
        updateScrollState();
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener("scroll", updateScrollState, { passive: true });
        const observer = new ResizeObserver(updateScrollState);
        observer.observe(el);
        return () => {
            el.removeEventListener("scroll", updateScrollState);
            observer.disconnect();
        };
    }, [updateScrollState, column.tasks.length]);

    const config = statusConfig[column.id];
    const taskIds = column.tasks.map(t => t.id);

    // Show drop indicator when dragging over empty column
    const showDropIndicator = isOver && active && column.tasks.length === 0;

    const handleAddTask = async (title: string, options?: AddTaskOptions) => {
        await onAddTask(title, column.id, options);
        setIsAddingTask(false);
    };

    // ── COLLAPSED RAIL ──────────────────────────────────────────────────
    if (isCollapsed) {
        return (
            <motion.div
                ref={setNodeRef}
                data-column-id={column.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.1 }}
                onClick={toggleDoneColumnCollapsed}
                className={cn(
                    "flex flex-col items-center h-full max-h-full rounded-lg py-4 cursor-pointer",
                    "hover:bg-muted/20 transition-colors duration-150",
                    isOver && "bg-accent-linear-subtle border border-accent-linear/20"
                )}
            >
                {/* Status dot — visible immediately */}
                <motion.div
                    animate={{ scale: isOver ? 1.4 : 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={cn("w-2 h-2 rounded-full mb-3 shrink-0", config?.dot)}
                />

                {/* Rotated title + count — delayed to appear after width animation */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.35 }}
                    className="flex flex-col items-center"
                >
                    <span className="text-sm font-semibold text-muted-foreground [writing-mode:vertical-lr] rotate-180 select-none">
                        {column.title}
                    </span>

                    {column.tasks.length > 0 && (
                        <span className="mt-3 text-[10px] font-medium text-muted-foreground bg-muted/50 rounded-full w-5 h-5 flex items-center justify-center tabular-nums shrink-0">
                            {column.tasks.length}
                        </span>
                    )}
                </motion.div>

                {/* Drop indicator when dragging over collapsed rail */}
                <AnimatePresence>
                    {isOver && active && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="mt-auto mb-2 flex flex-col items-center gap-1"
                        >
                            <motion.div
                                animate={{ y: [0, -3, 0] }}
                                transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                            >
                                <CheckCircle2 className="w-4 h-4 text-[oklch(0.58_0.10_150)]" />
                            </motion.div>
                            <span className="text-[9px] font-medium text-accent-linear [writing-mode:vertical-lr] rotate-180">Drop</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hidden SortableContext to keep dnd-kit working */}
                <div className="hidden">
                    <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                        {null}
                    </SortableContext>
                </div>
            </motion.div>
        );
    }

    // ── EXPANDED COLUMN ──────────────────────────────────────────────────
    return (
        <motion.div
            ref={setNodeRef}
            data-column-id={column.id}
            initial={collapsible ? { opacity: 0 } : false}
            animate={{
                scale: isOver ? 1.005 : 1,
                opacity: 1,
            }}
            transition={{
                scale: { type: "spring", stiffness: 500, damping: 35 },
                opacity: { duration: 0.25, delay: 0.15 },
            }}
            className={cn(
                "flex flex-col flex-1 min-w-0 h-full max-h-full rounded-lg p-3 group/column",
                "transition-all duration-150",
                "bg-transparent",
                isOver && "bg-accent-linear-subtle border border-accent-linear/20"
            )}
        >
            {/* Header — Compact Linear style with add button + progress */}
            <div className="mb-4 px-1">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={{
                            scale: isOver ? 1.15 : 1,
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={cn(
                            "w-2 h-2 rounded-full",
                            config?.dot
                        )}
                    />
                    <h2 className="font-semibold text-sm text-foreground tracking-tight">{column.title}</h2>
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {column.tasks.length}
                    </span>

                    {/* Header Add Button */}
                    <motion.button
                        onClick={() => setIsAddingTask(true)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                            "ml-auto w-6 h-6 rounded-md flex items-center justify-center",
                            "text-muted-foreground/50 hover:text-accent-linear",
                            "hover:bg-accent-linear/10",
                            "opacity-0 group-hover/column:opacity-100",
                            "transition-all duration-150",
                            "focus:outline-none focus:ring-1 focus:ring-accent-linear",
                            isAddingTask && "opacity-100 text-accent-linear bg-accent-linear/10"
                        )}
                        aria-label={`Add task to ${column.title}`}
                    >
                        <Plus className="w-4 h-4" />
                    </motion.button>

                    {/* Collapse button (only for collapsible columns) */}
                    {collapsible && (
                        <motion.button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleDoneColumnCollapsed();
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                                "w-6 h-6 rounded-md flex items-center justify-center",
                                "text-muted-foreground/40 hover:text-foreground hover:bg-muted/50",
                                "opacity-0 group-hover/column:opacity-100",
                                "transition-all duration-150",
                                "focus:outline-none focus:ring-1 focus:ring-accent-linear"
                            )}
                            aria-label="Collapse column"
                        >
                            <ChevronsRight className="w-4 h-4" />
                        </motion.button>
                    )}
                </div>

                {/* Priority distribution bar */}
                {column.tasks.length > 0 && (
                    <div className="mt-2.5 flex h-[3px] rounded-full overflow-hidden bg-muted/30 gap-px">
                        {(["urgent", "high", "med", "low", "none"] as const).map((p) => {
                            const count = column.tasks.filter(t => t.priority === p).length;
                            if (count === 0) return null;
                            const colors: Record<string, string> = {
                                urgent: "bg-priority-urgent",
                                high: "bg-priority-high",
                                med: "bg-priority-med",
                                low: "bg-priority-low",
                                none: "bg-muted-foreground/20",
                            };
                            return (
                                <div
                                    key={p}
                                    className={cn("h-full rounded-full transition-all duration-500", colors[p])}
                                    style={{ flex: count }}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Content — Scrollable area with sortable tasks */}
            <div
                ref={scrollRef}
                data-scroll-top={scrollTop}
                data-scroll-bottom={scrollBottom}
                className="column-scroll-container flex-1 overflow-y-auto pr-2 pt-1 pb-20 scrollbar-thin scrollbar-thumb-accent scrollbar-track-transparent"
            >
                {/* Inline Add Task — At top of column */}
                <AnimatePresence>
                    {isAddingTask && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="mb-3"
                        >
                            <ColumnInlineAdd
                                onAdd={handleAddTask}
                                onCancel={() => setIsAddingTask(false)}
                                availableAssignees={availableAssignees}
                                availableTags={availableTags}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    <AnimatePresence mode="popLayout">
                        {/* Drop indicator for empty columns during drag */}
                        {showDropIndicator && <DropIndicator key="drop-indicator" />}

                        {/* Empty state when no tasks and not dragging */}
                        {column.tasks.length === 0 && !showDropIndicator && !isAddingTask && (
                            <EmptyState
                                key="empty-state"
                                columnId={column.id}
                                hasFilters={hasFilters}
                                onClearFilters={onClearFilters}
                                onAddTask={() => setIsAddingTask(true)}
                            />
                        )}

                        <div className="space-y-3">
                            {column.tasks.map((task, index) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.3,
                                        ease: [0.25, 0.1, 0.25, 1],
                                        delay: index * 0.04,
                                    }}
                                >
                                    <SortableTaskCard
                                        task={task}
                                        onOpenDrawer={() => openTaskEditor(task.id)}
                                        allTasks={allTasks}
                                        availableAssignees={availableAssignees}
                                        availableTags={availableTags}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </AnimatePresence>
                </SortableContext>
            </div>
        </motion.div>
    );
}

