/**
 * UI Meta Forms (Bridging Zod and UI Generation)
 * Struttura per orchestrare la generazione dei form da file di configurazione TSX
 */
export type UIFieldMeta = {
    name: string; // Il path del campo (es. 'name.it' o 'vatNumber')
    label?: string; // Chiave I18n o testuale per la label
    placeholder?: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'boolean' | 'select' | 'textarea' | 'localized' | 'lookup' | 'place' | 'date' | 'gallery';
    options?: { label: string; value: string | number }[]; // Per select/radio
    lookupTarget?: string; // Es. "organizations" (Per InputLookup)
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12; // Grid support
    className?: string; // Explicit override
};
