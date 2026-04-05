"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ListPlus, FilePlus, Trash2, FileJson } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TaskEditDrawer, TaskFormData } from "@/components/TaskDrawer";
import { BulkAddDrawer } from "@/components/BulkAdd";
import { Task, User, Priority, TaskType } from "@/types";
import { toast } from "sonner";

interface AddTaskFABProps {
    onAdd: (data: TaskFormData) => Promise<void>;
    onBulkAdd: (tasks: { title: string; status: "todo" | "in-progress" | "done"; priority: Priority; taskType: TaskType; assignees: User[] }[]) => Promise<void>;
    onDeleteAll: () => Promise<void>;
    availableUsers: User[];
    availableTasks: Task[];
}

export function AddTaskFAB({ onAdd, onBulkAdd, onDeleteAll, availableUsers, availableTasks }: AddTaskFABProps) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showJsonImport, setShowJsonImport] = useState(false);
    const [jsonText, setJsonText] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Keyboard shortcut: N to open single task
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                e.target instanceof HTMLSelectElement
            ) return;

            if (e.key === "n" || e.key === "N") {
                e.preventDefault();
                setIsDrawerOpen(true);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Close expanded menu on outside click
    useEffect(() => {
        if (!isExpanded) return;
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsExpanded(false);
            }
        };
        window.addEventListener("mousedown", handleClick);
        return () => window.removeEventListener("mousedown", handleClick);
    }, [isExpanded]);

    const handleSingleAdd = () => {
        setIsExpanded(false);
        setIsDrawerOpen(true);
    };

    const handleBulkAdd = () => {
        setIsExpanded(false);
        setIsBulkOpen(true);
    };

    const handleJsonImportClick = () => {
        setIsExpanded(false);
        setJsonText("");
        setJsonError(null);
        setShowJsonImport(true);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setJsonText(reader.result as string);
            setJsonError(null);
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    const handleJsonSubmit = async () => {
        setJsonError(null);
        let parsed: unknown;
        try {
            parsed = JSON.parse(jsonText);
        } catch {
            setJsonError("Invalid JSON");
            return;
        }

        const items = Array.isArray(parsed) ? parsed : [parsed];
        const tasks = items.map((item: any) => ({
            title: String(item.title || "Untitled"),
            status: (["todo", "in-progress", "done"].includes(item.status) ? item.status : "todo") as "todo" | "in-progress" | "done",
            priority: (["urgent", "high", "med", "low", "none"].includes(item.priority) ? item.priority : "none") as Priority,
            taskType: (["chore", "errand", "homework", "appointment", "other"].includes(item.taskType || item.task_type) ? (item.taskType || item.task_type) : "other") as TaskType,
            assignees: [] as User[],
        }));

        const valid = tasks.filter(t => t.title && t.title !== "Untitled");
        if (valid.length === 0) {
            setJsonError("No tasks with titles found. Expected: [{ \"title\": \"...\", ... }]");
            return;
        }

        setIsImporting(true);
        try {
            await onBulkAdd(valid);
            toast.success(`${valid.length} task${valid.length !== 1 ? "s" : ""} imported`);
            setShowJsonImport(false);
        } catch {
            setJsonError("Failed to import tasks");
        } finally {
            setIsImporting(false);
        }
    };

    const handleDeleteAllClick = () => {
        setIsExpanded(false);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        await onDeleteAll();
        setIsDeleting(false);
        setShowDeleteConfirm(false);
    };

    return (
        <>
            <div ref={containerRef} className="fixed bottom-8 right-8 z-50 flex flex-col items-center gap-3">
                {/* Expanded action buttons — fan upward */}
                <AnimatePresence>
                    {isExpanded && (
                        <>
                            {/* Delete all */}
                            <motion.button
                                initial={{ scale: 0, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0, opacity: 0, y: 20 }}
                                transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.15 }}
                                onClick={handleDeleteAllClick}
                                className={cn(
                                    "w-11 h-11 rounded-full",
                                    "bg-card border border-border text-muted-foreground",
                                    "flex items-center justify-center",
                                    "shadow-lg hover:shadow-xl",
                                    "hover:border-destructive hover:text-destructive",
                                    "transition-colors duration-150"
                                )}
                                title="Delete all tasks"
                            >
                                <Trash2 className="w-5 h-5" />
                            </motion.button>

                            {/* JSON import */}
                            <motion.button
                                initial={{ scale: 0, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0, opacity: 0, y: 20 }}
                                transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.1 }}
                                onClick={handleJsonImportClick}
                                className={cn(
                                    "w-11 h-11 rounded-full",
                                    "bg-card border border-border text-foreground",
                                    "flex items-center justify-center",
                                    "shadow-lg hover:shadow-xl",
                                    "hover:border-accent-linear hover:text-accent-linear",
                                    "transition-colors duration-150"
                                )}
                                title="Import from JSON"
                            >
                                <FileJson className="w-5 h-5" />
                            </motion.button>

                            {/* Bulk add */}
                            <motion.button
                                initial={{ scale: 0, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0, opacity: 0, y: 20 }}
                                transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.05 }}
                                onClick={handleBulkAdd}
                                className={cn(
                                    "w-11 h-11 rounded-full",
                                    "bg-card border border-border text-foreground",
                                    "flex items-center justify-center",
                                    "shadow-lg hover:shadow-xl",
                                    "hover:border-accent-linear hover:text-accent-linear",
                                    "transition-colors duration-150"
                                )}
                                title="Add multiple tasks"
                            >
                                <ListPlus className="w-5 h-5" />
                            </motion.button>

                            {/* Single add */}
                            <motion.button
                                initial={{ scale: 0, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0, opacity: 0, y: 20 }}
                                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                                onClick={handleSingleAdd}
                                className={cn(
                                    "w-11 h-11 rounded-full",
                                    "bg-card border border-border text-foreground",
                                    "flex items-center justify-center",
                                    "shadow-lg hover:shadow-xl",
                                    "hover:border-accent-linear hover:text-accent-linear",
                                    "transition-colors duration-150"
                                )}
                                title="Add single task (N)"
                            >
                                <FilePlus className="w-5 h-5" />
                            </motion.button>
                        </>
                    )}
                </AnimatePresence>

                {/* Main FAB */}
                <motion.button
                    onClick={() => setIsExpanded(!isExpanded)}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                    }}
                    className={cn(
                        "w-14 h-14 rounded-full",
                        "bg-accent-linear text-white",
                        "flex items-center justify-center",
                        "shadow-[0_4px_14px_oklch(0.62_0.09_260_/_0.3),0_2px_6px_rgba(0,0,0,0.2)]",
                        "hover:shadow-[0_8px_30px_oklch(0.62_0.09_260_/_0.4),0_4px_10px_rgba(0,0,0,0.15)]",
                        "transition-shadow duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-accent-linear focus:ring-offset-2 focus:ring-offset-background"
                    )}
                    aria-label="Add task"
                >
                    <motion.div
                        animate={{ rotate: isExpanded ? 45 : 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        <Plus className="w-7 h-7" strokeWidth={2.5} />
                    </motion.div>
                </motion.button>
            </div>

            {/* Single Task Drawer */}
            <TaskEditDrawer
                mode="create"
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                onSave={onAdd}
                availableUsers={availableUsers}
                availableTasks={availableTasks}
            />

            {/* Bulk Add Drawer */}
            <BulkAddDrawer
                open={isBulkOpen}
                onOpenChange={setIsBulkOpen}
                onAddTasks={onBulkAdd}
                availableUsers={availableUsers}
            />

            {/* JSON Import Dialog */}
            <Dialog open={showJsonImport} onOpenChange={setShowJsonImport}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Import Tasks from JSON</DialogTitle>
                    </DialogHeader>
                    <p className="text-xs text-muted-foreground">
                        Paste JSON or upload a file. Expected format: an array of objects with <code className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">title</code>, and optionally <code className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">priority</code>, <code className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">status</code>, <code className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">taskType</code>.
                    </p>
                    <div className="space-y-3">
                        <textarea
                            value={jsonText}
                            onChange={(e) => { setJsonText(e.target.value); setJsonError(null); }}
                            placeholder={'[\n  { "title": "Buy groceries", "priority": "high" },\n  { "title": "Call dentist", "taskType": "appointment" }\n]'}
                            className="w-full h-48 px-3 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-accent-linear/50 resize-none"
                        />
                        {jsonError && (
                            <p className="text-xs text-destructive">{jsonError}</p>
                        )}
                        <div className="flex items-center justify-between">
                            <div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs text-muted-foreground"
                                >
                                    <FileJson className="w-3.5 h-3.5 mr-1.5" />
                                    Upload .json file
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json,application/json"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </div>
                            <Button
                                size="sm"
                                onClick={handleJsonSubmit}
                                disabled={!jsonText.trim() || isImporting}
                                className="bg-accent-linear hover:bg-accent-linear/90 text-white"
                            >
                                {isImporting ? "Importing..." : "Import"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete All Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete all tasks?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        This will permanently delete every task on the board. This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete All"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
