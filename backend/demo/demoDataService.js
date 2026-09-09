const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'demo-data');
const templateDir = path.join(__dirname, '..', 'demo-data-template');

// Initialize demo-data from template if it doesn't exist
const initializeData = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(templateDir)) {
    fs.mkdirSync(templateDir, { recursive: true });
  }
  const files = fs.readdirSync(templateDir);
  for (const file of files) {
    const targetPath = path.join(dataDir, file);
    if (!fs.existsSync(targetPath)) {
      fs.copyFileSync(path.join(templateDir, file), targetPath);
    }
  }
};

const getCollectionPath = (collectionName) => {
  return path.join(dataDir, `${collectionName}.json`);
};

const readCollection = (collectionName) => {
  const filePath = getCollectionPath(collectionName);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error(`Error reading ${collectionName}.json`, e);
    return [];
  }
};

const writeCollection = (collectionName, data) => {
  const filePath = getCollectionPath(collectionName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error(`Error writing ${collectionName}.json`, e);
  }
};

// Auto-initialize on load
initializeData();

module.exports = {
  readCollection,
  writeCollection
};
