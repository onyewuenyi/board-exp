"use client";

import React, { useState } from "react";
import { Task, Priority, TaskType } from "@/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SignalHigh, SignalMedium, SignalLow, Circle, User as UserIcon, Link2, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList, CommandInput, CommandEmpty } from "@/components/ui/command";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ============================================================================
// TASK TYPE CONFIGURATION
// ============================================================================
const TASK_TYPES: Record<TaskType, { emoji: string; label: string; tint: string }> = {
    chore: { emoji: "🧹", label: "Chore", tint: "bg-gray-500/5" },
    errand: { emoji: "🚗", label: "Errand", tint: "bg-blue-500/5" },
    homework: { emoji: "📚", label: "Homework", tint: "bg-purple-500/5" },
    appointment: { emoji: "📅", label: "Appointment", tint: "bg-green-500/5" },
    other: { emoji: "📌", label: "Other", tint: "bg-white/5" },
};

// ============================================================================
// PRIORITY BORDER COLORS
// ============================================================================
const PRIORITY_STYLES: Record<Priority, string> = {
    urgent: "bg-gradient-to-b from-red-500/15 to-transparent border-red-500/15 hover:border-red-500/25",
    high: "bg-gradient-to-b from-orange-500/12 to-transparent border-orange-500/15 hover:border-orange-500/25",
    med: "bg-gradient-to-b from-amber-400/10 to-transparent border-amber-400/12 hover:border-amber-400/20",
    low: "bg-gradient-to-b from-blue-500/10 to-transparent border-blue-500/12 hover:border-blue-500/20",
    none: "bg-white/[0.02] border-white/5 hover:border-white/10",
};

const PRIORITY_LABELS: Record<Priority, string> = {
    urgent: "Urgent",
    high: "High",
    med: "Medium",
    low: "Low",
    none: "No priority",
};

interface TaskCardProps {
    task: Task;
    onUpdatePriority?: (taskId: string, priority: Priority) => void;
    onUpdateStatus?: (taskId: string, status: "todo" | "in-progress" | "done") => void;
    onAddDependency?: (taskId: string, targetId: string, type: "blocking" | "blockedBy") => void;
    allTasks?: { id: string; title: string }[];
}

// Helper to render Priority Icons
const PriorityIcon = ({ priority, className }: { priority: Priority; className?: string }) => {
    switch (priority) {
        case "urgent": return <Zap className={cn("text-red-500", className)} />;
        case "high": return <SignalHigh className={cn("text-orange-500", className)} />;
        case "med": return <SignalMedium className={cn("text-amber-400", className)} />;
        case "low": return <SignalLow className={cn("text-blue-500", className)} />;
        default: return <Circle className={cn("text-muted-foreground border-dashed", className)} />;
    }
};

