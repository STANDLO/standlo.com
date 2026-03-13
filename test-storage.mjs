import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString, connectStorageEmulator } from "firebase/storage";
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator } from "firebase/auth";

const app = initializeApp({
    apiKey: "fake-api-key-for-emulator",
    projectId: "demo-standlo",
    appId: "1:1234:web:5678",
    storageBucket: "standlo.firebasestorage.app"
});

const auth = getAuth(app);
connectAuthEmulator(auth, "http://127.0.0.1:9099");

const storage = getStorage(app);
connectStorageEmulator(storage, "127.0.0.1", 9199);

async function test() {
    try {
        console.log("Signing in...");
        try {
            await signInWithEmailAndPassword(auth, "test@example.com", "password123");
        } catch (e) {
            if (e.code === 'auth/user-not-found') {
                const { createUserWithEmailAndPassword } = await import("firebase/auth");
                await createUserWithEmailAndPassword(auth, "test@example.com", "password123");
            } else {
                throw e;
            }
        }
        console.log("Signed in as", auth.currentUser?.uid);

        const storageRef = ref(storage, "public/logos/test-upload.txt");
        console.log("Uploading...");
        await uploadString(storageRef, "Hello world");
        console.log("Upload SUCCESS");
    } catch (e) {
        console.error("Upload FAILED:", e);
    }
}

test();
