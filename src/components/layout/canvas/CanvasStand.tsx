import React from "react";
import { CanvasCard } from "@/components/ui/CanvasCard";
import { Search } from "lucide-react";

export function CanvasStand() {
    return (
        <CanvasCard
            title="Add Stand"
            position="right"
            className="w-80"
        >
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search stands..."
                        className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Stand search and insertion API to be integrated here.
                    </p>
                </div>
            </div>
        </CanvasCard>
    );
}
