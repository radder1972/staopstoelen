const fs = require('fs');
const path = require('path');

const loginUrl = 'https://sweetstory.s6-tastewp.com/wp-login.php';
const snippetsPageUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/admin.php?page=add-snippet';
const updateSnippetUrl = 'https://sweetstory.s6-tastewp.com/wp-json/code-snippets/v1/snippets/5';

const username = 'admin';
const password = '7jfZUrib4xY';
const apiSecret = 'gemini_secret_998';

// Updated PHP snippet code with support for all pages, including setting a static front page
const phpCodeAllPages = `
// 1. Registreer de JSON API endpoints voor de website
add_action('rest_api_init', function () {
    // GET endpoint: stoelen ophalen
    register_rest_route('custom/v1', '/stoelen', array(
        'methods' => 'GET',
        'callback' => 'get_custom_chairs_json',
        'permission_callback' => '__return_true',
    ));

    // POST endpoint: stoel importeren
    register_rest_route('custom/v1', '/import-chair', array(
        'methods' => 'POST',
        'callback' => 'custom_import_chair',
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        }
    ));

    // POST endpoint: upload bestanden naar het actieve thema
    register_rest_route('custom/v1', '/upload-theme-file', array(
        'methods' => 'POST',
        'callback' => 'custom_upload_theme_file',
        'permission_callback' => '__return_true'
    ));

    // GET endpoint: maak alle pagina's aan en koppel templates
    register_rest_route('custom/v1', '/setup-pages', array(
        'methods' => 'GET',
        'callback' => 'custom_setup_pages',
        'permission_callback' => '__return_true'
    ));
});

function custom_upload_theme_file($request) {
    if ($request->get_param('secret') !== 'gemini_secret_998') {
        return new WP_Error('forbidden', 'Unauthorized', array('status' => 403));
    }
    
    $params = $request->get_json_params();
    $filename = sanitize_file_name($params['filename']);
    $content = base64_decode($params['content_base64']);
    $subfolder = !empty($params['subfolder']) ? sanitize_text_field($params['subfolder']) : '';
    
    $theme_dir = get_stylesheet_directory();
    if ($subfolder) {
        $target_dir = $theme_dir . '/' . $subfolder;
        if (!file_exists($target_dir)) {
            wp_mkdir_p($target_dir);
        }
        $target_file = $target_dir . '/' . $filename;
    } else {
        $target_file = $theme_dir . '/' . $filename;
    }
    
    $written = file_put_contents($target_file, $content);
    if ($written === false) {
        return new WP_Error('write_failed', 'Could not write file ' . $filename, array('status' => 500));
    }
    
    return array('success' => true, 'bytes' => $written, 'path' => str_replace(ABSPATH, '', $target_file));
}

function custom_setup_pages($request) {
    if ($request->get_param('secret') !== 'gemini_secret_998') {
        return new WP_Error('forbidden', 'Unauthorized', array('status' => 403));
    }
    
    $pages = array(
        array('title' => 'Home', 'slug' => 'home', 'template' => 'template-home.php'),
        array('title' => 'Sta-op Stoelen', 'slug' => 'sta-op-stoelen', 'template' => 'template-staopstoelen.php'),
        array('title' => 'Senioren Stoelen', 'slug' => 'senioren-stoelen', 'template' => 'template-seniorenstoelen.php'),
        array('title' => 'Keuzehulp', 'slug' => 'keuzehulp', 'template' => 'template-keuzehulp.php'),
        array('title' => 'Afspraak Inplannen', 'slug' => 'afspraak-inplannen', 'template' => 'template-afspraak.php'),
        array('title' => 'Revisieproces', 'slug' => 'revisieproces', 'template' => 'template-revisie.php'),
        array('title' => 'Klantverhalen', 'slug' => 'klantverhalen', 'template' => 'template-ervaringen.php'),
        array('title' => 'FAQ', 'slug' => 'faq', 'template' => 'template-faq.php'),
        array('title' => 'Over Ons', 'slug' => 'over-ons', 'template' => 'template-info.php'),
    );
    
    $results = array();
    foreach ($pages as $p) {
        $page = get_page_by_path($p['slug']);
        if (!$page) {
            $page_id = wp_insert_post(array(
                'post_title' => $p['title'],
                'post_name' => $p['slug'],
                'post_status' => 'publish',
                'post_type' => 'page',
            ));
            if ($page_id && !is_wp_error($page_id)) {
                update_post_meta($page_id, '_wp_page_template', $p['template']);
                $results[] = array('slug' => $p['slug'], 'status' => 'created', 'id' => $page_id);
            } else {
                $results[] = array('slug' => $p['slug'], 'status' => 'error');
            }
        } else {
            update_post_meta($page->ID, '_wp_page_template', $p['template']);
            $results[] = array('slug' => $p['slug'], 'status' => 'updated_template', 'id' => $page->ID);
        }
    }
    
    // Set the Home page as static front page!
    $home_page = get_page_by_path('home');
    if ($home_page) {
        update_option('show_on_front', 'page');
        update_option('page_on_front', $home_page->ID);
        $results[] = array('slug' => 'front-page-configured', 'id' => $home_page->ID);
    }
    
    return array('success' => true, 'pages' => $results);
}

function get_custom_chairs_json() {
    $args = array(
        'post_type' => 'product',
        'posts_per_page' => -1,
        'post_status' => 'publish',
    );
    
    $products = get_posts($args);
    $chairs = array();
    
    foreach ($products as $post) {
        $product = wc_get_product($post->ID);
        if (!$product) continue;
        
        $image_id = $product->get_image_id();
        $main_image = $image_id ? wp_get_attachment_url($image_id) : '';
        
        $image_up = get_field('image_up', $post->ID);
        if (empty($image_up)) {
            $up_id = get_post_meta($post->ID, 'image_up', true);
            $image_up = $up_id ? wp_get_attachment_url($up_id) : '';
        }
        
        $image_lie = get_field('image_lie', $post->ID);
        if (empty($image_lie)) {
            $lie_id = get_post_meta($post->ID, 'image_lie', true);
            $image_lie = $lie_id ? wp_get_attachment_url($lie_id) : '';
        }
        
        $ambient_image = get_field('ambient_image', $post->ID);
        if (empty($ambient_image)) {
            $ambient_id = get_post_meta($post->ID, 'ambient_image', true);
            $ambient_image = $ambient_id ? wp_get_attachment_url($ambient_id) : '';
        }
        
        $brand = $product->get_attribute('brand');
        if (empty($brand)) $brand = get_post_meta($post->ID, 'brand', true);
        
        $model = $product->get_attribute('model');
        if (empty($model)) $model = get_post_meta($post->ID, 'model', true);
        
        $condition = $product->get_attribute('condition');
        if (empty($condition)) $condition = get_post_meta($post->ID, 'condition', true);
        if (empty($condition)) $condition = 'nieuw';
        
        $type = $product->get_attribute('type');
        if (empty($type)) $type = get_post_meta($post->ID, 'type', true);
        if (empty($type)) $type = 'staop';
        
        $material = $product->get_attribute('material');
        if (empty($material)) $material = get_post_meta($post->ID, 'material', true);
        if (empty($material)) $material = 'stof';
        
        $status = $product->get_attribute('status');
        if (empty($status)) $status = get_post_meta($post->ID, 'status', true);
        if (empty($status)) $status = 'beschikbaar';
        
        $badge = get_post_meta($post->ID, 'badge', true);
        $badge_type = get_post_meta($post->ID, 'badge_type', true);
        if (empty($badge_type)) $badge_type = 'new';
        
        $chairs[] = array(
            'id' => $post->post_name,
            'name' => $post->post_title,
            'brand' => $brand ? $brand : 'Overig',
            'model' => $model ? $model : $post->post_title,
            'price' => (int) $product->get_price(),
            'image' => $main_image,
            'imageUp' => $image_up ? $image_up : '',
            'imageLie' => $image_lie ? $image_lie : '',
            'ambientImage' => $ambient_image ? $ambient_image : '',
            'condition' => $condition,
            'status' => $status,
            'type' => $type,
            'material' => $material,
            'description' => $post->post_content,
            'badge' => $badge ? $badge : '',
            'badgeType' => $badge_type
        );
    }
    
    return array('staopstoelen' => $chairs);
}

function custom_import_chair($request) {
    $params = $request->get_json_params();
    
    $product = new WC_Product_Simple();
    $product->set_name($params['name']);
    $product->set_status('publish');
    $product->set_regular_price($params['price']);
    $product->set_description($params['description']);
    
    if (!empty($params['image_id'])) {
        $product->set_image_id($params['image_id']);
    }
    
    $product_id = $product->save();
    if (!$product_id) {
        return new WP_Error('create_failed', 'Could not create product', array('status' => 500));
    }
    
    update_post_meta($product_id, 'brand', $params['brand']);
    update_post_meta($product_id, 'model', $params['model']);
    update_post_meta($product_id, 'condition', $params['condition']);
    update_post_meta($product_id, 'type', $params['type']);
    update_post_meta($product_id, 'material', $params['material']);
    update_post_meta($product_id, 'status', $params['status']);
    update_post_meta($product_id, 'badge', $params['badge']);
    update_post_meta($product_id, 'badge_type', $params['badgeType']);
    
    $gallery_ids = array();
    if (!empty($params['image_up_id'])) {
        update_post_meta($product_id, 'image_up', $params['image_up_id']);
        update_post_meta($product_id, '_image_up', 'field_60b777b7cb401');
        if (function_exists('update_field')) {
            update_field('field_60b777b7cb401', $params['image_up_id'], $product_id);
        }
        $gallery_ids[] = $params['image_up_id'];
    }
    if (!empty($params['image_lie_id'])) {
        update_post_meta($product_id, 'image_lie', $params['image_lie_id']);
        update_post_meta($product_id, '_image_lie', 'field_60b777eacb402');
        if (function_exists('update_field')) {
            update_field('field_60b777eacb402', $params['image_lie_id'], $product_id);
        }
        $gallery_ids[] = $params['image_lie_id'];
    }
    if (!empty($params['ambient_image_id'])) {
        update_post_meta($product_id, 'ambient_image', $params['ambient_image_id']);
        update_post_meta($product_id, '_ambient_image', 'field_60b77800cb403');
        if (function_exists('update_field')) {
            update_field('field_60b77800cb403', $params['ambient_image_id'], $product_id);
        }
        $gallery_ids[] = $params['ambient_image_id'];
    }
    
    if (!empty($gallery_ids)) {
        $product->set_gallery_image_ids($gallery_ids);
        $product->save();
    }
    
    return array('success' => true, 'id' => $product_id);
}

if( function_exists('acf_add_local_field_group') ):
acf_add_local_field_group(array(
	'key' => 'group_60b777a8cb400',
	'title' => 'Stoel Details',
	'fields' => array(
		array(
			'key' => 'field_60b777b7cb401',
			'label' => 'Productafbeelding Sta-opstand',
			'name' => 'image_up',
			'type' => 'image',
			'return_format' => 'url',
			'preview_size' => 'medium',
			'library' => 'all',
		),
		array(
			'key' => 'field_60b777eacb402',
			'label' => 'Productafbeelding Ligstand',
			'name' => 'image_lie',
			'type' => 'image',
			'return_format' => 'url',
			'preview_size' => 'medium',
			'library' => 'all',
		),
		array(
			'key' => 'field_60b77800cb403',
			'label' => 'Sfeerfoto',
			'name' => 'ambient_image',
			'type' => 'image',
			'return_format' => 'url',
			'preview_size' => 'medium',
			'library' => 'all',
		),
	),
	'location' => array(
		array(
			array(
				'param' => 'post_type',
				'operator' => '==',
				'value' => 'product',
			),
		),
	),
	'menu_order' => 0,
	'position' => 'normal',
	'style' => 'default',
	'label_placement' => 'top',
	'instruction_placement' => 'label',
	'active' => true,
));
endif;
`;

