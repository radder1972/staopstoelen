// Google Calendar Webhook URL Configuration (Google Apps Script Web App)
// Configure this with your deployed Apps Script Web App URL to automatically push bookings to Google Calendar.
const GOOGLE_CALENDAR_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwyRN-iLM83LFZ4hZ08jzwpMdeHI6o5kU5fr0Bz2KpmOuG3XP5y_4zbyE2cO45WCdNN/exec";

// Google Calendar Live Availability Get URL (Google Apps Script Web App)
// Configure this with your deployed Apps Script Web App URL to retrieve real-time busy slots.
const GOOGLE_CALENDAR_GET_SLOTS_URL = "https://script.google.com/macros/s/AKfycbwyRN-iLM83LFZ4hZ08jzwpMdeHI6o5kU5fr0Bz2KpmOuG3XP5y_4zbyE2cO45WCdNN/exec";

// Global Image Fit & Visibility Helper
window.adjustImageFit = function(img) {
  if (img) {
    img.style.opacity = '1';
    img.style.maxHeight = '100%';
    img.style.maxWidth = '100%';
    img.style.objectFit = 'contain';
  }
};

// Admin & Self-Visit Exclusion Manager
// Prevents owner / test visits from polluting both internal statistics and Google Analytics 4
(function initAdminExclusion() {
  try {
    const params = new URLSearchParams(window.location.search);
    // Explicit opt-out via URL query param: ?negeer_bezoek=1 or ?admin_filter=1
    if (params.get('negeer_bezoek') === '1' || params.get('admin_filter') === '1') {
      localStorage.setItem('staopstoelen_ignore_analytics', 'true');
      document.cookie = "staopstoelen_ignore_analytics=true; path=/; max-age=31536000; SameSite=Lax";
      alert("✓ Eigen bezoeken worden vanaf nu NIET meer meegeteld in de statistieken op dit apparaat.");
    } else if (params.get('negeer_bezoek') === '0') {
      localStorage.removeItem('staopstoelen_ignore_analytics');
      document.cookie = "staopstoelen_ignore_analytics=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      alert("✓ Eigen bezoeken worden vanaf nu WEER geteld.");
    }

    // Auto-opt-out when visiting beheer.html or if logged into admin session
    if (window.location.pathname.includes('beheer.html') || sessionStorage.getItem('adminLoggedIn') === 'true') {
      localStorage.setItem('staopstoelen_ignore_analytics', 'true');
      document.cookie = "staopstoelen_ignore_analytics=true; path=/; max-age=31536000; SameSite=Lax";
    }

    // Disable Google Analytics & Google Ads tags if excluded
    if (localStorage.getItem('staopstoelen_ignore_analytics') === 'true' || document.cookie.indexOf('staopstoelen_ignore_analytics=true') !== -1) {
      window['ga-disable-G-5KQF1CELDD'] = true;
      window['ga-disable-AW-923357429'] = true;
      window['ga-disable-AW-18540486129'] = true;
    }
  } catch (e) {
    console.warn("Exclusion init:", e);
  }
})();

// Local Visit & Event Tracking Logger
function logCustomVisitEvent(eventName = 'pageview', extraData = {}) {
  try {
    // Ignore logging admin dashboard views and excluded devices (own visits)
    if (window.location.pathname.includes('beheer.html') ||
        sessionStorage.getItem('adminLoggedIn') === 'true' ||
        localStorage.getItem('staopstoelen_ignore_analytics') === 'true' ||
        document.cookie.indexOf('staopstoelen_ignore_analytics=true') !== -1) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    
    // Auto-detect Google Ads and Marktplaats visits even if explicit UTM params are absent
    const isGoogleAds = params.has('gclid') || params.has('gad_source') || params.has('gbraid') || params.has('wbraid');
    const isMarktplaats = (document.referrer && document.referrer.includes('marktplaats.nl')) || params.get('utm_source') === 'marktplaats';
    
    let utmSource = (extraData && extraData.utm_source) || params.get('utm_source') || '';
    if (!utmSource && isGoogleAds) utmSource = 'google_ads';
    if (!utmSource && isMarktplaats) utmSource = 'marktplaats';
    
    let utmMedium = (extraData && extraData.utm_medium) || params.get('utm_medium') || '';
    if (!utmMedium && isGoogleAds) utmMedium = 'cpc';
    if (!utmMedium && isMarktplaats) utmMedium = 'referral';

    let utmCampaign = (extraData && (extraData.utm_campaign || extraData.topic)) || params.get('utm_campaign') || '';
    if (!utmCampaign && isGoogleAds) utmCampaign = 'sta-op-stoelen-search';
    if (!utmCampaign && isMarktplaats) utmCampaign = 'marktplaats-pro';

    const logData = {
      page_url: (extraData && extraData.page_url) || (window.location.pathname + window.location.hash),
      referrer_url: document.referrer || '',
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      device_type: window.innerWidth < 768 ? 'mobile' : (window.innerWidth < 1024 ? 'tablet' : 'desktop'),
      event_name: eventName
    };
    
    // Always use absolute origin path so visits on /stoelen/*.html never fail via relative path
    const apiEndpoint = window.location.origin + '/api/log_visit.php';
    
    fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch(err => console.warn('Logging error:', err));
  } catch (e) {
    console.warn('Logging failed:', e);
  }
}

// Digitale Zitassistent Telemetrie & Analytics Tracker
function trackAssistantEvent(action, details = {}) {
  try {
    // 1. Google Analytics 4 (GA4) Event
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'assistant_' + action, {
        event_category: 'Digitale Zitassistent',
        event_label: details.label || details.query || details.topic || details.cta || action,
        value: details.value || 1,
        assistant_action: action,
        assistant_topic: details.topic || '',
        assistant_query: details.query || '',
        assistant_cta: details.cta || ''
      });
    }

    // 2. Database backend visit logging
    if (typeof logCustomVisitEvent === 'function') {
      logCustomVisitEvent('assistant_' + action, {
        utm_campaign: (details.topic || details.query || details.cta || action).substring(0, 50),
        page_url: window.location.pathname + '#zitassistent'
      });
    }

    // 3. Local aggregation in localStorage (voor live weergave in beheer.html)
    try {
      const statsKey = 'staopstoelen_assistant_stats';
      let stats = JSON.parse(localStorage.getItem(statsKey) || '{"opens":0,"queries":0,"ctas":0,"lastActive":null,"recentQueries":[]}');
      if (action === 'open') {
        stats.opens = (stats.opens || 0) + 1;
      } else if (action === 'query') {
        stats.queries = (stats.queries || 0) + 1;
        const qText = (details.query || details.topic || '').trim();
        if (qText) {
          stats.recentQueries = stats.recentQueries || [];
          if (!stats.recentQueries.includes(qText)) {
            stats.recentQueries.unshift(qText);
            if (stats.recentQueries.length > 10) stats.recentQueries.pop();
          }
        }
      } else if (action === 'cta_click') {
        stats.ctas = (stats.ctas || 0) + 1;
      }
      stats.lastActive = new Date().toISOString();
      localStorage.setItem(statsKey, JSON.stringify(stats));
    } catch (lsErr) {}
  } catch (err) {
    console.warn('trackAssistantEvent error:', err);
  }
}
window.trackAssistantEvent = trackAssistantEvent;

// Google Ads Conversion & Event Tracking (AW-923357429)
// Er worden twee Google Ads-accounts gemeten: het oorspronkelijke account (AW-923357429)
// en het account van Campaign #1 (AW-18540486129). Conversies worden naar elk account
// gestuurd waarvoor een label is ingevuld.
const GOOGLE_ADS_CONFIG = {
  id: 'AW-923357429',
  labels: {
    appointment: 'WfpDCLCA1psdEPWhpbgD', // Leadformulier indienen conversie
    phone: '',                           // Optioneel: vul conversielabel in voor bellen
    whatsapp: ''                         // Optioneel: vul conversielabel in voor WhatsApp
  }
};

const GOOGLE_ADS_CONFIG_CAMPAIGN = {
  id: 'AW-18540486129',
  labels: {
    appointment: '', // Vul conversielabel in (Google Ads -> Doelen -> Conversies)
    phone: '',       // Vul conversielabel in voor bellen
    whatsapp: ''     // Vul conversielabel in voor WhatsApp
  }
};

function trackGoogleAdsConversion(conversionType, details = {}) {
  try {
    if (typeof window.gtag === 'function') {
      const targets = [GOOGLE_ADS_CONFIG, GOOGLE_ADS_CONFIG_CAMPAIGN]
        .filter(cfg => cfg.labels[conversionType])
        .map(cfg => `${cfg.id}/${cfg.labels[conversionType]}`);
      // Zonder enig label blijft het oorspronkelijke gedrag behouden (alleen account-ID)
      const sendTo = targets.length === 0 ? GOOGLE_ADS_CONFIG.id : (targets.length === 1 ? targets[0] : targets);
      
      // Google Ads Conversie Gebeurtenis
      window.gtag('event', 'conversion', {
        send_to: sendTo,
        event_category: details.event_category || 'Lead',
        event_label: details.event_label || conversionType,
        value: details.value || 1.0,
        currency: details.currency || 'EUR'
      });

      // Google Standaard Lead Gebeurtenis
      window.gtag('event', 'generate_lead', {
        event_category: details.event_category || 'Lead',
        event_label: details.event_label || conversionType,
        value: details.value || 1.0,
        currency: details.currency || 'EUR'
      });

      // Eigen GA4-gebeurtenis per actie, zodat die in Google Ads als conversie te importeren is
      const ga4EventNames = {
        appointment: 'Contactformulier_ingevuld',
        phone: 'phone_click',
        whatsapp: 'whatsapp_click'
      };
      if (ga4EventNames[conversionType]) {
        window.gtag('event', ga4EventNames[conversionType], {
          event_category: details.event_category || 'Lead',
          event_label: details.event_label || conversionType
        });
      }

      console.log(`[Google Ads] Conversie geregistreerd: ${conversionType}`, details);
    }
  } catch (err) {
    console.warn('[Google Ads] Tracking fout:', err);
  }
}

// Global click tracker for phone calls (078) & WhatsApp
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;

  const href = link.getAttribute('href') || '';
  
  // Telefoonklik (078 - 631 4858)
  if (href.startsWith('tel:')) {
    if (typeof logCustomVisitEvent === 'function') {
      logCustomVisitEvent('phone_call', { phone: href.replace('tel:', '') });
    }
    trackGoogleAdsConversion('phone', {
      event_category: 'Contact',
      event_label: 'Bellen: ' + href.replace('tel:', '')
    });
  }
  
  // WhatsApp klik
  if (href.includes('wa.me') || href.includes('whatsapp.com')) {
    if (typeof logCustomVisitEvent === 'function') {
      logCustomVisitEvent('whatsapp_click');
    }
    trackGoogleAdsConversion('whatsapp', {
      event_category: 'Contact',
      event_label: 'WhatsApp Chat'
    });
  }
});

// Log pageview (strictly once per page load)
if (!window._pageviewLogged) {
  window._pageviewLogged = true;
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
      logCustomVisitEvent('pageview');
    });
  } else {
    logCustomVisitEvent('pageview');
  }
}

// Database of available lift chairs (revised premium models)
const CHAIR_DATABASE = [
  {
    id: "fitform-570-modern",
    name: "Fitform 570 Elegance (Maat S/M/L)",
    brand: "Fitform",
    price: "€ 1.250,-",
    basePrice: 1250,
    sizes: ["small", "medium", "large"],
    motors: [3],
    modern: true,
    features: [
      "Individueel instelbare zithoogte, zitdiepte en armleggers",
      "3 motoren: onafhankelijke rug- & voetenverstelling + kantelfunctie",
      "Ergonomische lendensteun ter preventie van lage rugpijn",
      "Inclusief verstelbare topswing hoofdondersteuning"
    ],
    suitability: "Ideaal bij rug- en nekklachten door de onafhankelijke motorische sturing.",
    emoji: "🛋️",
    image: "assets/fitform_570_elegance.png",
    badge: "Populairste Keuze"
  },
  {
    id: "doge-belluno-comfort",
    name: "Doge Belluno Royal",
    brand: "Doge",
    price: "€ 1.390,-",
    basePrice: 1390,
    sizes: ["medium", "large"],
    motors: [3],
    modern: false,
    features: [
      "Hart-lig-stand: benen hoger dan het hart ter voorkoming van vochtophoping",
      "Extreem stabiele sta-op ondersteuning (tot 150 kg)",
      "Luxe rundlederen bekleding, eenvoudig schoon te maken",
      "Zeer geschikte ondersteuning bij verminderde spierkracht"
    ],
    suitability: "Aanbevolen bij vochtophoping in de benen en zware mobiliteitsklachten.",
    emoji: "💺",
    image: "assets/doge_belluno_royal.png",
    badge: "Extra Comfort"
  },
  {
    id: "prominent-classic-duo",
    name: "Prominent Classic Duo-Motor",
    brand: "Prominent",
    price: "€ 890,-",
    basePrice: 890,
    sizes: ["small", "medium"],
    motors: [1],
    modern: true,
    features: [
      "Eenvoudige bediening met 2 knoppen op de afstandsbediening",
      "Gecombineerde rug- en voetensteun beweging",
      "Strak modern design in zandkleurig weefstof",
      "Ideaal voor incidenteel gebruik en ontspanning"
    ],
    suitability: "Uitstekend budgetvriendelijk model voor algemene ondersteuning bij opstaan.",
    emoji: "🛋️",
    image: "assets/prominent_classic.png",
    badge: "Beste Prijs"
  },
  {
    id: "fitform-582-cozy",
    name: "Fitform 582 Cozy (Boho Editie)",
    brand: "Fitform",
    price: "€ 1.450,-",
    basePrice: 1450,
    sizes: ["small", "medium", "large"],
    motors: [3],
    modern: true,
    features: [
      "Nieuw bekleed met een trendy Boho-jungle structuurstof",
      "Optimale lenden- en nekondersteuning (topswing)",
      "Volledige relax- en ligstand (3-motorig)",
      "Unieke 100% bacterie-werende schuimkern"
    ],
    suitability: "De perfecte combinatie van modern interieurdesign en maximale ergonomie.",
    emoji: "🌿",
    image: "assets/fitform_582_cozy.png",
    badge: "Design Trend"
  }
];

// App State
const state = {
  // Wizard State
  wizardStep: 1,
  wizardAnswers: {
    height: "medium",
    complaints: [],
    motors: "3",
    modern: false
  },
  
  // Dynamic chairs list loaded from database/fallback
  chairs: [],

  // Before/After Slider State
  isDraggingSlider: false,
  sliderPct: 50,
  
  // Booking Calendar State
  appointmentType: "showroom", // "home" or "showroom"
  currentDate: new Date(), // Live current date
  selectedDate: null,
  selectedTimeSlot: null,
  timeSlots: ["10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00"]
};

// Initialize state.chairs with a translation of CHAIR_DATABASE to database schema directly as a fallback
state.chairs = CHAIR_DATABASE.map(c => ({
  id: c.id,
  name: c.name,
  brand: c.brand,
  price: parseInt(c.price.replace(/[^\d]/g, "")) || c.basePrice || 995,
  description: c.suitability + " " + c.features.join(" "),
  badge: c.badge,
  image: c.image,
  condition: "occasion",
  type: "staop",
  status: "beschikbaar"
}));

// Load chairs dynamically from localStorage and API
async function loadWizardChairs() {
  // 1. Try localStorage
  let storedData = null;
  try {
    storedData = JSON.parse(localStorage.getItem("admin_staopstoelen"));
  } catch (e) {
    console.warn("Fout bij het laden van stoelen uit localStorage:", e);
  }
  
  if (storedData && storedData.length > 0) {
    state.chairs = storedData;
    console.log("Dynamische stoelen geladen uit localStorage:", state.chairs.length);
  }
  
  // 2. Try API
  try {
    const API_URL = "api/chairs.php";
    const response = await fetch(API_URL);
    if (response.ok) {
      const dbData = await response.json();
      if (dbData && dbData.staopstoelen) {
        state.chairs = dbData.staopstoelen;
        console.log("Dynamische stoelen geladen van API server:", state.chairs.length);
        // Sync to localStorage
        localStorage.setItem("admin_staopstoelen", JSON.stringify(dbData.staopstoelen));
      }
    }
  } catch (e) {
    console.warn("Fout bij verbinden met API server. Teruggevallen op offline stoelgegevens.", e);
  }
}

// DOM Elements Initialization Helper
function initializeApp() {
  // Initialize Components
  if (typeof initWizard === 'function') initWizard();
  if (typeof initSlider === 'function') initSlider();
  if (typeof initCalendar === 'function') initCalendar();
  if (typeof initAppointmentModal === 'function') initAppointmentModal();
  if (typeof initMarktplaatsExperience === 'function') initMarktplaatsExperience();
  if (typeof initFloatingMenu === 'function') initFloatingMenu();
  if (typeof initMobileMenu === 'function') initMobileMenu();
  if (typeof initHeroSlideshow === 'function') initHeroSlideshow();
  if (typeof initFaqAccordion === 'function') initFaqAccordion();

  // Check for prefilled chair selection
  const prefilled = localStorage.getItem("prefilledChair");
  if (prefilled) {
    const notesField = document.getElementById("bookingNotes");
    if (notesField) {
      notesField.value = `Ik wil deze stoel graag uitproberen tijdens mijn afspraak: ${prefilled}.`;
      localStorage.removeItem("prefilledChair");
      
      // Smooth scroll to the appointment planner
      const planner = document.getElementById("afspraak-planner");
      if (planner) {
        setTimeout(() => {
          planner.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    }
  }

  // Check for auto-open modal query or hash
  if (window.location.hash === "#afspraak" || window.location.search.includes("openAfspraak=true")) {
    setTimeout(() => {
      if (typeof openAppointmentModal === "function") openAppointmentModal();
    }, 200);
  }
}

function initHeroSlideshow() {
  const container = document.getElementById("heroImageContainer");
  if (!container) return;

  const slides = container.querySelectorAll(".hero-slide");
  const prevBtn = document.getElementById("slideshowPrev");
  const nextBtn = document.getElementById("slideshowNext");
  const dots = container.querySelectorAll(".slide-dot");

  if (slides.length === 0) return;

  let currentSlide = 0;
  let slideInterval = null;
  const slideDuration = 5000; // 5 seconds

  function updateSlideshowActieBadge(activeSlide) {
    const badge = document.querySelector(".slideshow-actie-badge");
    if (!badge) return;
    const isFitform = Boolean(
      activeSlide && (
        activeSlide.getAttribute("data-brand") === "fitform" ||
        (activeSlide.querySelector(".slide-caption") && activeSlide.querySelector(".slide-caption").textContent.toLowerCase().includes("fitform"))
      )
    );
    if (isFitform) {
      badge.classList.add("is-visible");
    } else {
      badge.classList.remove("is-visible");
    }
  }
  window.updateSlideshowActieBadge = updateSlideshowActieBadge;

  function showSlide(index) {
    // Wrap index
    if (index >= slides.length) {
      currentSlide = 0;
    } else if (index < 0) {
      currentSlide = slides.length - 1;
    } else {
      currentSlide = index;
    }

    // Update slides visibility
    slides.forEach((slide, i) => {
      if (i === currentSlide) {
        slide.classList.add("active");
      } else {
        slide.classList.remove("active");
      }
    });

    // Update dots status
    dots.forEach((dot, i) => {
      if (i === currentSlide) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });

    // Update Actie Badge visibility: only appear when active slide is a Fitform chair!
    updateSlideshowActieBadge(slides[currentSlide]);
  }

  function nextSlide() {
    showSlide(currentSlide + 1);
  }

  function prevSlide() {
    showSlide(currentSlide - 1);
  }

  function startTimer() {
    stopTimer();
    slideInterval = setInterval(nextSlide, slideDuration);
  }

  function stopTimer() {
    if (slideInterval) {
      clearInterval(slideInterval);
      slideInterval = null;
    }
  }

  // Event Listeners for Controls
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      prevSlide();
      startTimer(); // Reset timer on interaction
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      nextSlide();
      startTimer(); // Reset timer on interaction
    });
  }

  // Event Listeners for Dots
  dots.forEach(dot => {
    dot.addEventListener("click", () => {
      const slideIndex = parseInt(dot.getAttribute("data-slide"));
      if (!isNaN(slideIndex)) {
        showSlide(slideIndex);
        startTimer(); // Reset timer on interaction
      }
    });
  });

  // Pause on hover
  container.addEventListener("mouseenter", stopTimer);
  container.addEventListener("mouseleave", startTimer);

  // Slide click navigation
  slides.forEach(slide => {
    slide.addEventListener("click", (e) => {
      if (e.target.closest(".slideshow-ctrl") || e.target.closest(".slideshow-actie-badge") || e.target.closest(".hero-expert-trust-pill")) return;
      const url = slide.getAttribute("data-url");
      if (url) {
        window.location.href = url;
      }
    });
  });

  // Secret Easter Egg for Geert's secret picture on double click
  slides.forEach(slide => {
    const img = slide.querySelector("img");
    if (img) {
      const originalSrc = img.src;
      const originalAlt = img.alt;
      img.addEventListener("dblclick", () => {
        if (img.src.includes("geert_secret.jpg")) {
          img.src = originalSrc;
          img.alt = originalAlt;
        } else {
          img.src = "assets/geert_secret.jpg";
          img.alt = "Geertjan zittend in een comfortabele sta-op stoel";
        }
      });
    }
  });

  // Start the slideshow auto-advance
  startTimer();
  updateSlideshowActieBadge(slides[currentSlide]);
}

// Robust DOM check
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}


/* ==========================================================================
   WIZARD COMPONENT LOGIC
   ========================================================================== */
function initWizard() {
  const nextBtn = document.getElementById("btnWizardNext");
  const backBtn = document.getElementById("btnWizardBack");
  const resetBtn = document.getElementById("btnWizardReset");
  const skipBtn = document.getElementById("btnWizardSkip");
  const form = document.getElementById("wizardForm");
  
  if (!nextBtn || !backBtn || !resetBtn || !form) return;
  
  // Load chairs dynamically when wizard is initialized
  loadWizardChairs().then(() => {
    updateLiveMatchCount();
  });
  
  // Track Option Card Selection
  function syncCardState(card, input) {
    if (!card || !input) return;
    if (input.type === "radio") {
      const name = input.name;
      document.querySelectorAll(`input[name="${name}"]`).forEach(sibling => {
        sibling.closest(".option-card")?.classList.remove("selected", "auto-selected");
      });
      if (input.checked) {
        card.classList.add("selected");
        // AUTO-ADVANCE: On Step 1 (height choice), advance automatically after 220ms
        if (name === "height" && state.wizardStep === 1) {
          card.classList.add("auto-selected");
          setTimeout(() => {
            updateWizardAnswersFromForm();
            goToWizardStep(2);
          }, 220);
        }
      }
    } else if (input.type === "checkbox") {
      if (input.checked) {
        card.classList.add("selected");
      } else {
        card.classList.remove("selected");
      }
    }
  }

  // Synchronize initial selections
  document.querySelectorAll(".option-card").forEach(card => {
    const input = card.querySelector("input");
    if (input && input.checked) {
      card.classList.add("selected");
    }
  });

  // Handle changes when inputs are selected or toggled
  form.addEventListener("change", (e) => {
    const input = e.target;
    if (!input || !(input.matches("input[type='radio']") || input.matches("input[type='checkbox']"))) return;
    const card = input.closest(".option-card");
    if (card) {
      syncCardState(card, input);
    }
    updateWizardAnswersFromForm();
    updateLiveMatchCount();
  });

  // Step Tabs Navigation
  document.querySelectorAll(".wizard-step-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const targetStep = parseInt(tab.dataset.step);
      if (targetStep) {
        updateWizardAnswersFromForm();
        goToWizardStep(targetStep);
      }
    });
  });

  // Next Step Click
  nextBtn.addEventListener("click", () => {
    updateWizardAnswersFromForm();
    if (state.wizardStep < 4) {
      goToWizardStep(state.wizardStep + 1);
    }
  });

  // Back Step Click
  backBtn.addEventListener("click", () => {
    if (state.wizardStep > 1) {
      goToWizardStep(state.wizardStep - 1);
    }
  });

  // Skip Step 2 (complaints)
  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      document.querySelectorAll('input[name="complaints"]').forEach(cb => {
        cb.checked = false;
        cb.closest(".option-card")?.classList.remove("selected");
      });
      updateWizardAnswersFromForm();
      goToWizardStep(3);
    });
  }

  // Reset Click
  resetBtn.addEventListener("click", () => {
    form.reset();
    document.querySelectorAll(".option-card").forEach(card => {
      const input = card.querySelector("input");
      if (input && input.checked) {
        card.classList.add("selected");
      } else {
        card.classList.remove("selected", "auto-selected");
      }
    });
    updateWizardAnswersFromForm();
    updateLiveMatchCount();
    goToWizardStep(1);
  });
}

