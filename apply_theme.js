const fs = require('fs');
const path = require('path');

const pagesPath = path.join(__dirname, 'frontend/src/pages');
const teacherLayout = path.join(__dirname, 'frontend/src/components/layout/TeacherLayout.jsx');
const uiComponents = path.join(__dirname, 'frontend/src/components/ui');
const certs = path.join(__dirname, 'frontend/src/components/certificates');

const replacements = [
  // 1. Structural Backgrounds
  { regex: /bg-\[#0B1221\]/g, replacement: 'bg-adminBg' },
  { regex: /bg-\[#131E3A\]/g, replacement: 'bg-white' },
  { regex: /bg-\[#18263B\]/g, replacement: 'bg-white' },
  { regex: /bg-\[#0B132B\]/g, replacement: 'bg-white' },
  { regex: /bg-\[#0a0a0f\]/g, replacement: 'bg-adminBg' },
  
  // 2. Translucent Whites/Dark elements to Light Elements
  { regex: /bg-white\/\[0\.02\]/g, replacement: 'bg-white shadow-sm' },
  { regex: /bg-white\/\[0\.03\]/g, replacement: 'bg-white shadow-sm' },
  { regex: /bg-white\/5/g, replacement: 'bg-gray-50' },
  { regex: /bg-white\/10/g, replacement: 'bg-gray-100' },
  { regex: /hover:bg-white\/\[0\.04\]/g, replacement: 'hover:bg-gray-50 hover:shadow-md' },
  { regex: /hover:bg-white\/\[0\.06\]/g, replacement: 'hover:bg-gray-100' },
  { regex: /hover:bg-white\/5/g, replacement: 'hover:bg-gray-100' },
  { regex: /hover:bg-white\/10/g, replacement: 'hover:bg-gray-200' },
  { regex: /bg-black\/50/g, replacement: 'bg-gray-900/50' },
  { regex: /bg-black\/20/g, replacement: 'bg-gray-900/10' },

  // 3. Borders
  { regex: /border-\[#5D7D9A\]\/10/g, replacement: 'border-gray-200' },
  { regex: /border-white\/5/g, replacement: 'border-gray-200' },
  { regex: /border-white\/10/g, replacement: 'border-gray-200' },
  { regex: /hover:border-white\/10/g, replacement: 'hover:border-gray-300' },
  
  // 4. Primary Text (Dark on Light)
  { regex: /text-\[#EBD8BE\]\/[0-9]+/g, replacement: 'text-gray-500' },
  { regex: /text-\[#EBD8BE\]/g, replacement: 'text-gray-700' },
  { regex: /text-white\/[0-9]+/g, replacement: 'text-gray-500' },
  { regex: /text-gray-100/g, replacement: 'text-gray-900' },
  { regex: /text-white/g, replacement: 'text-gray-900' },
  
  // 5. Highlights and Accents from previous theme
  { regex: /text-\[#F9CB84\]/g, replacement: 'text-adminAccent2' },
  { regex: /bg-\[#F9CB84\]/g, replacement: 'bg-adminAccent2 text-white' },
  { regex: /border-\[#F9CB84\]/g, replacement: 'border-adminAccent2' },
  { regex: /shadow-\[#F9CB84\]/g, replacement: 'shadow-adminAccent2/20' },
  { regex: /from-\[#F9CB84\]/g, replacement: 'from-adminAccent2' },
  
  { regex: /text-\[#5D7D9A\]/g, replacement: 'text-adminSidebar' },
  { regex: /bg-\[#5D7D9A\]/g, replacement: 'bg-adminSidebar text-white' },

  // Missed cyan accent
  { regex: /text-\[#62D4CA\]/g, replacement: 'text-adminSidebar' },
  { regex: /bg-\[#62D4CA\]\/10/g, replacement: 'bg-adminSidebar/10' },
  { regex: /bg-\[#62D4CA\]\/20/g, replacement: 'bg-adminSidebar/20' },
  { regex: /bg-\[#62D4CA\]/g, replacement: 'bg-adminSidebar text-white' },
  { regex: /border-\[#62D4CA\]/g, replacement: 'border-adminSidebar' },
  { regex: /shadow-\[0_0_10px_rgba\(98,212,202,0\.2\)\]/g, replacement: 'shadow-sm shadow-adminSidebar/20' },

  // Missed beige accent
  { regex: /bg-\[#EBD8BE\] text-gray-900/g, replacement: 'bg-adminAccent2 text-white' },
  { regex: /bg-\[#EBD8BE\]/g, replacement: 'bg-adminAccent2' },
  { regex: /text-\[#EBD8BE\]/g, replacement: 'text-adminAccent2' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });
  
  content = content.replace(/bg-adminAccent2 text-gray-900/g, 'bg-adminAccent2 text-white');
  content = content.replace(/bg-adminSidebar text-gray-900/g, 'bg-adminSidebar text-white');
  content = content.replace(/bg-adminAccent1 text-gray-900/g, 'bg-adminAccent1 text-white');
  content = content.replace(/text-gray-900 text-gray-900/g, 'text-gray-900');
  content = content.replace(/bg-white text-gray-900/g, 'bg-adminSidebar text-white'); // for buttons

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  });
}

walkDir(pagesPath);
walkDir(uiComponents);
walkDir(certs);
if (fs.existsSync(teacherLayout)) processFile(teacherLayout);

console.log('All files processed.');
