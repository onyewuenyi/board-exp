"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DayGroup } from "@/stores/boardStore";
import { WeekTaskRow } from "./WeekTaskRow";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface DaySectionProps {
    group: DayGroup;
    onTaskClick: (taskId: string) => void;
    defaultCollapsed?: boolean;
}

export function DaySection({ group, onTaskClick, defaultCollapsed = false }: DaySectionProps) {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);

    const urgentCount = group.tasks.filter(t => t.priority === "urgent" || t.priority === "high").length;

    return (
        <div className="mb-2 rounded-xl">
            {/* Section header */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center gap-2.5 w-full px-4 py-3 group"
            >
                <ChevronDown className={cn(
                    "w-3.5 h-3.5 text-muted-foreground/40 transition-transform duration-150",
                    collapsed && "-rotate-90"
                )} />

                {/* Label */}
                <span className="text-sm font-semibold tracking-tight text-muted-foreground/70">
                    {group.label}
                </span>

                {/* Date */}
                {group.date && !group.isOverdue && (
                    <span className="text-[11px] text-muted-foreground/30">
                        {group.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                )}

                {/* Counts */}
                <div className="flex items-center gap-2 ml-auto">
                    {urgentCount > 0 && (
                        <span className="text-[10px] font-bold text-red-400/70 bg-red-400/10 px-1.5 py-0.5 rounded-full">
                            {urgentCount} urgent
                        </span>
                    )}
                    <span className={cn(
                        "text-[11px] tabular-nums font-medium",
                        group.tasks.length === 0 ? "text-muted-foreground/20" : "text-muted-foreground/50"
                    )}>
                        {group.tasks.length}
                    </span>
                </div>
            </button>

            {/* Task rows */}
            <AnimatePresence>
                {!collapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="overflow-hidden"
                    >
                        <div className="px-1 pb-2 space-y-0.5">
                            {group.tasks.length === 0 ? (
                                <p className="px-8 py-4 text-xs text-muted-foreground/25 text-center">
                                    {group.isToday ? "All clear for today ✓" : "Nothing scheduled"}
                                </p>
                            ) : (
                                group.tasks.map(task => (
                                    <WeekTaskRow
                                        key={task.id}
                                        task={task}
                                        isOverdue={group.isOverdue}
                                        onClick={() => onTaskClick(task.id)}
                                    />
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
