"use client";

import React, { useEffect, useCallback, useMemo } from "react";
import {
    DndContext,
    DragOverlay as DndKitDragOverlay,
    closestCenter,
    PointerSensor,
    TouchSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { ColumnType, Task, Priority, TaskType, User } from "@/types";
import { TaskCardGlance } from "@/components/TaskCard/TaskCardGlance";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
    useBoardStore,
    useColumns,
    useActiveTask,
    useUniqueAssignees,
    useUniqueTags,
    useDragState,
    useConfetti,
    useLoadingState,
    useExpandedTask,
    useFilters,
    useTaskActions,
    useTasks,
} from "@/stores/boardStore";

// ============================================================================
// DROP ANIMATION CONFIG - Linear style (faster, snappier)
// ============================================================================
const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: "0.6",
            },
        },
    }),
    duration: 250,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)", // ease-out-expo
};

// ============================================================================
// BACKWARD COMPATIBILITY HOOK
// This hook provides the same interface as the old context for existing consumers
// ============================================================================
interface AddTaskOptions {
    priority?: Priority;
    assignee?: User | null;
    taskType?: TaskType;
    tags?: string[];
    dueDate?: Date | null;
    description?: string;
    failureCost?: string;
    subtasks?: { title: string; completed: boolean }[];
    blocking?: string[];
    blockedBy?: string[];
}

interface FilterState {
    searchText: string;
    priorities: Priority[];
    assignees: string[];
    taskTypes: TaskType[];
    tags: string[];
}

interface BoardContextType {
    tasks: Task[];
    columns: ColumnType[];
    activeTask: Task | null;
    showConfetti: boolean;
    confettiPosition: { x: number; y: number } | null;
    isLoading: boolean;
    error: string | null;
    expandedTaskId: string | null;
    filters: FilterState;
    uniqueAssignees: User[];
    uniqueTags: string[];
    handleAddTask: (title: string, columnId: ColumnType["id"], options?: AddTaskOptions) => Promise<void>;
    handleUpdatePriority: (taskId: string, priority: Priority) => void;
    handleUpdateStatus: (taskId: string, status: ColumnType["id"]) => void;
    handleUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    handleDeleteTask: (taskId: string) => void;
    handleAddDependency: (taskId: string, dependencyId: string, type: "blocking" | "blockedBy") => void;
    handleRemoveDependency: (taskId: string, targetId: string, type: "blocking" | "blockedBy") => void;
    dismissConfetti: () => void;
    toggleTaskExpanded: (taskId: string) => void;
    collapseAllTasks: () => void;
    refreshTasks: () => Promise<void>;
    handleAddSubtask: (taskId: string, title: string) => void;
    handleToggleSubtask: (taskId: string, subtaskId: string, completed: boolean) => void;
    handleRemoveSubtask: (taskId: string, subtaskId: string) => void;
    handleAddLink: (taskId: string, url: string, title?: string) => void;
    handleRemoveLink: (taskId: string, linkId: string) => void;
    setSearchText: (text: string) => void;
    togglePriorityFilter: (priority: Priority) => void;
    toggleAssigneeFilter: (assigneeId: string) => void;
    toggleTypeFilter: (taskType: TaskType) => void;
    toggleTagFilter: (tag: string) => void;
    resetFilters: () => void;
}

/**
 * Backward-compatible hook that provides the same interface as the old context.
 * Use the selective hooks from boardStore.ts for better performance.
 */
