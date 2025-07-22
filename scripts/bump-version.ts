#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

type BumpType = 'major' | 'minor' | 'patch';

// Files that need version updates
const FILES = [
  path.join(rootDir, 'package.json'),
  path.join(rootDir, 'public/manifest.json'),
];

interface PackageJson {
  version: string;
  [key: string]: any;
}

// Read the current version from package.json
const packageJson: PackageJson = JSON.parse(fs.readFileSync(FILES[0], 'utf8'));
const currentVersion = packageJson.version;
console.log(`Current version: ${currentVersion}`);

// Parse command line arguments
const args = process.argv.slice(2);
const bumpType = (args[0] || 'patch') as BumpType;
const validBumpTypes: BumpType[] = ['major', 'minor', 'patch'];

if (!validBumpTypes.includes(bumpType)) {
  console.error(`Error: Invalid bump type '${bumpType}'. Must be one of: ${validBumpTypes.join(', ')}`);
  process.exit(1);
}

// Parse the current version
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Calculate the new version
let newVersion: string;
switch (bumpType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

console.log(`Bumping ${bumpType} version to: ${newVersion}`);

// Update each file
FILES.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  // For package.json and package-lock.json
  if (fileName === 'package.json') {
    const updated = content.replace(
      /"version": "[^"]+"/,
      `"version": "${newVersion}"`
    );
    fs.writeFileSync(filePath, updated);
    console.log(`Updated ${fileName}`);
  }
  // For manifest.json
  else if (fileName === 'manifest.json') {
    const updated = content.replace(
      /"version": "[^"]+"/,
      `"version": "${newVersion}"`
    );
    fs.writeFileSync(filePath, updated);
    console.log(`Updated ${fileName}`);
  }
});

// Also update package-lock.json by running npm install
console.log('Updating package-lock.json...');
try {
  execSync('npm install --package-lock-only', { cwd: rootDir, stdio: 'inherit' });
  console.log('package-lock.json updated');
} catch (error: any) {
  console.error('Failed to update package-lock.json:', error.message);
}

console.log(`\nVersion successfully bumped to ${newVersion}`);
console.log('Remember to commit these changes with a message like:');
console.log(`git commit -am "Bump version to ${newVersion}"`);