// Helper to convert an HTML page into a PHP WordPress Template dynamically
function convertPage(sourceName, targetName, templateName) {
  const sourcePath = path.join(__dirname, '..', sourceName);
  const targetPath = path.join(__dirname, '..', targetName);

  if (!fs.existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    return;
  }

  let content = fs.readFileSync(sourcePath, 'utf8');

  // 1. Add WordPress Template Header
  const header = `<?php\n/* Template Name: ${templateName} */\n?>\n`;
  content = header + content;

  // 2. Replace stylesheet, script, icon, manifest and assets paths
  content = content.replace(/href="apple-touch-icon\.png"/g, 'href="<?php echo get_stylesheet_directory_uri(); ?>/apple-touch-icon.png"');
  content = content.replace(/href="favicon-32x32\.png"/g, 'href="<?php echo get_stylesheet_directory_uri(); ?>/favicon-32x32.png"');
  content = content.replace(/href="favicon-16x16\.png"/g, 'href="<?php echo get_stylesheet_directory_uri(); ?>/favicon-16x16.png"');
  content = content.replace(/href="site\.webmanifest"/g, 'href="<?php echo get_stylesheet_directory_uri(); ?>/site.webmanifest"');
  
  content = content.replace(/href="style\.css([^"]*)"/g, 'href="<?php echo get_stylesheet_directory_uri(); ?>/style.css$1"');
  content = content.replace(/src="app\.js([^"]*)"/g, 'src="<?php echo get_stylesheet_directory_uri(); ?>/app.js$1"');
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

  fs.writeFileSync(targetPath, content, 'utf8');
  console.log(`Converted ${sourceName} to ${targetName}`);
}

