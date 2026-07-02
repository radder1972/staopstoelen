=== Staopstoelen Helper API & ACF Setup ===
Contributors: BewegingsTechnologen
Tags: woocommerce, acf, rest-api
Requires PHP: 7.4
Requires at least: 5.6
Tested up to: 6.5
Stable tag: 1.0.0
License: GPLv2 or later

Registers custom endpoints (/wp-json/custom/v1/stoelen and /wp-json/custom/v1/import-chair) and registers ACF custom fields programmatically.

== Description ==

This custom helper plugin provides the necessary backend setup for the staopstoelen.nl website:
1. Registreert de custom API endpoints voor het ophalen en importeren van stoelen.
2. Registreert de Advanced Custom Fields (ACF) velden programmatisch op WooCommerce producten (voor `image_up`, `image_lie`, en `ambient_image`).

== Installation ==

1. Upload the entire `staopstoelen-helper/` directory to the `/wp-content/plugins/` directory, or upload the zip file via Plugins > Add New > Upload.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. Make sure WooCommerce and Advanced Custom Fields are installed and active.
