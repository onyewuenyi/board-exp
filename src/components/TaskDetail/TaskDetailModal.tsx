"use client";

import React, { useState, useEffect, useRef } from "react";
import { Task, Priority, TaskType, ColumnType } from "@/types";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList, CommandInput, CommandEmpty } from "@/components/ui/command";
import {
    AlertCircle,
    SignalHigh,
    SignalMedium,
    SignalLow,
    Circle,
    Zap,
    Trash2,
    X,
    Calendar,
    Clock,
    User as UserIcon,
    Link2,
    ChevronDown,
    Check,
    ArrowRight,
    Octagon,
    Hash,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// CONSTANTS
// ============================================================================
const TASK_TYPES: Record<TaskType, { emoji: string; label: string; color: string }> = {
    chore: { emoji: "🧹", label: "Chore", color: "bg-gray-500/20 text-gray-300" },
    errand: { emoji: "🚗", label: "Errand", color: "bg-blue-500/20 text-blue-300" },
    homework: { emoji: "📚", label: "Homework", color: "bg-purple-500/20 text-purple-300" },
    appointment: { emoji: "📅", label: "Appointment", color: "bg-green-500/20 text-green-300" },
    other: { emoji: "📌", label: "Other", color: "bg-white/10 text-white/70" },
};

const PRIORITY_CONFIG: Record<Priority, { icon: typeof Zap; label: string; color: string; bgColor: string }> = {
    urgent: { icon: Zap, label: "Urgent", color: "text-red-400", bgColor: "bg-red-500/20" },
    high: { icon: SignalHigh, label: "High", color: "text-orange-400", bgColor: "bg-orange-500/20" },
    med: { icon: SignalMedium, label: "Medium", color: "text-amber-400", bgColor: "bg-amber-400/20" },
    low: { icon: SignalLow, label: "Low", color: "text-blue-400", bgColor: "bg-blue-500/20" },
    none: { icon: Circle, label: "No priority", color: "text-muted-foreground", bgColor: "bg-white/5" },
};

const STATUS_CONFIG: Record<ColumnType["id"], { label: string; color: string; bgColor: string }> = {
    todo: { label: "To Do", color: "text-muted-foreground", bgColor: "bg-white/5" },
    "in-progress": { label: "In Progress", color: "text-blue-400", bgColor: "bg-blue-500/20" },
    done: { label: "Done", color: "text-green-400", bgColor: "bg-green-500/20" },
};

// ============================================================================
// TYPES
// ============================================================================
interface TaskDetailModalProps {
    task: Task | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    onDeleteTask: (taskId: string) => void;
    onAddDependency: (taskId: string, targetId: string, type: "blocking" | "blockedBy") => void;
    onRemoveDependency: (taskId: string, targetId: string, type: "blocking" | "blockedBy") => void;
    allTasks: Task[];
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================
function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
            {children}
        </span>
    );
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
            <SectionLabel>{label}</SectionLabel>
            {children}
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function TaskDetailModal({
    task,
    open,
    onOpenChange,
    onUpdateTask,
    onDeleteTask,
    onAddDependency,
    onRemoveDependency,
    allTasks,
}: TaskDetailModalProps) {
    const [editingTitle, setEditingTitle] = useState(false);
    const [title, setTitle] = useState(task?.title || "");
    const [description, setDescription] = useState(task?.description || "");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);

    // Sync local state when task changes
    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || "");
        }
    }, [task]);

    // Focus title input when editing
    useEffect(() => {
        if (editingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [editingTitle]);

    if (!task) return null;

    const taskTypeInfo = task.taskType ? TASK_TYPES[task.taskType] : null;
    const priorityConfig = PRIORITY_CONFIG[task.priority];
    const statusConfig = STATUS_CONFIG[task.status];
    const PriorityIcon = priorityConfig.icon;

    // Filter available tasks for dependency selection
    const availableForBlocking = allTasks.filter(
        (t) => t.id !== task.id && !task.blocking?.includes(t.id)
    );
    const availableForBlockedBy = allTasks.filter(
        (t) => t.id !== task.id && !task.blockedBy?.includes(t.id)
    );

    const handleTitleSave = () => {
        if (title.trim() && title !== task.title) {
            onUpdateTask(task.id, { title: title.trim(), updatedAt: Date.now() });
        }
        setEditingTitle(false);
    };

    const handleDescriptionBlur = () => {
        if (description !== (task.description || "")) {
            onUpdateTask(task.id, { description: description || undefined, updatedAt: Date.now() });
        }
    };

    const handleDelete = () => {
        onDeleteTask(task.id);
        onOpenChange(false);
        setShowDeleteConfirm(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-[540px] bg-[#1A1A1C] border-white/10 p-0 gap-0 overflow-hidden"
                showCloseButton={false}
            >
                {/* Header */}
                <DialogHeader className="px-5 pt-5 pb-4 border-b border-white/5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 text-muted-foreground/60">
                            <span className="font-mono text-xs">{task.id}</span>
                            {taskTypeInfo && (
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        "text-[10px] h-5 px-1.5 font-normal border-0",
                                        taskTypeInfo.color
                                    )}
                                >
                                    {taskTypeInfo.emoji} {taskTypeInfo.label}
                                </Badge>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground -mr-1"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Editable Title */}
                    <div className="mt-3">
                        {editingTitle ? (
                            <input
                                ref={titleInputRef}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleTitleSave}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleTitleSave();
                                    if (e.key === "Escape") {
                                        setTitle(task.title);
                                        setEditingTitle(false);
                                    }
                                }}
                                className={cn(
                                    "w-full bg-transparent text-xl font-semibold text-foreground",
                                    "border-b-2 border-primary/50 outline-none",
                                    "placeholder:text-muted-foreground/40"
                                )}
                                placeholder="Task title..."
                            />
                        ) : (
                            <DialogTitle
                                onClick={() => setEditingTitle(true)}
                                className={cn(
                                    "text-xl font-semibold cursor-text hover:text-primary transition-colors",
                                    task.status === "done" && "line-through text-muted-foreground"
                                )}
                            >
                                {task.title}
                            </DialogTitle>
                        )}
                    </div>
                </DialogHeader>

                {/* Content */}
                <div className="px-5 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* Description */}
                    <div className="space-y-2">
                        <SectionLabel>Description</SectionLabel>
                        <textarea
                            ref={descriptionRef}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleDescriptionBlur}
                            placeholder="Add a more detailed description..."
                            rows={3}
                            className={cn(
                                "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5",
                                "text-sm text-foreground placeholder:text-muted-foreground/40",
                                "resize-none outline-none transition-colors",
                                "focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                            )}
                        />
                    </div>

                    {/* Properties Grid */}
                    <div className="bg-white/[0.02] rounded-lg border border-white/5 px-4">
                        {/* Status */}
                        <PropertyRow label="Status">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-7 px-2.5 gap-1.5 text-xs font-medium",
                                            statusConfig.bgColor,
                                            statusConfig.color,
                                            "hover:opacity-80"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "w-2 h-2 rounded-full",
                                                task.status === "done" ? "bg-green-500" : "border-2 border-current"
                                            )}
                                        />
                                        {statusConfig.label}
                                        <ChevronDown className="w-3 h-3 opacity-60" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-40 p-1 bg-[#1C1C1E] border-white/10" align="end">
                                    {(["todo", "in-progress", "done"] as const).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => onUpdateTask(task.id, { status: s, updatedAt: Date.now() })}
                                            className={cn(
                                                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs",
                                                "hover:bg-white/10 transition-colors",
                                                task.status === s && "bg-white/5"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    s === "done"
                                                        ? "bg-green-500"
                                                        : s === "in-progress"
                                                        ? "border-2 border-blue-400"
                                                        : "border-2 border-muted-foreground/30"
                                                )}
                                            />
                                            {STATUS_CONFIG[s].label}
                                            {task.status === s && <Check className="w-3 h-3 ml-auto" />}
                                        </button>
                                    ))}
                                </PopoverContent>
                            </Popover>
                        </PropertyRow>

                        {/* Priority */}
                        <PropertyRow label="Priority">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-7 px-2.5 gap-1.5 text-xs font-medium",
                                            priorityConfig.bgColor,
                                            priorityConfig.color,
                                            "hover:opacity-80"
                                        )}
                                    >
                                        <PriorityIcon className="w-3.5 h-3.5" />
                                        {priorityConfig.label}
                                        <ChevronDown className="w-3 h-3 opacity-60" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-44 p-1 bg-[#1C1C1E] border-white/10" align="end">
                                    {(["none", "urgent", "high", "med", "low"] as const).map((p) => {
                                        const config = PRIORITY_CONFIG[p];
                                        const Icon = config.icon;
                                        return (
                                            <button
                                                key={p}
                                                onClick={() => onUpdateTask(task.id, { priority: p, updatedAt: Date.now() })}
                                                className={cn(
                                                    "w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs",
                                                    "hover:bg-white/10 transition-colors",
                                                    task.priority === p && "bg-white/5"
                                                )}
                                            >
                                                <Icon className={cn("w-3.5 h-3.5", config.color)} />
                                                {config.label}
                                                {task.priority === p && <Check className="w-3 h-3 ml-auto" />}
                                            </button>
                                        );
                                    })}
                                </PopoverContent>
                            </Popover>
                        </PropertyRow>

                        {/* Task Type */}
                        <PropertyRow label="Type">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-7 px-2.5 gap-1.5 text-xs font-medium",
                                            taskTypeInfo?.color || "bg-white/5 text-muted-foreground",
                                            "hover:opacity-80"
                                        )}
                                    >
                                        {taskTypeInfo?.emoji || "📌"} {taskTypeInfo?.label || "Other"}
                                        <ChevronDown className="w-3 h-3 opacity-60" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-44 p-1 bg-[#1C1C1E] border-white/10" align="end">
                                    {(Object.entries(TASK_TYPES) as [TaskType, typeof TASK_TYPES[TaskType]][]).map(
                                        ([type, info]) => (
                                            <button
                                                key={type}
                                                onClick={() => onUpdateTask(task.id, { taskType: type, updatedAt: Date.now() })}
                                                className={cn(
                                                    "w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs",
                                                    "hover:bg-white/10 transition-colors",
                                                    task.taskType === type && "bg-white/5"
                                                )}
                                            >
                                                <span>{info.emoji}</span>
                                                {info.label}
                                                {task.taskType === type && <Check className="w-3 h-3 ml-auto" />}
                                            </button>
                                        )
                                    )}
                                </PopoverContent>
                            </Popover>
                        </PropertyRow>

                        {/* Assignee */}
                        <PropertyRow label="Assignee">
                            {task.assignee ? (
                                <div className="flex items-center gap-2">
                                    <Avatar className="w-5 h-5">
                                        <AvatarImage src={task.assignee.avatar} />
                                        <AvatarFallback className="text-[9px] bg-accent">
                                            {task.assignee.name[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-foreground">{task.assignee.name}</span>
                                </div>
                            ) : (
                                <span className="text-xs text-muted-foreground/50">Unassigned</span>
                            )}
                        </PropertyRow>
                    </div>

                    {/* Dependencies */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <SectionLabel>Dependencies</SectionLabel>
                        </div>

                        {/* Blocking */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-xs text-blue-400 font-medium">Blocking</span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground ml-auto"
                                        >
                                            + Add
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-0 bg-[#1C1C1E] border-white/10" align="end">
                                        <Command className="bg-transparent">
                                            <CommandInput placeholder="Search tasks..." className="h-9 text-xs" />
                                            <CommandList>
                                                <CommandEmpty>No tasks found.</CommandEmpty>
                                                <CommandGroup>
                                                    {availableForBlocking.map((t) => (
                                                        <CommandItem
                                                            key={t.id}
                                                            onSelect={() => onAddDependency(task.id, t.id, "blocking")}
                                                            className="text-xs"
                                                        >
                                                            <span className="font-mono text-muted-foreground mr-2">
                                                                {t.id}
                                                            </span>
                                                            <span className="truncate">{t.title}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <AnimatePresence>
                                {task.blocking && task.blocking.length > 0 ? (
                                    <div className="space-y-1.5 pl-5">
                                        {task.blocking.map((id) => {
                                            const blockedTask = allTasks.find((t) => t.id === id);
                                            return (
                                                <motion.div
                                                    key={id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -10 }}
                                                    className="flex items-center gap-2 py-1.5 px-2 rounded bg-blue-500/10 border border-blue-500/20 group"
                                                >
                                                    <span className="font-mono text-[10px] text-blue-400">{id}</span>
                                                    <span className="text-xs text-foreground/80 truncate flex-1">
                                                        {blockedTask?.title || "Unknown"}
                                                    </span>
                                                    <button
                                                        onClick={() => onRemoveDependency(task.id, id, "blocking")}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground/40 pl-5">
                                        Not blocking any tasks
                                    </p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Blocked By */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Octagon className="w-3.5 h-3.5 text-red-400" />
                                <span className="text-xs text-red-400 font-medium">Blocked by</span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground ml-auto"
                                        >
                                            + Add
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-0 bg-[#1C1C1E] border-white/10" align="end">
                                        <Command className="bg-transparent">
                                            <CommandInput placeholder="Search tasks..." className="h-9 text-xs" />
                                            <CommandList>
                                                <CommandEmpty>No tasks found.</CommandEmpty>
                                                <CommandGroup>
                                                    {availableForBlockedBy.map((t) => (
                                                        <CommandItem
                                                            key={t.id}
                                                            onSelect={() => onAddDependency(task.id, t.id, "blockedBy")}
                                                            className="text-xs"
                                                        >
                                                            <span className="font-mono text-muted-foreground mr-2">
                                                                {t.id}
                                                            </span>
                                                            <span className="truncate">{t.title}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <AnimatePresence>
                                {task.blockedBy && task.blockedBy.length > 0 ? (
                                    <div className="space-y-1.5 pl-5">
                                        {task.blockedBy.map((id) => {
                                            const blockingTask = allTasks.find((t) => t.id === id);
                                            return (
                                                <motion.div
                                                    key={id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -10 }}
                                                    className="flex items-center gap-2 py-1.5 px-2 rounded bg-red-500/10 border border-red-500/20 group"
                                                >
                                                    <span className="font-mono text-[10px] text-red-400">{id}</span>
                                                    <span className="text-xs text-foreground/80 truncate flex-1">
                                                        {blockingTask?.title || "Unknown"}
                                                    </span>
                                                    <button
                                                        onClick={() => onRemoveDependency(task.id, id, "blockedBy")}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground/40 pl-5">
                                        Not blocked by any tasks
                                    </p>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="pt-3 border-t border-white/5 space-y-2">
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground/50">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                <span>Created {formatRelativeTime(task.createdAt)}</span>
                            </div>
                            {task.updatedAt && task.updatedAt !== task.createdAt && (
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    <span>Updated {formatRelativeTime(task.updatedAt)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02]">
                    <AnimatePresence mode="wait">
                        {showDeleteConfirm ? (
                            <motion.div
                                key="confirm"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="flex items-center justify-between"
                            >
                                <span className="text-xs text-red-400">Delete this task?</span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => setShowDeleteConfirm(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={handleDelete}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="default"
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="flex justify-between"
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-muted-foreground hover:text-red-400 gap-1.5"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete task
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Close
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}
