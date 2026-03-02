"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fusion = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
exports.fusion = (0, https_1.onRequest)({
    region: "europe-west4",
    cors: true, // Allow CORS from Fusion Python plugin
}, async (req, res) => {
    var _a;
    // 1. HTTP Method Check
    if (req.method !== 'POST') {
        res.status(405).json({ error: "Method not allowed. Use POST." });
        return;
    }
    try {
        const db = (0, firestore_1.getFirestore)();
        // 2. Authentication via x-api-key
        const apiKey = req.headers['x-api-key'];
        if (!apiKey || typeof apiKey !== 'string') {
            res.status(401).json({ error: "Unauthorized. Missing x-api-key header." });
            return;
        }
        // Warning: This query searches across all tenants' apikeys due to the unstructured nature of the CAD plugin request.
        // It relies on the UID and Role to maintain security.
        const keysSnapshot = await db.collectionGroup("apikeys").where("hashedKey", "==", apiKey).limit(1).get();
        if (keysSnapshot.empty) {
            res.status(401).json({ error: "Unauthorized. Invalid API Key." });
            return;
        }
        const keyDoc = keysSnapshot.docs[0];
        const keyData = keyDoc.data();
        const userId = keyData.createdBy; // The user who created this API Key
        // We must verify the user actually exists and has the correct Role (designer or admin)
        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) {
            res.status(401).json({ error: "Unauthorized. User associated with API Key not found." });
            return;
        }
        const userData = userDoc.data();
        const userRole = userData === null || userData === void 0 ? void 0 : userData.roleId;
        const orgId = userData === null || userData === void 0 ? void 0 : userData.orgId; // Critical for tenant isolation
        if (userRole !== "admin" && userRole !== "designer" && userRole !== "system") {
            res.status(403).json({ error: "Forbidden. API Key belongs to a user without designer or admin privileges." });
            return;
        }
        // 3. Payload Validation
        const payload = req.body;
        const projectId = payload.projectId;
        const standData = payload.stand;
        if (!projectId || typeof projectId !== 'string') {
            res.status(400).json({ error: "Bad Request. Missing 'projectId'." });
            return;
        }
        if (!standData || !standData.fusionId || !standData.name || standData.version === undefined) {
            res.status(400).json({ error: "Bad Request. Invalid 'stand' payload. Ensure fusionId, name, and version are present." });
            return;
        }
        if (standData.category !== 'Stand' || standData.price === undefined || standData.cost === undefined) {
            res.status(400).json({ error: "Bad Request. Root component must be a 'Stand' with defined price and cost." });
            return;
        }
        // 4. Project State Guard (Design Freeze)
        const projectRef = db.collection("organizations").doc(orgId).collection("projects").doc(projectId);
        const projectSnap = await projectRef.get();
        if (!projectSnap.exists) {
            res.status(404).json({ error: `Not Found. Project '${projectId}' does not exist in your organization.` });
            return;
        }
        const projectData = projectSnap.data() || {};
        const blockedStatuses = ['production', 'stand_delivered', 'completed'];
        if (blockedStatuses.includes(projectData.status)) {
            res.status(403).json({ error: `Errore: Il progetto è in fase di '${projectData.status}' e non è possibile caricare nuove versioni tecniche.` });
            return;
        }
        // 5. Fair ID Denormalization
        let fairId = null;
        if (projectData.fairId) {
            // Fast path: project directly knows the fair via new schemas
            fairId = projectData.fairId;
        }
        else if (projectData.exhibitionId) {
            // Legacy/Deep path: We must look up the exhibition to find the fair
            const exhibitionRef = db.collection("exhibitions").doc(projectData.exhibitionId);
            const exhibSnap = await exhibitionRef.get();
            if (exhibSnap.exists) {
                fairId = ((_a = exhibSnap.data()) === null || _a === void 0 ? void 0 : _a.fairId) || null;
            }
        }
        // 6. Margin Calculation (Net Price)
        const netPrice = Math.max(0, (standData.price || 0) - (standData.discount || 0));
        let marginPct = 0;
        if (netPrice > 0) {
            marginPct = ((netPrice - (standData.cost || 0)) / netPrice) * 100;
        }
        // 7. Data Preparation & Explicit Versioning ID
        // Strategy: fusionId_vVersion
        const versionedStandId = `${standData.fusionId}_v${standData.version}`;
        const standSnapshotRecord = {
            id: versionedStandId,
            orgId: orgId,
            projectId: projectId,
            fairId: fairId,
            designerId: userId,
            changelog: payload.changelog || "Sincronizzazione Automatica",
            margin: marginPct,
            // Clean/Sanitize Root Fields
            fusionId: standData.fusionId,
            name: standData.name, // Version is kept in the root name as per sync protocol
            category: standData.category,
            quantity: standData.quantity || 1,
            price: standData.price,
            cost: standData.cost,
            startup: standData.startup || 0,
            discount: standData.discount || 0,
            modelUrl: standData.modelUrl || null,
            drawingUrl: standData.drawingUrl || null,
            inventoryType: standData.inventoryType || "Service",
            version: standData.version,
            // Recursive parts tree
            parts: standData.parts || [],
            // Standard Tracing
            createdBy: userId,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedBy: userId,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
            deletedAt: null,
            isArchived: false,
        };
        // 8. Transaction (Lock both Project and Fusions collection)
        await db.runTransaction(async (transaction) => {
            // Ensure project hasn't changed status during our async reads
            const latestProjectSnap = await transaction.get(projectRef);
            const pData = latestProjectSnap.data();
            if (pData && blockedStatuses.includes(pData.status)) {
                throw new Error(`Project locked in status: ${pData.status}`);
            }
            // Write the Stand Snapshot to `fusions` collection
            const standRef = db.collection("organizations").doc(orgId).collection("fusions").doc(versionedStandId);
            // We use 'set' to upsert, ensuring idempotency for the exact same version
            transaction.set(standRef, standSnapshotRecord, { merge: true });
            // Update Project Pointer to this new Stand ID
            transaction.update(projectRef, {
                standId: versionedStandId,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
                updatedBy: userId
            });
        });
        res.status(200).json({
            status: "success",
            message: `Stand v${standData.version} synchronized successfully`,
            standId: versionedStandId
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }
    catch (error) {
        console.error("[FusionSync] Synchronization Error:", error);
        // Return 500 but log detailed message 
        res.status(500).json({
            error: "Internal Server Error during synchronization.",
            details: error.message || String(error)
        });
    }
});
//# sourceMappingURL=fusion.js.map