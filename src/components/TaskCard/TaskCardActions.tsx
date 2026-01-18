"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, FileText, ListTodo, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "@/types";

interface TaskCardActionsProps {
    task: Task;
    visible: boolean;
    onActionClick: (action: "failureCost" | "notes" | "subtasks" | "dependencies") => void;
}

const ACTIONS = [
    {
        id: "failureCost" as const,
        icon: AlertTriangle,
        label: "If not done",
        color: "hover:text-amber-400 hover:bg-amber-400/10",
        activeColor: "text-amber-400",
    },
    {
        id: "notes" as const,
        icon: FileText,
        label: "Notes",
        color: "hover:text-blue-400 hover:bg-blue-400/10",
        activeColor: "text-blue-400",
    },
    {
        id: "subtasks" as const,
        icon: ListTodo,
        label: "Subtasks",
        color: "hover:text-purple-400 hover:bg-purple-400/10",
        activeColor: "text-purple-400",
    },
    {
        id: "dependencies" as const,
        icon: GitBranch,
        label: "Dependencies",
        color: "hover:text-green-400 hover:bg-green-400/10",
        activeColor: "text-green-400",
    },
];

/**
 * Hover-reveal action buttons for quick access to secondary input fields.
 * Appears on the right side of the card on hover.
 * Only shows buttons for fields that have data.
 */
export function TaskCardActions({ task, visible, onActionClick }: TaskCardActionsProps) {
    // Check which fields have data
    const hasData = {
        failureCost: Boolean(task.failureCost),
        notes: Boolean(task.description),
        subtasks: Boolean(task.subtasks && task.subtasks.length > 0),
        dependencies: Boolean(
            (task.blocking && task.blocking.length > 0) ||
            (task.blockedBy && task.blockedBy.length > 0)
        ),
    };

    // Filter to only actions with data
    const visibleActions = ACTIONS.filter((action) => hasData[action.id]);

    // Don't render anything if no fields have data
    if (visibleActions.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{
                opacity: visible ? 1 : 0,
                x: visible ? 0 : 10,
            }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2",
                "flex items-center gap-0.5",
                "bg-card/95 backdrop-blur-sm rounded-lg border border-border/50 shadow-lg",
                "p-0.5",
                !visible && "pointer-events-none"
            )}
        >
            {visibleActions.map((action) => {
                const Icon = action.icon;

                return (
                    <button
                        key={action.id}
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onActionClick(action.id);
                        }}
                        className={cn(
                            "w-7 h-7 rounded-md flex items-center justify-center",
                            "transition-colors",
                            action.activeColor,
                            action.color
                        )}
                        title={action.label}
                    >
                        <Icon className="w-3.5 h-3.5" />
                    </button>
                );
            })}
        </motion.div>
    );
}
