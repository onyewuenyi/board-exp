"use client";

import { useState, useRef } from "react";
import { X, Loader2, Camera, ChevronLeft, Trash2, Plus, User as UserIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBoardStore } from "@/stores/boardStore";
import { User } from "@/types";
import { cn } from "@/lib/utils";

interface ManageMembersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function computeAge(birthday: string): number | null {
    const birth = new Date(birthday);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

// ============================================================================
// LIST VIEW
// ============================================================================
function MemberList({
    users,
    onEdit,
    onCreate,
    onDelete,
}: {
    users: User[];
    onEdit: (user: User) => void;
    onCreate: () => void;
    onDelete: (userId: string) => void;
}) {
    return (
        <div className="space-y-1">
            {users.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                        <UserIcon className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">No members yet</p>
                    <p className="text-xs text-muted-foreground/60 mb-4">Add your family members to get started</p>
                    <Button size="sm" onClick={onCreate} className="gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        Add Member
                    </Button>
                </div>
            ) : (
                <>
                    <div className="max-h-72 overflow-y-auto space-y-1">
                        {users.map((user) => {
                            const age = user.birthday ? computeAge(user.birthday) : null;
                            return (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors group"
                                    onClick={() => onEdit(user)}
                                >
                                    <Avatar className="w-9 h-9 shrink-0">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback className="text-xs font-medium bg-accent">
                                            {user.name[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium block truncate">{user.name}</span>
                                        {age !== null && (
                                            <span className="text-xs text-muted-foreground">{age} years old</span>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(user.id);
                                        }}
                                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                    <div className="pt-3 border-t border-border">
                        <Button variant="ghost" size="sm" onClick={onCreate} className="w-full gap-1.5 text-muted-foreground hover:text-foreground">
                            <Plus className="w-3.5 h-3.5" />
                            Add Member
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}

// ============================================================================
// EDIT VIEW
// ============================================================================
function MemberForm({
    user,
    onBack,
    onSave,
}: {
    user: User | null; // null = create mode
    onBack: () => void;
    onSave: () => void;
}) {
    const addUser = useBoardStore((state) => state.addUser);
    const updateUser = useBoardStore((state) => state.updateUser);

    const [firstName, setFirstName] = useState(user?.firstName || "");
    const [middleName, setMiddleName] = useState(user?.middleName || "");
    const [lastName, setLastName] = useState(user?.lastName || "");
    const [birthday, setBirthday] = useState(user?.birthday || "");
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const age = birthday ? computeAge(birthday) : null;
    const isCreate = user === null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName.trim() || !lastName.trim()) return;

        setIsSaving(true);
        try {
            const data = {
                first_name: firstName.trim(),
                middle_name: middleName.trim() || undefined,
                last_name: lastName.trim(),
                birthday: birthday || undefined,
                avatar: avatarPreview || undefined,
            };

            if (isCreate) {
                await addUser(data);
            } else {
                await updateUser(user.id, data);
            }
            onSave();
        } finally {
            setIsSaving(false);
        }
    };

    const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "?";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Back button */}
            <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
            </button>

            {/* Avatar upload */}
            <div className="flex justify-center">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative group"
                >
                    <Avatar className="w-20 h-20 ring-2 ring-border">
                        <AvatarImage src={avatarPreview} />
                        <AvatarFallback className="text-lg font-medium bg-accent">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-5 h-5 text-white" />
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </button>
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        First Name *
                    </label>
                    <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First"
                        className="h-9"
                        required
                    />
                </div>
                <div>
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        Last Name *
                    </label>
                    <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last"
                        className="h-9"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Middle Name
                </label>
                <Input
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    placeholder="Middle (optional)"
                    className="h-9"
                />
            </div>

            <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Birthday
                </label>
                <div className="flex items-center gap-3">
                    <Input
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        className="h-9 flex-1"
                    />
                    {age !== null && (
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {age} yrs
                        </span>
                    )}
                </div>
            </div>

            {/* Save */}
            <Button
                type="submit"
                className="w-full"
                disabled={!firstName.trim() || !lastName.trim() || isSaving}
            >
                {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCreate ? (
                    "Add Member"
                ) : (
                    "Save Changes"
                )}
            </Button>
        </form>
    );
}

// ============================================================================
// MAIN DIALOG
// ============================================================================
export function ManageMembersDialog({ open, onOpenChange }: ManageMembersDialogProps) {
    const users = useBoardStore((state) => state.users);
    const removeUser = useBoardStore((state) => state.removeUser);

    const [view, setView] = useState<"list" | "edit">("list");
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setView("edit");
    };

    const handleCreate = () => {
        setEditingUser(null);
        setView("edit");
    };

    const handleSaved = () => {
        setView("list");
        setEditingUser(null);
    };

    const handleBack = () => {
        setView("list");
        setEditingUser(null);
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setView("list");
            setEditingUser(null);
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>
                        {view === "list" ? "Members" : editingUser ? "Edit Member" : "New Member"}
                    </DialogTitle>
                </DialogHeader>

                {view === "list" ? (
                    <MemberList
                        users={users}
                        onEdit={handleEdit}
                        onCreate={handleCreate}
                        onDelete={(id) => removeUser(id)}
                    />
                ) : (
                    <MemberForm
                        user={editingUser}
                        onBack={handleBack}
                        onSave={handleSaved}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
