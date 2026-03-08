import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const LOG_DIR = path.resolve('logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function killPort(port) {
    try {
        const pid = execSync(`lsof -ti:${port}`).toString().trim();
        if (pid) {
            console.log(`[Offline] Killing process on port ${port} (PID: ${pid})`);
            for (const p of pid.split('\n')) {
                execSync(`kill -9 ${p}`);
            }
        }
    } catch (e) { }
}

console.log('🛑 Killing previous processes on ports 3000, 3001, and Firebase Emulators...');
[3000, 3001, 8080, 4000, 5001, 9199, 9099, 8085].forEach(killPort);

const emuOut = fs.createWriteStream(path.join(LOG_DIR, 'emulator.log'), { flags: 'w' });
const adminOut = fs.createWriteStream(path.join(LOG_DIR, 'admin.log'), { flags: 'w' });
const webOut = fs.createWriteStream(path.join(LOG_DIR, 'web.log'), { flags: 'w' });

console.log('\n🚀 Starting Offline Environment...');
console.log('📂 Logs will be written to the ./logs/ directory.');

console.log('\n🔧 Starting Firebase Emulators...');

console.log('🔧 Patching Firebase emulator manual export destination to ./exports...');
try {
    execSync('node scripts/patchFirebaseEmulator.mjs', { cwd: process.cwd(), stdio: 'inherit' });
} catch (e) { }

const emu = spawn('npm', ['run', 'emulator'], { cwd: process.cwd() });
emu.stdout.pipe(emuOut);
emu.stderr.pipe(emuOut);
emu.stdout.pipe(process.stdout); // Show emulator output until it's ready

let emuReady = false;
emu.stdout.on('data', (data) => {
    // Check if emulator is fully booted
    if (!emuReady && data.toString().includes('All emulators ready')) {
        emuReady = true;
        console.log('\n✅ Emulators Ready! Data loaded from seed/firestore_export (if present).');

        const env = {
            ...process.env,
            NEXT_PUBLIC_USE_FIREBASE_EMULATOR: 'true',
            FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
            FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
            FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9199',
            GCLOUD_PROJECT: 'standlo',
            GOOGLE_CLOUD_PROJECT: 'standlo'
        };

        console.log('🌱 Executing Main Seeding Script...');
        try {
            execSync('node seed/index.mjs', { env, stdio: 'inherit' });
        } catch (seedErr) {
            console.error('⚠️ Failed to complete seeding, check emulator state.', seedErr.message);
        }

        console.log('\n🌐 Starting Web (Next.js) on port 3000...');
        const web = spawn('npm', ['run', 'dev'], { cwd: process.cwd(), env });
        web.stdout.pipe(webOut);
        web.stderr.pipe(webOut);

        console.log('⚙️ Starting Admin on port 3001...');
        const admin = spawn('npm', ['run', 'dev'], { cwd: path.join(process.cwd(), 'admin'), env });
        admin.stdout.pipe(adminOut);
        admin.stderr.pipe(adminOut);

        console.log('\n🎉 Environment is fully up & running!');
        console.log('👉 Next JS Web: http://localhost:3000');
        console.log('👉 Admin Panel: http://localhost:3001');
        console.log('👉 Firebase UI: http://127.0.0.1:4000');
        console.log('\n[Press Ctrl+C to shut everything down gracefully]');
    }
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down offline environment... Saving emulator state (export-on-exit)...');
    emu.kill('SIGINT');
    process.exit();
});
