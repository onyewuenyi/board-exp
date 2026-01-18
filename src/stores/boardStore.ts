"use client";

import { useMemo } from "react";

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { subscribeWithSelector } from "zustand/middleware";
import { Task, ColumnType, Priority, TaskType, User, Subtask, TaskLink } from "@/types";
import { UniqueIdentifier } from "@dnd-kit/core";
import * as api from "@/lib/api";
import { toast } from "sonner";

// ============================================================================
// TYPES
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

// Priority weights for sorting
const PRIORITY_WEIGHTS: Record<Priority, number> = {
    urgent: 4,
    high: 3,
    med: 2,
    low: 1,
    none: 0,
};

// ============================================================================
// STORE STATE INTERFACE
// ============================================================================
interface BoardState {
    // Core task data
    tasks: Task[];
    isLoading: boolean;
    error: string | null;

    // Drag state (rapid updates during drag)
    activeId: UniqueIdentifier | null;
    dragStartStatus: ColumnType["id"] | null;
    isShaking: boolean;

    // UI state
    expandedTaskId: string | null;
    editingTaskId: string | null;
    showConfetti: boolean;
    confettiPosition: ConfettiPosition | null;
    filters: FilterState;

    // Actions - Data
    setTasks: (tasks: Task[]) => void;
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    refreshTasks: () => Promise<void>;

    // Actions - Drag
    setActiveId: (id: UniqueIdentifier | null) => void;
    setDragStartStatus: (status: ColumnType["id"] | null) => void;
    setIsShaking: (shaking: boolean) => void;

    // Actions - UI
    toggleTaskExpanded: (taskId: string) => void;
    collapseAllTasks: () => void;
    setEditingTaskId: (taskId: string | null) => void;
    openTaskEditor: (taskId: string) => void;
    closeTaskEditor: () => void;
    setShowConfetti: (show: boolean) => void;
    setConfettiPosition: (position: ConfettiPosition | null) => void;
    dismissConfetti: () => void;

    // Actions - Filters
    setSearchText: (text: string) => void;
    togglePriorityFilter: (priority: Priority) => void;
    toggleAssigneeFilter: (assigneeId: string) => void;
    toggleTypeFilter: (taskType: TaskType) => void;
    toggleTagFilter: (tag: string) => void;
    resetFilters: () => void;

    // Actions - Task mutations
    handleAddTask: (title: string, columnId: ColumnType["id"], options?: AddTaskOptions) => Promise<void>;
    handleUpdatePriority: (taskId: string, priority: Priority) => void;
    handleUpdateStatus: (taskId: string, status: ColumnType["id"]) => void;
    handleUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    handleDeleteTask: (taskId: string) => void;
    handleAddDependency: (taskId: string, dependencyId: string, type: "blocking" | "blockedBy") => void;
    handleRemoveDependency: (taskId: string, targetId: string, type: "blocking" | "blockedBy") => void;

    // Actions - Subtasks
    handleAddSubtask: (taskId: string, title: string) => Promise<void>;
    handleToggleSubtask: (taskId: string, subtaskId: string, completed: boolean) => Promise<void>;
    handleRemoveSubtask: (taskId: string, subtaskId: string) => Promise<void>;

