#!/usr/bin/env python3
"""
scripts/generate_25_chair_floorplan.py
Generates the complete 25-chair boutique showroom floor plan for Staopstoelen.nl
(Merwedestraat 239, Dordrecht). Replaces the old sleep zone with a dedicated 
Occasion & Direct Leverbaar gallery, fitting exactly 25 numbered chairs with spacious aisles.
"""

def make_chair_svg(cid, x, y, label, sublabel, color_primary, color_secondary, orientation='down', is_hero=False):
    """
    Renders a realistic contoured top-down armchair vector with number badge and label.
    Dimensions: ~48x48 px.
    """
    w, h = 48, 48
    bx = x - w // 2
    by = y - h // 2
    
    # Shadow and base
    svg = f"""
    <!-- Stoel #{cid}: {label} -->
    <g id="chair_{cid}" class="chair-node" transform="translate({bx}, {by})">
      <!-- Base Shell -->
      <rect x="0" y="0" width="{w}" height="{h}" rx="8" fill="{color_primary}" stroke="#0f172a" stroke-width="1.2" opacity="0.95" />
      <!-- Cushion Inner -->
      <rect x="5" y="7" width="{w-10}" height="{h-16}" rx="4" fill="{color_secondary}" />
      <!-- Armrests -->
      <rect x="0" y="8" width="6" height="28" rx="2.5" fill="#1e293b" opacity="0.65" />
      <rect x="{w-6}" y="8" width="6" height="28" rx="2.5" fill="#1e293b" opacity="0.65" />
      <!-- Headrest / Backrest -->
      <rect x="6" y="2" width="{w-12}" height="6" rx="2" fill="#0f172a" opacity="0.5" />
      <!-- Number Badge Pill -->
      <rect x="{w//2 - 13}" y="{h - 18}" width="26" height="13" rx="3.5" fill="#0f172a" />
      <text x="{w//2}" y="{h - 8}" fill="#ffffff" font-size="8.5" font-weight="800" text-anchor="middle">#{cid:02d}</text>
      <!-- Model Name Underneath -->
      <text x="{w//2}" y="{h + 10}" fill="#1e293b" font-size="7.5" font-weight="700" text-anchor="middle">{label}</text>
      <text x="{w//2}" y="{h + 19}" fill="#64748b" font-size="6.8" text-anchor="middle">{sublabel}</text>
    </g>"""
    return svg

