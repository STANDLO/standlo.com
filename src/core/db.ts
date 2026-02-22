import { credential } from 'firebase-admin';
import { getApps, initializeApp, AppOptions, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

/**
 * Configurazione Firebase Progetto Standlo
 */
const firebaseConfig: AppOptions = {
    projectId: "standlo",
    storageBucket: "standlo.firebasestorage.app",
    credential: credential.cert(path.resolve(process.cwd(), 'keys/standlo-firebase-adminsdk-fbsvc-5a2af63973.json')),
};

/**
 * Inizializzazione Firebase Admin
 */
if (getApps().length === 0) {
    initializeApp(firebaseConfig);
}

/**
 * Istanza Core di Firestore (Singleton) collegata al Database esplicito "default"
 */
export const db = getFirestore(getApp(), "default");
