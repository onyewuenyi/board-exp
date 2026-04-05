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
    value: User[];
    onChange: (users: User[]) => void;
    users: User[];
    compact?: boolean;
}

export function AssigneePicker({ value, onChange, users, compact = false }: AssigneePickerProps) {
    const [open, setOpen] = React.useState(false);

    const selectedIds = new Set(value.map(u => u.id));

    const toggleUser = (user: User) => {
        if (selectedIds.has(user.id)) {
            onChange(value.filter(u => u.id !== user.id));
        } else {
            onChange([...value, user]);
        }
    };

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
                        value.length === 0 && "text-muted-foreground"
                    )}
                >
                    {value.length > 0 ? (
                        <div className="flex -space-x-1.5">
                            {value.slice(0, 3).map(u => (
                                <Avatar key={u.id} className="w-4 h-4 ring-1 ring-background">
                                    <AvatarImage src={u.avatar} />
                                    <AvatarFallback className="text-[7px] bg-accent">
                                        {u.name[0]}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                            {value.length > 3 && (
                                <span className="text-[8px] text-muted-foreground ml-1">+{value.length - 3}</span>
                            )}
                        </div>
                    ) : (
                        <UserIcon className="w-3.5 h-3.5" />
                    )}
                    {!compact && (
                        <span>
                            {value.length === 0
                                ? "Assignees"
                                : value.length === 1
                                    ? value[0].name
                                    : `${value.length} people`}
                        </span>
                    )}
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
                            {/* Clear all option */}
                            {value.length > 0 && (
                                <CommandItem
                                    onSelect={() => onChange([])}
                                    className="gap-2 text-xs"
                                >
                                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                                        <UserIcon className="w-3 h-3 text-muted-foreground" />
                                    </div>
                                    <span>Unassigned</span>
                                </CommandItem>
                            )}

                            {/* User list */}
                            {users.map((user) => (
                                <CommandItem
                                    key={user.id}
                                    onSelect={() => toggleUser(user)}
                                    className="gap-2 text-xs"
                                >
                                    <Avatar className="w-5 h-5">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback className="text-[8px] bg-accent">
                                            {user.name[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span>{user.name}</span>
                                    {selectedIds.has(user.id) && (
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