function updateWizardAnswersFromForm() {
  const form = document.getElementById("wizardForm");
  if (!form) return;
  const formData = new FormData(form);
  
  state.wizardAnswers.height = formData.get("height") || "medium";
  state.wizardAnswers.motors = formData.get("motors") || "3";
  state.wizardAnswers.modern = formData.get("modern") === "true";
  state.wizardAnswers.wireless = formData.get("wireless") === "true";
  
  // Pas automatisch de video-variant (man/vrouw) aan op basis van gekozen lichaamslengte
  if (typeof window.setReneVisitorVariant === "function") {
    if (state.wizardAnswers.height === "small") {
      window.setReneVisitorVariant("vrouw");
    } else if (state.wizardAnswers.height === "large") {
      window.setReneVisitorVariant("man");
    }
  }

  // Get all checked complaints
  state.wizardAnswers.complaints = [];
  document.querySelectorAll('input[name="complaints"]:checked').forEach(cb => {
    state.wizardAnswers.complaints.push(cb.value);
  });
}

function countMatchingChairs() {
  if (!state.chairs || state.chairs.length === 0) return 18;
  const available = state.chairs.filter(c => c.status !== "verkocht" && c.status !== "gereserveerd");
  const height = state.wizardAnswers.height;
  
  if (!height) return available.length;
  
  const matching = available.filter(chair => {
    const descLower = (chair.description || "").toLowerCase();
    const brandLower = (chair.brand || "").toLowerCase();
    
    // Fitform and Doge are modular/adjustable and fit all sizes
    if (brandLower.includes("fitform") || brandLower.includes("doge") || descLower.includes("vario") || descLower.includes("modulair") || descLower.includes("instelbaar")) {
      return true;
    }
    if (height === "small") {
      return descLower.includes("maat s") || descLower.includes("small") || !descLower.includes("maat l");
    } else if (height === "large") {
      return descLower.includes("maat l") || descLower.includes("large") || !descLower.includes("maat s");
    }
    return true;
  });
  
  return Math.max(3, matching.length);
}

function updateLiveMatchCount() {
  const count = countMatchingChairs();
  const countEl = document.getElementById("liveMatchText");
  if (countEl) {
    countEl.innerHTML = `<strong>${count}</strong> modellen beschikbaar`;
  }
  
  const nextBtn = document.getElementById("btnWizardNext");
  if (nextBtn && state.wizardStep === 3) {
    nextBtn.innerHTML = `<span>Bekijk Resultaten & Advies (${count} stoelen)</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
  }
}

function goToWizardStep(step) {
  state.wizardStep = step;
  
  // Hide all steps & show active step
  document.querySelectorAll(".wizard-step").forEach(s => s.classList.remove("active"));
  const currentStepEl = document.getElementById(`step${step}`);
  if (currentStepEl) currentStepEl.classList.add("active");
  
  // Update step navigation tabs
  document.querySelectorAll(".wizard-step-tab").forEach((tab, idx) => {
    const tabStep = idx + 1;
    tab.classList.remove("active", "completed");
    if (tabStep < step) {
      tab.classList.add("completed");
    } else if (tabStep === step) {
      tab.classList.add("active");
    }
  });
  
  // Update Progress Track Bar width
  const progressPercent = ((step - 1) / 3) * 100;
  const progressBar = document.getElementById("progressBar");
  if (progressBar) {
    progressBar.style.width = `${progressPercent}%`;
  }
  
  // Toggle Nav Buttons & CTAs
  const nextBtn = document.getElementById("btnWizardNext");
  const backBtn = document.getElementById("btnWizardBack");
  const resetBtn = document.getElementById("btnWizardReset");
  const skipBtn = document.getElementById("btnWizardSkip");
  
  if (backBtn) {
    backBtn.style.display = (step > 1 && step < 4) ? "inline-flex" : "none";
  }
  if (skipBtn) {
    skipBtn.style.display = (step === 2) ? "inline-block" : "none";
  }
  
  if (step === 1) {
    if (nextBtn) {
      nextBtn.style.display = "inline-flex";
      nextBtn.innerHTML = `<span>Volgende stap</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
    }
    if (resetBtn) resetBtn.style.display = "none";
  } else if (step === 2) {
    if (nextBtn) {
      nextBtn.style.display = "inline-flex";
      nextBtn.innerHTML = `<span>Volgende: Techniek</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
    }
    if (resetBtn) resetBtn.style.display = "none";
  } else if (step === 3) {
    if (nextBtn) {
      nextBtn.style.display = "inline-flex";
      const matches = countMatchingChairs();
      nextBtn.innerHTML = `<span>Bekijk Resultaten & Advies (${matches} stoelen)</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
    }
    if (resetBtn) resetBtn.style.display = "none";
  } else if (step === 4) {
    if (nextBtn) nextBtn.style.display = "none";
    if (resetBtn) resetBtn.style.display = "inline-flex";
    
    // Render matching chairs
    renderWizardResults();
  }
}

// Helper to construct dynamic features/bullets for database chairs
function getChairFeatures(chair) {
  const features = [];
  const descLower = (chair.description || "").toLowerCase();
  const nameLower = (chair.name || "").toLowerCase();
  
  // 1. Brand, Model & Condition
  const conditionStr = chair.condition === "nieuw" ? "Nieuw" : "Gereviseerde occasion";
  features.push(`<strong>Merk:</strong> ${chair.brand} (${conditionStr})`);
  
  // 2. Material
  const materialStr = chair.material === "leer" ? "Luxe rundleder" : "Comfortabele meubelstof";
  features.push(`<strong>Bekleding:</strong> ${materialStr}`);
  
  // 3. Motors detection
  if (descLower.includes("4-motorig") || descLower.includes("4 motoren") || descLower.includes("4 afzonderlijke motoren") || nameLower.includes("4-motorig")) {
    features.push("4 motoren voor onafhankelijke rug-, voeten- en kantelbediening");
  } else if (descLower.includes("3-motorig") || descLower.includes("3 motoren") || descLower.includes("drie motoren") || nameLower.includes("3-motorig")) {
    features.push("3 motoren voor onafhankelijke rug-, voeten- en kantelbediening");
  } else if (descLower.includes("2-motorig") || descLower.includes("2 motoren") || descLower.includes("twee motoren") || nameLower.includes("2-motorig")) {
    features.push("2 motoren voor elektrische relax- en sta-op ondersteuning");
  } else if (descLower.includes("1-motorig") || descLower.includes("1 motor") || descLower.includes("één motor") || nameLower.includes("1-motorig")) {
    features.push("1 motor voor gecombineerde relax- en sta-op bediening");
  } else if (descLower.includes("zonder motoren") || descLower.includes("mechanische") || descLower.includes("geen motoren")) {
    features.push("Mechanische sta-op ondersteuning zonder snoeren");
  } else if (chair.brand === "Fitform" || chair.brand === "Doge") {
    features.push("3 motoren voor onafhankelijke rug-, voeten- en kantelbediening");
  } else {
    features.push("Elektrische sta-op ondersteuning en relaxverstelling");
  }
  
  // 4. Special features detection
  if (descLower.includes("lendensteun") || descLower.includes("lumbaalsteun") || descLower.includes("rugklacht") || descLower.includes("rugsteun")) {
    features.push("Ergonomische lendensteun ter preventie van rugpijn");
  } else if (descLower.includes("topswing") || descLower.includes("nekondersteuning") || descLower.includes("nekklacht") || descLower.includes("hoofdondersteuning")) {
    features.push("Inclusief verstelbare topswing hoofdondersteuning");
  } else if (descLower.includes("hart-lig") || descLower.includes("vocht") || descLower.includes("benen hoger")) {
    features.push("Hart-lig-stand ter voorkoming van vochtophoping in benen");
  } else if (descLower.includes("kantel") || descLower.includes("ligstand") || descLower.includes("relaxstand")) {
    features.push("Comfortabele relax- en ligstand (kantelfunctie)");
  } else if (descLower.includes("accu") || descLower.includes("batterij")) {
    features.push("Ingebouwde accu: draadloos overal in de kamer te plaatsen");
  } else if (descLower.includes("draaibaar") || descLower.includes("draaivoet")) {
    features.push("Draaibare voet met automatische beveiliging bij opstaan");
  }
  
  // Fallback if we have fewer than 3 features
  if (features.length < 3 && chair.description) {
    const sentences = chair.description.split(/[.!?]+/);
    if (sentences[0] && sentences[0].trim().length > 10) {
      features.push(sentences[0].trim() + ".");
    }
  }
  
  return features.slice(0, 4); // return max 4 features
}

// Helper to construct dynamic suitability description based on answers
function getChairSuitability(chair, height, complaints) {
  const parts = [];
  const brand = chair.brand;
  const descLower = (chair.description || "").toLowerCase();
  
  if (brand === "Fitform") {
    parts.push("Uiterst geschikt bij specifieke fysieke klachten dankzij de exacte instelbaarheid op maat.");
  } else if (brand === "Doge") {
    parts.push("Aanbevolen bij mobiliteitsklachten door de extreem stabiele sta-op ondersteuning.");
  } else {
    parts.push("Comfortabele fauteuil die uitstekende ergonomische ondersteuning biedt bij het opstaan.");
  }
  
  // Size match comment
  if (height === "small" && (descLower.includes("maat s") || descLower.includes("small"))) {
    parts.push("Ergonomische zithoogte & zitdiepte ter voorkoming van afknelling in de knieholtes.");
  } else if (height === "large" && (descLower.includes("maat l") || descLower.includes("large"))) {
    parts.push("Ruime zithoogte en rugondersteuning ter ondersteuning van een gezonde 90-graden zithouding.");
  }
  
  // Clinical red flags comments
  if (complaints.includes("edema") || complaints.includes("legs")) {
    parts.push("Ideaal bij oedeem en gezwollen benen door de hoogligging boven harthoogte.");
  }
  if (complaints.includes("decubitus")) {
    parts.push("Optimale drukverdeling ter preventie van decubitus bij langdurig zitten (>3 uur).");
  }
  if (complaints.includes("standing")) {
    parts.push("Krachtige en vloeiende sta-op ondersteuning zonder pijn of trekkracht van mantelzorger.");
  }
  
  return parts.join(" ");
}

// Helper to format price as localized Dutch currency (e.g. 1250 to € 1.250,-)
function formatPrice(priceVal) {
  if (typeof priceVal === 'string') return priceVal;
  const numPrice = parseInt(priceVal);
  if (isNaN(numPrice)) return `€ ${priceVal}`;
  return `€ ${numPrice.toLocaleString('nl-NL')},-`;
}

