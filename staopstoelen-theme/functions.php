<?php
/**
 * Staopstoelen Theme Functions and Definitions
 *
 * @package WordPress
 * @subpackage Staopstoelen
 * @since 1.0.0
 */

/**
 * Dynamic Asset Finder
 * Checks if the file is present in the theme's assets folder,
 * otherwise searches for an attachment in the Media Library with that name.
 */
function get_theme_asset_url($filename) {
    // 1. Try active theme assets/ folder
    $theme_file = get_stylesheet_directory() . '/assets/' . $filename;
    if (file_exists($theme_file)) {
        return get_stylesheet_directory_uri() . '/assets/' . $filename;
    }
    
    // 2. Fallback: Search in WordPress Media Library (wp_posts) by post_name
    global $wpdb;
    $slug = pathinfo($filename, PATHINFO_FILENAME);
    
    // Query attachment guid by name
    $attachment = $wpdb->get_col($wpdb->prepare(
        "SELECT guid FROM $wpdb->posts WHERE post_type = 'attachment' AND post_name = %s LIMIT 1",
        $slug
    ));
    
    if (!empty($attachment)) {
        return $attachment[0];
    }
    
    // 3. Fallback: Local API or placeholder
    return 'https://staopstoelen.nl/assets/' . $filename;
}
