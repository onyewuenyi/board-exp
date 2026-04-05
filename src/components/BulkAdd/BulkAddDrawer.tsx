"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Priority, TaskType, User } from "@/types";
import { PriorityPicker } from "@/components/Pickers/PriorityPicker";
import { TaskTypePicker } from "@/components/Pickers/TaskTypePicker";
import { AssigneePicker } from "@/components/Pickers/AssigneePicker";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================
interface BulkTaskRow {
    id: string;
    title: string;
    priority: Priority;
    taskType: TaskType;
    assignees: User[];
    status: "todo" | "in-progress" | "done";
}

function createEmptyRow(): BulkTaskRow {
    return {
        id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: "",
        priority: "none",
        taskType: "other",
        assignees: [],
        status: "todo",
    };
}

// ============================================================================
// STATUS PICKER (inline, compact)
// ============================================================================
const STATUS_OPTIONS = [
    { value: "todo" as const, label: "To Do" },
    { value: "in-progress" as const, label: "In Progress" },
    { value: "done" as const, label: "Done" },
];

function InlineStatusPicker({
    value,
    onChange,
}: {
    value: "todo" | "in-progress" | "done";
    onChange: (v: "todo" | "in-progress" | "done") => void;
}) {
    const label = STATUS_OPTIONS.find(s => s.value === value)?.label || "To Do";
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="h-7 px-2 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted transition-colors whitespace-nowrap"
            >
                {label}
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-md p-1 shadow-lg min-w-[120px]">
                        {STATUS_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                className={cn(
                                    "w-full flex items-center px-2.5 py-1.5 rounded text-xs hover:bg-muted transition-colors text-left",
                                    value === opt.value && "bg-muted"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ============================================================================
// ROW COMPONENT
// ============================================================================
function BulkRow({
    row,
    onChange,
    onRemove,
    onEnter,
    availableUsers,
    autoFocus,
    canRemove,
}: {
    row: BulkTaskRow;
    onChange: (updated: BulkTaskRow) => void;
    onRemove: () => void;
    onEnter: () => void;
    availableUsers: User[];
    autoFocus: boolean;
    canRemove: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus) {
            inputRef.current?.focus();
        }
    }, [autoFocus]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onEnter();
        }
    };

    return (
        <div className="flex items-center gap-1.5 py-1.5 px-1 rounded-lg hover:bg-muted/20 transition-colors group/row">
            {/* Title */}
            <input
                ref={inputRef}
                type="text"
                value={row.title}
                onChange={(e) => onChange({ ...row, title: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="Task name..."
                className="flex-1 min-w-0 h-8 px-2.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none rounded-md border border-transparent focus:border-border/50 transition-colors"
            />

            {/* Priority */}
            <PriorityPicker
                value={row.priority}
                onChange={(p) => onChange({ ...row, priority: p })}
                compact
            />

            {/* Type */}
            <TaskTypePicker
                value={row.taskType}
                onChange={(t) => onChange({ ...row, taskType: t })}
            />

            {/* Assignee */}
            <AssigneePicker
                value={row.assignees}
                onChange={(users) => onChange({ ...row, assignees: users })}
                users={availableUsers}
                compact
            />

            {/* Status */}
            <InlineStatusPicker
                value={row.status}
                onChange={(s) => onChange({ ...row, status: s })}
            />

            {/* Remove */}
            <button
                type="button"
                onClick={onRemove}
                className={cn(
                    "w-6 h-6 rounded flex items-center justify-center shrink-0",
                    "text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors",
                    !canRemove && "invisible"
                )}
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

// ============================================================================
// DRAWER COMPONENT
// ============================================================================
interface BulkAddDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddTasks: (tasks: { title: string; status: "todo" | "in-progress" | "done"; priority: Priority; taskType: TaskType; assignees: User[] }[]) => Promise<void>;
    availableUsers: User[];
}

export function BulkAddDrawer({ open, onOpenChange, onAddTasks, availableUsers }: BulkAddDrawerProps) {
    const [rows, setRows] = useState<BulkTaskRow[]>([createEmptyRow()]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastAddedId, setLastAddedId] = useState<string | null>(null);

    // Reset when drawer opens
    useEffect(() => {
        if (open) {
            const initial = createEmptyRow();
            setRows([initial]);
            setLastAddedId(initial.id);
        }
    }, [open]);

    const updateRow = useCallback((id: string, updated: BulkTaskRow) => {
        setRows(prev => prev.map(r => r.id === id ? updated : r));
    }, []);

    const removeRow = useCallback((id: string) => {
        setRows(prev => {
            if (prev.length <= 1) return prev;
            return prev.filter(r => r.id !== id);
        });
    }, []);

    const addRow = useCallback(() => {
        const newRow = createEmptyRow();
        setRows(prev => [...prev, newRow]);
        setLastAddedId(newRow.id);
    }, []);

    const validRows = rows.filter(r => r.title.trim());

    const handleSubmit = async () => {
        if (validRows.length === 0) return;
        setIsSubmitting(true);
        try {
            await onAddTasks(validRows.map(r => ({
                title: r.title.trim(),
                status: r.status,
                priority: r.priority,
                taskType: r.taskType,
                assignees: r.assignees,
            })));
            toast.success(`${validRows.length} task${validRows.length > 1 ? "s" : ""} added`);
            onOpenChange(false);
        } catch {
            toast.error("Failed to add tasks");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
                        onClick={() => onOpenChange(false)}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%", opacity: 0.5 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "100%", opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                        className="fixed top-0 right-0 h-full w-[680px] max-w-[95vw] bg-card border-l border-border shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 border-b border-border/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h2 className="text-base font-semibold tracking-tight">Add Tasks</h2>
                                {validRows.length > 0 && (
                                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full tabular-nums">
                                        {validRows.length}
                                    </span>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onOpenChange(false)}
                                className="h-8 w-8 p-0 text-muted-foreground"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Column headers */}
                        <div className="flex items-center gap-1.5 px-7 py-2 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider border-b border-border/20">
                            <span className="flex-1 min-w-0">Title</span>
                            <span className="w-[52px] text-center">Priority</span>
                            <span className="w-[88px] text-center">Type</span>
                            <span className="w-[52px] text-center">Assign</span>
                            <span className="w-[76px] text-center">Status</span>
                            <span className="w-6" />
                        </div>

                        {/* Rows */}
                        <div className="flex-1 overflow-y-auto px-5 py-2">
                            {rows.map((row) => (
                                <BulkRow
                                    key={row.id}
                                    row={row}
                                    onChange={(updated) => updateRow(row.id, updated)}
                                    onRemove={() => removeRow(row.id)}
                                    onEnter={addRow}
                                    availableUsers={availableUsers}
                                    autoFocus={row.id === lastAddedId}
                                    canRemove={rows.length > 1}
                                />
                            ))}

                            {/* Add row button */}
                            <button
                                type="button"
                                onClick={addRow}
                                className="flex items-center gap-2 w-full py-2.5 px-3 mt-1 rounded-lg text-xs text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/20 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add row</span>
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-border/30 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground/50">
                                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd>
                                <span className="ml-1.5">new row</span>
                            </span>
                            <Button
                                onClick={handleSubmit}
                                disabled={validRows.length === 0 || isSubmitting}
                                className="h-9 px-5 bg-accent-linear hover:bg-accent-linear/90 text-white text-sm font-medium"
                            >
                                {isSubmitting ? "Adding..." : `Add ${validRows.length || ""} Task${validRows.length !== 1 ? "s" : ""}`}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