export const useBoard = (): BoardContextType => {
    const tasks = useTasks();
    const columns = useColumns();
    const activeTask = useActiveTask();
    const uniqueAssignees = useUniqueAssignees();
    const uniqueTags = useUniqueTags();
    const { showConfetti, confettiPosition, dismissConfetti } = useConfetti();
    const { isLoading, error, refreshTasks } = useLoadingState();
    const { expandedTaskId, toggleTaskExpanded, collapseAllTasks } = useExpandedTask();
    const { filters, setSearchText, togglePriorityFilter, toggleAssigneeFilter, toggleTypeFilter, toggleTagFilter, resetFilters } = useFilters();
    const {
        handleAddTask,
        handleUpdatePriority,
        handleUpdateStatus,
        handleUpdateTask,
        handleDeleteTask,
        handleAddDependency,
        handleRemoveDependency,
        handleAddSubtask,
        handleToggleSubtask,
        handleRemoveSubtask,
        handleAddLink,
        handleRemoveLink,
    } = useTaskActions();

    return useMemo(() => ({
        tasks,
        columns,
        activeTask,
        showConfetti,
        confettiPosition,
        isLoading,
        error,
        expandedTaskId,
        filters,
        uniqueAssignees,
        uniqueTags,
        handleAddTask,
        handleUpdatePriority,
        handleUpdateStatus,
        handleUpdateTask,
        handleDeleteTask,
        handleAddDependency,
        handleRemoveDependency,
        dismissConfetti,
        toggleTaskExpanded,
        collapseAllTasks,
        refreshTasks,
        handleAddSubtask,
        handleToggleSubtask,
        handleRemoveSubtask,
        handleAddLink,
        handleRemoveLink,
        setSearchText,
        togglePriorityFilter,
        toggleAssigneeFilter,
        toggleTypeFilter,
        toggleTagFilter,
        resetFilters,
    }), [
        tasks,
        columns,
        activeTask,
        showConfetti,
        confettiPosition,
        isLoading,
        error,
        expandedTaskId,
        filters,
        uniqueAssignees,
        uniqueTags,
        handleAddTask,
        handleUpdatePriority,
        handleUpdateStatus,
        handleUpdateTask,
        handleDeleteTask,
        handleAddDependency,
        handleRemoveDependency,
        dismissConfetti,
        toggleTaskExpanded,
        collapseAllTasks,
        refreshTasks,
        handleAddSubtask,
        handleToggleSubtask,
        handleRemoveSubtask,
        handleAddLink,
        handleRemoveLink,
        setSearchText,
        togglePriorityFilter,
        toggleAssigneeFilter,
        toggleTypeFilter,
        toggleTagFilter,
        resetFilters,
    ]);
};

