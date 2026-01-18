"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Priority, TaskType, User } from "@/types";
import { PriorityPicker } from "@/components/Pickers/PriorityPicker";
import { AssigneePicker } from "@/components/Pickers/AssigneePicker";
import { TaskTypePicker } from "@/components/Pickers/TaskTypePicker";
import { TagsPicker } from "@/components/Pickers/TagsPicker";

interface AddTaskOptions {
    priority?: Priority;
    assignee?: User | null;
    taskType?: TaskType;
    tags?: string[];
}

interface ColumnInlineAddProps {
    onAdd: (title: string, options?: AddTaskOptions) => Promise<void>;
    onCancel: () => void;
    availableAssignees: User[];
    availableTags: string[];
}

export function ColumnInlineAdd({
    onAdd,
    onCancel,
    availableAssignees,
    availableTags,
}: ColumnInlineAddProps) {
    const [title, setTitle] = useState("");
    const [priority, setPriority] = useState<Priority>("none");
    const [assignee, setAssignee] = useState<User | null>(null);
    const [taskType, setTaskType] = useState<TaskType>("other");
    const [tags, setTags] = useState<string[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!title.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAdd(title.trim(), {
                priority: priority !== "none" ? priority : undefined,
                assignee,
                taskType: taskType !== "other" ? taskType : undefined,
                tags: tags.length > 0 ? tags : undefined,
            });
            // onAdd will call onCancel via the parent's handleAddTask
        } catch (error) {
            console.error("Failed to add task:", error);
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            onCancel();
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={cn(
                "bg-card border border-border rounded-lg overflow-hidden",
                "shadow-sm"
            )}
        >
            {/* Title Input */}
            <div className="p-3 pb-2">
                <input
                    ref={inputRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Task title..."
                    disabled={isSubmitting}
                    className={cn(
                        "w-full bg-transparent text-sm text-foreground",
                        "placeholder:text-muted-foreground/50",
                        "outline-none",
                        "disabled:opacity-50"
                    )}
                />
            </div>

            {/* Primary Actions Row */}
            <div className="px-3 pb-2 flex items-center gap-1 flex-wrap">
                <AssigneePicker
                    value={assignee}
                    onChange={setAssignee}
                    users={availableAssignees}
                />
                <PriorityPicker value={priority} onChange={setPriority} />

                {/* More/Less Toggle */}
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        "h-7 px-2 rounded-md flex items-center gap-1",
                        "text-xs text-muted-foreground",
                        "hover:bg-muted hover:text-foreground",
                        "transition-colors"
                    )}
                >
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-3.5 h-3.5" />
                    </motion.div>
                    <span>{isExpanded ? "Less" : "More"}</span>
                </button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Actions */}
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className={cn(
                        "w-7 h-7 rounded flex items-center justify-center",
                        "text-muted-foreground hover:text-foreground hover:bg-muted",
                        "transition-colors duration-100"
                    )}
                >
                    <X className="w-3.5 h-3.5" />
                </button>
                <button
                    type="submit"
                    disabled={!title.trim() || isSubmitting}
                    className={cn(
                        "h-7 px-3 rounded text-xs font-medium",
                        "bg-accent-linear text-white",
                        "hover:bg-[oklch(0.60_0.17_280)]",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "transition-colors duration-100"
                    )}
                >
                    {isSubmitting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        "Add"
                    )}
                </button>
            </div>

            {/* Expandable Panel */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="overflow-hidden"
                    >
                        <div className="px-3 pb-3 pt-2 border-t border-border/50 space-y-3">
                            {/* Task Type */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-12">Type</span>
                                <TaskTypePicker value={taskType} onChange={setTaskType} />
                            </div>

                            {/* Tags */}
                            <div className="flex items-start gap-2">
                                <span className="text-xs text-muted-foreground w-12 pt-1">Tags</span>
                                <TagsPicker
                                    value={tags}
                                    onChange={setTags}
                                    availableTags={availableTags}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Keyboard Hints */}
            <div className="px-3 py-2 border-t border-border/50 bg-muted/30">
                <span className="text-[10px] text-muted-foreground/50">
                    <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">Enter</kbd> to add
                    {" · "}
                    <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">Esc</kbd> to cancel
                </span>
            </div>
        </form>
    );
}
