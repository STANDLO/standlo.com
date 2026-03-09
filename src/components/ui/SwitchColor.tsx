"use client";

import * as React from "react";
import { useBrandColor } from "@/hooks/useBrandColor";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import { Palette } from "lucide-react";

export function SwitchColor() {
    const { color, setBrandColor, availableColors } = useBrandColor();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="outline" size="icon" className="w-9 h-9 border-transparent rounded-full opacity-50">
                <span className="sr-only">Toggle theme placeholder</span>
            </Button>
        );
    }

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="w-9 h-9 border-transparent rounded-full" title="Select Brand Color">
                    <Palette className="h-4 w-4" />
                    <span className="sr-only">Toggle branding color</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {availableColors.map((c) => (
                    <DropdownMenuItem
                        key={c}
                        onClick={() => setBrandColor(c)}
                        className={`flex items-center gap-2 cursor-pointer ${color === c ? 'bg-primary/10 text-primary' : ''}`}
                    >
                        <div className={`w-3 h-3 rounded-full border border-border ${c !== 'default' ? 'theme-' + c : ''} ${c === 'default' ? 'bg-background' : 'bg-primary'}`} />
                        {capitalize(c)}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
