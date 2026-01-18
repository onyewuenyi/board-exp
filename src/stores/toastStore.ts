"use client";

import { create } from "zustand";
import { Task } from "@/types";

// ============================================================================
// UNDO STACK FOR DESTRUCTIVE ACTIONS
// ============================================================================
interface UndoableAction {
    id: string;
    type: "delete_task";
    task: Task;
    timestamp: number;
}

interface ToastState {
    // Undo stack
    undoStack: UndoableAction[];

    // Actions
    pushUndo: (action: Omit<UndoableAction, "id" | "timestamp">) => string;
    popUndo: (actionId: string) => UndoableAction | null;
    clearExpiredUndos: () => void;
}

const UNDO_TIMEOUT_MS = 5000; // 5 seconds to undo

export const useToastStore = create<ToastState>()((set, get) => ({
    undoStack: [],

    pushUndo: (action) => {
        const id = `undo-${Date.now()}`;
        const newAction: UndoableAction = {
            ...action,
            id,
            timestamp: Date.now(),
        };
        set((state) => ({
            undoStack: [...state.undoStack, newAction],
        }));
        return id;
    },

    popUndo: (actionId) => {
        const { undoStack } = get();
        const action = undoStack.find((a) => a.id === actionId);
        if (action) {
            set((state) => ({
                undoStack: state.undoStack.filter((a) => a.id !== actionId),
            }));
            return action;
        }
        return null;
    },

    clearExpiredUndos: () => {
        const now = Date.now();
        set((state) => ({
            undoStack: state.undoStack.filter(
                (a) => now - a.timestamp < UNDO_TIMEOUT_MS
            ),
        }));
    },
}));
