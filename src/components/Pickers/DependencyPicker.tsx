"use client";

import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Task } from "@/types";
import { Link, Plus, X } from "lucide-react";

interface DependencyPickerProps {
    type: "blocking" | "blockedBy";
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    availableTasks: Task[];
}

export function DependencyPicker({
    type,
    selectedIds,
    onChange,
    availableTasks,
}: DependencyPickerProps) {
    const [open, setOpen] = useState(false);

    const selectedTasks = availableTasks.filter((t) => selectedIds.includes(t.id));
    const unselectedTasks = availableTasks.filter((t) => !selectedIds.includes(t.id));

    const handleSelect = (taskId: string) => {
        onChange([...selectedIds, taskId]);
    };

    const handleRemove = (taskId: string) => {
        onChange(selectedIds.filter((id) => id !== taskId));
    };

    const label = type === "blocking" ? "Blocks" : "Blocked by";
    const emptyText = type === "blocking" ? "This task blocks..." : "This task is blocked by...";

    return (
        <div className="space-y-2">
            {/* Selected dependencies */}
            {selectedTasks.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selectedTasks.map((task) => (
                        <div
                            key={task.id}
                            className="flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs group"
                        >
                            <span className="text-muted-foreground font-mono text-[10px]">
                                {task.id}
                            </span>
                            <span className="truncate max-w-[120px]">{task.title}</span>
                            <button
                                type="button"
                                onClick={() => handleRemove(task.id)}
                                className="opacity-50 hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add dependency button */}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{selectedTasks.length === 0 ? emptyText : `Add ${label.toLowerCase()}`}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0 bg-popover border-border" align="start">
                    <Command>
                        <CommandInput placeholder="Search tasks..." className="h-9 text-xs" />
                        <CommandList>
                            <CommandEmpty className="py-3 text-xs text-center text-muted-foreground">
                                No tasks available
                            </CommandEmpty>
                            <CommandGroup>
                                {unselectedTasks.map((task) => (
                                    <CommandItem
                                        key={task.id}
                                        onSelect={() => {
                                            handleSelect(task.id);
                                            setOpen(false);
                                        }}
                                        className="gap-2 text-xs"
                                    >
                                        <Link className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                        <span className="text-muted-foreground font-mono text-[10px] shrink-0">
                                            {task.id}
                                        </span>
                                        <span className="truncate">{task.title}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
