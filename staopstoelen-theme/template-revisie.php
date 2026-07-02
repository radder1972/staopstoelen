<?php
/* Template Name: Revisieproces Template */
?>
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fitform & Doge Sta-op Stoel Revisie | 100% Als Nieuw</title>
  <meta name="description" content="Hoe werkt onze sta-op stoel revisie? Ontdek hoe onze specialisten tweedehands A-merk stoelen technisch en optisch reviseren tot betrouwbare exemplaren met garantie.">
  <link rel="apple-touch-icon" sizes="180x180" href="<?php echo get_stylesheet_directory_uri(); ?>/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="<?php echo get_stylesheet_directory_uri(); ?>/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="<?php echo get_stylesheet_directory_uri(); ?>/favicon-16x16.png">
  <link rel="manifest" href="<?php echo get_stylesheet_directory_uri(); ?>/site.webmanifest">
  <link rel="stylesheet" href="<?php echo get_stylesheet_directory_uri(); ?>/style.css?v=1.0.51">
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
          <a href="<?php echo home_url('/sta-op-stoelen/'); ?>" id="linkGoedkopeStaopstoelen">Sta-op Stoelen</a>
          <a href="<?php echo home_url('/senioren-stoelen/'); ?>" id="linkSeniorenstoelen">Senioren Stoelen</a>
          <a href="<?php echo home_url('/keuzehulp/'); ?>" id="linkKeuzehulp">Keuzehulp</a>
          <a href="<?php echo home_url('/revisieproces/'); ?>" class="active" id="linkRevisie">Revisieproces</a>
          <a href="<?php echo home_url('/klantverhalen/'); ?>" id="linkKlantverhalen">Ervaringen</a>
          <a href="<?php echo home_url('/faq/'); ?>" id="linkFaq">FAQ</a>
          <a href="<?php echo home_url('/over-ons/'); ?>" id="linkOverOns">Over Ons</a>
          <a href="<?php echo home_url('/afspraak-inplannen/'); ?>" class="nav-desktop-hide" id="linkAfspraak">Afspraak Maken</a>
        </nav>
        
      </div>
    </div>
  </header>

  <!-- Banner Header -->
  <section class="occasions-header" style="text-align: left;">
    <div class="container banner-flex-container" style="justify-content: flex-start; align-items: flex-start;">
      <div style="text-align: left; max-width: 600px; flex: 1; min-width: 280px;">
        <span class="section-tag" style="color: var(--color-terracotta);">Als Nieuw</span>
        <h1 style="color: var(--color-light); margin: 4px 0 8px 0; font-size: 2.5rem;">Het Unieke Revisieproces</h1>
        <p style="margin: 0; color: rgba(255, 255, 255, 0.85); font-size: 1.1rem;">Wij transformeren kwalitatieve A-merk sta-op stoelen tot prachtige, als-nieuwe exemplaren. Ontdek ons zorgvuldige revisieproces stap voor stap.</p>
      </div>
      <img src="<?php echo get_theme_asset_url('revisie_stempel_clean.svg'); ?>?v=1.0.48" alt="Gereviseerd" class="banner-stamp">
    </div>
  </section>


  <!-- Revisieproces Before/After Slider Section -->
  <section id="revisie" class="slider-section subpage-section">
    <div class="container">
      <a href="<?php echo home_url('/'); ?>" class="back-link">← Terug naar Home</a>
      <h2 class="section-title" style="margin-top: 20px; margin-bottom: 30px; font-size: 1.85rem; border-bottom: 2px solid var(--color-sage); padding-bottom: 8px;">Het Unieke Revisieproces</h2>
      
      <p style="font-size: 1.1rem; line-height: 1.7; color: var(--color-gray); margin-bottom: 32px; max-width: 800px;">
        Bij staopstoelen.nl geloven we in duurzaamheid en topkwaliteit. Onze gediplomeerde BewegingsTechnologen reviseren premium A-merk sta-op stoelen (zoals Fitform en Doge) tot in het kleinste detail. Van het volledig reinigen en controleren van de motoren tot het vernieuwen van de vulling en de bekleding: elke stoel verlaat onze werkplaats als nieuw. Bekijk hieronder hoe wij stap voor stap te werk gaan, en vergelijk zelf het verschil met de interactieve voor-en-na-slider.
      </p>

      <!-- Interactive Slideshow Section (Revisie stappen) -->
      <div style="display: flex; gap: 32px; align-items: center; background-color: var(--color-cream-dark); padding: 32px; border-radius: var(--radius-lg); margin: 32px 0 50px 0; flex-wrap: wrap;">
        <!-- Left Side: Interactive Slideshow -->
        <div style="position: relative; width: 180px; height: 240px; flex-shrink: 0; margin: 0 auto;">
          <img id="revisieSlideImg" src="<?php echo get_theme_asset_url('revisie_stap3.jpg'); ?>" alt="Revisieproces stap 1" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-md); border: 3px solid var(--color-light); box-shadow: 0 4px 15px rgba(0,0,0,0.1); box-sizing: border-box; transition: opacity 0.2s ease;">
          <div style="position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 12px; background-color: rgba(0,0,0,0.65); padding: 6px 12px; border-radius: var(--radius-full); backdrop-filter: blur(4px); color: var(--color-light); font-size: 0.8rem; z-index: 10; user-select: none;">
            <button id="prevSlideBtn" style="color: white; font-weight: bold; padding: 0 4px; background: none; border: none; cursor: pointer; font-size: 0.9rem;">❮</button>
            <span id="revisieSlideCounter" style="font-weight: 600; min-width: 32px; text-align: center;">1 / 4</span>
            <button id="nextSlideBtn" style="color: white; font-weight: bold; padding: 0 4px; background: none; border: none; cursor: pointer; font-size: 0.9rem;">❯</button>
          </div>
        </div>

        <!-- Right Side: Content Details -->
        <div style="flex: 1; min-width: 280px;">
          <span class="section-tag" style="color: var(--color-terracotta); margin-bottom: 8px; font-size: 0.8rem; display: inline-block;">Revisie in beeld</span>
          <h3 id="revisieSlideTitle" style="color: var(--color-forest-dark); font-size: 1.5rem; margin: 0 0 4px 0; font-family: var(--font-heading);">Stap 1: Volledig strippen van het frame</h3>
          <p id="revisieSlideSub" style="font-size: 0.95rem; font-weight: 600; color: var(--color-forest); margin-bottom: 12px;">Grondige reiniging en controle van mechaniek</p>
          <p id="revisieSlideDesc" style="font-size: 0.95rem; line-height: 1.7; color: var(--color-dark); margin: 0;">
            We strippen de stoel volledig tot op het metalen basisframe. De motoren, kabels en de elektronische besturing worden grondig gecontroleerd, gereinigd en getest. Eventuele versleten bedrading of zwakke componenten worden direct vervangen.
          </p>
        </div>
      </div>

      <!-- Before / After Interactive Slider Section -->
      <div style="margin-bottom: 50px;">
        <span class="section-tag" style="color: var(--color-terracotta); margin-bottom: 12px; font-size: 0.8rem; display: inline-block;">Vergelijk Oud & Nieuw</span>
        <h3 style="color: var(--color-forest-dark); font-size: 1.5rem; margin: 0 0 16px 0; font-family: var(--font-heading);">Interactieve Voor- en Na-vergelijking</h3>
        <p style="margin-bottom: 24px; color: var(--color-gray); font-size: 0.95rem; line-height: 1.6;">
          Versleep de hendel in het midden van de afbeelding om het verschil te zien tussen een gebruikte stoel en het volledig gereviseerde eindresultaat.
        </p>
        <div class="slider-wrapper" id="sliderWrapper">
          <!-- Before slide (Old state) -->
          <div class="slider-img slider-before">
            <div class="slider-content-inner">
              <span class="slider-text-badge">Voor revisie (Oud model)</span>
            </div>
          </div>

          <!-- After slide (New state) -->
          <div class="slider-img slider-after" id="sliderAfterImage">
            <div class="slider-content-inner">
              <span class="slider-text-badge">Na Revisie (Als Nieuw)</span>
            </div>
          </div>

          <!-- Slider Bar and Control Handle -->
          <div class="slider-handle" id="sliderHandle">
            <div class="slider-handle-button">↔</div>
          </div>
        </div>
      </div>

      <h2 class="section-title text-center" style="font-size: 1.85rem; margin-top: 40px; margin-bottom: 40px; color: var(--color-forest);">Hoe wij A-merken reviseren</h2>

      <!-- Timeline explaining the process steps -->
      <div class="timeline">
        <div class="timeline-card">
          <div class="timeline-number">1</div>
          <h3 class="timeline-title">Grondige Inspectie</h3>
          <p class="timeline-desc">Het frame, de motoren en de mechanische delen van A-merk stoelen (zoals Fitform en Doge) worden volledig doorgemeten en getest.</p>
        </div>
        <div class="timeline-card">
          <div class="timeline-number">2</div>
          <h3 class="timeline-title">Complete Vernieuwing</h3>
          <p class="timeline-desc">Alle schuimdelen en de bekleding worden volledig vervangen door gecertificeerde, hoogwaardige en makkelijk te reinigen materialen.</p>
        </div>
        <div class="timeline-card">
          <div class="timeline-number">3</div>
          <h3 class="timeline-title">Ergonomische Afstelling</h3>
          <p class="timeline-desc">Onze BewegingsTechnologen stellen de stoel bij aflevering exact in op uw zithoogte, zitdiepte en armleggerhoogte.</p>
        </div>
      </div>

      <!-- CTA block -->
      <div style="margin-top: 60px; background-color: var(--color-forest); color: var(--color-light); padding: 48px; border-radius: var(--radius-lg); text-align: center;">
        <h2 style="color: var(--color-light); font-size: 1.75rem; margin-top: 0; margin-bottom: 16px;">Wilt u het comfort zelf ervaren?</h2>
        <p style="color: rgba(255,255,255,0.8); max-width: 600px; margin: 0 auto 32px auto;">
          U bent van harte welkom in onze showroom in Dordrecht om onze stoelen te proberen. Bent u minder mobiel? Dan komen onze adviseurs ook graag bij u langs voor een passing aan huis.
        </p>
        <a href="<?php echo home_url('/afspraak-inplannen/'); ?>" class="btn btn-secondary">Plan een Adviesgesprek</a>
      </div>
    </div>
  </section>

  <!-- Footer Section -->
  <footer>
    <div class="container footer-grid">
      <div class="footer-col">
        <h3 style="color: var(--color-light);">staopstoelen.nl</h3>
        <p style="font-size: 0.9rem; color: rgba(255,255,255,0.6); margin-top: 16px; line-height: 1.6;">
          Specialist in premium gereviseerde A-merk sta-op stoelen op maat. Duurzaam, comfortabel en betaalbaar.
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

  <script src="<?php echo get_stylesheet_directory_uri(); ?>/app.js"></script>
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
      const slideCounter = document.getElementById('revisieSlideCounter');
      const slideTitle = document.getElementById('revisieSlideTitle');
      const slideSub = document.getElementById('revisieSlideSub');
      const slideDesc = document.getElementById('revisieSlideDesc');
      const prevBtn = document.getElementById('prevSlideBtn');
      const nextBtn = document.getElementById('nextSlideBtn');

      // Initialize counter dynamically on load
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
</body>
</html>