// ============================================================================
// BOARD PROVIDER (DndContext wrapper only)
// ============================================================================
export function BoardProvider({ children }: { children: React.ReactNode }) {
    // Get store actions and state we need for drag handling
    const tasks = useTasks();
    const activeTask = useActiveTask();
    const { isShaking, dragStartStatus, setActiveId, setDragStartStatus, setIsShaking } = useDragState();
    const { setShowConfetti, setConfettiPosition } = useConfetti();
    const { refreshTasks, setIsLoading } = useLoadingState();
    const setTasks = useBoardStore((state) => state.setTasks);

    // ────────────────────────────────────────────────────────────────────────
    // DATA FETCHING ON MOUNT
    // ────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        const loadTasks = async () => {
            setIsLoading(true);
            await refreshTasks();
            setIsLoading(false);
        };
        loadTasks();
    }, [refreshTasks, setIsLoading]);

    // ────────────────────────────────────────────────────────────────────────
    // SENSORS
    // ────────────────────────────────────────────────────────────────────────
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 200, tolerance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // ────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ────────────────────────────────────────────────────────────────────────
    const findColumnByTaskId = useCallback((taskId: string | number): ColumnType["id"] | null => {
        const task = tasks.find(t => t.id === String(taskId));
        return task?.status || null;
    }, [tasks]);

    const findColumnById = useCallback((id: string | number): ColumnType["id"] | null => {
        const strId = String(id);
        if (strId === "todo" || strId === "in-progress" || strId === "done") {
            return strId as ColumnType["id"];
        }
        return null;
    }, []);

    // ────────────────────────────────────────────────────────────────────────
    // DND HANDLERS
    // ────────────────────────────────────────────────────────────────────────
    const handleDragStart = useCallback((event: DragStartEvent) => {
        const task = tasks.find(t => t.id === String(event.active.id));
        setActiveId(event.active.id);
        setDragStartStatus(task?.status || null);
    }, [tasks, setActiveId, setDragStartStatus]);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeColumn = findColumnByTaskId(active.id);
        let overColumn = findColumnById(over.id);
        if (!overColumn) {
            overColumn = findColumnByTaskId(over.id);
        }

        if (!activeColumn || !overColumn) return;

        if (activeColumn !== overColumn) {
            setTasks((() => {
                const currentTasks = useBoardStore.getState().tasks;
                const activeTask = currentTasks.find(t => t.id === String(active.id));
                if (!activeTask) return currentTasks;

                const withoutActive = currentTasks.filter(t => t.id !== String(active.id));
                const overTasks = withoutActive.filter(t => t.status === overColumn);
                const overIndex = overTasks.findIndex(t => t.id === String(over.id));
                const updatedTask = { ...activeTask, status: overColumn as ColumnType["id"] };

                const result: Task[] = [];
                for (const t of withoutActive) {
                    if (t.status !== overColumn) {
                        result.push(t);
                    }
                }

                const targetColumnTasks = withoutActive.filter(t => t.status === overColumn);
                if (overIndex === -1) {
                    result.push(...targetColumnTasks, updatedTask);
                } else {
                    for (let i = 0; i < targetColumnTasks.length; i++) {
                        if (i === overIndex) {
                            result.push(updatedTask);
                        }
                        result.push(targetColumnTasks[i]);
                    }
                    if (overIndex >= targetColumnTasks.length) {
                        result.push(updatedTask);
                    }
                }

                return result;
            })());
        } else {
            setTasks((() => {
                const currentTasks = useBoardStore.getState().tasks;
                const columnTasks = currentTasks.filter(t => t.status === activeColumn);
                const otherTasks = currentTasks.filter(t => t.status !== activeColumn);

                const oldIndex = columnTasks.findIndex(t => t.id === String(active.id));
                const newIndex = columnTasks.findIndex(t => t.id === String(over.id));

                if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                    const reordered = arrayMove(columnTasks, oldIndex, newIndex);
                    return [...otherTasks, ...reordered];
                }
                return currentTasks;
            })());
        }
    }, [findColumnByTaskId, findColumnById, setTasks]);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        const currentTasks = useBoardStore.getState().tasks;
        const currentDragStartStatus = useBoardStore.getState().dragStartStatus;

        if (!over) {
            setIsShaking(true);
            setTimeout(() => {
                setIsShaking(false);
                setActiveId(null);
                setDragStartStatus(null);
            }, 500);
            return;
        }

        const currentTask = currentTasks.find(t => t.id === String(active.id));
        if (currentTask?.status === "done" && currentDragStartStatus !== "done") {
            const activatorEvent = event.activatorEvent as PointerEvent | MouseEvent | TouchEvent;
            let x = window.innerWidth / 2;
            let y = window.innerHeight / 2;

            if (activatorEvent) {
                if ('clientX' in activatorEvent) {
                    x = activatorEvent.clientX;
                    y = activatorEvent.clientY;
                } else if ('touches' in activatorEvent && activatorEvent.touches[0]) {
                    x = activatorEvent.touches[0].clientX;
                    y = activatorEvent.touches[0].clientY;
                }
            }

            if (over && event.over?.rect) {
                x = event.over.rect.left + event.over.rect.width / 2;
                y = event.over.rect.top + event.over.rect.height / 2;
            }

            setConfettiPosition({ x, y });
            setShowConfetti(true);
        }

        // Persist status change to backend if status changed
        if (currentTask && currentTask.status !== currentDragStartStatus && currentDragStartStatus) {
            try {
                const api = await import("@/lib/api");
                await api.updateTask(currentTask.id, { status: currentTask.status });
            } catch (err) {
                console.error("Failed to update task status:", err);
                // Revert on error
                setTasks(currentTasks.map(t =>
                    t.id === currentTask.id ? { ...t, status: currentDragStartStatus } : t
                ));
            }
        }

        setActiveId(null);
        setDragStartStatus(null);
    }, [setActiveId, setDragStartStatus, setIsShaking, setShowConfetti, setConfettiPosition, setTasks]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            {children}

            <DndKitDragOverlay dropAnimation={isShaking ? null : dropAnimation}>
                {activeTask && (
                    <motion.div
                        initial={{ scale: 1 }}
                        animate={isShaking ? {
                            scale: 1,
                            x: [0, -8, 8, -8, 8, -4, 4, 0],
                            rotate: [0, -2, 2, -2, 2, -1, 1, 0],
                            boxShadow: "0 8px 24px rgba(239,68,68,0.25)",
                        } : {
                            scale: 1.02,
                            x: 0,
                            boxShadow: "0 12px 24px rgba(0,0,0,0.2)",
                        }}
                        transition={isShaking ? {
                            duration: 0.4,
                            ease: "easeInOut",
                        } : {
                            scale: { type: "spring", stiffness: 500, damping: 35 },
                        }}
                        className="cursor-grabbing"
                    >
                        {/* Simplified card for drag overlay - just shows glance layer */}
                        <Card className="bg-card border border-border rounded-lg overflow-hidden">
                            <TaskCardGlance task={activeTask} isExpanded={false} isHovered={false} />
                        </Card>
                    </motion.div>
                )}
            </DndKitDragOverlay>
        </DndContext>
    );
}
