const fs = require('fs');

const original = fs.readFileSync('scripts/seedLocalPipelines.mjs', 'utf8');
const newPipelinesJson = JSON.parse(fs.readFileSync('scripts/tempOutput.json', 'utf8'));

const extractBase = original.split("const pipelines = [")[1].split("];\n\nasync function seed")[0];
// It's technically JS, not pure JSON since keys might not be quoted originally, but in our file they actually are!
// But wait, the previous pipelines.mjs was pure JSON. Let's parse it using eval since it's a local script anyway.

let basePipelines;
try {
  basePipelines = eval(`[${extractBase}]`);
} catch(e) {
  // Try another way: just keep the ones we know
}

// We just overwrite the file entirely with a clean structure
const basePipelinesWeWant = basePipelines.filter(p => !["part-create", "assembly-create", "sketch-create", "bundle-create", "design-create", "process-create", "tool-create", "task-create", "project-create"].includes(p.id));

const allPipelines = [...basePipelinesWeWant, ...newPipelinesJson];

const newFileContent = `import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

try {
    initializeApp({ projectId: "standlo" });
} catch {
    // App already initialized
}

const db = getFirestore();
try { db.settings({ databaseId: "standlo" }); } catch {}

const pipelines = ${JSON.stringify(allPipelines, null, 2)};

async function seed() {
  console.log("🚀 Starting Local Seeding for Pipelines...");
  const batch = db.batch();
  for (const pip of pipelines) {
    batch.set(db.collection("pipelines").doc(pip.id), pip);
  }
  await batch.commit();
  console.log("✅ Seeded " + pipelines.length + " pipelines successfully.");
}

seed().catch(console.error);
`;

fs.writeFileSync('scripts/seedLocalPipelines.mjs', newFileContent);
console.log("Merged successfully");
