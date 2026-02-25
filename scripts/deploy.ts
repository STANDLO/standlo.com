import { execSync, execFileSync } from 'child_process';
import process from 'process';
import * as fs from 'fs';
import * as path from 'path';

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const PROJECT_ID = 'standlo';

function runStep(name: string, command: string): boolean {
    console.log(`\n${COLORS.blue}➤  Running step: ${name}...${COLORS.reset}`);
    try {
        execSync(command, { stdio: 'inherit' });
        console.log(`${COLORS.green}✔  ${name} completed successfully.${COLORS.reset}`);
        return true;
    } catch {
        console.error(`${COLORS.red}✖  ${name} FAILED.${COLORS.reset}`);
        process.exit(1);
    }
}

function getChangedFiles(): string[] {
    try {
        const status = execSync('git status --porcelain', { encoding: 'utf-8' });
        return status.split('\n')
            .filter(line => line.trim() !== '')
            .map(line => {
                let file = line.substring(3); // git status --porcelain is 'MM path' or ' M path'
                if (file.startsWith('"') && file.endsWith('"')) {
                    file = file.slice(1, -1);
                }
                return file;
            });
    } catch {
        return [];
    }
}

function bumpVersion(type: 'major-deploy' | 'minor-deploy'): string {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const versionParts = pkg.version.split('.').map(Number);

    // Versioning Logic from User: X.Y.Z
    // X = Manual Version (Do not touch algorithmically)
    // Y = MAJOR deploy
    // Z = MINOR deploy

    if (type === 'major-deploy') {
        versionParts[1] += 1;
        versionParts[2] = 0;
    } else {
        versionParts[2] += 1;
    }

    pkg.version = versionParts.join('.');
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    return pkg.version;
}

async function main() {
    const args = process.argv.slice(2);
    const isValidateOnly = args.includes('--validate-only');
    const isMajorDeploy = args.includes('--major');
    const deployType = isMajorDeploy ? 'major-deploy' : 'minor-deploy';

    let customMessage = '';
    const msgIndex = args.indexOf('--message');
    if (msgIndex !== -1 && args.length > msgIndex + 1) {
        customMessage = args[msgIndex + 1];
    } else {
        const mIndex = args.indexOf('-m');
        if (mIndex !== -1 && args.length > mIndex + 1) {
            customMessage = args[mIndex + 1];
        }
    }

    console.log(`${COLORS.cyan}🚀 Starting ${isValidateOnly ? 'validation' : 'deployment'} process for ${PROJECT_ID}...${COLORS.reset}`);

    // 1. Validation (Clean Install + Lint + Build + Audit)
    if (!isValidateOnly) {
        runStep('Full Validation (Clean Install, Lint, Build, Audit)', 'npm run validate');
    } else {
        runStep('Quick Validation (Lint & Build)', 'npm run lint && npm run build');
    }

    if (isValidateOnly) {
        console.log(`\n${COLORS.green}✅ VALIDATION SUCCESSFUL!${COLORS.reset} (No changes were committed/pushed)\n`);
        return;
    }

    // 2. Bump Version & Write package.json
    const newVersion = bumpVersion(deployType);
    console.log(`\n${COLORS.cyan}📦 Bumped version to v${newVersion}${COLORS.reset}`);

    // 3. Deploy Firebase Rules (Firestore & Storage)
    runStep('Deploy Firestore & Storage Rules', `npx firebase-tools deploy --only firestore:rules,storage --project ${PROJECT_ID}`);

    // 4. Git Operations
    const changedFiles = getChangedFiles();
    if (changedFiles.length === 0) {
        console.log(`${COLORS.yellow}No changes to deploy.${COLORS.reset}`);
    } else {
        console.log(`${COLORS.yellow}Changes detected in:${COLORS.reset}`);
        changedFiles.slice(0, 10).forEach(f => console.log(` - ${f}`));
        if (changedFiles.length > 10) console.log(`   ...and ${changedFiles.length - 10} more files.`);

        // Generate Commit Message
        const fileList = changedFiles.map(f => f.split('/').pop()).slice(0, 3).join(', ');
        const extraCount = changedFiles.length > 3 ? `and ${changedFiles.length - 3} others` : '';

        const commitMessage = customMessage
            ? `v${newVersion} - ${customMessage}`
            : `v${newVersion} - Auto-deploy: Updated ${fileList} ${extraCount}`.trim();

        runStep('Git Add', 'git add .');

        try {
            console.log(`\n${COLORS.blue}➤  Committing changes...${COLORS.reset}`);
            execFileSync('git', ['commit', '-m', commitMessage], { stdio: 'inherit' });
            console.log(`${COLORS.green}✔  Commit successful: "${commitMessage}"${COLORS.reset}`);
        } catch {
            console.error(`${COLORS.red}✖  Commit failed.${COLORS.reset}`);
            process.exit(1);
        }
    }

    // Always push, even if no local changes (e.g. to ensure remote is synced triggers App Hosting if connected)
    runStep('Git Push', 'git push');

    console.log(`\n${COLORS.green}🎉 DEPLOYMENT SUCCESSFUL! Version is now v${newVersion}${COLORS.reset}\n`);
}

main();
