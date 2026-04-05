"use client";

import React, { useCallback, useMemo } from "react";
import { SearchFilterBar } from "@/components/Board/SearchFilterBar";
import { TaskEditDrawer, TaskFormData } from "@/components/TaskDrawer";
import { useEditingTask, useThisWeekTasks, useRecentActivity, useLoadingState } from "@/stores/boardStore";
import { useBoard } from "@/components/Board/BoardProvider";
import { DaySection } from "./DaySection";
import { ActivityFeed } from "./ActivityFeed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================================================
// GREETING
// ============================================================================
function getGreeting(names: string[], overdue: number, todayCount: number): { message: string; emoji: string } {
    const hour = new Date().getHours();
    const nameStr = names.length === 0
        ? ""
        : names.length === 1
            ? names[0]
            : names.slice(0, -1).join(", ") + " & " + names[names.length - 1];

    // Overdue-aware messages
    if (overdue >= 3) {
        return { message: `${nameStr}, a few things slipped — let's catch up`, emoji: "🔥" };
    }

    if (hour >= 5 && hour < 12) {
        // Morning
        if (todayCount === 0) {
            return { message: `Good morning${nameStr ? ", " + nameStr : ""}. Clear day ahead`, emoji: "☀️" };
        }
        if (overdue > 0) {
            return { message: `Morning${nameStr ? ", " + nameStr : ""}. ${overdue} thing${overdue > 1 ? "s" : ""} carried over — start there?`, emoji: "☕" };
        }
        return { message: `Good morning${nameStr ? ", " + nameStr : ""}. ${todayCount} thing${todayCount > 1 ? "s" : ""} on the plate today`, emoji: "☕" };
    }

    if (hour >= 12 && hour < 17) {
        // Afternoon
        if (todayCount === 0) {
            return { message: `Afternoon${nameStr ? ", " + nameStr : ""}. Today's looking good`, emoji: "👍" };
        }
        return { message: `Afternoon check-in${nameStr ? ", " + nameStr : ""}. ${todayCount} still open today`, emoji: "📋" };
    }

    if (hour >= 17 && hour < 21) {
        // Evening
        if (todayCount === 0) {
            return { message: `Evening${nameStr ? ", " + nameStr : ""}. Everything's handled — nice work`, emoji: "✨" };
        }
        return { message: `Evening${nameStr ? ", " + nameStr : ""}. ${todayCount} left before winding down`, emoji: "🌙" };
    }

    // Night
    return { message: `${nameStr ? nameStr + ", t" : "T"}omorrow's ready when you are`, emoji: "🌙" };
}

