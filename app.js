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
function logCustomVisitEvent(eventName = 'pageview') {
  try {
    // Ignore logging admin dashboard views and excluded devices (own visits)
    if (window.location.pathname.includes('beheer.html') ||
        sessionStorage.getItem('adminLoggedIn') === 'true' ||
        localStorage.getItem('staopstoelen_ignore_analytics') === 'true' ||
        document.cookie.indexOf('staopstoelen_ignore_analytics=true') !== -1) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const logData = {
      page_url: window.location.pathname + window.location.hash,
      referrer_url: document.referrer || '',
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      device_type: window.innerWidth < 768 ? 'mobile' : (window.innerWidth < 1024 ? 'tablet' : 'desktop'),
      event_name: eventName
    };
    
    fetch('api/log_visit.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch(err => console.warn('Logging error:', err));
  } catch (e) {
    console.warn('Logging failed:', e);
  }
}

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
    trackGoogleAdsConversion('phone', {
      event_category: 'Contact',
      event_label: 'Bellen: ' + href.replace('tel:', '')
    });
  }
  
  // WhatsApp klik
  if (href.includes('wa.me') || href.includes('whatsapp.com')) {
    trackGoogleAdsConversion('whatsapp', {
      event_category: 'Contact',
      event_label: 'WhatsApp Chat'
    });
  }
});

