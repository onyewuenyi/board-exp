"use client";

import React, { useState } from "react";
import { Task, Priority, User, TaskType } from "@/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useBoardStore } from "@/stores/boardStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnimatePresence, motion } from "framer-motion";
import {
    User as UserIcon,
    Link2,
    Clock,
    GitBranch,
    Copy,
    AlertCircle,
    Calendar,
} from "lucide-react";

// ============================================================================
// CONSTANTS
// ============================================================================
const PRIORITY_ACCENT: Record<Priority, string> = {
    urgent: "priority-accent priority-accent-urgent",
    high: "priority-accent priority-accent-high",
    med: "priority-accent priority-accent-med",
    low: "priority-accent priority-accent-low",
    none: "",
};

const TASK_TYPE_EMOJI: Record<TaskType, string> = {
    chore: "🧹",
    errand: "🚗",
    homework: "📚",
    appointment: "📅",
    other: "📌",
};

function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatDueDate(timestamp: number): string {
    const now = new Date();
    const due = new Date(timestamp);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const diffDays = Math.round((dueDay - todayStart) / (1000 * 60 * 60 * 24));

    if (diffDays < -1) return `${Math.abs(diffDays)}d ago`;
    if (diffDays === -1) return "Yesterday";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays <= 6) return due.toLocaleDateString("en-US", { weekday: "short" });
    return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ============================================================================
// COMPONENT
// ============================================================================
interface TaskCardProps {
    task: Task;
    onOpenDrawer: () => void;
    allTasks: Task[];
    availableAssignees: User[];
    availableTags: string[];
}