export function WeekView() {
    const {
        uniqueAssignees,
        tasks,
        filters,
        handleUpdateTask,
        handleDeleteTask,
    } = useBoard();

    const { editingTask, editingTaskId, openTaskEditor, closeTaskEditor } = useEditingTask();
    const { isLoading, error, refreshTasks } = useLoadingState();
    const dayGroups = useThisWeekTasks();
    const recentActivity = useRecentActivity();

    const handleSaveEdit = useCallback(async (data: TaskFormData) => {
        if (!editingTaskId) return;
        handleUpdateTask(editingTaskId, {
            title: data.title,
            description: data.description || undefined,
            priority: data.priority,
            status: data.status,
            taskType: data.taskType,
            assignee: data.assignee || undefined,
            assignees: data.assignees,
            failureCost: data.failureCost || undefined,
            blocking: data.blocking,
        });
        closeTaskEditor();
    }, [editingTaskId, handleUpdateTask, closeTaskEditor]);

    const handleDeleteFromDrawer = useCallback(() => {
        if (editingTaskId) {
            handleDeleteTask(editingTaskId);
            closeTaskEditor();
        }
    }, [editingTaskId, handleDeleteTask, closeTaskEditor]);

    // Stats
    const stats = useMemo(() => {
        const allTasks = dayGroups.flatMap(g => g.tasks);
        const totalTasks = allTasks.length;
        const overdueTasks = dayGroups.find(g => g.isOverdue)?.tasks.length || 0;
        const todayTasks = dayGroups.find(g => g.isToday)?.tasks.length || 0;

        // Per-owner breakdown
        const ownerMap = new Map<string, { name: string; firstName: string; avatar?: string; count: number }>();
        for (const task of allTasks) {
            const assignees = task.assignees?.length > 0 ? task.assignees : task.assignee ? [task.assignee] : [];
            for (const u of assignees) {
                const existing = ownerMap.get(u.id);
                if (existing) {
                    existing.count++;
                } else {
                    ownerMap.set(u.id, {
                        name: u.name,
                        firstName: u.firstName || u.name.split(" ")[0],
                        avatar: u.avatar,
                        count: 1,
                    });
                }
            }
        }

        // Greeting names — use filtered assignees if filtering, otherwise all owners
        const greetingNames = filters.assignees.length > 0
            ? uniqueAssignees
                .filter(u => filters.assignees.includes(u.id))
                .map(u => u.firstName || u.name.split(" ")[0])
            : Array.from(ownerMap.values()).map(o => o.firstName);

        const greeting = getGreeting(greetingNames, overdueTasks, todayTasks);

        return { totalTasks, overdueTasks, todayTasks, owners: Array.from(ownerMap.values()), greeting };
    }, [dayGroups, filters.assignees, uniqueAssignees]);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col h-screen w-full bg-background text-foreground board-background">
                {/* Nav skeleton */}
                <div className="h-14 border-b border-white/[0.05] px-10 flex items-center gap-4">
                    <div className="w-20 h-7 rounded-lg bg-muted/30 animate-pulse" />
                    <div className="w-52 h-8 rounded-lg bg-muted/20 animate-pulse" />
                </div>
                {/* Header skeleton */}
                <div className="px-10 pt-6 pb-4">
                    <div className="h-9 w-96 rounded-lg bg-muted/15 animate-pulse" />
                    <div className="h-4 w-48 rounded bg-muted/10 animate-pulse mt-2" />
                </div>
                {/* Content skeleton */}
                <div className="flex flex-1 px-10 pb-8 gap-8 overflow-hidden">
                    <div className="flex-[7] space-y-4">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="space-y-2">
                                <div className="h-4 w-24 rounded bg-muted/20 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                                {[0, 1].map(j => (
                                    <div key={j} className="h-12 rounded-lg bg-muted/10 animate-pulse" style={{ animationDelay: `${(i * 2 + j) * 100}ms` }} />
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="flex-[3] border-l border-border/20 pl-6 space-y-3">
                        <div className="h-4 w-28 rounded bg-muted/20 animate-pulse" />
                        {[0, 1, 2, 3, 4].map(i => (
                            <div key={i} className="h-14 rounded-lg bg-muted/10 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col h-screen w-full bg-background text-foreground board-background">
                <SearchFilterBar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 max-w-md text-center px-4">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                        <h2 className="text-lg font-semibold">Failed to load tasks</h2>
                        <p className="text-muted-foreground">{error}</p>
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
                <SearchFilterBar />

                {/* Summary header */}
                <div className="px-10 pt-6 pb-4 flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-light tracking-tight text-foreground/90">
                            <span className="mr-2">{stats.greeting.emoji}</span>
                            {stats.greeting.message}
                        </h1>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-sm text-muted-foreground">
                                {stats.totalTasks} task{stats.totalTasks !== 1 ? "s" : ""} this week
                            </span>
                            {stats.todayTasks > 0 && (
                                <span className="text-sm text-accent-linear font-medium">
                                    {stats.todayTasks} today
                                </span>
                            )}
                            {stats.overdueTasks > 0 && (
                                <span className="text-sm text-red-400 font-semibold">
                                    {stats.overdueTasks} overdue
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Owner breakdown */}
                    {stats.owners.length > 0 && (
                        <div className="flex items-center gap-4">
                            {stats.owners.map(owner => (
                                <div key={owner.name} className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                        <AvatarImage src={owner.avatar} />
                                        <AvatarFallback className="text-[8px] bg-accent">
                                            {owner.firstName[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-muted-foreground">
                                        <span className="font-medium text-foreground/70">{owner.firstName}</span>
                                        {" "}{owner.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main content */}
                <div className="flex flex-1 px-10 pb-8 gap-8 overflow-hidden">
                    {/* Left — Day groups */}
                    <div className="flex-[7] overflow-y-auto pr-4 column-scroll-container">
                        {dayGroups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <p className="text-muted-foreground">No tasks this week</p>
                                <p className="text-xs text-muted-foreground/40 mt-1">
                                    Add tasks with due dates to see them here
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {dayGroups.map(group => (
                                    <DaySection
                                        key={group.key}
                                        group={group}
                                        onTaskClick={openTaskEditor}
                                        defaultCollapsed={group.key === "no-date"}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right — Activity feed */}
                    <div className="flex-[3] border-l border-border/20 pl-6 overflow-y-auto column-scroll-container">
                        <ActivityFeed tasks={recentActivity} />
                    </div>
                </div>
            </div>

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
        </>
    );
}
