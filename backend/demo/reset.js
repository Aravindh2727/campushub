const fs = require('fs');
const path = require('path');

const templateDir = path.join(__dirname, '../demo-data-template');
const dataDir = path.join(__dirname, '../demo-data');

function copyFolderSync(from, to) {
    if (!fs.existsSync(to)) {
        fs.mkdirSync(to, { recursive: true });
    }
    const files = fs.readdirSync(from);
    for (const element of files) {
        const fromPath = path.join(from, element);
        const toPath = path.join(to, element);
        const stat = fs.lstatSync(fromPath);
        if (stat.isFile()) {
            fs.copyFileSync(fromPath, toPath);
        } else if (stat.isDirectory()) {
            copyFolderSync(fromPath, toPath);
        }
    }
}

try {
    console.log('--- RESETTING DEMO DATA ---');
    console.log('Copying from:', templateDir);
    console.log('To:', dataDir);
    copyFolderSync(templateDir, dataDir);
    console.log('--- DEMO DATA RESET SUCCESSFUL ---');
} catch (e) {
    console.error('--- ERROR RESETTING DEMO DATA ---');
    console.error(e);
    process.exit(1);
}
