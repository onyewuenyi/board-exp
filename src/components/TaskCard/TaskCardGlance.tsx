"use client";

import React from "react";
import { Task, TaskType } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Link2, Clock, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TASK TYPE EMOJI MAP
// ============================================================================
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

interface TaskCardGlanceProps {
    task: Task;
    isExpanded: boolean;
    isHovered: boolean;
}

export function TaskCardGlance({ task, isExpanded, isHovered }: TaskCardGlanceProps) {
    const failureColor = task.priority === "urgent" || task.priority === "high"
        ? "text-red-400"
        : "text-amber-400/90";

    const assignees = task.assignees?.length > 0 ? task.assignees : task.assignee ? [task.assignee] : [];

    // Subtask progress
    const subtaskCount = task.subtasks?.length || 0;
    const completedCount = task.subtasks?.filter(s => s.completed).length || 0;
    const hasSubtasks = subtaskCount > 0;
    const allComplete = hasSubtasks && completedCount === subtaskCount;

    // Task type
    const showType = task.taskType && task.taskType !== "other";

    // Metadata
    const hasLinks = task.links && task.links.length > 0;
    const hasTime = task.timeEstimate && task.timeEstimate > 0;
    const blockingCount = task.blocking?.length || 0;
    const hasDeps = blockingCount > 0;

    const hasMetadata = showType || hasSubtasks || hasLinks || hasTime || hasDeps;

    return (
        <div className="flex items-start gap-3 p-3.5 relative">
            {/* Assignee Avatars */}
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
                            <span className="text-[10px] font-medium text-muted-foreground">
                                +{assignees.length - 3}
                            </span>
                        </div>
                    )}
                </div>
            ) : (
                <Avatar className="w-8 h-8 shrink-0 ring-2 ring-background shadow-sm">
                    <AvatarFallback className="bg-muted">
                        <User className="w-4 h-4 text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>
            )}

            {/* Title + Failure Cost + Metadata */}
            <div className="flex-1 min-w-0 pr-6">
                <span
                    className={cn(
                        "text-[15px] font-medium leading-snug block transition-colors duration-200",
                        task.status === "done"
                            ? "line-through text-muted-foreground/60"
                            : isHovered ? "text-foreground" : "text-foreground/90"
                    )}
                >
                    {task.title}
                </span>

                {/* Failure Cost */}
                {task.failureCost && (
                    <span className={cn(
                        "text-[11px] mt-1 block leading-tight font-medium transition-opacity duration-300",
                        failureColor,
                        !isHovered && "opacity-80"
                    )}>
                        {task.failureCost}
                    </span>
                )}

                {/* Bottom metadata row — all badges unified */}
                {hasMetadata && (
                    <div className={cn(
                        "flex items-center gap-2 mt-2 flex-wrap transition-opacity duration-200",
                        !isHovered && "opacity-60"
                    )}>
                        {/* Task Type */}
                        {showType && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50 text-[10px] font-medium text-muted-foreground">
                                <span className="text-xs leading-none">{TASK_TYPE_EMOJI[task.taskType!]}</span>
                                <span className="capitalize">{task.taskType}</span>
                            </span>
                        )}

                        {/* Subtask Progress */}
                        {hasSubtasks && (
                            <div className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-muted/50">
                                <div className="flex items-center gap-px">
                                    {task.subtasks!.map((st, i) => (
                                        <div
                                            key={st.id || i}
                                            className={cn(
                                                "w-1.5 h-3 rounded-[1px] transition-colors duration-300",
                                                st.completed
                                                    ? "bg-[oklch(0.58_0.10_150)]"
                                                    : "bg-muted-foreground/15"
                                            )}
                                        />
                                    ))}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-medium tabular-nums",
                                    allComplete ? "text-[oklch(0.58_0.10_150)]" : "text-muted-foreground"
                                )}>
                                    {completedCount}/{subtaskCount}
                                </span>
                            </div>
                        )}

                        {/* Links */}
                        {hasLinks && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50 text-[10px] font-medium text-muted-foreground">
                                <Link2 className="w-3 h-3" />
                                <span>{task.links!.length}</span>
                            </span>
                        )}

                        {/* Time */}
                        {hasTime && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50 text-[10px] font-medium text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{formatDuration(task.timeEstimate!)}</span>
                            </span>
                        )}

                        {/* Dependencies */}
                        {hasDeps && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50 text-[10px] font-bold text-blue-400/80">
                                <GitBranch className="w-3 h-3" />
                                <span>{blockingCount}</span>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Task ID */}
            <span className={cn(
                "absolute top-3.5 right-3.5 text-[10px] font-mono transition-all duration-300 select-none",
                isHovered ? "text-muted-foreground/60 scale-105" : "text-muted-foreground/20"
            )}>
                #{task.id.split('-').pop() || task.id}
            </span>
        </div>
    );
}
