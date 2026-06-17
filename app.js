// Google Calendar Webhook URL Configuration (Google Apps Script Web App)
// Configure this with your deployed Apps Script Web App URL to automatically push bookings to Google Calendar.
const GOOGLE_CALENDAR_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxIPs1J8fVUquyzIq_gZ4WTjsTBRgMGazeq58EbOZmF9yNfObr25NvCOBUWkit665y-OQ/exec";

// Google Calendar Live Availability Get URL (Google Apps Script Web App)
// Configure this with your deployed Apps Script Web App URL to retrieve real-time busy slots.
const GOOGLE_CALENDAR_GET_SLOTS_URL = "https://script.google.com/macros/s/AKfycbxIPs1J8fVUquyzIq_gZ4WTjsTBRgMGazeq58EbOZmF9yNfObr25NvCOBUWkit665y-OQ/exec";

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
    const response = await fetch("http://localhost:3000/api/chairs");
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

  // Check for prefilled chair selection
  const prefilled = localStorage.getItem("prefilledChair");
  if (prefilled) {
    const notesField = document.getElementById("bookingNotes");
    if (notesField) {
      notesField.value = `Ik heb interesse in een passing aan huis voor de stoel: ${prefilled}. Graag afstemmen op mijn lichaamslengte en voorkeuren.`;
      localStorage.removeItem("prefilledChair");
      
      // Auto-select Home Passing since the prefill is for home passing
      const typeHome = document.getElementById("typeHome");
      if (typeHome) typeHome.click();
      
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
          img.alt = "Geert zittend in een comfortabele sta-op stoel";
        }
      });
    }
  });

  // Start the slideshow auto-advance
  startTimer();
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
  const form = document.getElementById("wizardForm");
  
  if (!nextBtn || !backBtn || !resetBtn || !form) return;
  
  // Load chairs dynamically when wizard is initialized
  loadWizardChairs();
  
  // Track Option Card Selection
  const optionCards = document.querySelectorAll(".option-card");
  optionCards.forEach(card => {
    // Synchronize initial selections
    const input = card.querySelector("input");
    if (input && input.checked) {
      card.classList.add("selected");
    }
    
    card.addEventListener("click", (e) => {
      // Prevent double trigger if clicking label/input directly
      if (e.target.tagName === "INPUT") return;
      
      const input = card.querySelector("input");
      if (!input) return;
      
      if (input.type === "radio") {
        // Uncheck siblings
        const name = input.name;
        document.querySelectorAll(`input[name="${name}"]`).forEach(sibling => {
          sibling.closest(".option-card").classList.remove("selected");
        });
        input.checked = true;
        card.classList.add("selected");
      } else if (input.type === "checkbox") {
        input.checked = !input.checked;
        if (input.checked) {
          card.classList.add("selected");
        } else {
          card.classList.remove("selected");
        }
      }
      
      // Update answers state
      updateWizardAnswersFromForm();
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

  // Reset Click
  resetBtn.addEventListener("click", () => {
    form.reset();
    document.querySelectorAll(".option-card").forEach(card => {
      const input = card.querySelector("input");
      if (input && input.checked) {
        card.classList.add("selected");
      } else {
        card.classList.remove("selected");
      }
    });
    goToWizardStep(1);
  });
}

function updateWizardAnswersFromForm() {
  const form = document.getElementById("wizardForm");
  const formData = new FormData(form);
  
  state.wizardAnswers.height = formData.get("height");
  state.wizardAnswers.motors = formData.get("motors");
  state.wizardAnswers.modern = formData.get("modern") === "true";
  
  // Get all checked complaints
  state.wizardAnswers.complaints = [];
  document.querySelectorAll('input[name="complaints"]:checked').forEach(cb => {
    state.wizardAnswers.complaints.push(cb.value);
  });
}

function goToWizardStep(step) {
  state.wizardStep = step;
  
  // Hide all steps
  document.querySelectorAll(".wizard-step").forEach(s => s.classList.remove("active"));
  // Show active step
  document.getElementById(`step${step}`).classList.add("active");
  
  // Update indicator steps
  document.querySelectorAll(".progress-step").forEach((indicator, idx) => {
    const indicatorStep = idx + 1;
    indicator.className = "progress-step";
    
    if (indicatorStep < step) {
      indicator.classList.add("completed");
    } else if (indicatorStep === step) {
      indicator.classList.add("active");
    }
  });
  
  // Update Progress Bar width
  const progressPercent = ((step - 1) / 3) * 100;
  document.getElementById("progressBar").style.width = `${progressPercent}%`;
  
  // Toggle Nav Buttons
  const nextBtn = document.getElementById("btnWizardNext");
  const backBtn = document.getElementById("btnWizardBack");
  const resetBtn = document.getElementById("btnWizardReset");
  
  if (step === 1) {
    backBtn.style.display = "none";
    nextBtn.style.display = "inline-flex";
    resetBtn.style.display = "none";
  } else if (step === 4) {
    backBtn.style.display = "none";
    nextBtn.style.display = "none";
    resetBtn.style.display = "inline-flex";
    
    // Render matching chairs
    renderWizardResults();
  } else {
    backBtn.style.display = "inline-flex";
    nextBtn.style.display = "inline-flex";
    resetBtn.style.display = "none";
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
    parts.push("Uiterst geschikt bij specifieke fysieke klachten dankzij de exacte instelbaarheid.");
  } else if (brand === "Doge") {
    parts.push("Aanbevolen bij mobiliteitsklachten door de extreem stabiele sta-op ondersteuning.");
  } else {
    parts.push("Comfortabele fauteuil die uitstekende algemene ondersteuning biedt bij het opstaan.");
  }
  
  // Size match comment
  if (height === "small" && (descLower.includes("maat s") || descLower.includes("small"))) {
    parts.push("Perfecte ergonomische zithoogte voor kleinere lichaamslengtes.");
  } else if (height === "large" && (descLower.includes("maat l") || descLower.includes("large"))) {
    parts.push("Uitstekende zitdiepte en rugondersteuning voor langere personen.");
  }
  
  // Complaint match comment
  if (complaints.includes("legs") && (descLower.includes("benen") || descLower.includes("hart-lig") || descLower.includes("vocht"))) {
    parts.push("Ideaal bij vochtophoping door de speciale relaxstand.");
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
  resultsContainer.innerHTML = "";
  
  // Filtering variables
  const height = state.wizardAnswers.height;
  const complaints = state.wizardAnswers.complaints;
  const motorsWanted = parseInt(state.wizardAnswers.motors);
  const modernWanted = state.wizardAnswers.modern;
  
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
      
      // 3. Check style match (modern)
      const isModern = descLower.includes("modern") || descLower.includes("design") || descLower.includes("strak") || descLower.includes("trendy") || descLower.includes("industrieel") || descLower.includes("draaibaar") || descLower.includes("draaivoet") || brandLower.includes("dfm") || brandLower.includes("mecam") || badgeLower.includes("modern") || badgeLower.includes("design") || badgeLower.includes("luxe");
      if (modernWanted && isModern) {
        score += 2;
      }
      
      // 4. Check complaint alignment
      if (complaints.includes("back") && (descLower.includes("rug") || descLower.includes("lendensteun") || descLower.includes("lumbaal") || brandLower.includes("fitform") || brandLower.includes("doge"))) {
        score += 2;
      }
      if (complaints.includes("neck") && (descLower.includes("nek") || descLower.includes("schouder") || descLower.includes("topswing") || descLower.includes("hoofd") || brandLower.includes("fitform") || brandLower.includes("doge"))) {
        score += 2;
      }
      if (complaints.includes("legs") && (descLower.includes("benen") || descLower.includes("hart-lig") || descLower.includes("vocht") || descLower.includes("kantel") || descLower.includes("ligstand") || brandLower.includes("fitform") || brandLower.includes("doge"))) {
        score += 2;
      }
      
      return { ...chair, score };
    });
  
  // Sort by score descending and take top matches (must have score >= 3)
  const matches = scoredChairs
    .filter(chair => chair.score >= 3)
    .sort((a, b) => b.score - a.score);
    
  if (matches.length === 0) {
    resultsContainer.innerHTML = `
      <div class="no-results" style="grid-column: 1 / -1;">
        <h3>Geen exacte match gevonden</h3>
        <p style="margin-top: 8px;">Onze excuses, op basis van uw antwoorden hebben we momenteel geen standaard model in de database dat 100% past. Geen zorgen! Onze BewegingsTechnologen leveren altijd maatwerk. Plan een passing aan huis voor een gratis meting en advies.</p>
        <a href="#afspraak-planner" class="btn btn-secondary" style="margin-top: 16px;">Vrijblijvend Advies Inplannen</a>
      </div>
    `;
    return;
  }
  
  matches.forEach(chair => {
    const card = document.createElement("div");
    card.className = "product-card";
    
    // Generate dynamic features & suitability
    const dynamicFeatures = getChairFeatures(chair);
    const dynamicSuitability = getChairSuitability(chair, height, complaints);
    
    const featuresHtml = dynamicFeatures
      .map(feat => `<li>${feat}</li>`)
      .join("");
      
    card.innerHTML = `
      <div class="product-image" style="background-color: var(--color-light); overflow: hidden; display: flex; align-items: center; justify-content: center; height: 200px; padding: 10px;">
        ${chair.image ? `<img src="${chair.image}" alt="${chair.name}" style="max-height: 100%; max-width: 100%; object-fit: contain;">` : `<span style="font-size: 3rem;">🛋️</span>`}
        ${chair.badge ? `<span class="badge ${chair.badgeType === "new" ? "badge-new" : "badge-reco"}">${chair.badge}</span>` : ""}
      </div>
      <div class="product-info">
        <h3 class="product-title">${chair.name}</h3>
        <p style="font-size: 0.85rem; color: var(--color-terracotta); font-weight:600; margin-bottom: 12px;">
          ${dynamicSuitability}
        </p>
        <ul class="product-features">
          ${featuresHtml}
        </ul>
        <div class="product-price-row">
          <div>
            <span class="price-label">Prijs vanaf</span>
            <span class="price-value" style="display: block;">${formatPrice(chair.price)}</span>
          </div>
          <button type="button" class="btn btn-secondary" onclick="prefillBooking('${chair.name}')" style="padding: 10px 20px; font-size: 0.9rem; min-height: auto;">
            Gratis Thuispassen
          </button>
        </div>
      </div>
    `;
    resultsContainer.appendChild(card);
  });
}

// Helper to prefill details and jump to the scheduling calendar
window.prefillBooking = function(chairName) {
  const notesField = document.getElementById("bookingNotes");
  if (notesField) {
    notesField.value = `Ik heb interesse in een passing aan huis voor de: ${chairName}. Graag afstemmen op mijn lichaamslengte en voorkeuren.`;
  }
  
  // Auto-select Home Passing since the prefill is for home passing
  const typeHome = document.getElementById("typeHome");
  if (typeHome) typeHome.click();
  
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
    
    // Show address inputs and mark required
    if (homeAddressWrapper) homeAddressWrapper.style.display = "block";
    if (postcodeField) postcodeField.required = true;
    if (houseNumberField) houseNumberField.required = true;
    if (addressField) addressField.required = true;
  });
  
  typeShowroom.addEventListener("click", () => {
    typeShowroom.classList.add("selected");
    typeHome.classList.remove("selected");
    typeShowroom.querySelector("input").checked = true;
    
    state.appointmentType = "showroom";
    
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
    successScreen.style.display = "none";
    
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

    // Assemble the payload for Google Calendar webhook
    const bookingPayload = {
      name: name,
      phone: phone,
      email: email,
      date: state.selectedDate.toISOString().split('T')[0], // YYYY-MM-DD
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
      timestamp: new Date().toISOString()
    };

    const transitionToSuccess = () => {
      // Transition to success screen
      interactiveArea.style.display = "none";
      successScreen.style.display = "block";
      
      const formattedDate = state.selectedDate.toLocaleDateString("nl-NL", {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      const typeText = state.appointmentType === "home" ? "Passing aan Huis" : "Showroombezoek in Dordrecht";
      const locationDetail = state.appointmentType === "home" ? `op uw adres (${address})` : "op onze locatie (Merwedestraat 239, Dordrecht)";
      
      document.getElementById("successSummary").innerHTML = `
        Er is een afspraak gepland voor een <strong>${typeText}</strong> ${locationDetail}. <br>
        Datum: <strong>${formattedDate}</strong> om <strong>${state.selectedTimeSlot}</strong>.<br><br>
        De bevestiging is zojuist naar uw e-mailadres (<strong>${email}</strong>) verzonden. Check eventueel uw spamfolder als u deze niet direct ziet.<br><br>
        Onze BewegingsTechnoloog zal de afspraak binnen 2 uur telefonisch met u bevestigen via <strong>${phone}</strong>.
      `;

      // Show Google Maps and route description if visiting the showroom
      const successRouteInfo = document.getElementById("successRouteInfo");
      const successMapIframe = document.getElementById("successMapIframe");
      if (successRouteInfo && successMapIframe) {
        if (state.appointmentType === "showroom") {
          successRouteInfo.style.display = "block";
          successMapIframe.src = "https://maps.google.com/maps?q=Merwedestraat%20239,%20Dordrecht&t=&z=15&ie=UTF8&iwloc=&output=embed";
        } else {
          successRouteInfo.style.display = "none";
          successMapIframe.src = "";
        }
      }
      
      submitBookingBtn.textContent = "Bevestig Afspraak";
      submitBookingBtn.disabled = false;
    };

    if (GOOGLE_CALENDAR_WEBHOOK_URL) {
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
  
  for (let day = 1; day <= totalDays; day++) {
    const dateCell = document.createElement("button");
    dateCell.type = "button";
    dateCell.className = "calendar-day-btn";
    dateCell.textContent = day;
    
    const thisDate = new Date(year, month, day);
    
    // Disable past dates
    const isPast = thisDate < today && thisDate.toDateString() !== today.toDateString();
    
    // Disable Sundays (closed)
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
  
  // Helper to render the actual buttons
  const drawSlots = (busySlots) => {
    grid.innerHTML = "";
    
    state.timeSlots.forEach((slot, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "time-slot-btn";
      btn.textContent = slot;
      
      // Saturday afternoon is closed (e.g. index 2 and 3)
      const satDisabled = isSaturday && idx >= 2;
      
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
      });
      
      grid.appendChild(btn);
    });
  };

  if (GOOGLE_CALENDAR_GET_SLOTS_URL) {
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
