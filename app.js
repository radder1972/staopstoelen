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
      window['ga-disable-G-3L01HS159K'] = true;
      window['ga-disable-AW-923357429'] = true;
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
const GOOGLE_ADS_CONFIG = {
  id: 'AW-923357429',
  labels: {
    appointment: 'WfpDCLCA1psdEPWhpbgD', // Leadformulier indienen conversie
    phone: '',                           // Optioneel: vul conversielabel in voor bellen
    whatsapp: ''                         // Optioneel: vul conversielabel in voor WhatsApp
  }
};

function trackGoogleAdsConversion(conversionType, details = {}) {
  try {
    if (typeof window.gtag === 'function') {
      const label = GOOGLE_ADS_CONFIG.labels[conversionType] || '';
      const sendTo = label ? `${GOOGLE_ADS_CONFIG.id}/${label}` : GOOGLE_ADS_CONFIG.id;
      
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
  initWizard();
  initSlider();
  initCalendar();
  initFloatingMenu();
  initMobileMenu();
  initHeroSlideshow();
  initFaqAccordion();

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
      if (e.target.closest(".slideshow-ctrl") || e.target.closest(".slideshow-actie-badge")) return;
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

// Helper to prefill details and jump to the scheduling calendar
window.prefillBooking = function(chairName) {
  const notesField = document.getElementById("bookingNotes");
  if (notesField) {
    notesField.value = `Ik wil deze stoel graag uitproberen tijdens mijn afspraak: ${chairName}.`;
  }
  
  // Jump smoothly to scheduling section
  const section = document.getElementById("afspraak-planner");
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
};


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
  prevMonth.addEventListener("click", () => {
    state.currentDate.setMonth(state.currentDate.getMonth() - 1);
    renderCalendar();
  });
  
  nextMonth.addEventListener("click", () => {
    state.currentDate.setMonth(state.currentDate.getMonth() + 1);
    renderCalendar();
  });
  
  // Reset booking form
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
  
  // Submit Action
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
        
        const startDateObj = new Date(year, month, day, startH, startM, 0);
        const endDateObj = new Date(year, month, day, endH, endM, 0);
        
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

    const customerEmailHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #222222; max-width: 600px; margin: 0 auto; padding: 24px 20px; background-color: #ffffff;">
        
        <!-- Kop: Logo met strapline -->
        <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e8e8e8;">
          <a href="https://staopstoelen.nl" target="_blank" style="text-decoration: none; display: inline-block;">
            <img src="https://staopstoelen.nl/assets/logo_email.png" alt="staopstoelen.nl - Specialist in Ergonomisch Zitcomfort • Fitform Dealer" width="280" style="display: block; border: 0; width: 280px; height: auto; max-width: 100%;">
          </a>
        </div>

        <p style="margin: 0 0 16px 0; color: #222222;">Beste ${name},</p>
        
        <p style="margin: 0 0 20px 0; color: #333333;">
          Bedankt voor uw aanvraag. Uw afspraak staat bij ons genoteerd met de volgende gegevens:
        </p>

        <!-- Overzicht afspraak: rustig en overzichtelijk -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; line-height: 1.6;">
          <tr>
            <td style="padding: 6px 0; color: #666666; width: 140px;">Type afspraak:</td>
            <td style="padding: 6px 0; color: #111111; font-weight: bold;">${typeLabel}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666666;">Datum:</td>
            <td style="padding: 6px 0; color: #111111; font-weight: bold;">${formattedBookingDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666666;">Tijdstip:</td>
            <td style="padding: 6px 0; color: #111111; font-weight: bold;">${state.selectedTimeSlot}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666666;">Adres / Locatie:</td>
            <td style="padding: 6px 0; color: #111111;">${locationStr}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666666;">Telefoonnummer:</td>
            <td style="padding: 6px 0; color: #111111;">${phone}</td>
          </tr>
          ${notes && notes !== '-' ? `
          <tr>
            <td style="padding: 6px 0; color: #666666;">Uw opmerkingen:</td>
            <td style="padding: 6px 0; color: #111111;">${notes}</td>
          </tr>` : ''}
        </table>

        <p style="margin: 20px 0 6px 0; font-weight: bold; color: #111111;">Hoe nu verder?</p>
        <p style="margin: 0 0 20px 0; color: #333333;">
          Ik zal telefonisch contact met u opnemen om de afspraak te bevestigen en eventuele details door te nemen.
        </p>

        ${state.appointmentType === "showroom" ? `
        <p style="margin: 20px 0 6px 0; font-weight: bold; color: #111111;">Praktische informatie showroombezoek:</p>
        <p style="margin: 0 0 24px 0; color: #333333;">
          Adres: Merwedestraat 239, 3313 GT Dordrecht.<br>
          U kunt gratis direct voor de deur parkeren. Onze showroom is rolstoeltoegankelijk en de koffie staat klaar!
        </p>` : ''}

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
      emailSubject: "Bevestiging van uw aanvraag voor een adviesgesprek - Staopstoelen.nl",
      senderName: "Geertjan Klein Haneveld - Staopstoelen.nl",
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
   FLOATING ACTION BUTTON CONTACT MENU
   ========================================================================== */
function initFloatingMenu() {
  const mainBtn = document.getElementById("btnFloatingMain");
  const menu = document.getElementById("floatingMenu");
  
  if (!mainBtn || !menu) return;
  
  mainBtn.addEventListener("click", (e) => {
    menu.classList.toggle("active");
    e.stopPropagation();
  });
  
  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && e.target !== mainBtn) {
      menu.classList.remove("active");
    }
  });
  
  // Close menu when a link inside is clicked
  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      menu.classList.remove("active");
    });
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
          <img src="https://staopstoelen.nl/assets/logo_email.png" alt="staopstoelen.nl - Specialist in Ergonomisch Zitcomfort • Fitform Dealer" width="280" style="display: block; border: 0; width: 280px; height: auto; max-width: 100%;">
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
    name: name || "Geïnteresseerde",
    email: email,
    phone: "",
    appointmentType: "checklist_download",
    emailSubject: "Uw Zithouding Checklist (PDF) - Staopstoelen.nl",
    senderName: "Geertjan Klein Haneveld - Staopstoelen.nl",
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

