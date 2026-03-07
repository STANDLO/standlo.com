import { execSync } from 'child_process';
import { resolve } from 'path';

const functionsDir = resolve(process.cwd(), 'functions');

console.log('🚀 Validating and Building Firebase Resources...');

try {
    // 1. Install dependencies if needed
    console.log('📦 Installing functions dependencies (npm ci)...');
    execSync('npm install', { cwd: functionsDir, stdio: 'inherit' });

    // 1.5 Patch firebase-functions Eventarc namespace bug
    execSync('node scripts/patchFirebaseFunctions.mjs', { cwd: process.cwd(), stdio: 'inherit' });

    // 2. Build via tsc
    console.log('🔨 Compiling TypeScript...');
    execSync('npm run build', { cwd: functionsDir, stdio: 'inherit' });

    // 3. Deploy using npx firebase-tools
    console.log('☁️ Deploying all Firebase resources (functions, firestore, storage) to standlo...');
    // Note: we use npx firebase-tools to avoid installing it globally and causing vulnerabilities in the main project
    execSync('npx --yes firebase-tools deploy --project=standlo', { cwd: process.cwd(), stdio: 'inherit' });

    console.log('✅ Firebase resources deployed successfully!');
} catch (error) {
    console.error('❌ Failed to deploy Firebase resources:', error.message);
    process.exit(1);
}
