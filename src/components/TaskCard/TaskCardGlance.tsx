"use client";

import React from "react";
import { Task } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardGlanceProps {
    task: Task;
    isExpanded: boolean;
    isHovered: boolean;
}

export function TaskCardGlance({ task, isExpanded, isHovered }: TaskCardGlanceProps) {
    // Failure cost color based on priority
    const failureColor = task.priority === "urgent" || task.priority === "high"
        ? "text-red-400"
        : "text-amber-400/90";

    return (
        <div className="flex items-start gap-3 p-3.5 relative">
            {/* Owner Avatar - Large (32px) */}
            <Avatar className="w-8 h-8 shrink-0 ring-2 ring-background shadow-sm">
                {task.assignee ? (
                    <>
                        <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs font-medium">
                            {task.assignee.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </>
                ) : (
                    <AvatarFallback className="bg-muted">
                        <User className="w-4 h-4 text-muted-foreground" />
                    </AvatarFallback>
                )}
            </Avatar>

            {/* Title + Failure Cost */}
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

                {/* Failure Cost - Only if exists */}
                {task.failureCost && (
                    <span className={cn(
                        "text-[11px] mt-1 block leading-tight font-medium transition-opacity duration-300",
                        failureColor,
                        !isHovered && "opacity-80"
                    )}>
                        {task.failureCost}
                    </span>
                )}
            </div>

            {/* Task ID - Faint and subtle, lights up on hover */}
            <span className={cn(
                "absolute top-3.5 right-3.5 text-[10px] font-mono transition-all duration-300 select-none",
                isHovered ? "text-muted-foreground/60 scale-105" : "text-muted-foreground/20"
            )}>
                #{task.id.split('-').pop() || task.id}
            </span>
        </div>
    );
}
