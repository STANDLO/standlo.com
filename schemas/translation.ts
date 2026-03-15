import translationsJson from "./translations.json";

export type SupportedLocale = "it" | "en" | "es" | "fr" | "de" | string;

/**
 * Accessor function to safely retrieve nested string fragments from translations.json,
 * bypassing heavy Next-intl load times during initial SSR loops or fast client renders.
 * 
 * @param app Primary domain (e.g. 'sys', 'das', 'pdm') 
 * @param module Sub-module or grouping (e.g. 'auth', 'overview')
 * @param key The specific translation identifier (e.g. 'login_title')
 * @param locale The active locale ('it', 'en', etc.)
 * @returns The translated string, or a fallback warning if missing.
 */
export function Translations(app: string, module: string, key: string, locale: SupportedLocale = "en"): string {
  try {
    const registry = translationsJson as any;
    
    // Attempt standard deep traversal
    if (registry[app] && registry[app][module] && registry[app][module][key] && registry[app][module][key][locale]) {
      return registry[app][module][key][locale];
    }
    
    // Fallback exactly to 'en' if the specific local variant is missing
    if (registry[app] && registry[app][module] && registry[app][module][key] && registry[app][module][key]["en"]) {
       return registry[app][module][key]["en"];
    }

    return `!![{${app}.${module}.${key}}]!!`;
    
  } catch (err) {
    return `!![{${app}.${module}.${key}}]!!`;
  }
}
