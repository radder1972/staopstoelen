<?php
/**
 * Plugin Name: Staopstoelen Helper API & ACF Setup
 * Plugin URI: https://staopstoelen.nl/
 * Description: Registreert de custom JSON REST API endpoints (/wp-json/custom/v1/stoelen en /wp-json/custom/v1/import-chair) en configureert programmatisch de ACF (Advanced Custom Fields) velden voor de Staopstoelen custom theme.
 * Version: 1.0.0
 * Author: BewegingsTechnologen
 * Author URI: https://staopstoelen.nl/
 * License: GPL2
 */

// Voorkom directe toegang tot het bestand
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// 1. Registreer de JSON API endpoints voor de website
add_action('rest_api_init', function () {
    // GET endpoint: stoelen ophalen voor de website
    register_rest_route('custom/v1', '/stoelen', array(
        'methods' => 'GET',
        'callback' => 'get_custom_chairs_json',
        'permission_callback' => '__return_true', // Openbaar leesbaar
    ));

    // POST endpoint: stoelen importeren uit JSON
    register_rest_route('custom/v1', '/import-chair', array(
        'methods' => 'POST',
        'callback' => 'custom_import_chair',
        'permission_callback' => function () {
            return current_user_can('edit_posts'); // Alleen ingelogde gebruikers met rechten
        }
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
        
        // Extra afbeeldingen ophalen via ACF, met fallback naar get_post_meta
        $image_up = get_field('image_up', $post->ID);
        if (empty($image_up)) $image_up = get_post_meta($post->ID, 'image_up', true);
        
        $image_lie = get_field('image_lie', $post->ID);
        if (empty($image_lie)) $image_lie = get_post_meta($post->ID, 'image_lie', true);
        
        $ambient_image = get_field('ambient_image', $post->ID);
        if (empty($ambient_image)) $ambient_image = get_post_meta($post->ID, 'ambient_image', true);
        
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

function custom_import_chair($request) {
    $params = $request->get_json_params();
    
    // Maak WooCommerce Product
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
    
    // Meta / Eigenschappen opslaan
    update_post_meta($product_id, 'brand', $params['brand']);
    update_post_meta($product_id, 'model', $params['model']);
    update_post_meta($product_id, 'condition', $params['condition']);
    update_post_meta($product_id, 'type', $params['type']);
    update_post_meta($product_id, 'material', $params['material']);
    update_post_meta($product_id, 'status', $params['status']);
    update_post_meta($product_id, 'badge', $params['badge']);
    update_post_meta($product_id, 'badge_type', $params['badgeType']);
    
    // Extra ACF-afbeeldingen koppelen met veldsleutels en directe metadata fallbacks
    $gallery_ids = array();
    if (!empty($params['image_up_id'])) {
        $url = wp_get_attachment_url($params['image_up_id']);
        update_post_meta($product_id, 'image_up', $url);
        update_post_meta($product_id, '_image_up', 'field_60b777b7cb401');
        if (function_exists('update_field')) {
            update_field('field_60b777b7cb401', $url, $product_id);
        }
        $gallery_ids[] = $params['image_up_id'];
    }
    if (!empty($params['image_lie_id'])) {
        $url = wp_get_attachment_url($params['image_lie_id']);
        update_post_meta($product_id, 'image_lie', $url);
        update_post_meta($product_id, '_image_lie', 'field_60b777eacb402');
        if (function_exists('update_field')) {
            update_field('field_60b777eacb402', $url, $product_id);
        }
        $gallery_ids[] = $params['image_lie_id'];
    }
    if (!empty($params['ambient_image_id'])) {
        $url = wp_get_attachment_url($params['ambient_image_id']);
        update_post_meta($product_id, 'ambient_image', $url);
        update_post_meta($product_id, '_ambient_image', 'field_60b77800cb403');
        if (function_exists('update_field')) {
            update_field('field_60b77800cb403', $url, $product_id);
        }
        $gallery_ids[] = $params['ambient_image_id'];
    }
    
    if (!empty($gallery_ids)) {
        $product->set_gallery_image_ids($gallery_ids);
        $product->save();
    }
    
    return array('success' => true, 'id' => $product_id);
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
