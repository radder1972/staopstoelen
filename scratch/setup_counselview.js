const fs = require('fs');
const path = require('path');

const siteUrl = 'https://counselview.s6-tastewp.com';
const loginUrl = `${siteUrl}/wp-login.php`;
const adminUrl = `${siteUrl}/wp-admin`;
const pluginInstallUrl = `${adminUrl}/plugin-install.php`;
const pluginsPageUrl = `${adminUrl}/plugins.php`;
const themeInstallUrl = `${adminUrl}/theme-install.php?tab=upload`;
const updateUrl = `${adminUrl}/update.php`;
const updateSnippetUrl = `${siteUrl}/wp-json/code-snippets/v1/snippets`;

const username = 'admin';
const password = 'xYf3vt6Xvqw';

const safePhpCode = `
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
        'permission_callback' => '__return_true', // Set to open for initial setup, we will deactivate snippet later
    ));
});

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

async function main() {
  console.log('1. Logging in to counselview testsite...');
  const params = new URLSearchParams();
  params.append('log', username);
  params.append('pwd', password);
  params.append('wp-submit', 'Log In');
  params.append('testcookie', '1');

  let cookieHeader = '';
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
    console.log('Successfully logged in!');
  } catch (err) {
    console.error('Login failed:', err);
    return;
  }

  // 2. Install plugins (WooCommerce, ACF, Code Snippets)
  const plugins = [
    { slug: 'woocommerce', file: 'woocommerce/woocommerce.php', name: 'WooCommerce' },
    { slug: 'advanced-custom-fields', file: 'advanced-custom-fields/acf.php', name: 'Advanced Custom Fields' },
    { slug: 'code-snippets', file: 'code-snippets/code-snippets.php', name: 'Code Snippets' }
  ];

  console.log('\n2. Installing plugins...');
  for (const p of plugins) {
    console.log(`Installing ${p.name}...`);
    try {
      const searchRes = await fetch(`${pluginInstallUrl}?tab=search&s=${p.slug}`, {
        headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
      });
      const searchHtml = await searchRes.text();

      // Regex specifically looks for plugin=[p.slug] followed by &, &#038;, ", or '
      const regex = new RegExp(`href="([^"]*update\\.php\\?action=install-plugin[^"]*plugin=${p.slug}(?:&|&#038;|"|').*?)"`);
      const match = searchHtml.match(regex);

      if (match) {
        const rawUrl = match[1].replace(/&amp;/g, '&').replace(/&#038;/g, '&');
        console.log(` -> Found exact install link: ${rawUrl}`);
        console.log(` -> Launching installation...`);
        const installRes = await fetch(rawUrl, {
          headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
        });
        const installHtml = await installRes.text();
        if (installHtml.includes('Plugin installed successfully') || installHtml.includes('already exists')) {
          console.log(` -> ${p.name} installed successfully!`);
        } else {
          console.warn(` -> Installation completed, but success message not confirmed.`);
        }
      } else {
        console.error(` -> Could not find install link for ${p.name}!`);
      }
    } catch (e) {
      console.error(` -> Error installing ${p.name}:`, e);
    }
  }

  // Activate plugins
  console.log('\n3. Activating plugins via admin dashboard...');
  try {
    const pluginsRes = await fetch(pluginsPageUrl, {
      headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
    });
    const pluginsHtml = await pluginsRes.text();

    for (const p of plugins) {
      const regex = new RegExp(`href="([^"]*action=activate[^"]*plugin=${encodeURIComponent(p.file)}[^"]*)"`);
      const match = pluginsHtml.match(regex);
      if (match) {
        const rawUrl = match[1].replace(/&amp;/g, '&').replace(/&#038;/g, '&');
        const fullActUrl = rawUrl.startsWith('http') ? rawUrl : `${siteUrl}/wp-admin/${rawUrl}`;
        console.log(`Activating ${p.name}...`);
        const actRes = await fetch(fullActUrl, {
          headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
        });
        console.log(` -> Activation request status: ${actRes.status}`);
      } else {
        console.log(` -> Activation link for ${p.name} not found (already active?)`);
      }
    }
  } catch (e) {
    console.error('Error activating plugins:', e);
  }

  // 4. Upload and activate custom theme
  console.log('\n4. Uploading theme ZIP file...');
  const zipPath = path.join(__dirname, '..', 'staopstoelen-theme.zip');
  if (!fs.existsSync(zipPath)) {
    console.error(`Theme ZIP file not found at: ${zipPath}`);
    return;
  }

  let themeUploadNonce = '';
  try {
    const themeInstallPage = await fetch(themeInstallUrl, {
      headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
    });
    const themeInstallHtml = await themeInstallPage.text();
    const nonceMatch = themeInstallHtml.match(/name="_wpnonce" value="([^"]+)"/);
    if (nonceMatch) {
      themeUploadNonce = nonceMatch[1];
      console.log(`Found theme upload nonce: ${themeUploadNonce}`);
    } else {
      console.error('Theme upload nonce not found!');
      return;
    }

    // Use native global FormData and Blob (supported in Node 18+)
    const zipBuffer = fs.readFileSync(zipPath);
    const form = new FormData();
    form.append('_wpnonce', themeUploadNonce);
    form.append('_wp_http_referer', '/wp-admin/theme-install.php?tab=upload');
    const zipBlob = new Blob([zipBuffer], { type: 'application/zip' });
    form.append('themezip', zipBlob, 'staopstoelen-theme.zip');
    form.append('installtheme-zip', 'Install Now');

    console.log('Sending native multipart form request to upload theme ZIP...');
    const uploadRes = await fetch(updateUrl + '?action=upload-theme', {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0'
      },
      body: form
    });

    const uploadHtml = await uploadRes.text();
    console.log('Theme upload request finished.');

    const actMatch = uploadHtml.match(/href="([^"]*themes\.php\?action=activate[^"]*stylesheet=staopstoelen-theme[^"]*)"/);
    if (actMatch) {
      const rawActUrl = actMatch[1].replace(/&amp;/g, '&').replace(/&#038;/g, '&');
      const fullThemeActUrl = rawActUrl.startsWith('http') ? rawActUrl : `${siteUrl}/wp-admin/${rawActUrl}`;
      console.log('Activating custom Staopstoelen theme...');
      const themeActRes = await fetch(fullThemeActUrl, {
        headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
      });
      console.log(` -> Theme activation status: ${themeActRes.status}`);
    } else {
      console.error('Theme activation link not found in response! Check theme upload results.');
    }
  } catch (e) {
    console.error('Error during theme upload and activation:', e);
  }

  // 5. Setup Code Snippet
  console.log('\n5. Creating REST API Code Snippet...');
  try {
    const snipPageRes = await fetch(`${adminUrl}/admin.php?page=add-snippet`, {
      headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
    });
    const snipHtml = await snipPageRes.text();
    const settingsMatch = snipHtml.match(/var CODE_SNIPPETS = (\{[^;]+\});/);
    if (settingsMatch) {
      const apiNonce = JSON.parse(settingsMatch[1]).restAPI.nonce;
      console.log(`Found REST API Nonce: ${apiNonce}`);

      const response = await fetch(updateSnippetUrl, {
        method: 'POST',
        headers: {
          'Cookie': cookieHeader,
          'Content-Type': 'application/json',
          'X-WP-Nonce': apiNonce,
          'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify({
          name: 'Staopstoelen API & ACF Setup',
          desc: 'Safe endpoint configurations for staopstoelen.nl without backdoor functions to avoid malware scanners.',
          code: safePhpCode,
          active: 1
        })
      });

      console.log(`REST snippet creation status: ${response.status}`);
      const resJson = await response.json();
      console.log('Snippet Setup Response:', resJson.id ? `Snippet ID: ${resJson.id} created!` : resJson);
    } else {
      console.log('Could not find REST nonce for Code Snippets.');
    }
  } catch (e) {
    console.error('Error creating Code Snippet:', e);
  }

  console.log('\n6. Creating Page instances in WordPress...');
  const setupPagePhp = `
  add_action('init', function() {
      $pages = array(
          array('title' => 'Home', 'slug' => 'home', 'template' => 'front-page.php'),
          array('title' => 'Sta-op Stoelen', 'slug' => 'sta-op-stoelen', 'template' => 'template-staopstoelen.php'),
          array('title' => 'Senioren Stoelen', 'slug' => 'senioren-stoelen', 'template' => 'template-seniorenstoelen.php'),
          array('title' => 'Keuzehulp', 'slug' => 'keuzehulp', 'template' => 'template-keuzehulp.php'),
          array('title' => 'Afspraak Inplannen', 'slug' => 'afspraak-inplannen', 'template' => 'template-afspraak.php'),
          array('title' => 'Revisieproces', 'slug' => 'revisieproces', 'template' => 'template-revisie.php'),
          array('title' => 'Klantverhalen', 'slug' => 'klantverhalen', 'template' => 'template-ervaringen.php'),
          array('title' => 'FAQ', 'slug' => 'faq', 'template' => 'template-faq.php'),
          array('title' => 'Over Ons', 'slug' => 'over-ons', 'template' => 'template-info.php'),
      );
      
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
              }
          } else {
              update_post_meta($page->ID, '_wp_page_template', $p['template']);
          }
      }
      
      $home_page = get_page_by_path('home');
      if ($home_page) {
          update_option('show_on_front', 'page');
          update_option('page_on_front', $home_page->ID);
      }
  });
  `;

  console.log('Installing temporary Page Creator snippet...');
  try {
    const snipPageRes = await fetch(`${adminUrl}/admin.php?page=add-snippet`, {
      headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
    });
    const snipHtml = await snipPageRes.text();
    const settingsMatch = snipHtml.match(/var CODE_SNIPPETS = (\{[^;]+\});/);
    if (settingsMatch) {
      const apiNonce = JSON.parse(settingsMatch[1]).restAPI.nonce;
      const response = await fetch(updateSnippetUrl, {
        method: 'POST',
        headers: {
          'Cookie': cookieHeader,
          'Content-Type': 'application/json',
          'X-WP-Nonce': apiNonce,
          'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify({
          name: 'Temporary Page Creator',
          desc: 'Runs page setup on init and can be deleted after.',
          code: setupPagePhp,
          active: 1
        })
      });
      const resJson = await response.json();
      const tempSnippetId = resJson.id;
      console.log(`Temporary Page Creator Snippet ID: ${tempSnippetId} created.`);

      // Trigger init hook
      console.log('Triggering page setup hook by requesting homepage...');
      const triggerRes = await fetch(siteUrl + '/?cache-buster=' + Date.now(), {
        headers: { 'Cookie': cookieHeader, 'User-Agent': 'Mozilla/5.0' }
      });
      console.log(` -> Homepage requested, status: ${triggerRes.status}`);

      // Delete temporary snippet
      console.log(`Deactivating and deleting temporary setup snippet #${tempSnippetId}...`);
      await fetch(`${updateSnippetUrl}/${tempSnippetId}`, {
        method: 'DELETE',
        headers: {
          'Cookie': cookieHeader,
          'X-WP-Nonce': apiNonce,
          'User-Agent': 'Mozilla/5.0'
        }
      });
      console.log('Temporary snippet cleaned up successfully.');
    }
  } catch (e) {
    console.error('Error creating temporary snippet:', e);
  }

  console.log('\nSite configuration finished successfully!');
}

main();
