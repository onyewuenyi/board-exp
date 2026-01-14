"use client";

import React, { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption<T extends string> {
    value: T;
    label: string;
    icon?: ReactNode;
}

interface FilterPopoverProps<T extends string> {
    label: string;
    options: FilterOption<T>[];
    selected: T[];
    onToggle: (value: T) => void;
}

export function FilterPopover<T extends string>({
    label,
    options,
    selected,
    onToggle,
}: FilterPopoverProps<T>) {
    const hasSelection = selected.length > 0;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-8 gap-1.5 border-white/10 bg-white/[0.02] hover:bg-white/[0.05]",
                        hasSelection && "border-primary/30 bg-primary/5"
                    )}
                >
                    <span className="text-xs">{label}</span>
                    {hasSelection && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">
                            {selected.length}
                        </span>
                    )}
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-48 p-2 bg-[#1C1C1E] border-white/10"
                align="start"
            >
                <div className="space-y-1">
                    {options.map((opt) => (
                        <label
                            key={opt.value}
                            className={cn(
                                "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer",
                                "hover:bg-white/5 transition-colors",
                                selected.includes(opt.value) && "bg-white/5"
                            )}
                        >
                            <Checkbox
                                checked={selected.includes(opt.value)}
                                onCheckedChange={() => onToggle(opt.value)}
                                className="h-3.5 w-3.5"
                            />
                            {opt.icon && (
                                <span className="flex-shrink-0">{opt.icon}</span>
                            )}
                            <span className="text-xs text-foreground/80">{opt.label}</span>
                        </label>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