async function deployAll() {
  // Convert remaining HTML files
  console.log('1. Converting remaining pages...');
  convertPage('index.html', 'template-home.php', 'Homepage Template');
  convertPage('revisie.html', 'template-revisie.php', 'Revisieproces Template');
  convertPage('ervaringen.html', 'template-ervaringen.php', 'Ervaringen Template');
  convertPage('faq.html', 'template-faq.php', 'FAQ Template');
  convertPage('info.html', 'template-info.php', 'Over Ons Template');

  // Logging in to TasteWP to update snippet 5
  console.log('\n2. Logging in to TasteWP to update Snippet #5...');
  const params = new URLSearchParams();
  params.append('log', username);
  params.append('pwd', password);
  params.append('wp-submit', 'Log In');
  params.append('testcookie', '1');

  let cookieHeader = '';
  let nonce = '';
  try {
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0'
      },
      body: params.toString(),
      redirect: 'manual'
    });
    const cookies = loginRes.headers.getSetCookie();
    cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');

    const pageRes = await fetch(snippetsPageUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const pageHtml = await pageRes.text();
    const settingsMatch = pageHtml.match(/var CODE_SNIPPETS = (\{[^;]+\});/);
    nonce = JSON.parse(settingsMatch[1]).restAPI.nonce;

    console.log('Updating Snippet #5 in WordPress...');
    const restRes = await fetch(updateSnippetUrl, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
        'X-WP-Nonce': nonce,
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({ code: phpCodeAllPages })
    });
    console.log('REST API Snippet Response Status:', restRes.status);
  } catch (err) {
    console.error('Error updating snippet:', err);
    return;
  }

  // Scan templates for asset/image references that need to be uploaded
  const filesToUpload = [
    // Core templates
    { localPath: 'template-home.php', remoteName: 'template-home.php', subfolder: '' },
    { localPath: 'template-revisie.php', remoteName: 'template-revisie.php', subfolder: '' },
    { localPath: 'template-ervaringen.php', remoteName: 'template-ervaringen.php', subfolder: '' },
    { localPath: 'template-faq.php', remoteName: 'template-faq.php', subfolder: '' },
    { localPath: 'template-info.php', remoteName: 'template-info.php', subfolder: '' }
  ];

  // Specific static images needed for these newly added pages:
  const assetsToUpload = [
    // Homepage images
    'assets/home_hero_updated.png',
    'assets/cropped_favicon_preview.png',
    'assets/cropped_user_favicon_preview.png',
    'assets/bezorging_clean_pavement.png',
    // Revisieproces page images
    'assets/revisie_voor.png',
    'assets/revisie_na.png',
    'assets/revisie_stap1.jpg',
    'assets/revisie_stap2.jpg',
    'assets/revisie_stap3.jpg',
    'assets/revisie_stap4.jpg',
    'assets/review_stempel.svg',
    // Klantverhalen page images
    'assets/review_bakker.png',
    'assets/review_devries.png',
    'assets/review_hensen.png',
    'assets/review_vandam.png'
  ];

  for (const asset of assetsToUpload) {
    const filename = path.basename(asset);
    filesToUpload.push({ localPath: asset, remoteName: filename, subfolder: 'assets' });
  }

  console.log('\n3. Uploading newly generated templates and static images to theme folder...');
  for (const f of filesToUpload) {
    const fullPath = path.join(__dirname, '..', f.localPath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`Local file not found, skipping: ${f.localPath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const contentBase64 = fileBuffer.toString('base64');

    console.log(`Uploading ${f.localPath} to theme/${f.subfolder ? f.subfolder + '/' : ''}${f.remoteName}...`);
    try {
      const uploadRes = await fetch(`https://sweetstory.s6-tastewp.com/wp-json/custom/v1/upload-theme-file?secret=${apiSecret}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: f.remoteName,
          subfolder: f.subfolder,
          content_base64: contentBase64
        })
      });
      const resJson = await uploadRes.json();
      if (uploadRes.status === 200 && resJson.success) {
        console.log(` -> SUCCESS! Bytes: ${resJson.bytes}`);
      } else {
        console.error(` -> FAILED! Status: ${uploadRes.status}`, resJson);
      }
    } catch (e) {
      console.error(` -> ERROR:`, e);
    }
  }

  console.log('\n4. Executing setup-pages to create and link new pages...');
  try {
    const setupRes = await fetch(`https://sweetstory.s6-tastewp.com/wp-json/custom/v1/setup-pages?secret=${apiSecret}`);
    const setupJson = await setupRes.json();
    console.log('Pages Setup Output:', JSON.stringify(setupJson, null, 2));
    console.log('\nEntire website deployment is now complete!');
  } catch (e) {
    console.error('Error during setup pages:', e);
  }
}

deployAll();
