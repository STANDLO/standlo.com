"use client";

import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCanvasStore } from "./store";

export function AssemblyTimeline() {
    const entities = useCanvasStore((state) => state.entities);
    const [isPlaying, setIsPlaying] = useState(false);

    // Calculate the maximum order step currently on the canvas
    const maxOrder = Object.values(entities).reduce((max, ent) => Math.max(max, ent.order || 0), 0);

    // Timeline state managed locally to prevent excessive Zustand renders for scrubbing
    const [currentStep, setCurrentStep] = useState(maxOrder);

    // If a user drops a new item making the maxOrder higher, auto-advance scrubber to end
    useEffect(() => {
        setCurrentStep(maxOrder);
    }, [maxOrder]);

    // Simple Auto-Play loop
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            setCurrentStep((prev) => {
                if (prev >= maxOrder) {
                    setIsPlaying(false);
                    return prev;
                }
                return prev + 1;
            });
        }, 800); // 800ms per step

        return () => clearInterval(interval);
    }, [isPlaying, maxOrder]);

    // Inform the CanvasStore of the current playback limit so GenericPart knows to hide
    // We didn't add this yet to the store... Let's add timelineStep to store next.

    return (
        <div className="flex items-center gap-3 bg-white/10 px-3 py-1.5 rounded-full border border-white/20 ml-4">
            <Button
                variant="default"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-white/20 text-white"
                onClick={() => setCurrentStep(0)}
                disabled={currentStep === 0}
            >
                <SkipBack className="h-3 w-3" />
            </Button>

            <Button
                variant="default"
                size="icon"
                className="h-7 w-7 rounded-full shadow-inner"
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={maxOrder === 0}
            >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
            </Button>

            <div className="w-32 px-2 flex items-center">
                <Slider
                    value={[currentStep]}
                    max={maxOrder}
                    step={1}
                    onValueChange={(val) => {
                        setIsPlaying(false);
                        setCurrentStep(val[0]);
                    }}
                    className="cursor-pointer"
                />
            </div>

            <Button
                variant="default"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-white/20 text-white"
                onClick={() => setCurrentStep(maxOrder)}
                disabled={currentStep === maxOrder}
            >
                <SkipForward className="h-3 w-3" />
            </Button>

            <div className="text-xs font-mono font-medium text-white/80 min-w-[3ch] text-center">
                {currentStep}/{maxOrder}
            </div>
        </div>
    );
}
