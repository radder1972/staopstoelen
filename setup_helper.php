<?php
/**
 * Staopstoelen Auto Setup Helper
 * 
 * Place this file in the WordPress root directory and access it via browser.
 */

// Load WordPress environment
require_once('wp-load.php');
require_once(ABSPATH . 'wp-admin/includes/plugin.php');
require_once(ABSPATH . 'wp-admin/includes/theme.php');
require_once(ABSPATH . 'wp-admin/includes/file.php');

// Increase limits for slow servers
@ini_set('memory_limit', '256M');
@set_time_limit(300);

header('Content-Type: text/html; charset=utf-8');
echo "<html><head><title>Staopstoelen Setup Helper</title>";
echo "<style>body{font-family:sans-serif;line-height:1.6;max-width:800px;margin:40px auto;padding:20px;background:#f9f9f9;color:#333;}h1{color:#1b4332;}h2{color:#2d6a4f;margin-top:30px;}.success{color:#2d6a4f;font-weight:bold;}.error{color:#d90429;font-weight:bold;}</style></head><body>";
echo "<h1>Staopstoelen Site Builder & Setup Helper</h1>";

// 1. Download and install WooCommerce if not exists
if (!is_plugin_active('woocommerce/woocommerce.php')) {
    echo "<h2>1. Installing WooCommerce</h2>";
    $wp_plugins_dir = WP_PLUGIN_DIR;
    $zip_file = $wp_plugins_dir . '/woocommerce.zip';
    
    if (!file_exists($wp_plugins_dir . '/woocommerce/woocommerce.php')) {
        echo "Downloading WooCommerce zip from WordPress.org...<br>";
        $ch = curl_init('https://downloads.wordpress.org/plugin/woocommerce.latest-stable.zip');
        $fp = fopen($zip_file, 'wb');
        curl_setopt($ch, CURLOPT_FILE, $fp);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        $download_success = curl_exec($ch);
        curl_close($ch);
        fclose($fp);
        
        if ($download_success) {
            echo "Extracting WooCommerce zip...<br>";
            $zip = new ZipArchive;
            if ($zip->open($zip_file) === TRUE) {
                $zip->extractTo($wp_plugins_dir);
                $zip->close();
                echo "<span class='success'>WooCommerce extracted successfully.</span><br>";
            } else {
                echo "<span class='error'>Error: Could not extract WooCommerce zip.</span><br>";
            }
            @unlink($zip_file);
        } else {
            echo "<span class='error'>Error: Failed to download WooCommerce from WordPress.org.</span><br>";
        }
    }
    
    if (file_exists($wp_plugins_dir . '/woocommerce/woocommerce.php')) {
        activate_plugin('woocommerce/woocommerce.php');
        echo "<span class='success'>WooCommerce activated!</span><br>";
    }
} else {
    echo "<h2>1. WooCommerce status</h2>";
    echo "WooCommerce is already active.<br>";
}

// 2. Download and install ACF if not exists
if (!is_plugin_active('advanced-custom-fields/acf.php')) {
    echo "<h2>2. Installing Advanced Custom Fields (ACF)</h2>";
    $wp_plugins_dir = WP_PLUGIN_DIR;
    $zip_file = $wp_plugins_dir . '/acf.zip';
    
    if (!file_exists($wp_plugins_dir . '/advanced-custom-fields/acf.php')) {
        echo "Downloading ACF zip from WordPress.org...<br>";
        $ch = curl_init('https://downloads.wordpress.org/plugin/advanced-custom-fields.latest-stable.zip');
        $fp = fopen($zip_file, 'wb');
        curl_setopt($ch, CURLOPT_FILE, $fp);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        $download_success = curl_exec($ch);
        curl_close($ch);
        fclose($fp);
        
        if ($download_success) {
            echo "Extracting ACF zip...<br>";
            $zip = new ZipArchive;
            if ($zip->open($zip_file) === TRUE) {
                $zip->extractTo($wp_plugins_dir);
                $zip->close();
                echo "<span class='success'>ACF extracted successfully.</span><br>";
            } else {
                echo "<span class='error'>Error: Could not extract ACF zip.</span><br>";
            }
            @unlink($zip_file);
        } else {
            echo "<span class='error'>Error: Failed to download ACF from WordPress.org.</span><br>";
        }
    }
    
    if (file_exists($wp_plugins_dir . '/advanced-custom-fields/acf.php')) {
        activate_plugin('advanced-custom-fields/acf.php');
        echo "<span class='success'>ACF activated!</span><br>";
    }
} else {
    echo "<h2>2. ACF status</h2>";
    echo "Advanced Custom Fields (ACF) is already active.<br>";
}

