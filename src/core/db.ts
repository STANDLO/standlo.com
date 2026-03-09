import { credential } from 'firebase-admin';
import { getApps, initializeApp, AppOptions, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

import * as fs from 'fs';

/**
 * Configurazione Firebase Progetto Standlo
 */
const firebaseConfig: AppOptions = {
    projectId: "standlo",
    storageBucket: "standlo.firebasestorage.app",
};

// Costruzione dinamica per ingannare la static trace di Turbopack
const keyFilename = ['standlo', 'firebase', 'adminsdk', 'fbsvc', '5a2af63973.json'].join('-');
const keyPath = path.resolve(process.cwd(), 'keys', keyFilename);

if (fs.existsSync(keyPath)) {
    firebaseConfig.credential = credential.cert(keyPath);
} else if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    firebaseConfig.credential = credential.cert({
        projectId: "standlo",
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/^"|"$/g, '').replace(/\\n/g, '\n'),
    })
} else {
    firebaseConfig.credential = credential.applicationDefault();
}

/**
 * Inizializzazione Firebase Admin
 */
if (getApps().length === 0) {
    initializeApp(firebaseConfig);
}

/**
 * Istanza Core di Firestore (Singleton) collegata al Database esplicito "standlo" (Enterprise)
 */
export const db = getFirestore(getApp(), "standlo");
