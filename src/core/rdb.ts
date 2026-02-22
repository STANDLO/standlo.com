/**
 * File di Stub per futura integrazione con PostgreSQL (Cloud SQL)
 * In futuro questo file gestirà connessioni singleton tramite PgBouncer,
 * l'ORM (Drizzle/Prisma) e il settaggio del Tenant Context SQL.
 */

// export const rdb = new Pool({...});

/**
 * Esempio: Innesco della Row Level Security a inizio query
 *
 * export async function withTenantContext<T>(tenantId: string, fn: (tx: unknown) => Promise<T>) {
 *   return rdb.transaction(async (tx) => {
 *     await tx.execute(`SET LOCAL app.current_tenant = '${tenantId}'`);
 *     return await fn(tx);
 *   });
 * }
 */
