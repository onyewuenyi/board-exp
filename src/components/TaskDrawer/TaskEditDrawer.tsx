"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2,
    Check,
    Plus,
    X,
    AlertTriangle,
    FileText,
    ListTodo,
    GitBranch,
    Trash2,
    Circle,
    Clock,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Task, TaskType, User, Subtask, Priority } from "@/types";
import { AssigneePicker } from "@/components/Pickers/AssigneePicker";
import { TaskTypePicker } from "@/components/Pickers/TaskTypePicker";
import { DatePicker } from "@/components/Pickers/DatePicker";
import { DependencyPicker } from "@/components/Pickers/DependencyPicker";
import { PriorityPicker } from "@/components/Pickers/PriorityPicker";
import { useSmartOwnerDefault } from "@/hooks/useSmartOwnerDefault";

// ============================================================================
// TYPES
// ============================================================================
export interface TaskFormData {
    title: string;
    assignee: User | null;
    dueDate: Date | null;
    taskType: TaskType;
    priority: Priority;
    status: "todo" | "in-progress" | "done";
    description: string;
    failureCost: string;
    subtasks: Omit<Subtask, "id">[];
    blocking: string[];
    blockedBy: string[];
}

interface TaskEditDrawerProps {
    mode: "create" | "edit";
    task?: Task;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: TaskFormData) => Promise<void>;
    onDelete?: () => void;
    availableUsers: User[];
    availableTasks: Task[];
}

// ============================================================================
// STATUS PICKER COMPONENT (INTERNAL)
// ============================================================================
function StatusPicker({
    value,
    onChange
}: {
    value: "todo" | "in-progress" | "done";
    onChange: (val: "todo" | "in-progress" | "done") => void;
}) {
    const statuses = [
        { id: "todo", label: "To Do", icon: Circle, color: "text-muted-foreground" },
        { id: "in-progress", label: "In Progress", icon: Clock, color: "text-blue-400" },
        { id: "done", label: "Done", icon: CheckCircle2, color: "text-green-500" }
    ] as const;

    const current = statuses.find(s => s.id === value) || statuses[0];

    return (
        <div className="flex bg-muted/50 p-0.5 rounded-full border border-border/50">
            {statuses.map(s => {
                const Icon = s.icon;
                const isActive = value === s.id;
                return (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => onChange(s.id)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200",
                            isActive
                                ? "bg-card text-foreground shadow-sm ring-1 ring-border/50"
                                : "text-muted-foreground hover:text-foreground hover:bg-card/30"
                        )}
                    >
                        <Icon className={cn("w-3.5 h-3.5", isActive ? s.color : "text-muted-foreground/50")} />
                        {s.label}
                    </button>
                );
            })}
        </div>
    );
}

