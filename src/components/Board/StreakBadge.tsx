"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface StreakMilestone {
    count: number;
    isNew: boolean;
    level: "small" | "medium" | "large" | "epic";
}

interface StreakBadgeProps {
    milestone: StreakMilestone | null;
    onDismiss?: () => void;
}

const LEVEL_STYLES = {
    small: {
        gradient: "from-amber-400 to-orange-500",
        shadow: "shadow-orange-500/30",
        icon: "🔥",
        text: "Streak!",
    },
    medium: {
        gradient: "from-purple-400 to-pink-500",
        shadow: "shadow-pink-500/30",
        icon: "⚡",
        text: "On Fire!",
    },
    large: {
        gradient: "from-cyan-400 to-blue-500",
        shadow: "shadow-blue-500/30",
        icon: "🌟",
        text: "Unstoppable!",
    },
    epic: {
        gradient: "from-yellow-300 via-amber-400 to-orange-500",
        shadow: "shadow-yellow-500/40",
        icon: "👑",
        text: "Legendary!",
    },
};

export function StreakBadge({ milestone, onDismiss }: StreakBadgeProps) {
    if (!milestone) return null;

    const style = LEVEL_STYLES[milestone.level];

    return (
        <AnimatePresence>
            {milestone && (
                <motion.div
                    initial={{ scale: 0, y: -50, opacity: 0 }}
                    animate={{
                        scale: [0, 1.2, 1],
                        y: 0,
                        opacity: 1,
                    }}
                    exit={{ scale: 0.5, y: -30, opacity: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                    }}
                    onClick={onDismiss}
                    className={cn(
                        "fixed top-6 left-1/2 -translate-x-1/2 z-[9999]",
                        "px-6 py-3 rounded-full cursor-pointer",
                        `bg-gradient-to-r ${style.gradient}`,
                        "text-white font-bold text-lg",
                        `shadow-lg ${style.shadow}`,
                        "flex items-center gap-3",
                        "select-none"
                    )}
                >
                    <motion.span
                        animate={{
                            scale: [1, 1.3, 1],
                            rotate: [0, 10, -10, 0],
                        }}
                        transition={{
                            duration: 0.5,
                            repeat: 2,
                            repeatType: "reverse",
                        }}
                        className="text-2xl"
                    >
                        {style.icon}
                    </motion.span>
                    <span className="flex items-baseline gap-2">
                        <span className="text-2xl font-black">{milestone.count}</span>
                        <span className="text-sm opacity-90">{style.text}</span>
                    </span>

                    {/* Particle effects for epic level */}
                    {milestone.level === "epic" && (
                        <>
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0, x: 0, y: 0 }}
                                    animate={{
                                        scale: [0, 1, 0],
                                        x: (Math.random() - 0.5) * 100,
                                        y: (Math.random() - 0.5) * 60,
                                    }}
                                    transition={{
                                        duration: 0.8,
                                        delay: i * 0.1,
                                        repeat: Infinity,
                                        repeatDelay: 0.5,
                                    }}
                                    className="absolute w-2 h-2 rounded-full bg-yellow-300"
                                />
                            ))}
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
