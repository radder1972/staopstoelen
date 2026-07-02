const fs = require('fs');
const path = require('path');

const templates = [
  'template-home.php',
  'template-revisie.php',
  'template-ervaringen.php',
  'template-faq.php',
  'template-info.php',
  'template-staopstoelen.php',
  'template-seniorenstoelen.php',
  'template-keuzehulp.php',
  'template-afspraak.php'
];

function convertTemplates() {
  console.log('Converting local PHP templates to use get_theme_asset_url()...');

  for (const t of templates) {
    const fullPath = path.join(__dirname, '..', t);
    if (!fs.existsSync(fullPath)) continue;

    let content = fs.readFileSync(fullPath, 'utf8');

    // Replace get_stylesheet_directory_uri() . '/assets/filename.ext' with get_theme_asset_url('filename.ext')
    // Format 1: echo get_stylesheet_directory_uri(); ?>/assets/filename.png
    content = content.replace(/<\?php\s+echo\s+get_stylesheet_directory_uri\(\);\s+\?>\/assets\/([a-zA-Z0-9_\-\.]+)/g, "<?php echo get_theme_asset_url('$1'); ?>");

    // Format 2: get_stylesheet_directory_uri() . '/assets/filename.png'
    content = content.replace(/get_stylesheet_directory_uri\(\)\s*\.\s*['"]\/assets\/([a-zA-Z0-9_\-\.]+)['"]/g, "get_theme_asset_url('$1')");

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(` -> Converted ${t}`);
  }
}

convertTemplates();
