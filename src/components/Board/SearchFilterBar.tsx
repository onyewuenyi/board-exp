"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useBoard } from "./BoardProvider";
import { FilterPopover } from "./FilterPopover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
    Search,
    X,
    Zap,
    SignalHigh,
    SignalMedium,
    SignalLow,
    Circle,
    LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Priority, TaskType } from "@/types";

// ============================================================================
// PRIORITY OPTIONS with icons
// ============================================================================
const PRIORITY_OPTIONS: { value: Priority; label: string; icon: React.ReactNode }[] = [
    { value: "urgent", label: "Urgent", icon: <Zap className="w-3.5 h-3.5 text-red-500" /> },
    { value: "high", label: "High", icon: <SignalHigh className="w-3.5 h-3.5 text-orange-500" /> },
    { value: "med", label: "Medium", icon: <SignalMedium className="w-3.5 h-3.5 text-amber-400" /> },
    { value: "low", label: "Low", icon: <SignalLow className="w-3.5 h-3.5 text-blue-500" /> },
    { value: "none", label: "None", icon: <Circle className="w-3.5 h-3.5 text-muted-foreground" /> },
];

// ============================================================================
// TASK TYPE OPTIONS with emoji
// ============================================================================
const TASK_TYPE_OPTIONS: { value: TaskType; label: string; icon: React.ReactNode }[] = [
    { value: "chore", label: "Chore", icon: <span>🧹</span> },
    { value: "errand", label: "Errand", icon: <span>🚗</span> },
    { value: "homework", label: "Homework", icon: <span>📚</span> },
    { value: "appointment", label: "Appointment", icon: <span>📅</span> },
    { value: "other", label: "Other", icon: <span>📌</span> },
];

// ============================================================================
// ACTIVE FILTER BADGE
// ============================================================================
function ActiveFilterBadge({
    label,
    icon,
    onRemove,
    colorClass = "bg-primary/10 text-primary",
}: {
    label: string;
    icon?: React.ReactNode;
    onRemove: () => void;
    colorClass?: string;
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                colorClass
            )}
        >
            {icon}
            <span>{label}</span>
            <button
                onClick={onRemove}
                className="ml-0.5 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${label} filter`}
            >
                <X className="w-2.5 h-2.5" />
            </button>
        </span>
    );
}

// ============================================================================
// PRIORITY BADGE COLOR MAPPING
// ============================================================================
const PRIORITY_BADGE_COLORS: Record<Priority, string> = {
    urgent: "bg-red-500/15 text-red-400",
    high: "bg-orange-500/15 text-orange-400",
    med: "bg-amber-400/15 text-amber-400",
    low: "bg-blue-500/15 text-blue-400",
    none: "bg-white/10 text-muted-foreground",
};