    // Actions - Links
    handleAddLink: (taskId: string, url: string, title?: string) => Promise<void>;
    handleRemoveLink: (taskId: string, linkId: string) => Promise<void>;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================
export const useBoardStore = create<BoardState>()(
    subscribeWithSelector((set, get) => ({
        // Initial state
        tasks: [],
        isLoading: true,
        error: null,
        activeId: null,
        dragStartStatus: null,
        isShaking: false,
        expandedTaskId: null,
        editingTaskId: null,
        showConfetti: false,
        confettiPosition: null,
        filters: defaultFilters,

        // ─────────────────────────────────────────────────────────────────────
        // DATA ACTIONS
        // ─────────────────────────────────────────────────────────────────────
        setTasks: (tasks) => set({ tasks }),
        setIsLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),

        refreshTasks: async () => {
            try {
                set({ error: null });
                const fetchedTasks = await api.fetchTasks();
                set({ tasks: fetchedTasks });
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to fetch tasks";
                set({ error: message });
                console.error("Failed to fetch tasks:", err);
            }
        },

        // ─────────────────────────────────────────────────────────────────────
        // DRAG ACTIONS (separate to avoid re-renders in non-drag components)
        // ─────────────────────────────────────────────────────────────────────
        setActiveId: (activeId) => set({ activeId }),
        setDragStartStatus: (dragStartStatus) => set({ dragStartStatus }),
        setIsShaking: (isShaking) => set({ isShaking }),

        // ─────────────────────────────────────────────────────────────────────
        // UI ACTIONS
        // ─────────────────────────────────────────────────────────────────────
        toggleTaskExpanded: (taskId) => set((state) => ({
            expandedTaskId: state.expandedTaskId === taskId ? null : taskId
        })),

        collapseAllTasks: () => set({ expandedTaskId: null }),

        setEditingTaskId: (editingTaskId) => set({ editingTaskId }),
        openTaskEditor: (taskId) => set({ editingTaskId: taskId, expandedTaskId: null }),
        closeTaskEditor: () => set({ editingTaskId: null }),

        setShowConfetti: (showConfetti) => set({ showConfetti }),
        setConfettiPosition: (confettiPosition) => set({ confettiPosition }),

        dismissConfetti: () => set({
            showConfetti: false,
            confettiPosition: null
        }),

        // ─────────────────────────────────────────────────────────────────────
        // FILTER ACTIONS
        // ─────────────────────────────────────────────────────────────────────
        setSearchText: (text) => set((state) => ({
            filters: { ...state.filters, searchText: text }
        })),

        togglePriorityFilter: (priority) => set((state) => ({
            filters: {
                ...state.filters,
                priorities: state.filters.priorities.includes(priority)
                    ? state.filters.priorities.filter(p => p !== priority)
                    : [...state.filters.priorities, priority]
            }
        })),

        toggleAssigneeFilter: (assigneeId) => set((state) => ({
            filters: {
                ...state.filters,
                assignees: state.filters.assignees.includes(assigneeId)
                    ? state.filters.assignees.filter(id => id !== assigneeId)
                    : [...state.filters.assignees, assigneeId]
            }
        })),

        toggleTypeFilter: (taskType) => set((state) => ({
            filters: {
                ...state.filters,
                taskTypes: state.filters.taskTypes.includes(taskType)
                    ? state.filters.taskTypes.filter(t => t !== taskType)
                    : [...state.filters.taskTypes, taskType]
            }
        })),

        toggleTagFilter: (tag) => set((state) => ({
            filters: {
                ...state.filters,
                tags: state.filters.tags.includes(tag)
                    ? state.filters.tags.filter(t => t !== tag)
                    : [...state.filters.tags, tag]
            }
        })),

        resetFilters: () => set({ filters: defaultFilters }),

        // ─────────────────────────────────────────────────────────────────────
        // TASK MUTATIONS
        // ─────────────────────────────────────────────────────────────────────
        handleAddTask: async (title, columnId, options) => {
            try {
                // Create the task
                const newTask = await api.createTask({
                    title,
                    status: columnId,
                    priority: options?.priority || "none",
                    task_type: options?.taskType || "other",
                    tags: options?.tags,
                    assigned_user_id: options?.assignee ? Number(options.assignee.id) : undefined,
                    description: options?.description || undefined,
                    due_date: options?.dueDate ? options.dueDate.toISOString().split('T')[0] : undefined,
                });

                // Add to state immediately
                set((state) => ({ tasks: [...state.tasks, newTask] }));

                // Create subtasks if any
                if (options?.subtasks && options.subtasks.length > 0) {
                    for (const subtask of options.subtasks) {
                        try {
                            const created = await api.createSubtask(newTask.id, subtask.title);
                            set((state) => ({
                                tasks: state.tasks.map(t =>
                                    t.id === newTask.id
                                        ? { ...t, subtasks: [...(t.subtasks || []), { id: created.id, title: created.title, completed: created.completed }] }
                                        : t
                                )
                            }));
                        } catch (err) {
                            console.error("Failed to create subtask:", err);
                        }
                    }
                }

                // Create dependencies if any
                if (options?.blockedBy && options.blockedBy.length > 0) {
                    for (const depId of options.blockedBy) {
                        try {
                            await api.createDependency(newTask.id, depId);
                        } catch (err) {
                            console.error("Failed to create blockedBy dependency:", err);
                        }
                    }
                }

                if (options?.blocking && options.blocking.length > 0) {
                    for (const depId of options.blocking) {
                        try {
                            await api.createDependency(depId, newTask.id);
                        } catch (err) {
                            console.error("Failed to create blocking dependency:", err);
                        }
                    }
                }

                // Refresh to get all dependencies properly
                if ((options?.blockedBy && options.blockedBy.length > 0) || (options?.blocking && options.blocking.length > 0)) {
                    await get().refreshTasks();
                }
            } catch (err) {
                console.error("Failed to create task:", err);
                throw err;
            }
        },

        handleUpdatePriority: async (taskId, priority) => {
            const { tasks, refreshTasks } = get();
            // Optimistic update
            set({ tasks: tasks.map(t => t.id === taskId ? { ...t, priority } : t) });

            try {
                await api.updateTask(taskId, { priority });
            } catch (err) {
                console.error("Failed to update priority:", err);
                toast.error("Failed to update priority");
                await refreshTasks();
            }
        },

        handleUpdateStatus: async (taskId, status) => {
            const { tasks, refreshTasks } = get();
            const task = tasks.find(t => t.id === taskId);
            const previousStatus = task?.status;

            // Optimistic update
            set({ tasks: tasks.map(t => t.id === taskId ? { ...t, status } : t) });

            if (status === "done" && previousStatus !== "done") {
                set({ showConfetti: true });
            }

            try {
                await api.updateTask(taskId, { status });
            } catch (err) {
                console.error("Failed to update status:", err);
                toast.error("Failed to update status");
                await refreshTasks();
            }
        },

        handleAddDependency: async (taskId, dependencyId, type) => {
            const { refreshTasks } = get();
            try {
                if (type === "blockedBy") {
                    await api.createDependency(taskId, dependencyId);
                } else {
                    await api.createDependency(dependencyId, taskId);
                }
                await refreshTasks();
            } catch (err) {
                console.error("Failed to add dependency:", err);
                throw err;
            }
        },

        handleRemoveDependency: async (taskId, targetId, type) => {
            const { refreshTasks } = get();
            try {
                const deps = await api.fetchDependenciesForTask(taskId);

                let depToDelete;
                if (type === "blockedBy") {
                    depToDelete = deps.find(d =>
                        d.task_id === Number(taskId) && d.depends_on_task_id === Number(targetId)
                    );
                } else {
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
        },

        handleUpdateTask: async (taskId, updates) => {
            const { tasks, refreshTasks } = get();

            // Optimistic update
            set({ tasks: tasks.map(t => t.id === taskId ? { ...t, ...updates } : t) });

            if (updates.status === "done") {
                const task = tasks.find(t => t.id === taskId);
                if (task && task.status !== "done") {
                    set({ showConfetti: true });
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
                toast.error("Failed to save changes");
                await refreshTasks();
            }
        },

        handleDeleteTask: async (taskId) => {
            const { tasks, refreshTasks } = get();
            const deletedTask = tasks.find(t => t.id === taskId);

            if (!deletedTask) return;

            // Optimistic update
            set({ tasks: tasks.filter(t => t.id !== taskId) });

            // Show toast with undo option
            const toastId = toast("Task deleted", {
                description: deletedTask.title,
                action: {
                    label: "Undo",
                    onClick: async () => {
                        // Restore task in UI immediately
                        set((state) => ({
                            tasks: [...state.tasks, deletedTask],
                        }));
                        // Recreate task in backend
                        try {
                            const recreated = await api.createTask({
                                title: deletedTask.title,
                                description: deletedTask.description,
                                status: deletedTask.status,
                                priority: deletedTask.priority,
                                task_type: deletedTask.taskType,
                                tags: deletedTask.tags,
                                assigned_user_id: deletedTask.assignee ? Number(deletedTask.assignee.id) : undefined,
                            });
                            // Replace temp task with recreated one
                            set((state) => ({
                                tasks: state.tasks.map(t =>
                                    t.id === deletedTask.id ? recreated : t
                                ),
                            }));
                            toast.success("Task restored");
                        } catch {
                            toast.error("Failed to restore task");
                            await refreshTasks();
                        }
                    },
                },
                duration: 5000,
            });

            try {
                await api.deleteTask(taskId);
            } catch (err) {
                console.error("Failed to delete task:", err);
                toast.dismiss(toastId);
                toast.error("Failed to delete task");
                await refreshTasks();
            }
        },

        // ─────────────────────────────────────────────────────────────────────
        // SUBTASK HANDLERS (with API persistence)
        // ─────────────────────────────────────────────────────────────────────
        handleAddSubtask: async (taskId, title) => {
            const { tasks } = get();
            // Optimistic update with temporary ID
            const tempId = `temp-subtask-${Date.now()}`;
            const tempSubtask: Subtask = {
                id: tempId,
                title,
                completed: false,
            };
            set({
                tasks: tasks.map(t =>
                    t.id === taskId
                        ? { ...t, subtasks: [...(t.subtasks || []), tempSubtask] }
                        : t
                )
            });

            try {
                const created = await api.createSubtask(taskId, title);
                // Replace temp subtask with real one
                set((state) => ({
                    tasks: state.tasks.map(t =>
                        t.id === taskId
                            ? {
                                ...t,
                                subtasks: t.subtasks?.map(st =>
                                    st.id === tempId
                                        ? { id: created.id, title: created.title, completed: created.completed }
                                        : st
                                )
                            }
                            : t
                    )
                }));
            } catch (err) {
                console.error("Failed to create subtask:", err);
                toast.error("Failed to add subtask");
                // Rollback on error
                set((state) => ({
                    tasks: state.tasks.map(t =>
                        t.id === taskId
                            ? { ...t, subtasks: t.subtasks?.filter(st => st.id !== tempId) }
                            : t
                    )
                }));
                throw err;
            }
        },

        handleToggleSubtask: async (taskId, subtaskId, completed) => {
            const { tasks } = get();
            const task = tasks.find(t => t.id === taskId);
            const previousCompleted = task?.subtasks?.find(st => st.id === subtaskId)?.completed;

            // Optimistic update
            set({
                tasks: tasks.map(t =>
                    t.id === taskId
                        ? {
                            ...t,
                            subtasks: t.subtasks?.map(st =>
                                st.id === subtaskId ? { ...st, completed } : st
                            )
                        }
                        : t
                )
            });

            try {
                await api.updateSubtask(subtaskId, { completed });
            } catch (err) {
                console.error("Failed to toggle subtask:", err);
                toast.error("Failed to update subtask");
                // Rollback on error
                set((state) => ({
                    tasks: state.tasks.map(t =>
                        t.id === taskId
                            ? {
                                ...t,
                                subtasks: t.subtasks?.map(st =>
                                    st.id === subtaskId ? { ...st, completed: previousCompleted ?? !completed } : st
                                )
                            }
                            : t
                    )
                }));
                throw err;
            }
        },

        handleRemoveSubtask: async (taskId, subtaskId) => {
            const { tasks } = get();
            const task = tasks.find(t => t.id === taskId);
            const removedSubtask = task?.subtasks?.find(st => st.id === subtaskId);

            // Optimistic update
            set({
                tasks: tasks.map(t =>
                    t.id === taskId
                        ? { ...t, subtasks: t.subtasks?.filter(st => st.id !== subtaskId) }
                        : t
                )
            });

            try {
                await api.deleteSubtask(subtaskId);
            } catch (err) {
                console.error("Failed to delete subtask:", err);
                toast.error("Failed to delete subtask");
                // Rollback on error
                if (removedSubtask) {
                    set((state) => ({
                        tasks: state.tasks.map(t =>
                            t.id === taskId
                                ? { ...t, subtasks: [...(t.subtasks || []), removedSubtask] }
                                : t
                        )
                    }));
                }
                throw err;
            }
        },

        // ─────────────────────────────────────────────────────────────────────
        // LINK HANDLERS (with API persistence)
        // ─────────────────────────────────────────────────────────────────────
        handleAddLink: async (taskId, url, title) => {
            const { tasks } = get();
            // Optimistic update with temporary ID
            const tempId = `temp-link-${Date.now()}`;
            const tempLink: TaskLink = {
                id: tempId,
                url,
                title,
            };
            set({
                tasks: tasks.map(t =>
                    t.id === taskId
                        ? { ...t, links: [...(t.links || []), tempLink] }
                        : t
                )
            });

            try {
                const created = await api.createLink(taskId, url, title);
                // Replace temp link with real one
                set((state) => ({
                    tasks: state.tasks.map(t =>
                        t.id === taskId
                            ? {
                                ...t,
                                links: t.links?.map(l =>
                                    l.id === tempId
                                        ? { id: created.id, url: created.url, title: created.title }
                                        : l
                                )
                            }
                            : t
                    )
                }));
            } catch (err) {
                console.error("Failed to create link:", err);
                toast.error("Failed to add link");
                // Rollback on error
                set((state) => ({
                    tasks: state.tasks.map(t =>
                        t.id === taskId
                            ? { ...t, links: t.links?.filter(l => l.id !== tempId) }
                            : t
                    )
                }));
                throw err;
            }
        },

        handleRemoveLink: async (taskId, linkId) => {
            const { tasks } = get();
            const task = tasks.find(t => t.id === taskId);
            const removedLink = task?.links?.find(l => l.id === linkId);

            // Optimistic update
            set({
                tasks: tasks.map(t =>
                    t.id === taskId
                        ? { ...t, links: t.links?.filter(l => l.id !== linkId) }
                        : t
                )
            });

            try {
                await api.deleteLink(linkId);
            } catch (err) {
                console.error("Failed to delete link:", err);
                toast.error("Failed to delete link");
                // Rollback on error
                if (removedLink) {
                    set((state) => ({
                        tasks: state.tasks.map(t =>
                            t.id === taskId
                                ? { ...t, links: [...(t.links || []), removedLink] }
                                : t
                        )
                    }));
                }
                throw err;
            }
        },
    }))
);

// ============================================================================
// SELECTIVE HOOKS - Only subscribe to what you need
// ============================================================================

// Derived data selectors (computed from tasks + filters)
// Derived data selectors (computed from tasks + filters)
export const useFilteredTasks = () => {
    const { tasks, filters } = useBoardStore(
        useShallow((state) => ({
            tasks: state.tasks,
            filters: state.filters,
        }))
    );

    return useMemo(() => {
        return tasks.filter((task) => {
            if (filters.searchText) {
                const search = filters.searchText.toLowerCase();
                if (
                    !task.title.toLowerCase().includes(search) &&
                    !task.id.toLowerCase().includes(search)
                ) {
                    return false;
                }
            }
            if (
                filters.priorities.length > 0 &&
                !filters.priorities.includes(task.priority)
            ) {
                return false;
            }
            if (
                filters.assignees.length > 0 &&
                (!task.assignee || !filters.assignees.includes(task.assignee.id))
            ) {
                return false;
            }
            if (
                filters.taskTypes.length > 0 &&
                (!task.taskType || !filters.taskTypes.includes(task.taskType))
            ) {
                return false;
            }
            if (
                filters.tags.length > 0 &&
                (!task.tags || !task.tags.some((t) => filters.tags.includes(t)))
            ) {
                return false;
            }
            return true;
        });
    }, [tasks, filters]);
};

export const useColumns = (): ColumnType[] => {
    const filteredTasks = useFilteredTasks();

    const getTasksByStatus = (status: ColumnType["id"]) => {
        const statusTasks = filteredTasks.filter(t => t.status === status);
        return statusTasks.sort((a, b) => {
            const weightA = PRIORITY_WEIGHTS[a.priority];
            const weightB = PRIORITY_WEIGHTS[b.priority];
            if (weightA !== weightB) return weightB - weightA;
            return b.createdAt - a.createdAt;
        });
    };

    return [
        { id: "todo", title: "To Do", tasks: getTasksByStatus("todo") },
        { id: "in-progress", title: "In Progress", tasks: getTasksByStatus("in-progress") },
        { id: "done", title: "Done", tasks: getTasksByStatus("done") },
    ];
};

export const useActiveTask = () => {
    return useBoardStore((state) => {
        if (!state.activeId) return null;
        return state.tasks.find(t => t.id === state.activeId) || null;
    });
};

export const useUniqueAssignees = (): User[] => {
    const tasks = useBoardStore((state) => state.tasks);

    return useMemo(() => {
        const map = new Map<string, User>();
        tasks.forEach((t) => t.assignee && map.set(t.assignee.id, t.assignee));
        return Array.from(map.values());
    }, [tasks]);
};

export const useUniqueTags = (): string[] => {
    const tasks = useBoardStore((state) => state.tasks);

    return useMemo(() => {
        const set = new Set<string>();
        tasks.forEach((t) => t.tags?.forEach((tag) => set.add(tag)));
        return Array.from(set).sort();
    }, [tasks]);
};

// Drag state selectors (isolated for drag overlay)
export const useDragState = () => {
    return useBoardStore(useShallow((state) => ({
        activeId: state.activeId,
        dragStartStatus: state.dragStartStatus,
        isShaking: state.isShaking,
        setActiveId: state.setActiveId,
        setDragStartStatus: state.setDragStartStatus,
        setIsShaking: state.setIsShaking,
    })));
};

// Confetti state selector
export const useConfetti = () => {
    return useBoardStore(useShallow((state) => ({
        showConfetti: state.showConfetti,
        confettiPosition: state.confettiPosition,
        dismissConfetti: state.dismissConfetti,
        setShowConfetti: state.setShowConfetti,
        setConfettiPosition: state.setConfettiPosition,
    })));
};

// Loading/error state selector
export const useLoadingState = () => {
    return useBoardStore(useShallow((state) => ({
        isLoading: state.isLoading,
        error: state.error,
        refreshTasks: state.refreshTasks,
        setIsLoading: state.setIsLoading,
        setError: state.setError,
    })));
};

// Expanded task selector
export const useExpandedTask = () => {
    return useBoardStore(useShallow((state) => ({
        expandedTaskId: state.expandedTaskId,
        toggleTaskExpanded: state.toggleTaskExpanded,
        collapseAllTasks: state.collapseAllTasks,
    })));
};

// Editing task selector
export const useEditingTask = () => {
    const editingTaskId = useBoardStore((state) => state.editingTaskId);
    const tasks = useBoardStore((state) => state.tasks);
    const openTaskEditor = useBoardStore((state) => state.openTaskEditor);
    const closeTaskEditor = useBoardStore((state) => state.closeTaskEditor);

    const editingTask = editingTaskId ? tasks.find(t => t.id === editingTaskId) || null : null;

    return {
        editingTaskId,
        editingTask,
        openTaskEditor,
        closeTaskEditor,
    };
};

// Filter state selector
export const useFilters = () => {
    return useBoardStore(useShallow((state) => ({
        filters: state.filters,
        setSearchText: state.setSearchText,
        togglePriorityFilter: state.togglePriorityFilter,
        toggleAssigneeFilter: state.toggleAssigneeFilter,
        toggleTypeFilter: state.toggleTypeFilter,
        toggleTagFilter: state.toggleTagFilter,
        resetFilters: state.resetFilters,
    })));
};

// Task mutation actions selector
export const useTaskActions = () => {
    return useBoardStore(useShallow((state) => ({
        handleAddTask: state.handleAddTask,
        handleUpdatePriority: state.handleUpdatePriority,
        handleUpdateStatus: state.handleUpdateStatus,
        handleUpdateTask: state.handleUpdateTask,
        handleDeleteTask: state.handleDeleteTask,
        handleAddDependency: state.handleAddDependency,
        handleRemoveDependency: state.handleRemoveDependency,
        handleAddSubtask: state.handleAddSubtask,
        handleToggleSubtask: state.handleToggleSubtask,
        handleRemoveSubtask: state.handleRemoveSubtask,
        handleAddLink: state.handleAddLink,
        handleRemoveLink: state.handleRemoveLink,
    })));
};

// All tasks selector (for dependency lookups)
export const useTasks = () => {
    return useBoardStore((state) => state.tasks);
};
