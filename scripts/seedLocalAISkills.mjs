import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

try {
    initializeApp({ projectId: "standlo" });
} catch (e) {
    // App already initialized
}

const db = getFirestore();
try { db.settings({ databaseId: "standlo" }); } catch (e) {}

const skills = [
  {
    "id": "generate-email-subject",
    "skillId": "generate-email-subject",
    "orgId": "system",
    "displayName": "Generate Compelling Subject",
    "description": "Generates an email subject based on project context",
    "isActive": true,
    "modelName": "googleai/gemini-2.5-flash",
    "outputFormat": "text",
    "prompt": "You are a professional copywriter. Generate a compelling email subject for this project context: {{ data.context }}",
    "inputSchemaJson": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"context\": {\n      \"type\": \"string\"\n    }\n  },\n  \"required\": [\n    \"context\"\n  ]\n}",
    "outputSchemaJson": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"subject\": {\n      \"type\": \"string\"\n    }\n  },\n  \"required\": [\n    \"subject\"\n  ]\n}",
    "mockPayloadJson": "{\n  \"data\": {\n    \"context\": \"A new marketing campaign for our Spring Collection\"\n  }\n}",
    "createdAt": "2026-03-01T00:00:00.000Z",
    "updatedAt": "2026-03-01T00:00:00.000Z",
    "createdBy": "system",
  },
  {
    "id": "ai_metadata",
    "skillId": "ai_metadata",
    "orgId": "system",
    "displayName": "Design AI Metadata Generation",
    "description": "Analyzes PDM entities (part, assembly, etc.) to generate rich, human-readable descriptions, keywords, and accurate 3D bounding box dimension formatting.",
    "isActive": true,
    "modelName": "googleai/gemini-3.0-pro-preview",
    "outputFormat": "json",
    "prompt": "You are a Master CAD/PDM Data Engineer. Analyze this {{ data.type }} data: {{ data.document }}. Generate rich LocalizedNameSchema (en, it, es), detailed descriptions, and physical tags. Note: For assemblies or groups, calculate the overall geometric bounding box volume based on contained elements if possible.",
    "inputSchemaJson": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"document\": {\"type\": \"object\"},\n    \"type\": {\"type\": \"string\"}\n  },\n  \"required\": [\"document\", \"type\"]\n}",
    "outputSchemaJson": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"tags\": {\"type\": \"array\", \"items\": {\"type\": \"string\"}},\n    \"translations\": {\"type\": \"object\", \"properties\": {\"en\": {\"type\": \"string\"}, \"it\": {\"type\": \"string\"}, \"es\": {\"type\": \"string\"}}, \"required\": [\"en\", \"it\", \"es\"]},\n    \"dimensions\": {\"type\": \"array\", \"items\": {\"type\": \"number\"}}\n  },\n  \"required\": [\"tags\", \"translations\"]\n}",
    "mockPayloadJson": "{\n  \"data\": {\n    \"type\": \"part\",\n    \"document\": {\n      \"name\": \"Steel Bracket Alpha\",\n      \"material\": \"stainless_steel_304\",\n      \"dimensions\": [10.5, 4.2, 2.1],\n      \"density\": 7.93\n    }\n  }\n}",
    "createdAt": "2026-03-14T00:00:00.000Z",
    "updatedAt": "2026-03-14T00:00:00.000Z",
    "createdBy": "system",
    "updatedBy": "system",
    "deletedAt": null,
    "isArchived": false
  },
  {
    "id": "ai_dcode",
    "skillId": "ai_dcode",
    "orgId": "system",
    "displayName": "Design AI D-CODE Translation",
    "description": "Translates raw entity component trees and metadata into strict D-CODE syntax for deterministic AI representation.",
    "isActive": true,
    "modelName": "googleai/gemini-3.0-pro-preview",
    "outputFormat": "json",
    "prompt": "You are a STANDLO D-CODE compiler. Translate this PDM entity and its enriched metadata: {{ data.document }} into valid procedural D-CODE strings that recreate it.",
    "inputSchemaJson": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"document\": {\"type\": \"object\"}\n  },\n  \"required\": [\"document\"]\n}",
    "outputSchemaJson": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"d_code\": {\"type\": \"array\", \"items\": {\"type\": \"string\"}}\n  },\n  \"required\": [\"d_code\"]\n}",
    "mockPayloadJson": "{\n  \"data\": {\n    \"document\": {\n      \"name\": \"Steel Bracket Alpha\",\n      \"tags\": [\"bracket\", \"structural\", \"steel\"],\n      \"dimensions\": [10.5, 4.2, 2.1]\n    }\n  }\n}",
    "createdAt": "2026-03-14T00:00:00.000Z",
    "updatedAt": "2026-03-14T00:00:00.000Z",
    "createdBy": "system",
    "updatedBy": "system",
    "deletedAt": null,
    "isArchived": false
  },
  {
    "id": "ai_vectorize",
    "skillId": "ai_vectorize",
    "orgId": "system",
    "displayName": "Design AI Vectorization",
    "description": "Prepares and embeds the fully enriched D-CODE metadata payload into the Vector DB for usage by standlo_design.",
    "isActive": true,
    "modelName": "googleai/gemini-2.5-flash",
    "outputFormat": "json",
    "prompt": "You are a Vector DB Architect. Prepare the final LLM embedding array payload based on the rich metadata and D-CODE representation of this entity: {{ data.document }}.",
    "inputSchemaJson": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"document\": {\"type\": \"object\"}\n  },\n  \"required\": [\"document\"]\n}",
    "outputSchemaJson": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"vector_payload\": {\"type\": \"object\"}\n  },\n  \"required\": [\"vector_payload\"]\n}",
    "mockPayloadJson": "{\n  \"data\": {\n    \"document\": {\n      \"name\": \"Steel Bracket Alpha\",\n      \"tags\": [\"bracket\", \"structural\", \"steel\"],\n      \"d_code\": [\"create part 'Steel Bracket Alpha'\", \"set material 'stainless_steel_304'\"]\n    }\n  }\n}",
    "createdAt": "2026-03-14T00:00:00.000Z",
    "updatedAt": "2026-03-14T00:00:00.000Z",
    "createdBy": "system",
    "updatedBy": "system",
    "deletedAt": null,
    "isArchived": false
  }
];

async function seed() {
  console.log("🚀 Starting Local Seeding for AI Skills...");
  const batch = db.batch();
  for (const skill of skills) {
    batch.set(db.collection("ai_skills").doc(skill.id), skill);
  }
  await batch.commit();
  console.log("✅ Seeded " + skills.length + " AI skills successfully.");
}

seed().catch(console.error);
