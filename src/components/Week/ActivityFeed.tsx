"use client";

import React from "react";
import { Task } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, CheckCircle2, Circle, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditingTask } from "@/stores/boardStore";

function timeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "yesterday";
    return `${days}d ago`;
}

const STATUS_ICON = {
    "todo": Circle,
    "in-progress": Clock,
    "done": CheckCircle2,
};

const STATUS_COLOR = {
    "todo": "text-muted-foreground",
    "in-progress": "text-blue-400",
    "done": "text-[oklch(0.58_0.10_150)]",
};

const STATUS_BG = {
    "todo": "bg-muted/30",
    "in-progress": "bg-blue-400/10",
    "done": "bg-[oklch(0.58_0.10_150_/_0.1)]",
};

interface ActivityFeedProps {
    tasks: Task[];
}

export function ActivityFeed({ tasks }: ActivityFeedProps) {
    const { openTaskEditor } = useEditingTask();

    return (
        <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/40 px-3 pt-1 pb-3">
                Recent Activity
            </h3>

            {tasks.length === 0 ? (
                <p className="px-3 py-8 text-xs text-muted-foreground/25 text-center">
                    No recent activity
                </p>
            ) : (
                <div className="space-y-1">
                    {tasks.map(task => {
                        const assignees = task.assignees?.length > 0 ? task.assignees : task.assignee ? [task.assignee] : [];
                        const StatusIcon = STATUS_ICON[task.status];
                        const statusColor = STATUS_COLOR[task.status];
                        const statusBg = STATUS_BG[task.status];

                        return (
                            <button
                                key={task.id}
                                onClick={() => openTaskEditor(task.id)}
                                className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg hover:bg-muted/20 transition-colors text-left group"
                            >
                                {/* Status icon with colored background */}
                                <div className={cn(
                                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                                    statusBg
                                )}>
                                    <StatusIcon className={cn("w-3.5 h-3.5", statusColor)} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] text-foreground/80 truncate group-hover:text-foreground transition-colors">
                                        {task.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {/* Assignee */}
                                        {assignees.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Avatar className="w-4 h-4">
                                                    <AvatarImage src={assignees[0].avatar} />
                                                    <AvatarFallback className="text-[6px] bg-accent">
                                                        {assignees[0].name[0]?.toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-[10px] text-muted-foreground/40">
                                                    {assignees[0].firstName || assignees[0].name.split(" ")[0]}
                                                </span>
                                            </div>
                                        )}
                                        <span className="text-[10px] text-muted-foreground/20">·</span>
                                        <span className="text-[10px] text-muted-foreground/30">
                                            {task.updatedAt ? timeAgo(task.updatedAt) : ""}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
