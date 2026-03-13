import fs from 'fs';
import path from 'path';
import os from 'os';

const direction = process.argv[2];

const LOCAL_BRAIN_DIR = path.join(os.homedir(), '.gemini/antigravity/brain');
const PROJECT_BRAIN_DIR = path.join(process.cwd(), 'brain');

function syncDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    // Ignore .DS_Store
    if (entry.name === '.DS_Store') continue;

    if (entry.isDirectory()) {
      syncDir(srcPath, destPath);
    } else {
      // Overwrite local files to ensure they are up to date
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (direction === 'pull') {
  console.log('🧠 [STANDLO] Pulling customized AI Brain from repo to local machine...');
  syncDir(PROJECT_BRAIN_DIR, LOCAL_BRAIN_DIR);
} else if (direction === 'push') {
  console.log('🧠 [STANDLO] Pushing local AI Brain to repo for backup...');
  syncDir(LOCAL_BRAIN_DIR, PROJECT_BRAIN_DIR);
} else {
  console.error("Usage: node scripts/SyncBrain.mjs [pull|push]");
  process.exit(1);
}
