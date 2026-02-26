import { db } from "./db";
import { DocumentData } from "firebase-admin/firestore";
import { BaseEntity } from "./schemas";

/**
 * BaseRepository astratto che definisce il perimetro globale 
 * per l'isolamento Tenant e le regole del Soft Delete
 */
export abstract class BaseRepository<T extends BaseEntity> {
    constructor(protected collectionName: string) { }

    /**
     * Ritorna un riferimento alla document collection
     */
    protected get collection() {
        return db.collection(this.collectionName);
    }

    /**
     * Mappa nativamente i campi metadati standard
     */
    protected mapDocument(id: string, data: DocumentData): T {
        return {
            ...data,
            id,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            deletedAt: data.deletedAt || null,
        } as T;
    }

    /**
     * Crea il reference per query isolate a singolo Tenant e NON soft-deleted
     */
    protected getTenantQuery(orgId: string) {
        return this.collection
            .where('orgId', '==', orgId)
            .where('deletedAt', '==', null);
    }

    /**
     * Generica Write (Create)
     */
    async create(orgId: string, data: Omit<T, "id" | "orgId" | "createdAt" | "createdBy" | "updatedAt" | "updatedBy" | "deletedAt" | "deletedBy" | "isArchived" | "endLifeTime">, userId: string): Promise<T> {
        const now = new Date().toISOString();
        const payload = {
            ...data,
            orgId, // Multi-tenant Injection
            createdAt: now,
            createdBy: userId,
            updatedAt: now,
            updatedBy: userId,
            deletedAt: null,
            deletedBy: null,
            isArchived: false,
            endLifeTime: null,
        };

        const docRef = await this.collection.add(payload);
        return this.mapDocument(docRef.id, payload);
    }

    /**
     * Generica Read (Get By ID) protetta dal Tenant
     */
    async getById(orgId: string, id: string): Promise<T | null> {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) return null;

        const data = doc.data()!;
        if (data.orgId !== orgId || data.deletedAt !== null) return null;

        return this.mapDocument(doc.id, data);
    }

    /**
     * Generica Update
     */
    async update(orgId: string, id: string, data: Partial<Omit<T, "id" | "orgId" | "createdAt" | "createdBy" | "updatedAt" | "updatedBy" | "deletedAt" | "deletedBy" | "isArchived" | "endLifeTime">>, userId: string): Promise<T | null> {
        const docRef = this.collection.doc(id);
        const doc = await docRef.get();

        if (!doc.exists) return null;
        if (doc.data()!.orgId !== orgId || doc.data()!.deletedAt !== null) return null;

        const now = new Date().toISOString();
        const payload = {
            ...data,
            updatedAt: now,
            updatedBy: userId,
        };

        await docRef.update(payload);

        const updatedDoc = await docRef.get();
        return this.mapDocument(updatedDoc.id, updatedDoc.data()!);
    }

    /**
     * Generico Soft Delete (Archive)
     */
    async delete(orgId: string, id: string, userId: string): Promise<boolean> {
        const docRef = this.collection.doc(id);
        const doc = await docRef.get();

        if (!doc.exists) return false;
        if (doc.data()!.orgId !== orgId || doc.data()!.deletedAt !== null) return false;

        const now = new Date().toISOString();
        await docRef.update({
            deletedAt: now,
            deletedBy: userId,
        });

        return true;
    }

    /**
     * Generica List per un dato intero Tenant
     */
    async list(orgId: string): Promise<T[]> {
        const snapshot = await this.getTenantQuery(orgId).get();
        return snapshot.docs.map(doc => this.mapDocument(doc.id, doc.data()));
    }
}
