import { getAuth } from "firebase-admin/auth";
import "./src/core/db";

async function run() {
    try {
        const user = await getAuth().getUserByEmail('kalex@standlo.com');
        console.log("Claims per Admin locale:", JSON.stringify(user.customClaims, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
