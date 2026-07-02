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
        'type' => 'staop'
    ), $atts);
    return '<div id="chairs-catalog" data-type="' . esc_attr($a['type']) . '"></div>';
}
add_shortcode('staopstoelen_catalog', 'shortcode_staopstoelen_catalog');

