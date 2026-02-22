import { execSync, execFileSync } from 'child_process';
import process from 'process';

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

async function main() {
    const isValidateOnly = process.argv.includes('--validate-only');
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

    // 2. Deploy Firebase Rules (Firestore & Storage)
    runStep('Deploy Firestore & Storage Rules', `npx firebase-tools deploy --only firestore:rules,storage --project ${PROJECT_ID}`);

    // 3. Git Operations
    const changedFiles = getChangedFiles();
    if (changedFiles.length === 0) {
        console.log(`${COLORS.yellow}No changes to deploy.${COLORS.reset}`);
    } else {
        console.log(`${COLORS.yellow}Changes detected in:${COLORS.reset}`);
        changedFiles.forEach(f => console.log(` - ${f}`));

        // Generate Commit Message
        const fileList = changedFiles.map(f => f.split('/').pop()).slice(0, 3).join(', ');
        const extraCount = changedFiles.length > 3 ? `and ${changedFiles.length - 3} others` : '';
        const commitMessage = `Auto-deploy: Updated ${fileList} ${extraCount}`.trim();

        runStep('Git Add', 'git add .');

        try {
            console.log(`\n${COLORS.blue}➤  Committing changes...${COLORS.reset}`);
            // Use execFileSync to avoid shell escaping issues with spaces/quotes in the message
            execFileSync('git', ['commit', '-m', commitMessage], { stdio: 'inherit' });
            console.log(`${COLORS.green}✔  Commit successful.${COLORS.reset}`);
        } catch {
            console.error(`${COLORS.red}✖  Commit failed.${COLORS.reset}`);
            process.exit(1);
        }
    }

    // Always push, even if no local changes, to ensure remote is synced (triggers App Hosting if connected)
    runStep('Git Push', 'git push');

    console.log(`\n${COLORS.green}🎉 DEPLOYMENT SUCCESSFUL!${COLORS.reset}\n`);
}

main();
