"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================================
// SOUND CONFIGURATION
// ============================================================================

type SoundType = "drop" | "complete" | "error" | "combo";

interface SoundConfig {
    enabled: boolean;
    volume: number;
}

// Synthesized sounds using Web Audio API (no external files needed)
const SOUND_FREQUENCIES: Record<SoundType, { notes: number[]; durations: number[]; type: OscillatorType }> = {
    drop: {
        notes: [400, 300],
        durations: [0.05, 0.08],
        type: "sine",
    },
    complete: {
        notes: [523, 659, 784], // C5, E5, G5 - major chord arpeggio
        durations: [0.1, 0.1, 0.15],
        type: "sine",
    },
    error: {
        notes: [200, 150],
        durations: [0.1, 0.15],
        type: "square",
    },
    combo: {
        notes: [523, 659, 784, 1047], // C5, E5, G5, C6 - ascending
        durations: [0.08, 0.08, 0.08, 0.2],
        type: "sine",
    },
};

// ============================================================================
// HOOK
// ============================================================================

export function useSounds(initialConfig?: Partial<SoundConfig>) {
    const [config, setConfig] = useState<SoundConfig>({
        enabled: true,
        volume: 0.3,
        ...initialConfig,
    });

    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize AudioContext on first user interaction
    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    // Synthesize and play a sound
    const playSound = useCallback((type: SoundType) => {
        if (!config.enabled) return;

        try {
            const ctx = getAudioContext();
            if (ctx.state === "suspended") {
                ctx.resume();
            }

            const soundDef = SOUND_FREQUENCIES[type];
            let startTime = ctx.currentTime;

            soundDef.notes.forEach((freq, i) => {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                oscillator.type = soundDef.type;
                oscillator.frequency.setValueAtTime(freq, startTime);

                // Envelope for smooth sound
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(config.volume, startTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + soundDef.durations[i]);

                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);

                oscillator.start(startTime);
                oscillator.stop(startTime + soundDef.durations[i]);

                startTime += soundDef.durations[i] * 0.7; // Overlap notes slightly
            });
        } catch (error) {
            console.warn("Sound playback failed:", error);
        }
    }, [config.enabled, config.volume, getAudioContext]);

    // Convenience methods
    const playDrop = useCallback(() => playSound("drop"), [playSound]);
    const playComplete = useCallback(() => playSound("complete"), [playSound]);
    const playError = useCallback(() => playSound("error"), [playSound]);
    const playCombo = useCallback(() => playSound("combo"), [playSound]);

    // Toggle sound
    const toggleSound = useCallback(() => {
        setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
    }, []);

    // Set volume (0-1)
    const setVolume = useCallback((volume: number) => {
        setConfig(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return {
        playDrop,
        playComplete,
        playError,
        playCombo,
        playSound,
        toggleSound,
        setVolume,
        isEnabled: config.enabled,
        volume: config.volume,
    };
}
