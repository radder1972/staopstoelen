const loginUrl = 'https://sweetstory.s6-tastewp.com/wp-login.php';
const snippetsPageUrl = 'https://sweetstory.s6-tastewp.com/wp-admin/admin.php?page=add-snippet';
const updateSnippetUrl = 'https://sweetstory.s6-tastewp.com/wp-json/code-snippets/v1/snippets/5';

const username = 'admin';
const password = '7jfZUrib4xY';

const phpCodeWithACF = `
// 1. Registreer het JSON API endpoint voor de website
add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/stoelen', array(
        'methods' => 'GET',
        'callback' => 'get_custom_chairs_json',
        'permission_callback' => '__return_true', // Openbaar leesbaar
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
        
        // Hoofdafbeelding (WooCommerce product image)
        $image_id = $product->get_image_id();
        $main_image = $image_id ? wp_get_attachment_url($image_id) : '';
        
        // Extra afbeeldingen ophalen via ACF
        $image_up = get_field('image_up', $post->ID);
        $image_lie = get_field('image_lie', $post->ID);
        $ambient_image = get_field('ambient_image', $post->ID);
        
        // Eigenschappen ophalen (merk, conditie, etc.)
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
            'id' => $post->post_name, // slug als uniek ID
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

// 2. Registreer ACF Velden Programmatisch
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

async function updateSnippet() {
  console.log('Logging in...');
  const params = new URLSearchParams();
  params.append('log', username);
  params.append('pwd', password);
  params.append('wp-submit', 'Log In');
  params.append('testcookie', '1');

  try {
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: params.toString(),
      redirect: 'manual'
    });

    const cookies = loginRes.headers.getSetCookie();
    const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');

    // 1. Fetch REST nonce
    const pageRes = await fetch(snippetsPageUrl, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const pageHtml = await pageRes.text();
    const settingsMatch = pageHtml.match(/var CODE_SNIPPETS = (\{[^;]+\});/);
    if (!settingsMatch) {
      console.error('Could not find REST nonce!');
      return;
    }
    const nonce = JSON.parse(settingsMatch[1]).restAPI.nonce;
    console.log('REST nonce:', nonce);

    // 2. Send PUT request to update snippet #5
    console.log('Updating snippet #5 via REST API...');
    const snippetData = {
      code: phpCodeWithACF
    };

    const restRes = await fetch(updateSnippetUrl, {
      method: 'POST', // WordPress REST API allows POST with method override or just POST for updates if configured, but let's check if PUT or POST works
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
        'X-WP-Nonce': nonce,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify(snippetData)
    });

    console.log('REST API Response Status:', restRes.status);
    const resText = await restRes.text();
    console.log('REST API Response Body:', resText.substring(0, 500));

  } catch (err) {
    console.error('Error updating snippet:', err);
  }
}

updateSnippet();
