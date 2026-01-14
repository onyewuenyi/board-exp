"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
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
    DragMoveEvent,
    UniqueIdentifier,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Task, ColumnType, Priority, TaskType, User } from "@/types";
import { TaskCard } from "@/components/TaskCard/TaskCard";
import { TaskDetailModal } from "@/components/TaskDetail/TaskDetailModal";
import { motion, useMotionValue, useSpring } from "framer-motion";
import * as api from "@/lib/api";

// ============================================================================
// DROP ANIMATION CONFIG
// ============================================================================
const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: "0.5",
            },
        },
    }),
    duration: 300,
    easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
};

// ============================================================================
// CONTEXT TYPES
// ============================================================================
interface ConfettiPosition {
    x: number;
    y: number;
}

interface FilterState {
    searchText: string;
    priorities: Priority[];
    assignees: string[];
    taskTypes: TaskType[];
    tags: string[];
}

const defaultFilters: FilterState = {
    searchText: "",
    priorities: [],
    assignees: [],
    taskTypes: [],
    tags: [],
};

interface BoardContextType {
    tasks: Task[];
    columns: ColumnType[];
    activeTask: Task | null;
    showConfetti: boolean;
    confettiPosition: ConfettiPosition | null;
    selectedTask: Task | null;
    isDetailModalOpen: boolean;
    isLoading: boolean;
    error: string | null;

    // Filter state
    filters: FilterState;
    uniqueAssignees: User[];
    uniqueTags: string[];

    // Actions
    handleAddTask: (title: string, columnId: ColumnType["id"]) => Promise<void>;
    handleUpdatePriority: (taskId: string, priority: Priority) => void;
    handleUpdateStatus: (taskId: string, status: ColumnType["id"]) => void;
    handleUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    handleDeleteTask: (taskId: string) => void;
    handleAddDependency: (taskId: string, dependencyId: string, type: "blocking" | "blockedBy") => void;
    handleRemoveDependency: (taskId: string, targetId: string, type: "blocking" | "blockedBy") => void;
    dismissConfetti: () => void;
    openTaskDetail: (task: Task) => void;
    closeTaskDetail: () => void;
    refreshTasks: () => Promise<void>;

    // Filter actions
    setSearchText: (text: string) => void;
    togglePriorityFilter: (priority: Priority) => void;
    toggleAssigneeFilter: (assigneeId: string) => void;
    toggleTypeFilter: (taskType: TaskType) => void;
    toggleTagFilter: (tag: string) => void;
    resetFilters: () => void;
}

const BoardContext = createContext<BoardContextType | null>(null);

export const useBoard = () => {
    const context = useContext(BoardContext);
    if (!context) throw new Error("useBoard must be used within BoardProvider");
    return context;
};

