"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RipplePosition {
    x: number;
    y: number;
}

interface RippleProps {
    show: boolean;
    position: RipplePosition | null;
    onComplete: () => void;
    color?: string;
}

export function Ripple({ show, position, onComplete, color = "primary" }: RippleProps) {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(onComplete, 600);
            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    if (!position) return null;

    return (
        <AnimatePresence>
            {show && (
                <div
                    className="fixed inset-0 pointer-events-none z-[9997] overflow-hidden"
                    style={{ perspective: "1000px" }}
                >
                    {/* Main ripple */}
                    <motion.div
                        initial={{
                            width: 0,
                            height: 0,
                            x: position.x,
                            y: position.y,
                            opacity: 0.6,
                        }}
                        animate={{
                            width: 300,
                            height: 300,
                            x: position.x - 150,
                            y: position.y - 150,
                            opacity: 0,
                        }}
                        transition={{
                            duration: 0.5,
                            ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                        className={`absolute rounded-full border-2 border-${color}/40`}
                        style={{
                            borderColor: `hsl(var(--${color}) / 0.4)`,
                        }}
                    />

                    {/* Secondary ripple (delayed) */}
                    <motion.div
                        initial={{
                            width: 0,
                            height: 0,
                            x: position.x,
                            y: position.y,
                            opacity: 0.4,
                        }}
                        animate={{
                            width: 200,
                            height: 200,
                            x: position.x - 100,
                            y: position.y - 100,
                            opacity: 0,
                        }}
                        transition={{
                            duration: 0.4,
                            ease: [0.25, 0.46, 0.45, 0.94],
                            delay: 0.1,
                        }}
                        className="absolute rounded-full"
                        style={{
                            backgroundColor: `hsl(var(--${color}) / 0.1)`,
                        }}
                    />

                    {/* Center flash */}
                    <motion.div
                        initial={{
                            scale: 0,
                            x: position.x - 8,
                            y: position.y - 8,
                            opacity: 1,
                        }}
                        animate={{
                            scale: [0, 1.5, 0],
                            opacity: [1, 0.8, 0],
                        }}
                        transition={{
                            duration: 0.3,
                            ease: "easeOut",
                        }}
                        className="absolute w-4 h-4 rounded-full"
                        style={{
                            backgroundColor: `hsl(var(--${color}) / 0.6)`,
                            boxShadow: `0 0 20px hsl(var(--${color}) / 0.4)`,
                        }}
                    />
                </div>
            )}
        </AnimatePresence>
    );
}
