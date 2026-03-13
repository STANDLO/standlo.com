import * as fs from 'fs';

let p = JSON.parse(fs.readFileSync('/tmp/prod_pipelines.json', 'utf8'));

for (let i = 0; i < p.length; i++) {
  if (p[i].id === 'auth-onboarding') {
    p[i].id = 'organization-onboarding';
  }
}

const header = `import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

try {
    initializeApp({ projectId: "standlo" });
} catch (e) {
    // App already initialized
}

const db = getFirestore();
try { db.settings({ databaseId: "standlo" }); } catch (e) {}

`;

const pContent = header + `const pipelines = ${JSON.stringify(p, null, 2)};

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

fs.writeFileSync('./scripts/seedLocalPipelines.mjs', pContent);

let s = JSON.parse(fs.readFileSync('/tmp/prod_skills.json', 'utf8'));

const sContent = header + `const skills = ${JSON.stringify(s, null, 2)};

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
`;

fs.writeFileSync('./scripts/seedLocalAISkills.mjs', sContent);
console.log("Seed scripts generated.");
