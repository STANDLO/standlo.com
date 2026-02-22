export type UIFieldType =
    | "text"
    | "email"
    | "password"
    | "number"
    | "localized"
    | "textarea"
    | "textarea-localized"
    | "select"
    | "date"
    | "checkbox"
    | "lookup";

export interface UIFieldMeta {
    /** 
     * Il nome della proprietà nello schema Zod (es. 'name', 'budget', 'status').
     * Questa chiave verrà utilizzata dal resolver RHF per agganciare il value.
     */
    key: string;

    /**
     * Il tipo di input UI da renderizzare (es. testuale neutrale, o field localizzato JSON)
     */
    type: UIFieldType;

    /** 
     * Etichetta localizzata da mostrare all'utente (solitamente una translation key).
     */
    label: string;

    /** 
     * Placeholder opzionale.
     */
    placeholder?: string;

    /**
     * Per i type="select", lista statica delle opzioni disonibili.
     */
    options?: Array<{ label: string; value: string | number }>;

    /**
     * Per i type="lookup", func promise async che inietta la ricerca dal parent (FormCreate/Detail)
     */
    onLookupSearch?: (query: string) => Promise<Array<{ id: string; label: string }>>;

    /**
     * Per i type="lookup", nome della stringa da mostrare per il display current value.
     * Dato che Zod contiene solo l'ID, serve passare dall'esterno il displayValue corrente
     */
    lookupDisplayValue?: string;

    /**
     * Se true, il campo appare disabilitato o in readonly.
     */
    disabled?: boolean;

    /**
     * Griglia layout tailwind (Opzionale).
     * Esempio: "col-span-1" o "col-span-2". Default di solito "col-span-1" su griglia a 2 colonne.
     */
    gridSpan?: string;
}
