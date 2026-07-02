const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const themeDir = path.join(rootDir, 'staopstoelen-theme');

// 1. Rewrite functions.php to make sure wp_head and wp_footer are clean, but keep our asset finder
// We already have wp_head/wp_footer inside templates.

// 2. Define shortcode functions to be written into the plugin
const shortcodesCode = `
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

        slideCounter.textContent = \`\${currentSlide + 1} / \${slides.length}\`;

        function updateSlide(index) {
          slideImg.style.opacity = 0;
          setTimeout(() => {
            currentSlide = index;
            slideImg.src = slides[currentSlide].img;
            slideImg.alt = \`Revisieproces stap \${currentSlide + 1}\`;
            slideCounter.textContent = \`\${currentSlide + 1} / \${slides.length}\`;
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
`;

// 3. Page Gutenberg HTML blocks content definitions
const homePageContent = `<!-- wp:shortcode -->
[staopstoelen_slideshow]
<!-- /wp:shortcode -->

<!-- wp:group {"layout":{"inherit":true}} -->
<div class="wp-block-group">
  <!-- wp:heading {"level":2,"className":"section-title text-center"} -->
  <h2 class="section-title text-center">Waarom kiezen voor staopstoelen.nl?</h2>
  <!-- /wp:heading -->
  
  <!-- wp:columns -->
  <div class="wp-block-columns">
    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"level":3} -->
      <h3>✓ Volledig Maatwerk</h3>
      <!-- /wp:heading -->
      <!-- wp:paragraph -->
      <p>Elke stoel wordt door onze bewegingstechnoloog exact afgesteld op uw lichaamsmaten om uw rug en gewrichten optimaal te ontlasten.</p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->

    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"level":3} -->
      <h3>✓ Topmerken</h3>
      <!-- /wp:heading -->
      <!-- wp:paragraph -->
      <p>Wij zijn officieel dealer en leverancier van gerenommeerde A-merken zoals <em>Fitform</em>, <em>Doge</em> en <em>Mecam</em>.</p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->

    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"level":3} -->
      <h3>✓ Thuis Passing</h3>
      <!-- /wp:heading -->
      <!-- wp:paragraph -->
      <p>Minder mobiel? Geen probleem! Onze adviseurs komen gratis bij u thuis langs met een selectie van 3 stoelen om te testen.</p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->
  </div>
  <!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:shortcode -->
[staopstoelen_wizard]
<!-- /wp:shortcode -->

<!-- wp:group {"className":"subpage-section","layout":{"inherit":true}} -->
<div class="wp-block-group subpage-section">
  <!-- wp:heading {"level":2,"className":"section-title text-center"} -->
  <h2 class="section-title text-center">De voordelen van een ergonomische sta-op stoel</h2>
  <!-- /wp:heading -->
  <!-- wp:paragraph -->
  <p>Een goede sta-op stoel is meer dan alleen een comfortabel meubelstuk; het is een investering in uw dagelijkse zelfstandigheid en gezondheid:</p>
  <!-- /wp:paragraph -->
  <!-- wp:list -->
  <ul>
    <li><strong>Veilig opstaan en gaan zitten:</strong> De motorische liftfunctie helpt u moeiteloos en zonder fysieke belasting omhoog.</li>
    <li><strong>Uitstekende drukontlasting:</strong> Voorkomt klachten aan uw billen en rug bij langdurig zitten.</li>
    <li><strong>Optimale bloedsomloop:</strong> De kantel- en relaxstanden bevorderen de vochtafvoer uit uw benen.</li>
    <li><strong>Zitten, relaxen en slapen:</strong> De stoel past zich naadloos aan uw behoeften van dat moment aan.</li>
  </ul>
  <!-- /wp:list -->
</div>
<!-- /wp:group -->
`;

const infoPageContent = `<!-- wp:paragraph -->
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
`;

const revisiePageContent = `<!-- wp:shortcode -->
[staopstoelen_revisie_slider]
<!-- /wp:shortcode -->
`;

const catalogStaopPageContent = `<!-- wp:shortcode -->
[staopstoelen_catalog type="staop"]
<!-- /wp:shortcode -->
`;

const catalogSeniorenPageContent = `<!-- wp:shortcode -->
[staopstoelen_catalog type="relax"]
<!-- /wp:shortcode -->
`;

const wizardPageContent = `<!-- wp:shortcode -->
[staopstoelen_wizard]
<!-- /wp:shortcode -->
`;

const schedulerPageContent = `<!-- wp:shortcode -->
[staopstoelen_scheduler]
<!-- /wp:shortcode -->
`;

const ervaringenPageContent = `<!-- wp:html -->
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
`;

