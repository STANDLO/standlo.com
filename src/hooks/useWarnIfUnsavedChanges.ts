"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export function useWarnIfUnsavedChanges(isDirty: boolean) {
    const t = useTranslations("Common");

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = t("unsavedChangesWarning", { fallback: "Hai modifiche non salvate. Sei sicuro di voler uscire?" });
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [isDirty, t]);
}
