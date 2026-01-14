"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================================================
// ENCOURAGEMENT MESSAGES
// ============================================================================
const ENCOURAGEMENT_MESSAGES = [
    { text: "Crushed it!", emoji: "💪" },
    { text: "Nice work!", emoji: "⭐" },
    { text: "One down!", emoji: "✓" },
    { text: "Keep it up!", emoji: "🚀" },
    { text: "You're on fire!", emoji: "🔥" },
    { text: "Boom!", emoji: "💥" },
    { text: "Nailed it!", emoji: "🎯" },
    { text: "Way to go!", emoji: "👏" },
    { text: "Excellent!", emoji: "✨" },
    { text: "Making progress!", emoji: "📈" },
    { text: "That's how it's done!", emoji: "🎉" },
    { text: "Champion move!", emoji: "🏆" },
];

// ============================================================================
// TOAST COMPONENT
// ============================================================================
interface EncouragementToastProps {
    show: boolean;
    onComplete: () => void;
    assigneeName?: string;
}

export function EncouragementToast({ show, onComplete, assigneeName }: EncouragementToastProps) {
    const [message, setMessage] = useState(ENCOURAGEMENT_MESSAGES[0]);

    // Pick a random message when shown
    useEffect(() => {
        if (show) {
            const randomIndex = Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length);
            setMessage(ENCOURAGEMENT_MESSAGES[randomIndex]);

            // Auto-dismiss after 2 seconds
            const timer = setTimeout(() => {
                onComplete();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ y: 100, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 50, opacity: 0, scale: 0.9 }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                    }}
                    className={cn(
                        "fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998]",
                        "px-5 py-3 rounded-full",
                        "bg-gradient-to-r from-green-500 to-emerald-500",
                        "text-white font-semibold text-sm",
                        "shadow-lg shadow-green-500/25",
                        "flex items-center gap-2",
                        "pointer-events-none select-none"
                    )}
                >
                    <motion.span
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 15 }}
                        className="text-lg"
                    >
                        {message.emoji}
                    </motion.span>
                    <span>
                        {assigneeName ? `${assigneeName}: ` : ""}
                        {message.text}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ============================================================================
// HOOK FOR MANAGING TOAST STATE
// ============================================================================
export function useEncouragementToast() {
    const [isVisible, setIsVisible] = useState(false);
    const [assigneeName, setAssigneeName] = useState<string | undefined>();

    const showToast = useCallback((name?: string) => {
        setAssigneeName(name);
        setIsVisible(true);
    }, []);

    const hideToast = useCallback(() => {
        setIsVisible(false);
        setAssigneeName(undefined);
    }, []);

    return {
        isVisible,
        assigneeName,
        showToast,
        hideToast,
    };
}
