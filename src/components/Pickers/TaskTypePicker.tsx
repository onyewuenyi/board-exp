"use client";

import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskType } from "@/types";
import { ChevronDown, Check } from "lucide-react";

interface TaskTypePickerProps {
    value: TaskType;
    onChange: (type: TaskType) => void;
}

const TASK_TYPE_CONFIG: Record<TaskType, {
    emoji: string;
    label: string;
    color: string;
}> = {
    chore: { emoji: "🧹", label: "Chore", color: "bg-gray-500/20 text-gray-300" },
    errand: { emoji: "🚗", label: "Errand", color: "bg-blue-500/20 text-blue-300" },
    homework: { emoji: "📚", label: "Homework", color: "bg-purple-500/20 text-purple-300" },
    appointment: { emoji: "📅", label: "Appointment", color: "bg-green-500/20 text-green-300" },
    other: { emoji: "📌", label: "Other", color: "bg-muted text-muted-foreground" },
};

const TASK_TYPE_ORDER: TaskType[] = ["chore", "errand", "homework", "appointment", "other"];

export function TaskTypePicker({ value, onChange }: TaskTypePickerProps) {
    const config = TASK_TYPE_CONFIG[value];

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-7 gap-1.5 text-xs font-medium",
                        "hover:bg-muted",
                        config.color
                    )}
                >
                    <span>{config.emoji}</span>
                    <span>{config.label}</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1 bg-popover border-border" align="start">
                {TASK_TYPE_ORDER.map((type) => {
                    const itemConfig = TASK_TYPE_CONFIG[type];
                    return (
                        <button
                            key={type}
                            type="button"
                            onClick={() => onChange(type)}
                            className={cn(
                                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs",
                                "hover:bg-muted transition-colors",
                                value === type && "bg-muted"
                            )}
                        >
                            <span>{itemConfig.emoji}</span>
                            <span>{itemConfig.label}</span>
                            {value === type && (
                                <Check className="w-3 h-3 ml-auto text-accent-linear" />
                            )}
                        </button>
                    );
                })}
            </PopoverContent>
        </Popover>
    );
}
