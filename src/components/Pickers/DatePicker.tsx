"use client";

import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, ChevronDown, Check, Sun, Clock } from "lucide-react";

interface DatePickerProps {
    value: Date | null;
    onChange: (date: Date | null) => void;
    placeholder?: string;
}

type QuickOption = "today" | "tomorrow" | "this-week" | "custom";

function formatDate(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
        return "Today";
    }
    if (dateOnly.getTime() === tomorrow.getTime()) {
        return "Tomorrow";
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

function getQuickDateOption(date: Date | null): QuickOption | null {
    if (!date) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) return "today";
    if (dateOnly.getTime() === tomorrow.getTime()) return "tomorrow";

    // Check if within this week
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
    if (dateOnly <= weekEnd && dateOnly >= today) return "this-week";

    return "custom";
}

export function DatePicker({ value, onChange, placeholder = "When" }: DatePickerProps) {
    const [open, setOpen] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);

    const selectedOption = getQuickDateOption(value);

    const handleQuickSelect = (option: QuickOption) => {
        const today = new Date();
        today.setHours(12, 0, 0, 0);

        switch (option) {
            case "today":
                onChange(today);
                setOpen(false);
                break;
            case "tomorrow":
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                onChange(tomorrow);
                setOpen(false);
                break;
            case "this-week":
                // Default to end of week (Sunday)
                const weekEnd = new Date(today);
                weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
                onChange(weekEnd);
                setOpen(false);
                break;
            case "custom":
                setShowCalendar(true);
                break;
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            const date = new Date(e.target.value);
            date.setHours(12, 0, 0, 0);
            onChange(date);
            setOpen(false);
            setShowCalendar(false);
        }
    };

    const handleClear = () => {
        onChange(null);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={(newOpen) => {
            setOpen(newOpen);
            if (!newOpen) setShowCalendar(false);
        }}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-7 gap-1.5 text-xs font-medium",
                        "hover:bg-muted",
                        !value && "text-muted-foreground"
                    )}
                >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{value ? formatDate(value) : placeholder}</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1 bg-popover border-border" align="start">
                {showCalendar ? (
                    <div className="p-2">
                        <input
                            type="date"
                            onChange={handleDateChange}
                            className="w-full bg-muted/50 border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent-linear"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={() => setShowCalendar(false)}
                            className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                            Back to quick options
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Clear option */}
                        {value && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className={cn(
                                    "w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs",
                                    "hover:bg-muted transition-colors text-muted-foreground"
                                )}
                            >
                                <span className="w-4 h-4" />
                                <span>Clear date</span>
                            </button>
                        )}

                        {/* Quick options */}
                        <button
                            type="button"
                            onClick={() => handleQuickSelect("today")}
                            className={cn(
                                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs",
                                "hover:bg-muted transition-colors",
                                selectedOption === "today" && "bg-muted"
                            )}
                        >
                            <Sun className="w-4 h-4 text-yellow-400" />
                            <span>Today</span>
                            {selectedOption === "today" && (
                                <Check className="w-3 h-3 ml-auto text-accent-linear" />
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => handleQuickSelect("tomorrow")}
                            className={cn(
                                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs",
                                "hover:bg-muted transition-colors",
                                selectedOption === "tomorrow" && "bg-muted"
                            )}
                        >
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span>Tomorrow</span>
                            {selectedOption === "tomorrow" && (
                                <Check className="w-3 h-3 ml-auto text-accent-linear" />
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => handleQuickSelect("this-week")}
                            className={cn(
                                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs",
                                "hover:bg-muted transition-colors",
                                selectedOption === "this-week" && "bg-muted"
                            )}
                        >
                            <Calendar className="w-4 h-4 text-purple-400" />
                            <span>This Week</span>
                            {selectedOption === "this-week" && (
                                <Check className="w-3 h-3 ml-auto text-accent-linear" />
                            )}
                        </button>

                        <div className="border-t border-border/50 my-1" />

                        <button
                            type="button"
                            onClick={() => handleQuickSelect("custom")}
                            className={cn(
                                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs",
                                "hover:bg-muted transition-colors text-muted-foreground"
                            )}
                        >
                            <Calendar className="w-4 h-4" />
                            <span>Pick a date...</span>
                        </button>
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
}