const faqPageContent = `<!-- wp:heading {"level":3} -->
<h3>Veelgestelde Vragen (FAQ)</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Hier vindt u de antwoorden op de meest gestelde vragen over onze sta-op stoelen en dienstverlening. Staat uw vraag er niet tussen? Neem dan gerust contact met ons op!</p>
<!-- /wp:paragraph -->
`;

// Helper to escape single quotes/backticks for PHP inject
function phpEscape(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function updatePlugin() {
  console.log("1. Modifying staopstoelen-helper.php to add shortcodes...");
  const helperPath = path.join(rootDir, 'staopstoelen-helper/staopstoelen-helper.php');
  let helperCode = fs.readFileSync(helperPath, 'utf8');
  
  // Cut off after local field group setup
  const cutoffIndex = helperCode.lastIndexOf('endif;');
  if (cutoffIndex === -1) {
    console.error("Could not find cutoff index in helper plugin!");
    return;
  }
  
  const baseHelperCode = helperCode.substring(0, cutoffIndex + 6);
  const newHelperCode = baseHelperCode + '\n' + shortcodesCode + '\n';
  fs.writeFileSync(helperPath, newHelperCode, 'utf8');
  console.log("staopstoelen-helper.php updated successfully!");
}

function updateSetupHelperScript() {
  console.log("2. Modifying setup_helper.php database page creation blocks...");
  const setupPath = path.join(rootDir, 'setup_helper.php');
  let setupCode = fs.readFileSync(setupPath, 'utf8');
  
  // Replace the entire page creation array loop in setup_helper.php with a Gutenberg prefilled one
  const targetText = `// 7. Create other required pages with templates
echo "<h2>7. Creating/Verifying Page Structure</h2>";
$pages = array(
    'sta-op-stoelen' => array('title' => 'Sta-op Stoelen', 'template' => 'template-staopstoelen.php'),
    'senioren-stoelen' => array('title' => 'Senioren Stoelen', 'template' => 'template-seniorenstoelen.php'),
    'keuzehulp' => array('title' => 'Keuzehulp', 'template' => 'template-keuzehulp.php'),
    'revisieproces' => array('title' => 'Revisieproces', 'template' => 'template-revisie.php'),
    'klantverhalen' => array('title' => 'Klantverhalen', 'template' => 'template-ervaringen.php'),
    'faq' => array('title' => 'FAQ', 'template' => 'template-faq.php'),
    'over-ons' => array('title' => 'Over Ons', 'template' => 'template-info.php'),
    'afspraak-inplannen' => array('title' => 'Afspraak inplannen', 'template' => 'template-afspraak.php')
);

foreach ($pages as $slug => $data) {
    $page = get_page_by_path($slug);
    if (!$page) {
        wp_insert_post(array(
            'post_name'     => $slug,
            'post_title'    => $data['title'],
            'post_content'  => '',
            'post_status'   => 'publish',
            'post_type'     => 'page',
            'page_template' => $data['template']
        ));
        echo "Created page: <strong>{$data['title']}</strong><br>";
    } else {
        update_post_meta($page->ID, '_wp_page_template', $data['template']);
        echo "Verified page: <strong>{$data['title']}</strong><br>";
    }
}`;

  const replacementText = `// 7. Create other required pages with templates and prefilled Gutenberg blocks
echo "<h2>7. Creating/Verifying Page Structure with Gutenberg blocks</h2>";
$pages = array(
    'sta-op-stoelen' => array('title' => 'Sta-op Stoelen', 'template' => 'template-staopstoelen.php', 'content' => '${phpEscape(catalogStaopPageContent)}'),
    'senioren-stoelen' => array('title' => 'Senioren Stoelen', 'template' => 'template-seniorenstoelen.php', 'content' => '${phpEscape(catalogSeniorenPageContent)}'),
    'keuzehulp' => array('title' => 'Keuzehulp', 'template' => 'template-keuzehulp.php', 'content' => '${phpEscape(wizardPageContent)}'),
    'revisieproces' => array('title' => 'Revisieproces', 'template' => 'template-revisie.php', 'content' => '${phpEscape(revisiePageContent)}'),
    'klantverhalen' => array('title' => 'Klantverhalen', 'template' => 'template-ervaringen.php', 'content' => '${phpEscape(ervaringenPageContent)}'),
    'faq' => array('title' => 'FAQ', 'template' => 'template-faq.php', 'content' => '${phpEscape(faqPageContent)}'),
    'over-ons' => array('title' => 'Over Ons', 'template' => 'template-info.php', 'content' => '${phpEscape(infoPageContent)}'),
    'afspraak-inplannen' => array('title' => 'Afspraak inplannen', 'template' => 'template-afspraak.php', 'content' => '${phpEscape(schedulerPageContent)}')
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
}`;

  // Also replace Home page creation to use Gutenberg blocks!
  const homeTargetText = `// 6. Set front page to template-home
// Create page if it doesn't exist
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
    echo "Created Home page.<br>";
} else {
    $home_page_id = $home_page->ID;
    update_post_meta($home_page_id, '_wp_page_template', 'template-home.php');
    echo "Updated Home page template.<br>";
}`;

  const homeReplacementText = `// 6. Set front page to template-home
// Create page if it doesn't exist
$home_page_title = 'Home';
$home_page = get_page_by_title($home_page_title);
if (!$home_page) {
    $home_page_id = wp_insert_post(array(
        'post_title'    => $home_page_title,
        'post_content'  => '${phpEscape(homePageContent)}',
        'post_status'   => 'publish',
        'post_type'     => 'page',
        'page_template' => 'template-home.php'
    ));
    echo "Created Home page with Gutenberg blocks.<br>";
} else {
    $home_page_id = $home_page->ID;
    wp_update_post(array(
        'ID'           => $home_page_id,
        'post_content' => '${phpEscape(homePageContent)}'
    ));
    update_post_meta($home_page_id, '_wp_page_template', 'template-home.php');
    echo "Updated Home page template and content for block editing.<br>";
}`;

  setupCode = setupCode.replace(targetText, replacementText).replace(homeTargetText, homeReplacementText);
  fs.writeFileSync(setupPath, setupCode, 'utf8');
  console.log("setup_helper.php updated successfully!");
}

function updatePHPFileTemplates() {
  console.log("3. Modifying PHP templates to output the_content()...");
  
  // List of templates to modify (mapping filename to middle content delimiters)
  const templates = [
    { file: 'template-home.php', start: '<!-- Hero Section -->', end: '<!-- Footer Section -->' },
    { file: 'front-page.php', start: '<!-- Hero Section -->', end: '<!-- Footer Section -->' },
    { file: 'template-info.php', start: '<!-- Page Content -->', end: '<!-- Footer Section -->' },
    { file: 'template-revisie.php', start: '<!-- Revisieproces Before/After Slider Section -->', end: '<!-- Footer Section -->' },
    { file: 'template-ervaringen.php', start: '<!-- Social Proof / Customer Stories Section -->', end: '<!-- Footer Section -->' },
    { file: 'template-faq.php', start: '<!-- Page Content / Accordion -->', end: '<!-- Footer Section -->' },
    { file: 'template-afspraak.php', start: '<section id="afspraak-planner" class="subpage-section">', end: '<!-- Footer Section -->' },
    { file: 'template-keuzehulp.php', start: '<!-- Keuzehulp Wizard Section -->', end: '<!-- Footer Section -->' },
    { file: 'template-staopstoelen.php', start: '<!-- Catalog Section -->', end: '<!-- Footer Section -->' },
    { file: 'template-seniorenstoelen.php', start: '<!-- Catalog Section -->', end: '<!-- Footer Section -->' }
  ];

  const blockOutput = `
  <main class="main-content subpage-section">
    <div class="container">
      <?php
      while ( have_posts() ) :
          the_post();
          the_content();
      endwhile;
      ?>
    </div>
  </main>
  `;

  // We will do this for files in both root (for fallback/packaging) and inside staopstoelen-theme
  const dirs = [rootDir, themeDir];

  dirs.forEach(dir => {
    templates.forEach(t => {
      const filePath = path.join(dir, t.file);
      if (!fs.existsSync(filePath)) return;
      
      let content = fs.readFileSync(filePath, 'utf8');
      
      const startIdx = content.indexOf(t.start);
      const endIdx = content.indexOf(t.end);
      
      if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
        const pre = content.substring(0, startIdx);
        const post = content.substring(endIdx);
        const updated = pre + t.start + '\n' + blockOutput + '\n  ' + post;
        
        fs.writeFileSync(filePath, updated, 'utf8');
        console.log(`Updated PHP template: ${path.relative(rootDir, filePath)}`);
      } else {
        // Check if already modified
        if (content.includes('the_content()')) {
          console.log(`Already modified template: ${path.relative(rootDir, filePath)}`);
        } else {
          console.warn(`Could not find start/end marks in template: ${path.relative(rootDir, filePath)}`);
        }
      }
    });
  });
}

function main() {
  updatePlugin();
  updateSetupHelperScript();
  updatePHPFileTemplates();
  console.log("All modifications completed successfully!");
}

main();
