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
exports.correlateSub = exports.correlateRoot = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const firestore_2 = require("firebase-admin/firestore");
const correlate_1 = require("../core/correlate");
/**
 * Triggers on all root collection documents.
 * Extracts any ID references ending in 'Id' (defined in FK_DICTIONARY) and populates reverse subcollections.
 */
exports.correlateRoot = (0, firestore_1.onDocumentWritten)({
    document: "{colId}/{docId}",
    database: "standlo",
    namespace: "{namespaceId}",
    region: "europe-west4"
}, async (event) => {
    var _a, _b;
    // Only process if admin is initialized (it is in index.ts)
    if (admin.apps.length === 0)
        return;
    const db = (0, firestore_2.getFirestore)(admin.app(), "standlo");
    const oldData = ((_a = event.data) === null || _a === void 0 ? void 0 : _a.before.exists) ? event.data.before.data() : null;
    const newData = ((_b = event.data) === null || _b === void 0 ? void 0 : _b.after.exists) ? event.data.after.data() : null;
    await (0, correlate_1.applyCorrelations)(db, [event.params.colId, event.params.docId], oldData, newData);
});
/**
 * Triggers on all direct subcollection documents.
 * Extracts ID references and populates reverse subcollections linking the root entity to the target entity.
 */
exports.correlateSub = (0, firestore_1.onDocumentWritten)({
    document: "{colId}/{docId}/{subColId}/{subDocId}",
    database: "standlo",
    namespace: "{namespaceId}",
    region: "europe-west4"
}, async (event) => {
    var _a, _b;
    if (admin.apps.length === 0)
        return;
    const db = (0, firestore_2.getFirestore)(admin.app(), "standlo");
    const oldData = ((_a = event.data) === null || _a === void 0 ? void 0 : _a.before.exists) ? event.data.before.data() : null;
    const newData = ((_b = event.data) === null || _b === void 0 ? void 0 : _b.after.exists) ? event.data.after.data() : null;
    await (0, correlate_1.applyCorrelations)(db, [
        event.params.colId,
        event.params.docId,
        event.params.subColId,
        event.params.subDocId
    ], oldData, newData);
});
//# sourceMappingURL=correlator.js.map