// Helper for Status Indicator
const StatusIndicator = ({
    status,
    taskId,
    onUpdateStatus
}: {
    status: "todo" | "in-progress" | "done";
    taskId: string;
    onUpdateStatus?: (taskId: string, status: "todo" | "in-progress" | "done") => void;
}) => {
    const isDone = status === "done";
    const colorClass = isDone ? "bg-green-500 border-green-500" : "border-muted-foreground/30 hover:border-foreground/50";
    const statusLabel = status === "in-progress" ? "In Progress" : status === "todo" ? "To Do" : "Done";

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center", // 24px touch target
                        "hover:bg-white/5 transition-all cursor-pointer group/status",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    )}
                    aria-label={`Change status, currently ${statusLabel}`}
                >
                    <div className={cn(
                        "w-4 h-4 rounded-full border-2 transition-all",
                        colorClass,
                        "group-hover/status:scale-110 group-hover/status:shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                    )} />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-0 bg-[#1C1C1E] border-white/10" align="start">
                <Command>
                    <CommandList>
                        <CommandGroup heading="Move to...">
                            {["todo", "in-progress", "done"].map((s) => (
                                <CommandItem
                                    key={s}
                                    onSelect={() => onUpdateStatus?.(taskId, s as "todo" | "in-progress" | "done")}
                                    className="text-xs capitalize"
                                >
                                    {s.replace("-", " ")}
                                    {status === s && <span className="ml-auto">✓</span>}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

// Helper for Dependency Popover
const DependencyPopover = ({
    trigger,
    onSelect,
    tasks,
    placeholder
}: {
    trigger: React.ReactNode;
    onSelect: (taskId: string) => void;
    tasks?: { id: string; title: string }[];
    placeholder: string;
}) => {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {trigger}
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0 bg-[#1C1C1E] border-white/10" align="end">
                <Command className="bg-transparent">
                    <CommandInput placeholder={placeholder} className="h-9 text-xs" />
                    <CommandList>
                        <CommandEmpty>No tasks found.</CommandEmpty>
                        <CommandGroup>
                            {tasks?.map(t => (
                                <CommandItem
                                    key={t.id}
                                    onSelect={() => {
                                        onSelect(t.id);
                                        setOpen(false);
                                    }}
                                    className="text-xs flex items-center gap-2 aria-selected:bg-white/10"
                                >
                                    <span className="font-mono text-muted-foreground mr-2">{t.id}</span>
                                    {t.title}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export function TaskCard({ task, onUpdatePriority, onUpdateStatus, onAddDependency, allTasks }: TaskCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    const otherTasks = allTasks?.filter(t => t.id !== task.id);

    // Count total dependencies
    const totalDeps = (task.blocking?.length || 0) + (task.blockedBy?.length || 0);

    // Format short relative time (e.g., "5d", "2h", "now")
    const getShortTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "now";
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        return `${days}d`;
    };

    return (
        <TooltipProvider>
            <Card
                className={cn(
                    "p-4 transition-all duration-200 ease-out group text-foreground border",
                    "ring-1 ring-inset ring-white/0 hover:ring-white/10",
                    PRIORITY_STYLES[task.priority]
                )}
            >
                {/* Line 1: Status + Title */}
                <div className="flex items-start gap-3">
                    <StatusIndicator status={task.status} taskId={task.id} onUpdateStatus={onUpdateStatus} />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className={cn(
                                "text-[15px] font-medium leading-snug text-foreground/90 flex-1",
                                task.status === "done" && "line-through text-muted-foreground/70"
                            )}>
                                {task.title}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs font-mono">
                            {task.id}
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* Line 2: Compact metadata icons */}
                <div className="flex items-center gap-3 mt-2.5 ml-9">
                    {/* Priority Picker */}
                    <Popover open={isOpen} onOpenChange={setIsOpen}>
                        <PopoverTrigger asChild>
                            <button
                                className={cn(
                                    "flex items-center justify-center w-5 h-5 rounded",
                                    "hover:bg-white/10 transition-colors outline-none",
                                    "focus-visible:ring-1 focus-visible:ring-primary"
                                )}
                                aria-label={`Set priority, currently ${PRIORITY_LABELS[task.priority]}`}
                            >
                                <PriorityIcon priority={task.priority} className="w-3.5 h-3.5" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-0 bg-[#1C1C1E] border-white/10" align="start">
                            <Command className="bg-transparent">
                                <CommandList>
                                    <CommandGroup>
                                        {["urgent", "high", "med", "low", "none"].map((p) => (
                                            <CommandItem
                                                key={p}
                                                value={p}
                                                onSelect={() => {
                                                    onUpdatePriority?.(task.id, p as Priority);
                                                    setIsOpen(false);
                                                }}
                                                className="text-xs flex items-center gap-2 aria-selected:bg-white/10"
                                            >
                                                <PriorityIcon priority={p as Priority} className="w-3.5 h-3.5" />
                                                <span className="capitalize">{p === "none" ? "None" : p}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {/* Assignee Avatar */}
                    {task.assignee ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Avatar className="w-4 h-4 cursor-default">
                                    <AvatarImage src={task.assignee.avatar} />
                                    <AvatarFallback className="text-[8px] bg-accent">{task.assignee.name[0]}</AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                {task.assignee.name}
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center">
                            <UserIcon className="w-2.5 h-2.5 text-muted-foreground/30" />
                        </div>
                    )}

                    {/* Dependencies indicator */}
                    {totalDeps > 0 && (
                        <HoverCard>
                            <HoverCardTrigger>
                                <div className={cn(
                                    "flex items-center gap-0.5 text-[10px] cursor-default",
                                    task.blockedBy && task.blockedBy.length > 0
                                        ? "text-red-400/70"
                                        : "text-blue-400/70"
                                )}>
                                    <Link2 className="w-3 h-3" />
                                    <span>{totalDeps}</span>
                                </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-72 bg-[#1C1C1E] border-white/10 p-3">
                                {task.blocking && task.blocking.length > 0 && (
                                    <div className="mb-3">
                                        <div className="text-[10px] font-medium text-blue-400 mb-1.5">Blocking</div>
                                        <div className="space-y-1">
                                            {task.blocking.map(id => {
                                                const related = allTasks?.find(t => t.id === id);
                                                return (
                                                    <div key={id} className="text-xs text-foreground/80 truncate">
                                                        {related?.title || id}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {task.blockedBy && task.blockedBy.length > 0 && (
                                    <div>
                                        <div className="text-[10px] font-medium text-red-400 mb-1.5">Blocked by</div>
                                        <div className="space-y-1">
                                            {task.blockedBy.map(id => {
                                                const related = allTasks?.find(t => t.id === id);
                                                return (
                                                    <div key={id} className="text-xs text-foreground/80 truncate">
                                                        {related?.title || id}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </HoverCardContent>
                        </HoverCard>
                    )}

                    {/* Tags indicator (collapsed) */}
                    {task.tags && task.tags.length > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground/50 cursor-default">
                                    <span>#</span>
                                    <span>{task.tags.length}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                {task.tags.join(", ")}
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Time */}
                    <span className="text-[10px] text-muted-foreground/40">
                        {getShortTime(task.updatedAt || task.createdAt)}
                    </span>

                    {/* Action buttons - visible on hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DependencyPopover
                            placeholder="Add dependency..."
                            tasks={otherTasks}
                            onSelect={(id) => onAddDependency?.(task.id, id, "blockedBy")}
                            trigger={
                                <button
                                    className={cn(
                                        "text-muted-foreground/50 hover:text-foreground p-1 rounded",
                                        "hover:bg-white/10 transition-colors",
                                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                                    )}
                                    aria-label="Add dependency"
                                >
                                    <Link2 className="w-3 h-3" />
                                </button>
                            }
                        />
                    </div>
                </div>
            </Card>
        </TooltipProvider>
    );
}