def build_floorplan_svg():
    svg = """<!-- SVG Visual Architectural Floor Plan (25 Stoelen Capaciteit) -->
<svg viewBox="0 0 960 650" style="width: 100%; min-width: 720px; height: auto; font-family: var(--font-body, 'Outfit', sans-serif); display: block;" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Warm Oak Floor Gradient -->
    <linearGradient id="warmOakFloor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#faf6f0" />
      <stop offset="100%" stop-color="#f2ebe0" />
    </linearGradient>
    
    <!-- Glass Pui Gradient -->
    <linearGradient id="puiGlassGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#e0f2fe" stop-opacity="0.9" />
      <stop offset="30%" stop-color="#bae6fd" stop-opacity="0.5" />
      <stop offset="70%" stop-color="#e0f2fe" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#bae6fd" stop-opacity="0.4" />
    </linearGradient>
    
    <!-- Spotlight Glow for Window Hero Chair -->
    <radialGradient id="spotlightGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="0.45" />
      <stop offset="60%" stop-color="#fef3c7" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>

    <!-- Subtle Drop Shadow -->
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#122b07" flood-opacity="0.08" />
    </filter>
    <filter id="highlightGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#f39223" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- 1. MERWEDESTRAAT (Bovenzijde Straat & Parkeren) -->
  <rect x="15" y="8" width="930" height="38" rx="8" fill="#1e293b" />
  <line x1="20" y1="27" x2="940" y2="27" stroke="#ffffff" stroke-width="2" stroke-dasharray="16 16" opacity="0.4" />
  <text x="480" y="32" fill="#ffffff" font-size="12.5" font-weight="800" letter-spacing="1.2" text-anchor="middle">
    MERWEDESTRAAT 239 • GRATIS PARKEREN VOOR DE DEUR (STRAATZIJDE)
  </text>
  
  <!-- Stoep / Klinkers Strook -->
  <rect x="15" y="46" width="930" height="12" fill="#cbd5e1" opacity="0.6" />

  <!-- 2. BUITENMUREN & SHOWROOM BASISVLOER -->
  <rect x="15" y="58" width="930" height="580" rx="16" fill="url(#warmOakFloor)" stroke="#334155" stroke-width="4" />

  <!-- Lichte Houtnerven / Plankenlijnen -->
  <g stroke="#e5ded2" stroke-width="1" opacity="0.6">
    <line x1="15" y1="110" x2="945" y2="110" />
    <line x1="15" y1="170" x2="945" y2="170" />
    <line x1="15" y1="230" x2="945" y2="230" />
    <line x1="15" y1="290" x2="945" y2="290" />
    <line x1="15" y1="350" x2="945" y2="350" />
    <line x1="15" y1="410" x2="945" y2="410" />
    <line x1="15" y1="470" x2="945" y2="470" />
    <line x1="15" y1="530" x2="945" y2="530" />
    <line x1="15" y1="590" x2="945" y2="590" />
    <line x1="15" y1="630" x2="945" y2="630" />
  </g>

  <!-- 3. DE GLAS-PUI AAN DE STRAAT (Bovenzijde) -->
  <rect x="25" y="58" width="135" height="12" fill="url(#puiGlassGrad)" stroke="#64748b" stroke-width="2" />
  
  <!-- Entree Deur met draai-boog -->
  <rect x="160" y="58" width="75" height="12" fill="#ffffff" stroke="#22c55e" stroke-width="2.5" />
  <path d="M 160,70 A 70,70 0 0,0 230,140" fill="none" stroke="#22c55e" stroke-width="1.8" stroke-dasharray="4 3" />
  <text x="197" y="98" fill="#15803d" font-size="10.5" font-weight="800" text-anchor="middle">ENTREE ↵</text>

  <!-- Grote Glazen Etalageruit Rechts (voor het hero podium) -->
  <rect x="235" y="58" width="700" height="12" fill="url(#puiGlassGrad)" stroke="#64748b" stroke-width="2" />
  <text x="590" y="68" fill="#0369a1" font-size="8.5" font-weight="700" letter-spacing="0.5" text-anchor="middle">
    GROTE GLAS-PUI MET ZANDSTRAAL BELETTERING "STAOPSTOELEN.NL" (GRIJZE KOZIJNEN)
  </text>

  <!-- CAPACITEIT BADGE (Bovenaan Rechts) -->
  <g transform="translate(735, 78)">
    <rect x="0" y="0" width="195" height="28" rx="14" fill="#15803d" filter="url(#softShadow)" />
    <circle cx="16" cy="14" r="6" fill="#4ade80" />
    <text x="105" y="19" fill="#ffffff" font-size="11" font-weight="800" text-anchor="middle">CAPACITEIT: 25 FAUTEUILS</text>
  </g>

  <!-- DOTTED ROUTING PATH DOOR DE WINKEL -->
  <path d="M 197,125 Q 197,175 270,175 T 450,215 T 530,310 T 450,400 T 220,440 T 220,530 T 450,530" fill="none" stroke="#f39223" stroke-width="2.5" stroke-dasharray="5 5" opacity="0.65" />

  <!-- ======================================================== -->
  <!-- ZONE A: ETALAGE & HERO PODIUM (Rechts van de entree)      -->
  <!-- ======================================================== -->
  <g id="svgZone_etalage" class="zone-node" onclick="selectZone('etalage')" style="cursor: pointer;">
    <!-- Warm Eiken Podium -->
    <rect x="255" y="78" width="460" height="98" rx="12" fill="#fdf8f3" stroke="#f39223" stroke-width="2.5" filter="url(#softShadow)" />
    
    <!-- Spotlight Glow Cone over stoel #01 -->
    <ellipse cx="320" cy="120" rx="60" ry="38" fill="url(#spotlightGlow)" />
    
    <!-- Hero Stoel #01: Uitgeklapte Oranje Fitform -->
    <g transform="translate(295, 96)">
      <rect x="0" y="0" width="50" height="50" rx="8" fill="#c2410c" stroke="#7c2d12" stroke-width="2" />
      <rect x="5" y="8" width="40" height="32" rx="4" fill="#f97316" />
      <!-- Uitgeklapte beensteun -->
      <rect x="8" y="-12" width="34" height="15" rx="3" fill="#fb923c" stroke="#c2410c" stroke-width="1.2" />
      <rect x="0" y="8" width="6" height="30" rx="2" fill="#7c2d12" />
      <rect x="44" y="8" width="6" height="30" rx="2" fill="#7c2d12" />
      <rect x="12" y="32" width="26" height="12" rx="3" fill="#0f172a" />
      <text x="25" y="41" fill="#ffffff" font-size="8.5" font-weight="800" text-anchor="middle">#01</text>
      <text x="25" y="60" fill="#9a3412" font-size="8" font-weight="800" text-anchor="middle">Hero Oranje</text>
      <text x="25" y="69" fill="#c2410c" font-size="7" font-weight="700" text-anchor="middle">Upstand Raam</text>
    </g>

    <!-- Stoel #02: Fitform 570 Raampresentatie -->
    """ + make_chair_svg(2, 415, 122, "Fitform 570", "Cognac Leder", "#b45309", "#d97706") + """

    <!-- Tekst Zone A -->
    <text x="470" y="105" fill="#9a3412" font-size="13" font-weight="800">Zone A: Etalage &amp; Hero Podium</text>
    <text x="470" y="122" fill="#c2410c" font-size="10.5" font-weight="700">★ 2 Prominente Stoelen in Raamzicht</text>
    <text x="470" y="138" fill="#78350f" font-size="9.5">Direct zichtbaar vanaf de straat • Eiken podium met 2700K spot</text>
    <text x="470" y="153" fill="#475569" font-size="9" font-style="italic">Iconische blikvanger die voorbijgangers direct binnenhaalt</text>
  </g>

  <!-- MOBILITEITSNIS (Links naast entree, discreet) -->
  <rect x="25" y="78" width="125" height="98" rx="10" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 3" />
  <text x="87" y="112" fill="#475569" font-size="10.5" font-weight="700" text-anchor="middle">Mobiliteitsnis</text>
  <text x="87" y="128" fill="#64748b" font-size="9" text-anchor="middle">Subtiele opstelling</text>
  <text x="87" y="142" fill="#64748b" font-size="9" text-anchor="middle">rollators &amp; krukken</text>

  <!-- CENTRALE BOUWZUIL (Met akoestisch houtlatten detail) -->
  <g id="svgZone_zuil" class="zone-node" onclick="selectZone('zuil')" style="cursor: pointer;">
    <circle cx="735" cy="138" r="32" fill="#fef3c7" stroke="#d97706" stroke-width="2.5" />
    <circle cx="735" cy="138" r="24" fill="#b45309" opacity="0.2" />
    <circle cx="735" cy="138" r="14" fill="#4b8f24" />
    <text x="735" y="142" fill="#ffffff" font-size="8.5" font-weight="800" text-anchor="middle">ZUIL</text>
  </g>

  <!-- Stoelen #15 & #16 bij Zuil / Flank -->
  """ + make_chair_svg(15, 810, 130, "Doge Bellini", "Occasion", "#6b21a8", "#9333ea") + """
  """ + make_chair_svg(16, 885, 130, "DFM Bentley", "Occasion", "#6b21a8", "#9333ea") + """

  <!-- ======================================================== -->
  <!-- ZONE B: PROEFZIT HUISKAMER (Centraal hart - 8 Stoelen!)   -->
  <!-- ======================================================== -->
  <g id="svgZone_huiskamer" class="zone-node" onclick="selectZone('huiskamer')" style="cursor: pointer;">
    <!-- Groot Wollen Saliegroen Karpet -->
    <rect x="235" y="195" width="485" height="215" rx="20" fill="#eaf3e8" stroke="#3d751d" stroke-width="2.5" filter="url(#softShadow)" />
    <text x="475" y="218" fill="#1b4d0c" font-size="13.5" font-weight="800" text-anchor="middle">
      Zone B: De Centrale Proefzit-Huiskamer (8 Fitform Stoelen)
    </text>

    <!-- Ronde / Ovale Houten Salontafel -->
    <ellipse cx="475" cy="290" rx="42" ry="28" fill="#fffbeb" stroke="#d97706" stroke-width="2" />
    <text x="475" y="288" fill="#92400e" font-size="10.5" font-weight="700" text-anchor="middle">Koffietafel</text>
    <text x="475" y="301" fill="#b45309" font-size="8" text-anchor="middle">Koffie &amp; stalen</text>

    <!-- 8 Fauteuils in Halve Boog rond tafel -->
    """ + make_chair_svg(3, 275, 250, "Fitform 570", "Olijfgroen", "#4d7c0f", "#65a30d") + """
    """ + make_chair_svg(4, 275, 325, "Fitform 570", "Cognac Leer", "#b45309", "#d97706") + """
    """ + make_chair_svg(5, 345, 362, "Fitform 574", "Zandgrijs", "#78716c", "#a8a29e") + """
    """ + make_chair_svg(6, 425, 368, "Fitform 580", "Antraciet", "#334155", "#64748b") + """
    """ + make_chair_svg(7, 520, 368, "Fitform 570", "Warm Taupe", "#854d0e", "#ca8a04") + """
    """ + make_chair_svg(8, 605, 362, "Fitform 580", "Marineblauw", "#1d4ed8", "#3b82f6") + """
    """ + make_chair_svg(9, 675, 325, "Fitform Vario", "Zwart Leder", "#1e293b", "#475569") + """
    """ + make_chair_svg(10, 675, 250, "Fitform Elevo", "Design Stof", "#047857", "#10b981") + """

    <text x="475" y="234" fill="#2d6a1d" font-size="9.5" font-weight="600" text-anchor="middle">
      Warm wollen karpet • Ruime opstelling voor proefzitten &amp; kanteldemonstratie
    </text>
  </g>

  <!-- ======================================================== -->
  <!-- ZONE C: 5-PUNTS ZITMEETSTATION & PASMODELLEN (Links)     -->
  <!-- ======================================================== -->
  <g id="svgZone_zitmeting" class="zone-node" onclick="selectZone('zitmeting')" style="cursor: pointer;">
    <rect x="25" y="195" width="185" height="215" rx="16" fill="#f0fdf4" stroke="#16a34a" stroke-width="2.5" filter="url(#softShadow)" />
    <rect x="35" y="205" width="165" height="24" rx="6" fill="#15803d" />
    <text x="117" y="221" fill="#ffffff" font-size="11" font-weight="800" text-anchor="middle">Zone C: Zitmeetstation (4 Stoelen)</text>
    
    <!-- Passtoelen #11, #12, #13, #14 -->
    """ + make_chair_svg(11, 70, 265, "Passtoel", "Elektrisch", "#1d4ed8", "#60a5fa") + """
    """ + make_chair_svg(12, 145, 265, "Fitform 570", "Maat Medium", "#1e40af", "#3b82f6") + """
    """ + make_chair_svg(13, 70, 350, "Fitform 560", "Maat Small", "#0369a1", "#38bdf8") + """
    """ + make_chair_svg(14, 145, 350, "Fitform 574", "Maat Large", "#0284c7", "#0ea5e9") + """

    <text x="117" y="398" fill="#15803d" font-size="8.5" font-weight="700" text-anchor="middle">
      ✓ 5-Punts Nauwkeurige Maatmeting
    </text>
  </g>

  <!-- ======================================================== -->
  <!-- ZONE D: ADVIES- & BESTELBALIE (Rechts)                    -->
  <!-- ======================================================== -->
  <g id="svgZone_balie" class="zone-node" onclick="selectZone('balie')" style="cursor: pointer;">
    <rect x="745" y="195" width="190" height="215" rx="16" fill="#f8fafc" stroke="#475569" stroke-width="2.5" filter="url(#softShadow)" />
    <rect x="755" y="205" width="170" height="24" rx="6" fill="#334155" />
    <text x="840" y="221" fill="#ffffff" font-size="11" font-weight="800" text-anchor="middle">Zone D: Adviesbalie</text>
    
    <!-- Balieblad -->
    <rect x="765" y="245" width="150" height="38" rx="8" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5" />
    <text x="840" y="268" fill="#1e293b" font-size="10" font-weight="700" text-anchor="middle">Service &amp; Orderbon</text>
    
    <text x="840" y="304" fill="#475569" font-size="9" text-anchor="middle">Brochures • Offertes op maat</text>
    <text x="840" y="322" fill="#475569" font-size="9" text-anchor="middle">Bezorgafspraken Geertjan</text>
    <text x="840" y="340" fill="#059669" font-size="9" font-weight="700" text-anchor="middle">✓ Gratis Bezorging Drechtsteden</text>
    <text x="840" y="358" fill="#059669" font-size="9" font-weight="700" text-anchor="middle">✓ Landelijke Levering aan Huis</text>
  </g>

  <!-- GROENE AKOESTISCHE PLANTHALEN / ROOMDIVIDER -->
  <g transform="translate(25, 422)">
    <rect x="0" y="0" width="910" height="12" rx="6" fill="#365314" opacity="0.9" />
    <line x1="2" y1="6" x2="908" y2="6" stroke="#65a30d" stroke-width="1.8" stroke-dasharray="10 6" />
    <text x="455" y="-5" fill="#2d5210" font-size="10" font-weight="800" text-anchor="middle">
      🌿 AKOESTISCHE ROOMDIVIDER MET GROENE PLANTENBAKKEN (SCHEIDING TUSSEN HUISKAMER EN OCCASIONS)
    </text>
  </g>

  <!-- ======================================================== -->
  <!-- ZONE E: OCCASION & VOORRAAD GALERIJ (9 Stoelen! - Was Slaapzone) -->
  <!-- ======================================================== -->
  <g id="svgZone_slaapcomfort" class="zone-node" onclick="selectZone('slaapcomfort')" style="cursor: pointer;">
    <rect x="25" y="442" width="565" height="185" rx="14" fill="#faf5ff" stroke="#9333ea" stroke-width="2.5" filter="url(#softShadow)" />
    <text x="307" y="462" fill="#6b21a8" font-size="12" font-weight="800" text-anchor="middle">
      Zone E: Occasion &amp; Direct Leverbaar Galerij (9 A-Merk Stoelen v.a. € 1.050,-)
    </text>

    <!-- Bovenste rij: 5 Stoelen (#17 t/m #21) -->
    """ + make_chair_svg(17, 65, 498, "Refitto", "Gereviseerd", "#7e22ce", "#a855f7") + """
    """ + make_chair_svg(18, 175, 498, "Fitform 570", "Occasion", "#6b21a8", "#9333ea") + """
    """ + make_chair_svg(19, 285, 498, "Fitform 574", "Occasion", "#7e22ce", "#a855f7") + """
    """ + make_chair_svg(20, 395, 498, "Vario XL", "150kg+ Heavy", "#581c87", "#7e22ce") + """
    """ + make_chair_svg(21, 505, 498, "Draaistoel", "Occasion", "#6b21a8", "#9333ea") + """

    <!-- Onderste rij: 4 Stoelen (#22 t/m #25) -->
    """ + make_chair_svg(22, 120, 572, "Fitform 580", "Occasion", "#7e22ce", "#a855f7") + """
    """ + make_chair_svg(23, 230, 572, "Cognac Leer", "Occasion", "#b45309", "#d97706") + """
    """ + make_chair_svg(24, 340, 572, "Microvezel", "Occasion", "#475569", "#64748b") + """
    """ + make_chair_svg(25, 450, 572, "Budget Top", "v.a. €1.050", "#15803d", "#22c55e") + """
  </g>

  <!-- ======================================================== -->
  <!-- ZONE F: WERKPLAATS REVISIE & KWALITEITSKRAAM (Rechtsachter) -->
  <!-- ======================================================== -->
  <g id="svgZone_revisie" class="zone-node" onclick="selectZone('revisie')" style="cursor: pointer;">
    <rect x="615" y="442" width="320" height="185" rx="14" fill="#f0fdfa" stroke="#0d9488" stroke-width="2.5" filter="url(#softShadow)" />
    <text x="775" y="463" fill="#0f766e" font-size="12" font-weight="800" text-anchor="middle">
      Zone F: Werkplaats &amp; Technische Keuring
    </text>

    <!-- Werkbank -->
    <rect x="635" y="480" width="135" height="52" rx="8" fill="#ccfbf1" stroke="#14b8a6" stroke-width="1.5" />
    <text x="702" y="504" fill="#115e59" font-size="10" font-weight="700" text-anchor="middle">Technische Testbank</text>
    <text x="702" y="519" fill="#0f766e" font-size="8.5" text-anchor="middle">15-Punts Keuring • Motoren</text>

    <!-- Laad- en Uitrijzone Bezorgbus -->
    <rect x="790" y="480" width="125" height="52" rx="8" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 3" />
    <text x="852" y="504" fill="#334155" font-size="10" font-weight="700" text-anchor="middle">Laadzone Bezorgbus</text>
    <text x="852" y="519" fill="#475569" font-size="8.5" text-anchor="middle">Gereed voor bezorging</text>

    <text x="775" y="575" fill="#0f766e" font-size="9" font-weight="700" text-anchor="middle">
      ✓ Eigen revisie in Dordrecht • Nieuwe motoren &amp; koudschuim
    </text>
    <text x="775" y="592" fill="#0f766e" font-size="8.5" text-anchor="middle">
      Directe service &amp; snelle levering uit eigen voorraad
    </text>
  </g>
</svg>"""
    return svg

if __name__ == '__main__':
    svg_code = build_floorplan_svg()
    with open('/Users/matthiasradder/.gemini/antigravity/brain/5378d3fd-8b59-414a-9831-88008af6411f/floorplan_25_chairs.svg', 'w') as f:
        f.write(svg_code)
    print("SVG generated successfully at floorplan_25_chairs.svg")
