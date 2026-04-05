"use client";

import React, { useState } from "react";
import { Sparkles, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function AskAIBar() {
    const [inputValue, setInputValue] = useState("");

    return (
        <div className="flex justify-center pt-5 pb-1">
            <div
                className={cn(
                    "w-1/2 flex items-center gap-3 h-12 px-5 rounded-2xl",
                    "bg-card/60 backdrop-blur-sm border border-border/50",
                    "transition-all duration-200",
                    "hover:border-border-hover hover:bg-card/80 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]",
                    "focus-within:border-accent-linear/30 focus-within:bg-card/80 focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.1)]"
                )}
            >
                <Sparkles className="w-4 h-4 text-accent-linear shrink-0" />
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask AI..."
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none min-w-0"
                />
                <button
                    className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        "transition-all duration-200",
                        inputValue.trim()
                            ? "bg-accent-linear text-white scale-100 opacity-100"
                            : "bg-transparent text-muted-foreground/30 scale-90 opacity-0 pointer-events-none"
                    )}
                >
                    <ArrowUp className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
