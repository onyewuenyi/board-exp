"use client";

import { useState, useCallback, useEffect } from "react";

// ============================================================================
// STREAK CONFIGURATION
// ============================================================================
const STREAK_THRESHOLDS = [3, 5, 10, 15, 20, 25, 50, 100];
const STREAK_TIMEOUT_MS = 60000; // 1 minute between tasks to maintain streak

interface StreakState {
    currentStreak: number;
    lastCompletionTime: number | null;
    totalCompletions: number;
    dailyCompletions: number;
    lastDate: string;
}

interface StreakMilestone {
    count: number;
    isNew: boolean;
    level: "small" | "medium" | "large" | "epic";
}

// ============================================================================
// LOCAL STORAGE HELPERS
// ============================================================================
const STORAGE_KEY = "kanban-streaks";

function loadStreakState(): StreakState {
    if (typeof window === "undefined") {
        return getDefaultState();
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Reset daily count if it's a new day
            const today = new Date().toDateString();
            if (parsed.lastDate !== today) {
                return {
                    ...parsed,
                    dailyCompletions: 0,
                    lastDate: today,
                    currentStreak: 0, // Reset streak on new day
                };
            }
            return parsed;
        }
    } catch (e) {
        console.warn("Failed to load streak state:", e);
    }
    return getDefaultState();
}

function getDefaultState(): StreakState {
    return {
        currentStreak: 0,
        lastCompletionTime: null,
        totalCompletions: 0,
        dailyCompletions: 0,
        lastDate: new Date().toDateString(),
    };
}

function saveStreakState(state: StreakState): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn("Failed to save streak state:", e);
    }
}

// ============================================================================
// HOOK
// ============================================================================
export function useStreaks() {
    const [state, setState] = useState<StreakState>(getDefaultState);
    const [milestone, setMilestone] = useState<StreakMilestone | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        setState(loadStreakState());
    }, []);

    // Check if a streak threshold was just crossed
    const checkMilestone = useCallback((newCount: number, oldCount: number): StreakMilestone | null => {
        for (const threshold of STREAK_THRESHOLDS) {
            if (newCount >= threshold && oldCount < threshold) {
                let level: StreakMilestone["level"] = "small";
                if (threshold >= 20) level = "epic";
                else if (threshold >= 10) level = "large";
                else if (threshold >= 5) level = "medium";

                return { count: threshold, isNew: true, level };
            }
        }
        return null;
    }, []);

    // Record a task completion
    const recordCompletion = useCallback(() => {
        setState(prev => {
            const now = Date.now();
            const today = new Date().toDateString();

            // Check if streak should continue or reset
            let newStreak = prev.currentStreak;
            if (prev.lastCompletionTime && now - prev.lastCompletionTime < STREAK_TIMEOUT_MS) {
                newStreak += 1;
            } else {
                newStreak = 1; // Start new streak
            }

            // Check for milestone
            const newMilestone = checkMilestone(newStreak, prev.currentStreak);
            if (newMilestone) {
                setMilestone(newMilestone);
                // Auto-clear milestone after showing
                setTimeout(() => setMilestone(null), 3000);
            }

            const newState: StreakState = {
                currentStreak: newStreak,
                lastCompletionTime: now,
                totalCompletions: prev.totalCompletions + 1,
                dailyCompletions: prev.lastDate === today ? prev.dailyCompletions + 1 : 1,
                lastDate: today,
            };

            saveStreakState(newState);
            return newState;
        });
    }, [checkMilestone]);

    // Clear milestone notification
    const dismissMilestone = useCallback(() => {
        setMilestone(null);
    }, []);

    // Check if currently on a streak (within timeout window)
    const isOnStreak = state.lastCompletionTime
        ? Date.now() - state.lastCompletionTime < STREAK_TIMEOUT_MS
        : false;

    return {
        currentStreak: state.currentStreak,
        totalCompletions: state.totalCompletions,
        dailyCompletions: state.dailyCompletions,
        isOnStreak,
        milestone,
        recordCompletion,
        dismissMilestone,
    };
}
