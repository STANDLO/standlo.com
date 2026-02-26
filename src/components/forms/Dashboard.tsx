import * as React from "react";
import { DevMode } from "@/components/ui/DevMode";

export function Dashboard({ roleId }: { roleId: string }) {
    return (
        <div className="space-y-6 p-6">
            <h1 className="text-2xl font-bold tracking-tight capitalize">Dashboard ({roleId})</h1>
            <div className="bg-card p-4 rounded-lg shadow-sm border">
                <DevMode role={roleId} />
            </div>
        </div>
    );
}
