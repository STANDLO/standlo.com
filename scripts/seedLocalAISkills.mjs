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
    "orgId": "system",
    "name": "Generate Compelling Subject",
    "description": "Generates an email subject based on project context",
    "isActive": true,
    "model": "gemini-2.5-flash",
    "promptTemplate": "You are a professional copywriter. Generate a compelling email subject for this project context: {{ data.context }}",
    "inputSchema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"context\": {\n      \"type\": \"string\"\n    }\n  },\n  \"required\": [\n    \"context\"\n  ]\n}",
    "outputSchema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"subject\": {\n      \"type\": \"string\"\n    }\n  },\n  \"required\": [\n    \"subject\"\n  ]\n}",
    "type": "chat",
    "createdAt": "2026-03-01T00:00:00.000Z",
    "updatedAt": "2026-03-01T00:00:00.000Z",
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