// ============================================================================
// SECTION HEADER COMPONENT
// ============================================================================
function SectionHeader({
    icon,
    title,
    iconColor = "text-muted-foreground"
}: {
    icon: React.ReactNode;
    title: string;
    iconColor?: string;
}) {
    return (
        <div className="flex items-center gap-2 mb-2">
            <span className={cn("w-4 h-4", iconColor)}>{icon}</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {title}
            </span>
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function TaskEditDrawer({
    mode,
    task,
    open,
    onOpenChange,
    onSave,
    onDelete,
    availableUsers,
    availableTasks,
}: TaskEditDrawerProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const { defaultOwner, saveLastUsed } = useSmartOwnerDefault(availableUsers);

    // Form state
    const [title, setTitle] = useState("");
    const [assignee, setAssignee] = useState<User | null>(null);
    const [status, setStatus] = useState<"todo" | "in-progress" | "done">("todo");
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [taskType, setTaskType] = useState<TaskType>("other");
    const [priority, setPriority] = useState<Priority>("none");
    const [description, setDescription] = useState("");
    const [failureCost, setFailureCost] = useState("");
    const [subtasks, setSubtasks] = useState<Omit<Subtask, "id">[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [blocking, setBlocking] = useState<string[]>([]);
    const [blockedBy, setBlockedBy] = useState<string[]>([]);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTimer, setDeleteTimer] = useState<NodeJS.Timeout | null>(null);

    // Initial state for dirty check
    const initialState = useMemo(() => {
        if (mode === "edit" && task) {
            return {
                title: task.title,
                assignee: task.assignee || null,
                status: task.status,
                dueDate: null,
                taskType: task.taskType || "other",
                priority: task.priority || "none",
                description: task.description || "",
                failureCost: task.failureCost || "",
                subtasks: task.subtasks?.map(s => ({ title: s.title, completed: s.completed })) || [],
                blocking: task.blocking || [],
                blockedBy: task.blockedBy || []
            };
        }
        return {
            title: "",
            assignee: defaultOwner,
            status: "todo" as const,
            dueDate: null,
            taskType: "other" as TaskType,
            priority: "none" as Priority,
            description: "",
            failureCost: "",
            subtasks: [],
            blocking: [],
            blockedBy: []
        };
    }, [mode, task, defaultOwner, open]);

    // Simple dirty check
    const isDirty = title !== initialState.title ||
        assignee?.id !== initialState.assignee?.id ||
        status !== initialState.status ||
        taskType !== initialState.taskType ||
        priority !== initialState.priority ||
        description !== initialState.description ||
        failureCost !== initialState.failureCost ||
        subtasks.length !== initialState.subtasks.length;

    // Reset form when drawer opens/closes or task changes
    useEffect(() => {
        if (open) {
            const s = initialState;
            setTitle(s.title);
            setAssignee(s.assignee);
            setStatus(s.status);
            setDueDate(s.dueDate);
            setTaskType(s.taskType);
            setPriority(s.priority);
            setDescription(s.description);
            setFailureCost(s.failureCost);
            setSubtasks(s.subtasks);
            setBlocking(s.blocking);
            setBlockedBy(s.blockedBy);

            setShowSuccess(false);
            setShowDeleteConfirm(false);
            setNewSubtaskTitle("");

            // Focus input
            setTimeout(() => inputRef.current?.focus(), 150);
        }
        return () => {
            if (deleteTimer) clearTimeout(deleteTimer);
        };
    }, [open, mode, task, initialState]);

    // Handle escape key
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (showDeleteConfirm) {
                    setShowDeleteConfirm(false);
                } else {
                    onOpenChange(false);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onOpenChange, showDeleteConfirm]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!title.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSave({
                title: title.trim(),
                assignee,
                status,
                dueDate,
                taskType,
                priority,
                description: description.trim(),
                failureCost: failureCost.trim(),
                subtasks,
                blocking,
                blockedBy,
            });

            if (assignee) {
                saveLastUsed(assignee);
            }

            setShowSuccess(true);
            setTimeout(() => {
                onOpenChange(false);
            }, 500);
        } catch (error) {
            console.error("Failed to save task:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (showDeleteConfirm) {
            onDelete?.();
            onOpenChange(false);
        } else {
            setShowDeleteConfirm(true);
            // Reset delete confirmation after 4 seconds
            const timer = setTimeout(() => {
                setShowDeleteConfirm(false);
            }, 4000);
            setDeleteTimer(timer);
        }
    };

    const handleAddSubtask = () => {
        if (newSubtaskTitle.trim()) {
            setSubtasks([...subtasks, { title: newSubtaskTitle.trim(), completed: false }]);
            setNewSubtaskTitle("");
        }
    };

    const handleRemoveSubtask = (index: number) => {
        setSubtasks(subtasks.filter((_, i) => i !== index));
    };

    const filteredAvailableTasks = task
        ? availableTasks.filter(t => t.id !== task.id)
        : availableTasks;

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
                        onClick={() => onOpenChange(false)}
                    />

                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 32,
                        }}
                        className="fixed top-0 right-0 h-full w-[440px] max-w-[95vw] bg-card border-l border-border shadow-2xl z-50 flex flex-col"
                    >
                        <form onSubmit={handleSubmit} className="flex flex-col h-full">
                            {/* Header */}
                            <div className="px-6 pt-6 pb-4 border-b border-border/30 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-base font-semibold tracking-tight">
                                        {mode === "create" ? "New Task" : "Edit Task"}
                                    </h2>
                                    {isDirty && !showSuccess && (
                                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {mode === "edit" && onDelete && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "h-8 px-3 text-xs font-medium transition-colors",
                                                showDeleteConfirm
                                                    ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                                    : "text-muted-foreground hover:text-red-400 hover:bg-red-400/5"
                                            )}
                                            onClick={handleDelete}
                                        >
                                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                            {showDeleteConfirm ? "Click to Confirm" : "Delete"}
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                        onClick={() => onOpenChange(false)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Scrollable content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {/* Status Picker Row */}
                                <div className="px-6 pt-5">
                                    <StatusPicker value={status} onChange={setStatus} />
                                </div>

                                {/* Title Input */}
                                <div className="px-6 pt-5 pb-4">
                                    <div className="relative group">
                                        <input
                                            ref={inputRef}
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Task title..."
                                            disabled={isSubmitting || showSuccess}
                                            className={cn(
                                                "w-full bg-transparent border-none p-0",
                                                "text-xl font-semibold text-foreground placeholder:text-muted-foreground/30",
                                                "outline-none transition-all duration-200",
                                                "disabled:opacity-50"
                                            )}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSubmit();
                                                }
                                            }}
                                        />
                                        <div className="h-0.5 w-0 group-focus-within:w-full bg-accent-linear transition-all duration-300 mt-1" />

                                        {/* Success checkmark overlay */}
                                        <AnimatePresence>
                                            {showSuccess && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute inset-0 flex items-center justify-center bg-card/95 rounded-lg z-10"
                                                >
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                                        className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center"
                                                    >
                                                        <Check className="w-6 h-6 text-green-500" />
                                                    </motion.div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Primary Metadata Row */}
                                <div className="px-6 pb-6 mt-2">
                                    <div className="flex flex-wrap gap-2.5">
                                        <AssigneePicker
                                            value={assignee}
                                            onChange={setAssignee}
                                            users={availableUsers}
                                        />
                                        <DatePicker
                                            value={dueDate}
                                            onChange={setDueDate}
                                            placeholder="Set date"
                                        />
                                        <TaskTypePicker
                                            value={taskType}
                                            onChange={setTaskType}
                                        />
                                        <PriorityPicker
                                            value={priority}
                                            onChange={setPriority}
                                        />
                                    </div>
                                </div>

                                <div className="mx-6 border-t border-border/20" />

                                {/* Form Fields */}
                                <div className="px-6 py-6 space-y-7">
                                    {/* If not done / Failure cost */}
                                    <div>
                                        <SectionHeader
                                            icon={<AlertTriangle className="w-4 h-4" />}
                                            title="Consequence"
                                            iconColor="text-amber-400"
                                        />
                                        <textarea
                                            value={failureCost}
                                            onChange={(e) => setFailureCost(e.target.value)}
                                            placeholder="What happens if this doesn't get done? e.g., 'Dinner will be late'"
                                            className={cn(
                                                "w-full bg-muted/20 border border-border/30 rounded-xl px-4 py-3",
                                                "text-sm text-foreground placeholder:text-muted-foreground/30",
                                                "outline-none resize-none transition-all duration-200",
                                                "focus:bg-muted/40 focus:border-accent-linear/40 focus:ring-1 focus:ring-accent-linear/10",
                                                "min-h-[70px]"
                                            )}
                                            rows={2}
                                        />
                                    </div>

                                    {/* Notes / Description */}
                                    <div>
                                        <SectionHeader
                                            icon={<FileText className="w-4 h-4" />}
                                            title="Notes"
                                            iconColor="text-blue-400"
                                        />
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Context or instructions..."
                                            className={cn(
                                                "w-full bg-muted/20 border border-border/30 rounded-xl px-4 py-3",
                                                "text-sm text-foreground placeholder:text-muted-foreground/30",
                                                "outline-none resize-none transition-all duration-200",
                                                "focus:bg-muted/40 focus:border-accent-linear/40 focus:ring-1 focus:ring-accent-linear/10",
                                                "min-h-[100px]"
                                            )}
                                            rows={3}
                                        />
                                    </div>

                                    {/* Subtasks */}
                                    <div>
                                        <SectionHeader
                                            icon={<ListTodo className="w-4 h-4" />}
                                            title="Subtasks"
                                            iconColor="text-purple-400"
                                        />
                                        <div className="space-y-2">
                                            {subtasks.map((subtask, index) => (
                                                <motion.div
                                                    layout
                                                    key={`${index}-${subtask.title}`}
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="flex items-center gap-3 px-4 py-2.5 bg-muted/20 border border-border/30 rounded-xl text-sm group"
                                                >
                                                    <div className="w-4 h-4 rounded border-2 border-border/70 shrink-0" />
                                                    <span className="flex-1 text-foreground font-medium">{subtask.title}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveSubtask(index)}
                                                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </motion.div>
                                            ))}

                                            <div className="flex items-center gap-3 px-4 py-2 bg-muted/10 border border-border/20 border-dashed rounded-xl focus-within:bg-muted/20 focus-within:border-accent-linear/30 transition-all duration-200">
                                                <Plus className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                                                <input
                                                    value={newSubtaskTitle}
                                                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                                    placeholder="Add subtask..."
                                                    className="flex-1 bg-transparent py-2 text-sm placeholder:text-muted-foreground/30 focus:outline-none"
                                                    onKeyDown={(e) => {
                                                        e.stopPropagation();
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleAddSubtask();
                                                        }
                                                    }}
                                                />
                                                {newSubtaskTitle.trim() && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-3 text-[11px] font-bold text-accent-linear uppercase"
                                                        onClick={handleAddSubtask}
                                                    >
                                                        Add
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dependencies */}
                                    <div className="pb-8">
                                        <SectionHeader
                                            icon={<GitBranch className="w-4 h-4" />}
                                            title="Dependencies"
                                            iconColor="text-green-400"
                                        />
                                        <div className="space-y-5">
                                            <div>
                                                <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-tighter mb-2 ml-1">
                                                    Blocked by
                                                </p>
                                                <DependencyPicker
                                                    type="blockedBy"
                                                    selectedIds={blockedBy}
                                                    onChange={setBlockedBy}
                                                    availableTasks={filteredAvailableTasks}
                                                />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-tighter mb-2 ml-1">
                                                    Blocks
                                                </p>
                                                <DependencyPicker
                                                    type="blocking"
                                                    selectedIds={blocking}
                                                    onChange={setBlocking}
                                                    availableTasks={filteredAvailableTasks}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-5 border-t border-border/30 bg-card/80 backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                                            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[9px] font-mono border border-border/50">↵</kbd>
                                            to save
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1 mt-0.5">
                                            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[9px] font-mono border border-border/50">Esc</kbd>
                                            to cancel
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-10 px-5 text-sm font-medium"
                                            onClick={() => onOpenChange(false)}
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            size="sm"
                                            className={cn(
                                                "h-10 px-6 text-sm font-bold tracking-tight shadow-md",
                                                "bg-accent-linear text-white",
                                                "hover:bg-[oklch(0.60_0.17_280)] hover:shadow-lg transition-all",
                                                "disabled:opacity-50"
                                            )}
                                            disabled={!title.trim() || isSubmitting || showSuccess || (!isDirty && mode === "edit")}
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : mode === "create" ? (
                                                "Add Task"
                                            ) : (
                                                "Save Changes"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
