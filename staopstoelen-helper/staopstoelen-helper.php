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

// 3. Shortcodes voor de website
function shortcode_staopstoelen_slideshow() {
    ob_start();
    ?>
    <div class="hero-image-container" id="heroImageContainer">
      <div class="hero-slideshow" id="heroSlideshow">
        <div class="hero-slide active">
          <img src="<?php echo get_theme_asset_url('chair_dordrecht_cozy.png'); ?>" alt="Sfeervol interieur met de comfortabele Sta-op Stoel Dordrecht">
          <div class="slide-caption">Sta-op Stoel Dordrecht</div>
        </div>
        <div class="hero-slide">
          <img src="<?php echo get_theme_asset_url('chair_zwijndrecht_cozy.png'); ?>" alt="Modern interieur met de draaibare Sta-op Stoel Zwijndrecht">
          <div class="slide-caption">Draaibare Sta-op Stoel Zwijndrecht</div>
        </div>
        <div class="hero-slide">
          <img src="<?php echo get_theme_asset_url('chair_rotterdam_cozy.png'); ?>" alt="Luxe lederen interieur met de Sta-op Stoel Rotterdam">
          <div class="slide-caption">Lederen Sta-op Stoel Rotterdam</div>
        </div>
        <div class="hero-slide">
          <img src="<?php echo get_theme_asset_url('chair_fitform_570_reco_cozy.png'); ?>" alt="Stijlvol interieur met de ergonomische Fitform 570 Vario">
          <div class="slide-caption">Fitform 570 Vario (Gereviseerd)</div>
        </div>
        <div class="hero-slide">
          <img src="<?php echo get_theme_asset_url('sta_opstoel_geerts_interior.png'); ?>" alt="Cozy huiskamer met de moderne Sta-op Stoel Geert">
          <div class="slide-caption">Sta-op Stoel Geert</div>
        </div>
        <div class="hero-slide">
          <img src="<?php echo get_theme_asset_url('chair_movie_cozy.png'); ?>" alt="Klassiek interieur met de comfortabele Senioren Stoel Movie">
          <div class="slide-caption">Senioren Stoel Movie</div>
        </div>
        <div class="hero-slide">
          <img src="<?php echo get_theme_asset_url('chair_alfred_cozy.png'); ?>" alt="Luxe lederen interieur met de moderne Sta-op Stoel Alfred">
          <div class="slide-caption">Lederen Sta-op Stoel Alfred</div>
        </div>
        <div class="hero-slide">
          <img src="<?php echo get_theme_asset_url('chair_athena_cozy.png'); ?>" alt="Warm interieur met de snoerloze Senioren Stoel Athena">
          <div class="slide-caption">Senioren Stoel Athena</div>
        </div>
        <div class="hero-slide">
          <img src="<?php echo get_theme_asset_url('chair_fiji_cozy.png'); ?>" alt="Modern interieur met de draaibare Sta-op Stoel Fiji">
          <div class="slide-caption">Draaibare Sta-op Stoel Fiji</div>
        </div>
        <div class="hero-slide">
          <img src="<?php echo get_theme_asset_url('chair_industro_cozy.png'); ?>" alt="Stoer industrieel interieur met de Sta-op Stoel Industro">
          <div class="slide-caption">Sta-op Stoel Industro</div>
        </div>
        <div class="hero-slide">
          <img src="<?php echo get_theme_asset_url('chair_bellino_cozy.png'); ?>" alt="Elegant interieur met de comfortabele Doge Bellino Royal">
          <div class="slide-caption">Doge Bellino Royal</div>
        </div>
        <div class="hero-slide">
          <img src="<?php echo get_theme_asset_url('chair_doge_modulair_cozy.png'); ?>" alt="Comfortabele zithoek met de Doge Modulair Zorgstoel">
          <div class="slide-caption">Doge Modulair Zorgstoel</div>
        </div>
      </div>
      <button class="slideshow-ctrl ctrl-prev" id="slideshowPrev" aria-label="Vorige afbeelding">&#10094;</button>
      <button class="slideshow-ctrl ctrl-next" id="slideshowNext" aria-label="Volgende afbeelding">&#10095;</button>
      <div class="slideshow-dots" id="slideshowDots">
        <span class="slide-dot active" data-slide="0"></span>
        <span class="slide-dot" data-slide="1"></span>
        <span class="slide-dot" data-slide="2"></span>
        <span class="slide-dot" data-slide="3"></span>
        <span class="slide-dot" data-slide="4"></span>
        <span class="slide-dot" data-slide="5"></span>
        <span class="slide-dot" data-slide="6"></span>
        <span class="slide-dot" data-slide="7"></span>
        <span class="slide-dot" data-slide="8"></span>
        <span class="slide-dot" data-slide="9"></span>
        <span class="slide-dot" data-slide="10"></span>
        <span class="slide-dot" data-slide="11"></span>
      </div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('staopstoelen_slideshow', 'shortcode_staopstoelen_slideshow');

function shortcode_staopstoelen_wizard() {
    ob_start();
    ?>
    <div class="wizard-container">
      <div class="wizard-progress">
        <div class="progress-bar" id="progressBar"></div>
        <div class="progress-steps">
          <div class="progress-step active">1</div>
          <div class="progress-step">2</div>
          <div class="progress-step">3</div>
          <div class="progress-step">4</div>
        </div>
      </div>
      
      <form id="wizardForm">
        <!-- Step 1: Height -->
        <div class="wizard-step active" id="step1">
          <h3 class="step-title">1. Wat is uw lichaamslengte?</h3>
          <div class="options-grid">
            <div class="option-card" id="cardHeightSmall">
              <input type="radio" name="height" value="small" id="heightSmall">
              <div class="card-icon">📏</div>
              <div class="card-label">Kleiner dan 1.65m</div>
              <div class="card-desc">Geschikt voor kleinere zithoogtes</div>
            </div>
            <div class="option-card selected" id="cardHeightMedium">
              <input type="radio" name="height" value="medium" id="heightMedium" checked>
              <div class="card-icon">📏</div>
              <div class="card-label">Tussen 1.65m en 1.85m</div>
              <div class="card-desc">Standaard gemiddelde pasvorm</div>
            </div>
            <div class="option-card" id="cardHeightLarge">
              <input type="radio" name="height" value="large" id="heightLarge">
              <div class="card-icon">📏</div>
              <div class="card-label">Groter dan 1.85m</div>
              <div class="card-desc">Geschikt voor langere rugleuning/zitdiepte</div>
            </div>
          </div>
        </div>

        <!-- Step 2: Physical Complaints -->
        <div class="wizard-step" id="step2">
          <h3 class="step-title">2. Heeft u specifieke lichamelijke klachten?</h3>
          <div class="options-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
            <div class="option-card" id="cardBack">
              <input type="checkbox" name="complaints" value="back" id="complaintBack">
              <div class="card-icon">🦴</div>
              <div class="card-label">Lage Rugpijn / Hernia</div>
              <div class="card-desc">Extra lendensteun gewenst</div>
            </div>
            <div class="option-card" id="cardNeck">
              <input type="checkbox" name="complaints" value="neck" id="complaintNeck">
              <div class="card-icon">🦴</div>
              <div class="card-label">Nek- & Schouderpijn</div>
              <div class="card-desc">Verstelbare topswing/hoofdsteun</div>
            </div>
            <div class="option-card" id="cardLegs">
              <input type="checkbox" name="complaints" value="legs" id="complaintLegs">
              <div class="card-icon">🦶</div>
              <div class="card-label">Vocht in de benen</div>
              <div class="card-desc">Hart-lig-stand / relaxstand nodig</div>
            </div>
          </div>
        </div>

        <!-- Step 3: Motors -->
        <div class="wizard-step" id="step3">
          <h3 class="step-title">3. Hoeveel motoren wenst u?</h3>
          <div class="options-grid">
            <div class="option-card selected" id="cardMotorsThree">
              <input type="radio" name="motors" value="3" id="motorsThree" checked>
              <div class="card-icon">⚡</div>
              <div class="card-label">3 Motoren (Aanbevolen)</div>
              <div class="card-desc">Rug- en voetensteun onafhankelijk + kantelen</div>
            </div>
            <div class="option-card" id="cardMotorsOne">
              <input type="radio" name="motors" value="1" id="motorsOne">
              <div class="card-icon">⚡</div>
              <div class="card-label">1 of 2 Motoren (Eenvoudig)</div>
              <div class="card-desc">Gecombineerde relaxbeweging</div>
            </div>
          </div>
          <div style="margin-top: 24px; text-align: center; font-size: 0.9rem; color: var(--color-gray);">
            <label style="cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
              <input type="checkbox" name="modern" value="true" id="styleModern"> Ik zoek een modern/draaibaar design met verborgen motor.
            </label>
          </div>
        </div>

        <!-- Step 4: Results -->
        <div class="wizard-step" id="step4">
          <h3 class="step-title">4. Uw Persoonlijke Zitadvies</h3>
          <div class="products-grid" id="wizardResults" style="margin-top: 24px;">
            <!-- Dynamic Results go here -->
          </div>
        </div>
      </form>
      
      <div class="wizard-navigation">
        <button type="button" class="btn btn-outline" id="btnWizardBack" style="display: none;">❮ Vorige</button>
        <button type="button" class="btn btn-secondary" id="btnWizardNext">Volgende Stap ❯</button>
        <button type="button" class="btn btn-primary" id="btnWizardReset" style="display: none;">Opnieuw Starten ↺</button>
      </div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('staopstoelen_wizard', 'shortcode_staopstoelen_wizard');

function shortcode_staopstoelen_revisie_slider() {
    ob_start();
    ?>
    <!-- Step Slideshow -->
    <div style="display: flex; gap: 32px; align-items: center; background-color: var(--color-cream-dark); padding: 32px; border-radius: var(--radius-lg); margin: 32px 0 50px 0; flex-wrap: wrap;">
      <div style="position: relative; width: 180px; height: 240px; flex-shrink: 0; margin: 0 auto;">
        <img id="revisieSlideImg" src="<?php echo get_theme_asset_url('revisie_stap3.jpg'); ?>" alt="Revisieproces stap 1" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-md); border: 3px solid var(--color-light); box-shadow: 0 4px 15px rgba(0,0,0,0.1); box-sizing: border-box; transition: opacity 0.2s ease;">
        <div style="position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 12px; background-color: rgba(0,0,0,0.65); padding: 6px 12px; border-radius: var(--radius-full); backdrop-filter: blur(4px); color: var(--color-light); font-size: 0.8rem; z-index: 10; user-select: none;">
          <button id="prevSlideBtn" style="color: white; font-weight: bold; padding: 0 4px; background: none; border: none; cursor: pointer; font-size: 0.9rem;">❮</button>
          <span id="revisieSlideCounter" style="font-weight: 600; min-width: 32px; text-align: center;">1 / 4</span>
          <button id="nextSlideBtn" style="color: white; font-weight: bold; padding: 0 4px; background: none; border: none; cursor: pointer; font-size: 0.9rem;">❯</button>
        </div>
      </div>
      <div style="flex: 1; min-width: 280px;">
        <span class="section-tag" style="color: var(--color-terracotta); margin-bottom: 8px; font-size: 0.8rem; display: inline-block;">Revisie in beeld</span>
        <h3 id="revisieSlideTitle" style="color: var(--color-forest-dark); font-size: 1.5rem; margin: 0 0 4px 0; font-family: var(--font-heading);">Stap 1: Volledig strippen van het frame</h3>
        <p id="revisieSlideSub" style="font-size: 0.95rem; font-weight: 600; color: var(--color-forest); margin-bottom: 12px;">Grondige reiniging en controle van mechaniek</p>
        <p id="revisieSlideDesc" style="font-size: 0.95rem; line-height: 1.7; color: var(--color-dark); margin: 0;">
          We strippen de stoel volledig tot op het metalen basisframe. De motoren, kabels en de elektronische besturing worden grondig gecontroleerd, gereinigd en getest. Eventuele versleten bedrading of zwakke componenten worden direct vervangen.
        </p>
      </div>
    </div>

    <!-- Before/After Slider -->
    <div style="margin-bottom: 50px;">
      <span class="section-tag" style="color: var(--color-terracotta); margin-bottom: 12px; font-size: 0.8rem; display: inline-block;">Vergelijk Oud & Nieuw</span>
      <h3 style="color: var(--color-forest-dark); font-size: 1.5rem; margin: 0 0 16px 0; font-family: var(--font-heading);">Interactieve Voor- en Na-vergelijking</h3>
      <p style="margin-bottom: 24px; color: var(--color-gray); font-size: 0.95rem; line-height: 1.6;">
        Versleep de hendel in het midden van de afbeelding om het verschil te zien tussen een gebruikte stoel en het volledig gereviseerde eindresultaat.
      </p>
      <div class="slider-wrapper" id="sliderWrapper">
        <div class="slider-img slider-before">
          <div class="slider-content-inner">
            <span class="slider-text-badge">Voor revisie (Oud model)</span>
          </div>
        </div>
        <div class="slider-img slider-after" id="sliderAfterImage">
          <div class="slider-content-inner">
            <span class="slider-text-badge">Na Revisie (Als Nieuw)</span>
          </div>
        </div>
        <div class="slider-handle" id="sliderHandle">
          <div class="slider-handle-button">↔</div>
        </div>
      </div>
    </div>

    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const slides = [
          {
            img: '<?php echo get_theme_asset_url("revisie_stap3.jpg"); ?>',
            title: 'Stap 1: Volledig strippen van het frame',
            sub: 'Grondige reiniging en controle van mechaniek',
            desc: 'We strippen de stoel volledig tot op het metalen basisframe. De motoren, kabels en de elektronische besturing worden grondig gecontroleerd, gereinigd en getest. Eventuele versleten bedrading of zwakke componenten worden direct vervangen.'
          },
          {
            img: '<?php echo get_theme_asset_url("revisie_stap2.jpg"); ?>',
            title: 'Stap 2: Nieuwe bekleding & Kussens',
            sub: 'Hernieuwde opbouw voor optimaal comfort',
            desc: 'De gedemonteerde armleuningen en zitkussens worden voorzien van nieuw, hoogwaardig koudschuim en volledig opnieuw bekleed. De stoel is na deze opbouw weer hygiënisch schoon en biedt het comfort van een splinternieuw exemplaar.'
          },
          {
            img: '<?php echo get_theme_asset_url("revisie_stap1.jpg"); ?>',
            title: 'Stap 3: Kwaliteitscontrole & Motor-tests',
            sub: 'Zware inspectie onder belasting',
            desc: 'Alle mechanische en elektrische functies van de stoel ondergaan een strenge testcyclus onder belasting. De motoren voor de rugleuning, voetensteun en liftfunctie worden gecontroleerd op stille en soepele werking.'
          },
          {
            img: '<?php echo get_theme_asset_url("revisie_stap4.jpg"); ?>',
            title: 'Stap 4: Het eindresultaat',
            sub: 'Als nieuw geleverd met garantie',
            desc: 'Het resultaat is een prachtige sta-op stoel die zowel optisch als technisch in absolute nieuwstaat verkeert. Volledig gedesinfecteerd, ergonomisch afgesteld en klaar om weer jarenlang comfortabel en veilig zitplezier te bieden.'
          }
        ];

        let currentSlide = 0;
        const slideImg = document.getElementById('revisieSlideImg');
        if (!slideImg) return;
        const slideCounter = document.getElementById('revisieSlideCounter');
        const slideTitle = document.getElementById('revisieSlideTitle');
        const slideSub = document.getElementById('revisieSlideSub');
        const slideDesc = document.getElementById('revisieSlideDesc');
        const prevBtn = document.getElementById('prevSlideBtn');
        const nextBtn = document.getElementById('nextSlideBtn');

        slideCounter.textContent = `${currentSlide + 1} / ${slides.length}`;

        function updateSlide(index) {
          slideImg.style.opacity = 0;
          setTimeout(() => {
            currentSlide = index;
            slideImg.src = slides[currentSlide].img;
            slideImg.alt = `Revisieproces stap ${currentSlide + 1}`;
            slideCounter.textContent = `${currentSlide + 1} / ${slides.length}`;
            slideTitle.textContent = slides[currentSlide].title;
            slideSub.textContent = slides[currentSlide].sub;
            slideDesc.textContent = slides[currentSlide].desc;
            slideImg.style.opacity = 1;
          }, 200);
        }

        prevBtn.addEventListener('click', () => {
          let index = currentSlide - 1;
          if (index < 0) index = slides.length - 1;
          updateSlide(index);
        });

        nextBtn.addEventListener('click', () => {
          let index = currentSlide + 1;
          if (index >= slides.length) index = 0;
          updateSlide(index);
        });
      });
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('staopstoelen_revisie_slider', 'shortcode_staopstoelen_revisie_slider');

