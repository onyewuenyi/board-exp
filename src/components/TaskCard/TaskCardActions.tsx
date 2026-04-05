"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, FileText, ListTodo, GitBranch, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "@/types";

interface TaskCardActionsProps {
    task: Task;
    visible: boolean;
    onActionClick: (action: "failureCost" | "notes" | "subtasks" | "dependencies") => void;
    onDuplicate?: () => void;
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
 * Hover-reveal action buttons — floats above the card as a toolbar
 * so it never overlaps content.
 */
export function TaskCardActions({ task, visible, onActionClick, onDuplicate }: TaskCardActionsProps) {
    const hasData = {
        failureCost: Boolean(task.failureCost),
        notes: Boolean(task.description),
        subtasks: Boolean(task.subtasks && task.subtasks.length > 0),
        dependencies: Boolean(task.blocking && task.blocking.length > 0),
    };

    const visibleActions = ACTIONS.filter((action) => hasData[action.id]);
    const showDuplicate = task.status === "done" && onDuplicate;

    // Don't render if no actions to show
    if (visibleActions.length === 0 && !showDuplicate) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{
                opacity: visible ? 1 : 0,
                y: visible ? 0 : 4,
            }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={cn(
                "absolute -top-4 right-2",
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

            {/* Duplicate button — only for done tasks */}
            {showDuplicate && (
                <>
                    {visibleActions.length > 0 && (
                        <div className="w-px h-4 bg-border/30 mx-0.5" />
                    )}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDuplicate();
                        }}
                        className={cn(
                            "w-7 h-7 rounded-md flex items-center justify-center",
                            "transition-colors",
                            "text-cyan-400",
                            "hover:text-cyan-300 hover:bg-cyan-400/10"
                        )}
                        title="Duplicate to To Do"
                    >
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                </>
            )}
        </motion.div>
    );
}
