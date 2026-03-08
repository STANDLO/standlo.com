import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

admin.initializeApp({ projectId: 'standlo' });
try {
  const db = getFirestore(admin.app(), "standlo");
  console.log("Success! DB ID:", db.databaseId);
} catch (e) {
  console.error("Failed:", e.message);
}