function shortcode_staopstoelen_scheduler() {
    ob_start();
    ?>
    <div class="calendar-container" id="calendarContainer">
      <div class="calendar-sidebar">
        <h3 style="color: var(--color-forest); font-size: 1.15rem; margin-bottom: 16px;">Details van uw passing</h3>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; font-size: 0.85rem; font-weight: bold; margin-bottom: 8px; color: var(--color-gray);">1. Selecteer Type Afspraak</label>
          <div class="scheduler-type-select">
            <div class="scheduler-type-option selected" id="typeShowroom">
              <div class="icon">🛋️</div>
              <div>
                <strong>Showroom Dordrecht</strong>
                <span>Persoonlijk advies en proefzitten</span>
              </div>
            </div>
            <div class="scheduler-type-option" id="typeHome">
              <div class="icon">🚐</div>
              <div>
                <strong>Gratis Passing aan Huis</strong>
                <span>Wij nemen 3 stoelen mee naar u thuis</span>
              </div>
            </div>
          </div>
        </div>

        <div style="font-size: 0.9rem; color: var(--color-dark); background-color: var(--color-cream-dark); padding: 12px; border-radius: var(--radius-sm); margin-bottom: 16px; border-left: 4px solid var(--color-terracotta);">
          <span id="appointmentTypeDescription">U bent van harte welkom in onze gezellige showroom aan de Merwedestraat 239 in Dordrecht.</span>
        </div>
      </div>
      
      <div class="calendar-main">
        <div class="calendar-header-controls">
          <button type="button" class="btn-cal-nav" id="btnPrevMonth" aria-label="Vorige maand">&#10094;</button>
          <span class="calendar-month-year" id="calendarMonthYear">Maart 2026</span>
          <button type="button" class="btn-cal-nav" id="btnNextMonth" aria-label="Volgende maand">&#10095;</button>
        </div>
        
        <div class="calendar-days-header">
          <div>Ma</div><div>Di</div><div>Wo</div><div>Do</div><div>Vr</div><div>Za</div><div>Zo</div>
        </div>
        
        <div class="calendar-grid" id="calendarGrid">
          <!-- Calendar Days dynamically generated -->
        </div>
        
        <div class="time-slots-container" id="timeSlotsContainer" style="display: none;">
          <h4 style="margin-bottom: 12px; font-size: 0.95rem; color: var(--color-forest);">Selecteer een tijdstip voor <span id="selectedDateLabel">...</span></h4>
          <div class="time-slots-grid" id="timeSlotsGrid">
            <!-- Dynamic Slots -->
          </div>
        </div>
      </div>
    </div>

    <!-- Booking Confirmation Form -->
    <div class="booking-form-wrapper" id="bookingFormWrapper" style="display: none;">
      <h3 class="info-section-title" style="margin-top: 0; font-size: 1.5rem;">Afspraak gegevens afronden</h3>
      <p style="color: var(--color-gray); font-size: 0.9rem; margin-bottom: 24px;">Vul hieronder uw contactgegevens in om uw afspraak definitief in te plannen.</p>
      
      <form id="bookingForm" style="display: grid; gap: 20px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
          <div>
            <label class="form-label" for="bookingName">Naam *</label>
            <input class="form-input" type="text" id="bookingName" required placeholder="Bijv. Mevrouw de Vries">
          </div>
          <div>
            <label class="form-label" for="bookingPhone">Telefoonnummer *</label>
            <input class="form-input" type="tel" id="bookingPhone" required placeholder="Bijv. 06 - 1234 5678">
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
          <div>
            <label class="form-label" for="bookingEmail">E-mailadres *</label>
            <input class="form-input" type="email" id="bookingEmail" required placeholder="Bijv. info@voorbeeld.nl">
          </div>
          <div id="bookingPostcodeGroup" style="display: none; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label class="form-label" for="bookingPostcode">Postcode *</label>
              <input class="form-input" type="text" id="bookingPostcode" placeholder="Bijv. 3313 GT">
            </div>
            <div>
              <label class="form-label" for="bookingHouseNumber">Huisnummer *</label>
              <input class="form-input" type="text" id="bookingHouseNumber" placeholder="Bijv. 239">
            </div>
          </div>
        </div>
        
        <div id="bookingAddressDetailsGroup" style="display: none; grid-template-columns: 2fr 1fr; gap: 20px;">
          <div>
            <label class="form-label" for="bookingStreet">Straatnaam *</label>
            <input class="form-input" type="text" id="bookingStreet" placeholder="Wordt automatisch ingevuld">
          </div>
          <div>
            <label class="form-label" for="bookingCity">Woonplaats *</label>
            <input class="form-input" type="text" id="bookingCity" placeholder="Wordt automatisch ingevuld">
          </div>
        </div>
        
        <div>
          <label class="form-label" for="bookingNotes">Opmerkingen of voorkeursstoel (optioneel)</label>
          <textarea class="form-input" id="bookingNotes" rows="3" placeholder="Heeft u specifieke wensen of voorkeur voor een stoel? Laat het ons gerust weten."></textarea>
        </div>
        
        <div style="display: flex; gap: 16px; margin-top: 10px; justify-content: flex-end;">
          <button type="button" class="btn btn-outline" id="btnCancelBooking">Annuleren</button>
          <button type="submit" class="btn btn-primary" id="btnConfirmBooking">Afspraak Inplannen</button>
        </div>
      </form>
    </div>

    <!-- Success Modal/Screen -->
    <div class="booking-success-screen" id="bookingSuccessScreen" style="display: none;">
      <div class="success-icon">✓</div>
      <h3 style="font-size: 1.75rem; color: var(--color-forest-dark); margin-bottom: 8px;">Afspraak Succesvol Gepland!</h3>
      <p style="color: var(--color-forest); font-weight: 600; margin-bottom: 16px;" id="successSummary">We verwachten u op ... om ...</p>
      <p style="color: var(--color-gray); font-size: 0.95rem; max-width: 500px; margin: 0 auto 24px auto;">
        U ontvangt binnen enkele minuten een bevestiging per e-mail met alle details van de afspraak. We kijken uit naar uw komst!
      </p>
      <button type="button" class="btn btn-secondary" id="btnCloseSuccess">Sluiten</button>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('staopstoelen_scheduler', 'shortcode_staopstoelen_scheduler');

function shortcode_staopstoelen_catalog($atts) {
    $a = shortcode_atts(array(
        'type' => 'staop' // 'staop' or 'relax'
    ), $atts);
    
    $is_staop_checked = $a['type'] === 'staop' ? 'checked' : '';
    $is_relax_checked = $a['type'] === 'relax' ? 'checked' : '';
    
    ob_start();
    ?>
    <div class="catalog-layout">
      <!-- Sidebar filters -->
      <aside class="filter-sidebar">
        <div class="filter-group">
          <h3 class="filter-group-title">Sorteer Op</h3>
          <select class="sort-select" id="sortSelect">
            <option value="default">Standaard</option>
            <option value="price-asc">Prijs: Laag naar Hoog</option>
            <option value="price-desc">Prijs: Hoog naar Laag</option>
            <option value="type-relax">Type: Senioren Stoel eerst</option>
            <option value="type-staop">Type: Sta-op Stoel eerst</option>
            <option value="material-stof">Materiaal: Stof eerst</option>
            <option value="material-leer">Materiaal: Leer eerst</option>
          </select>
        </div>

        <div class="filter-group">
          <h3 class="filter-group-title">Type stoel</h3>
          <label class="checkbox-label">
            <input type="checkbox" class="type-filter" value="staop" <?php echo $is_staop_checked; ?>>
            <span>Sta-op Stoel</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" class="type-filter" value="relax" <?php echo $is_relax_checked; ?>>
            <span>Senioren Stoel</span>
          </label>
        </div>

        <div class="filter-group">
          <h3 class="filter-group-title">Conditie</h3>
          <label class="checkbox-label">
            <input type="checkbox" class="condition-filter" value="nieuw">
            <span>Nieuw</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" class="condition-filter" value="occasion">
            <span>Occasion</span>
          </label>
        </div>

        <div class="filter-group">
          <h3 class="filter-group-title">Materiaal</h3>
          <label class="checkbox-label">
            <input type="checkbox" class="material-filter" value="stof">
            <span>Stof</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" class="material-filter" value="leer">
            <span>Leer</span>
          </label>
        </div>

        <div class="filter-group" id="brandFilterGroup">
          <h3 class="filter-group-title">Merk</h3>
          <!-- Dynamisch ingeladen op basis van merken in de database -->
        </div>

        <div class="filter-group">
          <h3 class="filter-group-title">Prijsklasse</h3>
          <label class="checkbox-label">
            <input type="checkbox" class="price-filter" value="under-1500">
            <span>Onder € 1.500</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" class="price-filter" value="1500-2500">
            <span>€ 1.500 - € 2.500</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" class="price-filter" value="over-2500">
            <span>Boven € 2.500</span>
          </label>
        </div>

        <div class="filter-group" style="border-bottom:none; padding-bottom:0;">
          <div style="background-color: var(--color-sage-light); padding:16px; border-radius:var(--radius-sm); font-size:0.95rem; line-height:1.6; color:var(--color-dark);">
            <strong>🌿 Optimaal op maat:</strong> Al onze sta-op stoelen (nieuw, gebruikt én geconditioneerd) worden door onze BewegingsTechnologen exact ingesteld op uw lichaamsmaten voor optimaal comfort.
          </div>
        </div>
      </aside>

      <!-- Product Grid -->
      <main>
        <div class="catalog-grid" id="catalogGrid">
          <!-- Rendered dynamically via JavaScript -->
        </div>
      </main>
    </div>

    <!-- Product Details Modal -->
    <?php
/* Template Name: Catalogus Sta-op Stoelen */
?>
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sta-op Stoelen | Nieuw, Gebruikt & Gereviseerd</title>
  <meta name="description" content="Vind een goedkope sta-op stoel die past bij uw budget. Ruime voorraad nieuwe, gebruikte en gereconditioneerde sta-op stoelen van topmerken met garantie.">
  <link rel="apple-touch-icon" sizes="180x180" href="<?php echo get_stylesheet_directory_uri(); ?>/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="<?php echo get_stylesheet_directory_uri(); ?>/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="<?php echo get_stylesheet_directory_uri(); ?>/favicon-16x16.png">
  <link rel="manifest" href="<?php echo get_stylesheet_directory_uri(); ?>/site.webmanifest">
  <link rel="stylesheet" href="<?php echo get_stylesheet_directory_uri(); ?>/style.css?v=1.0.51">
  <style>

    .catalog-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 32px;
      margin-top: 40px;
    }
    @media (min-width: 992px) {
      .catalog-layout {
        grid-template-columns: 260px 1fr;
      }
    }
    .filter-sidebar {
      background-color: var(--color-light);
      border: 1px solid var(--color-gray-light);
      border-radius: var(--radius-md);
      padding: 24px;
      height: fit-content;
    }
    @media (min-width: 992px) {
      .filter-sidebar {
        position: sticky;
        top: 130px;
      }
    }
    .filter-group {
      margin-bottom: 24px;
      border-bottom: 1px solid var(--color-gray-light);
      padding-bottom: 20px;
    }
    .filter-group:last-child {
      margin-bottom: 0;
      border-bottom: none;
      padding-bottom: 0;
    }
    .filter-group-title {
      font-weight: 700;
      font-size: 1rem;
      margin-bottom: 12px;
      color: var(--color-forest);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.95rem;
      margin-bottom: 10px;
      cursor: pointer;
    }
    .checkbox-label input {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
    .sort-select {
      width: 100%;
      padding: 10px;
      border-radius: var(--radius-sm);
      border: 2px solid var(--color-gray-light);
      font-family: var(--font-body);
      font-size: 0.95rem;
      background-color: var(--color-light);
    }
    .catalog-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }
    @media (min-width: 600px) {
      .catalog-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (min-width: 1200px) {
      .catalog-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    .badge-reco {
      background-color: var(--color-sage);
    }
    .badge-new {
      background-color: var(--color-terracotta);
    }
  </style>
</head>
<body>

  <!-- Floating Contact Menu -->
  <div class="floating-contact-wrapper" id="floatingContactWrapper">
    <div class="floating-menu" id="floatingMenu">
      <a href="https://wa.me/31622232964" target="_blank" class="floating-menu-item floating-whatsapp" id="btnWhatsapp">
        <div>
          <span class="floating-menu-item-text">WhatsApp ons</span>
          <span class="floating-menu-item-desc">Direct antwoord</span>
        </div>
        <div class="icon">
          <svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      </a>
      <a href="tel:+31786314858" class="floating-menu-item floating-phone" id="btnPhone">
        <div>
          <span class="floating-menu-item-text">Bellen</span>
          <span class="floating-menu-item-desc">Spreek een BewegingsTechnoloog</span>
        </div>
        <div class="icon">
          <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      </a>
      <a href="<?php echo home_url('/afspraak-inplannen/'); ?>" class="floating-menu-item floating-chat" id="btnCalendarLink">
        <div>
          <span class="floating-menu-item-text">Plan Adviesgesprek</span>
          <span class="floating-menu-item-desc">Thuis of in showroom</span>
        </div>
        <div class="icon">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="16" y1="2" x2="16" y2="6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="8" y1="2" x2="8" y2="6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="3" y1="10" x2="21" y2="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      </a>
    </div>
    <button class="floating-btn floating-btn-main" id="btnFloatingMain" aria-label="Open contactopties">
      <svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </div>

  <!-- Navigation Bar -->
  <header class="navbar">
    <div class="container navbar-container">
      <!-- Beautiful Overlapping Liquid Waves behind the logo -->
      <svg class="logo-swoosh" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 200" preserveAspectRatio="none">
        <!-- Wave 1: Sky Blue -->
        <path d="M 0,90 Q 250,160 500,100 T 1000,110" fill="none" stroke="var(--color-sky)" stroke-width="8" stroke-linecap="round" opacity="0.6"></path>
        <!-- Wave 2: Terracotta Orange -->
        <path d="M 0,110 Q 250,70 500,120 T 1000,130" fill="none" stroke="var(--color-terracotta)" stroke-width="6" stroke-linecap="round" opacity="0.75"></path>
        <!-- Wave 3: Sage Green -->
        <path d="M 0,125 Q 250,170 500,115 T 1000,140" fill="none" stroke="var(--color-sage)" stroke-width="7" stroke-linecap="round" opacity="0.8"></path>
        <!-- Wave 4: Forest Green -->
        <path d="M 0,140 Q 250,100 500,145 T 1000,150" fill="none" stroke="var(--color-forest)" stroke-width="10" stroke-linecap="round" opacity="0.95"></path>
      </svg>
            <a href="<?php echo home_url('/'); ?>" class="nav-text-logo" id="navTextLogo">staopstoelen<span>.nl</span></a>
      <div class="navbar-top-right" id="navbarTopRight">
        <a href="tel:+31786314858" class="nav-top-contact-link">
          <svg style="width: 15px; height: 15px; stroke: var(--color-terracotta); fill: none;" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          078 - 631 4858
        </a>
        <a href="mailto:info@schippercompactwonen.nl" class="nav-top-contact-link">
          <svg style="width: 15px; height: 15px; stroke: var(--color-terracotta); fill: none;" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          info@schippercompactwonen.nl
        </a>
        <a href="<?php echo home_url('/afspraak-inplannen/'); ?>" class="btn btn-primary btn-nav-appointment" id="btnNavAppointment">Maak een afspraak</a>
      </div>
      <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <div class="navbar-row-2">
                        <nav class="nav-links" id="navLinks">
          <a href="<?php echo home_url('/sta-op-stoelen/'); ?>" class="active" id="linkGoedkopeStaopstoelen">Sta-op Stoelen</a>
          <a href="<?php echo home_url('/senioren-stoelen/'); ?>" id="linkSeniorenstoelen">Senioren Stoelen</a>
          <a href="<?php echo home_url('/keuzehulp/'); ?>" id="linkKeuzehulp">Keuzehulp</a>
          <a href="<?php echo home_url('/revisieproces/'); ?>" id="linkRevisie">Revisieproces</a>
          <a href="<?php echo home_url('/klantverhalen/'); ?>" id="linkKlantverhalen">Ervaringen</a>
          <a href="<?php echo home_url('/faq/'); ?>" id="linkFaq">FAQ</a>
          <a href="<?php echo home_url('/over-ons/'); ?>" id="linkOverOns">Over Ons</a>
          <a href="<?php echo home_url('/afspraak-inplannen/'); ?>" class="nav-desktop-hide" id="linkAfspraak">Afspraak Maken</a>
        </nav>
        
      </div>
    </div>
  </header>

  <!-- Header -->
  <section class="occasions-header" style="text-align: left;">
    <div class="container banner-flex-container" style="justify-content: flex-start; align-items: flex-start;">
      <div style="text-align: left; max-width: 600px; flex: 1; min-width: 280px;">
        <span class="section-tag" style="color: var(--color-terracotta);">Voor Elk Budget</span>
        <h1 style="color: var(--color-light); margin: 4px 0 8px 0; font-size: 2.5rem;">Sta-op Stoelen</h1>
        <p style="margin: 0; color: rgba(255, 255, 255, 0.85); font-size: 1.1rem;">Een oplossing op maat voor elk budget. Ontdek onze nieuwe, gebruikte en geconditioneerde sta-op stoelen.</p>
      </div>
    </div>
  </section>

  <!-- Catalog Section -->
  <section class="subpage-section">
    <div class="container">
      <a href="<?php echo home_url('/'); ?>" class="back-link">← Terug naar Home</a>

      <h2 class="section-title" style="margin-top: 20px; margin-bottom: 30px; font-size: 1.85rem; border-bottom: 2px solid var(--color-sage); padding-bottom: 8px;">Sta-op Stoelen</h2>

      <div class="catalog-layout">
        <!-- Sidebar filters -->
        <aside class="filter-sidebar">
          <div class="filter-group">
            <h3 class="filter-group-title">Sorteer Op</h3>
            <select class="sort-select" id="sortSelect">
              <option value="default">Standaard</option>
              <option value="price-asc">Prijs: Laag naar Hoog</option>
              <option value="price-desc">Prijs: Hoog naar Laag</option>
              <option value="type-relax">Type: Senioren Stoel eerst</option>
              <option value="type-staop">Type: Sta-op Stoel eerst</option>
              <option value="material-stof">Materiaal: Stof eerst</option>
              <option value="material-leer">Materiaal: Leer eerst</option>
            </select>
          </div>

          <div class="filter-group">
            <h3 class="filter-group-title">Type stoel</h3>
            <label class="checkbox-label">
              <input type="checkbox" class="type-filter" value="staop" checked>
              <span>Sta-op Stoel</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" class="type-filter" value="relax">
              <span>Senioren Stoel</span>
            </label>
          </div>

          <div class="filter-group">
            <h3 class="filter-group-title">Conditie</h3>
            <label class="checkbox-label">
              <input type="checkbox" class="condition-filter" value="nieuw">
              <span>Nieuw</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" class="condition-filter" value="occasion">
              <span>Occasion</span>
            </label>
          </div>

          <div class="filter-group">
            <h3 class="filter-group-title">Materiaal</h3>
            <label class="checkbox-label">
              <input type="checkbox" class="material-filter" value="stof">
              <span>Stof</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" class="material-filter" value="leer">
              <span>Leer</span>
            </label>
          </div>

          <div class="filter-group" id="brandFilterGroup">
            <h3 class="filter-group-title">Merk</h3>
            <!-- Dynamisch ingeladen op basis van merken in de database -->
          </div>

          <div class="filter-group">
            <h3 class="filter-group-title">Prijsklasse</h3>
            <label class="checkbox-label">
              <input type="checkbox" class="price-filter" value="under-1500">
              <span>Onder € 1.500</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" class="price-filter" value="1500-2500">
              <span>€ 1.500 - € 2.500</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" class="price-filter" value="over-2500">
              <span>Boven € 2.500</span>
            </label>
          </div>

          <div class="filter-group" style="border-bottom:none; padding-bottom:0;">
            <div style="background-color: var(--color-sage-light); padding:16px; border-radius:var(--radius-sm); font-size:0.95rem; line-height:1.6; color:var(--color-dark);">
              <strong>🌿 Optimaal op maat:</strong> Al onze sta-op stoelen (nieuw, gebruikt én geconditioneerd) worden door onze BewegingsTechnologen exact ingesteld op uw lichaamsmaten voor optimaal comfort.
            </div>
          </div>
        </aside>

        <!-- Product Grid -->
        <main>
          <div class="catalog-grid" id="catalogGrid">
            <!-- Rendered dynamically via JavaScript -->
          </div>
        </main>
      </div>
    </div>
  </section>

  <!-- Footer Section -->
  <footer>
    <div class="container footer-grid">
      <div class="footer-col">
        <h3 style="color: var(--color-light);">staopstoelen.nl</h3>
        <p style="font-size: 0.9rem; color: rgba(255,255,255,0.6); margin-top: 16px; line-height: 1.6;">
          Specialist in premium gereviseerde A-merk sta-op stoelen en ergonomische senioren stoelen op maat. Duurzaam, comfortabel en betaalbaar.
        </p>
      </div>
      <div class="footer-col">
        <h3>Snelle Links</h3>
        <ul style="margin-top: 16px;">
          <li><a href="<?php echo home_url('/sta-op-stoelen/'); ?>">Sta-op Stoelen</a></li>
          <li><a href="<?php echo home_url('/senioren-stoelen/'); ?>">Senioren Stoelen</a></li>
          <li><a href="<?php echo home_url('/keuzehulp/'); ?>">Keuzehulp Wizard</a></li>
          <li><a href="<?php echo home_url('/revisieproces/'); ?>">Revisieproces</a></li>
          <li><a href="<?php echo home_url('/klantverhalen/'); ?>">Klantverhalen</a></li>
          <li><a href="<?php echo home_url('/faq/'); ?>">Veelgestelde vragen (FAQ)</a></li>
          <li><a href="<?php echo home_url('/afspraak-inplannen/'); ?>">Afspraak Inplannen</a></li>
          <li><a href="<?php echo home_url('/over-ons/'); ?>">Over Ons</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h3>Contact & Showroom</h3>
        <p style="font-size: 0.9rem; color: rgba(255,255,255,0.6); margin-top: 16px; line-height: 1.6;">
          <strong>Showroom Dordrecht:</strong><br>
          Merwedestraat 239<br>
          3313 GT Dordrecht<br>
          <span style="display: block; margin-top: 8px; margin-bottom: 12px;">
            <a href="tel:+31786314858" style="color: inherit; text-decoration: none; display: inline-flex; align-items: center; margin-bottom: 6px;">
              <svg class="contact-icon" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              078 - 631 4858
            </a><br>
            <a href="mailto:info@schippercompactwonen.nl" style="color: inherit; text-decoration: none; display: inline-flex; align-items: center;">
              <svg class="contact-icon" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="22,6 12,13 2,6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              info@schippercompactwonen.nl
            </a>
          </span>
          <strong>Openingstijden:</strong><br>
          Maandag: Op afspraak<br>
          Dinsdag t/m Vrijdag: 10:00 - 16:00<br>
          Zaterdag: Op afspraak<br>
          <br>
          <span style="display: block; line-height: 1.4; font-weight: bold;">
            Buiten onze openingstijden ontvangen óf bezoeken we u graag op afspraak.
          </span>
        </p>
      </div>
    </div>
    <div class="container footer-bottom">
      <div class="footer-copyright">
        &copy; 2026 staopstoelen.nl. Alle rechten voorbehouden.
      </div>
      <div style="font-size: 0.875rem; color: rgba(255,255,255,0.5);">
        Gerealiseerd door BewegingsTechnologen. | Versie 110
      </div>
    </div>
  </footer>

  <!-- Product Details Modal -->
  <div class="modal-overlay" id="productModal" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
    <div class="modal-card">
      <button class="modal-close" id="modalClose" aria-label="Sluit pop-up">&times;</button>
      <div class="modal-content-grid">
        <div class="modal-image-section">
          <div class="modal-image-wrapper" id="modalImageWrapper" style="position: relative;">
            <img id="modalProductImage" src="" alt="" style="opacity: 1;">
            <img id="modalProductStamp" src="<?php echo get_theme_asset_url('revisie_stempel_clean.svg'); ?>?v=1.0.48" alt="Gereviseerd" class="quality-stamp" style="display: none;">
            <div id="modalProductStatusLabel" class="product-status-label" style="display: none;"></div>
          </div>
          <!-- Gallery tabs if images exist -->
          <div class="modal-gallery-tabs" id="modalGalleryTabs" style="display: none;">
            <button type="button" class="gallery-tab active" id="tabDown">Zitstand</button>
            <button type="button" class="gallery-tab" id="tabUp" style="display: none;">Sta-opstand</button>
            <button type="button" class="gallery-tab" id="tabLie" style="display: none;">Ligstand</button>
            <button type="button" class="gallery-tab" id="tabAmbient" style="display: none;">In Interieur</button>
          </div>
        </div>
        <div class="modal-info-section">
          <span class="badge" id="modalBadge"></span>
          <h2 class="modal-title" id="modalTitle"></h2>
          <span class="modal-brand" id="modalBrand"></span>
          <p class="modal-description" id="modalDescription"></p>
          
          <div class="modal-price-box">
            <span class="price-label">Prijs vanaf</span>
            <span class="price-value" id="modalPrice"></span>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-primary" id="modalBookBtn" style="width: 100%;">
              Vrijblijvend Thuis Testen
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

    <script>
      // Scraped cheap lift chairs dataset with ambient images in home environment settings
    let storedStaopData = null; try { storedStaopData = JSON.parse(localStorage.getItem("admin_staopstoelen")); } catch(e){}
    let GOEDKOPE_STAOPSTOELEN_DATA = (storedStaopData && storedStaopData.length > 0) ? storedStaopData : [
  {
    "id": "sta-op-stoel-dordrecht",
    "name": "Sta-op stoel Dordrecht",
    "image": "assets/chair_sta-op-stoel-dordrecht-1.png",
    "ambientImage": "assets/chair_dordrecht_cozy.png",
    "price": 700,
    "brand": "Overig",
    "description": "De sta-op stoel Dordrecht is een sta-op / relax fauteuil welke zeer eenvoudig te bedienen is. Dit komt doordat er maar 2 knopjes op de handbediening zitten. De stoel is bekleed met een prachtige antraciet luxe microvezel stof welke zeer sterk en eenvoudig te reinigen is.",
    "badge": "Budget Vriendelijk",
    "badgeType": "new",
    "condition": "nieuw",
    "type": "staop",
    "material": "stof",
    "model": "Dordrecht",
    "status": "beschikbaar"
  },
  {
    "id": "senioren-sta-op-stoel-hk-dordt",
    "name": "Senioren sta-op stoel HK Dordt",
    "brand": "Hjort Knudsen",
    "model": "Senioren HK Dordt",
    "price": 995,
    "image": "assets/chair_senioren-sta-op-stoel-hk-dordt-1-300x300.png",
    "condition": "occasion",
    "type": "relax",
    "material": "stof",
    "description": "De Senioren sta-op stoel HK Dordt is een zeer comfortabele fauteuil met sta-op verstelling en verstelbare rugleuning. Eenvoudig te bedienen via een kleine handbediening aan de zijkant.",
    "ambientImage": "assets/chair_hk_dordt_cozy.png",
    "badge": "Hoge Kwaliteit",
    "badgeType": "reco",
    "status": "beschikbaar"
  },
  {
    "id": "senioren-sta-op-stoel-mecam-athena",
    "name": "Senioren sta-op stoel Mecam Athena",
    "image": "assets/chair_sta-op-stoel-mecam-athena-1-300x300.png",
    "ambientImage": "assets/chair_athena_cozy.png",
    "price": 1045,
    "brand": "Mecam",
    "description": "Uniek in zijn soort: een sta-op stoel zonder motoren! Er zitten geen accu's in en er hoeft geen stekker in het stopcontact om gebruik te maken van de soepele, mechanische sta-op ondersteuning.",
    "badge": "Geen Snoeren",
    "badgeType": "new",
    "condition": "nieuw",
    "type": "relax",
    "material": "stof",
    "model": "Senioren Athena",
    "status": "beschikbaar"
  },
  {
    "id": "sta-op-stoel-draaibaar-zwijndrecht",
    "name": "Sta-op stoel draaibaar Zwijndrecht",
    "image": "assets/chair_sta-op-stoel-zwijndrecht-1-e1772115887824.png",
    "ambientImage": "assets/chair_zwijndrecht_cozy.png",
    "price": 1350,
    "brand": "Overig",
    "description": "Voorzien van een 2-motorig elektrisch relaxsysteem en sta-op hulp. Deze draaibare sta-op stoel is van alle gemakken voorzien en heeft door het houten draaiplateau een klassieke maar toch moderne uitstraling.",
    "badge": "Modern & Draaibaar",
    "badgeType": "new",
    "condition": "nieuw",
    "type": "staop",
    "material": "stof",
    "model": "Zwijndrecht",
    "status": "beschikbaar"
  },
  {
    "id": "sta-op-stoel-draaibaar-sliedrecht",
    "name": "Sta-op stoel draaibaar Sliedrecht",
    "image": "assets/chair_sta-op-stoel-draaibaar-sliedrecht-1.png",
    "ambientImage": "assets/chair_sliedrecht_cozy.png",
    "price": 1395,
    "brand": "Overig",
    "description": "Voorzien van een 2-motorig elektrisch relaxsysteem en sta-op hulp. Deze draaibare sta-op stoel voorziet in alle gemakken. Door de geborstelde stalen voet heeft hij een strakke, moderne uitstraling.",
    "badge": "Luxe Uitstraling",
    "badgeType": "new",
    "condition": "nieuw",
    "type": "staop",
    "material": "stof",
    "model": "Sliedrecht",
    "status": "beschikbaar"
  },
  {
    "id": "sta-op-stoel-rotterdam",
    "name": "Sta-op stoel Rotterdam",
    "image": "assets/chair_staop-stoel-rotterdam-1-min-scaled.png",
    "ambientImage": "assets/chair_rotterdam_cozy.png",
    "price": 1485,
    "brand": "Overig",
    "description": "Prachtige 4-motorige relax fauteuil met sta-op verstelling. Elegant, klassiek en luxe. Geheel in leer bekleed met 4 afzonderlijke motoren voor onafhankelijke afstelling.",
    "badge": "4-Motorig Leder",
    "badgeType": "new",
    "condition": "nieuw",
    "type": "staop",
    "material": "leer",
    "model": "Rotterdam",
    "status": "beschikbaar"
  },
  {
    "id": "sta-op-stoel-ridderkerk",
    "name": "Sta-op stoel Ridderkerk",
    "image": "assets/chair_sta-op-stoel-hk-ridderkerk-1-scaled.png",
    "ambientImage": "assets/chair_ridderkerk_cozy.png",
    "price": 1495,
    "brand": "Overig",
    "description": "Heerlijke 2-motorige relax fauteuil met sta-op verstelling. De Ridderkerk is elektrisch verstelbaar en voorzien van een fijne relaxfunctie waarmee u comfortabel zit met de benen omhoog.",
    "badge": "2 Motoren",
    "badgeType": "new",
    "condition": "nieuw",
    "type": "staop",
    "material": "stof",
    "model": "Ridderkerk",
    "status": "beschikbaar"
  },
  {
    "id": "sta-op-stoel-fitform-570-vario-reco",
    "name": "Sta-op stoel Fitform 570 Vario RECO",
    "image": "assets/chair_fitform-570-vario-sta-op-stoel-gereconditioneerd-1-300x300.png",
    "ambientImage": "assets/chair_fitform_570_reco_cozy.png",
    "price": 1500,
    "brand": "Fitform",
    "description": "Volledig gereconditioneerd Fitform-model. Gebouwd op een gereviseerd frame, voorzien van een nieuwe handbediening en compleet nieuwe bekleding in stof/leder naar keuze.",
    "badge": "Gereconditioneerd",
    "badgeType": "reco",
    "condition": "occasion",
    "type": "staop",
    "material": "stof",
    "model": "570 Vario RECO",
    "status": "beschikbaar"
  },
  {
    "id": "sta-op-stoel-geert",
    "name": "Sta-op Stoel Geert",
    "brand": "Huismerk",
    "price": 1550,
    "image": "assets/orange_chair_downstand.png",
    "condition": "occasion",
    "type": "staop",
    "description": "De Sta-op Stoel Geerts is een modern vormgegeven sta-op fauteuil bekleed met een trendy en uiterst comfortabele oranje structuurstof. Perfect instelbaar voor een actieve zit, heerlijke relaxstand en moeiteloos opstaan.",
    "imageUp": "assets/orange_chair_upstand.jpg",
    "ambientImage": "assets/sta_opstoel_geerts_interior.png",
    "badge": "Oranje Editie",
    "badgeType": "reco",
    "material": "stof",
    "model": "Geert",
    "status": "gereserveerd"
  },
  {
    "id": "sta-op-stoel-barendrecht",
    "name": "Sta-op stoel Barendrecht",
    "image": "assets/chair_sta-op-stoel-barendrecht-1-min-scaled-e1760613493995.png",
    "ambientImage": "assets/chair_barendrecht_cozy.png",
    "price": 1565,
    "brand": "Overig",
    "description": "Heerlijke 2-motorige relax fauteuil met sta-op verstelling en standaard ingebouwde accu! Geen kabels over de vloer, waardoor u de stoel vrij in de kamer kunt plaatsen.",
    "badge": "Ingebouwde Accu",
    "badgeType": "new",
    "condition": "nieuw",
    "type": "staop",
    "material": "stof",
    "model": "Barendrecht",
    "status": "beschikbaar"
  },
  {
    "id": "sta-op-stoel-alfred",
    "name": "Sta-op stoel ALFRED",
    "image": "assets/chair_sta-op-stoel-alfred-1-scaled.png",
    "ambientImage": "assets/chair_alfred_cozy.png",
    "price": 1775,
    "brand": "Overig",
    "description": "Prachtige 2-motorige relax fauteuil met sta-op verstelling. Geheel in soepel leder bekleed, met een verborgen voetenbank die onder de stoel wegdraait.",
    "badge": "Luxe Leder",
    "badgeType": "new",
    "condition": "nieuw",
    "type": "staop",
    "material": "leer",
    "model": "ALFRED",
    "status": "beschikbaar"
  },
  {
    "id": "sta-op-stoel-mecam-movie",
    "name": "Sta-op stoel Mecam Movie",
    "brand": "Mecam",
    "model": "Movie",
    "price": 1925,
    "image": "assets/grey_chair_downstand.png",
    "condition": "occasion",
    "status": "beschikbaar",
    "type": "staop",
    "material": "stof",
    "description": "Klassieke en degelijke uitstraling van Mecam. De fauteuil is in verschillende maatvoeringen te leveren, biedt heerlijk zitcomfort en is leverbaar in vele stoffen en leersoorten.",
    "imageUp": "assets/chair_sta-op-stoel-mecam-movie-4-300x300.png",
    "ambientImage": "assets/chair_movie_cozy.png",
    "badge": "Klassiek Comfort",
    "badgeType": "reco"
  },
  {
    "id": "sta-op-stoel-ravi",
    "name": "Sta-op stoel Ravi",
    "image": "assets/chair_sta-op-stoel-ravi-1-kopie-300x300.png",
    "ambientImage": "assets/chair_ravi_cozy.png",
    "price": 1945,
    "brand": "Overig",
    "description": "Elegante, draaibare relaxfauteuil met sta-op hulp. Verkrijgbaar in 3 verschillende maten (s/m/l) voor een perfecte ergonomische match.",
    "badge": "Draaibaar Model",
    "badgeType": "new",
    "condition": "nieuw",
    "type": "staop",
    "material": "stof",
    "model": "Ravi",
    "status": "beschikbaar"
  },
  {
    "id": "sta-op-stoel-dfm-bentley-dicht",
    "name": "Bentley (dicht)",
    "brand": "DFM",
    "model": "Bentley (dicht)",
    "price": 1945,
    "image": "assets/chair_sta-op-stoel-dfm-bentley-dicht-1-copy-300x300.png",
    "condition": "nieuw",
    "type": "staop",
    "material": "stof",
    "description": "Functionele vormgeving in combinatie met ultiem zitcomfort. Volledig naar wens samen te stellen qua kleur en materialen. Stof en leder zijn zelfs te combineren.",
    "ambientImage": "assets/chair_bentley_dicht_cozy.png",
    "badge": "Luxe Design",
    "badgeType": "reco",
    "status": "beschikbaar"
  },
  {
    "id": "sta-op-stoel-dfm-bentley-open",
    "name": "Sta-op stoel DFM Bentley (open)",
    "brand": "DFM",
    "model": "DFM Bentley (open)",
    "price": 1945,
    "image": "assets/chair_sta-op-stoel-dfm-bentley-open-1-copy-300x300.png",
    "condition": "occasion",
    "type": "staop",
    "material": "stof",
    "description": "Bentley model getoond in geopende relaxstand met de voetensteun omhoog geklapt voor optimale ondersteuning van uw benen.",
    "ambientImage": "assets/chair_bentley_open_cozy.png",
    "badge": "Optimale Relaxstand",
    "badgeType": "reco",
    "status": "beschikbaar"
  },
  {
    "id": "sta-op-stoel-mecam-barney",
    "name": "Sta-op stoel Mecam Barney",
    "image": "assets/chair_sta-op-stoel-draaibaar-barney-1-300x300.png",
    "ambientImage": "assets/chair_barney_cozy.png",
    "price": 2045,
    "brand": "Mecam",
    "description": "Elegante draaibare fauteuil. De 2 motoren zijn bijna onzichtbaar onder de fauteuil weggewerkt. Voorzien van een automatische beveiliging in de draaivoet.",
    "badge": "Slimme Draaivoet",
    "badgeType": "new",
    "condition": "nieuw",
    "type": "staop",
    "material": "stof",
    "model": "Barney",
    "status": "beschikbaar"
  },
  {
    "id": "sta-op-stoel-mecam-degas",
    "name": "Sta-op stoel Mecam Degas",
    "image": "assets/chair_sta-op-stoel-mecam-degas-1-300x300.png",
    "ambientImage": "assets/chair_degas_cozy.png",
    "price": 2155,
    "brand": "Mecam",
    "description": "Huiselijke uitstraling en zeer comfortabel ergonomisch zitcomfort van Belgisch fabricaat. Wordt met veel passie exact op uw maat gemaakt.",
    "badge": "Ergonomisch Maatwerk",
    "badgeType": "new",
    "condition": "nieuw",
    "type": "staop",
    "material": "stof",
    "model": "Degas",
    "status": "beschikbaar"
  },
  {
    "id": "sta-op-stoel-fitform-580-elevo",
    "name": "Sta-op stoel Fitform 580 Elevo",
    "image": "assets/chair_sta-op-stoel-fitform-580-elevo-iii-5-300x300.png",
    "ambientImage": "assets/chair_fitform_580_cozy.png",
    "price": 2300,
    "brand": "Fitform",
    "description": "Hoogwaardige Fitform zorgstoel. Ontworpen door specialisten voor langdurig zitcomfort. Standaard voorzien van het Fitform 10 jaar Garantie Waarborg.",
    "badge": "10 Jaar Garantie",
    "badgeType": "reco",
    "condition": "occasion",
    "type": "staop",
    "material": "stof",
    "model": "580 Elevo",
    "status": "beschikbaar"
  },
  {
    "id": "sta-op-stoel-refitto",
    "name": "Sta-op stoel Refitto",
    "image": "assets/chair_sta-op-stoel-refitto-ea-326-e1757503359302.png",
    "ambientImage": "assets/chair_refitto_cozy.png",
    "price": 2345,
    "brand": "Overig",
    "description": "Moderne sta-op relaxfauteuil. Blokkeert automatisch bij het opstaan zodat de stoel niet kan wegdraaien. Veiligheid en comfort hand in hand.",
    "badge": "Extra Beveiligd",
    "badgeType": "new",
    "condition": "nieuw",
    "type": "staop",
    "material": "stof",
    "model": "Refitto",
    "status": "beschikbaar"
  },
  {
    "id": "sta-op-stoel-doge-bellino",
    "name": "Sta-op stoel Doge Bellino",
    "image": "assets/chair_sta-op-stoel-doge-bellino-3-300x300.png",
    "ambientImage": "assets/chair_bellino_cozy.png",
    "price": 2395,
    "brand": "Doge",
    "description": "Voorzien van drie motoren om de stoel geheel naar wens in te stellen. Uniek: de zithouding wordt behouden wanneer de kantelfunctie wordt gebruikt.",
    "badge": "3-Motorig Comfort",
    "badgeType": "reco",
    "condition": "occasion",
    "type": "staop",
    "material": "stof",
    "model": "Bellino",
    "status": "beschikbaar"
  },
  {
    "id": "sta-op-stoel-de-toekomst-fiji",
    "name": "Sta-op stoel De Toekomst Fiji",
    "brand": "De Toekomst",
    "model": "Fiji",
    "price": 2445,
    "image": "assets/chair_downstand.png",
    "condition": "nieuw",
    "status": "beschikbaar",
    "type": "staop",
    "material": "stof",
    "description": "Elegante en moderne draaibare fauteuil. Voorzien van een onzichtbare sta-op motor onder het frame en een veilige rem in de draaivoet.",
    "imageUp": "assets/chair_upstand.png",
    "ambientImage": "assets/chair_fiji_cozy.png",
    "badge": "Draaibaar & Veilig",
    "badgeType": "new"
  },
  {
    "id": "sta-op-stoel-fitform-552-elevo",
    "name": "Sta-op stoel Fitform 552 Elevo",
    "image": "assets/fitform_552_verkocht.png",
    "ambientImage": "assets/chair_fitform_552_cozy.png",
    "price": 2500,
    "brand": "Fitform",
    "description": "Volledig verstelbare sta-op en relax fauteuil met 3 afzonderlijke motoren voor voetenbank, rugleuning en kanteling. Optimaal ondersteund wonen.",
    "badge": "Verkocht",
    "badgeType": "reco",
    "condition": "occasion",
    "type": "staop",
    "material": "stof",
    "model": "552 Elevo",
    "status": "verkocht"
  },
  {
    "id": "sta-op-stoel-industro",
    "name": "Sta-op stoel Industro",
    "image": "assets/chair_sta-op-stoel-industro-cv-120-e1757503299967.png",
    "ambientImage": "assets/chair_industro_cozy.png",
    "price": 2845,
    "brand": "Overig",
    "description": "Stoere, industriële relaxfauteuil met karakter. Volledig naar lichaamsmaten opgemeten en te voorzien van lumbaalsteun of nekverwarming.",
    "badge": "Stoer & Industrieel",
    "badgeType": "new",
    "condition": "nieuw",
    "type": "staop",
    "material": "stof",
    "model": "Industro",
    "status": "beschikbaar"
  },
  {
    "id": "sta-op-stoel-fitform-570-vario",
    "name": "Sta-op stoel Fitform 570 Vario",
    "image": "assets/chair_sta-op-stoel-fitform-570-vario-iii-5-300x300.png",
    "ambientImage": "assets/chair_fitform_570_cozy.png",
    "price": 3450,
    "brand": "Fitform",
    "description": "De Fitform Vario zorgfauteuil kan volledig worden aangepast aan uw persoonlijke situatie. Uitstekend zitsysteem dat klachten voorkomt.",
    "badge": "Zorgfauteuil",
    "badgeType": "reco",
    "condition": "occasion",
    "type": "staop",
    "material": "stof",
    "model": "570 Vario",
    "status": "beschikbaar"
  },
  {
    "id": "sta-op-stoel-fitform-574-vario",
    "name": "Sta-op stoel Fitform 574 Vario",
    "image": "assets/chair_sta-op-stoel-fitform-574-vario-2-300x300.png",
    "ambientImage": "assets/chair_fitform_574_cozy.png",
    "price": 3450,
    "brand": "Fitform",
    "description": "Ranke, slanke en elegante zorgfauteuil. Zithoogte, zitdiepte en armleggers zijn na levering binnen 10 minuten volledig nastelbaar.",
    "badge": "Elegante Pasvorm",
    "badgeType": "reco",
    "condition": "occasion",
    "type": "staop",
    "material": "stof",
    "model": "574 Vario",
    "status": "beschikbaar"
  },
  {
    "id": "sta-op-stoel-doge-modulair",
    "name": "Sta-op stoel Doge Modulair",
    "image": "assets/chair_sta-op-stoel-doge-modulair-4-300x300.png",
    "ambientImage": "assets/chair_doge_modulair_cozy.png",
    "price": 3995,
    "brand": "Doge",
    "description": "Nederlands kwaliteitsproduct met 3 motoren. Optimaal zitcomfort door individuele instelbaarheid. Uitstekend te combineren met orthopedische aanpassingen.",
    "badge": "Modulair Systeem",
    "badgeType": "reco",
    "condition": "occasion",
    "type": "staop",
    "material": "stof",
    "model": "Modulair",
    "status": "beschikbaar"
  },
  {
    "id": "geert-relax",
    "name": "Senioren Stoel Geert",
    "brand": "Huismerk",
    "price": 950,
    "image": "assets/seniorenstoel_oude_geert_studio.png",
    "condition": "occasion",
    "type": "relax",
    "description": "Ontmoet de Geert Senioren: een prachtige klassieke senioren stoel bekleed met een comfortabele oranje structuurstof. Met zijn massief houten armleuningen en ergonomisch gevormde rugleuning biedt deze stoel de perfecte ondersteuning om heerlijk in te ontspannen. Een tijdloze toevoeging aan uw interieur.",
    "ambientImage": "assets/seniorenstoel_oude_geert_interior.png",
    "badge": "Senioren Functie",
    "badgeType": "sale",
    "material": "stof",
    "model": "Geert Senioren",
    "status": "beschikbaar"
  },
  {
    "id": "seniorenstoel-hk-zwolle",
    "name": "Senioren Stoel HK Zwolle",
    "brand": "Hjort Knudsen",
    "price": 695,
    "image": "assets/chair_seniorenstoel-hjortknudsen-zwolle-nw-1-300x300.png",
    "condition": "occasion",
    "type": "relax",
    "description": "De Senioren stoel HK Zwolle is een zeer comfortabele senioren fauteuil met verstelbare rugleuning. Door middel van een hendel aan de zijkant van de stoel kunt u deze verstelling gebruiken. Zo’n stoel geeft u weer nieuwe energie.",
    "badge": "Op maat gemaakt",
    "badgeType": "reco",
    "material": "stof",
    "model": "HK Zwolle",
    "status": "beschikbaar"
  },
  {
    "id": "seniorenstoel-dylan",
    "name": "Senioren Stoel Dylan",
    "brand": "Overig",
    "price": 775,
    "image": "assets/chair_seniorenstoel-dylan-2-300x300.png",
    "condition": "nieuw",
    "type": "relax",
    "description": "Senioren Stoel Dylan is een comfort stoel ontwikkeld voor de professionele ouderenzorg. Dit ziet u terug in het robuuste uiterlijk. Stoffen zijn zorgvuldig geselecteerd op eenvoudige reiniging en goede hygiëne.",
    "badge": "Hygiënisch & Robuust",
    "badgeType": "new",
    "material": "stof",
    "model": "Dylan",
    "status": "beschikbaar"
  },
  {
    "id": "seniorenstoel-farstrup-applaus",
    "name": "Senioren Stoel Farstrup Applaus",
    "brand": "Farstrup",
    "price": 945,
    "image": "assets/chair_senioren-fauteuil-farstrup-applaus-300x300.png",
    "condition": "occasion",
    "type": "relax",
    "description": "Elke Senioren Stoel Farstrup Applaus wordt op bestelling gemaakt. U kunt zelf het model, de stof, de kleur en de houtbeits kiezen. Dit Deense kwaliteitsmeubel biedt maar liefst 10 jaar garantie bij normaal gebruik.",
    "badge": "10 Jaar Garantie",
    "badgeType": "reco",
    "material": "stof",
    "model": "Applaus",
    "status": "beschikbaar"
  },
  {
    "id": "seniorenstoel-farstrup-plus",
    "name": "Senioren Stoel Farstrup Plus",
    "brand": "Farstrup",
    "price": 1395,
    "image": "assets/chair_ergonomische-senioren-fauteuil-plus-7-300x300.png",
    "condition": "occasion",
    "type": "relax",
    "description": "Op bestelling gemaakt Deens meubelstuk. Keuze uit vele houtbeitsen, stoffen en leder. Biedt sublieme ergonomische ondersteuning voor langdurig zitcomfort. Standaard geleverd met 10 jaar garantie.",
    "badge": "10 Jaar Garantie",
    "badgeType": "reco",
    "material": "stof",
    "model": "Plus",
    "status": "beschikbaar"
  },
  {
    "id": "seniorenstoel-farstrup-casa",
    "name": "Senioren Stoel Farstrup Casa",
    "brand": "Farstrup",
    "price": 1495,
    "image": "assets/chair_ergonomische-senioren-fauteuil-casa-1-300x300.png",
    "condition": "occasion",
    "type": "relax",
    "description": "Farstrup Casa staat bekend om zijn traditionele Deense ambacht. Geheel naar uw wens samen te stellen en perfect ingesteld op uw lichaam door onze deskundigen. 10 jaar garantie op de romp.",
    "badge": "Deens Handwerk",
    "badgeType": "reco",
    "material": "stof",
    "model": "Casa",
    "status": "beschikbaar"
  },
  {
    "id": "seniorenstoel-farstrup-cantate",
    "name": "Senioren Stoel Farstrup Cantate",
    "brand": "Farstrup",
    "price": 1595,
    "image": "assets/chair_ergonomische-senioren-fauteuil-cantate-1-300x300.png",
    "condition": "occasion",
    "type": "relax",
    "description": "De Cantate is het paradepaardje onder de senioren stoelen van Farstrup. Uitstekende pasvorm en hoogwaardige vering in de zitting. Volledig personaliseerbaar met diverse stoffen en houtkleuren.",
    "badge": "Top Comfort",
    "badgeType": "reco",
    "material": "stof",
    "model": "Cantate",
    "status": "beschikbaar"
  },
  {
    "id": "geerts-droom",
    "name": "Geerts Droom",
    "brand": "Huismerk",
    "model": "D1",
    "price": 1190,
    "image": "assets/geert_dream_sit.png",
    "condition": "occasion",
    "type": "staop",
    "material": "stof",
    "description": "Als gediplomeerd BewegingsTechnoloog droomt Geert al jaren van de perfecte sta-op stoel: een model dat niet alleen ergonomisch perfect aansluit op uw lichaam, maar ook met een vloeiende, stabiele beweging opstaat. Hieronder kunt u deze upstand-beweging zelf ervaren door simpelweg uw cursor op de stoel te plaatsen.",
    "imageUp": "assets/geert_dream_lift.png",
    "ambientImage": "assets/Sta-op-stoel-DORDRECHT-interior.png",
    "badge": "Een droom",
    "badgeType": "reco",
    "status": "beschikbaar"
  }
];

    // Prefill helper
    function prefillBooking(name) {
      localStorage.setItem("prefilledChair", name);
      window.location.href = "<?php echo home_url('/afspraak-inplannen/'); ?>";
    }

    // Dynamic brand filter generation
    function initBrandFilters() {
      const container = document.getElementById("brandFilterGroup");
      if (!container) return;

      const brands = new Set();
      GOEDKOPE_STAOPSTOELEN_DATA.forEach(item => {
        if (item.brand) {
          brands.add(item.brand.trim());
        }
      });

      // Sort alphabetically, but put "Overig" at the bottom if it exists
      const sortedBrands = Array.from(brands).sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        if (aLower === 'overig') return 1;
        if (bLower === 'overig') return -1;
        return a.localeCompare(b);
      });

      // Build checkboxes
      let html = `<h3 class="filter-group-title">Merk</h3>`;
      sortedBrands.forEach(brand => {
        html += `
          <label class="checkbox-label">
            <input type="checkbox" class="brand-filter" value="${brand}">
            <span>${brand}</span>
          </label>
        `;
      });

      container.innerHTML = html;

      // Add event listeners to the newly created checkboxes
      container.querySelectorAll(".brand-filter").forEach(cb => {
        cb.addEventListener("change", renderCatalog);
      });
    }

    // Render Logic
    function renderCatalog() {
      const grid = document.getElementById("catalogGrid");
      grid.innerHTML = "";

      // Get filter states
      const sortVal = document.getElementById("sortSelect").value;
      const checkedBrands = Array.from(document.querySelectorAll(".brand-filter:checked")).map(cb => cb.value);
      const checkedPrices = Array.from(document.querySelectorAll(".price-filter:checked")).map(cb => cb.value);
      const checkedConditions = Array.from(document.querySelectorAll(".condition-filter:checked")).map(cb => cb.value);
      const checkedTypes = Array.from(document.querySelectorAll(".type-filter:checked")).map(cb => cb.value);
      const checkedMaterials = Array.from(document.querySelectorAll(".material-filter:checked")).map(cb => cb.value);

      // Filter
      let filtered = [...GOEDKOPE_STAOPSTOELEN_DATA];
      
      if (checkedBrands.length > 0) {
        filtered = filtered.filter(item => {
          const itemBrandLower = (item.brand || "overig").trim().toLowerCase();
          return checkedBrands.some(b => b.toLowerCase() === itemBrandLower);
        });
      }
      
      if (checkedPrices.length > 0) {
        filtered = filtered.filter(item => {
          if (checkedPrices.includes("under-1500") && item.price < 1500) return true;
          if (checkedPrices.includes("1500-2500") && item.price >= 1500 && item.price <= 2500) return true;
          if (checkedPrices.includes("over-2500") && item.price > 2500) return true;
          return false;
        });
      }

      if (checkedConditions.length > 0) {
        filtered = filtered.filter(item => {
          const itemCondition = item.condition || (item.badgeType === 'reco' ? 'occasion' : 'nieuw');
          return checkedConditions.includes(itemCondition);
        });
      }

      if (checkedTypes.length > 0) {
        filtered = filtered.filter(item => {
          const itemType = item.type || 'staop';
          return checkedTypes.includes(itemType);
        });
      }

      if (checkedMaterials.length > 0) {
        filtered = filtered.filter(item => {
          const itemMaterial = item.material || 'stof';
          return checkedMaterials.includes(itemMaterial);
        });
      }

      // Sort
      if (sortVal === "price-asc") {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sortVal === "price-desc") {
        filtered.sort((a, b) => b.price - a.price);
      } else if (sortVal === "type-relax") {
        filtered.sort((a, b) => {
          const typeA = a.type || 'staop';
          const typeB = b.type || 'staop';
          if (typeA === typeB) return 0;
          return typeA === 'relax' ? -1 : 1;
        });
      } else if (sortVal === "type-staop") {
        filtered.sort((a, b) => {
          const typeA = a.type || 'staop';
          const typeB = b.type || 'staop';
          if (typeA === typeB) return 0;
          return typeA === 'staop' ? -1 : 1;
        });
      } else if (sortVal === "material-stof") {
        filtered.sort((a, b) => {
          const matA = a.material || 'stof';
          const matB = b.material || 'stof';
          if (matA === matB) return 0;
          return matA === 'stof' ? -1 : 1;
        });
      } else if (sortVal === "material-leer") {
        filtered.sort((a, b) => {
          const matA = a.material || 'stof';
          const matB = b.material || 'stof';
          if (matA === matB) return 0;
          return matA === 'leer' ? -1 : 1;
        });
      }

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="no-results" style="grid-column: 1/-1;">
            <h3>Geen resultaten gevonden</h3>
            <p style="margin-top: 8px;">Probeer uw filters aan te passen of neem direct contact op met onze BewegingsTechnologen.</p>
          </div>
        `;
        return;
      }

      filtered.forEach(item => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.style.cursor = "pointer";
        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `${item.name}, bekijk details`);

        let stampHtml = "";
        if (item.condition === "occasion") {
          stampHtml += `<img src="<?php echo get_theme_asset_url('revisie_stempel_clean.svg'); ?>?v=1.0.48" alt="Gereviseerd" class="quality-stamp">`;
        }
        if (item.status === "verkocht") {
          stampHtml += `<div class="product-status-label status-verkocht">Verkocht</div>`;
        } else if (item.status === "gereserveerd") {
          stampHtml += `<div class="product-status-label status-gereserveerd">Gereserveerd</div>`;
        }

        const isUnavailable = item.status && item.status !== "beschikbaar";

        card.innerHTML = `
          <div class="product-image ${isUnavailable ? 'is-unavailable' : ''}" style="background-color: var(--color-light); overflow: hidden; display: flex; align-items: center; justify-content: center; height: 260px; padding: 15px;">
            <img src="${item.image}" alt="${item.name}" style="max-height: 100%; max-width: 100%; object-fit: contain;">
            ${stampHtml}
            ${item.badge ? `<span class="badge ${item.badgeType === "new" ? "badge-new" : "badge-reco"}">${item.badge}</span>` : ""}
          </div>
          <div class="product-info" style="display: flex; flex-direction: column;">
            <h3 class="product-title" style="font-size: 1.15rem; margin-bottom: 8px;">${item.name}</h3>
            <p style="font-size: 0.875rem; color: var(--color-gray); line-height: 1.6; margin-bottom: 20px; flex-grow: 1;">
              ${item.description}
            </p>
            <div class="product-price-row">
              <div>
                <span class="price-label">Prijs vanaf</span>
                <div style="display: flex; align-items: center; margin-top: 2px;">
                  <span class="price-value">€ ${item.price.toLocaleString("nl-NL")},-</span>
                </div>
              </div>
              <button type="button" class="btn btn-secondary" onclick="event.stopPropagation(); prefillBooking('${item.name}')" style="padding: 10px 16px; font-size: 0.85rem; min-height: auto;">
                Thuis Testen
              </button>
            </div>
          </div>
        `;

        // Hover effect to swap image between downstand and upstand (if imageUp is present)
        if (item.imageUp) {
          const imgElement = card.querySelector(".product-image img");
          if (imgElement) {
            // Preload the upstand image to prevent flicker
            const preloadImg = new Image();
            preloadImg.src = item.imageUp;
            
            card.addEventListener("mouseenter", () => {
              imgElement.src = item.imageUp;
            });
            card.addEventListener("mouseleave", () => {
              imgElement.src = item.image;
            });
          }
        }

        // Click handler to open popup details modal
        card.addEventListener("click", (e) => {
          if (e.target.tagName === "BUTTON") return;
          openProductModal(item);
        });

        // Keydown handler for accessibility
        card.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openProductModal(item);
          }
        });

        grid.appendChild(card);
      });
    }

    // Modal logic
    let activeItem = null;

    function openProductModal(item) {
      activeItem = item;
      const modal = document.getElementById("productModal");
      const modalImg = document.getElementById("modalProductImage");
      const modalStamp = document.getElementById("modalProductStamp");
      const modalTitle = document.getElementById("modalTitle");
      const modalBrand = document.getElementById("modalBrand");
      const modalDesc = document.getElementById("modalDescription");
      const modalPrice = document.getElementById("modalPrice");
      const modalBadge = document.getElementById("modalBadge");
      const modalTabs = document.getElementById("modalGalleryTabs");
      const bookBtn = document.getElementById("modalBookBtn");

      // Set content
      modalImg.src = item.image;
      modalImg.alt = item.name;
      modalTitle.textContent = item.name;
      const materialText = item.material === "leer" ? "Leer" : "Stof";
      const modelText = item.model ? `<br>Model: ${item.model}` : "";
      modalBrand.innerHTML = `Merk: ${item.brand}${modelText}<br>Materiaal: ${materialText}`;
      modalDesc.textContent = item.description;
      modalPrice.textContent = `€ ${item.price.toLocaleString("nl-NL")},-`;
      
      // Render condition stamp (revisie / occasion)
      if (item.condition === "occasion") {
        modalStamp.src = "assets/revisie_stempel_clean.svg?v=1.0.48";
        modalStamp.alt = "Gereviseerd";
        modalStamp.className = "quality-stamp";
        modalStamp.style.display = "block";
      } else {
        modalStamp.style.display = "none";
      }

      // Render status label (verkocht / gereserveerd)
      const modalStatusLabel = document.getElementById("modalProductStatusLabel");
      const modalImgWrapper = document.getElementById("modalImageWrapper");
      
      if (item.status === "verkocht") {
        modalStatusLabel.textContent = "Verkocht";
        modalStatusLabel.className = "product-status-label status-verkocht";
        modalStatusLabel.style.display = "block";
        if (modalImgWrapper) modalImgWrapper.classList.add("is-unavailable");
      } else if (item.status === "gereserveerd") {
        modalStatusLabel.textContent = "Gereserveerd";
        modalStatusLabel.className = "product-status-label status-gereserveerd";
        modalStatusLabel.style.display = "block";
        if (modalImgWrapper) modalImgWrapper.classList.add("is-unavailable");
      } else {
        modalStatusLabel.style.display = "none";
        if (modalImgWrapper) modalImgWrapper.classList.remove("is-unavailable");
      }

      if (item.badge) {
        modalBadge.textContent = item.badge;
        modalBadge.className = `badge ${item.badgeType === "new" ? "badge-new" : "badge-reco"}`;
        modalBadge.style.display = "block";
      } else {
        modalBadge.style.display = "none";
      }

      // Handle gallery tabs dynamically depending on which images are present
      const hasUp = !!item.imageUp;
      const hasLie = !!item.imageLie;
      const hasAmbient = !!item.ambientImage;
      
      const tabDown = document.getElementById("tabDown");
      const tabUp = document.getElementById("tabUp");
      const tabLie = document.getElementById("tabLie");
      const tabAmbient = document.getElementById("tabAmbient");
      
      // Reset tab states
      tabDown.classList.add("active");
      tabUp.classList.remove("active");
      tabLie.classList.remove("active");
      tabAmbient.classList.remove("active");
      
      if (hasUp || hasLie || hasAmbient) {
        modalTabs.style.display = "flex";
        
        // Show/hide relevant tab buttons
        tabUp.style.display = hasUp ? "block" : "none";
        tabLie.style.display = hasLie ? "block" : "none";
        tabAmbient.style.display = hasAmbient ? "block" : "none";
        
        // Remove old event listeners via cloning
        const newTabDown = tabDown.cloneNode(true);
        const newTabUp = tabUp.cloneNode(true);
        const newTabLie = tabLie.cloneNode(true);
        const newTabAmbient = tabAmbient.cloneNode(true);
        
        tabDown.parentNode.replaceChild(newTabDown, tabDown);
        tabUp.parentNode.replaceChild(newTabUp, tabUp);
        tabLie.parentNode.replaceChild(newTabLie, tabLie);
        tabAmbient.parentNode.replaceChild(newTabAmbient, tabAmbient);
        
        const tabs = [newTabDown, newTabUp, newTabLie, newTabAmbient];
        const setImg = (src) => {
          modalImg.style.opacity = 0;
          setTimeout(() => {
            modalImg.src = src;
            modalImg.style.opacity = 1;
          }, 150);
        };
        
        newTabDown.addEventListener("click", () => {
          tabs.forEach(t => t.classList.remove("active"));
          newTabDown.classList.add("active");
          setImg(item.image);
        });
        
        if (hasUp) {
          newTabUp.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            newTabUp.classList.add("active");
            setImg(item.imageUp);
          });
        }
        
        if (hasLie) {
          newTabLie.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            newTabLie.classList.add("active");
            setImg(item.imageLie);
          });
        }
        
        if (hasAmbient) {
          newTabAmbient.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            newTabAmbient.classList.add("active");
            setImg(item.ambientImage);
          });
        }
      } else {
        modalTabs.style.display = "none";
      }

      // Configure booking action button
      const newBookBtn = bookBtn.cloneNode(true);
      bookBtn.parentNode.replaceChild(newBookBtn, bookBtn);
      newBookBtn.addEventListener("click", () => {
        closeProductModal();
        prefillBooking(item.name);
      });

      // Show modal
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
      
      // Accessibility focus
      modal.focus();
    }

    function closeProductModal() {
      const modal = document.getElementById("productModal");
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }

    // Modal Event Listeners
    document.getElementById("modalClose").addEventListener("click", closeProductModal);
    document.getElementById("productModal").addEventListener("click", (e) => {
      if (e.target.id === "productModal") {
        closeProductModal();
      }
    });
    
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeProductModal();
      }
    });

    // Event Listeners
    document.getElementById("sortSelect").addEventListener("change", renderCatalog);
    document.querySelectorAll(".price-filter").forEach(cb => cb.addEventListener("change", renderCatalog));
    document.querySelectorAll(".condition-filter").forEach(cb => cb.addEventListener("change", renderCatalog));
    document.querySelectorAll(".type-filter").forEach(cb => cb.addEventListener("change", renderCatalog));
    document.querySelectorAll(".material-filter").forEach(cb => cb.addEventListener("change", renderCatalog));

    // Initial render with API fetch fallback
    window.addEventListener("DOMContentLoaded", async () => {
      try {
        const API_URL = window.location.origin + "/wp-json/custom/v1/stoelen";
        const response = await fetch(API_URL);
        if (response.ok) {
          const dbData = await response.json();
          if (dbData && dbData.staopstoelen) {
            GOEDKOPE_STAOPSTOELEN_DATA = dbData.staopstoelen;
            console.log("Loaded data from local API database server!");
          }
        }
      } catch (e) {
        console.warn("Could not connect to database server. Using localStorage/static fallback.");
      }
      initBrandFilters();
      renderCatalog();
    });
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('staopstoelen_catalog', 'shortcode_staopstoelen_catalog');