// ============================================================================
// BOARD PROVIDER
// ============================================================================
export function BoardProvider({ children }: { children: React.ReactNode }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [confettiPosition, setConfettiPosition] = useState<ConfettiPosition | null>(null);
    const [dragStartStatus, setDragStartStatus] = useState<ColumnType["id"] | null>(null);
    const [isShaking, setIsShaking] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>(defaultFilters);

    // Velocity-based rotation for drag overlay
    const rawRotation = useMotionValue(0);
    const smoothRotation = useSpring(rawRotation, { stiffness: 300, damping: 30 });

    // ────────────────────────────────────────────────────────────────────────
    // DATA FETCHING
    // ────────────────────────────────────────────────────────────────────────
    const refreshTasks = useCallback(async () => {
        try {
            setError(null);
            const fetchedTasks = await api.fetchTasks();
            setTasks(fetchedTasks);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to fetch tasks";
            setError(message);
            console.error("Failed to fetch tasks:", err);
        }
    }, []);

    useEffect(() => {
        const loadTasks = async () => {
            setIsLoading(true);
            await refreshTasks();
            setIsLoading(false);
        };
        loadTasks();
    }, [refreshTasks]);

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
    // COMPUTED VALUES
    // ────────────────────────────────────────────────────────────────────────
    const activeTask = useMemo(() => {
        if (!activeId) return null;
        return tasks.find(t => t.id === activeId) || null;
    }, [activeId, tasks]);

    const uniqueAssignees = useMemo(() => {
        const map = new Map<string, User>();
        tasks.forEach(t => t.assignee && map.set(t.assignee.id, t.assignee));
        return Array.from(map.values());
    }, [tasks]);

    const uniqueTags = useMemo(() => {
        const set = new Set<string>();
        tasks.forEach(t => t.tags?.forEach(tag => set.add(tag)));
        return Array.from(set).sort();
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            if (filters.searchText) {
                const search = filters.searchText.toLowerCase();
                if (!task.title.toLowerCase().includes(search) &&
                    !task.id.toLowerCase().includes(search)) {
                    return false;
                }
            }
            if (filters.priorities.length > 0 &&
                !filters.priorities.includes(task.priority)) {
                return false;
            }
            if (filters.assignees.length > 0 &&
                (!task.assignee || !filters.assignees.includes(task.assignee.id))) {
                return false;
            }
            if (filters.taskTypes.length > 0 &&
                (!task.taskType || !filters.taskTypes.includes(task.taskType))) {
                return false;
            }
            if (filters.tags.length > 0 &&
                (!task.tags || !task.tags.some(t => filters.tags.includes(t)))) {
                return false;
            }
            return true;
        });
    }, [tasks, filters]);

    const getTasksByStatus = useCallback((status: ColumnType["id"]) => {
        return filteredTasks.filter(t => t.status === status);
    }, [filteredTasks]);

    const columns: ColumnType[] = useMemo(() => [
        { id: "todo", title: "To Do", tasks: getTasksByStatus("todo") },
        { id: "in-progress", title: "In Progress", tasks: getTasksByStatus("in-progress") },
        { id: "done", title: "Done", tasks: getTasksByStatus("done") },
    ], [getTasksByStatus]);

    // ────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ────────────────────────────────────────────────────────────────────────
    const findColumnByTaskId = useCallback((taskId: UniqueIdentifier): ColumnType["id"] | null => {
        const task = tasks.find(t => t.id === taskId);
        return task?.status || null;
    }, [tasks]);

    const findColumnById = useCallback((id: UniqueIdentifier): ColumnType["id"] | null => {
        if (id === "todo" || id === "in-progress" || id === "done") {
            return id;
        }
        return null;
    }, []);

    // ────────────────────────────────────────────────────────────────────────
    // DND HANDLERS
    // ────────────────────────────────────────────────────────────────────────
    const handleDragStart = useCallback((event: DragStartEvent) => {
        const task = tasks.find(t => t.id === event.active.id);
        setActiveId(event.active.id);
        setDragStartStatus(task?.status || null);
        rawRotation.set(0);
    }, [tasks, rawRotation]);

    const handleDragMove = useCallback((event: DragMoveEvent) => {
        const deltaX = event.delta.x;
        const rotation = Math.max(-8, Math.min(8, deltaX * 0.5));
        rawRotation.set(rotation);
    }, [rawRotation]);

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
            setTasks(prev => {
                const activeTask = prev.find(t => t.id === active.id);
                if (!activeTask) return prev;

                const withoutActive = prev.filter(t => t.id !== active.id);
                const overTasks = withoutActive.filter(t => t.status === overColumn);
                const overIndex = overTasks.findIndex(t => t.id === over.id);
                const updatedTask = { ...activeTask, status: overColumn };

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
            });
        } else {
            setTasks(prev => {
                const columnTasks = prev.filter(t => t.status === activeColumn);
                const otherTasks = prev.filter(t => t.status !== activeColumn);

                const oldIndex = columnTasks.findIndex(t => t.id === active.id);
                const newIndex = columnTasks.findIndex(t => t.id === over.id);

                if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                    const reordered = arrayMove(columnTasks, oldIndex, newIndex);
                    return [...otherTasks, ...reordered];
                }
                return prev;
            });
        }
    }, [findColumnByTaskId, findColumnById]);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setIsShaking(true);
            setTimeout(() => {
                setIsShaking(false);
                setActiveId(null);
                setDragStartStatus(null);
                rawRotation.set(0);
            }, 500);
            return;
        }

        const currentTask = tasks.find(t => t.id === active.id);
        if (currentTask?.status === "done" && dragStartStatus !== "done") {
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
        if (currentTask && currentTask.status !== dragStartStatus && dragStartStatus) {
            try {
                await api.updateTask(currentTask.id, { status: currentTask.status });
            } catch (err) {
                console.error("Failed to update task status:", err);
                // Revert on error
                setTasks(prev => prev.map(t =>
                    t.id === currentTask.id ? { ...t, status: dragStartStatus } : t
                ));
            }
        }

        rawRotation.set(0);
        setActiveId(null);
        setDragStartStatus(null);
    }, [tasks, dragStartStatus, rawRotation]);

    // ────────────────────────────────────────────────────────────────────────
    // TASK MUTATIONS
    // ────────────────────────────────────────────────────────────────────────
    const handleAddTask = useCallback(async (title: string, columnId: ColumnType["id"]) => {
        try {
            const newTask = await api.createTask({
                title,
                status: columnId,
                priority: "none",
                task_type: "other",
            });
            setTasks(prev => [...prev, newTask]);
        } catch (err) {
            console.error("Failed to create task:", err);
            throw err;
        }
    }, []);

    const handleUpdatePriority = useCallback(async (taskId: string, priority: Priority) => {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority } : t));

        try {
            await api.updateTask(taskId, { priority });
        } catch (err) {
            console.error("Failed to update priority:", err);
            // Revert on error
            await refreshTasks();
        }
    }, [refreshTasks]);

    const handleUpdateStatus = useCallback(async (taskId: string, status: ColumnType["id"]) => {
        const task = tasks.find(t => t.id === taskId);
        const previousStatus = task?.status;

        // Optimistic update
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));

        if (status === "done" && previousStatus !== "done") {
            setShowConfetti(true);
        }

        try {
            await api.updateTask(taskId, { status });
        } catch (err) {
            console.error("Failed to update status:", err);
            await refreshTasks();
        }
    }, [tasks, refreshTasks]);

    const handleAddDependency = useCallback(async (taskId: string, dependencyId: string, type: "blocking" | "blockedBy") => {
        try {
            if (type === "blockedBy") {
                // taskId is blocked by dependencyId
                // In API terms: taskId depends on dependencyId
                await api.createDependency(taskId, dependencyId);
            } else {
                // taskId blocks dependencyId
                // In API terms: dependencyId depends on taskId
                await api.createDependency(dependencyId, taskId);
            }
            // Refresh to get updated dependencies
            await refreshTasks();
        } catch (err) {
            console.error("Failed to add dependency:", err);
            throw err;
        }
    }, [refreshTasks]);

    const handleRemoveDependency = useCallback(async (taskId: string, targetId: string, type: "blocking" | "blockedBy") => {
        try {
            // Find the dependency to delete
            const deps = await api.fetchDependenciesForTask(taskId);

            let depToDelete;
            if (type === "blockedBy") {
                // taskId is blocked by targetId
                depToDelete = deps.find(d =>
                    d.task_id === Number(taskId) && d.depends_on_task_id === Number(targetId)
                );
            } else {
                // taskId blocks targetId
                depToDelete = deps.find(d =>
                    d.task_id === Number(targetId) && d.depends_on_task_id === Number(taskId)
                );
            }

            if (depToDelete) {
                await api.deleteDependency(depToDelete.id);
                await refreshTasks();
            }
        } catch (err) {
            console.error("Failed to remove dependency:", err);
            throw err;
        }
    }, [refreshTasks]);

    const handleUpdateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
        setSelectedTask(prev => prev?.id === taskId ? { ...prev, ...updates } : prev);

        if (updates.status === "done") {
            const task = tasks.find(t => t.id === taskId);
            if (task && task.status !== "done") {
                setShowConfetti(true);
            }
        }

        try {
            const apiUpdates: api.UpdateTaskData = {};
            if (updates.title !== undefined) apiUpdates.title = updates.title;
            if (updates.description !== undefined) apiUpdates.description = updates.description || undefined;
            if (updates.status !== undefined) apiUpdates.status = updates.status;
            if (updates.priority !== undefined) apiUpdates.priority = updates.priority;
            if (updates.taskType !== undefined) apiUpdates.task_type = updates.taskType;
            if (updates.tags !== undefined) apiUpdates.tags = updates.tags;
            if (updates.assignee !== undefined) {
                apiUpdates.assigned_user_id = updates.assignee ? Number(updates.assignee.id) : null;
            }

            if (Object.keys(apiUpdates).length > 0) {
                await api.updateTask(taskId, apiUpdates);
            }
        } catch (err) {
            console.error("Failed to update task:", err);
            await refreshTasks();
        }
    }, [tasks, refreshTasks]);

    const handleDeleteTask = useCallback(async (taskId: string) => {
        // Optimistic update
        setTasks(prev => prev.filter(t => t.id !== taskId));

        try {
            await api.deleteTask(taskId);
        } catch (err) {
            console.error("Failed to delete task:", err);
            await refreshTasks();
        }
    }, [refreshTasks]);

    const openTaskDetail = useCallback((task: Task) => {
        setSelectedTask(task);
        setIsDetailModalOpen(true);
    }, []);

    const closeTaskDetail = useCallback(() => {
        setIsDetailModalOpen(false);
        setTimeout(() => setSelectedTask(null), 200);
    }, []);

    const dismissConfetti = useCallback(() => {
        setShowConfetti(false);
        setConfettiPosition(null);
    }, []);

    // ────────────────────────────────────────────────────────────────────────
    // FILTER ACTIONS
    // ────────────────────────────────────────────────────────────────────────
    const setSearchText = useCallback((text: string) => {
        setFilters(prev => ({ ...prev, searchText: text }));
    }, []);

    const togglePriorityFilter = useCallback((priority: Priority) => {
        setFilters(prev => ({
            ...prev,
            priorities: prev.priorities.includes(priority)
                ? prev.priorities.filter(p => p !== priority)
                : [...prev.priorities, priority]
        }));
    }, []);

    const toggleAssigneeFilter = useCallback((assigneeId: string) => {
        setFilters(prev => ({
            ...prev,
            assignees: prev.assignees.includes(assigneeId)
                ? prev.assignees.filter(id => id !== assigneeId)
                : [...prev.assignees, assigneeId]
        }));
    }, []);

    const toggleTypeFilter = useCallback((taskType: TaskType) => {
        setFilters(prev => ({
            ...prev,
            taskTypes: prev.taskTypes.includes(taskType)
                ? prev.taskTypes.filter(t => t !== taskType)
                : [...prev.taskTypes, taskType]
        }));
    }, []);

    const toggleTagFilter = useCallback((tag: string) => {
        setFilters(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters(defaultFilters);
    }, []);

    // ────────────────────────────────────────────────────────────────────────
    // CONTEXT VALUE
    // ────────────────────────────────────────────────────────────────────────
    const currentSelectedTask = useMemo(() => {
        if (!selectedTask) return null;
        return tasks.find(t => t.id === selectedTask.id) || null;
    }, [selectedTask, tasks]);

    const contextValue: BoardContextType = {
        tasks,
        columns,
        activeTask,
        showConfetti,
        confettiPosition,
        selectedTask: currentSelectedTask,
        isDetailModalOpen,
        isLoading,
        error,
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
        openTaskDetail,
        closeTaskDetail,
        refreshTasks,
        setSearchText,
        togglePriorityFilter,
        toggleAssigneeFilter,
        toggleTypeFilter,
        toggleTagFilter,
        resetFilters,
    };

    return (
        <BoardContext.Provider value={contextValue}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
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
                                x: [0, -10, 10, -10, 10, -5, 5, 0],
                                rotate: [0, -3, 3, -3, 3, -1, 1, 0],
                                boxShadow: "0 10px 30px rgba(239,68,68,0.3)",
                            } : {
                                scale: 1.05,
                                x: 0,
                                boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
                            }}
                            style={{
                                rotate: isShaking ? undefined : smoothRotation,
                            }}
                            transition={isShaking ? {
                                duration: 0.5,
                                ease: "easeInOut",
                            } : {
                                scale: { type: "spring", stiffness: 350, damping: 30 },
                            }}
                            className="cursor-grabbing"
                        >
                            <TaskCard task={activeTask} />
                        </motion.div>
                    )}
                </DndKitDragOverlay>
            </DndContext>

            <TaskDetailModal
                task={currentSelectedTask}
                open={isDetailModalOpen}
                onOpenChange={(open) => {
                    if (!open) closeTaskDetail();
                }}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onAddDependency={handleAddDependency}
                onRemoveDependency={handleRemoveDependency}
                allTasks={tasks}
            />
        </BoardContext.Provider>
    );
}
