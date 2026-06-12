// Google Calendar Webhook URL Configuration (Integromat/Make/Zapier)
// Configure this with your Make/Zapier Webhook URL to automatically push bookings to Google Calendar.
const GOOGLE_CALENDAR_WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/27924694/439zjqx/";

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
  
  // Before/After Slider State
  isDraggingSlider: false,
  sliderPct: 50,
  
  // Booking Calendar State
  appointmentType: "home", // "home" or "showroom"
  currentDate: new Date(2026, 5, 10), // June 10, 2026 (based on current metadata context)
  selectedDate: null,
  selectedTimeSlot: null,
  timeSlots: ["09:00 - 11:00", "11:00 - 13:00", "13:00 - 15:00", "15:00 - 17:00"]
};

// DOM Elements Initialization Helper
function initializeApp() {
  // Initialize Components
  initWizard();
  initSlider();
  initCalendar();
  initFloatingMenu();
  initMobileMenu();
  initHeroSecretImage();

  // Check for prefilled occasion chair selection from occasions page
  const prefilled = localStorage.getItem("prefilledChair");
  if (prefilled) {
    const notesField = document.getElementById("bookingNotes");
    if (notesField) {
      notesField.value = `Ik heb interesse in een passing aan huis voor de occasion: ${prefilled}. Graag afstemmen op mijn lichaamslengte en voorkeuren.`;
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

function initHeroSecretImage() {
  const container = document.getElementById("heroImageContainer");
  if (!container) return;
  const img = container.querySelector("img");
  if (!img) return;
  
  img.addEventListener("dblclick", () => {
    if (img.src.includes("chair_cozy.png")) {
      img.src = "assets/geert_secret.jpg";
      img.alt = "Geert zittend in een comfortabele sta-op stoel";
    } else {
      img.src = "assets/chair_cozy.png";
      img.alt = "Modern sfeervol interieur met een luxe groene sta-op stoel";
    }
  });
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

function renderWizardResults() {
  const resultsContainer = document.getElementById("wizardResults");
  resultsContainer.innerHTML = "";
  
  // Filtering logic
  const height = state.wizardAnswers.height;
  const complaints = state.wizardAnswers.complaints;
  const motorsWanted = parseInt(state.wizardAnswers.motors);
  const modernWanted = state.wizardAnswers.modern;
  
  // Score and filter models
  const scoredChairs = CHAIR_DATABASE.map(chair => {
    let score = 0;
    
    // Check height suitability (crucial)
    if (chair.sizes.includes(height)) {
      score += 5; // highly compatible size
    } else {
      score -= 2;
    }
    
    // Check motor config matches
    if (chair.motors.includes(motorsWanted)) {
      score += 3;
    }
    
    // Check style match
    if (modernWanted && chair.modern) {
      score += 2;
    }
    
    // Check complaint alignment
    if (complaints.includes("back") && chair.features.some(f => f.toLowerCase().includes("rug") || f.toLowerCase().includes("lendensteun"))) {
      score += 2;
    }
    if (complaints.includes("neck") && chair.features.some(f => f.toLowerCase().includes("nek") || f.toLowerCase().includes("topswing"))) {
      score += 2;
    }
    if (complaints.includes("legs") && chair.features.some(f => f.toLowerCase().includes("hart-lig") || f.toLowerCase().includes("kantel"))) {
      score += 2;
    }
    
    return { ...chair, score };
  });
  
  // Sort by score descending and take top matches (must have score > 0)
  const matches = scoredChairs
    .filter(chair => chair.score >= 3)
    .sort((a, b) => b.score - a.score);
    
  if (matches.length === 0) {
    resultsContainer.innerHTML = `
      <div class="no-results" style="grid-column: 1 / -1;">
        <h3>Geen exacte match gevonden</h3>
        <p style="margin-top: 8px;">Onze excuses, op basis van uw antwoorden hebben we geen standaard model dat 100% past. Geen zorgen! Onze BewegingsTechnologen leveren altijd maatwerk. Plan een passing aan huis voor een gratis meting.</p>
        <a href="#afspraak-planner" class="btn btn-secondary" style="margin-top: 16px;">Vrijblijvend Advies Inplannen</a>
      </div>
    `;
    return;
  }
  
  matches.forEach(chair => {
    const card = document.createElement("div");
    card.className = "product-card";
    
    const featuresHtml = chair.features
      .map(feat => `<li>${feat}</li>`)
      .join("");
      
    card.innerHTML = `
      <div class="product-image">
        ${chair.image ? `<img src="${chair.image}" alt="${chair.name}">` : `<span>${chair.emoji}</span>`}
        ${chair.badge ? `<span class="badge">${chair.badge}</span>` : ""}
      </div>
      <div class="product-info">
        <h3 class="product-title">${chair.name}</h3>
        <p style="font-size: 0.85rem; color: var(--color-terracotta); font-weight:600; margin-bottom: 12px;">
          ${chair.suitability}
        </p>
        <ul class="product-features">
          ${featuresHtml}
        </ul>
        <div class="product-price-row">
          <div>
            <span class="price-label">Revisieprijs vanaf</span>
            <span class="price-value" style="display: block;">${chair.price}</span>
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
  const addressLabel = document.getElementById("addressLabel");
  
  const prevMonth = document.getElementById("btnPrevMonth");
  const nextMonth = document.getElementById("btnNextMonth");
  const submitBookingBtn = document.getElementById("btnSubmitBooking");
  const resetBookingBtn = document.getElementById("btnResetBooking");
  
  const interactiveArea = document.getElementById("bookingInteractiveArea");
  const successScreen = document.getElementById("bookingSuccessScreen");
  
  if (!typeHome || !typeShowroom || !interactiveArea || !successScreen) return;
  
  // Appointment Type Selection
  typeHome.addEventListener("click", () => {
    typeHome.classList.add("selected");
    typeShowroom.classList.remove("selected");
    typeHome.querySelector("input").checked = true;
    
    state.appointmentType = "home";
    
    // Show address inputs and mark required
    addressField.style.display = "block";
    addressField.required = true;
    addressLabel.style.display = "block";
    addressField.placeholder = "Straatnaam, huisnummer & woonplaats";
  });
  
  typeShowroom.addEventListener("click", () => {
    typeShowroom.classList.add("selected");
    typeHome.classList.remove("selected");
    typeShowroom.querySelector("input").checked = true;
    
    state.appointmentType = "showroom";
    
    // Hide address since visit is in Dordrecht
    addressField.style.display = "none";
    addressField.required = false;
    addressField.value = "";
    addressLabel.style.display = "none";
  });
  
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
    if (state.selectedTimeSlot && state.selectedTimeSlot.includes(" - ")) {
      const timeParts = state.selectedTimeSlot.split(" - ");
      startTime = timeParts[0].trim();
      endTime = timeParts[1].trim();
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
        Onze BewegingsTechnoloog zal de afspraak binnen 2 uur telefonisch met u bevestigen via <strong>${phone}</strong>.
      `;
      
      submitBookingBtn.textContent = "Bevestig Afspraak";
      submitBookingBtn.disabled = false;
    };

    if (GOOGLE_CALENDAR_WEBHOOK_URL) {
      fetch(GOOGLE_CALENDAR_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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
  const today = new Date(2026, 5, 10); // Mock current date Context: June 10, 2026
  
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
  
  // Deterministic fake busy slots based on chosen day
  // Some slots are disabled on Saturdays, or odd/even days
  const day = state.selectedDate.getDate();
  const isSaturday = state.selectedDate.getDay() === 6;
  
  state.timeSlots.forEach((slot, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "time-slot-btn";
    btn.textContent = slot;
    
    // Saturday afternoon is closed (e.g. index 2 and 3)
    const satDisabled = isSaturday && idx >= 2;
    // Alternate slots busy to look real
    const busyMatch = (day + idx) % 3 === 0;
    
    if (satDisabled || busyMatch) {
      btn.disabled = true;
      btn.textContent = `${slot} (Vol)`;
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
