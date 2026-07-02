const fs = require('fs');
const path = require('path');

const themeDir = path.join(__dirname, '..', 'staopstoelen-theme');
const assetsDestDir = path.join(themeDir, 'assets');

// Clean themeDir if exists to remove old heavy images
if (fs.existsSync(themeDir)) {
  fs.rmSync(themeDir, { recursive: true, force: true });
}
fs.mkdirSync(themeDir);
fs.mkdirSync(assetsDestDir);

// 2. Write style.css with WordPress Theme Header
console.log('Writing style.css with Theme Header...');
const localStylePath = path.join(__dirname, '..', 'style.css');
let styleContent = fs.readFileSync(localStylePath, 'utf8');

const themeHeader = `/*
Theme Name: Staopstoelen Theme
Theme URI: https://staopstoelen.nl
Author: BewegingsTechnologen
Description: Custom theme for staopstoelen.nl integrated with WooCommerce.
Version: 1.0.0
Text Domain: staopstoelen
*/\n\n`;

fs.writeFileSync(path.join(themeDir, 'style.css'), themeHeader + styleContent, 'utf8');

// 3. Copy templates, functions.php, JS, and manifesting files
const filesToCopy = [
  { src: 'template-home.php', dest: 'front-page.php' },
  { src: 'index.php', dest: 'index.php' }, // index.php added as fallback
  { src: 'functions.php', dest: 'functions.php' }, // New functions.php added
  { src: 'template-staopstoelen.php', dest: 'template-staopstoelen.php' },
  { src: 'template-seniorenstoelen.php', dest: 'template-seniorenstoelen.php' },
  { src: 'template-keuzehulp.php', dest: 'template-keuzehulp.php' },
  { src: 'template-afspraak.php', dest: 'template-afspraak.php' },
  { src: 'template-revisie.php', dest: 'template-revisie.php' },
  { src: 'template-ervaringen.php', dest: 'template-ervaringen.php' },
  { src: 'template-faq.php', dest: 'template-faq.php' },
  { src: 'template-info.php', dest: 'template-info.php' },
  { src: 'app.js', dest: 'app.js' },
  { src: 'apple-touch-icon.png', dest: 'apple-touch-icon.png' },
  { src: 'favicon-32x32.png', dest: 'favicon-32x32.png' },
  { src: 'favicon-16x16.png', dest: 'favicon-16x16.png' },
  { src: 'site.webmanifest', dest: 'site.webmanifest' }
];

console.log('Copying PHP templates and core JS...');
for (const f of filesToCopy) {
  const src = path.join(__dirname, '..', f.src);
  const dest = path.join(themeDir, f.dest);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  } else {
    console.warn(`File not found, skipping: ${f.src}`);
  }
}

// 4. Copy ONLY vector/small SVG assets to assets/ (Exclude large PNGs/JPGs)
const assetsToCopy = [
  // SVG stamps (very small)
  'keuze_stempel.svg',
  'revisie_stempel_clean.svg',
  'review_stempel.svg',
  'gereserveerd_stempel.svg',
  'verkocht_stempel.svg',
];

console.log('Copying vector SVGs...');
for (const asset of assetsToCopy) {
  const src = path.join(__dirname, '..', 'assets', asset);
  const dest = path.join(assetsDestDir, asset);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  } else {
    console.warn(`Asset not found, skipping: ${asset}`);
  }
}

console.log('Custom theme folder successfully structured (lightweight mode)!');
