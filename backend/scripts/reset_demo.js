const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'demo-data');
const templateDir = path.join(__dirname, '..', 'demo-data-template');

console.log('--- DGHSS 360 DEMO RESET ---');

if (!fs.existsSync(templateDir)) {
    console.error('Error: demo-data-template directory not found. Cannot reset.');
    process.exit(1);
}

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Clean current demo data
const currentFiles = fs.readdirSync(dataDir);
for (const file of currentFiles) {
    fs.unlinkSync(path.join(dataDir, file));
}
console.log(`Cleared ${currentFiles.length} modified demo files.`);

// Copy templates
const templateFiles = fs.readdirSync(templateDir);
for (const file of templateFiles) {
    fs.copyFileSync(path.join(templateDir, file), path.join(dataDir, file));
}
console.log(`Restored ${templateFiles.length} pristine demo files from template.`);

console.log('Demo reset completed successfully.');