// 3. Activate helper plugin
echo "<h2>3. Activating Staopstoelen Helper Plugin</h2>";
if (file_exists(WP_PLUGIN_DIR . '/staopstoelen-helper/staopstoelen-helper.php')) {
    if (!is_plugin_active('staopstoelen-helper/staopstoelen-helper.php')) {
        activate_plugin('staopstoelen-helper/staopstoelen-helper.php');
        echo "<span class='success'>Staopstoelen Helper plugin activated successfully!</span><br>";
    } else {
        echo "Staopstoelen Helper plugin is already active.<br>";
    }
} else {
    echo "<span class='error'>Error: Staopstoelen Helper plugin files not found. Upload them to wp-content/plugins/staopstoelen-helper/ first.</span><br>";
}

// 4. Activate theme
echo "<h2>4. Activating Custom Theme</h2>";
if (file_exists(get_theme_root() . '/staopstoelen-theme')) {
    switch_theme('staopstoelen-theme');
    echo "<span class='success'>Staopstoelen custom theme activated!</span><br>";
} else {
    echo "<span class='error'>Error: Custom theme folder not found in wp-content/themes/.</span><br>";
}

// 5. Update permalinks
echo "<h2>5. Configuring Permalinks</h2>";
global $wp_rewrite;
$wp_rewrite->set_permalink_structure('/%postname%/');
$wp_rewrite->flush_rules(true);
echo "<span class='success'>Permalinks updated to /%postname%/ (Post name).</span><br>";

// 6. Set front page to static 'Home'
echo "<h2>6. Creating and Configuring Home Page</h2>";
$home_page_title = 'Home';
$home_page = get_page_by_title($home_page_title);
if (!$home_page) {
    $home_page_id = wp_insert_post(array(
        'post_title'    => $home_page_title,
        'post_content'  => '',
        'post_status'   => 'publish',
        'post_type'     => 'page',
        'page_template' => 'template-home.php'
    ));
    echo "Created new Home page.<br>";
} else {
    $home_page_id = $home_page->ID;
    update_post_meta($home_page_id, '_wp_page_template', 'template-home.php');
    echo "Verified existing Home page template.<br>";
}
update_option('show_on_front', 'page');
update_option('page_on_front', $home_page_id);
echo "<span class='success'>Home page set as static front page.</span><br>";

