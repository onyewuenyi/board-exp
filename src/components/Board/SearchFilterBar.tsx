"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    Plus,
    LayoutGrid,
    CalendarDays,
} from "lucide-react";
import { ManageMembersDialog } from "./ManageMembersDialog";
import { Priority, TaskType } from "@/types";

// ============================================================================
// FILTER OPTIONS
// ============================================================================
const PRIORITY_OPTIONS: { value: Priority; label: string; icon: React.ReactNode }[] = [
    { value: "urgent", label: "Urgent", icon: <Zap className="w-3.5 h-3.5 text-red-500" /> },
    { value: "high", label: "High", icon: <SignalHigh className="w-3.5 h-3.5 text-orange-500" /> },
    { value: "med", label: "Medium", icon: <SignalMedium className="w-3.5 h-3.5 text-amber-400" /> },
    { value: "low", label: "Low", icon: <SignalLow className="w-3.5 h-3.5 text-blue-500" /> },
    { value: "none", label: "None", icon: <Circle className="w-3.5 h-3.5 text-muted-foreground" /> },
];

const TASK_TYPE_OPTIONS: { value: TaskType; label: string; icon: React.ReactNode }[] = [
    { value: "chore", label: "Chore", icon: <span>🧹</span> },
    { value: "errand", label: "Errand", icon: <span>🚗</span> },
    { value: "homework", label: "Homework", icon: <span>📚</span> },
    { value: "appointment", label: "Appointment", icon: <span>📅</span> },
    { value: "other", label: "Other", icon: <span>📌</span> },
];

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
        resetFilters,
        uniqueAssignees,
    } = useBoard();

    const [membersOpen, setMembersOpen] = useState(false);
    const pathname = usePathname();

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

    return (
        <div className="sticky top-0 z-40 bg-[#0D0D0F]/95 backdrop-blur-md border-b border-white/[0.05]">
            {/* Main filter bar */}
            <div className="flex items-center gap-3 px-10 py-3">
                {/* View Toggle */}
                <div className="flex items-center bg-muted/30 rounded-lg p-0.5 gap-0.5">
                    <Link
                        href="/dashboard"
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                            pathname === "/dashboard"
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Board
                    </Link>
                    <Link
                        href="/week"
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                            pathname === "/week"
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <CalendarDays className="w-3.5 h-3.5" />
                        Week
                    </Link>
                </div>

                {/* Search Input */}
                <div className="relative max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="pl-9 h-8 w-52 bg-white/[0.03] border-white/10 text-sm placeholder:text-muted-foreground/50"
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

                {/* Filter Dropdowns */}
                <FilterPopover
                    label="Priority"
                    options={PRIORITY_OPTIONS}
                    selected={filters.priorities}
                    onToggle={togglePriorityFilter}
                />

                <FilterPopover
                    label="Type"
                    options={TASK_TYPE_OPTIONS}
                    selected={filters.taskTypes}
                    onToggle={toggleTypeFilter}
                />

                {/* Reset button */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-3.5 h-3.5" />
                    </Button>
                )}

                {/* Avatar Group — right-aligned */}
                <div className="ml-auto flex items-center">
                    <div className="flex -space-x-2">
                        {uniqueAssignees.map((user) => {
                            const isActive = filters.assignees.includes(user.id);
                            return (
                                <button
                                    key={user.id}
                                    onClick={() => toggleAssigneeFilter(user.id)}
                                    className={cn(
                                        "relative rounded-full transition-all duration-200 hover:z-10 hover:scale-110",
                                        isActive
                                            ? "ring-2 ring-accent-linear ring-offset-1 ring-offset-background z-10 scale-105"
                                            : "ring-2 ring-transparent hover:ring-white/20"
                                    )}
                                    title={user.name}
                                >
                                    <Avatar className="w-7 h-7">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback className="text-[10px] font-medium bg-accent">
                                            {user.name[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            );
                        })}
                    </div>
                    <button
                        onClick={() => setMembersOpen(true)}
                        className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center",
                            "border border-dashed border-white/20 text-muted-foreground",
                            "hover:border-accent-linear hover:text-accent-linear hover:bg-accent-linear/10",
                            "transition-all duration-200",
                            uniqueAssignees.length > 0 && "ml-1.5"
                        )}
                        title="Manage members"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <ManageMembersDialog open={membersOpen} onOpenChange={setMembersOpen} />
        </div>
    );
}
