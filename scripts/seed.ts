import { BaseRepository } from "../src/core/repository";
import { BaseEntity } from "../src/core/schemas";

// 1. Definiamo un mockup di Entità per i test (es. un Progetto)
export interface MockProject extends BaseEntity {
    name: string;
    status: 'draft' | 'active';
}

// 2. Istanziamo il generic repository specializzato
export class MockProjectRepository extends BaseRepository<MockProject> {
    constructor() {
        super("mock_projects");
    }
}

async function runSeed() {
    console.log("🌱 Inizio Seed del Database di Staging...");

    try {
        const repo = new MockProjectRepository();

        const orgId = "org_123_test";
        const userId = "user_456_admin";

        console.log("1. Creazione di un nuovo record...");
        const newProject = await repo.create(orgId, {
            name: "Progetto Fiera Milano",
            code: "PRJ-001",
            version: 1,
            status: "draft"
        }, userId);
        console.log("   ✅ Creato:", newProject.id);

        console.log("2. Lettura del record appena creato...");
        const fetchedProject = await repo.getById(orgId, newProject.id!);
        console.log("   ✅ Letto:", fetchedProject?.name);

        console.log("3. Aggiornamento del record...");
        const updatedProject = await repo.update(orgId, newProject.id!, {
            status: "active"
        }, userId);
        console.log("   ✅ Aggiornato. Status:", updatedProject?.status);

        console.log("4. Esecuzione Soft Delete...");
        const deleted = await repo.delete(orgId, newProject.id!, userId);
        console.log("   ✅ Soft Delete eseguito:", deleted);

        console.log("5. Verifica isolamento (Read dopo Soft Delete)...");
        const notFound = await repo.getById(orgId, newProject.id!);
        console.log("   ✅ Record invisibile?", notFound === null);

        console.log("🎉 Seed e Test CRUD completati con successo sulle Collection isolate!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Errore durante il seed:", error);
        process.exit(1);
    }
}

runSeed();