// 7. Create other required pages with templates and prefilled Gutenberg blocks
echo "<h2>7. Creating/Verifying Page Structure with Gutenberg blocks</h2>";
$pages = array(
    'sta-op-stoelen' => array('title' => 'Sta-op Stoelen', 'template' => 'template-staopstoelen.php', 'content' => '<!-- wp:shortcode -->
[staopstoelen_catalog type="staop"]
<!-- /wp:shortcode -->
'),
    'senioren-stoelen' => array('title' => 'Senioren Stoelen', 'template' => 'template-seniorenstoelen.php', 'content' => '<!-- wp:shortcode -->
[staopstoelen_catalog type="relax"]
<!-- /wp:shortcode -->
'),
    'keuzehulp' => array('title' => 'Keuzehulp', 'template' => 'template-keuzehulp.php', 'content' => '<!-- wp:shortcode -->
[staopstoelen_wizard]
<!-- /wp:shortcode -->
'),
    'revisieproces' => array('title' => 'Revisieproces', 'template' => 'template-revisie.php', 'content' => '<!-- wp:shortcode -->
[staopstoelen_revisie_slider]
<!-- /wp:shortcode -->
'),
    'klantverhalen' => array('title' => 'Klantverhalen', 'template' => 'template-ervaringen.php', 'content' => '<!-- wp:html -->
<div class="testimonials-grid" style="margin-bottom: 50px;">
  <div class="testimonial-card">
    <div class="testimonial-body-wrapper">
      <div class="testimonial-content">
        <p class="testimonial-text">
          "Sinds ik mijn 3-motorige Fitform stoel van staopstoelen.nl heb, heb ik veel minder last van mijn onderrug. De service aan huis was fantastisch; de BewegingsTechnoloog heeft de stoel ter plekke exact op mijn maat ingesteld. Mijn kinderen waren blij dat het model zo mooi past in ons interieur."
        </p>
        <div class="testimonial-user">
          <div class="user-avatar">👵</div>
          <div>
            <div class="user-name">Mevrouw de Vries</div>
            <div class="user-location">Dordrecht</div>
          </div>
        </div>
      </div>
      <div class="polaroid-frame">
        <img src="https://staopstoelen.free.nf/wp/wp-content/uploads/2026/06/review_devries.jpg" alt="Foto van Mevrouw de Vries in haar Fitform stoel">
        <div class="polaroid-caption">Mevrouw de Vries</div>
      </div>
    </div>
  </div>

  <div class="testimonial-card">
    <div class="testimonial-body-wrapper">
      <div class="testimonial-content">
        <p class="testimonial-text">
          "Ik zocht een kwalitatieve stoel voor mijn vader die moeite had met opstaan. We wilden liever geen oubollig model. Het gereviseerde model dat we hier kochten ziet er werkelijk als nieuw uit en past uitstekend in zijn moderne huiskamer. Het revisieproces gaf ons direct veel vertrouwen."
        </p>
        <div class="testimonial-user">
          <div class="user-avatar">👨</div>
          <div>
            <div class="user-name">F. Hensen (zoon van)</div>
            <div class="user-location">Rotterdam</div>
          </div>
        </div>
      </div>
      <div class="polaroid-frame">
        <img src="https://staopstoelen.free.nf/wp/wp-content/uploads/2026/06/review_hensen.jpg" alt="Foto van de vader van heer Hensen in zijn Prominent stoel">
        <div class="polaroid-caption">Vader Hensen</div>
      </div>
    </div>
  </div>
</div>
<!-- /wp:html -->
'),
    'faq' => array('title' => 'FAQ', 'template' => 'template-faq.php', 'content' => '<!-- wp:heading {"level":3} -->
<h3>Veelgestelde Vragen (FAQ)</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Hier vindt u de antwoorden op de meest gestelde vragen over onze sta-op stoelen en dienstverlening. Staat uw vraag er niet tussen? Neem dan gerust contact met ons op!</p>
<!-- /wp:paragraph -->
'),
    'over-ons' => array('title' => 'Over Ons', 'template' => 'template-info.php', 'content' => '<!-- wp:paragraph -->
<p>Merkt u dat opstaan uit uw favoriete stoel steeds moeizamer gaat? Of krijgt u na verloop van tijd last van uw rug of benen? Bij <strong>staopstoelen.nl</strong> (onderdeel van Schipper Compact Wonen) begrijpen we dat een goede stoel niet alleen mooi moet zijn, maar uw lichaam vooral optimaal moet ondersteunen.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Als dé erkende <strong>zitspecialist</strong> van de regio Dordrecht en omstreken helpen we u graag uw mobiliteit en zelfstandigheid terug te krijgen. Met al bijna 30 jaar ervaring leveren we topkwaliteit zitcomfort aan particulieren, zorginstellingen en zorgverzekeraars.</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<div style="display: flex; gap: 32px; align-items: center; background-color: var(--color-cream-dark); padding: 32px; border-radius: var(--radius-lg); margin: 32px 0; flex-wrap: wrap;">
  <img src="https://staopstoelen.free.nf/wp/wp-content/uploads/2026/06/geert.jpg" alt="Geert - Bewegingstechnoloog bij staopstoelen.nl" style="width: 180px; height: 240px; object-fit: cover; border-radius: var(--radius-md); border: 3px solid var(--color-light); box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
  <div style="flex: 1; min-width: 280px;">
    <span class="section-tag" style="color: var(--color-terracotta); margin-bottom: 8px; font-size: 0.8rem; display: inline-block;">Onze Expert</span>
    <h3 style="color: var(--color-forest-dark); font-size: 1.5rem; margin: 0 0 4px 0; font-family: var(--font-heading);">Geert</h3>
    <p style="font-size: 0.95rem; font-weight: 600; color: var(--color-forest); margin-bottom: 12px;">Gediplomeerd Bewegingstechnoloog</p>
    <p style="font-size: 0.95rem; line-height: 1.7; color: var(--color-dark); margin: 0;">
      Geert is onze vaste bewegingstechnoloog en expert op het gebied van ergonomie en gezond zitten. Geen stoel verlaat onze showroom zonder dat deze door Geert tot op de centimeter nauwkeurig is ingesteld op uw ideale zithoogte, zitdiepte en armleggerhoogte. Zo bent u verzekerd van een stoel die als gegoten zit.
    </p>
  </div>
</div>
<!-- /wp:html -->

<!-- wp:heading {"level":3} -->
<h3>Waarom kiezen voor staopstoelen.nl?</h3>
<!-- /wp:heading -->

<!-- wp:list -->
<ul>
  <li><strong>Volledig Maatwerk:</strong> Elke stoel wordt door onze bewegingstechnoloog exact afgesteld op uw lichaamsmaten om uw rug en gewrichten optimaal te ontlasten.</li>
  <li><strong>Topmerken onder één dak:</strong> Wij zijn officieel dealer van gerenommeerde A-merken zoals <em>Fitform</em>, <em>Doge</em> en <em>Releazz</em>.</li>
  <li><strong>Zowel Nieuw als Occasions:</strong> Naast nieuwe modellen bieden wij een ruim, snel wisselend assortiment gereviseerde tweedehands stoelen aan voor elk budget.</li>
  <li><strong>Eigen Technische Dienst:</strong> Dankzij onze eigen werkplaats, servicewagen en vakkundige medewerkers kunnen we u altijd snel en adequaat helpen bij eventuele reparaties of aanpassingen.</li>
</ul>
<!-- /wp:list -->

<!-- wp:html -->
<div style="display: flex; gap: 32px; align-items: center; background-color: var(--color-cream-dark); padding: 32px; border-radius: var(--radius-lg); margin: 32px 0; flex-wrap: wrap;">
  <div style="flex: 1; min-width: 280px;">
    <span class="section-tag" style="color: var(--color-terracotta); margin-bottom: 8px; font-size: 0.8rem; display: inline-block;">Service Aan Huis</span>
    <h3 style="color: var(--color-forest-dark); font-size: 1.5rem; margin: 0 0 4px 0; font-family: var(--font-heading);">Thuisbezorging met onze bus</h3>
    <p style="font-size: 0.95rem; font-weight: 600; color: var(--color-forest); margin-bottom: 12px;">Gratis en vakkundig bij u thuis geleverd</p>
    <p style="font-size: 0.95rem; line-height: 1.7; color: var(--color-dark); margin: 0;">
      Wij bezorgen uw sta-op stoel netjes en gratis thuis met onze eigen bezorgbus. Onze bezorger stelt de stoel ter plekke direct op maat af en legt de werking rustig aan u uit. Bent u niet in de gelegenheid om onze winkel te bezoeken? Maak dan gebruik van onze passing aan huis: onze adviseur komt met een selectie stoelen bij u langs, zodat u in uw eigen vertrouwde huiskamer kunt proefzitten.
    </p>
  </div>
  <img src="https://staopstoelen.free.nf/wp/wp-content/uploads/2026/06/bezorging.jpg" alt="Thuisbezorging met onze bezorgbus - staopstoelen.nl" style="width: 240px; height: 180px; object-fit: cover; border-radius: var(--radius-md); border: 3px solid var(--color-light); box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
</div>
<!-- /wp:html -->
'),
    'afspraak-inplannen' => array('title' => 'Afspraak inplannen', 'template' => 'template-afspraak.php', 'content' => '<!-- wp:shortcode -->
[staopstoelen_scheduler]
<!-- /wp:shortcode -->
')
);

foreach ($pages as $slug => $data) {
    $page = get_page_by_path($slug);
    if (!$page) {
        wp_insert_post(array(
            'post_name'     => $slug,
            'post_title'    => $data['title'],
            'post_content'  => $data['content'],
            'post_status'   => 'publish',
            'post_type'     => 'page',
            'page_template' => $data['template']
        ));
        echo "Created page: <strong>{$data['title']}</strong> with Gutenberg content.<br>";
    } else {
        // Update content to support block editing
        wp_update_post(array(
            'ID'           => $page->ID,
            'post_content' => $data['content']
        ));
        update_post_meta($page->ID, '_wp_page_template', $data['template']);
        echo "Verified and updated page: <strong>{$data['title']}</strong> for block editing.<br>";
    }
}

echo "<h2>Setup Completed Successfully!</h2>";
echo "<p class='success'>WordPress is nu volledig geconfigureerd! Verwijder nu het bestand <code>setup_helper.php</code> via FTP van uw server om beveiligingsrisico's te vermijden.</p>";
echo "</body></html>";
?>
