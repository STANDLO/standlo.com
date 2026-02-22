/**
 * Strato di Cache Intermedio per le API (Memory / Redis in futuro)
 * 
 * Lo scopo di questo file è fornire un'interfaccia standard per ridurre i 
 * document reads su Firestore per entità ad alta lettura (es. query FormList).
 */

const memoryCache = new Map<string, { value: unknown, expiry: number }>();

export const Cache = {
    /**
     * Recupera dati dalla cache
     */
    get: <T>(key: string): T | null => {
        const item = memoryCache.get(key);
        if (!item) return null;
        if (Date.now() > item.expiry) {
            memoryCache.delete(key);
            return null;
        }
        return item.value as T;
    },

    /**
     * Imposta dati nella cache
     * @param ttl Time To Live in secondi
     */
    set: (key: string, value: unknown, ttlSeconds: number = 60) => {
        memoryCache.set(key, {
            value,
            expiry: Date.now() + (ttlSeconds * 1000)
        });
    },

    /**
     * Invalida direttamente una chiave (utile dopo i mutations POST/PUT/DELETE)
     */
    invalidate: (key: string) => {
        memoryCache.delete(key);
    },

    /**
     * Helper pattern per fetch + cache.
     * Se trovo in cache ritorno, altrimenti eseguo il "fetcher" Callable, formatto, salvo in cache e ritorno.
     */
    getOrSet: async <T>(key: string, fetcher: () => Promise<T>, ttlSeconds: number = 60): Promise<T> => {
        const cached = Cache.get<T>(key);
        if (cached !== null) return cached;

        const data = await fetcher();
        Cache.set(key, data, ttlSeconds);
        return data;
    }
}
