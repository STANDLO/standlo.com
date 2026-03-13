import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";

// Use the production credential to fetch the real data
const serviceAccount = JSON.parse(fs.readFileSync("./keys/standlo-firebase-adminsdk-fbsvc-5a2af63973.json", "utf8"));

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: "standlo"
});

const db = getFirestore(app);
db.settings({ databaseId: "standlo" });

async function dump() {
  const pipelines = [];
  const pSnap = await db.collection("pipelines").get();
  pSnap.forEach(d => pipelines.push({ id: d.id, ...d.data() }));

  const skills = [];
  const sSnap = await db.collection("ai_skills").get();
  sSnap.forEach(d => skills.push({ id: d.id, ...d.data() }));

  fs.writeFileSync("/tmp/prod_pipelines.json", JSON.stringify(pipelines, null, 2));
  fs.writeFileSync("/tmp/prod_skills.json", JSON.stringify(skills, null, 2));
  console.log("Dumped", pipelines.length, "pipelines and", skills.length, "skills.");
}

dump().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
