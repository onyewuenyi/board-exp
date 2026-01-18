"use client";

import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Tag, X, Plus, Check } from "lucide-react";

interface TagsPickerProps {
    value: string[];
    onChange: (tags: string[]) => void;
    availableTags: string[];
}

export function TagsPicker({ value, onChange, availableTags }: TagsPickerProps) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");

    const addTag = (tag: string) => {
        if (!value.includes(tag)) {
            onChange([...value, tag]);
        }
    };

    const removeTag = (tag: string) => {
        onChange(value.filter((t) => t !== tag));
    };

    const handleCreateTag = () => {
        const trimmed = inputValue.trim();
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed]);
            setInputValue("");
        }
    };

    // Filter available tags that aren't already selected
    const filteredTags = availableTags.filter(
        (tag) => !value.includes(tag) && tag.toLowerCase().includes(inputValue.toLowerCase())
    );

    // Check if we should show "Create new tag" option
    const showCreateOption =
        inputValue.trim() &&
        !availableTags.some((t) => t.toLowerCase() === inputValue.toLowerCase()) &&
        !value.some((t) => t.toLowerCase() === inputValue.toLowerCase());

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {/* Selected tags */}
            {value.map((tag) => (
                <Badge
                    key={tag}
                    variant="secondary"
                    className="h-6 gap-1 text-xs font-normal bg-muted hover:bg-muted"
                >
                    {tag}
                    <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 hover:text-destructive transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </Badge>
            ))}

            {/* Add tag button */}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "h-6 gap-1 text-xs font-normal",
                            "text-muted-foreground hover:text-foreground",
                            "hover:bg-muted"
                        )}
                    >
                        <Plus className="w-3 h-3" />
                        <span>Add tag</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-52 p-0 bg-popover border-border" align="start">
                    <Command>
                        <CommandInput
                            placeholder="Search or create..."
                            className="h-9 text-xs"
                            value={inputValue}
                            onValueChange={setInputValue}
                        />
                        <CommandList>
                            <CommandEmpty className="py-2 text-xs text-center text-muted-foreground">
                                {inputValue ? "Press enter to create" : "No tags available"}
                            </CommandEmpty>
                            <CommandGroup>
                                {/* Create new tag option */}
                                {showCreateOption && (
                                    <CommandItem
                                        onSelect={() => {
                                            handleCreateTag();
                                            setOpen(false);
                                        }}
                                        className="gap-2 text-xs"
                                    >
                                        <Plus className="w-3 h-3 text-accent-linear" />
                                        <span>
                                            Create &quot;{inputValue.trim()}&quot;
                                        </span>
                                    </CommandItem>
                                )}

                                {/* Existing tags */}
                                {filteredTags.map((tag) => (
                                    <CommandItem
                                        key={tag}
                                        onSelect={() => {
                                            addTag(tag);
                                            setInputValue("");
                                            setOpen(false);
                                        }}
                                        className="gap-2 text-xs"
                                    >
                                        <Tag className="w-3 h-3 text-muted-foreground" />
                                        <span>{tag}</span>
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