export function TaskCard({
    task,
    onOpenDrawer,
    allTasks,
    availableAssignees,
    availableTags,
}: TaskCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const isMobile = useIsMobile();
    const editingTaskId = useBoardStore((state) => state.editingTaskId);
    const handleDuplicateTask = useBoardStore((state) => state.handleDuplicateTask);
    const isSelected = editingTaskId === task.id;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
        if (e.key === "Enter") {
            e.preventDefault();
            onOpenDrawer();
        }
    };

    // Derived data
    const assignees = task.assignees?.length > 0 ? task.assignees : task.assignee ? [task.assignee] : [];
    const subtaskCount = task.subtasks?.length || 0;
    const completedCount = task.subtasks?.filter(s => s.completed).length || 0;
    const hasSubtasks = subtaskCount > 0;
    const allComplete = hasSubtasks && completedCount === subtaskCount;
    const showType = task.taskType && task.taskType !== "other";
    const hasLinks = task.links && task.links.length > 0;
    const hasTime = task.timeEstimate && task.timeEstimate > 0;
    const blockingCount = task.blocking?.length || 0;
    const hasDeps = blockingCount > 0;
    const now = Date.now();
    const todayEnd = new Date(new Date().setHours(23, 59, 59, 999)).getTime();
    const isOverdue = Boolean(task.dueDate && task.status !== "done" && task.dueDate < new Date(new Date().setHours(0, 0, 0, 0)).getTime());
    const isDueSoon = Boolean(task.dueDate && task.status !== "done" && !isOverdue && task.dueDate <= todayEnd);
    const hasDueDate = Boolean(task.dueDate);
    const hasMetadata = showType || hasSubtasks || hasLinks || hasTime || hasDeps || hasDueDate;
    const hasDescription = Boolean(task.description);
    const canDuplicate = task.status === "done";

    const failureColor = task.priority === "urgent" || task.priority === "high"
        ? "text-red-400" : "text-amber-400/90";

    return (
        <Card
            role="button"
            tabIndex={0}
            aria-label={`Task: ${task.title}. Press Enter to edit.`}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => !isMobile && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "relative transition-all duration-300 ease-out",
                "bg-card rounded-xl border border-white/[0.04]",
                "shadow-[0_2px_8px_rgba(0,0,0,0.3)]",
                "hover:bg-card-hover hover:border-white/[0.08]",
                "hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:-translate-y-0.5",
                "active:scale-[0.98] text-left",
                PRIORITY_ACCENT[task.priority],
                isDueSoon && "task-due-soon",
                isSelected && "border-accent-linear/50 bg-accent-linear-subtle ring-1 ring-accent-linear/20",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-linear"
            )}
        >
            {/* Main content */}
            <div className="flex items-start gap-3 p-3.5">
                {/* Avatars */}
                {assignees.length > 0 ? (
                    <div className="flex -space-x-2 shrink-0">
                        {assignees.slice(0, 3).map((user) => (
                            <Avatar key={user.id} className="w-8 h-8 ring-2 ring-background shadow-sm">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="bg-accent text-accent-foreground text-xs font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        ))}
                        {assignees.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-muted ring-2 ring-background flex items-center justify-center">
                                <span className="text-[10px] font-medium text-muted-foreground">+{assignees.length - 3}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <Avatar className="w-8 h-8 shrink-0 ring-2 ring-background shadow-sm">
                        <AvatarFallback className="bg-muted">
                            <UserIcon className="w-4 h-4 text-muted-foreground" />
                        </AvatarFallback>
                    </Avatar>
                )}

                {/* Title + always-visible info */}
                <div className="flex-1 min-w-0">
                    <span
                        className={cn(
                            "text-[15px] font-medium leading-snug block",
                            task.status === "done"
                                ? "line-through text-muted-foreground/60"
                                : "text-foreground/90"
                        )}
                    >
                        {task.title}
                    </span>

                    {/* Failure cost — always visible if exists */}
                    {task.failureCost && (
                        <span className={cn("text-[11px] mt-1 block leading-tight font-medium", failureColor, "opacity-80")}>
                            {task.failureCost}
                        </span>
                    )}

                    {/* Compact metadata — always visible */}
                    {hasMetadata && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {showType && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/40 text-[10px] font-medium text-muted-foreground/70">
                                    <span className="text-xs leading-none">{TASK_TYPE_EMOJI[task.taskType!]}</span>
                                    <span className="capitalize">{task.taskType}</span>
                                </span>
                            )}
                            {hasSubtasks && (
                                <span className={cn(
                                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/40 text-[10px] font-medium tabular-nums",
                                    allComplete ? "text-[oklch(0.58_0.10_150)]" : "text-muted-foreground/70"
                                )}>
                                    {completedCount}/{subtaskCount}
                                </span>
                            )}
                            {hasDeps && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/40 text-[10px] font-bold text-blue-400/70">
                                    <GitBranch className="w-2.5 h-2.5" />
                                    {blockingCount}
                                </span>
                            )}
                            {hasLinks && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/40 text-[10px] font-medium text-muted-foreground/70">
                                    <Link2 className="w-2.5 h-2.5" />
                                    {task.links!.length}
                                </span>
                            )}
                            {hasTime && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/40 text-[10px] font-medium text-muted-foreground/70">
                                    <Clock className="w-2.5 h-2.5" />
                                    {formatDuration(task.timeEstimate!)}
                                </span>
                            )}
                            {hasDueDate && (
                                <span className={cn(
                                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium",
                                    isOverdue
                                        ? "bg-destructive/15 text-red-400"
                                        : isDueSoon
                                            ? "bg-amber-400/15 text-amber-400"
                                            : "bg-muted/40 text-muted-foreground/70"
                                )}>
                                    {isOverdue ? <AlertCircle className="w-2.5 h-2.5" /> : <Calendar className="w-2.5 h-2.5" />}
                                    {formatDueDate(task.dueDate!)}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Hover-revealed detail — inline, no extra outer padding */}
                    <AnimatePresence>
                        {isHovered && !isMobile && (hasDescription || canDuplicate) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="overflow-hidden"
                            >
                                {hasDescription && (
                                    <p className="text-[11px] text-muted-foreground/60 leading-tight line-clamp-1 mt-1.5">
                                        {task.description}
                                    </p>
                                )}
                                {canDuplicate && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDuplicateTask(task.id);
                                        }}
                                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-cyan-400/70 hover:text-cyan-300 transition-colors mt-1"
                                    >
                                        <Copy className="w-3 h-3" />
                                        Duplicate to To Do
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Task ID — top right */}
                <span className={cn(
                    "text-[10px] font-mono shrink-0 transition-colors duration-200 select-none",
                    isHovered ? "text-muted-foreground/50" : "text-muted-foreground/20"
                )}>
                    #{task.id.split('-').pop() || task.id}
                </span>
            </div>

        </Card>
    );
}
