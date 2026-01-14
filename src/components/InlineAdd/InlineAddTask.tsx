"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InlineAddTaskProps {
    onAdd: (title: string) => Promise<void>;
}

export function InlineAddTask({ onAdd }: InlineAddTaskProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [title, setTitle] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on expand
    useEffect(() => {
        if (isExpanded) {
            inputRef.current?.focus();
        }
    }, [isExpanded]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!title.trim()) return;

        setIsSubmitting(true);
        try {
            await onAdd(title);
            setTitle(""); // Clear input on success
            // Keep expanded for adding more? Linear style usually keeps it open or offers Shift+Enter.
            // Spec says: "Input collapses back" (Step 8).
            // So we collapse.
            setIsExpanded(false);
        } catch (error) {
            // Error handled by parent toast usually, but we keep input open
            console.error("Failed to add", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setIsExpanded(false);
            setTitle("");
        }
    };

    return (
        <div className="mt-2 text-sm">
            <AnimatePresence initial={false} mode="wait">
                {!isExpanded ? (
                    <motion.button
                        key="cta"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }} // 150ms
                        onClick={() => setIsExpanded(true)}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 w-full p-2 rounded-md transition-colors group"
                    >
                        <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
                        <span className="font-medium">Add task</span>
                    </motion.button>
                ) : (
                    <motion.form
                        key="input"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }} // 200ms ease-out
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-2 bg-card border border-ring/30 p-3 rounded-lg shadow-lg relative overflow-hidden"
                    >
                        <Input
                            ref={inputRef}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="What needs to be done?"
                            className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-sm font-medium placeholder:text-muted-foreground/70"
                            disabled={isSubmitting}
                        />

                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                                {/* Optional fields triggers would go here */}
                                <span className="text-[10px] text-muted-foreground border px-1.5 py-0.5 rounded">Enter to add</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => setIsExpanded(false)}
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="h-7 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                                    disabled={!title.trim() || isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                                </Button>
                            </div>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
}
