import { getLocale } from "next-intl/server";
import { Locales, InputLocale } from "@schemas/locale";

/**
 * Resolves the current locale from the request, checking against the active locales schema.
 * Falls back to the default locale defined in the schema, or "us" if none is found.
 */
export async function resolveLocale(): Promise<keyof InputLocale> {
    const reqLocale = await getLocale();
    const validLocale = Locales.find((l: any) => l.id === reqLocale && l.active);
    
    if (validLocale) {
        return validLocale.id as keyof InputLocale;
    }
    
    // Fallback to schema default or "us"
    return (Locales.find((l: any) => l.default)?.id || "us") as keyof InputLocale;
}
