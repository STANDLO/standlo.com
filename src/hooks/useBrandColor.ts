"use client";

import { useEffect, useState } from "react";

export type BrandColor = "default" | "green" | "blue" | "yellow" | "fucsia" | "violet" | "red" | "orange";

const BRAND_COLORS: BrandColor[] = ["default", "green", "blue", "yellow", "fucsia", "violet", "red", "orange"];

export function useBrandColor() {
    const [color, setColor] = useState<BrandColor>("green");

    const applyColorClass = (newColor: BrandColor) => {
        const root = window.document.documentElement;

        // Remove existing theme classes
        BRAND_COLORS.forEach((c) => {
            if (c !== "default") {
                root.classList.remove(`theme-${c}`);
            }
        });

        // Add new theme class if not default
        if (newColor !== "default") {
            root.classList.add(`theme-${newColor}`);
        }
    };

    useEffect(() => {
        const storedColor = localStorage.getItem("standlo_brand_color") as BrandColor;
        if (storedColor && BRAND_COLORS.includes(storedColor)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setColor(storedColor);
            applyColorClass(storedColor);
        }
    }, []);

    const setBrandColor = (newColor: BrandColor) => {
        setColor(newColor);
        localStorage.setItem("standlo_brand_color", newColor);
        applyColorClass(newColor);
    };

    return { color, setBrandColor, availableColors: BRAND_COLORS };
}
