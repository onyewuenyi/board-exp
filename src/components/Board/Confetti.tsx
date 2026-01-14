"use client";

import React, { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiPosition {
    x: number;
    y: number;
}

interface ConfettiProps {
    show: boolean;
    onComplete: () => void;
    position?: ConfettiPosition | null;
}

const COLORS = ["#FFD700", "#FF6B6B", "#4ECDC4", "#A855F7", "#22C55E", "#3B82F6", "#F97316"];

interface Particle {
    id: number;
    x: number;
    y: number;
    rotation: number;
    color: string;
    scale: number;
    delay: number;
}

export function Confetti({ show, onComplete, position }: ConfettiProps) {
    // Use provided position or fallback to center
    const originX = position?.x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 500);
    const originY = position?.y ?? (typeof window !== 'undefined' ? window.innerHeight * 0.6 : 400);

    const particles = useMemo<Particle[]>(() => {
        return Array.from({ length: 60 }, (_, i) => ({
            id: i,
            // Spread particles in a cone pattern upward and outward
            x: (Math.random() - 0.5) * 400,
            y: -Math.random() * 400 - 100,
            rotation: Math.random() * 720 - 360,
            color: COLORS[i % COLORS.length],
            scale: Math.random() * 0.5 + 0.5,
            delay: Math.random() * 0.2,
        }));
    }, [show]); // Regenerate particles when show changes

    const sparkles = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => ({
            id: i,
            x: (Math.random() - 0.5) * 300,
            y: -Math.random() * 300 - 50,
            delay: Math.random() * 0.3,
        }));
    }, [show]);

    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onComplete();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
                    {particles.map((p) => (
                        <motion.div
                            key={p.id}
                            initial={{
                                x: originX,
                                y: originY,
                                scale: 0,
                                rotate: 0,
                                opacity: 1,
                            }}
                            animate={{
                                x: originX + p.x,
                                y: originY + p.y,
                                scale: [0, p.scale * 1.5, p.scale],
                                rotate: p.rotation,
                                opacity: [1, 1, 0],
                            }}
                            transition={{
                                duration: 1.5,
                                ease: [0.25, 0.46, 0.45, 0.94],
                                delay: p.delay,
                            }}
                            className="absolute w-3 h-3 rounded-sm"
                            style={{
                                backgroundColor: p.color,
                                transformOrigin: "center",
                            }}
                        />
                    ))}

                    {/* Extra sparkle/star effects */}
                    {sparkles.map((s) => (
                        <motion.div
                            key={`star-${s.id}`}
                            initial={{
                                x: originX,
                                y: originY,
                                scale: 0,
                                opacity: 1,
                            }}
                            animate={{
                                x: originX + s.x,
                                y: originY + s.y,
                                scale: [0, 1.5, 0],
                                opacity: [1, 1, 0],
                            }}
                            transition={{
                                duration: 0.8,
                                ease: "easeOut",
                                delay: s.delay,
                            }}
                            className="absolute text-2xl text-yellow-400"
                        >
                            ✦
                        </motion.div>
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
}