// ============================================================================
// SEARCH FILTER BAR COMPONENT
// ============================================================================
export function SearchFilterBar() {
    const {
        filters,
        setSearchText,
        togglePriorityFilter,
        toggleAssigneeFilter,
        toggleTypeFilter,
        toggleTagFilter,
        resetFilters,
        uniqueAssignees,
        uniqueTags,
    } = useBoard();

    // Local search state for debouncing
    const [localSearch, setLocalSearch] = useState(filters.searchText);

    // Debounce search text updates
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchText(localSearch);
        }, 200);
        return () => clearTimeout(timer);
    }, [localSearch, setSearchText]);

    // Sync local search with filters (e.g., when reset is called)
    useEffect(() => {
        setLocalSearch(filters.searchText);
    }, [filters.searchText]);

    // Check if any filters are active
    const hasActiveFilters =
        filters.searchText.length > 0 ||
        filters.priorities.length > 0 ||
        filters.assignees.length > 0 ||
        filters.taskTypes.length > 0 ||
        filters.tags.length > 0;

    // Build assignee options from unique assignees
    const assigneeOptions = uniqueAssignees.map((user) => ({
        value: user.id,
        label: user.name,
        icon: (
            <Avatar className="w-4 h-4">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-[8px]">{user.name[0]}</AvatarFallback>
            </Avatar>
        ),
    }));

    // Build tag options from unique tags
    const tagOptions = uniqueTags.map((tag) => ({
        value: tag,
        label: tag,
        icon: <span className="text-muted-foreground">#</span>,
    }));

    // Get active filter details for badges
    const getActiveFilters = useCallback(() => {
        const active: {
            type: "priority" | "assignee" | "type" | "tag";
            value: string;
            label: string;
            icon?: React.ReactNode;
            colorClass?: string;
        }[] = [];

        // Priority filters
        filters.priorities.forEach((p) => {
            const option = PRIORITY_OPTIONS.find((o) => o.value === p);
            if (option) {
                active.push({
                    type: "priority",
                    value: p,
                    label: option.label,
                    icon: option.icon,
                    colorClass: PRIORITY_BADGE_COLORS[p],
                });
            }
        });

        // Assignee filters
        filters.assignees.forEach((id) => {
            const user = uniqueAssignees.find((u) => u.id === id);
            if (user) {
                active.push({
                    type: "assignee",
                    value: id,
                    label: user.name,
                    icon: (
                        <Avatar className="w-3 h-3">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-[6px]">{user.name[0]}</AvatarFallback>
                        </Avatar>
                    ),
                });
            }
        });

        // Type filters
        filters.taskTypes.forEach((t) => {
            const option = TASK_TYPE_OPTIONS.find((o) => o.value === t);
            if (option) {
                active.push({
                    type: "type",
                    value: t,
                    label: option.label,
                    icon: option.icon,
                });
            }
        });

        // Tag filters
        filters.tags.forEach((tag) => {
            active.push({
                type: "tag",
                value: tag,
                label: tag,
                icon: <span className="text-muted-foreground">#</span>,
            });
        });

        return active;
    }, [filters, uniqueAssignees]);

    const activeFilters = getActiveFilters();

    const handleRemoveFilter = (type: string, value: string) => {
        switch (type) {
            case "priority":
                togglePriorityFilter(value as Priority);
                break;
            case "assignee":
                toggleAssigneeFilter(value);
                break;
            case "type":
                toggleTypeFilter(value as TaskType);
                break;
            case "tag":
                toggleTagFilter(value);
                break;
        }
    };

    return (
        <div className="sticky top-0 z-40 bg-[#0D0D0F]/95 backdrop-blur-md border-b border-white/[0.05]">
            {/* Main filter bar */}
            <div className="flex items-center gap-3 px-6 py-3">
                {/* Search Input */}
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="pl-9 h-8 bg-white/[0.03] border-white/10 text-sm placeholder:text-muted-foreground/50"
                    />
                    {localSearch && (
                        <button
                            onClick={() => setLocalSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors"
                            aria-label="Clear search"
                        >
                            <X className="w-3 h-3 text-muted-foreground" />
                        </button>
                    )}
                </div>

                {/* Filter Popovers */}
                <FilterPopover
                    label="Priority"
                    options={PRIORITY_OPTIONS}
                    selected={filters.priorities}
                    onToggle={togglePriorityFilter}
                />

                <FilterPopover
                    label="Assignee"
                    options={assigneeOptions}
                    selected={filters.assignees}
                    onToggle={toggleAssigneeFilter}
                />

                <FilterPopover
                    label="Type"
                    options={TASK_TYPE_OPTIONS}
                    selected={filters.taskTypes}
                    onToggle={toggleTypeFilter}
                />

                {tagOptions.length > 0 && (
                    <FilterPopover
                        label="Tags"
                        options={tagOptions}
                        selected={filters.tags}
                        onToggle={toggleTagFilter}
                    />
                )}

                {/* Reset button */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}

                {/* Sign Out Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="ml-auto h-8 gap-2 text-muted-foreground hover:text-foreground"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                </Button>
            </div>

            {/* Active filter badges */}
            {activeFilters.length > 0 && (
                <div className="flex items-center gap-2 px-6 pb-3 flex-wrap">
                    <span className="text-xs text-muted-foreground/50 uppercase tracking-wider mr-1">
                        Active:
                    </span>
                    {activeFilters.map((filter) => (
                        <ActiveFilterBadge
                            key={`${filter.type}-${filter.value}`}
                            label={filter.label}
                            icon={filter.icon}
                            colorClass={filter.colorClass}
                            onRemove={() => handleRemoveFilter(filter.type, filter.value)}
                        />
                    ))}
                    <button
                        onClick={resetFilters}
                        className="text-xs text-muted-foreground/50 hover:text-muted-foreground ml-2 transition-colors"
                    >
                        clear all
                    </button>
                </div>
            )}
        </div>
    );
}
