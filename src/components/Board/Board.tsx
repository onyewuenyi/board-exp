"use client";

import React from "react";
import { useBoard } from "@/components/Board/BoardProvider";
import { Column } from "@/components/Column/Column";
import { SearchFilterBar } from "@/components/Board/SearchFilterBar";
import { Confetti } from "@/components/Board/Confetti";
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
        handleUpdatePriority,
        handleUpdateStatus,
        handleAddDependency,
        openTaskDetail,
        dismissConfetti,
        isLoading,
        error,
        refreshTasks,
    } = useBoard();

    const allTaskOptions = tasks.map(t => ({ id: t.id, title: t.title }));

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
                            onUpdatePriority={handleUpdatePriority}
                            onUpdateStatus={handleUpdateStatus}
                            onAddDependency={handleAddDependency}
                            onTaskClick={openTaskDetail}
                            allTasks={allTaskOptions}
                        />
                    ))}
                </div>
            </div>

            {/* Confetti celebration - originates from drop position */}
            <Confetti show={showConfetti} onComplete={dismissConfetti} position={confettiPosition} />
        </>
    );
}
