"use client";

import { useMemo, useCallback } from "react";
import { User } from "@/types";

const STORAGE_KEY = "board-last-assignee";

interface StoredAssignee {
    id: string;
    name: string;
    avatar?: string;
    timestamp: number;
}

function getStoredAssignee(): StoredAssignee | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

export function useSmartOwnerDefault(availableUsers: User[]) {
    // Compute default owner synchronously using useMemo
    const defaultOwner = useMemo(() => {
        // Try localStorage first (last used assignee)
        const stored = getStoredAssignee();
        if (stored) {
            const foundUser = availableUsers.find((u) => u.id === stored.id);
            if (foundUser) {
                return foundUser;
            }
        }

        // Use first available user as fallback
        if (availableUsers.length > 0) {
            return availableUsers[0];
        }

        return null;
    }, [availableUsers]);

    // Save selection to localStorage
    const saveLastUsed = useCallback((user: User | null) => {
        if (user) {
            const toStore: StoredAssignee = {
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                timestamp: Date.now(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
        }
    }, []);

    return { defaultOwner, saveLastUsed };
}
