"use client";

import React, { useCallback } from "react";
import { useBoard } from "@/components/Board/BoardProvider";
import { Column } from "@/components/Column/Column";
import { SearchFilterBar } from "@/components/Board/SearchFilterBar";
import { Confetti } from "@/components/Board/Confetti";
import { AddTaskFAB } from "@/components/AddTask";
import { TaskEditDrawer, TaskFormData } from "@/components/TaskDrawer";
import { useEditingTask } from "@/stores/boardStore";
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
            taskType: data.taskType,
            priority: data.priority,
            dueDate: data.dueDate,
            description: data.description,
            failureCost: data.failureCost,
            subtasks: data.subtasks,
            blocking: data.blocking,
            blockedBy: data.blockedBy,
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
            failureCost: data.failureCost || undefined,
            subtasks: data.subtasks as any, // Store expects Subtask[] with IDs, but handleUpdateTask might merge
            blocking: data.blocking,
            blockedBy: data.blockedBy,
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

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col h-screen w-full bg-background text-foreground board-background">
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-muted-foreground">Loading tasks...</p>
                    </div>
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

                {/* Columns */}
                <div
                    className={cn(
                        "flex flex-1 p-4 md:p-8 gap-6 select-none",
                        // Responsive: stacked on mobile, horizontal on desktop
                        "flex-col md:flex-row",
                        "overflow-y-auto md:overflow-x-auto md:overflow-y-hidden",
                        "items-stretch md:items-start"
                    )}
                >
                    {columns.map(col => (
                        <Column
                            key={col.id}
                            column={col}
                            onAddTask={handleAddTask}
                            allTasks={tasks}
                            availableAssignees={uniqueAssignees}
                            availableTags={uniqueTags}
                            hasFilters={hasActiveFilters}
                            onClearFilters={resetFilters}
                        />
                    ))}
                </div>
            </div>

            {/* Floating Action Button for adding tasks */}
            <AddTaskFAB
                onAdd={handleQuickAdd}
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

