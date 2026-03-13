import { db } from "./src/core/db";

async function main() {
    const snap = await db.collection("materials").get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
