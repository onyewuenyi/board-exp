"use client";

import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { useBoard } from "@/components/Board/BoardProvider";
import { Column } from "@/components/Column/Column";
import { SearchFilterBar } from "@/components/Board/SearchFilterBar";
import { Confetti } from "@/components/Board/Confetti";
import { AskAIBar } from "@/components/Board/AskAIBar";
import { AddTaskFAB } from "@/components/AddTask";
import { TaskEditDrawer, TaskFormData } from "@/components/TaskDrawer";
import { useBoardStore, useEditingTask, useDoneColumnCollapsed } from "@/stores/boardStore";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Board() {
    const {
        columns,
        tasks,
        showConfetti,
        confettiPosition,
        handleAddTask,
        handleUpdateTask,
        handleDeleteTask,
        dismissConfetti,
        isLoading,
        error,
        refreshTasks,
        uniqueAssignees,
        uniqueTags,
        filters,
        resetFilters,
    } = useBoard();

    // Editing task state from store
    const { editingTask, editingTaskId, closeTaskEditor } = useEditingTask();
    const handleDeleteAllTasks = useBoardStore((state) => state.handleDeleteAllTasks);
    const { doneColumnCollapsed } = useDoneColumnCollapsed();

    // Bulk add handler
    const handleBulkAdd = useCallback(async (tasks: { title: string; status: "todo" | "in-progress" | "done"; priority: any; taskType: any; assignees: any[] }[]) => {
        for (const t of tasks) {
            await handleAddTask(t.title, t.status, {
                priority: t.priority,
                taskType: t.taskType,
                assignees: t.assignees,
            });
        }
    }, [handleAddTask]);

    // Check if any filters are active
    const hasActiveFilters =
        filters.searchText.length > 0 ||
        filters.priorities.length > 0 ||
        filters.assignees.length > 0 ||
        filters.taskTypes.length > 0 ||
        filters.tags.length > 0;

    // Wrapper to convert TaskFormData to handleAddTask format
    const handleQuickAdd = useCallback(async (data: TaskFormData) => {
        await handleAddTask(data.title, data.status || "todo", {
            assignee: data.assignee,
            assignees: data.assignees,
            taskType: data.taskType,
            priority: data.priority,
            dueDate: data.dueDate,
            description: data.description,
            failureCost: data.failureCost,
            subtasks: data.subtasks,
            blocking: data.blocking,
        });
    }, [handleAddTask]);

    // Handler for saving edits from the drawer
    const handleSaveEdit = useCallback(async (data: TaskFormData) => {
        if (!editingTaskId) return;

        // Update the task with the new data
        handleUpdateTask(editingTaskId, {
            title: data.title,
            description: data.description || undefined,
            priority: data.priority,
            status: data.status,
            taskType: data.taskType,
            assignee: data.assignee || undefined,
            assignees: data.assignees,
            failureCost: data.failureCost || undefined,
            subtasks: data.subtasks as any,
            blocking: data.blocking,
        });

        closeTaskEditor();
    }, [editingTaskId, handleUpdateTask, closeTaskEditor]);

    // Handler for deleting task from the drawer
    const handleDeleteFromDrawer = useCallback(() => {
        if (editingTaskId) {
            handleDeleteTask(editingTaskId);
            closeTaskEditor();
        }
    }, [editingTaskId, handleDeleteTask, closeTaskEditor]);

    // Loading state — skeleton
    if (isLoading) {
        return (
            <div className="flex flex-col h-screen w-full bg-background text-foreground board-background">
                {/* Nav skeleton */}
                <div className="h-14 border-b border-white/[0.05] px-10 flex items-center gap-4">
                    <div className="w-20 h-7 rounded-lg bg-muted/30 animate-pulse" />
                    <div className="w-52 h-8 rounded-lg bg-muted/20 animate-pulse" />
                    <div className="ml-auto flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-muted/20 animate-pulse" />
                        <div className="w-7 h-7 rounded-full bg-muted/20 animate-pulse" />
                    </div>
                </div>
                {/* Columns skeleton */}
                <div className="flex flex-1 px-10 py-8 gap-8">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="flex-1 space-y-3">
                            <div className="flex items-center gap-2 mb-4 px-1">
                                <div className="w-2 h-2 rounded-full bg-muted/30 animate-pulse" />
                                <div className="h-4 w-20 rounded bg-muted/30 animate-pulse" />
                            </div>
                            {[0, 1, 2, 3].slice(0, 4 - i).map(j => (
                                <div
                                    key={j}
                                    className="h-[72px] rounded-xl bg-muted/10 animate-pulse"
                                    style={{ animationDelay: `${(i * 4 + j) * 100}ms` }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col h-screen w-full bg-background text-foreground board-background">
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 max-w-md text-center px-4">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                        <h2 className="text-lg font-semibold">Failed to load tasks</h2>
                        <p className="text-muted-foreground">{error}</p>
                        <p className="text-sm text-muted-foreground">
                            Make sure the backend is running at http://localhost:8001
                        </p>
                        <Button onClick={refreshTasks} variant="outline" className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col h-screen w-full bg-background text-foreground board-background">
                {/* Search and Filter Bar */}
                <SearchFilterBar />

                {/* AI Bar — inline between nav and columns */}
                <AskAIBar />

                {/* Columns */}
                <div
                    className={cn(
                        "flex flex-1 px-10 pt-4 pb-8 gap-8 select-none",
                        "flex-row overflow-hidden items-stretch"
                    )}
                >
                    {columns.map(col => (
                        <motion.div
                            key={col.id}
                            layout
                            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                            className={cn(
                                col.id === "done" && doneColumnCollapsed
                                    ? "w-14 shrink-0"
                                    : "flex-1 min-w-0"
                            )}
                        >
                            <Column
                                column={col}
                                onAddTask={handleAddTask}
                                allTasks={tasks}
                                availableAssignees={uniqueAssignees}
                                availableTags={uniqueTags}
                                hasFilters={hasActiveFilters}
                                onClearFilters={resetFilters}
                                collapsible={col.id === "done"}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Floating Action Button — single + bulk add */}
            <AddTaskFAB
                onAdd={handleQuickAdd}
                onBulkAdd={handleBulkAdd}
                onDeleteAll={handleDeleteAllTasks}
                availableUsers={uniqueAssignees}
                availableTasks={tasks}
            />

            {/* Task Edit Drawer */}
            <TaskEditDrawer
                mode="edit"
                task={editingTask || undefined}
                open={editingTaskId !== null}
                onOpenChange={(open) => !open && closeTaskEditor()}
                onSave={handleSaveEdit}
                onDelete={handleDeleteFromDrawer}
                availableUsers={uniqueAssignees}
                availableTasks={tasks}
            />

            {/* Confetti celebration - originates from drop position */}
            <Confetti show={showConfetti} onComplete={dismissConfetti} position={confettiPosition} />
        </>
    );
}