function renderWizardResults() {
  const resultsContainer = document.getElementById("wizardResults");
  if (!resultsContainer) return;
  resultsContainer.innerHTML = "";
  
  // Filtering variables
  const height = state.wizardAnswers.height;
  const complaints = state.wizardAnswers.complaints || [];
  const motorsWanted = parseInt(state.wizardAnswers.motors);
  const modernWanted = state.wizardAnswers.modern;
  const wirelessWanted = state.wizardAnswers.wireless;

  // 1. Interactive Choice Summary Strip (Clickable chips to quickly adjust any answer)
  const summaryStrip = document.createElement("div");
  summaryStrip.className = "results-summary-strip";
  summaryStrip.style.cssText = "grid-column: 1 / -1;";

  const editPencilSvg = `<span class="chip-edit" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></span>`;

  const chipIcons = {
    height: `<span class="chip-icon"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>`,
    standing: `<span class="chip-icon"><svg viewBox="0 0 24 24"><path d="M13 4a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM7 21l3-9 2 2v7M15 11l-3-3-2 1v4"/></svg></span>`,
    edema: `<span class="chip-icon"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></span>`,
    decubitus: `<span class="chip-icon"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>`,
    back: `<span class="chip-icon"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></span>`,
    neck: `<span class="chip-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg></span>`,
    none: `<span class="chip-icon"><svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></span>`,
    motors: `<span class="chip-icon"><svg viewBox="0 0 24 24"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg></span>`,
    wireless: `<span class="chip-icon"><svg viewBox="0 0 24 24"><rect x="1" y="6" width="18" height="12" rx="2"/><path d="M23 13v-2"/></svg></span>`,
    modern: `<span class="chip-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/></svg></span>`
  };

  let heightLabel = "Maat M (1.65 - 1.80 m)";
  if (height === "small") heightLabel = "Maat S (< 1.65 m)";
  else if (height === "large") heightLabel = "Maat L (> 1.80 m)";

  let chipsHtml = `
    <span class="summary-strip-label">Uw keuzes:</span>
    <button type="button" class="summary-chip" onclick="goToWizardStep(1)" title="Klik om maat te wijzigen">
      ${chipIcons.height} <span>${heightLabel}</span> ${editPencilSvg}
    </button>
  `;

  if (complaints.length > 0) {
    const complaintNames = {
      standing: "Opstaan",
      edema: "Oedeem",
      decubitus: "Decubitus",
      back: "Lage rugpijn",
      neck: "Nek & schouder"
    };
    complaints.forEach(c => {
      const cName = complaintNames[c] || c;
      const cIcon = chipIcons[c] || chipIcons.standing;
      chipsHtml += `
        <button type="button" class="summary-chip" onclick="goToWizardStep(2)" title="Klik om klacht te wijzigen">
          ${cIcon} <span>${cName}</span> ${editPencilSvg}
        </button>
      `;
    });
  } else {
    chipsHtml += `
      <button type="button" class="summary-chip" onclick="goToWizardStep(2)" title="Klik om klachten toe te voegen">
        ${chipIcons.none} <span>Geen fysieke klachten</span> ${editPencilSvg}
      </button>
    `;
  }

  const motorLabel = motorsWanted === 1 ? "1 Motor" : "3 Motoren";
  chipsHtml += `
    <button type="button" class="summary-chip" onclick="goToWizardStep(3)" title="Klik om motortype te wijzigen">
      ${chipIcons.motors} <span>${motorLabel}</span> ${editPencilSvg}
    </button>
  `;

  if (wirelessWanted) {
    chipsHtml += `
      <button type="button" class="summary-chip" onclick="goToWizardStep(3)" title="Klik om te wijzigen">
        ${chipIcons.wireless} <span>Accu</span> ${editPencilSvg}
      </button>
    `;
  }
  if (modernWanted) {
    chipsHtml += `
      <button type="button" class="summary-chip" onclick="goToWizardStep(3)" title="Klik om te wijzigen">
        ${chipIcons.modern} <span>Draaivoet / Design</span> ${editPencilSvg}
      </button>
    `;
  }

  summaryStrip.innerHTML = chipsHtml;
  resultsContainer.appendChild(summaryStrip);
  
  // Score and filter models from dynamic state.chairs
  const scoredChairs = state.chairs
    .filter(chair => {
      // Exclude sold or reserved chairs
      if (chair.status === "verkocht" || chair.status === "gereserveerd") {
        return false;
      }
      return true;
    })
    .map(chair => {
      let score = 0;
      const descLower = (chair.description || "").toLowerCase();
      const nameLower = (chair.name || "").toLowerCase();
      const brandLower = (chair.brand || "").toLowerCase();
      const badgeLower = (chair.badge || "").toLowerCase();
      
      // 1. Check height suitability
      if (brandLower.includes("fitform") || brandLower.includes("doge") || descLower.includes("vario") || descLower.includes("modulair") || descLower.includes("instelbaar") || descLower.includes("s/m/l") || descLower.includes("maatvoeringen")) {
        score += 5; // fully customizable sizing fits everyone
      } else {
        const hasSmall = descLower.includes("maat s") || descLower.includes("small") || nameLower.includes(" s ") || nameLower.endsWith(" s");
        const hasMedium = descLower.includes("maat m") || descLower.includes("medium") || nameLower.includes(" m ") || nameLower.endsWith(" m");
        const hasLarge = descLower.includes("maat l") || descLower.includes("large") || nameLower.includes(" l ") || nameLower.endsWith(" l");
        
        if (height === "small") {
          if (hasSmall) score += 5;
          else if (!hasMedium && !hasLarge) score += 3; // default neutral
        } else if (height === "medium") {
          if (hasMedium) score += 5;
          else if (!hasSmall && !hasLarge) score += 4; // standard fit
        } else if (height === "large") {
          if (hasLarge) score += 5;
          else if (!hasSmall && !hasMedium) score += 3; // default neutral
        }
      }
      
      // 2. Check motor config
      const isFourMotor = descLower.includes("4-motorig") || descLower.includes("4 motoren") || nameLower.includes("4-motorig");
      const isThreeMotor = descLower.includes("3-motorig") || descLower.includes("3 motoren") || nameLower.includes("3-motorig") || brandLower.includes("fitform") || brandLower.includes("doge");
      const isTwoMotor = descLower.includes("2-motorig") || descLower.includes("2 motoren") || nameLower.includes("2-motorig");
      const isOneMotor = descLower.includes("1-motorig") || descLower.includes("1 motor") || nameLower.includes("1-motorig") || descLower.includes("2 knopjes");
      const isManual = descLower.includes("zonder motoren") || descLower.includes("mechanische");
      
      if (motorsWanted === 3) {
        if (isFourMotor || isThreeMotor) {
          score += 4;
        } else if (isTwoMotor) {
          score += 2; // partial match
        } else if (isOneMotor || isManual) {
          score -= 1; // negative match
        }
      } else if (motorsWanted === 1) {
        if (isOneMotor || isManual) {
          score += 4;
        } else if (isTwoMotor) {
          score += 2; // close enough
        } else if (isThreeMotor || isFourMotor) {
          score += 1; // can work but is more complex than wanted
        }
      }
      
      // 3. Check style match (modern) & wireless
      const isModern = descLower.includes("modern") || descLower.includes("design") || descLower.includes("strak") || descLower.includes("trendy") || descLower.includes("industrieel") || descLower.includes("draaibaar") || descLower.includes("draaivoet") || brandLower.includes("dfm") || brandLower.includes("mecam") || badgeLower.includes("modern") || badgeLower.includes("design") || badgeLower.includes("luxe");
      if (modernWanted && isModern) {
        score += 2;
      }
      if (wirelessWanted && (descLower.includes("accu") || descLower.includes("batterij") || descLower.includes("draadloos") || isManual)) {
        score += 3;
      }
      // René-route: geef actiemodel Sta-op stoel René voorrang bij design/accu of algemene zoekopdrachten zonder zware medische Fitform-indicatie
      const isRene = (chair.id || "").toLowerCase().includes("rene") || nameLower.includes("rené") || nameLower.includes("rene");
      const hasHeavyMedical = complaints.includes("edema") || complaints.includes("decubitus");
      if (isRene && !hasHeavyMedical) {
        score += (modernWanted || wirelessWanted) ? 5 : 3;
      }
      
      // 4. Check clinical complaint alignment (Indicatiewijzer criteria)
      if (complaints.includes("standing") && (chair.type === "staop" || descLower.includes("sta-op") || nameLower.includes("sta-op") || brandLower.includes("fitform") || brandLower.includes("doge"))) {
        score += 3;
      }
      if ((complaints.includes("edema") || complaints.includes("legs")) && (isThreeMotor || isFourMotor || descLower.includes("hart-lig") || descLower.includes("benen") || descLower.includes("kantel") || brandLower.includes("fitform") || brandLower.includes("doge"))) {
        score += 4;
      }
      if (complaints.includes("decubitus") && (isThreeMotor || isFourMotor || descLower.includes("kantel") || descLower.includes("drukverdeling") || brandLower.includes("fitform") || brandLower.includes("doge"))) {
        score += 4;
      }
      if (complaints.includes("back") && (descLower.includes("rug") || descLower.includes("lendensteun") || descLower.includes("lumbaal") || brandLower.includes("fitform") || brandLower.includes("doge"))) {
        score += 2;
      }
      if (complaints.includes("neck") && (descLower.includes("nek") || descLower.includes("schouder") || descLower.includes("topswing") || descLower.includes("hoofd") || brandLower.includes("fitform") || brandLower.includes("doge"))) {
        score += 2;
      }
      
      return { ...chair, score };
    });
  
  // Build Clinical Indicatiewijzer Evaluation Card
  if (complaints.length > 0) {
    const points = [];
    const hasRedFlags = complaints.includes("standing") || complaints.includes("edema") || complaints.includes("decubitus");
    
    if (complaints.includes("standing")) {
      points.push(`
        <li class="clinical-point-item">
          <span class="clinical-bullet-icon">
            <svg viewBox="0 0 24 24"><path d="M13 4a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM7 21l3-9 2 2v7M15 11l-3-3-2 1v4"/></svg>
          </span>
          <div>
            <strong>Moeite met zelfstandig opstaan:</strong> Krachtige elektrische sta-op ondersteuning vereist om heupen en knieën te ontlasten en de mantelzorger fysiek te ontzien.
          </div>
        </li>
      `);
    }
    if (complaints.includes("edema") || complaints.includes("legs")) {
      points.push(`
        <li class="clinical-point-item">
          <span class="clinical-bullet-icon">
            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </span>
          <div>
            <strong>Oedeem / Vochtophoping:</strong> Een 3-motorige stoel met onafhankelijke beensteun en kantelfunctie (benen boven harthoogte) is medisch geïndiceerd om veneuze terugkeer te stimuleren.
          </div>
        </li>
      `);
    }
    if (complaints.includes("decubitus")) {
      points.push(`
        <li class="clinical-point-item">
          <span class="clinical-bullet-icon">
            <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </span>
          <div>
            <strong>Decubitusrisico (>3 uur zitten):</strong> Een kantelverstelling (tilt-in-space) is essentieel om drukpieken op de zitbeenknobbels regelmatig weg te nemen zonder schuifkrachten.
          </div>
        </li>
      `);
    }
    if (complaints.includes("back")) {
      points.push(`
        <li class="clinical-point-item">
          <span class="clinical-bullet-icon">
            <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </span>
          <div>
            <strong>Lage Rugpijn:</strong> Exacte lumbaalsteun (lendensteun) vereist om de natuurlijke S-curve van de wervelkolom te behouden en onderuitzakken te voorkomen.
          </div>
        </li>
      `);
    }
    if (complaints.includes("neck")) {
      points.push(`
        <li class="clinical-point-item">
          <span class="clinical-bullet-icon">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
          </span>
          <div>
            <strong>Nek- &amp; Schouderklachten:</strong> Een instelbare topswing hoofdondersteuning is geïndiceerd ter ontlasting van de nek- en schouderspieren.
          </div>
        </li>
      `);
    }

    const clinicalCard = document.createElement("div");
    clinicalCard.className = "clinical-eval-card";
    clinicalCard.style.cssText = "grid-column: 1 / -1; background: #ffffff; border: 1.5px solid rgba(75, 143, 36, 0.25); border-radius: 14px; padding: 18px 20px; margin-bottom: 8px; box-shadow: 0 4px 16px rgba(18, 43, 7, 0.05);";
    clinicalCard.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
        <div class="clinical-header-icon-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            <path d="M9 14l2 2 4-4"/>
          </svg>
        </div>
        <h4 style="margin: 0; color: var(--color-forest); font-size: 1.12rem; font-family: var(--font-heading); font-weight: 700;">Ergonomische Evaluatie Zithouding &amp; Mobiliteit</h4>
      </div>
      <ul style="margin: 0 0 14px 0;">
        ${points.join("")}
      </ul>
      <div style="border-left: 4px solid var(--color-terracotta); background-color: rgba(243, 146, 35, 0.08); padding: 10px 14px; border-radius: 0 8px 8px 0; font-size: 0.85rem; color: var(--color-dark); line-height: 1.5;">
        <strong style="color: var(--color-terracotta);">${hasRedFlags ? "Eén of meerdere medische indicaties vastgesteld:" : "Ergonomisch advies:"}</strong>
        Wacht niet op een langdurig Wmo-traject (vaak 12 tot 20 weken wachttijd). Wij leveren direct uit voorraad met deskundige maatmeting en gratis thuisbezorging.
      </div>
    `;

    resultsContainer.appendChild(clinicalCard);
  }
  
  // Sort by score descending and take top matches (must have score >= 3)
  const matches = scoredChairs
    .filter(chair => chair.score >= 3)
    .sort((a, b) => b.score - a.score);
    
  if (matches.length === 0) {
    const noResults = document.createElement("div");
    noResults.className = "no-results";
    noResults.style.cssText = "grid-column: 1 / -1; padding: 24px; text-align: center;";
    noResults.innerHTML = `
      <h3>Geen standaard match gevonden</h3>
      <p style="margin-top: 8px; color: var(--color-gray); font-size: 0.95rem;">Op basis van uw antwoorden hebben we momenteel geen standaard model in de database dat direct 100% aansluit. Geen zorgen! Onze BewegingsTechnologen leveren altijd maatwerk. Kom proefzitten in onze showroom voor een gratis opmeting en passend advies.</p>
      <a href="afspraak.html" class="btn btn-secondary" style="margin-top: 14px;">Vrijblijvend Advies Inplannen</a>
    `;
    resultsContainer.appendChild(noResults);
    return;
  }
  
  // Calculate max possible score to compute percentage
  const maxScore = 5 + 4 + (modernWanted ? 2 : 0) + (wirelessWanted ? 3 : 0) + Math.max(2, (complaints || []).length * 3);
  
  // Limit results to top 3 matches
  const topMatches = matches.slice(0, 3);
  
  topMatches.forEach(chair => {
    const card = document.createElement("div");
    card.className = "compact-match-card";
    
    // Generate dynamic features & suitability
    const dynamicFeatures = getChairFeatures(chair);
    const dynamicSuitability = getChairSuitability(chair, height, complaints);
    
    const featuresHtml = dynamicFeatures
      .slice(0, 3)
      .map(feat => `<li>${feat}</li>`)
      .join("");
      
    // Calculate percentage match
    const percentage = Math.max(0, Math.min(100, Math.round((chair.score / maxScore) * 100)));
      
    card.innerHTML = `
      <div class="match-card-img-wrap">
        ${chair.image ? `<img src="${chair.image}" alt="${chair.name}">` : `<span style="font-size: 2.5rem;">🛋️</span>`}
        <span class="match-score-badge">${percentage}% Match</span>
      </div>
      <div class="match-card-body">
        <h3 class="match-card-title">${chair.name}</h3>
        <div class="match-card-suitability">${dynamicSuitability}</div>
        <ul class="match-card-features">
          ${featuresHtml}
        </ul>
        <div class="match-card-price-row">
          <div>
            ${(chair.old_price && chair.old_price > chair.price) ? `
              <span style="text-decoration: line-through; color: var(--color-terracotta); font-size: 0.78rem; font-weight: 600; display: block;">${formatPrice(chair.old_price)}</span>
            ` : ''}
            <span class="match-card-price">${formatPrice(chair.price)}</span>
          </div>
          <div class="match-card-actions">
            <button type="button" class="btn-card-details" title="Bekijk specificaties">Details</button>
            <button type="button" class="btn-card-book" title="Plan proefzit afspraak">Probeer</button>
          </div>
        </div>
      </div>
    `;

    card.querySelector(".btn-card-details").addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof openProductModal === "function") {
        openProductModal(chair);
      }
    });

    card.querySelector(".btn-card-book").addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof prefillBooking === "function") {
        prefillBooking(chair.name);
      } else {
        window.location.href = "afspraak.html";
      }
    });

    card.addEventListener("click", () => {
      if (typeof openProductModal === "function") {
        openProductModal(chair);
      }
    });

    resultsContainer.appendChild(card);
  });
}

// Helper to prefill details and jump to the scheduling calendar or open modal
window.prefillBooking = function(chairName) {
  const appModal = document.getElementById("appointmentModal");
  if (appModal) {
    if (typeof openAppointmentModal === "function") {
      openAppointmentModal(null, chairName);
    }
  } else {
    const notesField = document.getElementById("bookingNotes");
    if (notesField) {
      notesField.value = `Ik wil deze stoel graag uitproberen tijdens mijn afspraak: ${chairName}.`;
    }
    
    // Jump smoothly to scheduling section if present, else redirect
    const section = document.getElementById("afspraak-planner");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    } else {
      localStorage.setItem("prefilledChair", chairName);
      window.location.href = "afspraak.html";
    }
  }
};

/* ==========================================================================
   SENIOR-FRIENDLY AFSPRAAK-OVERLAY LOGIC (GEERTJAN PROEFZIT SNELFORMULIER)
   MET 2 KEUZES: 1) BEL MIJ TERUG OF 2) ZELF TIJD KIEZEN IN DE AGENDA
   ========================================================================== */

window.getBasePath = function() {
  return window.location.pathname.includes('/stoelen/') ? '../' : '';
};

window.getAppointmentModalHtml = function() {
  const base = window.getBasePath();
  return `
  <div class="appointment-modal-overlay" id="appointmentModal" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="appointmentModalTitle">
    <div class="appointment-quick-card">
      <button type="button" class="appointment-modal-close" onclick="closeAppointmentModal()" aria-label="Sluit afspraakvenster" title="Sluit venster">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      <!-- Kop & Vertrouwen: Profielfoto Geertjan + Titel & Showroom Info -->
      <div class="appointment-quick-header">
        <div class="appointment-quick-avatar-wrap">
          <img src="${base}assets/flyer/geert_pasfoto.png" alt="Geertjan Klein Haneveld - Bewegingstechnoloog" class="appointment-quick-avatar" width="64" height="64" loading="eager">
          <span class="appointment-quick-badge" title="Gecertificeerd Bewegingstechnoloog">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
        </div>
        <div class="appointment-quick-title-group">
          <h3 id="appointmentModalTitle" class="appointment-quick-title">Zitadvies &amp; Proefzitten</h3>
          <p class="appointment-quick-subtitle">Showroom Dordrecht &bull; Persoonlijk advies door Geertjan</p>
        </div>
      </div>

      <!-- DIRECTE CONTACTOPTIES BOVENAAN: Snel, senior-vriendelijk en 1-klik -->
      <div class="appointment-direct-grid" style="margin-bottom: 14px;">
        <a href="tel:0786314858" class="appointment-direct-card-btn appointment-btn-phone" title="Bel direct naar de showroom">
          <span class="direct-card-icon-wrap phone-icon-wrap">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </span>
          <span class="direct-card-text">
            <span class="direct-card-sublabel">Direct bellen &bull; Showroom</span>
            <strong class="direct-card-value">078 &ndash; 631 4858</strong>
          </span>
        </a>

        <a href="https://wa.me/31622232964?text=Hallo%20Geertjan,%20ik%20heb%20een%20vraag%20over%20een%20sta-op%20stoel" target="_blank" rel="noopener noreferrer" class="appointment-direct-card-btn appointment-btn-whatsapp" title="Stuur Geertjan direct een WhatsApp bericht">
          <span class="direct-card-icon-wrap wa-icon-wrap">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </span>
          <span class="direct-card-text">
            <span class="direct-card-sublabel">WhatsApp &bull; Geertjan</span>
            <strong class="direct-card-value">06 &ndash; 2223 2964</strong>
          </span>
        </a>
      </div>

      <!-- Scheidingslijn: OF laat Geertjan u vandaag terugbellen -->
      <div class="appointment-or-divider">
        <span>of laat Geertjan u vandaag terugbellen</span>
      </div>

      <!-- PANEEL: 1-KLIK TERUGBELVERZOEK -->
      <div id="appointmentPanelCallback" class="appointment-panel active">
        <form id="quickAppointmentForm" class="appointment-choice-card" onsubmit="return handleQuickAppointmentSubmit(event)" novalidate>
          <input type="hidden" id="quickChairNotes" name="chair_notes" value="">

          <div class="form-content-top">
            <!-- Stoel Context Badge (indien geklikt vanuit specifieke stoel) -->
            <div id="quickChairBadge" class="appointment-chair-tag" style="display: none;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Gekozen model: <strong id="quickChairBadgeName"></strong></span>
            </div>

            <div class="appointment-field-group">
              <label for="quickAppointName" class="appointment-field-label">
                <span>Uw naam <span class="appointment-field-required">*</span></span>
              </label>
              <input 
                type="text" 
                id="quickAppointName" 
                name="name" 
                required 
                placeholder="Bijv. Mevrouw De Vries of Dhr. Jansen" 
                autocomplete="name" 
                class="appointment-field-input"
              >
              <span class="appointment-field-error" id="quickNameError"></span>
            </div>

            <div class="appointment-field-group">
              <label for="quickAppointPhone" class="appointment-field-label">
                <span>Uw telefoonnummer <span class="appointment-field-required">*</span></span>
              </label>
              <input 
                type="tel" 
                id="quickAppointPhone" 
                name="phone" 
                required 
                placeholder="Bijv. 06 - 1234 5678" 
                autocomplete="tel" 
                class="appointment-field-input"
              >
              <span class="appointment-field-error" id="quickPhoneError"></span>
            </div>
          </div>

          <div class="card-content-bottom">
            <div class="appointment-pre-cta-line">
              <svg class="pre-cta-icon-orange" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 14 14"></polyline>
              </svg>
              <span>Geertjan belt u vandaag of binnen 1 werkdag terug</span>
            </div>

            <button type="submit" id="btnQuickSubmit" class="btn appointment-quick-submit-btn">
              <span class="btn-text" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>Bel mij vrijblijvend terug</span>
              </span>
              <span class="btn-spinner" style="display: none;">
                <svg class="spinner-icon" viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round"></circle></svg>
                Even geduld...
              </span>
            </button>

            <div class="appointment-trust-microcopy">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Showroom: Merwedestraat 239, Dordrecht &bull; Gratis parkeren voor de deur</span>
            </div>
          </div>
        </form>
      </div>

      <!-- Secundaire links onderaan -->
      <div class="appointment-secondary-links">
        <a href="${base}afspraak.html#bookingCard" class="appointment-agenda-link" onclick="goToOnlineAgenda(event)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink: 0; margin-top: -1px;">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>Wilt u zelf een specifieke dag en tijd kiezen? <strong>Open showroomagenda &rarr;</strong></span>
        </a>
        <button type="button" class="appointment-video-link-btn" onclick="openCertifiedVideoModal('zitmeting')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20"></polygon></svg>
          <span>Bekijk in 38 sec hoe een zitmeting bij Geertjan verloopt</span>
        </button>
      </div>

      <!-- Instant Bevestiging Na Verzending -->
      <div id="quickAppointmentSuccess" class="appointment-quick-success" style="display: none;">
        <div class="appointment-success-icon-wrap">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#256616" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h3 class="appointment-success-title">Bedankt, <span id="quickSuccessName"></span>!</h3>
        <p class="appointment-success-desc">
          Geertjan belt u zo snel mogelijk om uw wensen of een proefzit-afspraak af te stemmen.
        </p>
        <div class="appointment-success-note">
          <span id="quickAutoCloseNote">Dit venster sluit automatisch over <span id="quickAutoCloseSeconds">4</span> seconden...</span>
        </div>
        <div style="margin-top: 18px; text-align: center;">
          <button type="button" class="btn btn-secondary appointment-success-close-btn" onclick="closeAppointmentModal()">
            Sluit venster
          </button>
        </div>
      </div>
    </div>
  </div>`;
};

window.ensureAppointmentModalExists = function() {
  let modal = document.getElementById("appointmentModal");
  if (!modal) {
    const div = document.createElement("div");
    div.innerHTML = window.getAppointmentModalHtml();
    modal = div.firstElementChild;
    document.body.appendChild(modal);

    modal.addEventListener("click", function(e) {
      if (e.target === modal) {
        window.closeAppointmentModal();
      }
    });
  }
  return modal;
};

window.switchAppointmentMode = function(mode) {
  const btnCallback = document.getElementById("btnChoiceCallback");
  const btnAgenda = document.getElementById("btnChoiceAgenda");
  const panelCallback = document.getElementById("appointmentPanelCallback");
  const panelAgenda = document.getElementById("appointmentPanelAgenda");

  if (mode === "agenda") {
    if (btnCallback) {
      btnCallback.classList.remove("active");
      btnCallback.setAttribute("aria-selected", "false");
    }
    if (btnAgenda) {
      btnAgenda.classList.add("active");
      btnAgenda.setAttribute("aria-selected", "true");
    }
    if (panelCallback) {
      panelCallback.classList.remove("active");
      panelCallback.style.display = "none";
    }
    if (panelAgenda) {
      panelAgenda.classList.add("active");
      panelAgenda.style.display = "block";
    }
  } else {
    if (btnCallback) {
      btnCallback.classList.add("active");
      btnCallback.setAttribute("aria-selected", "true");
    }
    if (btnAgenda) {
      btnAgenda.classList.remove("active");
      btnAgenda.setAttribute("aria-selected", "false");
    }
    if (panelCallback) {
      panelCallback.classList.add("active");
      panelCallback.style.display = "block";
    }
    if (panelAgenda) {
      panelAgenda.classList.remove("active");
      panelAgenda.style.display = "none";
    }

    const nameField = document.getElementById("quickAppointName");
    if (nameField && document.getElementById("appointmentModal")?.classList.contains("active")) {
      setTimeout(() => nameField.focus(), 80);
    }
  }
};

window.goToOnlineAgenda = function(e) {
  const isAfspraakPage = window.location.pathname.endsWith("afspraak.html") || 
                         window.location.pathname.endsWith("/afspraak") || 
                         window.location.pathname === "/afspraak";
  if (isAfspraakPage) {
    if (e && e.preventDefault) e.preventDefault();
    window.closeAppointmentModal();
    const target = document.getElementById("bookingCard") || document.getElementById("bookingInteractiveArea");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } else {
    if (e && e.preventDefault) {
      window.location.href = "afspraak.html#bookingCard";
    }
  }
};

window.openAppointmentModal = function(e, chairName, mode) {
  if (e && e.preventDefault) e.preventDefault();

  // If visitor arrived from Marktplaats, prioritize the frictionless callback mode
  const isMp = typeof sessionStorage !== "undefined" && sessionStorage.getItem("staop_from_marktplaats") === "true";
  if (isMp && !mode) {
    mode = "callback";
  }
  if (!chairName && isMp && typeof sessionStorage !== "undefined" && sessionStorage.getItem("staop_mp_chair_hint")) {
    chairName = sessionStorage.getItem("staop_mp_chair_hint");
  }

  // Close mobile nav drawer if open
  const navDrawer = document.getElementById("navMenu");
  const navToggle = document.getElementById("menuToggle");
  if (navDrawer && navDrawer.classList.contains("active")) {
    navDrawer.classList.remove("active");
  }
  if (navToggle && navToggle.classList.contains("active")) {
    navToggle.classList.remove("active");
  }

  const modal = window.ensureAppointmentModalExists();
  if (!modal) return;

  // Set mode: 'callback' or 'agenda'
  window.switchAppointmentMode(mode || "callback");

  // Reset form and errors
  const form = document.getElementById("quickAppointmentForm");
  const successBox = document.getElementById("quickAppointmentSuccess");
  if (form) {
    form.style.display = "block";
    form.reset();
  }
  if (successBox) {
    successBox.style.display = "none";
  }

  const nameErr = document.getElementById("quickNameError");
  const phoneErr = document.getElementById("quickPhoneError");
  if (nameErr) nameErr.textContent = "";
  if (phoneErr) phoneErr.textContent = "";

  const submitBtn = document.getElementById("btnQuickSubmit");
  if (submitBtn) {
    submitBtn.disabled = false;
    const txt = submitBtn.querySelector(".btn-text");
    const spin = submitBtn.querySelector(".btn-spinner");
    if (txt) txt.style.display = "inline";
    if (spin) spin.style.display = "none";
  }

  // Handle chair interest context if triggered from a chair card
  const chairNotesInput = document.getElementById("quickChairNotes");
  const chairBadge = document.getElementById("quickChairBadge");
  const chairBadgeName = document.getElementById("quickChairBadgeName");
  if (chairName) {
    if (chairNotesInput) chairNotesInput.value = chairName;
    if (chairBadge && chairBadgeName) {
      chairBadgeName.textContent = chairName;
      chairBadge.style.display = "flex";
    }
  } else {
    if (chairNotesInput) chairNotesInput.value = "";
    if (chairBadge) chairBadge.style.display = "none";
  }

  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  const quickCard = modal.querySelector(".appointment-quick-card");
  if (quickCard) quickCard.scrollTop = 0;
};

window.closeAppointmentModal = function() {
  const modal = document.getElementById("appointmentModal");
  if (modal) {
    modal.classList.remove("active");
  }
  document.body.style.overflow = "";

  const modalVid = document.getElementById("modalZitmetingVideo");
  if (modalVid) {
    modalVid.pause();
  }

  if (window._quickCloseTimer) {
    clearTimeout(window._quickCloseTimer);
    window._quickCloseTimer = null;
  }
  if (window._quickCloseCountdown) {
    clearInterval(window._quickCloseCountdown);
    window._quickCloseCountdown = null;
  }
};

// Global Delegated Click & Keyboard Listeners for Appointment Modal
document.addEventListener("click", function(e) {
  const trigger = e.target.closest(
    '.btn-nav-appointment, #btnNavAppointment, .hero-btn-appointment, #btnHeroAppointment, #linkAfspraak, .floating-chat, a[onclick*="openAppointmentModal"], [data-appointment-modal]'
  );
  if (trigger) {
    if (trigger.classList.contains("btn-nav-appointment") || 
        trigger.id === "btnNavAppointment" || 
        trigger.id === "btnHeroAppointment" || 
        trigger.classList.contains("hero-btn-appointment") ||
        trigger.id === "linkAfspraak" ||
        trigger.classList.contains("floating-chat") ||
        (trigger.getAttribute("onclick") && trigger.getAttribute("onclick").includes("openAppointmentModal")) ||
        trigger.hasAttribute("data-appointment-modal")) {
      e.preventDefault();
      window.openAppointmentModal(e);
    }
  }

  const modal = document.getElementById("appointmentModal");
  if (modal && e.target === modal) {
    window.closeAppointmentModal();
  }
});

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {
    const modal = document.getElementById("appointmentModal");
    if (modal && modal.classList.contains("active")) {
      window.closeAppointmentModal();
    }
  }
});

window.handleQuickAppointmentSubmit = function(e) {
  if (e && e.preventDefault) e.preventDefault();

  const nameInput = document.getElementById("quickAppointName");
  const phoneInput = document.getElementById("quickAppointPhone");
  const chairNotesInput = document.getElementById("quickChairNotes");
  const nameErr = document.getElementById("quickNameError");
  const phoneErr = document.getElementById("quickPhoneError");
  const submitBtn = document.getElementById("btnQuickSubmit");
  const form = document.getElementById("quickAppointmentForm");
  const successBox = document.getElementById("quickAppointmentSuccess");

  if (nameErr) nameErr.textContent = "";
  if (phoneErr) phoneErr.textContent = "";

  const name = nameInput ? nameInput.value.trim() : "";
  const phone = phoneInput ? phoneInput.value.trim() : "";
  const chair = chairNotesInput ? chairNotesInput.value.trim() : "";

  let hasError = false;
  if (!name) {
    if (nameErr) nameErr.textContent = "Vul alstublieft uw naam in.";
    if (nameInput) nameInput.focus();
    hasError = true;
  } else if (!phone || phone.replace(/\D/g, "").length < 8) {
    if (phoneErr) phoneErr.textContent = "Vul alstublieft een geldig telefoonnummer in (minimaal 8 cijfers).";
    if (phoneInput) phoneInput.focus();
    hasError = true;
  }

  if (hasError) return false;

  // Show loading spinner on button
  if (submitBtn) {
    submitBtn.disabled = true;
    const txt = submitBtn.querySelector(".btn-text");
    const spin = submitBtn.querySelector(".btn-spinner");
    if (txt) txt.style.display = "none";
    if (spin) spin.style.display = "inline-flex";
  }

  const isFromMp = typeof sessionStorage !== "undefined" && sessionStorage.getItem("staop_from_marktplaats") === "true";
  const payload = {
    brand: "staopstoelen",
    site: "staopstoelen.nl",
    type: isFromMp ? "marktplaats_1click_callback" : "quick_appointment_call_me",
    appointmentType: "showroom",
    name: name,
    phone: phone,
    email: "belmij@staopstoelen.nl",
    replyTo: "info@staopstoelen.nl",
    notes: chair 
      ? `Snelafspraak: Klant wil gebeld worden door Geertjan voor proefzitten. Gekozen stoel: ${chair}` 
      : (isFromMp ? "Marktplaats lead: bezoeker wil z.s.m. door Geertjan gebeld worden over stoelen / proefzitten." : "Snelafspraak via overlay: Klant wil gebeld worden door Geertjan om een proefzit-afspraak in te plannen."),
    source: isFromMp ? "Marktplaats Zakelijk Lead (1-klik Terugbelverzoek)" : "Afspraak-Overlay Snelformulier (Bel mij)",
    pageUrl: window.location.href,
    timestamp: new Date().toISOString()
  };

  // 1. Post to Internal PHP Backend API (Direct Database & Email)
  fetch("api/book_appointment.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name,
      phone: phone,
      notes: chair 
        ? `Snelafspraak: Klant wil gebeld worden door Geertjan voor proefzitten. Gekozen stoel: ${chair}` 
        : (isFromMp ? "Marktplaats lead: bezoeker wil z.s.m. door Geertjan gebeld worden over stoelen / proefzitten." : "Snelafspraak via overlay: Klant wil gebeld worden door Geertjan om een proefzit-afspraak in te plannen."),
      source: isFromMp ? "Marktplaats Zakelijk Lead (1-klik Terugbelverzoek)" : "Afspraak-Overlay Snelformulier"
    })
  }).catch(err => console.warn("Quick booking PHP API error:", err));

  // 1b. Post to Webhook (Google Apps Script / Email / Calendar notification if available)
  if (typeof GOOGLE_CALENDAR_WEBHOOK_URL !== "undefined" && GOOGLE_CALENDAR_WEBHOOK_URL) {
    try {
      fetch(GOOGLE_CALENDAR_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
        mode: "no-cors"
      })
      .then(res => console.log("Quick appointment webhook response:", res))
      .catch(err => console.warn("Quick appointment webhook error:", err));
    } catch (e) {}
  }

  // 2. Analytics & Conversion Tracking
  try {
    if (typeof logCustomVisitEvent === "function") {
      logCustomVisitEvent(isFromMp ? 'marktplaats_callback_conversion' : 'booking_conversion', { type: 'quick_appointment', name: name, phone: phone, chair: chair });
    }
    if (typeof trackGoogleAdsConversion === "function") {
      trackGoogleAdsConversion('appointment', { name: name, phone: phone });
    }
    if (typeof gtag === "function") {
      gtag('event', 'generate_lead', {
        event_category: isFromMp ? 'Marktplaats' : 'Afspraak',
        event_label: isFromMp ? 'Marktplaats 1-klik Callback' : 'Snelafspraak Bel Mij Geertjan',
        value: 1.0,
        currency: 'EUR'
      });
    }
  } catch(err) {
    console.warn("Analytics error:", err);
  }

  // 3. Show Instant Success View Inside Modal
  if (form) form.style.display = "none";
  if (successBox) {
    const successNameEl = document.getElementById("quickSuccessName");
    if (successNameEl) successNameEl.textContent = name;
    successBox.style.display = "block";

    // Auto-close countdown (4 seconds)
    let secondsLeft = 4;
    const secEl = document.getElementById("quickAutoCloseSeconds");
    if (secEl) secEl.textContent = secondsLeft;

    if (window._quickCloseCountdown) clearInterval(window._quickCloseCountdown);
    window._quickCloseCountdown = setInterval(() => {
      secondsLeft -= 1;
      if (secEl) secEl.textContent = Math.max(0, secondsLeft);
      if (secondsLeft <= 0) {
        clearInterval(window._quickCloseCountdown);
      }
    }, 1000);

    if (window._quickCloseTimer) clearTimeout(window._quickCloseTimer);
    window._quickCloseTimer = setTimeout(() => {
      closeAppointmentModal();
    }, 4200);
  }

  return false;
};

function initAppointmentModal() {
  const modal = document.getElementById("appointmentModal");
  if (!modal) return;

  // Backdrop click closes modal
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.classList.contains("appointment-modal-overlay")) {
      closeAppointmentModal();
    }
  });

  // Escape key closes modal
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (modal.classList.contains("active")) {
        closeAppointmentModal();
      }
    }
  });
}



/* ==========================================================================
   BEFORE / AFTER SLIDER LOGIC
   ========================================================================== */
function initSlider() {
  const wrapper = document.getElementById("sliderWrapper");
  const handle = document.getElementById("sliderHandle");
  const afterImage = document.getElementById("sliderAfterImage");
  
  if (!wrapper || !handle || !afterImage) return;
  
  const moveSlider = (clientX) => {
    const rect = wrapper.getBoundingClientRect();
    const x = clientX - rect.left;
    let pct = (x / rect.width) * 100;
    
    // Bounds limits
    if (pct < 0) pct = 0;
    if (pct > 100) pct = 100;
    
    state.sliderPct = pct;
    handle.style.left = `${pct}%`;
    afterImage.style.width = `${pct}%`;
  };
  
  // Mouse Events
  handle.addEventListener("mousedown", (e) => {
    state.isDraggingSlider = true;
    e.preventDefault();
  });
  
  window.addEventListener("mouseup", () => {
    state.isDraggingSlider = false;
  });
  
  window.addEventListener("mousemove", (e) => {
    if (!state.isDraggingSlider) return;
    moveSlider(e.clientX);
  });
  
  // Touch Events for Mobile
  handle.addEventListener("touchstart", (e) => {
    state.isDraggingSlider = true;
  });
  
  window.addEventListener("touchend", () => {
    state.isDraggingSlider = false;
  });
  
  window.addEventListener("touchmove", (e) => {
    if (!state.isDraggingSlider) return;
    if (e.touches.length > 0) {
      moveSlider(e.touches[0].clientX);
    }
  });
  
  // Clicking wrapper jumps to spot
  wrapper.addEventListener("click", (e) => {
    if (e.target.closest("#sliderHandle")) return; // skip if clicked handle itself
    moveSlider(e.clientX);
  });
}


/* ==========================================================================
   LIVE BOOKING CALENDAR WIDGET LOGIC
   ========================================================================== */
function initCalendar() {
  const typeHome = document.getElementById("typeHome");
  const typeShowroom = document.getElementById("typeShowroom");
  const addressField = document.getElementById("bookingAddress");
  
  const prevMonth = document.getElementById("btnPrevMonth");
  const nextMonth = document.getElementById("btnNextMonth");
  const submitBookingBtn = document.getElementById("btnSubmitBooking");
  const resetBookingBtn = document.getElementById("btnResetBooking");
  
  const interactiveArea = document.getElementById("bookingInteractiveArea");
  const successScreen = document.getElementById("bookingSuccessScreen");
  
  const homeAddressWrapper = document.getElementById("homeAddressWrapper");
  const postcodeField = document.getElementById("bookingPostcode");
  const houseNumberField = document.getElementById("bookingHouseNumber");
  const addressFeedback = document.getElementById("addressFeedback");
  const btnManualAddress = document.getElementById("btnManualAddress");
  
  if (!typeHome || !typeShowroom || !interactiveArea || !successScreen) return;
  
  // Initialize form options state based on default appointmentType
  if (state.appointmentType === "showroom") {
    typeShowroom.classList.add("selected");
    typeHome.classList.remove("selected");
    const showroomInput = typeShowroom.querySelector("input");
    if (showroomInput) showroomInput.checked = true;
    
    if (homeAddressWrapper) homeAddressWrapper.style.display = "none";
    if (postcodeField) postcodeField.required = false;
    if (houseNumberField) houseNumberField.required = false;
    if (addressField) addressField.required = false;
  } else {
    typeHome.classList.add("selected");
    typeShowroom.classList.remove("selected");
    const homeInput = typeHome.querySelector("input");
    if (homeInput) homeInput.checked = true;
    
    if (homeAddressWrapper) homeAddressWrapper.style.display = "block";
    if (postcodeField) postcodeField.required = true;
    if (houseNumberField) houseNumberField.required = true;
    if (addressField) addressField.required = true;
  }
  
  // Appointment Type Selection
  typeHome.addEventListener("click", () => {
    typeHome.classList.add("selected");
    typeShowroom.classList.remove("selected");
    typeHome.querySelector("input").checked = true;
    
    state.appointmentType = "home";
    state.selectedTimeSlot = null; // Reset selection on type change
    
    // Reset selected date if it is a Monday (since home visits are never on Mondays)
    if (state.selectedDate && state.selectedDate.getDay() === 1) {
      state.selectedDate = null;
      const selectedDateText = document.getElementById("selectedDateText");
      if (selectedDateText) selectedDateText.textContent = "Geen datum geselecteerd";
    }
    
    // Show address inputs and mark required
    if (homeAddressWrapper) homeAddressWrapper.style.display = "block";
    if (postcodeField) postcodeField.required = true;
    if (houseNumberField) houseNumberField.required = true;
    if (addressField) addressField.required = true;

    // Redraw calendar and time slots
    renderCalendar();
    renderTimeSlots();
  });
  
  typeShowroom.addEventListener("click", () => {
    typeShowroom.classList.add("selected");
    typeHome.classList.remove("selected");
    typeShowroom.querySelector("input").checked = true;
    
    state.appointmentType = "showroom";
    state.selectedTimeSlot = null; // Reset selection on type change
    
    // Hide address since visit is in Dordrecht
    if (homeAddressWrapper) homeAddressWrapper.style.display = "none";
    if (postcodeField) {
      postcodeField.required = false;
      postcodeField.value = "";
    }
    if (houseNumberField) {
      houseNumberField.required = false;
      houseNumberField.value = "";
    }
    if (addressField) {
      addressField.required = false;
      addressField.value = "";
    }
    if (addressFeedback) addressFeedback.textContent = "";

    // Redraw calendar and time slots
    renderCalendar();
    renderTimeSlots();
  });
  
  // Address Checker via PDOK Locatieserver (BAG) API
  if (postcodeField && houseNumberField && addressField) {
    const lookupAddress = async () => {
      const postcode = postcodeField.value.trim().replace(/\s+/g, "").toUpperCase();
      const houseNumber = houseNumberField.value.trim();
      
      // Dutch postcode pattern: 4 digits followed by 2 letters
      const postcodeRegex = /^[1-9][0-9]{3}[A-Z]{2}$/;
      
      if (postcodeRegex.test(postcode) && houseNumber !== "") {
        if (addressFeedback) {
          addressFeedback.textContent = "Adres zoeken...";
          addressFeedback.style.color = "var(--color-gray)";
        }
        
        try {
          const response = await fetch(`https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?fq=postcode:${postcode}&fq=huisnummer:${houseNumber}`);
          const data = await response.json();
          
          if (data.response && data.response.docs && data.response.docs.length > 0) {
            const doc = data.response.docs[0];
            addressField.value = doc.weergavenaam;
            addressField.readOnly = true;
            addressField.style.backgroundColor = "var(--color-light)";
            addressField.style.cursor = "not-allowed";
            if (addressFeedback) {
              addressFeedback.textContent = "✓ Adres gevonden!";
              addressFeedback.style.color = "var(--color-forest)";
            }
          } else {
            addressField.value = "";
            if (addressFeedback) {
              addressFeedback.textContent = "Adres niet gevonden. Controleer invoer of typ handmatig.";
              addressFeedback.style.color = "var(--color-terracotta)";
            }
          }
        } catch (error) {
          console.error("PDOK Locatieserver error:", error);
          if (addressFeedback) {
            addressFeedback.textContent = "Fout bij laden adres. Vul uw adres handmatig in.";
            addressFeedback.style.color = "var(--color-terracotta)";
          }
          // Enable manual typing on API error
          addressField.readOnly = false;
          addressField.style.backgroundColor = "";
          addressField.style.cursor = "";
          addressField.placeholder = "Straatnaam, huisnummer & woonplaats";
        }
      } else {
        if (addressField.readOnly) {
          addressField.value = "";
          if (addressFeedback) addressFeedback.textContent = "";
        }
      }
    };
    
    postcodeField.addEventListener("input", lookupAddress);
    houseNumberField.addEventListener("input", lookupAddress);
  }
  
  if (btnManualAddress && addressField) {
    btnManualAddress.addEventListener("click", () => {
      addressField.readOnly = false;
      addressField.style.backgroundColor = "";
      addressField.style.cursor = "";
      addressField.placeholder = "Straatnaam, huisnummer & woonplaats";
      addressField.focus();
      if (addressFeedback) {
        addressFeedback.textContent = "Handmatige invoer geactiveerd.";
        addressFeedback.style.color = "var(--color-gray)";
      }
    });
  }
  
  // Month toggles
  if (prevMonth) {
    prevMonth.addEventListener("click", () => {
      state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() - 1, 1);
      renderCalendar();
    });
  }
  
  if (nextMonth) {
    nextMonth.addEventListener("click", () => {
      state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 1);
      renderCalendar();
    });
  }
  
  // Reset booking form
  if (resetBookingBtn) {
    resetBookingBtn.addEventListener("click", () => {
      interactiveArea.style.display = "block";
      // Reset step indicator
      const s1 = document.getElementById("stepIndicator1");
      const s2 = document.getElementById("stepIndicator2");
      const s3 = document.getElementById("stepIndicator3");
      if (s1) { s1.className = "booking-step active"; }
      if (s2) { s2.className = "booking-step"; }
      if (s3) { s3.className = "booking-step highlight"; }

      // Reset selections
      state.selectedDate = null;
      state.selectedTimeSlot = null;
      
      document.getElementById("bookingName").value = "";
      document.getElementById("bookingPhone").value = "";
      document.getElementById("bookingEmail").value = "";
      document.getElementById("bookingAddress").value = "";
      document.getElementById("bookingNotes").value = "";
      
      if (postcodeField) postcodeField.value = "";
      if (houseNumberField) houseNumberField.value = "";
      if (addressFeedback) addressFeedback.textContent = "";
      if (addressField) {
        addressField.readOnly = true;
        addressField.style.backgroundColor = "var(--color-light)";
        addressField.style.cursor = "not-allowed";
        addressField.placeholder = "Voer postcode en huisnummer in voor automatische controle...";
      }
      
      const successMapIframe = document.getElementById("successMapIframe");
      if (successMapIframe) successMapIframe.src = "";
      const successRouteInfo = document.getElementById("successRouteInfo");
      if (successRouteInfo) successRouteInfo.style.display = "none";
      
      renderCalendar();
      renderTimeSlots();
    });
  }
  
  // Submit Action
  if (submitBookingBtn) {
    submitBookingBtn.addEventListener("click", (e) => {
    e.preventDefault();
    
    const name = document.getElementById("bookingName").value.trim();
    const phone = document.getElementById("bookingPhone").value.trim();
    const email = document.getElementById("bookingEmail").value.trim();
    const address = addressField.value.trim();
    const notes = document.getElementById("bookingNotes").value.trim();
    
    // Validation
    if (!state.selectedDate) {
      alert("Selecteer a.u.b. eerst een datum in de kalender.");
      return;
    }
    if (!state.selectedTimeSlot) {
      alert("Selecteer a.u.b. een tijdstip voor de afspraak.");
      return;
    }
    if (!name) {
      alert("Vul a.u.b. uw naam in.");
      return;
    }
    if (!phone) {
      alert("Vul a.u.b. een telefoonnummer in.");
      return;
    }
    
    const cleanPhoneDigits = phone.replace(/\D/g, "");
    if (cleanPhoneDigits.length < 9) {
      alert("Vul a.u.b. een geldig telefoonnummer in (minimaal 9 cijfers, bijv. 06 12345678 of 078 6314858).");
      return;
    }
    
    // E-mailadres validatie (optioneel, maar als ingevuld moet het geldig zijn)
    if (email && (!email.includes("@") || !email.includes("."))) {
      alert("Vul a.u.b. een geldig e-mailadres in of laat het veld leeg.");
      return;
    }
    
    if (state.appointmentType === "home" && !address) {
      alert("Vul a.u.b. het adres in voor de passing aan huis.");
      return;
    }
    
    // Show Loading state
    submitBookingBtn.textContent = "Verwerken...";
    submitBookingBtn.disabled = true;

    // Parse start and end times from timeSlot range (e.g. "11:00 - 13:00")
    let startTime = "";
    let endTime = "";
    let startISO = "";
    let endISO = "";
    let startDateObj = null;
    let endDateObj = null;
    let gcalDates = "";

    if (state.selectedTimeSlot && state.selectedTimeSlot.includes(" - ")) {
      const timeParts = state.selectedTimeSlot.split(" - ");
      startTime = timeParts[0].trim();
      endTime = timeParts[1].trim();

      try {
        const year = state.selectedDate.getFullYear();
        const month = state.selectedDate.getMonth();
        const day = state.selectedDate.getDate();
        
        const [startH, startM] = startTime.split(":").map(Number);
        const [endH, endM] = endTime.split(":").map(Number);
        
        startDateObj = new Date(year, month, day, startH, startM, 0);
        endDateObj = new Date(year, month, day, endH, endM, 0);
        
        const toLocalISO = (d) => {
          const offset = -d.getTimezoneOffset();
          const sign = offset >= 0 ? "+" : "-";
          const pad = (num) => String(num).padStart(2, "0");
          return d.getFullYear() + "-" +
                 pad(d.getMonth() + 1) + "-" +
                 pad(d.getDate()) + "T" +
                 pad(d.getHours()) + ":" +
                 pad(d.getMinutes()) + ":" +
                 pad(d.getSeconds()) + sign +
                 pad(Math.floor(Math.abs(offset) / 60)) + ":" +
                 pad(Math.abs(offset) % 60);
        };
        
        startISO = toLocalISO(startDateObj);
        endISO = toLocalISO(endDateObj);

        // UTC timestamp format for Google Calendar link: YYYYMMDDTHHMMSSZ
        const toGCalISO = (d) => d.toISOString().replace(/-|:|\.\d+/g, "");
        gcalDates = `${toGCalISO(startDateObj)}/${toGCalISO(endDateObj)}`;
      } catch (err) {
        console.error("Error formatting ISO dates:", err);
      }
    }

    // Build customized confirmation email HTML (without 'within 2 hours' restriction)
    const typeLabel = state.appointmentType === "home" ? "Passing aan Huis" : "Showroombezoek Dordrecht";
    const locationStr = state.appointmentType === "home" ? address : "Merwedestraat 239, 3313 GT Dordrecht";
    const formattedBookingDate = state.selectedDate ? state.selectedDate.toLocaleDateString("nl-NL", {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) : "";

    // Dynamic Google Calendar one-click add link
    const gcalTitle = encodeURIComponent(`${typeLabel} - Staopstoelen.nl`);
    const gcalDetails = encodeURIComponent(`Afspraak met Bewegingstechnoloog Geertjan Klein Haneveld.\nType: ${typeLabel}\nLocatie: ${locationStr}\nContact: 06 - 22 23 29 64 / 078 - 631 4858\nWebsite: https://staopstoelen.nl`);
    const gcalLocation = encodeURIComponent(locationStr);
    const gcalUrl = gcalDates ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${gcalTitle}&dates=${gcalDates}&details=${gcalDetails}&location=${gcalLocation}` : "";

    // Dynamic subject line: concrete date and start time
    const dynamicSubject = state.appointmentType === "home"
      ? `Bevestiging passing aan huis: ${formattedBookingDate} om ${startTime || state.selectedTimeSlot} uur`
      : `Bevestiging afspraak Showroom Dordrecht: ${formattedBookingDate} om ${startTime || state.selectedTimeSlot} uur`;

    const customerEmailHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #222222; max-width: 600px; margin: 0 auto; padding: 24px 20px; background-color: #ffffff;">
        
        <!-- Kop: Logo met strapline -->
        <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e8e8e8;">
          <a href="https://staopstoelen.nl" target="_blank" style="text-decoration: none; display: inline-block;">
            <img src="https://staopstoelen.nl/assets/logo_email_website.png" alt="staopstoelen.nl - Specialist in Ergonomisch Zitcomfort • Fitform Dealer" width="280" style="display: block; border: 0; width: 280px; height: auto; max-width: 100%;">
          </a>
        </div>

        <p style="margin: 0 0 16px 0; color: #222222;">Beste ${name},</p>
        
        <p style="margin: 0 0 20px 0; color: #333333;">
          Bedankt voor uw aanvraag. Uw afspraak staat bij ons genoteerd met de volgende gegevens:
        </p>

        <!-- Overzicht afspraak: rustig en overzichtelijk -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; line-height: 1.6;">
          <tr>
            <td style="padding: 6px 0; color: #666666; width: 140px; vertical-align: top;">Type afspraak:</td>
            <td style="padding: 6px 0; color: #111111; font-weight: bold;">${typeLabel}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666666; vertical-align: top;">Datum:</td>
            <td style="padding: 6px 0; color: #111111; font-weight: bold;">${formattedBookingDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666666; vertical-align: top;">Tijdstip:</td>
            <td style="padding: 6px 0; color: #111111; font-weight: bold;">${state.selectedTimeSlot}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666666; vertical-align: top;">Adres / Locatie:</td>
            <td style="padding: 6px 0; color: #111111;">
              ${locationStr}
              ${state.appointmentType === "showroom" ? `
              <div style="margin-top: 4px;">
                <a href="https://www.google.com/maps/dir/?api=1&destination=Merwedestraat+239,+Dordrecht" target="_blank" style="color: #4b8f24; font-size: 13px; font-weight: 700; text-decoration: underline;">
                  📍 Route plannen in Google Maps &rarr;
                </a>
              </div>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666666; vertical-align: top;">Telefoonnummer:</td>
            <td style="padding: 6px 0; color: #111111;">${phone}</td>
          </tr>
          ${notes && notes !== '-' ? `
          <tr>
            <td style="padding: 6px 0; color: #666666; vertical-align: top;">Uw opmerkingen:</td>
            <td style="padding: 6px 0; color: #111111;">${notes}</td>
          </tr>` : ''}
        </table>

        ${gcalUrl ? `
        <!-- Direct Toevoegen aan Agenda Knop -->
        <div style="margin: 20px 0 24px 0; padding: 14px 18px; background-color: #f7faf5; border: 1px solid #d5e5cf; border-radius: 8px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="vertical-align: middle; padding-right: 12px;">
                <div style="font-size: 13.5px; color: #2e5714; font-weight: 700;">
                  📅 Wilt u deze afspraak direct opslaan?
                </div>
                <div style="font-size: 12.5px; color: #555555; margin-top: 2px;">
                  Voeg de afspraak met één klik toe aan uw Google Agenda.
                </div>
              </td>
              <td style="vertical-align: middle; text-align: right; width: 190px;">
                <a href="${gcalUrl}" target="_blank" style="background-color: #4b8f24; color: #ffffff; padding: 9px 15px; border-radius: 6px; font-size: 13px; font-weight: bold; text-decoration: none; display: inline-block; white-space: nowrap;">
                  + In Google Agenda
                </a>
              </td>
            </tr>
          </table>
        </div>` : ''}

        <p style="margin: 20px 0 6px 0; font-weight: bold; color: #111111;">Hoe nu verder?</p>
        <p style="margin: 0 0 20px 0; color: #333333;">
          Ik zal telefonisch contact met u opnemen om de afspraak te bevestigen en eventuele details door te nemen.
        </p>

        ${state.appointmentType === "showroom" ? `
        <p style="margin: 20px 0 6px 0; font-weight: bold; color: #111111;">Praktische informatie showroombezoek:</p>
        <p style="margin: 0 0 14px 0; color: #333333;">
          Adres: Merwedestraat 239, 3313 GT Dordrecht.<br>
          U kunt gratis direct voor de deur parkeren. Onze showroom is rolstoeltoegankelijk en de koffie staat klaar!
        </p>
        <div style="margin-bottom: 24px;">
          <a href="https://www.google.com/maps/dir/?api=1&destination=Merwedestraat+239,+Dordrecht" target="_blank" style="display: inline-block; background-color: #ffffff; color: #4b8f24; border: 1.5px solid #4b8f24; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: bold; text-decoration: none;">
            📍 Routebeschrijving in Google Maps bekijken &rarr;
          </a>
        </div>` : ''}

        <!-- Handtekening met pasfoto van Geertjan (gebaseerd op visitekaartje) -->
        <div style="margin-top: 32px; color: #111111; font-size: 14px; line-height: 1.6;">
          <p style="margin: 0 0 16px 0;">Met vriendelijke groet,</p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0; padding: 0;">
            <tr>
              <td style="vertical-align: top; padding-right: 20px; width: 92px;">
                <img src="https://staopstoelen.nl/assets/geert_avatar.png" alt="Geertjan Klein Haneveld" width="92" height="92" style="display: block; width: 92px; height: 92px; border-radius: 50%; border: 1px solid #d5ded0; object-fit: cover;">
              </td>
              <td style="vertical-align: top; font-size: 14px; line-height: 1.5; color: #111111;">
                <div style="font-size: 16px; font-weight: bold; color: #111111; margin-bottom: 2px;">Geertjan Klein Haneveld</div>
                <div style="font-size: 13px; color: #444444; font-weight: 600; margin-bottom: 8px;">Gediplomeerd bewegingstechnoloog &amp; Erkend Fitform Dealer</div>
                <div style="font-size: 13px; line-height: 1.6; color: #222222;">
                  06 - 22 23 29 64 &nbsp;&bull;&nbsp; 078 - 631 4858<br>
                  <a href="mailto:geertjan@staopstoelen.nl" style="color: #222222; text-decoration: none;">geertjan@staopstoelen.nl</a> &nbsp;&bull;&nbsp; <a href="https://staopstoelen.nl" target="_blank" style="color: #222222; text-decoration: none;">www.staopstoelen.nl</a><br>
                  Showroom: Merwedestraat 239, 3313 GT Dordrecht
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>
    `;

    // Assemble the payload for Google Calendar webhook
    const bookingPayload = {
      brand: "staopstoelen",
      site: "staopstoelen.nl",
      name: name,
      phone: phone,
      email: email,
      date: state.selectedDate.getFullYear() + "-" + String(state.selectedDate.getMonth() + 1).padStart(2, "0") + "-" + String(state.selectedDate.getDate()).padStart(2, "0"), // YYYY-MM-DD in local time
      timeSlot: state.selectedTimeSlot,
      startTime: startTime,
      endTime: endTime,
      startISO: startISO,
      endISO: endISO,
      start__dateTime: startISO,
      end__dateTime: endISO,
      "Start Date & Time": startISO,
      "End Date & Time": endISO,
      appointmentType: state.appointmentType,
      address: state.appointmentType === "home" ? address : "Merwedestraat 239, Dordrecht (Showroom)",
      notes: notes,
      emailSubject: dynamicSubject,
      senderName: "Geertjan Klein Haneveld - Staopstoelen.nl",
      replyTo: "info@staopstoelen.nl",
      notificationEmail: "schipperwonen@gmail.com, info@staopstoelen.nl",
      emailHtml: customerEmailHtml,
      timestamp: new Date().toISOString()
    };

    const transitionToSuccess = () => {
      // Log custom database conversion event
      if (typeof logCustomVisitEvent === 'function') {
        logCustomVisitEvent('booking_conversion');
      }

      // Track Google Ads appointment booking conversion
      if (typeof trackGoogleAdsConversion === 'function') {
        trackGoogleAdsConversion('appointment', {
          event_category: 'Appointment',
          event_label: state.appointmentType === "home" ? "Passing aan Huis" : "Showroombezoek",
          value: 1.0,
          currency: 'EUR'
        });
      }

      // Direct clean redirect to thank you page
      window.location.href = "bedankt.html";
    };

    // 1. Post to Internal PHP Backend API (Direct Database & Email)
    fetch("api/book_appointment.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name,
        phone: phone,
        email: email,
        date: state.selectedDate ? state.selectedDate.toLocaleDateString("nl-NL") : "",
        timeSlot: state.selectedTimeSlot,
        appointmentType: state.appointmentType,
        address: state.appointmentType === "home" ? address : "Merwedestraat 239, Dordrecht (Showroom)",
        notes: notes,
        source: "Website afspraakformulier (Kalender)"
      })
    })
    .then(res => res.json())
    .catch(err => console.warn("PHP booking save:", err))
    .finally(() => {
      // 2. Also attempt Google Calendar webhook in background (non-blocking)
      if (typeof GOOGLE_CALENDAR_WEBHOOK_URL !== "undefined" && GOOGLE_CALENDAR_WEBHOOK_URL) {
        try {
          fetch(GOOGLE_CALENDAR_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(bookingPayload),
            mode: "no-cors"
          }).catch(() => {});
        } catch (e) {}
      }
      transitionToSuccess();
    });
  });
}

  // 1-Klik Snelle Terugbelknop op Afspraakpagina (voor wie direct contact wil zonder kalender)
  const quickNameInput = document.getElementById("quickCallbackName");
  const quickPhoneInput = document.getElementById("quickCallbackPhone");
  const btnQuickCallback = document.getElementById("btnQuickCallbackSubmit");
  if (btnQuickCallback && quickPhoneInput) {
    btnQuickCallback.addEventListener("click", () => {
      const raw = quickPhoneInput.value.trim();
      const name = quickNameInput ? quickNameInput.value.trim() : "Snelle terugbel-aanvraag";
      const digits = raw.replace(/\D/g, "");
      if (digits.length < 8) {
        alert("Vul alstublieft een geldig telefoonnummer in (bijv. 06 12345678 of 078 6314858).");
        quickPhoneInput.focus();
        return;
      }
      btnQuickCallback.disabled = true;
      btnQuickCallback.textContent = "Bezig met verzenden...";

      fetch("api/book_appointment.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "Snelle terugbel-aanvraag",
          phone: raw,
          notes: "Klant wil z.s.m. door Geertjan gebeld worden voor een afspraak / zitadvies.",
          source: "Afspraakpagina 1-klik Terugbelbalk"
        })
      })
      .then(() => {
        if (typeof logCustomVisitEvent === "function") {
          logCustomVisitEvent("booking_conversion", { type: "quick_callback", name: name, phone: raw });
        }
        if (typeof trackGoogleAdsConversion === "function") {
          trackGoogleAdsConversion("appointment", { phone: raw });
        }
        window.location.href = "bedankt.html";
      })
      .catch(() => {
        window.location.href = "bedankt.html";
      });
    });
  }
  
  // Render Initial View
  renderCalendar();
  renderTimeSlots();
}

function renderCalendar() {
  const daysGrid = document.getElementById("calendarDays");
  const monthName = document.getElementById("currentMonthName");
  
  if (!daysGrid || !monthName) return;
  
  daysGrid.innerHTML = "";
  
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();
  
  // Set month title
  const monthString = state.currentDate.toLocaleString("nl-NL", { month: "long", year: "numeric" });
  monthName.textContent = monthString.charAt(0).toUpperCase() + monthString.slice(1);
  
  // Day names labels
  const daysOfWeek = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
  daysOfWeek.forEach(label => {
    const dayLabel = document.createElement("div");
    dayLabel.className = "calendar-day-label";
    dayLabel.textContent = label;
    daysGrid.appendChild(dayLabel);
  });
  
  // First day of month offset
  const firstDay = new Date(year, month, 1);
  let startOffset = firstDay.getDay(); // 0 is Sunday, 1 is Monday...
  if (startOffset === 0) startOffset = 7; // Align Sunday to the end
  startOffset -= 1; // convert to 0-index for grid alignment starting Monday
  
  // Render empty cells for offset
  for (let i = 0; i < startOffset; i++) {
    const empty = document.createElement("div");
    daysGrid.appendChild(empty);
  }
  
  // Total days in month
  const totalDays = new Date(year, month + 1, 0).getDate();
  const today = new Date(); // Live current date
  
  // Calculate today at 00:00:00
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  // Minimum allowed booking date: today (or tomorrow if past 16:00)
  const minAllowedDate = new Date(todayStart.getTime());
  if (today.getHours() >= 16) {
    minAllowedDate.setDate(minAllowedDate.getDate() + 1);
  }
  
  for (let day = 1; day <= totalDays; day++) {
    const dateCell = document.createElement("button");
    dateCell.type = "button";
    dateCell.className = "calendar-day-btn";
    dateCell.textContent = day;
    
    const thisDate = new Date(year, month, day);
    
    // Disable past dates
    const isPast = thisDate < minAllowedDate;
    
    // Only Sundays are closed (Mondays open by appointment!)
    const isSunday = thisDate.getDay() === 0;
    
    if (isPast || isSunday) {
      dateCell.disabled = true;
    }
    
    // If selected, add class
    if (state.selectedDate && thisDate.toDateString() === state.selectedDate.toDateString()) {
      dateCell.classList.add("selected");
    }
    
    dateCell.addEventListener("click", () => {
      // Unselect previous
      document.querySelectorAll(".calendar-day-btn").forEach(btn => btn.classList.remove("selected"));
      
      state.selectedDate = thisDate;
      dateCell.classList.add("selected");
      
      // Update selected date text
      const formatted = thisDate.toLocaleDateString("nl-NL", {
        day: 'numeric',
        month: 'long'
      });
      document.getElementById("selectedDateText").textContent = formatted;
      
      // Update time slots
      renderTimeSlots();
    });
    
    daysGrid.appendChild(dateCell);
  }
}

function renderTimeSlots() {
  const grid = document.getElementById("timeSlotsGrid");
  if (!grid) return;
  
  grid.innerHTML = "";
  
  if (!state.selectedDate) {
    grid.innerHTML = `<p style="grid-column:1/-1; color: var(--color-gray); font-size:0.875rem; text-align:center;">Selecteer eerst een datum.</p>`;
    return;
  }
  
  const day = state.selectedDate.getDate();
  const isSaturday = state.selectedDate.getDay() === 6;
  const today = new Date();
  const isToday = state.selectedDate.toDateString() === today.toDateString();
  
  // Dynamic time slots depending on appointment type
  const slots = state.appointmentType === "home"
    ? ["16:00 - 18:00", "18:00 - 20:00"]
    : ["10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00"];
  
  // Helper to render the actual buttons
  const drawSlots = (busySlots) => {
    grid.innerHTML = "";
    
    slots.forEach((slot, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "time-slot-btn";
      btn.textContent = slot;
      
      // Saturday afternoon is closed:
      // - Showroom: after 14:00 (index 2) is closed
      // - Home: after 18:00 (index 1) is closed
      const satDisabled = isSaturday && (state.appointmentType === "showroom" ? idx >= 2 : idx >= 1);
      
      // If we have live data, check if the slot is in busySlots.
      // Otherwise, fall back to the deterministic math formula.
      const isBusy = busySlots 
        ? busySlots.includes(slot) 
        : (day + idx) % 3 === 0;

      // Disable slots that started in the past if selectedDate is today
      let isPastSlot = false;
      if (isToday) {
        const startStr = slot.split(" - ")[0];
        const [slotH, slotM] = startStr.split(":").map(Number);
        const currentH = today.getHours();
        const currentM = today.getMinutes();
        if (currentH > slotH || (currentH === slotH && currentM >= slotM)) {
          isPastSlot = true;
        }
      }
      
      if (satDisabled || isBusy || isPastSlot) {
        btn.disabled = true;
        btn.textContent = `${slot} (${isPastSlot ? "Voorbij" : "Vol"})`;
      }
      
      if (state.selectedTimeSlot === slot && !btn.disabled) {
        btn.classList.add("selected");
      }
      
      btn.addEventListener("click", () => {
        document.querySelectorAll(".time-slot-btn").forEach(b => b.classList.remove("selected"));
        state.selectedTimeSlot = slot;
        btn.classList.add("selected");

        // Advance visual step indicator
        const s1 = document.getElementById("stepIndicator1");
        const s2 = document.getElementById("stepIndicator2");
        if (s1) { s1.classList.add("completed"); }
        if (s2) { s2.classList.add("active"); }
      });
      
      grid.appendChild(btn);
    });
  };

  if (typeof GOOGLE_CALENDAR_GET_SLOTS_URL !== "undefined" && GOOGLE_CALENDAR_GET_SLOTS_URL) {
    // Show loading state while fetching live data
    grid.innerHTML = `<p style="grid-column:1/-1; color: var(--color-gray); font-size:0.875rem; text-align:center;">Tijden laden...</p>`;
    
    const localDateString = state.selectedDate.getFullYear() + "-" +
      String(state.selectedDate.getMonth() + 1).padStart(2, "0") + "-" +
      String(state.selectedDate.getDate()).padStart(2, "0");
      
    fetch(`${GOOGLE_CALENDAR_GET_SLOTS_URL}?date=${localDateString}`)
      .then(response => response.json())
      .then(data => {
        if (data && Array.isArray(data.busySlots)) {
          drawSlots(data.busySlots);
        } else {
          drawSlots(null); // Fallback to simulated busy slots
        }
      })
      .catch(error => {
        console.error("Error fetching live slots:", error);
        drawSlots(null); // Fallback to simulated busy slots
      });
  } else {
    drawSlots(null); // Fallback to simulated busy slots
  }
}


/* ==========================================================================
   DIGITALE ZIT-ASSISTENT (SCHIPPER COMPACT WONEN 3D STA-OP STOEL AVATAR)
   ========================================================================== */
function initFloatingMenu() {
  let wrapper = document.getElementById("floatingContactWrapper");
  let mainBtn = document.getElementById("btnFloatingMain");
  const oldMenu = document.getElementById("floatingMenu");

  // Automatische bootstrapping indien de wrapper ontbreekt op de pagina
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.className = "floating-contact-wrapper";
    wrapper.id = "floatingContactWrapper";
    mainBtn = document.createElement("button");
    mainBtn.className = "floating-btn floating-btn-main";
    mainBtn.id = "btnFloatingMain";
    mainBtn.setAttribute("aria-label", "Open Digitale Zit-Assistent");
    wrapper.appendChild(mainBtn);
    document.body.appendChild(wrapper);
  } else if (!mainBtn) {
    mainBtn = document.createElement("button");
    mainBtn.className = "floating-btn floating-btn-main";
    mainBtn.id = "btnFloatingMain";
    mainBtn.setAttribute("aria-label", "Open Digitale Zit-Assistent");
    wrapper.appendChild(mainBtn);
  }

  if (wrapper.dataset.assistantInitialized === "true") return;
  wrapper.dataset.assistantInitialized = "true";

  const isSubdir = window.location.pathname.includes("/stoelen/");
  const base = isSubdir ? "../" : "";
  const normalChairSrc = `${base}assets/assistent-stoel.svg?v=10.420`;
  const logoChairSrc = `${base}assets/assistent-stoel-static.svg?v=10.420`;
  const danceChairSrc = `${base}assets/assistent-stoel-dance.svg?v=10.420`;

  // Preload de dansende SVG zodat hij bij de allereerste klik/dubbelklik zonder enige vertraging start
  const preloadDance = new Image();
  preloadDance.src = danceChairSrc;

  // Zorg dat het 3D Sta-op Stoel icoon ook direct als SVG-favicon actief is in het browsertabblad
  if (!document.querySelector('link[rel="icon"][type="image/svg+xml"]')) {
    const fav = document.createElement("link");
    fav.rel = "icon";
    fav.type = "image/svg+xml";
    fav.href = `${base}favicon.svg?v=10.419`;
    document.head.appendChild(fav);
  }

  // Injecteer kritieke CSS ook direct in <head> zodat gecachete stylesheets direct up-to-date zijn
  if (!document.getElementById("da-inline-styles")) {
    const st = document.createElement("style");
    st.id = "da-inline-styles";
    st.textContent = `
      .nav-text-logo { display: inline-flex !important; flex-direction: column !important; align-items: flex-start !important; white-space: nowrap !important; word-break: keep-all !important; }
      .nav-chair-logo-icon { display: none !important; }
      .nav-logo-text-group { display: flex !important; flex-direction: column !important; color: var(--color-forest, #4b8f24) !important; white-space: nowrap !important; word-break: keep-all !important; }
      .nav-logo-main { white-space: nowrap !important; word-break: keep-all !important; display: inline-flex !important; align-items: baseline !important; }
      .nav-logo-text-group span, .nav-text-logo span, .footer-col h3 span { color: #f39223 !important; }
      .floating-contact-wrapper { position: fixed !important; bottom: 28px !important; right: 28px !important; z-index: 99999 !important; display: flex !important; flex-direction: column !important; align-items: flex-end !important; gap: 12px !important; pointer-events: auto !important; }
      .floating-btn-main.assistant-chair-fab { position: relative !important; width: 76px !important; height: 76px !important; border-radius: 50% !important; background: radial-gradient(circle at 35% 30%, #ffffff 0%, #f4f9ef 65%, #e5f1db 100%) !important; border: 3px solid #4b8f24 !important; box-shadow: 0 12px 32px rgba(18,43,7,0.28), 0 0 0 5px rgba(75,143,36,0.16) !important; padding: 6px !important; display: flex !important; align-items: center !important; justify-content: center !important; transform: none !important; cursor: pointer !important; animation: assistantPulseGlow 3.5s ease-in-out infinite !important; overflow: visible !important; }
      .floating-btn-main.assistant-chair-fab:hover { transform: scale(1.04) !important; border-color: #f39223 !important; box-shadow: 0 16px 40px rgba(18, 43, 7, 0.35), 0 0 0 6px rgba(243, 146, 35, 0.25) !important; }
      @keyframes assistantPulseGlow { 0%, 100% { box-shadow: 0 12px 32px rgba(18, 43, 7, 0.28), 0 0 0 4px rgba(75, 143, 36, 0.16); } 50% { box-shadow: 0 16px 42px rgba(18, 43, 7, 0.36), 0 0 0 9px rgba(75, 143, 36, 0.28); } }
      .assistant-chair-img { width: 64px !important; height: 64px !important; max-width: 64px !important; max-height: 64px !important; object-fit: contain !important; display: block !important; pointer-events: none !important; transform-origin: 50% 80% !important; filter: drop-shadow(0 4px 8px rgba(18, 43, 7, 0.22)) !important; }
      .assistant-online-dot { position: absolute !important; top: 3px !important; right: 3px !important; width: 17px !important; height: 17px !important; border-radius: 50% !important; background: #10b981 !important; border: 3px solid #ffffff !important; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25) !important; }
      .assistant-teaser-pill { position: relative !important; display: flex !important; flex-direction: column !important; background: #ffffff !important; border: 2px solid #4b8f24 !important; border-radius: 18px 18px 4px 18px !important; padding: 12px 14px 11px 14px !important; box-shadow: 0 10px 28px rgba(18, 43, 7, 0.18), 0 2px 6px rgba(0, 0, 0, 0.04) !important; width: 250px !important; max-width: min(280px, calc(100vw - 36px)) !important; cursor: pointer !important; user-select: none !important; text-align: left !important; transition: transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s ease, border-color 0.2s ease !important; animation: slideInUp 0.35s ease-out !important; }
      .assistant-teaser-pill:hover { transform: translateY(-2px) scale(1.02) !important; border-color: #f39223 !important; box-shadow: 0 14px 34px rgba(18, 43, 7, 0.24) !important; }
      .assistant-teaser-pill.hidden { display: none !important; }
      .teaser-dismiss-btn { position: absolute !important; top: 6px !important; right: 6px !important; width: 22px !important; height: 22px !important; border-radius: 50% !important; border: none !important; background: #f1f5f9 !important; color: #64748b !important; font-size: 15px !important; line-height: 1 !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; transition: background 0.15s ease, color 0.15s ease !important; padding: 0 !important; z-index: 2 !important; }
      .teaser-dismiss-btn:hover { background: #f39223 !important; color: #ffffff !important; }
      .teaser-bubble-header { display: flex !important; align-items: center !important; gap: 6px !important; margin-bottom: 5px !important; padding-right: 18px !important; }
      .teaser-pulse-dot { width: 7px !important; height: 7px !important; border-radius: 50% !important; background: #10b981 !important; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7) !important; animation: pulseTeaserDot 2s infinite !important; flex-shrink: 0 !important; }
      @keyframes pulseTeaserDot { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
      .teaser-author-label { font-size: 0.70rem !important; font-weight: 800 !important; text-transform: uppercase !important; letter-spacing: 0.04em !important; color: #4b8f24 !important; line-height: 1 !important; }
      .teaser-bubble-text { font-size: 0.86rem !important; font-weight: 700 !important; color: #122b07 !important; line-height: 1.35 !important; margin-bottom: 8px !important; }
      .teaser-bubble-footer { display: flex !important; align-items: center !important; justify-content: flex-start !important; }
      .teaser-cta-badge { display: inline-flex !important; align-items: center !important; gap: 5px !important; background: #f39223 !important; color: #ffffff !important; font-size: 0.76rem !important; font-weight: 800 !important; padding: 4px 11px !important; border-radius: 999px !important; box-shadow: 0 2px 6px rgba(243, 146, 35, 0.35) !important; transition: background 0.15s ease, transform 0.15s ease !important; }
      .assistant-teaser-pill:hover .teaser-cta-badge { background: #dc8019 !important; transform: translateX(2px) !important; }
      .teaser-bubble-tail { position: absolute !important; bottom: -9px !important; right: 24px !important; width: 14px !important; height: 14px !important; background: #ffffff !important; border-right: 2px solid #4b8f24 !important; border-bottom: 2px solid #4b8f24 !important; transform: rotate(45deg) !important; border-bottom-right-radius: 2px !important; }
      .assistant-teaser-pill:hover .teaser-bubble-tail { border-color: #f39223 !important; }
      .da-avatar-img { width: 32px !important; height: 32px !important; max-width: 32px !important; max-height: 32px !important; object-fit: contain !important; transform-origin: 50% 80%; }
      .digital-assistant-panel { display: none; flex-direction: column !important; width: 380px !important; max-width: calc(100vw - 28px) !important; height: 560px !important; max-height: min(600px, calc(100vh - 90px)) !important; background: #ffffff !important; border-radius: 20px !important; border: 1.5px solid rgba(75, 143, 36, 0.28) !important; box-shadow: 0 20px 50px rgba(18, 43, 7, 0.24) !important; overflow: hidden !important; }
      .digital-assistant-panel.active { display: flex !important; }
      .floating-contact-wrapper.panel-open .floating-btn-main,
      .digital-assistant-panel.active ~ .floating-btn-main { display: none !important; }
      .da-header { flex-shrink: 0 !important; background: #4b8f24 !important; color: #ffffff !important; }
      .da-close-btn { width: 28px !important; height: 28px !important; border-radius: 50% !important; border: 1.5px solid rgba(255, 255, 255, 0.4) !important; background: #f39223 !important; color: #ffffff !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18) !important; transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease !important; }
      .da-close-btn:hover { background: #dc8019 !important; transform: scale(1.08) !important; box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25) !important; }
      .da-header-info { display: flex !important; flex-direction: column !important; align-items: flex-start !important; justify-content: center !important; gap: 2px !important; }
      .da-status-line { display: inline-flex !important; align-items: center !important; gap: 5px !important; font-size: 0.68rem !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 0.06em !important; color: #a7f3d0 !important; line-height: 1 !important; }
      .da-status-dot { width: 7px !important; height: 7px !important; border-radius: 50% !important; background: #34d399 !important; box-shadow: 0 0 6px rgba(52, 211, 153, 0.9) !important; }
      .da-title { font-size: 0.95rem !important; font-weight: 800 !important; color: #ffffff !important; line-height: 1.15 !important; letter-spacing: -0.01em !important; }
      .da-body { flex: 1 1 auto !important; min-height: 0 !important; max-height: none !important; overflow-y: auto !important; background: #f4f7f2 !important; padding: 14px 15px !important; display: flex !important; flex-direction: column !important; gap: 10px !important; -webkit-overflow-scrolling: touch !important; }
      .da-msg-bubble { font-size: 0.88rem !important; line-height: 1.5 !important; max-width: 90% !important; word-wrap: break-word !important; }
      .da-msg-bot .da-msg-bubble { background: #ffffff !important; color: #122b07 !important; border: 1px solid rgba(75, 143, 36, 0.18) !important; border-radius: 18px 18px 18px 4px !important; box-shadow: 0 2px 8px rgba(18, 43, 7, 0.06) !important; padding: 12px 16px !important; }
      .da-msg-user .da-msg-bubble { background: linear-gradient(135deg, #4b8f24 0%, #2e6819 100%) !important; color: #ffffff !important; font-weight: 500 !important; border-radius: 18px 18px 4px 18px !important; box-shadow: 0 3px 10px rgba(75, 143, 36, 0.22) !important; padding: 11px 16px !important; }
      .da-msg-typing .da-msg-bubble { border-radius: 18px 18px 18px 4px !important; background: #ffffff !important; border: 1px solid rgba(75, 143, 36, 0.18) !important; padding: 10px 14px !important; }
      .da-quick-chips { display: grid !important; grid-template-columns: 1fr 1fr !important; grid-auto-rows: 1fr !important; gap: 8px !important; margin-top: 10px !important; }
      .da-chip { display: flex !important; align-items: center !important; justify-content: flex-start !important; gap: 8px !important; width: 100% !important; height: 100% !important; min-height: 52px !important; box-sizing: border-box !important; padding: 8px 10px !important; border-radius: 10px !important; border: 1px solid #d4e7c7 !important; background: #ffffff !important; color: #122b07 !important; font-size: 0.74rem !important; font-weight: 600 !important; text-align: left !important; cursor: pointer !important; line-height: 1.25 !important; transition: all 0.15s ease !important; box-shadow: 0 1px 2px rgba(18, 43, 7, 0.04) !important; }
      .da-chip:hover { background: #e9f4e2 !important; border-color: #4b8f24 !important; transform: translateY(-1px) !important; }
      .da-chip svg { flex-shrink: 0 !important; width: 16px !important; height: 16px !important; stroke: #4b8f24 !important; }
      .da-chip span { flex: 1 1 auto !important; display: block !important; }
      .da-input-wrapper { flex-shrink: 0 !important; background: #ffffff !important; border-top: 1.5px solid #e1ebda !important; padding: 10px 14px 8px !important; }
      .da-input-callout { display: flex !important; align-items: center !important; gap: 6px !important; font-size: 0.73rem !important; font-weight: 700 !important; color: #2e6819 !important; margin-bottom: 6px !important; }
      .da-input-bar { display: flex !important; align-items: center !important; gap: 8px !important; background: #ffffff !important; border: 2px solid #4b8f24 !important; border-radius: 10px !important; padding: 5px 6px 5px 14px !important; min-height: 48px !important; box-shadow: 0 2px 10px rgba(75, 143, 36, 0.12) !important; transition: all 0.2s ease !important; }
      .da-input-bar:focus-within { background: #ffffff !important; border-color: #2e6819 !important; box-shadow: 0 3px 14px rgba(46, 104, 25, 0.24) !important; }
      .da-input { flex: 1 !important; border: none !important; background: transparent !important; padding: 8px 0 !important; font-size: 0.98rem !important; font-family: inherit !important; color: #122b07 !important; font-weight: 500 !important; }
      .da-input::placeholder { color: #64748b !important; font-size: 0.88rem !important; font-weight: 400 !important; }
      .da-input:focus { outline: none !important; }
      .da-send-btn { width: 38px !important; height: 38px !important; border-radius: 8px !important; border: 0 !important; background: linear-gradient(135deg, #4b8f24 0%, #2e6819 100%) !important; color: #ffffff !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; flex-shrink: 0 !important; box-shadow: 0 2px 6px rgba(18, 43, 7, 0.2) !important; transition: transform 0.15s ease, background 0.15s ease !important; }
      .da-send-btn:hover { transform: scale(1.05) !important; background: #2e6819 !important; }
      .da-footer-sub { flex-shrink: 0 !important; display: block !important; padding: 8px 14px 10px !important; background: #fbfdfa !important; border-top: 1px solid #e7eee4 !important; }
      .da-sub-actions { display: grid !important; grid-template-columns: 1fr 1fr 1fr !important; gap: 8px !important; width: 100% !important; }
      .da-sub-btn { display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 6px !important; padding: 8px 6px !important; border-radius: 8px !important; font-size: 0.78rem !important; font-weight: 600 !important; color: #274818 !important; background: #edf3eb !important; border: 1px solid #c9d8c3 !important; text-decoration: none !important; line-height: 1.3 !important; transition: all 0.18s ease !important; white-space: nowrap !important; box-shadow: 0 1px 2px rgba(18, 43, 7, 0.04) !important; height: 100% !important; min-height: 38px !important; box-sizing: border-box !important; }
      .da-sub-btn:hover { background: #e2ede0 !important; border-color: #a8c49e !important; color: #17300c !important; transform: translateY(-1px) !important; }
      .da-sub-btn svg { flex-shrink: 0 !important; opacity: 0.9 !important; }
      @media (max-width: 768px) {
        .navbar { width: 100% !important; max-width: 100% !important; left: 0 !important; right: 0 !important; margin: 0 !important; padding: 0 !important; box-sizing: border-box !important; }
        .navbar .container, .container.navbar-container, .navbar-container { width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 !important; box-sizing: border-box !important; }
        .navbar-top-right { width: 100% !important; max-width: 100% !important; left: 0 !important; right: 0 !important; margin: 0 !important; box-sizing: border-box !important; }
        .nav-chair-logo-icon { display: none !important; }
        .nav-text-logo { position: relative !important; top: auto !important; left: 0 !important; margin: 0 !important; margin-right: auto !important; align-self: flex-start !important; font-size: clamp(1.22rem, 4.6vw, 1.55rem) !important; display: inline-flex !important; flex-direction: column !important; align-items: flex-start !important; justify-content: flex-start !important; text-align: left !important; }
        .nav-logo-text-group { display: flex !important; flex-direction: column !important; align-items: flex-start !important; text-align: left !important; }
        .nav-logo-main { font-size: clamp(1.22rem, 4.6vw, 1.55rem) !important; line-height: 1 !important; display: inline-flex !important; align-items: baseline !important; }
        .nav-logo-strapline { font-size: 0.62rem !important; margin-top: 3px !important; display: block !important; line-height: 1 !important; }
        @media (max-width: 359px) {
          .nav-chair-logo-icon { display: none !important; }
        }
        .floating-contact-wrapper { bottom: 20px !important; right: 14px !important; }
        .floating-btn-main.assistant-chair-fab { width: 66px !important; height: 66px !important; }
        .assistant-chair-img { width: 50px !important; height: 50px !important; max-width: 50px !important; max-height: 50px !important; }
        .floating-contact-wrapper.panel-open { bottom: 12px !important; right: 12px !important; left: 12px !important; align-items: stretch !important; }
        .floating-contact-wrapper.panel-open .digital-assistant-panel { width: 100% !important; max-width: 100% !important; max-height: calc(100vh - 24px) !important; }
        .assistant-teaser-pill { display: none !important; }
        .teaser-bubble-text { font-size: 0.82rem !important; line-height: 1.3 !important; margin-bottom: 7px !important; }
        .teaser-cta-badge { font-size: 0.74rem !important; padding: 3px 10px !important; }
        .teaser-bubble-tail { right: 20px !important; }
      }
    `;
    document.head.appendChild(st);
  }

  // Zorg dat de navigatiebalk uitsluitend het zuivere tekstlogo toont (geen stoel-icoon)
  const navChair = document.querySelector(".nav-chair-logo-icon");
  if (navChair && navChair.closest(".navbar, .nav-text-logo, header")) {
    navChair.remove();
  }

  // Verberg het oude losse 3-knoppen menu (deze zitten nu geïntegreerd onderin de Digitale Assistent)
  if (oldMenu) {
    oldMenu.style.display = "none";
  }

  // Upgrade de zwevende hoofdknop met het 3D Sta-op Stoel icoon + live status
  mainBtn.classList.add("assistant-chair-fab");
  mainBtn.setAttribute("aria-label", "Open Digitale Zit-Assistent (dubbelklik om de stoel te laten dansen)");
  mainBtn.setAttribute("title", "Digitale Zit-Assistent • Klik voor advies, dubbelklik om te dansen");
  mainBtn.innerHTML = `
    <span class="assistant-fab-halo" aria-hidden="true"></span>
    <img src="${normalChairSrc}" width="64" height="64" style="width:64px;height:64px;max-width:64px;max-height:64px;object-fit:contain;display:block;" alt="Digitale Zit-Assistent Sta-op Stoel" class="assistant-chair-img" id="assistantFabImg">
    <span class="assistant-online-dot" aria-hidden="true"></span>
  `;

  // Voeg vriendelijk praatwolkje toe boven de zwevende stoel-knop (DIZA Zitassistent)
  const teaser = document.createElement("div");
  teaser.className = "assistant-teaser-pill";
  teaser.id = "assistantTeaserPill";
  teaser.setAttribute("role", "button");
  teaser.setAttribute("tabindex", "0");
  teaser.setAttribute("title", "Digitale Zit-Assistent • Klik voor direct advies over maatwerk en ergonomie");
  teaser.innerHTML = `
    <button type="button" class="teaser-dismiss-btn" id="assistantTeaserDismiss" title="Melding sluiten" aria-label="Sluit melding">&times;</button>
    <div class="teaser-bubble-header">
      <span class="teaser-pulse-dot" aria-hidden="true"></span>
      <span class="teaser-author-label">DIZA &bull; Zitadvies</span>
    </div>
    <div class="teaser-bubble-text">Hulp nodig bij de juiste maat of stoelkeuze?</div>
    <div class="teaser-bubble-footer">
      <span class="teaser-cta-badge">
        <span>Stel uw vraag</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </span>
    </div>
    <div class="teaser-bubble-tail" aria-hidden="true"></div>
  `;

  // Bouw het interactieve Digitale Assistent venster (scheidt Fitform-route en René-route)
  const isPageFitformRoute =
    (window.location.pathname || "").toLowerCase().includes("fitform") ||
    (window.location.pathname || "").toLowerCase().includes("revisie") ||
    (window.location.search || "").toLowerCase().includes("fitform") ||
    (window.location.search || "").toLowerCase().includes("occasion") ||
    (window.location.hash || "").toLowerCase().includes("occasion");
  const panel = document.createElement("div");
  panel.className = "digital-assistant-panel";
  panel.id = "digitalAssistantPanel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Digitale Zit-Assistent van Staopstoelen.nl");
  panel.innerHTML = `
    <div class="da-header">
      <div class="da-avatar-wrap" id="daHeaderAvatarWrap" title="Digitale Zitassistent">
        <img src="${normalChairSrc}" alt="Digitale Zitassistent" class="da-avatar-img" id="daHeaderChairImg">
        <span class="da-avatar-status"></span>
      </div>
      <div class="da-header-info">
        <div class="da-status-line">
          <span class="da-status-dot"></span>
          <span>Online</span>
        </div>
        <strong class="da-title">Digitale Zitassistent</strong>
      </div>
      <div class="da-header-actions">
        <button type="button" class="da-close-btn" id="daCloseBtn" aria-label="Sluit assistent"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
      </div>
    </div>

    <div class="da-body" id="daChatBody">
      <div class="da-msg da-msg-bot">
        <div class="da-msg-bubble">
          <strong>Welkom bij Staopstoelen.nl!</strong><br>
          Ik ben uw digitale zitassistent. U kunt mij <strong>vrij elke vraag stellen</strong> over zitmaten, lichamelijke klachten, onze voorraad of proefzitten.<br><br>
          <em>Typ gerust uw vraag hieronder in het chatveld!</em>
        </div>
      </div>
      <div class="da-quick-chips" id="daQuickChips">
        ${isPageFitformRoute ? `
        <button type="button" class="da-chip" data-topic="prijs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4b8f24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          <span>Certified Fitform Prijzen</span>
        </button>` : `
        <button type="button" class="da-chip" data-topic="rene">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4b8f24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span>Actiemodel René (&euro; 2.345,-)</span>
        </button>`}
        <button type="button" class="da-chip" data-topic="maat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4b8f24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6m-4 3h2m-5-9a5 5 0 1 1 8 0c0 2-2 3-2 4H10c0-1-2-2-2-4z"/></svg>
          <span>Welke maat past bij mij?</span>
        </button>
        <button type="button" class="da-chip" data-topic="proefzitten">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4b8f24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>Proefzitten showroom</span>
        </button>
        <button type="button" class="da-chip" data-topic="vergoeding">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4b8f24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <span>Vergoeding &amp; Wmo</span>
        </button>
      </div>
    </div>

    <div class="da-input-wrapper">
      <div class="da-input-callout">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2e6819" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span>Stel hier vrij uw vraag:</span>
      </div>
      <form class="da-input-bar" id="daQuestionForm" autocomplete="off">
        <input type="text" class="da-input" id="daQuestionInput" placeholder="Typ uw vraag (bijv. welke maat bij 1.70m?)..." aria-label="Stel uw vraag aan de digitale zitassistent">
        <button type="submit" class="da-send-btn" aria-label="Verstuur vraag" title="Verstuur vraag">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </form>
    </div>

    <div class="da-footer-sub">
      <div class="da-sub-actions">
        <a href="${base}afspraak.html" class="da-sub-btn" onclick="openAppointmentModal(event)" title="Plan een proefzit-afspraak">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>Afspraak</span>
        </a>
        <a href="tel:+31786314858" class="da-sub-btn" title="Bel direct: 078 - 631 4858">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span>Bellen</span>
        </a>
        <a href="https://wa.me/31622232964" target="_blank" rel="noopener" class="da-sub-btn" title="WhatsApp met Geertjan">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.93 11.93 0 0 0 12.06 0C5.46 0 .09 5.37.09 11.97c0 2.11.55 4.16 1.6 5.98L0 24l6.23-1.63a11.9 11.9 0 0 0 5.83 1.51h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.21-3.52-8.43zm-8.46 18.42h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.74.98 1-3.64-.23-.37a9.93 9.93 0 0 1-1.53-5.31c0-5.48 4.46-9.94 9.94-9.94 2.65 0 5.15 1.03 7.02 2.91a9.88 9.88 0 0 1 2.91 7.03c0 5.48-4.46 9.94-9.96 9.94zm5.45-7.44c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.51s1.08 2.91 1.23 3.11c.15.2 2.12 3.24 5.13 4.54.72.31 1.28.5 1.71.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"/></svg>
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  `;

  wrapper.insertBefore(panel, mainBtn);
  if (window.innerWidth > 768) {
    wrapper.insertBefore(teaser, mainBtn);
  }

  const fabImg = document.getElementById("assistantFabImg");
  const headerImg = document.getElementById("daHeaderChairImg");
  const danceBtn = document.getElementById("daDanceTriggerBtn");
  const chatBody = document.getElementById("daChatBody");
  const danceTimers = new WeakMap();
  let audioCtx = null;
  let activeNodes = [];
  let musicTimer = null;

  function stopChairMusic() {
    clearTimeout(musicTimer);
    activeNodes.forEach((n) => {
      try { n.stop(); } catch {}
      try { n.disconnect(); } catch {}
    });
    activeNodes = [];
    danceBtn?.classList.remove("playing");
  }

  // Warm, vrolijk akoestisch marimba / Rhodes jazz-deuntje (3.2 sec, passend bij het dansritme)
  function playChairDanceTune() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtx) audioCtx = new AudioContextClass();
      if (audioCtx.state === "suspended") audioCtx.resume();

      stopChairMusic();
      danceBtn?.classList.add("playing");

      const now = audioCtx.currentTime + 0.03;
      const master = audioCtx.createGain();
      master.gain.setValueAtTime(0.26, now);
      master.connect(audioCtx.destination);

      // Helper voor warme marimba/Rhodes noot
      const playNote = (freq, start, dur, vol = 0.5, type = "triangle") => {
        const osc = audioCtx.createOscillator();
        const overtone = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now + start);

        overtone.type = "sine";
        overtone.frequency.setValueAtTime(freq * 2, now + start);

        const oGain = audioCtx.createGain();
        oGain.gain.setValueAtTime(0.12, now + start);

        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.exponentialRampToValueAtTime(vol, now + start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + start + dur);

        osc.connect(gain);
        overtone.connect(oGain);
        oGain.connect(gain);
        gain.connect(master);

        osc.start(now + start);
        overtone.start(now + start);
        osc.stop(now + start + dur + 0.04);
        overtone.stop(now + start + dur + 0.04);
        activeNodes.push(osc, overtone);
      };

      // Vrolijke melodie (C6/G5/E5 majeur bossa-swing, 3.2 seconden)
      const melody = [
        [523.25, 0.00, 0.22, 0.55], // C5
        [659.25, 0.20, 0.22, 0.55], // E5
        [783.99, 0.40, 0.28, 0.62], // G5
        [880.00, 0.68, 0.24, 0.60], // A5
        [783.99, 0.92, 0.30, 0.55], // G5
        [659.25, 1.24, 0.22, 0.52], // E5
        [587.33, 1.46, 0.22, 0.52], // D5
        [659.25, 1.68, 0.26, 0.58], // E5
        [783.99, 1.94, 0.24, 0.62], // G5
        [880.00, 2.18, 0.22, 0.62], // A5
        [987.77, 2.40, 0.24, 0.65], // B5
        [1046.50, 2.64, 0.52, 0.72] // C6 (slotakkoord)
      ];
      melody.forEach(([f, s, d, v]) => playNote(f, s, d, v, "triangle"));

      // Warme wandelende baslijn (contrabas-gevoel)
      const bass = [
        [130.81, 0.00, 0.42, 0.42], // C3
        [196.00, 0.42, 0.42, 0.38], // G3
        [220.00, 0.84, 0.40, 0.40], // A3
        [174.61, 1.24, 0.42, 0.40], // F3
        [196.00, 1.66, 0.46, 0.42], // G3
        [246.94, 2.12, 0.48, 0.40], // B3
        [261.63, 2.64, 0.55, 0.48]  // C4
      ];
      bass.forEach(([f, s, d, v]) => playNote(f, s, d, v, "sine"));

      // Slot-harmonie (C majeur 9 akkoord op 2.64s)
      playNote(523.25, 2.64, 0.52, 0.32, "sine"); // C5
      playNote(659.25, 2.64, 0.52, 0.32, "sine"); // E5
      playNote(783.99, 2.64, 0.52, 0.32, "sine"); // G5

      musicTimer = setTimeout(() => {
        danceBtn?.classList.remove("playing");
      }, 3200);
    } catch (err) {
      console.warn("Audio kon niet worden afgespeeld:", err);
    }
  }

  function triggerChairDance(imgEl, withMusic = false) {
    const targets = imgEl ? [imgEl] : [fabImg, headerImg].filter(Boolean);
    targets.forEach((img) => {
      img.classList.remove("chair-dancing");
      void img.offsetWidth;
      img.src = danceChairSrc;
      img.classList.add("chair-dancing");
      clearTimeout(danceTimers.get(img));
      danceTimers.set(
        img,
        setTimeout(() => {
          img.classList.remove("chair-dancing");
          img.src = normalChairSrc;
        }, 3200)
      );
    });
    if (withMusic) {
      playChairDanceTune();
    }
  }

  window.triggerAssistantChairDance = () => triggerChairDance(null, true);

  function openAssistant() {
    panel.classList.add("active");
    wrapper.classList.add("panel-open");
    teaser.classList.add("hidden");
    triggerChairDance(headerImg, false);
    if (typeof trackAssistantEvent === "function") {
      trackAssistantEvent("open");
    }
    setTimeout(() => {
      const inp = document.getElementById("daQuestionInput");
      if (inp) inp.focus();
    }, 150);
  }

  function closeAssistant() {
    panel.classList.remove("active");
    wrapper.classList.remove("panel-open");
    teaser.classList.remove("hidden");
    stopChairMusic();
  }

  // Enkele klik opent/sluit het assistent-paneel, dubbelklik (of 2 klikken binnen 360ms) laat de stoel dansen
  let clickTimer = null;
  let lastClickTime = 0;
  mainBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const now = Date.now();
    if (e.detail >= 2 || now - lastClickTime < 360) {
      clearTimeout(clickTimer);
      lastClickTime = 0;
      triggerChairDance(fabImg, true);
      if (panel.classList.contains("active")) {
        triggerChairDance(headerImg, false);
      }
      return;
    }
    lastClickTime = now;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      if (panel.classList.contains("active")) {
        closeAssistant();
      } else {
        openAssistant();
      }
    }, 300);
  });

  mainBtn.addEventListener("dblclick", (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(clickTimer);
    lastClickTime = 0;
    triggerChairDance(fabImg, true);
    if (panel.classList.contains("active")) {
      triggerChairDance(headerImg, false);
    }
  });

  document.getElementById("daHeaderAvatarWrap")?.addEventListener("click", () => triggerChairDance(headerImg, true));
  document.getElementById("daDanceTriggerBtn")?.addEventListener("click", () => {
    triggerChairDance(headerImg, true);
    triggerChairDance(fabImg, false);
  });
  document.getElementById("daCloseBtn")?.addEventListener("click", closeAssistant);
  
  // Sluitknop op het praatwolkje zelf
  const dismissBtn = teaser.querySelector("#assistantTeaserDismiss");
  dismissBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    teaser.classList.add("hidden");
    try { sessionStorage.setItem("staopstoelen_teaser_dismissed", "1"); } catch {}
  });

  // Controleer of de bezoeker het wolkje deze sessie al handmatig heeft weggeklikt
  try {
    if (sessionStorage.getItem("staopstoelen_teaser_dismissed") === "1") {
      teaser.classList.add("hidden");
    }
  } catch {}

  teaser.addEventListener("click", (e) => {
    e.stopPropagation();
    openAssistant();
  });
  teaser.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openAssistant();
    }
  });

  // Antwoord-kennisbank van de Digitale Zit-Assistent (scheidt Fitform-route en René-route)
  function getAssistantResponse(topicOrQuery) {
    const q = String(topicOrQuery || "").toLowerCase();
    const pathLower = (window.location.pathname || "").toLowerCase();
    const searchLower = (window.location.search || "").toLowerCase();
    const hasFitformScent =
      pathLower.includes("fitform") ||
      pathLower.includes("revisie") ||
      searchLower.includes("fitform") ||
      searchLower.includes("occasion") ||
      q.includes("fitform") ||
      q.includes("elevo") ||
      q.includes("vario") ||
      q.includes("570") ||
      q.includes("580") ||
      q.includes("612");

    if (q.includes("rene") || q.includes("rené") || q.includes("actie") || q.includes("aanbieding") || q.includes("korting") || q.includes("draaistoel") || q.includes("accu")) {
      return {
        question: topicOrQuery,
        html: `Ons uitgelichte actiemodel is de <strong>Design Sta-op stoel René (op accu)</strong>:<br>• Volledig draadloos midden in de kamer te plaatsen (360° draaivoet met blokkering).<br>• Inclusief <strong>volledige ligstand (voeten op harthoogte)</strong> en sta-op hulp.<br>• Leverbaar in maten S, M en L in talloze kleuren stof en leer.<br>• <strong>Tijdelijke actieprijs:</strong> van <span style="text-decoration:line-through;">&euro; 2.695,-</span> voor <strong>&euro; 2.345,-</strong> (&euro; 350,- korting).`,
        ctaHtml: `<div class="da-inline-ctas"><a href="${base}stoelen/sta-op-stoel-rene.html" class="da-inline-btn" onclick="if(window.trackAssistantEvent)trackAssistantEvent('cta_click',{cta:'rene_page'})">Bekijk Stoel René &rarr;</a><button type="button" class="da-inline-btn da-inline-btn-sec" onclick="if(window.trackAssistantEvent)trackAssistantEvent('cta_click',{cta:'video_rene_man'});if(window.openCertifiedVideoModal)openCertifiedVideoModal('rene-man')">Bekijk Video (53 sec)</button></div>`
      };
    }

    if (q === "maat" || q.includes("lengte") || q.includes("maat") || q.includes("rug") || q.includes("klacht") || q.includes("welke stoel")) {
      return {
        question: q === "maat" ? "Welke stoel past bij mijn lengte & klachten?" : topicOrQuery,
        html: hasFitformScent
          ? `Een goede Fitform sta-op stoel wordt altijd op <strong>5 lichaamsmaten</strong> afgesteld: zithoogte, zitdiepte, zitbreedte, armleggerhoogte en lendensteun.<br><br>Met onze <strong>Online Keuzehulp</strong> ziet u in 3 stappen welk Certified Fitform model bij uw lengte en klachten past:`
          : `Een goede sta-op stoel moet exact passen bij uw lichaamsbouw: van ons populaire designmodel <strong>Sta-op stoel René (in maat S, M of L op accu)</strong> tot een 100% op 5 lichaamsmaten afgestelde ergonomische stoel.<br><br>Met onze <strong>Online Keuzehulp</strong> ziet u in 3 stappen welk model bij uw lengte en wensen past:`,
        ctaHtml: hasFitformScent
          ? `<div class="da-inline-ctas"><a href="${base}keuzehulp.html" class="da-inline-btn" onclick="if(window.trackAssistantEvent)trackAssistantEvent('cta_click',{cta:'keuzehulp'})">Start Online Keuzehulp &rarr;</a><button type="button" class="da-inline-btn da-inline-btn-sec" onclick="if(window.openCertifiedVideoModal)openCertifiedVideoModal('consumer')">Video: Waarom Fitform?</button></div>`
          : `<div class="da-inline-ctas"><a href="${base}keuzehulp.html" class="da-inline-btn" onclick="if(window.trackAssistantEvent)trackAssistantEvent('cta_click',{cta:'keuzehulp'})">Start Online Keuzehulp &rarr;</a><a href="${base}stoelen/sta-op-stoel-rene.html" class="da-inline-btn da-inline-btn-sec" onclick="if(window.trackAssistantEvent)trackAssistantEvent('cta_click',{cta:'rene_maat'})">Bekijk Actiemodel René</a></div>`
      };
    }

    if (q === "prijs" || q.includes("kost") || q.includes("prijs") || q.includes("prijzen") || q.includes("occasion") || q.includes("tweedehands") || q.includes("goedkoop")) {
      return {
        question: q === "prijs" ? (hasFitformScent ? "Wat kost een Certified Fitform stoel?" : "Wat kost een sta-op stoel?") : topicOrQuery,
        html: hasFitformScent
          ? `Voor <strong>Fitform</strong> heeft u bij ons keuze uit twee routes:<br>• <strong>Certified Fitform (Jong gebruikt &amp; gereviseerd):</strong> v.a. <strong>&euro; 695,- tot &euro; 1.495,-</strong> (volledig 15-punts gekeurd incl. garantie).<br>• <strong>Nieuw Fitform maatwerk:</strong> v.a. &euro; 2.545,- volledig op maat samengesteld.`
          : `Bij ons heeft u een heldere keuze:<br>• <strong>Actiemodel Design Sta-op stoel René (Nieuw op accu):</strong> tijdelijk van &euro; 2.695,- voor <strong>&euro; 2.345,-</strong> (&euro; 350,- korting).<br>• <strong>Certified Fitform (Gereviseerd op maat):</strong> v.a. <strong>&euro; 695,- tot &euro; 1.495,-</strong>.`,
        ctaHtml: hasFitformScent
          ? `<div class="da-inline-ctas"><a href="${base}staopstoelen.html#occasions" class="da-inline-btn" onclick="if(window.trackAssistantEvent)trackAssistantEvent('cta_click',{cta:'collectie'})">Bekijk Fitform Collectie &rarr;</a><button type="button" class="da-inline-btn da-inline-btn-sec" onclick="if(window.openCertifiedVideoModal)openCertifiedVideoModal('consumer')">Bekijk Fitform Video</button></div>`
          : `<div class="da-inline-ctas"><a href="${base}stoelen/sta-op-stoel-rene.html" class="da-inline-btn" onclick="if(window.trackAssistantEvent)trackAssistantEvent('cta_click',{cta:'rene_prijs'})">Bekijk Actiemodel René (&euro; 2.345,-) &rarr;</a><a href="${base}staopstoelen.html" class="da-inline-btn da-inline-btn-sec" onclick="if(window.trackAssistantEvent)trackAssistantEvent('cta_click',{cta:'collectie'})">Volledige Collectie</a></div>`
      };
    }

    if (q.includes("thuis proefzitten") || q.includes("thuis proberen") || q.includes("thuis uitproberen") || q.includes("thuispassen") || q.includes("aan huis proefzitten") || q.includes("aan huis passen")) {
      return {
        question: topicOrQuery,
        html: `Wij verzorgen <strong>geen proefzitten aan huis</strong>. Een ergonomische sta-op stoel moet namelijk op meerdere punten exact worden opgemeten en vergeleken. In onze ruime showroom aan de <strong>Merwedestraat 239 in Dordrecht</strong> hebben wij ruim 30 modellen klaarstaan, een officiële Fitform meetstoel én gratis parkeren direct voor de deur.<br><br>Heeft u uw ideale stoel gekozen? Dan bezorgen wij deze uiteraard wél <strong>geheel gratis bij u thuis</strong> en stellen we hem direct ter plekke voor u af!`,
        ctaHtml: `<div class="da-inline-ctas"><a href="${base}afspraak.html" class="da-inline-btn" onclick="if(window.trackAssistantEvent)trackAssistantEvent('cta_click',{cta:'afspraak'});openAppointmentModal(event)">Plan Showroombezoek &rarr;</a><a href="tel:+31786314858" class="da-inline-btn da-inline-btn-sec">Bel Geertjan: 078-6314858</a></div>`
      };
    }

    if (q === "proefzitten" || q.includes("proefzit") || q.includes("showroom") || q.includes("dordrecht") || q.includes("adres") || q.includes("parkeren") || q.includes("afspraak")) {
      return {
        question: q === "proefzitten" ? "Hoe werkt proefzitten in de showroom?" : topicOrQuery,
        html: `U bent van harte welkom in onze showroom aan de <strong>Merwedestraat 239 in Dordrecht</strong> (gratis parkeren direct voor de deur, gelijkvloers en rolstoeltoegankelijk).<br><br>Bewegingstechnoloog <strong>Geertjan Klein Haneveld</strong> doet een vrijblijvende ergonomische zitmeting en stelt meerdere stoelen exact op uw lichaamsmaat in, zodat u in alle rust kunt proefzitten en vergelijken!`,
        ctaHtml: `<div class="da-inline-ctas"><a href="${base}afspraak.html" class="da-inline-btn" onclick="if(window.trackAssistantEvent)trackAssistantEvent('cta_click',{cta:'afspraak'});openAppointmentModal(event)">Plan Showroombezoek &rarr;</a><button type="button" class="da-inline-btn da-inline-btn-sec" onclick="if(window.trackAssistantEvent)trackAssistantEvent('cta_click',{cta:'video_zitmeting'});if(window.openCertifiedVideoModal)openCertifiedVideoModal('zitmeting')">Bekijk Video (38 sec)</button></div>`
      };
    }

    if (q === "vergoeding" || q.includes("vergoed") || q.includes("wmo") || q.includes("zorgverzeker") || q.includes("indicatie") || q.includes("pgb")) {
      return {
        question: q === "vergoeding" ? "Wordt een sta-op stoel vergoed?" : topicOrQuery,
        html: `In specifieke medische situaties is vergoeding mogelijk via uw zorgverzekeraar of gemeente (Wmo / PGB). Veel klanten kiezen echter voor een <strong>Certified Fitform occasion</strong> omdat u dan zonder lange wachttijd direct op maat geholpen bent.<br><br>Geertjan denkt hierin graag eerlijk met u mee:`,
        ctaHtml: `<div class="da-inline-ctas"><a href="${base}indicatiewijzer.html" class="da-inline-btn" onclick="if(window.trackAssistantEvent)trackAssistantEvent('cta_click',{cta:'indicatiewijzer'})">Open Indicatiewijzer &rarr;</a><a href="${base}afspraak.html" class="da-inline-btn da-inline-btn-sec" onclick="if(window.trackAssistantEvent)trackAssistantEvent('cta_click',{cta:'afspraak_advies'});openAppointmentModal(event)">Vraag Advies aan Geertjan</a></div>`
      };
    }

    return {
      question: topicOrQuery,
      html: `Bedankt voor uw vraag! Omdat elk lichaam anders is, kijkt bewegingstechnoloog <strong>Geertjan Klein Haneveld</strong> graag persoonlijk met u mee. U kunt direct bellen op <strong>078 - 631 4858</strong>, een WhatsApp sturen of vrijblijvend een proefzit-afspraak plannen.`,
      ctaHtml: `<div class="da-inline-ctas"><a href="${base}afspraak.html" class="da-inline-btn" onclick="if(window.trackAssistantEvent)trackAssistantEvent('cta_click',{cta:'afspraak_gesprek'});openAppointmentModal(event)">Plan Adviesgesprek &rarr;</a><a href="${base}faq.html" class="da-inline-btn da-inline-btn-sec" onclick="if(window.trackAssistantEvent)trackAssistantEvent('cta_click',{cta:'faq'})">Veelgestelde vragen</a></div>`
    };
  }

  const chatHistory = [];

  function formatAiMarkdown(text) {
    if (!text) return "";
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    // Bold: **tekst** of __tekst__
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");
    // Cursief: *tekst* of _tekst_
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    // Opsommingspunten
    html = html.replace(/^[•\-\*]\s+(.*)$/gm, "• $1");
    // Witregels naar <br>
    html = html.replace(/\n\n+/g, "<br><br>").replace(/\n/g, "<br>");
    return html;
  }

  function getActionButtonsHtml(actions) {
    if (!Array.isArray(actions) || actions.length === 0) return "";
    const actionDefs = {
      afspraak: {
        label: "Plan Proefzit-Afspraak &rarr;",
        href: `${base}afspraak.html`,
        onclick: "openAppointmentModal(event)",
        primary: true
      },
      keuzehulp: {
        label: "Online Keuzehulp &rarr;",
        href: `${base}keuzehulp.html`,
        primary: true
      },
      collectie: {
        label: "Bekijk 30+ Occasions &rarr;",
        href: `${base}staopstoelen.html`,
        primary: true
      },
      bellen: {
        label: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 6px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>Bel 078 - 631 4858`,
        href: "tel:+31786314858",
        primary: false
      },
      whatsapp: {
        label: `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: -2px; margin-right: 6px;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>WhatsApp met Geertjan`,
        href: "https://wa.me/31622232964",
        target: "_blank",
        primary: false
      }
    };

    const btns = actions.map((act) => {
      const def = actionDefs[act];
      if (!def) return "";
      const cls = def.primary ? "da-inline-btn" : "da-inline-btn da-inline-btn-sec";
      const clickCode = `if(window.trackAssistantEvent)trackAssistantEvent('cta_click',{cta:'${act}'});${def.onclick ? def.onclick : ''}`;
      const onclickAttr = ` onclick="${clickCode}"`;
      const targetAttr = def.target ? ` target="${def.target}" rel="noopener"` : "";
      return `<a href="${def.href}" class="${cls}"${onclickAttr}${targetAttr}>${def.label}</a>`;
    }).filter(Boolean);

    if (btns.length === 0) return "";
    return `<div class="da-inline-ctas">${btns.join("")}</div>`;
  }

  async function appendExchange(topicOrQuery) {
    const chipLabels = {
      maat: "Welke stoel past bij mijn lengte & klachten?",
      prijs: "Wat kost een (Certified Fitform) stoel?",
      proefzitten: "Hoe werkt proefzitten in de showroom?",
      vergoeding: "Wordt een sta-op stoel vergoed?"
    };
    const userText = chipLabels[topicOrQuery] || topicOrQuery;

    if (typeof trackAssistantEvent === "function") {
      trackAssistantEvent("query", { query: userText, topic: topicOrQuery });
    }

    // 1. Toon direct het gebruikersbericht
    const userMsg = document.createElement("div");
    userMsg.className = "da-msg da-msg-user";
    userMsg.innerHTML = `<div class="da-msg-bubble">${userText}</div>`;
    chatBody.appendChild(userMsg);
    chatBody.scrollTop = chatBody.scrollHeight;

    // 2. Typindicator toevoegen
    const typingMsg = document.createElement("div");
    typingMsg.className = "da-msg da-msg-bot da-msg-typing";
    typingMsg.innerHTML = `
      <div class="da-msg-bubble">
        <span>Zit-assistent denkt na</span>
        <div class="da-typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    chatBody.appendChild(typingMsg);
    chatBody.scrollTop = chatBody.scrollHeight;

    const renderBotResponse = (htmlContent, ctaContent = "") => {
      if (typingMsg.parentNode) typingMsg.remove();
      const botMsg = document.createElement("div");
      botMsg.className = "da-msg da-msg-bot";
      botMsg.innerHTML = `<div class="da-msg-bubble">${htmlContent}${ctaContent}</div>`;
      chatBody.appendChild(botMsg);
      chatBody.scrollTop = chatBody.scrollHeight;
      triggerChairDance(headerImg);
    };

    const doFallback = () => {
      const res = getAssistantResponse(topicOrQuery);
      renderBotResponse(res.html, res.ctaHtml || "");
      chatHistory.push({ role: "user", text: userText });
      chatHistory.push({ role: "model", text: res.html.replace(/<[^>]*>/g, "") });
    };

    try {
      const response = await fetch(`${base}api/chat.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: chatHistory.slice(-6)
        })
      });

      if (!response.ok) {
        doFallback();
        return;
      }

      const data = await response.json();
      if (data && data.status === "success" && data.reply) {
        const formattedText = formatAiMarkdown(data.reply);
        const actionHtml = getActionButtonsHtml(data.actions);
        renderBotResponse(formattedText, actionHtml);

        chatHistory.push({ role: "user", text: userText });
        chatHistory.push({ role: "model", text: data.reply });
      } else {
        doFallback();
      }
    } catch (err) {
      console.warn("Gemini Chat API kon niet worden bereikt, lokale fallback actief:", err);
      doFallback();
    }
  }

  panel.querySelectorAll(".da-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      appendExchange(chip.dataset.topic);
    });
  });

  const qForm = document.getElementById("daQuestionForm");
  const qInput = document.getElementById("daQuestionInput");
  if (qForm && qInput) {
    qForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = qInput.value.trim();
      if (!val) return;
      qInput.value = "";
      appendExchange(val);
    });
  }

  // Sluit paneel bij klik buiten de assistent
  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      closeAssistant();
    }
  });
}

function initMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  
  if (!menuToggle || !navLinks) return;
  
  menuToggle.addEventListener("click", (e) => {
    menuToggle.classList.toggle("active");
    navLinks.classList.toggle("active");
    e.stopPropagation();
  });
  
  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!navLinks.contains(e.target) && e.target !== menuToggle && !menuToggle.contains(e.target)) {
      menuToggle.classList.remove("active");
      navLinks.classList.remove("active");
    }
  });
}

/* ==========================================================================
   FAQ ACCORDION INTERACTION
   ========================================================================== */
function initFaqAccordion() {
  const questions = document.querySelectorAll(".faq-question");
  if (!questions || questions.length === 0) return;

  // Initialize any item that starts with .active
  document.querySelectorAll(".faq-item.active .faq-answer").forEach(a => {
    a.style.maxHeight = a.scrollHeight + "px";
  });

  questions.forEach(q => {
    if (q.dataset.faqBound === "true") return;
    q.dataset.faqBound = "true";

    q.addEventListener("click", () => {
      const item = q.closest(".faq-item");
      if (!item) return;
      const answer = item.querySelector(".faq-answer");
      if (!answer) return;
      const isActive = item.classList.contains("active");

      // Close sibling items in the same accordion container
      const container = item.closest(".faq-accordion") || item.parentElement;
      if (container) {
        container.querySelectorAll(".faq-item").forEach(el => {
          el.classList.remove("active");
          const a = el.querySelector(".faq-answer");
          if (a) a.style.maxHeight = null;
        });
      }

      // If it wasn't open, open it
      if (!isActive) {
        item.classList.add("active");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });
}

/* ==========================================================================
   Lead Magnet Handler - Zithouding Checklist Download
   ========================================================================== */
function handleLeadMagnetSubmit(event) {
  if (event) event.preventDefault();

  const nameInput = document.getElementById("lead_name");
  const emailInput = document.getElementById("lead_email");
  const submitBtn = document.getElementById("leadMagnetSubmitBtn");
  const formWrapper = document.getElementById("leadMagnetFormWrapper");
  const successBox = document.getElementById("leadMagnetSuccess");
  const successEmailSpan = document.getElementById("leadSuccessEmail");

  const email = emailInput ? emailInput.value.trim() : "";
  const name = nameInput ? nameInput.value.trim() : "";

  // Basic email validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert("Vul alstublieft een geldig e-mailadres in om de checklist te ontvangen.");
    if (emailInput) emailInput.focus();
    return;
  }

  // Loading state on button
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin-icon">
        <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="10"></circle>
      </svg>
      <span>Even geduld...</span>
    `;
  }

  // 1. Trigger direct browser download of the PDF
  const triggerPdfDownload = () => {
    try {
      const a = document.createElement("a");
      a.href = "assets/zithouding-checklist.pdf";
      a.download = "Zithouding-Checklist-Staopstoelen.nl.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn("Direct download error:", e);
    }
  };

  // 2. Build email confirmation HTML for customer
  const leadEmailHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #222222; max-width: 600px; margin: 0 auto; padding: 24px 20px; background-color: #ffffff;">
      <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e8e8e8;">
        <a href="https://staopstoelen.nl" target="_blank" style="text-decoration: none; display: inline-block;">
          <img src="https://staopstoelen.nl/assets/logo_email_website.png" alt="staopstoelen.nl - Specialist in Ergonomisch Zitcomfort • Fitform Dealer" width="280" style="display: block; border: 0; width: 280px; height: auto; max-width: 100%;">
        </a>
      </div>

      <p style="margin: 0 0 16px 0; color: #222222;">Beste ${name || "lezer"},</p>

      <p style="margin: 0 0 16px 0; color: #333333;">
        Hartelijk dank voor uw aanvraag van de <strong>Zithouding Checklist</strong>.
      </p>

      <p style="margin: 0 0 20px 0; color: #333333;">
        Met deze checklist controleert u in 5 overzichtelijke stappen of uw huidige stoel uw lichaam nog optimaal ondersteunt, of dat er verbeterpunten zijn op het gebied van zithoogte, zitdiepte en lendensteun.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://staopstoelen.nl/assets/zithouding-checklist.pdf" target="_blank" style="background-color: #4b8f24; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 9999px; font-weight: bold; font-size: 15px; display: inline-block; vertical-align: middle;">
          <img src="https://staopstoelen.nl/assets/icon_download_white.png" width="16" height="16" alt="↓" style="vertical-align: -2px; margin-right: 8px; border: 0; display: inline-block;">Bekijk &amp; Download de Checklist (PDF)
        </a>
      </div>

      <p style="margin: 0 0 16px 0; color: #333333;">
        Heeft u naar aanleiding van de checklist twijfels over uw eigen stoel, of merkt u dat u niet meer comfortabel zit? U bent altijd van harte welkom in onze showroom in Dordrecht voor een vrijblijvend zitadvies en een kop koffie. U parkeert gratis voor de deur.
      </p>

      <div style="margin-top: 32px; color: #111111; font-size: 14px; line-height: 1.6;">
        <p style="margin: 0 0 16px 0;">Met vriendelijke groet,</p>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0; padding: 0;">
          <tr>
            <td style="vertical-align: top; padding-right: 20px; width: 92px;">
              <img src="https://staopstoelen.nl/assets/geert_avatar.png" alt="Geertjan Klein Haneveld" width="92" height="92" style="display: block; width: 92px; height: 92px; border-radius: 50%; border: 1px solid #d5ded0; object-fit: cover;">
            </td>
            <td style="vertical-align: top; font-size: 14px; line-height: 1.5; color: #111111;">
              <div style="font-size: 16px; font-weight: bold; color: #111111; margin-bottom: 2px;">Geertjan Klein Haneveld</div>
              <div style="font-size: 13px; color: #444444; font-weight: 600; margin-bottom: 8px;">Gediplomeerd bewegingstechnoloog &amp; Erkend Fitform Dealer</div>
              <div style="font-size: 13px; line-height: 1.6; color: #222222;">
                06 - 22 23 29 64 &nbsp;&bull;&nbsp; 078 - 631 4858<br>
                <a href="mailto:geertjan@staopstoelen.nl" style="color: #222222; text-decoration: none;">geertjan@staopstoelen.nl</a> &nbsp;&bull;&nbsp; <a href="https://staopstoelen.nl" target="_blank" style="color: #222222; text-decoration: none;">www.staopstoelen.nl</a><br>
                Showroom: Merwedestraat 239, 3313 GT Dordrecht
              </div>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;

  // 3. Payload for webhook (pushes lead to inbox / CRM / notification)
  const leadPayload = {
    brand: "staopstoelen",
    site: "staopstoelen.nl",
    name: name || "Geïnteresseerde",
    email: email,
    phone: "",
    appointmentType: "checklist_download",
    emailSubject: "Uw Zithouding Checklist (PDF) - Staopstoelen.nl",
    senderName: "Geertjan Klein Haneveld - Staopstoelen.nl",
    replyTo: "info@staopstoelen.nl",
    notificationEmail: "schipperwonen@gmail.com, info@staopstoelen.nl",
    emailHtml: leadEmailHtml,
    timestamp: new Date().toISOString()
  };

  // 4. Analytics & Event tracking
  try {
    if (typeof logCustomVisitEvent === "function") {
      logCustomVisitEvent("lead_magnet_download");
    }
    if (typeof gtag === "function") {
      gtag("event", "generate_lead", {
        event_category: "Lead Magnet",
        event_label: "Zithouding Checklist PDF",
        value: 1.0
      });
    }
  } catch (err) {
    console.warn("Analytics tracking error:", err);
  }

  // 5. Send webhook in background, start download and switch UI
  triggerPdfDownload();

  if (typeof GOOGLE_CALENDAR_WEBHOOK_URL !== "undefined" && GOOGLE_CALENDAR_WEBHOOK_URL) {
    fetch(GOOGLE_CALENDAR_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(leadPayload)
    })
    .then(res => console.log("Lead webhook response:", res))
    .catch(err => console.warn("Lead webhook error:", err));
  }

  // Show success state
  if (formWrapper) formWrapper.style.display = "none";
  if (successBox) successBox.style.display = "block";
  if (successEmailSpan) successEmailSpan.textContent = email;
}

/* ==========================================================================
   GLOBAL INTERACTIVE VIDEO LIGHTBOX (Certified Fitform & Proefzitten)
   ========================================================================== */
window.openCertifiedVideoModal = function(mode = "consumer") {
  const isSubdir = window.location.pathname.includes("/stoelen/");
  const pfx = isSubdir ? "../" : "";
  let overlay = document.getElementById("certifiedVideoLightbox");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "certifiedVideoLightbox";
    overlay.className = "video-lightbox-overlay";
    overlay.innerHTML = `
      <div class="video-lightbox-card" id="videoLightboxCard" onclick="event.stopPropagation()">
        <div class="video-lightbox-header">
          <div class="video-lightbox-title">
            <span class="video-lightbox-dot"></span>
            <span id="videoLightboxHeading">Waarom Certified Fitform</span>
          </div>
          <div class="video-lightbox-actions">
            <a href="${pfx}afspraak.html" id="videoLightboxCtaBtn" class="video-lightbox-cta-btn" onclick="closeCertifiedVideoModal()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>Afspraak Inplannen</span>
            </a>
            <button type="button" class="video-lightbox-close" onclick="closeCertifiedVideoModal()" aria-label="Sluit video" title="Sluit video">
              &#10005;
            </button>
          </div>
        </div>
        <div class="video-lightbox-frame-wrap" id="videoLightboxFrameWrap">
          <video 
            id="videoLightboxPlayer" 
            src="${pfx}assets/video/staopstoelen_bedrijfsvideo_dordrecht.mp4?v=10.428" 
            poster="${pfx}assets/video/video_poster_scene2.jpg?v=10.428" 
            controls 
            playsinline 
            preload="auto"
            style="width: 100%; height: 100%; object-fit: contain; background: #000; display: block;">
          </video>
          <iframe id="videoLightboxIframe" src="" title="Interactieve Klantvideo" allow="autoplay; fullscreen" style="width: 100%; height: 100%; border: none; display: none;"></iframe>
        </div>
      </div>
    `;
    overlay.addEventListener("click", () => window.closeCertifiedVideoModal());
    document.body.appendChild(overlay);

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("active")) {
        window.closeCertifiedVideoModal();
      }
    });
  }

  const heading = document.getElementById("videoLightboxHeading");
  const player = document.getElementById("videoLightboxPlayer");
  const iframe = document.getElementById("videoLightboxIframe");
  const card = document.getElementById("videoLightboxCard") || overlay.querySelector(".video-lightbox-card");
  const frameWrap = document.getElementById("videoLightboxFrameWrap") || overlay.querySelector(".video-lightbox-frame-wrap");
  const ctaBtn = document.getElementById("videoLightboxCtaBtn") || overlay.querySelector(".video-lightbox-cta-btn");

  // Automatische video-resolutie op basis van bezoeker voor Stoel René
  if (mode === "rene" || mode === "rene-man" || mode === "rene-auto") {
    const visitorVar = (typeof window.getReneVisitorVariant === "function")
      ? window.getReneVisitorVariant()
      : "man";
    mode = (visitorVar === "vrouw") ? "rene" : "rene-man";
  }

  const isVertical = (mode === "rene" || mode === "rene-man" || mode === "ravi");
  if (card) {
    card.style.maxWidth = isVertical ? "440px" : "";
    card.style.maxHeight = isVertical ? "min(790px, calc(100vh - 28px))" : "";
  }
  if (frameWrap) {
    frameWrap.style.height = isVertical ? "min(710px, calc(92vh - 68px))" : "";
  }
  if (ctaBtn) {
    ctaBtn.href = (mode === "rene" || mode === "rene-man")
      ? `${pfx}afspraak.html?stoel=sta-op-stoel-rene`
      : mode === "ravi"
      ? `${pfx}afspraak.html?stoel=sta-op-stoel-ravi`
      : `${pfx}afspraak.html`;
    const ctaSpan = ctaBtn.querySelector("span");
    if (ctaSpan) {
      ctaSpan.textContent = isVertical ? "Proefzitten" : "Afspraak Inplannen";
    }
  }

  if (mode === "rene-man") {
    if (heading) heading.textContent = "Stoel René • € 2.345,-";
    if (iframe) {
      iframe.src = "";
      iframe.style.display = "none";
    }
    if (player) {
      player.src = `${pfx}assets/video/staopstoelen_rene_man_aanbieding_web.mp4?v=10.428`;
      player.poster = `${pfx}assets/rene_man_video_poster.jpg?v=10.428`;
      player.style.display = "block";
      player.currentTime = 0;
      player.play().catch(() => {});
    }
  } else if (mode === "rene") {
    if (heading) heading.textContent = "Stoel René • € 2.345,-";
    if (iframe) {
      iframe.src = "";
      iframe.style.display = "none";
    }
    if (player) {
      player.src = `${pfx}assets/video/staopstoelen_rene_aanbieding_web.mp4?v=10.428`;
      player.poster = `${pfx}assets/rene_video_poster.jpg?v=10.428`;
      player.style.display = "block";
      player.currentTime = 0;
      player.play().catch(() => {});
    }
  } else if (mode === "ravi") {
    if (heading) heading.textContent = "Stoel Ravi • € 1.945,-";
    if (iframe) {
      iframe.src = "";
      iframe.style.display = "none";
    }
    if (player) {
      player.src = `${pfx}assets/video/staopstoelen_ravi_aanbieding_staand.mp4?v=10.428`;
      player.poster = `${pfx}assets/chair_ravi_cozy.png?v=10.419`;
      player.style.display = "block";
      player.currentTime = 0;
      player.play().catch(() => {});
    }
  } else if (mode === "afspraak" || mode === "zitmeting" || mode === "proefzitten") {
    if (heading) heading.textContent = "Persoonlijke Zitmeting & Proefzitten Dordrecht";
    if (iframe) {
      iframe.src = "";
      iframe.style.display = "none";
    }
    if (player) {
      player.src = `${pfx}assets/video/zitmeting_proefzitten_dordrecht.mp4?v=10.428`;
      player.poster = `${pfx}assets/video/zitmeting_poster.jpg?v=10.428`;
      player.style.display = "block";
      player.currentTime = 0;
      player.play().catch(() => {});
    }
  } else if (mode === "pasvorm") {
    if (heading) heading.textContent = "Pasformulier & Stoel-Anatomie";
    if (player) {
      player.pause();
      player.style.display = "none";
    }
    if (iframe) {
      iframe.style.display = "block";
      iframe.src = `certified-fitform-video.html?mode=afspraak&embed=1&autoplay=1&v=10.428`;
    }
  } else if (mode === "revisie" || mode === "inspectie") {
    if (heading) heading.textContent = "Het Volledige Revisieproces • Certified Fitform";
    if (iframe) {
      iframe.src = "";
      iframe.style.display = "none";
    }
    if (player) {
      player.src = "assets/video/revisie_proces_dordrecht.mp4?v=10.428";
      player.poster = "assets/video/revisie_poster.jpg?v=10.428";
      player.style.display = "block";
      player.currentTime = 0;
      player.play().catch(() => {});
    }
  } else if (mode === "interactive" || mode === "dossier") {
    if (heading) heading.textContent = "Waarom Certified Fitform • Interactief";
    if (player) {
      player.pause();
      player.style.display = "none";
    }
    if (iframe) {
      iframe.style.display = "block";
      iframe.src = `certified-fitform-video.html?mode=consumer&embed=1&autoplay=1&v=10.428`;
    }
  } else {
    if (heading) heading.textContent = "Waarom Certified Fitform";
    if (iframe) {
      iframe.src = "";
      iframe.style.display = "none";
    }
    if (player) {
      player.src = "assets/video/staopstoelen_bedrijfsvideo_dordrecht.mp4?v=10.428";
      player.poster = "assets/video/video_poster_scene2.jpg?v=10.428";
      player.style.display = "block";
      player.currentTime = 0;
      player.play().catch(err => console.log("Autoplay notice:", err));
    }
  }

  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
};

window.closeCertifiedVideoModal = function() {
  const overlay = document.getElementById("certifiedVideoLightbox");
  if (!overlay) return;
  overlay.classList.remove("active");

  const player = document.getElementById("videoLightboxPlayer");
  if (player) {
    player.pause();
    player.currentTime = 0;
  }
  const iframe = document.getElementById("videoLightboxIframe");
  if (iframe) {
    iframe.src = "";
  }
  const prodModal = document.getElementById("productModal");
  if (!prodModal || !prodModal.classList.contains("active")) {
    document.body.style.overflow = "";
  }
};

/* ==========================================================================
   MARKTPLAATS ZAKELIJK VISITOR CONVERSION SUITE
   ========================================================================== */

window.getMarktplaatsVisitorContext = function() {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = (document.referrer || "").toLowerCase();
    const utmSource = (params.get("utm_source") || "").toLowerCase();
    const utmMedium = (params.get("utm_medium") || "").toLowerCase();
    const utmCampaign = (params.get("utm_campaign") || "").toLowerCase();
    const customRef = (params.get("ref") || "").toLowerCase();
    const mpParam = params.get("mp") || params.get("marktplaats");

    const isMp = ref.includes("marktplaats") ||
                 utmSource.includes("marktplaats") ||
                 utmMedium.includes("marktplaats") ||
                 utmCampaign.includes("marktplaats") ||
                 customRef.includes("marktplaats") ||
                 mpParam === "1" || mpParam === "true";

    if (isMp) {
      sessionStorage.setItem("staop_from_marktplaats", "true");
      let chairHint = params.get("stoel") || params.get("chair") || "";
      if (!chairHint && utmCampaign) {
        const clean = utmCampaign.replace(/(_catalogus|_home|_vermelding|_voorraad)/gi, "").replace(/[-_]/g, " ").trim();
        if (clean.toLowerCase().includes("fitform") || clean.toLowerCase().includes("570") || clean.toLowerCase().includes("vario") || clean.toLowerCase().includes("reco") || clean.toLowerCase().includes("571")) {
          chairHint = clean.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        }
      }
      if (chairHint) {
        sessionStorage.setItem("staop_mp_chair_hint", chairHint);
      }
      return { isMp: true, chairHint: chairHint || sessionStorage.getItem("staop_mp_chair_hint") || "" };
    }

    const wasMp = sessionStorage.getItem("staop_from_marktplaats") === "true";
    return {
      isMp: wasMp,
      chairHint: sessionStorage.getItem("staop_mp_chair_hint") || ""
    };
  } catch (e) {
    return { isMp: false, chairHint: "" };
  }
};

window.openMarktplaatsCallbackModal = function(chairName) {
  const mpCtx = window.getMarktplaatsVisitorContext();
  const targetChair = chairName || mpCtx.chairHint || "";

  if (typeof window.openAppointmentModal === "function") {
    window.openAppointmentModal(null, targetChair, "callback");

    const chairBadge = document.getElementById("quickChairBadge");
    const chairBadgeName = document.getElementById("quickChairBadgeName");
    const notesInput = document.getElementById("quickChairNotes");

    if (chairBadge && chairBadgeName) {
      chairBadgeName.textContent = targetChair ? `Marktplaats: ${targetChair}` : "Gezien op Marktplaats";
      chairBadge.style.display = "flex";
    }

    if (notesInput) {
      notesInput.value = targetChair
        ? `Marktplaats lead: interesse in ${targetChair}. Verzoekt z.s.m. telefonisch contact door Geertjan.`
        : `Marktplaats doorklikker: verzoekt z.s.m. telefonisch contact met Geertjan over stoelen en proefzitten.`;
    }

    setTimeout(() => {
      const phoneInput = document.getElementById("quickAppointPhone");
      if (phoneInput) phoneInput.focus();
    }, 250);
  }
};

window.closeMarktplaatsBanner = function() {
  const banner = document.getElementById("mpSmartBanner");
  if (banner) {
    banner.style.display = "none";
    try {
      sessionStorage.setItem("staop_mp_banner_closed", "true");
    } catch (e) {}
  }
};

window.initMarktplaatsExperience = function() {
  const ctx = window.getMarktplaatsVisitorContext();
  if (!ctx.isMp) return;

  document.body.classList.add("mp-active-visitor");

  const isDismissed = sessionStorage.getItem("staop_mp_banner_closed") === "true";
  if (!isDismissed && !document.getElementById("mpSmartBanner")) {
    const banner = document.createElement("div");
    banner.id = "mpSmartBanner";
    banner.className = "mp-smart-banner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Marktplaats bezoeker actie");

    const subText = ctx.chairHint
      ? `Vragen over de <strong>${ctx.chairHint}</strong> of wilt u direct langskomen om proef te zitten in Dordrecht?`
      : `Vragen over onze gecertificeerde Fitform sta-op stoelen of wilt u direct proefzitten in Dordrecht?`;

    banner.innerHTML = `
      <div class="mp-banner-inner">
        <div class="mp-banner-content">
          <span class="mp-badge-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Marktplaats
          </span>
          <div class="mp-banner-text">
            <strong class="mp-banner-title">Gezien op Marktplaats? Welkom bij Staopstoelen.nl!</strong>
            <span class="mp-banner-sub">${subText}</span>
          </div>
        </div>
        <div class="mp-banner-actions">
          <a href="tel:0786314858" class="mp-action-btn mp-btn-call" title="Bel direct met Zitspecialist Geertjan">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span>Bel Geertjan: <strong>078 &ndash; 631 4858</strong></span>
          </a>
          <a href="https://wa.me/31622232964?text=${encodeURIComponent('Hallo Geertjan, ik zag uw advertentie op Marktplaats' + (ctx.chairHint ? ' (' + ctx.chairHint + ')' : '') + ' en heb een vraag...')}" target="_blank" rel="noopener noreferrer" class="mp-action-btn mp-btn-wa" title="Stuur Geertjan direct een WhatsApp">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            <span>WhatsApp Geertjan</span>
          </a>
          <button type="button" class="mp-action-btn mp-btn-callback" onclick="openMarktplaatsCallbackModal('${ctx.chairHint || ''}')" title="Geertjan belt u z.s.m. terug">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <span>Bel mij terug (1 klik)</span>
          </button>
          <button type="button" class="mp-btn-close" onclick="closeMarktplaatsBanner()" aria-label="Sluit Marktplaats welkomstbalk">&times;</button>
        </div>
      </div>
    `;

    const navbar = document.querySelector(".navbar");
    if (navbar && navbar.parentNode) {
      navbar.parentNode.insertBefore(banner, navbar);
    } else {
      document.body.prepend(banner);
    }
  }

  if (!document.getElementById("mpMobileQuickbar")) {
    const mobileBar = document.createElement("nav");
    mobileBar.id = "mpMobileQuickbar";
    mobileBar.className = "mp-mobile-quickbar";
    mobileBar.setAttribute("aria-label", "Marktplaats mobiele contactopties");
    mobileBar.innerHTML = `
      <a href="tel:0786314858" class="mp-mobile-btn mp-mobile-btn-call" title="Bel direct">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        <span>078 - 631 4858</span>
      </a>
      <a href="https://wa.me/31622232964?text=${encodeURIComponent('Hallo Geertjan, ik zag uw advertentie op Marktplaats' + (ctx.chairHint ? ' (' + ctx.chairHint + ')' : '') + ' en heb een vraag...')}" target="_blank" rel="noopener noreferrer" class="mp-mobile-btn mp-mobile-btn-wa" title="WhatsApp">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
        <span>WhatsApp</span>
      </a>
      <button type="button" class="mp-mobile-btn mp-mobile-btn-callback" onclick="openMarktplaatsCallbackModal('${ctx.chairHint || ''}')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        <span>Bel mij terug</span>
      </button>
    `;
    document.body.appendChild(mobileBar);
  }
};

// Immediate check on script load & DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function() {
    if (typeof window.initMarktplaatsExperience === "function") window.initMarktplaatsExperience();
  });
} else {
  if (typeof window.initMarktplaatsExperience === "function") window.initMarktplaatsExperience();
}





// =========================================================
// Groene sta-op stoel (zonder achtergrond) naast het tekstlogo in de header
// Bij mouseover: openklappen naar relaxstand, daarna omhoog in de sta-op stand
// =========================================================
(function initHeaderChairLogo() {
  function run() {
    const logo = document.querySelector('.navbar .nav-text-logo, header .nav-text-logo');
    if (!logo || logo.classList.contains('has-brand-chair')) return;

    const base = (typeof window.getBasePath === 'function') ? window.getBasePath() : '';
    const ver = '10.419';

    // Tekst (staopstoelen.nl + strapline) samen in één kolom
    let textGroup = logo.querySelector('.nav-logo-text-group');
    if (!textGroup) {
      textGroup = document.createElement('div');
      textGroup.className = 'nav-logo-text-group';
      while (logo.firstChild) textGroup.appendChild(logo.firstChild);
      logo.appendChild(textGroup);
    }

    // Standen op één lijn: sta-op (vol) .. sta-op (half) .. zitten .. relax (half) .. relax (vol)
    const keys = ['s2', 's1', '0', '1', '2'];
    const SIT = 2, RELAX = 4, STAOP = 0;

    const wrap = document.createElement('span');
    wrap.className = 'nav-brand-chair';
    wrap.setAttribute('aria-hidden', 'true');
    const frames = keys.map((k, i) => {
      const img = document.createElement('img');
      img.src = `${base}assets/icons/stoel_logo_header_${k}.png?v=${ver}`;
      img.alt = '';
      img.width = 264;
      img.height = 240;
      img.decoding = 'async';
      img.className = 'nav-brand-chair-frame' + (i === STAOP ? ' is-active' : '');
      wrap.appendChild(img);
      return img;
    });
    logo.insertBefore(wrap, textGroup);
    logo.classList.add('has-brand-chair');

    // Frame-stapper: standaard in de volle sta-op stand, bij hover naar relaxstand en terug
    const STEP_MS = 180;
    const HOLD_MS = 900;
    let current = STAOP;
    let target = STAOP;
    let timer = null;
    let holdTimer = null;
    let hovering = false;
    let onArrive = null;

    function show(idx) {
      frames.forEach((f, i) => f.classList.toggle('is-active', i === idx));
      current = idx;
    }
    function step() {
      timer = null;
      if (current !== target) show(current + (target > current ? 1 : -1));
      if (current !== target) {
        timer = setTimeout(step, STEP_MS);
      } else if (onArrive) {
        const cb = onArrive;
        onArrive = null;
        cb();
      }
    }
    function goTo(t, cb) {
      target = t;
      onArrive = cb || null;
      if (!timer) timer = setTimeout(step, current === t ? 0 : 10);
    }
    // Rondje tijdens hover: vanuit volle sta-op -> relax -> (pauze) -> volle sta-op ...
    function cycle(next) {
      if (!hovering) return;
      goTo(next, () => {
        holdTimer = setTimeout(() => cycle(next === RELAX ? STAOP : RELAX), HOLD_MS);
      });
    }
    function start() {
      if (hovering) return;
      hovering = true;
      clearTimeout(holdTimer);
      cycle(RELAX);
    }
    function stop() {
      hovering = false;
      clearTimeout(holdTimer);
      goTo(STAOP);
    }
    logo.addEventListener('mouseenter', start);
    logo.addEventListener('mouseleave', stop);
    logo.addEventListener('focus', start);
    logo.addEventListener('blur', stop);

    if (!document.getElementById('nav-brand-chair-styles')) {
      const st = document.createElement('style');
      st.id = 'nav-brand-chair-styles';
      st.textContent = `
        .navbar .nav-text-logo.has-brand-chair,
        header .nav-text-logo.has-brand-chair {
          flex-direction: row !important;
          align-items: center !important;
          gap: 14px !important;
        }
        .nav-text-logo.has-brand-chair .nav-brand-chair {
          --chair-h: 64px;
          position: relative !important;
          display: block !important;
          flex: 0 0 auto !important;
          height: var(--chair-h) !important;
          width: calc(var(--chair-h) * 0.68) !important;
          overflow: visible !important;
          z-index: 2;
        }
        .nav-text-logo.has-brand-chair .nav-brand-chair-frame {
          position: absolute !important;
          top: calc(var(--chair-h) * -0.02) !important;
          left: calc(var(--chair-h) * -0.22) !important;
          height: calc(var(--chair-h) * 1.03) !important;
          width: auto !important;
          max-width: none !important;
          opacity: 0;
          transition: opacity 0.17s ease-out;
          filter: drop-shadow(0 3px 5px rgba(18, 43, 7, 0.18));
          pointer-events: none;
        }
        .nav-text-logo.has-brand-chair .nav-brand-chair-frame.is-active {
          opacity: 1;
        }
        .nav-text-logo.has-brand-chair:hover { opacity: 1 !important; }
        @media (max-width: 768px) {
          .navbar .nav-text-logo.has-brand-chair,
          header .nav-text-logo.has-brand-chair { gap: 9px !important; }
          .nav-text-logo.has-brand-chair .nav-brand-chair { --chair-h: 42px; }
        }
        @media (max-width: 359px) {
          .nav-text-logo.has-brand-chair .nav-brand-chair { --chair-h: 34px; }
        }
      `;
      document.head.appendChild(st);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();

// =========================================================================
// Automatische Bezoeker-Personalisatie voor Video Stoel René (Zonder 'Voor Hem / Voor Haar' tabs)
// =========================================================================
(function initReneVisitorPersonalization() {
  const STORAGE_KEY = "staop_rene_visitor_variant";

  window.getReneVisitorVariant = function() {
    try {
      // 1. Check URL / Campagne / UTM parameters
      const searchStr = ((window.location.search || "") + " " + (window.location.hash || "")).toLowerCase();
      if (/(vrouw|dame|haar|moeder|oma|boucle|beige|mevr)/i.test(searchStr)) {
        localStorage.setItem(STORAGE_KEY, "vrouw");
        return "vrouw";
      }
      if (/(man|heer|hem|vader|opa|groen|leder|dhr|meneer)/i.test(searchStr)) {
        localStorage.setItem(STORAGE_KEY, "man");
        return "man";
      }

      // 2. Check Maatwijzer lengte indien al gekozen in deze sessie
      if (typeof state !== "undefined" && state && state.wizardAnswers) {
        if (state.wizardAnswers.height === "small") {
          localStorage.setItem(STORAGE_KEY, "vrouw");
          return "vrouw";
        }
        if (state.wizardAnswers.height === "large") {
          localStorage.setItem(STORAGE_KEY, "man");
          return "man";
        }
      }

      // 3. Check eerder opgeslagen profiel van deze bezoeker
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "man" || saved === "vrouw") {
        return saved;
      }

      // 4. Wijs eenmalig een vaste variant toe per unieke bezoeker zodat het overal op de site consistent is
      const assigned = Math.random() < 0.5 ? "man" : "vrouw";
      localStorage.setItem(STORAGE_KEY, assigned);
      return assigned;
    } catch (e) {
      return "man";
    }
  };

  window.setReneVisitorVariant = function(variant) {
    if (variant !== "man" && variant !== "vrouw") return;
    try {
      localStorage.setItem(STORAGE_KEY, variant);
    } catch (e) {}
    window.syncReneVisitorVideoElements(variant);
  };

  window.syncReneVisitorVideoElements = function(forcedVariant) {
    const variant = forcedVariant || window.getReneVisitorVariant();
    const isSubdir = window.location.pathname.includes("/stoelen/");
    const pfx = isSubdir ? "../" : "";

    const videoSrc = variant === "vrouw"
      ? `${pfx}assets/video/staopstoelen_rene_aanbieding_web.mp4`
      : `${pfx}assets/video/staopstoelen_rene_man_aanbieding_web.mp4`;
    const posterSrc = variant === "vrouw"
      ? `${pfx}assets/rene_video_poster.jpg`
      : `${pfx}assets/rene_man_video_poster.jpg`;
    const durationSec = variant === "vrouw" ? "49 sec" : "53 sec";

    // 1. Homepage Spotlight Video (#renePromoVideo)
    const homeVid = document.getElementById("renePromoVideo");
    const homeLbl = document.getElementById("renePromoOverlayLabel");
    if (homeVid && homeVid.paused) {
      if (homeVid.getAttribute("src") !== videoSrc) {
        homeVid.src = videoSrc;
      }
      homeVid.poster = posterSrc;
      if (homeLbl) {
        homeLbl.textContent = `▶ Bekijk video (${durationSec})`;
      }
    }

    // 2. Detailpagina Stoel René (#reneDetailVideo)
    const detailVid = document.getElementById("reneDetailVideo");
    if (detailVid && detailVid.paused) {
      if (detailVid.getAttribute("src") !== videoSrc) {
        detailVid.src = videoSrc;
      }
      detailVid.poster = posterSrc;
    }
  };

  // Luister ook subtiel naar invoer in formulieren of de assistent (bijv. "Mevr.", "moeder", "Dhr.", "vader")
  document.addEventListener("input", function(e) {
    const val = (e.target && e.target.value ? String(e.target.value) : "").toLowerCase();
    if (val.length < 3) return;
    if (/\b(mevr|mevrouw|moeder|oma|haar)\b/.test(val)) {
      window.setReneVisitorVariant("vrouw");
    } else if (/\b(dhr|meneer|vader|opa|hem)\b/.test(val)) {
      window.setReneVisitorVariant("man");
    }
  }, { passive: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => window.syncReneVisitorVideoElements());
  } else {
    window.syncReneVisitorVideoElements();
  }
})();
