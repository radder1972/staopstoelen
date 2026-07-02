const fs = require('fs');
const path = require('path');

function convertFile(sourceName, targetName, templateName) {
  const sourcePath = path.join(__dirname, '..', sourceName);
  const targetPath = path.join(__dirname, '..', targetName);

  if (!fs.existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    return;
  }

  console.log(`Converting ${sourceName} to ${targetName}...`);
  let content = fs.readFileSync(sourcePath, 'utf8');

  // 1. Add WordPress Template Header
  const header = `<?php\n/* Template Name: ${templateName} */\n?>\n`;
  content = header + content;

  // 2. Replace stylesheet and asset paths
  content = content.replace(/href="apple-touch-icon\.png"/g, 'href="<?php echo get_stylesheet_directory_uri(); ?>/apple-touch-icon.png"');
  content = content.replace(/href="favicon-32x32\.png"/g, 'href="<?php echo get_stylesheet_directory_uri(); ?>/favicon-32x32.png"');
  content = content.replace(/href="favicon-16x16\.png"/g, 'href="<?php echo get_stylesheet_directory_uri(); ?>/favicon-16x16.png"');
  content = content.replace(/href="site\.webmanifest"/g, 'href="<?php echo get_stylesheet_directory_uri(); ?>/site.webmanifest"');
  
  content = content.replace(/href="style\.css([^"]*)"/g, 'href="<?php echo get_stylesheet_directory_uri(); ?>/style.css$1"');
  content = content.replace(/src="app\.js([^"]*)"/g, 'src="<?php echo get_stylesheet_directory_uri(); ?>/app.js$1"');

  // Replace assets directory references (e.g. assets/revisie_stempel.svg etc.)
  content = content.replace(/src="assets\/([^"]*)"/g, 'src="<?php echo get_stylesheet_directory_uri(); ?>/assets/$1"');

  // 3. Replace navigation links to point to WordPress pages
  content = content.replace(/href="index\.html"/g, 'href="<?php echo home_url(\'/\'); ?>"');
  content = content.replace(/href="staopstoelen\.html"/g, 'href="<?php echo home_url(\'/sta-op-stoelen/\'); ?>"');
  content = content.replace(/href="seniorenstoelen\.html"/g, 'href="<?php echo home_url(\'/senioren-stoelen/\'); ?>"');
  content = content.replace(/href="keuzehulp\.html"/g, 'href="<?php echo home_url(\'/keuzehulp/\'); ?>"');
  content = content.replace(/href="revisie\.html"/g, 'href="<?php echo home_url(\'/revisieproces/\'); ?>"');
  content = content.replace(/href="ervaringen\.html"/g, 'href="<?php echo home_url(\'/klantverhalen/\'); ?>"');
  content = content.replace(/href="faq\.html"/g, 'href="<?php echo home_url(\'/faq/\'); ?>"');
  content = content.replace(/href="info\.html"/g, 'href="<?php echo home_url(\'/over-ons/\'); ?>"');
  content = content.replace(/href="afspraak\.html"/g, 'href="<?php echo home_url(\'/afspraak-inplannen/\'); ?>"');

  // Replace JavaScript redirects
  content = content.replace(/window\.location\.href\s*=\s*"afspraak\.html"/g, 'window.location.href = "<?php echo home_url(\'/afspraak-inplannen/\'); ?>"');

  // 4. Exclude replacing assets paths in the static JSON fallback list (since they point to relative paths in the build)
  // Let's restore the relative assets path inside the JSON database block so it doesn't get messed up if we fall back
  content = content.replace(/"image":\s*"<\?php echo get_stylesheet_directory_uri\(\);\s*\?>\/assets\//g, '"image": "assets/');
  content = content.replace(/"imageUp":\s*"<\?php echo get_stylesheet_directory_uri\(\);\s*\?>\/assets\//g, '"imageUp": "assets/');
  content = content.replace(/"ambientImage":\s*"<\?php echo get_stylesheet_directory_uri\(\);\s*\?>\/assets\//g, '"ambientImage": "assets/');

  fs.writeFileSync(targetPath, content, 'utf8');
  console.log(`Success: Converted to ${targetName}`);
}

// Convert the files
convertFile('staopstoelen.html', 'template-staopstoelen.php', 'Catalogus Sta-op Stoelen');
convertFile('seniorenstoelen.html', 'template-seniorenstoelen.php', 'Catalogus Senioren Stoelen');
