"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveCanvasEntity = saveCanvasEntity;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const entityRegistry_1 = require("../gateways/entityRegistry");
const canvas_1 = require("../schemas/canvas");
/**
 * Saves or updates a canvas entity's objects directly to Firestore using a Batched Write to the `objects` subcollection.
 * It also touches the parent document to update the `updatedAt` field.
 */
async function saveCanvasEntity(uid, targetSchema, docId, orgId, objects) {
    try {
        const db = (0, firestore_1.getFirestore)(admin.app(), "standlo");
        const path = (0, entityRegistry_1.buildCollectionPath)(targetSchema, orgId);
        const parentRef = db.collection(path).doc(docId);
        const objectsRef = parentRef.collection("objects");
        const batch = db.batch();
        // 1. Update the parent document's metadata to reflect a change occurred
        batch.set(parentRef, {
            updatedBy: uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        // 2. Fetch existing documents to detect deletions
        const existingDocs = await objectsRef.get();
        const incomingIds = new Set(Array.isArray(objects)
            ? objects.map(o => o.id || o.baseEntityId).filter(Boolean)
            : []);
        existingDocs.forEach(doc => {
            if (!incomingIds.has(doc.id)) {
                batch.delete(doc.ref);
            }
        });
        // 3. Iterate through incoming objects and set them in the subcollection
        if (Array.isArray(objects)) {
            objects.forEach((obj, index) => {
                var _a;
                // Ensure data meets CanvasObjectSchema. If it fails, log and skip or throw. We'll throw to be safe for PDM integrity.
                const parsedObject = canvas_1.CanvasObjectSchema.parse(Object.assign(Object.assign({}, obj), { order: (_a = obj.order) !== null && _a !== void 0 ? _a : index // Fallback order mechanism
                 }));
                // We assume obj has an ID to use as document ID mapping to the node uuid
                const objectDocId = obj.id || parsedObject.baseEntityId;
                if (!objectDocId)
                    throw new Error("CanvasObject missing an identifiers");
                const docRef = objectsRef.doc(objectDocId);
                batch.set(docRef, parsedObject);
            });
        }
        await batch.commit();
        console.log(`[Choreography][saveCanvasEntity] Successfully saved ${objects === null || objects === void 0 ? void 0 : objects.length} objects for ${targetSchema} ${docId}`);
        return { success: true };
    }
    catch (error) {
        console.error(`[Choreography][saveCanvasEntity] Error saving objects for ${targetSchema} ${docId}:`, error);
        throw error;
    }
}
//# sourceMappingURL=canvas.js.map