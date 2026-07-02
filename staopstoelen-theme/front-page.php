<?php
/* Template Name: Homepage Template */
?>
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gereviseerde Sta-op Stoelen & Seniorenstoelen | Showroom Dordrecht</title>
  <meta name="description" content="Op zoek naar een op maat gemaakte, gereviseerde sta-op stoel? Bezoek onze showroom in Dordrecht of plan een gratis thuispassing. ✓ 100% Duurzaam ✓ 2 Jaar Garantie.">
  <link rel="apple-touch-icon" sizes="180x180" href="<?php echo get_stylesheet_directory_uri(); ?>/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="<?php echo get_stylesheet_directory_uri(); ?>/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="<?php echo get_stylesheet_directory_uri(); ?>/favicon-16x16.png">
  <link rel="manifest" href="<?php echo get_stylesheet_directory_uri(); ?>/site.webmanifest">
  <link rel="stylesheet" href="<?php echo get_stylesheet_directory_uri(); ?>/style.css?v=1.0.51">
  <!-- Schema.org LocalBusiness Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "staopstoelen.nl",
    "image": "https://staopstoelen.nl/assets/showroom.jpg",
    "@id": "https://staopstoelen.nl/#localbusiness",
    "url": "https://staopstoelen.nl/",
    "telephone": "+31786314858",
    "email": "info@schippercompactwonen.nl",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Merwedestraat 239",
      "addressLocality": "Dordrecht",
      "postalCode": "3313 GT",
      "addressCountry": "NL"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 51.8184,
      "longitude": 4.6990
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday"
        ],
        "opens": "10:00",
        "closes": "16:00"
      }
    ]
  }
  </script>
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
          <a href="<?php echo home_url('/revisieproces/'); ?>" id="linkRevisie">Revisieproces</a>
          <a href="<?php echo home_url('/klantverhalen/'); ?>" id="linkKlantverhalen">Ervaringen</a>
          <a href="<?php echo home_url('/faq/'); ?>" id="linkFaq">FAQ</a>
          <a href="<?php echo home_url('/over-ons/'); ?>" id="linkOverOns">Over Ons</a>
          <a href="<?php echo home_url('/afspraak-inplannen/'); ?>" class="nav-desktop-hide" id="linkAfspraak">Afspraak Maken</a>
        </nav>
        
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="hero">
    <div class="bg-accent-blob"></div>
    <div class="container hero-grid">
      <div class="hero-content">
        <div class="hero-tag" id="heroTag">
          <span>🌿</span> 100% Duurzaam Gereviseerd & Op Maat
        </div>
        <h1 class="hero-title" id="heroTitle">
          Sta-op Stoelen<br><span>op Maat</span>
        </h1>
        <p class="hero-subtitle" style="font-size: 1.25rem; font-weight: 600; color: var(--color-forest-dark); margin-bottom: 16px;">Vindt u goed zitcomfort belangrijk? Wij ook!</p>
        <p class="hero-description" id="heroDesc">
          Goed zitten is een vaak onderschatte factor die bijdraagt aan uw gezondheid. Als u intensief gebruik maakt van uw stoel, dan moet de stoel u ook goed passen. 
          Net zoals bij schoenen of een maatkostuum, kunnen wij een stoel helemaal aanpassen aan uw persoonlijke maten en wensen.
        </p>
        <div class="hero-buttons" id="heroButtons">
          <a href="<?php echo home_url('/keuzehulp/'); ?>" class="btn btn-secondary" id="btnHeroWizard">Start de Keuzehulp</a>
          <a href="<?php echo home_url('/afspraak-inplannen/'); ?>" class="btn btn-outline" id="btnHeroAppointment">Adviesgesprek Plannen</a>
        </div>
        <div class="hero-stats" id="heroStats">
          <div class="stat-item">
            <div class="stat-number">4.8/5</div>
            <p>Klanttevredenheid</p>
          </div>
          <div class="stat-item">
            <div class="stat-number">100%</div>
            <p>Gereviseerd & Duurzaam</p>
          </div>
          <div class="stat-item">
            <div class="stat-number">2 Jaar</div>
            <p>Volledige Garantie</p>
          </div>
        </div>
      </div>
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
        
        <!-- Slideshow Controls -->
        <button class="slideshow-ctrl ctrl-prev" id="slideshowPrev" aria-label="Vorige afbeelding">&#10094;</button>
        <button class="slideshow-ctrl ctrl-next" id="slideshowNext" aria-label="Volgende afbeelding">&#10095;</button>
        
        <!-- Slideshow Dots Indicator -->
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
    </div>
  </section>

  <!-- Keuzehulp Wizard Section -->
  <section id="keuzehulp" class="bg-alt" style="padding: 80px 0;">
    <div class="container">
      <div class="text-center" style="max-width: 750px; margin: 0 auto;">
        <span class="section-tag">Vind Uw Match</span>
        <h2 class="section-title">Ontdek Welke Sta-op Stoel Bij U Past</h2>
        <p class="section-subtitle" style="margin-bottom: 32px;">Beantwoord 3 eenvoudige vragen over uw lichaamsbouw en wensen. Onze interactieve Keuzehulp adviseert direct welke gereviseerde sta-op stoel het beste bij u past.</p>
        <a href="<?php echo home_url('/keuzehulp/'); ?>" class="btn btn-secondary">Start de Keuzehulp →</a>
      </div>
    </div>
  </section>

  <!-- Revisieproces Before/After Slider Section -->
  <section id="revisie" style="padding: 80px 0;">
    <div class="container">
      <div class="text-center" style="max-width: 750px; margin: 0 auto;">
        <span class="section-tag">Als Nieuw</span>
        <h2 class="section-title">Het Unieke Revisieproces</h2>
        <p class="section-subtitle" style="margin-bottom: 32px;">Wij transformeren gebruikte A-merk sta-op stoelen tot prachtige, als-nieuwe exemplaren. Bekijk het proces en ontdek hoe we vulling, bekleding en motoren volledig vernieuwen.</p>
        <a href="<?php echo home_url('/revisieproces/'); ?>" class="btn btn-primary">Bekijk het Revisieproces →</a>
      </div>
    </div>
  </section>

  <!-- Social Proof / Customer Stories -->
  <section id="klantverhalen" class="bg-alt" style="padding: 80px 0;">
    <div class="container">
      <div class="text-center" style="max-width: 750px; margin: 0 auto;">
        <span class="section-tag">Klantverhalen</span>
        <h2 class="section-title">Ervaringen met Onze Seniorenstoelen</h2>
        <p class="section-subtitle" style="margin-bottom: 32px;">Wij helpen dagelijks mensen hun zelfstandigheid en comfort terug te krijgen. Lees hier de ervaringen van onze klanten met passingen aan huis en maatwerkafstellingen.</p>
        <a href="<?php echo home_url('/klantverhalen/'); ?>" class="btn btn-secondary">Lees alle Ervaringen →</a>
      </div>
    </div>
  </section>

  <!-- Live appointment scheduler -->
  <section id="afspraak-planner" style="padding: 80px 0;">
    <div class="container">
      <div class="text-center" style="max-width: 750px; margin: 0 auto;">
        <span class="section-tag">Direct Boeken</span>
        <h2 class="section-title">Plan een Adviesgesprek</h2>
        <p class="section-subtitle" style="margin-bottom: 32px;">Breng een bezoek aan onze showroom in Dordrecht of kies voor een gratis passing bij u thuis met 3 verschillende modellen. Plan uw afspraak direct online in.</p>
        <a href="<?php echo home_url('/afspraak-inplannen/'); ?>" class="btn btn-primary">Maak een Afspraak →</a>
      </div>
    </div>
  </section>


  <!-- Local SEO / Info Section -->
  <section style="padding: 60px 0;">
    <div class="container" style="max-width: 800px; text-align: center;">
      <h3 style="font-size: 1.5rem; margin-bottom: 12px;">Probeer een sta-op stoel in de regio Dordrecht & Rotterdam</h3>
      <p style="color: var(--color-gray); font-size: 1rem; line-height: 1.7;">
        U bent van harte welkom in onze showroom in Dordrecht voor deskundig zitadvies en het testen van onze sta-op stoelen. Woont u in de regio Dordrecht, Rotterdam of omstreken en bent u minder mobiel? Dan komen onze adviseurs kosteloos en vrijblijvend bij u thuis langs met een selectie stoelen om rustig in uw eigen huiskamer te testen.
      </p>
    </div>
  </section>

  <!-- Footer Section -->
  <footer>
    <div class="container footer-grid">
      <div class="footer-col">
        <h3 style="color: var(--color-light);">staopstoelen.nl</h3>
        <p style="font-size: 0.9rem; color: rgba(255,255,255,0.6); margin-top: 16px; line-height: 1.6;">
          Specialist in premium gereviseerde A-merk sta-op stoelen op maat. Duurzaam, comfortabel and betaalbaar.
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
</body>
</html>
