"use client";

import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Priority } from "@/types";
import {
    Zap,
    SignalHigh,
    SignalMedium,
    SignalLow,
    Circle,
    ChevronDown,
    Check,
} from "lucide-react";

interface PriorityPickerProps {
    value: Priority;
    onChange: (priority: Priority) => void;
    compact?: boolean;
}

const PRIORITY_CONFIG: Record<Priority, {
    icon: typeof Zap;
    label: string;
    shortLabel: string;
    color: string;
    bgColor: string;
}> = {
    urgent: {
        icon: Zap,
        label: "Urgent",
        shortLabel: "Urgent",
        color: "text-red-400",
        bgColor: "bg-red-500/20",
    },
    high: {
        icon: SignalHigh,
        label: "High",
        shortLabel: "High",
        color: "text-orange-400",
        bgColor: "bg-orange-500/20",
    },
    med: {
        icon: SignalMedium,
        label: "Medium",
        shortLabel: "Med",
        color: "text-amber-400",
        bgColor: "bg-amber-400/20",
    },
    low: {
        icon: SignalLow,
        label: "Low",
        shortLabel: "Low",
        color: "text-blue-400",
        bgColor: "bg-blue-500/20",
    },
    none: {
        icon: Circle,
        label: "No priority",
        shortLabel: "Priority",
        color: "text-muted-foreground",
        bgColor: "bg-muted",
    },
};

const PRIORITY_ORDER: Priority[] = ["urgent", "high", "med", "low", "none"];

export function PriorityPicker({ value, onChange, compact = false }: PriorityPickerProps) {
    const config = PRIORITY_CONFIG[value];
    const Icon = config.icon;

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
                        value !== "none" && config.bgColor,
                        value !== "none" && config.color
                    )}
                >
                    <Icon className="w-3.5 h-3.5" />
                    {!compact && <span>{config.shortLabel}</span>}
                    <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-36 p-1 bg-popover border-border" align="start">
                {PRIORITY_ORDER.map((priority) => {
                    const itemConfig = PRIORITY_CONFIG[priority];
                    const ItemIcon = itemConfig.icon;
                    return (
                        <button
                            key={priority}
                            type="button"
                            onClick={() => onChange(priority)}
                            className={cn(
                                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs",
                                "hover:bg-muted transition-colors",
                                value === priority && "bg-muted"
                            )}
                        >
                            <ItemIcon className={cn("w-3.5 h-3.5", itemConfig.color)} />
                            <span>{itemConfig.label}</span>
                            {value === priority && (
                                <Check className="w-3 h-3 ml-auto text-accent-linear" />
                            )}
                        </button>
                    );
                })}
            </PopoverContent>
        </Popover>
    );
}
