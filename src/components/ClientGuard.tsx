"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { checkPermission } from "@schemas/rbac";
import Guard from "./Guard";

export function ClientGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

    useEffect(() => {
        if (!pathname) return;
        
        // e.g. /it/mrp/assembly/list -> ["it", "mrp", "assembly", "list"]
        const segments = pathname.split('/').filter(Boolean);
        
        // We only strictly enforce RBAC on full parameterized routes [locale]/[app]/[module]/[action]
        if (segments.length >= 4) {
            const app = segments[1];
            const mod = segments[2];
            const actionStr = segments[3];
            
            // Bypass essential systemic root apps like Auth onboarding
            if (app === "auth") {
                setIsAllowed(true);
                return;
            }

            // Map Next.js URL action to UNIX Octal bitmask 4 (Read), 2 (Write), 1 (Execute)
            let actionCode: 4 | 2 | 1 = 4;
            
            if (["create", "update", "delete"].includes(actionStr)) {
                actionCode = 2;
            } else if (["run", "webhook", "pipeline", "trigger"].includes(actionStr)) {
                actionCode = 1;
            } else if (["list", "read", "view"].includes(actionStr)) {
                actionCode = 4;
            }

            // In production, this binds to the User AuthContext or `useIdbState`. 
            // Defaulting to "guest" safely denies write accesses gracefully
            const role = localStorage.getItem("standlo_role") || "guest";

            try {
                const permitted = checkPermission({
                    role: role,
                    app: app,
                    module: mod,
                    level: "own", // The UI rendering structural check demands at least 'Owner' depth
                    action: actionCode
                });
                setIsAllowed(permitted);
            } catch (err) {
                console.error("[RBAC] Validation Error", err);
                setIsAllowed(false);
            }
        } else {
            // Unrestricted landing pages or top-level hubs
            setIsAllowed(true);
        }
    }, [pathname]);

    // Prevent rendering the unprotected route while calculating bitwise validation
    if (isAllowed === null) return null;
    
    // Divert strict 403 Unauthorized to the isolated Next.js Fallback component
    if (isAllowed === false) return <Guard />;
    
    return <>{children}</>;
}
