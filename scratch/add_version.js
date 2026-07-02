const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const themeDir = path.join(rootDir, 'staopstoelen-theme');

// Files to update in root directory
const rootFiles = [
  'index.html',
  'info.html',
  'faq.html',
  'revisie.html',
  'ervaringen.html',
  'keuzehulp.html',
  'staopstoelen.html',
  'seniorenstoelen.html',
  'afspraak.html',
  'winkel.html',
  'template-home.php',
  'template-info.php',
  'template-faq.php',
  'template-revisie.php',
  'template-ervaringen.php',
  'template-keuzehulp.php',
  'template-staopstoelen.php',
  'template-seniorenstoelen.php',
  'template-afspraak.php'
];

// Files to update in theme directory
const themeFiles = [
  'front-page.php',
  'template-info.php',
  'template-faq.php',
  'template-revisie.php',
  'template-ervaringen.php',
  'template-keuzehulp.php',
  'template-staopstoelen.php',
  'template-seniorenstoelen.php',
  'template-afspraak.php'
];

function updateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace version footer (supporting both raw text and existing versions if any)
  const regex = /Gerealiseerd door (?:BewegingsTechnologen|Zitspecialisten)\.(?:\s*\|\s*Versie\s*\d+)?/gi;
  const updatedContent = content.replace(regex, 'Gerealiseerd door BewegingsTechnologen. | Versie 110');
  
  if (content !== updatedContent) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`Updated footer in: ${path.basename(filePath)}`);
  } else {
    console.log(`No change or already updated: ${path.basename(filePath)}`);
  }
}

function main() {
  console.log('Starting footer version injector (v110)...');
  
  // 1. Update root files
  rootFiles.forEach(file => {
    updateFile(path.join(rootDir, file));
  });
  
  // 2. Update theme files
  themeFiles.forEach(file => {
    updateFile(path.join(themeDir, file));
  });
  
  console.log('Footer version update completed successfully!');
}

main();
