const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(dir + '/' + file).isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist') && !file.includes('.system_generated')) {
        filelist = walkSync(dir + '/' + file, filelist);
      }
    }
    else {
      if (
        file.endsWith('.js') || file.endsWith('.jsx') || 
        file.endsWith('.html') || file.endsWith('.md') || 
        file.endsWith('.json') || file.endsWith('.bat')
      ) {
        filelist.push(dir + '/' + file);
      }
    }
  });
  return filelist;
};

const replacements = [
  { regex: /Dadapuram Government HR Sec School/g, replace: 'EduSphere 360' },
  { regex: /Dadapuram Government HR Secondary School/g, replace: 'EduSphere 360' },
  { regex: /Dadapuram Govt HR Sec School/g, replace: 'EduSphere 360' },
  { regex: /Government Hr Sec School, Dadapuram-604207\./g, replace: 'EduSphere 360' },
  { regex: /அரசு மேல்நிலைப் பள்ளி தாதாபுரம்-604207\./g, replace: 'EduSphere 360' },
  { regex: /Government Higher Secondary School \(GHSS\), Dadapuram \(Dhadhapuram \/ Dhadapuram\)/g, replace: 'EduSphere 360' },
  { regex: /Government Higher Secondary School, Dadapuram \(Dhadhapuram \/ Dhadapuram\)/g, replace: 'EduSphere 360' },
  { regex: /Government Higher Secondary School, Dadapuram/g, replace: 'EduSphere 360' },
  { regex: /Government Higher Secondary School/gi, replace: 'EduSphere 360' },
  { regex: /GHSS Dadapuram \(Dhadhapuram \/ Dhadapuram\)/g, replace: 'EduSphere 360' },
  { regex: /GHSS Dadapuram \(DGHSS 360\)/g, replace: 'EduSphere 360' },
  { regex: /GHSS Dadapuram/g, replace: 'EduSphere 360' },
  { regex: /Dadapuram School Management & Academic Analytics Portal/g, replace: 'Education Management Platform' },
  { regex: /Dadapuram School Management & Analytics Portal/g, replace: 'Education Management Platform' },
  { regex: /Dadapuram School Management Portal/g, replace: 'Education Management Platform' },
  { regex: /Dadapuram School Student Portal/g, replace: 'Student Portal' },
  { regex: /Dadapuram School Portal/g, replace: 'Education Management Platform' },
  { regex: /Dadapuram School/g, replace: 'EduSphere 360' },
  { regex: /Dadapuram Analytics Dashboard/g, replace: 'EduSphere 360 Dashboard' },
  { regex: /Dhadhapuram School Student Portal/g, replace: 'Student Portal' },
  { regex: /Dhadhapuram School/g, replace: 'EduSphere 360' },
  { regex: /Dhadapuram School Portal/g, replace: 'Education Management Platform' },
  { regex: /Dhadapuram School/g, replace: 'EduSphere 360' },
  { regex: /Dadapuram Student Rise/g, replace: 'Student Rise' },
  { regex: /Dadapuram/g, replace: 'EduSphere 360' },
  { regex: /Dhadhapuram/g, replace: 'EduSphere 360' },
  { regex: /Dhadapuram/g, replace: 'EduSphere 360' },
  { regex: /DGHSS 360 Student Portal/g, replace: 'Student Rise' },
  { regex: /DGHSS 360/g, replace: 'EduSphere 360' },
  { regex: /DGHSS/g, replace: 'EduSphere 360' },
  { regex: /School Management System/gi, replace: 'Education Management Platform' },
  { regex: /School Management Portal/gi, replace: 'Education Management Platform' },
  { regex: /EduSphere 360 EduSphere 360/g, replace: 'EduSphere 360' },
  { regex: /EduSphere 360 - EduSphere 360/g, replace: 'EduSphere 360' },
  { regex: /EduSphere 360 \(EduSphere 360\)/g, replace: 'EduSphere 360' },
  { regex: /EduSphere 360 - EduSphere 360 Education Management Platform/g, replace: 'EduSphere 360 - Education Management Platform' }
];

const files = walkSync('.');
let changedCount = 0;

files.forEach(file => {
  if (file.endsWith('replace-branding.js') || file.includes('package-lock.json')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  replacements.forEach(({regex, replace}) => {
    content = content.replace(regex, replace);
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
    changedCount++;
  }
});

console.log(`\nCompleted. Updated ${changedCount} files.`);
