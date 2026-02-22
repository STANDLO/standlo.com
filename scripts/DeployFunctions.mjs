import { execSync } from 'child_process';
import { resolve } from 'path';

const functionsDir = resolve(process.cwd(), 'functions');

console.log('🚀 Validating and Building Cloud Functions...');

try {
    // 1. Install dependencies if needed
    console.log('📦 Installing functions dependencies (npm ci)...');
    execSync('npm install', { cwd: functionsDir, stdio: 'inherit' });

    // 2. Build via tsc
    console.log('🔨 Compiling TypeScript...');
    execSync('npm run build', { cwd: functionsDir, stdio: 'inherit' });

    // 3. Deploy using npx firebase-tools
    console.log('☁️ Deploying functions to europe-west4...');
    // Note: we use npx firebase-tools to avoid installing it globally and causing vulnerabilities in the main project
    execSync('npx --yes firebase-tools deploy --only functions --project=standlo', { cwd: process.cwd(), stdio: 'inherit' });

    console.log('✅ Functions deployed successfully!');
} catch (error) {
    console.error('❌ Failed to deploy functions:', error.message);
    process.exit(1);
}
