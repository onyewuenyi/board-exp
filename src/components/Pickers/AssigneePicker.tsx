"use client";

import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { User } from "@/types";
import { User as UserIcon, ChevronDown, Check } from "lucide-react";

interface AssigneePickerProps {
    value: User | null;
    onChange: (user: User | null) => void;
    users: User[];
    compact?: boolean;
}

export function AssigneePicker({ value, onChange, users, compact = false }: AssigneePickerProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
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
                    {value ? (
                        <Avatar className="w-4 h-4">
                            <AvatarImage src={value.avatar} />
                            <AvatarFallback className="text-[8px] bg-accent">
                                {value.name[0]}
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <UserIcon className="w-3.5 h-3.5" />
                    )}
                    {!compact && <span>{value?.name || "Assignee"}</span>}
                    <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0 bg-popover border-border" align="start">
                <Command>
                    <CommandInput placeholder="Search people..." className="h-9 text-xs" />
                    <CommandList>
                        <CommandEmpty className="py-3 text-xs text-center text-muted-foreground">
                            No people found.
                        </CommandEmpty>
                        <CommandGroup>
                            {/* Unassigned option */}
                            <CommandItem
                                onSelect={() => {
                                    onChange(null);
                                    setOpen(false);
                                }}
                                className="gap-2 text-xs"
                            >
                                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                                    <UserIcon className="w-3 h-3 text-muted-foreground" />
                                </div>
                                <span>Unassigned</span>
                                {value === null && (
                                    <Check className="w-3 h-3 ml-auto text-accent-linear" />
                                )}
                            </CommandItem>

                            {/* User list */}
                            {users.map((user) => (
                                <CommandItem
                                    key={user.id}
                                    onSelect={() => {
                                        onChange(user);
                                        setOpen(false);
                                    }}
                                    className="gap-2 text-xs"
                                >
                                    <Avatar className="w-5 h-5">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback className="text-[8px] bg-accent">
                                            {user.name[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span>{user.name}</span>
                                    {value?.id === user.id && (
                                        <Check className="w-3 h-3 ml-auto text-accent-linear" />
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
