"use client";

import React from "react";
import { Task } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardGlanceProps {
    task: Task;
    isExpanded: boolean;
}

export function TaskCardGlance({ task, isExpanded }: TaskCardGlanceProps) {
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
                        "text-[15px] font-medium leading-snug block",
                        task.status === "done" && "line-through text-muted-foreground"
                    )}
                >
                    {task.title}
                </span>

                {/* Failure Cost - Only if exists */}
                {task.failureCost && (
                    <span className="text-xs text-red-400/80 mt-1 block leading-tight font-medium">
                        {task.failureCost}
                    </span>
                )}
            </div>

            {/* Task ID - Faint and subtle */}
            <span className="absolute top-3.5 right-3.5 text-[10px] font-mono text-muted-foreground/20 select-none">
                #{task.id.split('-').pop() || task.id}
            </span>
        </div>
    );
}