// Log pageview on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  logCustomVisitEvent('pageview');
});

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
          <h3 id="appointmentModalTitle" class="appointment-quick-title">Plan uw proefzit-afspraak</h3>
          <p class="appointment-quick-subtitle">Showroom Dordrecht &bull; Persoonlijk advies door Geertjan</p>
        </div>
      </div>

      <!-- Video: Zitmeting & Proefzitten in Dordrecht (In 38 seconden) -->
      <div class="appointment-modal-video-card">
        <div class="appointment-modal-video-wrap">
          <video 
            id="modalZitmetingVideo" 
            controls 
            playsinline 
            preload="metadata" 
            poster="${base}assets/video/zitmeting_poster.jpg?v=10.241"
            class="appointment-modal-video">
            <source src="${base}assets/video/zitmeting_proefzitten_dordrecht.mp4?v=10.241" type="video/mp4">
            Uw browser ondersteunt geen video.
          </video>
        </div>
        <div class="appointment-modal-video-caption">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20"></polygon></svg>
          <span>Bekijk in 45 sec hoe een persoonlijke zitmeting bij Geertjan verloopt</span>
        </div>
      </div>

      <!-- Keuze Intro & 2 Knoppen: Linksaf (Bel mij) of Rechtsaf (Agenda) -->
      <div class="appointment-choice-intro">Hoe wilt u uw afspraak inplannen?</div>
      <div class="appointment-choice-selector" role="tablist" aria-label="Kies afspraakmethode">
        <!-- Keuze 1: Bel mij terug (Linksaf) -->
        <button type="button" class="appointment-choice-btn active" id="btnChoiceCallback" role="tab" aria-selected="true" onclick="switchAppointmentMode('callback')">
          <div class="choice-btn-icon-wrap">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z"/>
            </svg>
          </div>
          <div class="choice-btn-text">
            <strong class="choice-btn-title">Bel mij terug</strong>
            <span class="choice-btn-sub">Geertjan stemt af</span>
          </div>
        </button>

        <!-- Keuze 2: Zelf tijd kiezen in agenda (Rechtsaf) -->
        <button type="button" class="appointment-choice-btn" id="btnChoiceAgenda" role="tab" aria-selected="false" onclick="switchAppointmentMode('agenda')">
          <div class="choice-btn-icon-wrap">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div class="choice-btn-text">
            <strong class="choice-btn-title">Zelf tijd kiezen</strong>
            <span class="choice-btn-sub">Direct in de agenda</span>
          </div>
        </button>
      </div>

      <!-- Merwedestraat netjes als tekst met icoon onder de opties (geen lompe box) -->
      <div class="appointment-location-line">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="location-line-icon">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>Merwedestraat 239, Dordrecht &bull; Gratis parkeren voor de deur</span>
      </div>

      <!-- PANEEL 1: BEL MIJ TERUG (Zelfde box styling als Agenda) -->
      <div id="appointmentPanelCallback" class="appointment-panel active">
        <form id="quickAppointmentForm" class="appointment-choice-card" onsubmit="return handleQuickAppointmentSubmit(event)" novalidate>
          <input type="hidden" id="quickChairNotes" name="chair_notes" value="">

          <div class="form-content-top">
            <!-- Stoel Context Badge (indien geklikt vanuit specifieke stoel) -->
            <div id="quickChairBadge" class="appointment-chair-tag" style="display: none;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Gekozen stoel: <strong id="quickChairBadgeName"></strong></span>
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
              <span class="btn-text">Bel mij voor een afspraak</span>
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
              <span>Uw gegevens zijn veilig en worden alleen gebruikt voor deze afspraak.</span>
            </div>
          </div>
        </form>
      </div>

      <!-- PANEEL 2: ZELF INPLANNEN IN DE AGENDA (Exact zelfde box styling) -->
      <div id="appointmentPanelAgenda" class="appointment-panel" style="display: none;">
        <div class="appointment-choice-card">
          <div class="agenda-content-top">
            <h4 class="agenda-title-new">Zelf een moment kiezen in de showroom</h4>
            <p class="agenda-desc-new">
              Kies direct een dag en tijdstip dat u uitkomt. Geertjan reserveert de showroom voor u en zorgt dat de koffie klaarstaat.
            </p>

            <ul class="agenda-features-new">
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#256616" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Direct inzicht in alle beschikbare dagen &amp; tijden</span>
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#256616" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Rustig 30+ modellen proefzitten met deskundig zitadvies</span>
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#256616" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Persoonlijk 1-op-1 advies van Bewegingstechnoloog Geertjan</span>
              </li>
            </ul>
          </div>

          <div class="card-content-bottom">
            <a href="afspraak.html#bookingCard" class="btn btn-primary appointment-agenda-cta-btn" onclick="goToOnlineAgenda(event)">
              <span>Zelf datum &amp; tijd kiezen in agenda</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>

            <div class="appointment-trust-microcopy">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Geen account nodig &bull; Directe bevestiging in uw mailbox</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Dedicated Direct Contact Card: Gedeeld tussen beide opties (Beweegt NOOIT!) -->
      <div class="appointment-direct-box">
        <div class="appointment-direct-head">
          <span class="appointment-direct-badge">
            <span class="direct-pulse-dot"></span>
            Direct contact
          </span>
          <span class="appointment-direct-title">Liever meteen persoonlijk contact?</span>
        </div>
        <div class="appointment-direct-grid">
          <a href="tel:0786314858" class="appointment-direct-card-btn appointment-btn-phone" title="Bel direct naar de showroom">
            <span class="direct-card-icon-wrap phone-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </span>
            <span class="direct-card-text">
              <span class="direct-card-sublabel">Bellen &bull; Showroom</span>
              <strong class="direct-card-value">078 &ndash; 631 4858</strong>
            </span>
          </a>

          <a href="https://wa.me/31622232964?text=Hallo%20Geertjan,%20ik%20heb%20een%20vraag%20over%20een%20sta-op%20stoel" target="_blank" rel="noopener noreferrer" class="appointment-direct-card-btn appointment-btn-whatsapp" title="Stuur Geertjan direct een WhatsApp bericht">
            <span class="direct-card-icon-wrap wa-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </span>
            <span class="direct-card-text">
              <span class="direct-card-sublabel">WhatsApp &bull; Geertjan</span>
              <strong class="direct-card-value">06 &ndash; 2223 2964</strong>
            </span>
          </a>
        </div>
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
          Geertjan belt u zo snel mogelijk om de proefzit-afspraak af te stemmen.
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

  const payload = {
    brand: "staopstoelen",
    site: "staopstoelen.nl",
    type: "quick_appointment_call_me",
    appointmentType: "showroom",
    name: name,
    phone: phone,
    email: "belmij@staopstoelen.nl",
    replyTo: "info@staopstoelen.nl",
    notes: chair 
      ? `Snelafspraak via overlay: Klant wil gebeld worden door Geertjan voor proefzitten. Gekozen stoel: ${chair}` 
      : "Snelafspraak via overlay: Klant wil gebeld worden door Geertjan om een proefzit-afspraak in te plannen.",
    source: "Afspraak-Overlay Snelformulier (Bel mij)",
    pageUrl: window.location.href,
    timestamp: new Date().toISOString()
  };

  // 1. Post to Webhook (Google Apps Script / Email / Calendar notification)
  if (typeof GOOGLE_CALENDAR_WEBHOOK_URL !== "undefined" && GOOGLE_CALENDAR_WEBHOOK_URL) {
    fetch(GOOGLE_CALENDAR_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload)
    })
    .then(res => console.log("Quick appointment webhook response:", res))
    .catch(err => console.warn("Quick appointment webhook error:", err));
  }

  // 2. Analytics & Conversion Tracking
  try {
    if (typeof logCustomVisitEvent === "function") {
      logCustomVisitEvent('booking_conversion', { type: 'quick_appointment', name: name, phone: phone, chair: chair });
    }
    if (typeof trackGoogleAdsConversion === "function") {
      trackGoogleAdsConversion('appointment', { name: name, phone: phone });
    }
    if (typeof gtag === "function") {
      gtag('event', 'generate_lead', {
        event_category: 'Afspraak',
        event_label: 'Snelafspraak Bel Mij Geertjan',
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
    
    const cleanPhone = phone.replace(/\s+/g, "");
    const startsWithPlus31 = cleanPhone.startsWith("+31");
    let isPhoneValid = false;
    
    if (startsWithPlus31) {
      isPhoneValid = /^\+31\d{9}$/.test(cleanPhone);
    } else {
      isPhoneValid = /^\d{10}$/.test(cleanPhone);
    }
    
    if (!isPhoneValid) {
      alert("Vul a.u.b. een geldig telefoonnummer in (10 cijfers, of 12 tekens beginnend met +31).");
      return;
    }
    
    // E-mailadres validatie
    if (!email) {
      alert("Vul a.u.b. uw e-mailadres in.");
      return;
    }
    if (!email.includes("@")) {
      alert("Vul a.u.b. een geldig e-mailadres in.");
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

    if (typeof GOOGLE_CALENDAR_WEBHOOK_URL !== "undefined" && GOOGLE_CALENDAR_WEBHOOK_URL) {
      fetch(GOOGLE_CALENDAR_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain"
        },
        body: JSON.stringify(bookingPayload)
      })
      .then(response => {
        console.log("Google Calendar Webhook success:", response);
        transitionToSuccess();
      })
      .catch(error => {
        console.error("Google Calendar Webhook failure:", error);
        transitionToSuccess();
      });
    } else {
      // Fallback: wait a brief moment to simulate processing
      setTimeout(transitionToSuccess, 1000);
    }
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
  // Calculate minimum allowed booking date (today + 2 days)
  const minAllowedDate = new Date(todayStart.getTime());
  minAllowedDate.setDate(minAllowedDate.getDate() + 2);
  
  for (let day = 1; day <= totalDays; day++) {
    const dateCell = document.createElement("button");
    dateCell.type = "button";
    dateCell.className = "calendar-day-btn";
    dateCell.textContent = day;
    
    const thisDate = new Date(year, month, day);
    
    // Disable past dates and dates less than 2 days in advance (today and tomorrow)
    const isPastOrTooSoon = thisDate < minAllowedDate;
    
    // Disable Sundays and Mondays (closed)
    const isSunday = thisDate.getDay() === 0;
    const isMonday = thisDate.getDay() === 1;
    
    if (isPastOrTooSoon || isSunday || isMonday) {
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
  const wrapper = document.getElementById("floatingContactWrapper");
  const mainBtn = document.getElementById("btnFloatingMain");
  const oldMenu = document.getElementById("floatingMenu");

  if (!wrapper || !mainBtn) return;
  if (wrapper.dataset.assistantInitialized === "true") return;
  wrapper.dataset.assistantInitialized = "true";

  const isSubdir = window.location.pathname.includes("/stoelen/");
  const base = isSubdir ? "../" : "";
  const normalChairSrc = `${base}assets/assistent-stoel.svg?v=10.234`;
  const danceChairSrc = `${base}assets/assistent-stoel-dance.svg?v=10.234`;

  // Preload de dansende SVG zodat hij bij de allereerste klik/dubbelklik zonder enige vertraging start
  const preloadDance = new Image();
  preloadDance.src = danceChairSrc;

  // Zorg dat het 3D Sta-op Stoel icoon ook direct als SVG-favicon actief is in het browsertabblad
  if (!document.querySelector('link[rel="icon"][type="image/svg+xml"]')) {
    const fav = document.createElement("link");
    fav.rel = "icon";
    fav.type = "image/svg+xml";
    fav.href = `${base}favicon.svg?v=10.234`;
    document.head.appendChild(fav);
  }

  // Injecteer kritieke CSS ook direct in <head> zodat gecachete stylesheets nooit een te grote SVG tonen
  if (!document.getElementById("da-inline-styles")) {
    const st = document.createElement("style");
    st.id = "da-inline-styles";
    st.textContent = `
      .nav-text-logo.has-chair-logo { display: inline-flex !important; align-items: center !important; gap: 11px !important; top: 4px !important; }
      .nav-chair-logo-icon { width: 56px !important; height: 56px !important; max-width: 56px !important; max-height: 56px !important; object-fit: contain !important; flex-shrink: 0 !important; display: block !important; transform-origin: 50% 80%; filter: drop-shadow(0 4px 8px rgba(18,43,7,0.16)); cursor: pointer; }
      .nav-logo-text-group { display: flex !important; flex-direction: column !important; color: var(--color-forest, #4b8f24) !important; }
      .floating-btn-main.assistant-chair-fab { position: relative !important; width: 72px !important; height: 72px !important; border-radius: 50% !important; background: radial-gradient(circle at 35% 30%, #ffffff 0%, #f4f9ef 65%, #e5f1db 100%) !important; border: 2.5px solid #4b8f24 !important; box-shadow: 0 10px 28px rgba(18,43,7,0.24), 0 0 0 4px rgba(75,143,36,0.14) !important; padding: 6px !important; display: flex !important; align-items: center !important; justify-content: center !important; transform: none !important; }
      .assistant-chair-img { width: 58px !important; height: 58px !important; max-width: 58px !important; max-height: 58px !important; object-fit: contain !important; display: block !important; pointer-events: none; transform-origin: 50% 80%; }
      .da-avatar-img { width: 32px !important; height: 32px !important; max-width: 32px !important; max-height: 32px !important; object-fit: contain !important; transform-origin: 50% 80%; }
      @media (max-width: 768px) {
        .nav-text-logo.has-chair-logo { top: 6px !important; gap: 8px !important; }
        .nav-chair-logo-icon { width: 42px !important; height: 42px !important; max-width: 42px !important; max-height: 42px !important; }
        .floating-btn-main.assistant-chair-fab { width: 62px !important; height: 62px !important; }
        .assistant-chair-img { width: 48px !important; height: 48px !important; max-width: 48px !important; max-height: 48px !important; }
      }
    `;
    document.head.appendChild(st);
  }

  // Plaats het 3D Sta-op Stoel logo direct naast "staopstoelen.nl" in de navigatiebalk
  const navLogo = document.getElementById("navTextLogo") || document.querySelector(".nav-text-logo");
  let navChairImg = null;
  if (navLogo && !navLogo.querySelector(".nav-chair-logo-icon")) {
    const existingInner = navLogo.innerHTML;
    navLogo.classList.add("has-chair-logo");
    navLogo.style.cssText += ";display:inline-flex !important;align-items:center !important;gap:11px !important;";
    navLogo.innerHTML = `
      <img src="${normalChairSrc}" width="56" height="56" style="width:56px;height:56px;max-width:56px;max-height:56px;flex-shrink:0;display:block;object-fit:contain;" alt="Staopstoelen.nl 3D Sta-op Stoel Logo" class="nav-chair-logo-icon" id="navChairLogoImg" title="Dubbelklik om de stoel te laten dansen">
      <div class="nav-logo-text-group" style="display:flex;flex-direction:column;">${existingInner}</div>
    `;
    navChairImg = document.getElementById("navChairLogoImg");
  }

  // Verberg het oude losse 3-knoppen menu (deze zitten nu geïntegreerd onderin de Digitale Assistent)
  if (oldMenu) {
    oldMenu.style.display = "none";
  }

  // Upgrade de zwevende hoofdknop met het 3D Sta-op Stoel icoon + live status
  mainBtn.classList.add("assistant-chair-fab");
  mainBtn.setAttribute("aria-label", "Open Digitale Zit-Assistent (dubbelklik om de stoel te laten dansen)");
  mainBtn.setAttribute("title", "Digitale Zit-Assistent • Klik voor hulp, dubbelklik om te dansen");
  mainBtn.innerHTML = `
    <span class="assistant-fab-halo" aria-hidden="true"></span>
    <img src="${normalChairSrc}" width="58" height="58" style="width:58px;height:58px;max-width:58px;max-height:58px;object-fit:contain;display:block;" alt="Digitale Zit-Assistent Sta-op Stoel" class="assistant-chair-img" id="assistantFabImg">
    <span class="assistant-online-dot" aria-hidden="true"></span>
  `;

  // Voeg welkomst-badge toe naast de zwevende stoel-knop
  const teaser = document.createElement("div");
  teaser.className = "assistant-teaser-pill";
  teaser.id = "assistantTeaserPill";
  teaser.innerHTML = `
    <button type="button" class="assistant-teaser-open" id="assistantTeaserOpen">
      <span class="assistant-teaser-badge">Digitale Assistent</span>
      <span class="assistant-teaser-text">Vraag over uw zithouding of stoel?</span>
    </button>
    <button type="button" class="assistant-teaser-close" id="assistantTeaserClose" aria-label="Sluit melding">&times;</button>
  `;

  // Bouw het interactieve Digitale Assistent venster
  const panel = document.createElement("div");
  panel.className = "digital-assistant-panel";
  panel.id = "digitalAssistantPanel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Digitale Zit-Assistent van Staopstoelen.nl");
  panel.innerHTML = `
    <div class="da-header">
      <div class="da-avatar-wrap" id="daHeaderAvatarWrap" title="Digitale Zit-Assistent">
        <img src="${normalChairSrc}" alt="Digitale Zit-Assistent" class="da-avatar-img" id="daHeaderChairImg">
        <span class="da-avatar-status"></span>
      </div>
      <div class="da-header-info">
        <strong class="da-title">Digitale Zit-Assistent</strong>
        <span class="da-tag">Online</span>
      </div>
      <div class="da-header-actions">
        <button type="button" class="da-close-btn" id="daCloseBtn" aria-label="Sluit assistent">&times;</button>
      </div>
    </div>

    <div class="da-body" id="daChatBody">
      <div class="da-msg da-msg-bot">
        <div class="da-msg-bubble">
          <strong>Welkom bij Staopstoelen.nl!</strong><br>
          Ik ben uw digitale zit-assistent. Ik help u graag met uw zoektocht naar de juiste sta-op stoel, maadvies of proefzitten in Dordrecht. Waar wilt u meer over weten?
        </div>
      </div>
      <div class="da-quick-chips" id="daQuickChips">
        <button type="button" class="da-chip" data-topic="maat">Welke stoel past bij mijn lengte &amp; klachten?</button>
        <button type="button" class="da-chip" data-topic="prijs">Wat kost een (Certified Fitform) stoel?</button>
        <button type="button" class="da-chip" data-topic="proefzitten">Hoe werkt proefzitten of passing aan huis?</button>
        <button type="button" class="da-chip" data-topic="vergoeding">Wordt een sta-op stoel vergoed?</button>
      </div>
    </div>

    <form class="da-input-bar" id="daQuestionForm" autocomplete="off">
      <input type="text" class="da-input" id="daQuestionInput" placeholder="Stel hier uw vraag (bijv. zithoogte, prijs, thuis)..." aria-label="Stel uw vraag aan de digitale assistent">
      <button type="submit" class="da-send-btn" aria-label="Verstuur vraag">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </form>

    <div class="da-footer-actions">
      <a href="${base}afspraak.html" class="da-action-btn da-action-primary" onclick="openAppointmentModal(event)">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>Plan Afspraak</span>
      </a>
      <a href="tel:+31786314858" class="da-action-btn da-action-call">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        <span>078 - 631 4858</span>
      </a>
      <a href="https://wa.me/31622232964" target="_blank" rel="noopener" class="da-action-btn da-action-wa">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        <span>WhatsApp</span>
      </a>
    </div>
  `;

  wrapper.insertBefore(panel, mainBtn);
  wrapper.insertBefore(teaser, mainBtn);

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
    const targets = imgEl ? [imgEl] : [fabImg, headerImg, navChairImg].filter(Boolean);
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

  // Dubbelklik op het stoel-logo naast staopstoelen.nl in de header laat hem ook dansen met muziek
  if (navLogo && navChairImg) {
    let navLogoClickTimer = null;
    let navLogoLastClick = 0;
    navLogo.addEventListener("click", (e) => {
      if (e.target.closest(".nav-chair-logo-icon")) {
        e.preventDefault();
        const now = Date.now();
        if (e.detail >= 2 || now - navLogoLastClick < 360) {
          clearTimeout(navLogoClickTimer);
          navLogoLastClick = 0;
          triggerChairDance(navChairImg, true);
          return;
        }
        navLogoLastClick = now;
        clearTimeout(navLogoClickTimer);
        navLogoClickTimer = setTimeout(() => {
          const href = navLogo.getAttribute("href");
          if (href) window.location.href = href;
        }, 300);
      }
    });
    navLogo.addEventListener("dblclick", (e) => {
      e.preventDefault();
      clearTimeout(navLogoClickTimer);
      navLogoLastClick = 0;
      triggerChairDance(navChairImg, true);
    });
  }

  window.triggerAssistantChairDance = () => triggerChairDance(null, true);

  function openAssistant() {
    panel.classList.add("active");
    teaser.classList.add("hidden");
    triggerChairDance(headerImg, false);
  }

  function closeAssistant() {
    panel.classList.remove("active");
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
  document.getElementById("assistantTeaserOpen")?.addEventListener("click", (e) => {
    e.stopPropagation();
    openAssistant();
  });
  document.getElementById("assistantTeaserClose")?.addEventListener("click", (e) => {
    e.stopPropagation();
    teaser.classList.add("hidden");
    try { sessionStorage.setItem("da_teaser_dismissed", "1"); } catch {}
  });

  try {
    if (sessionStorage.getItem("da_teaser_dismissed") === "1") {
      teaser.classList.add("hidden");
    }
  } catch {}

  // Antwoord-kennisbank van de Digitale Zit-Assistent
  function getAssistantResponse(topicOrQuery) {
    const q = String(topicOrQuery || "").toLowerCase();

    if (q === "maat" || q.includes("lengte") || q.includes("maat") || q.includes("rug") || q.includes("klacht") || q.includes("welke stoel")) {
      return {
        question: q === "maat" ? "Welke stoel past bij mijn lengte & klachten?" : topicOrQuery,
        html: `Een goede sta-op stoel wordt altijd op <strong>5 lichaamsmaten</strong> afgesteld: zithoogte, zitdiepte, zitbreedte, armleggerhoogte en lendensteun.<br><br>Met onze <strong>Online Keuzehulp</strong> ziet u in 3 stappen welk Fitform of seniorenmodel bij uw lengte en klachten past:`,
        ctaHtml: `<div class="da-inline-ctas"><a href="${base}keuzehulp.html" class="da-inline-btn">Start Online Keuzehulp &rarr;</a><a href="${base}stoel-anatomie.html" class="da-inline-btn da-inline-btn-sec">Bekijk 5 Maatwerkcriteria</a></div>`
      };
    }

    if (q === "prijs" || q.includes("kost") || q.includes("prijs") || q.includes("prijzen") || q.includes("occasion") || q.includes("tweedehands") || q.includes("goedkoop")) {
      return {
        question: q === "prijs" ? "Wat kost een (Certified Fitform) stoel?" : topicOrQuery,
        html: `Bij ons heeft u keuze uit twee categorieën:<br>• <strong>Certified Fitform (Jong gebruikt &amp; gereviseerd):</strong> v.a. <strong>&euro; 695,- tot &euro; 1.495,-</strong> (volledig 15-punts gekeurd incl. garantie).<br>• <strong>Nieuw op maat:</strong> volledig naar wens samengesteld.<br><br>Alle actuele voorraadmodellen staan direct met prijs online:`,
        ctaHtml: `<div class="da-inline-ctas"><a href="${base}staopstoelen.html" class="da-inline-btn">Bekijk Collectie &amp; Prijzen &rarr;</a><a href="${base}wat-kost-een-sta-op-stoel.html" class="da-inline-btn da-inline-btn-sec">Prijsuitleg lezen</a></div>`
      };
    }

    if (q === "proefzitten" || q.includes("proefzit") || q.includes("thuis") || q.includes("showroom") || q.includes("dordrecht") || q.includes("adres") || q.includes("parkeren") || q.includes("afspraak")) {
      return {
        question: q === "proefzitten" ? "Hoe werkt proefzitten of passing aan huis?" : topicOrQuery,
        html: `U bent van harte welkom in onze showroom aan de <strong>Merwedestraat 239 in Dordrecht</strong> (gratis parkeren voor de deur, gelijkvloers).<br><br>Bewegingstechnoloog <strong>Geertjan Klein Haneveld</strong> doet een vrijblijvende zitmeting en stelt meerdere stoelen op uw maat in. Woont u in de <strong>regio Dordrecht (Drechtsteden)</strong> en lukt langskomen niet? Dan komt Geertjan kosteloos bij u thuis proefpassen!`,
        ctaHtml: `<div class="da-inline-ctas"><a href="${base}afspraak.html" class="da-inline-btn" onclick="openAppointmentModal(event)">Plan Proefzit-Afspraak &rarr;</a><button type="button" class="da-inline-btn da-inline-btn-sec" onclick="if(window.openCertifiedVideoModal)openCertifiedVideoModal('zitmeting')">Bekijk Video (38 sec)</button></div>`
      };
    }

    if (q === "vergoeding" || q.includes("vergoed") || q.includes("wmo") || q.includes("zorgverzeker") || q.includes("indicatie") || q.includes("pgb")) {
      return {
        question: q === "vergoeding" ? "Wordt een sta-op stoel vergoed?" : topicOrQuery,
        html: `In specifieke medische situaties is vergoeding mogelijk via uw zorgverzekeraar of gemeente (Wmo / PGB). Veel klanten kiezen echter voor een <strong>Certified Fitform occasion</strong> omdat u dan zonder lange wachttijd direct op maat geholpen bent.<br><br>Geertjan denkt hierin graag eerlijk met u mee:`,
        ctaHtml: `<div class="da-inline-ctas"><a href="${base}indicatiewijzer.html" class="da-inline-btn">Open Indicatiewijzer &rarr;</a><a href="${base}afspraak.html" class="da-inline-btn da-inline-btn-sec" onclick="openAppointmentModal(event)">Vraag Advies aan Geertjan</a></div>`
      };
    }

    return {
      question: topicOrQuery,
      html: `Bedankt voor uw vraag! Omdat elk lichaam anders is, kijkt bewegingstechnoloog <strong>Geertjan Klein Haneveld</strong> graag persoonlijk met u mee. U kunt direct bellen op <strong>078 - 631 4858</strong>, een WhatsApp sturen of vrijblijvend een proefzit-afspraak plannen.`,
      ctaHtml: `<div class="da-inline-ctas"><a href="${base}afspraak.html" class="da-inline-btn" onclick="openAppointmentModal(event)">Plan Adviesgesprek &rarr;</a><a href="${base}faq.html" class="da-inline-btn da-inline-btn-sec">Veelgestelde vragen</a></div>`
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
        label: "📞 Bel 078 - 631 4858",
        href: "tel:+31786314858",
        primary: false
      },
      whatsapp: {
        label: "💬 WhatsApp met Geertjan",
        href: "https://wa.me/31622232964",
        target: "_blank",
        primary: false
      }
    };

    const btns = actions.map((act) => {
      const def = actionDefs[act];
      if (!def) return "";
      const cls = def.primary ? "da-inline-btn" : "da-inline-btn da-inline-btn-sec";
      const onclickAttr = def.onclick ? ` onclick="${def.onclick}"` : "";
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
      proefzitten: "Hoe werkt proefzitten of passing aan huis?",
      vergoeding: "Wordt een sta-op stoel vergoed?"
    };
    const userText = chipLabels[topicOrQuery] || topicOrQuery;

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
  let overlay = document.getElementById("certifiedVideoLightbox");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "certifiedVideoLightbox";
    overlay.className = "video-lightbox-overlay";
    overlay.innerHTML = `
      <div class="video-lightbox-card" onclick="event.stopPropagation()">
        <div class="video-lightbox-header">
          <div class="video-lightbox-title">
            <span class="video-lightbox-dot"></span>
            <span id="videoLightboxHeading">Waarom Certified Fitform</span>
          </div>
          <div class="video-lightbox-actions">
            <a href="afspraak.html" class="video-lightbox-cta-btn" onclick="closeCertifiedVideoModal()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>Afspraak Inplannen</span>
            </a>
            <button type="button" class="video-lightbox-close" onclick="closeCertifiedVideoModal()" aria-label="Sluit video" title="Sluit video">
              &#10005;
            </button>
          </div>
        </div>
        <div class="video-lightbox-frame-wrap">
          <video 
            id="videoLightboxPlayer" 
            src="assets/video/staopstoelen_bedrijfsvideo_dordrecht.mp4?v=10.241" 
            poster="assets/video/video_poster_scene2.jpg?v=10.241" 
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

  if (mode === "afspraak" || mode === "zitmeting" || mode === "proefzitten") {
    if (heading) heading.textContent = "Persoonlijke Zitmeting & Proefzitten Dordrecht";
    if (iframe) {
      iframe.src = "";
      iframe.style.display = "none";
    }
    if (player) {
      player.src = "assets/video/zitmeting_proefzitten_dordrecht.mp4?v=10.241";
      player.poster = "assets/video/zitmeting_poster.jpg?v=10.241";
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
      iframe.src = `certified-fitform-video.html?mode=afspraak&embed=1&autoplay=1&v=10.241`;
    }
  } else if (mode === "revisie" || mode === "inspectie") {
    if (heading) heading.textContent = "Het Volledige Revisieproces • Certified Fitform";
    if (iframe) {
      iframe.src = "";
      iframe.style.display = "none";
    }
    if (player) {
      player.src = "assets/video/revisie_proces_dordrecht.mp4?v=10.241";
      player.poster = "assets/video/revisie_poster.jpg?v=10.241";
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
      iframe.src = `certified-fitform-video.html?mode=consumer&embed=1&autoplay=1&v=10.241`;
    }
  } else {
    if (heading) heading.textContent = "Waarom Certified Fitform";
    if (iframe) {
      iframe.src = "";
      iframe.style.display = "none";
    }
    if (player) {
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




