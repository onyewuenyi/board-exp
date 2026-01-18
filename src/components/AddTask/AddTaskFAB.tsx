"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskEditDrawer, TaskFormData } from "@/components/TaskDrawer";
import { Task, User } from "@/types";

interface AddTaskFABProps {
    onAdd: (data: TaskFormData) => Promise<void>;
    availableUsers: User[];
    availableTasks: Task[];
}

export function AddTaskFAB({ onAdd, availableUsers, availableTasks }: AddTaskFABProps) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Keyboard shortcut: N to open
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                e.target instanceof HTMLSelectElement
            ) {
                return;
            }

            if (e.key === "n" || e.key === "N") {
                e.preventDefault();
                setIsDrawerOpen(true);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <>
            {/* FAB Button */}
            <motion.button
                onClick={() => setIsDrawerOpen(true)}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 20,
                }}
                className={cn(
                    "fixed bottom-8 right-8 z-50",
                    "w-14 h-14 rounded-full",
                    "bg-accent-linear text-white",
                    "flex items-center justify-center",
                    "shadow-[0_4px_14px_oklch(0.62_0.09_260_/_0.3),0_2px_6px_rgba(0,0,0,0.2)]",
                    "hover:shadow-[0_8px_30px_oklch(0.62_0.09_260_/_0.4),0_4px_10px_rgba(0,0,0,0.15)]",
                    "transition-shadow duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-accent-linear focus:ring-offset-2 focus:ring-offset-background"
                )}
                aria-label="Add new task (N)"
            >
                <motion.div
                    animate={{ rotate: isHovered ? 90 : 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    <Plus className="w-7 h-7" strokeWidth={2.5} />
                </motion.div>
            </motion.button>

            {/* Tooltip on hover */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: 5, x: "-50%" }}
                        transition={{ duration: 0.15 }}
                        className="fixed bottom-24 right-8 transform translate-x-[calc(28px-50%)] z-50 pointer-events-none"
                    >
                        <div className="bg-popover border border-border px-2.5 py-1.5 rounded-md shadow-lg">
                            <span className="text-xs text-foreground whitespace-nowrap">
                                New task{" "}
                                <kbd className="ml-1.5 px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground font-mono">
                                    N
                                </kbd>
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Task Create Drawer */}
            <TaskEditDrawer
                mode="create"
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                onSave={onAdd}
                availableUsers={availableUsers}
                availableTasks={availableTasks}
            />
        </>
    );
}

