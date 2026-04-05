"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Task, Priority } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBoardStore } from "@/stores/boardStore";

const PRIORITY_DOT: Record<Priority, string> = {
    urgent: "bg-priority-urgent",
    high: "bg-priority-high",
    med: "bg-priority-med",
    low: "bg-priority-low",
    none: "bg-muted-foreground/20",
};

const NEXT_STATUS: Record<string, "todo" | "in-progress" | "done"> = {
    "todo": "in-progress",
    "in-progress": "done",
    "done": "done",
};

interface WeekTaskRowProps {
    task: Task;
    isOverdue?: boolean;
    onClick: () => void;
}

export function WeekTaskRow({ task, isOverdue, onClick }: WeekTaskRowProps) {
    const handleUpdateStatus = useBoardStore((state) => state.handleUpdateStatus);
    const assignees = task.assignees?.length > 0 ? task.assignees : task.assignee ? [task.assignee] : [];
    const isDone = task.status === "done";
    const [pulse, setPulse] = useState(false);

    const handleCycle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isDone) return;
        setPulse(true);
        handleUpdateStatus(task.id, NEXT_STATUS[task.status]);
        setTimeout(() => setPulse(false), 400);
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left",
                "transition-all duration-150 hover:bg-card-hover",
                isDone && "opacity-50"
            )}
        >
            {/* Status cycle button */}
            <motion.div
                animate={pulse ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="shrink-0"
            >
                <div
                    onClick={handleCycle}
                    className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200",
                        isDone
                            ? "bg-[oklch(0.58_0.10_150)] text-white"
                            : task.status === "in-progress"
                                ? "border-2 border-blue-400/50 hover:border-blue-400 text-blue-400"
                                : "border-2 border-muted-foreground/20 hover:border-accent-linear"
                    )}
                    title={isDone ? "Done" : task.status === "in-progress" ? "Click: mark done" : "Click: start"}
                >
                    {isDone && <CheckCircle2 className="w-3 h-3" />}
                    {task.status === "in-progress" && <Clock className="w-2.5 h-2.5" />}
                </div>
            </motion.div>

            {/* Priority dot */}
            <div className={cn("w-2 h-2 rounded-full shrink-0", PRIORITY_DOT[task.priority])} />

            {/* Title */}
            <span className={cn(
                "min-w-0 text-sm font-medium truncate flex-1 max-w-[40%]",
                isDone
                    ? "line-through text-muted-foreground/50"
                    : "text-foreground/90"
            )}>
                {task.title}
            </span>

            {/* Consequence */}
            {task.failureCost ? (
                <span className="flex-1 min-w-0 truncate text-[11px] font-medium text-amber-400/50">
                    → {task.failureCost}
                </span>
            ) : (
                <span className="flex-1" />
            )}

            {/* Assignees */}
            {assignees.length > 0 ? (
                <div className="flex -space-x-1.5 shrink-0">
                    {assignees.slice(0, 2).map(u => (
                        <Avatar key={u.id} className="w-6 h-6 ring-1 ring-background">
                            <AvatarImage src={u.avatar} />
                            <AvatarFallback className="text-[8px] bg-accent">
                                {u.name[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    ))}
                </div>
            ) : (
                <div className="w-6 h-6 rounded-full bg-muted/30 flex items-center justify-center shrink-0">
                    <UserIcon className="w-3 h-3 text-muted-foreground/30" />
                </div>
            )}
        </button>
    );
}
