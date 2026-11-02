#!/usr/bin/env python3
"""
build_generieke_marktplaats_serie.py
Genereert een complete set professionele 1200x1200px advertentiefoto's voor de generieke
Marktplaats advertentie van Staopstoelen.nl.
"""

import os
import subprocess
import shutil
from pathlib import Path
from PIL import Image

OUTPUT_DIR = Path("/Users/matthiasradder/Downloads/Marktplaats_Generieke_Showroom_Advertentie")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

WORKSPACE = Path("/Users/matthiasradder/AntiGravity Projecten/Staopstoelen.nl")
CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Master banner
MASTER_BANNER = WORKSPACE / "assets/marketing/bedrijfsinfo_banner_staopstoelen.jpg"

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1200px;
    height: 1200px;
    position: relative;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #111a13;
    color: #ffffff;
  }

  .bg-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
  }

  .bg-overlay-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, 
      rgba(15, 23, 17, 0.82) 0%, 
      rgba(15, 23, 17, 0.25) 30%, 
      rgba(15, 23, 17, 0.40) 55%, 
      rgba(15, 23, 17, 0.95) 85%, 
      rgba(15, 23, 17, 0.99) 100%);
    z-index: 2;
  }

  .bg-overlay-dark {
    position: absolute;
    inset: 0;
    background: rgba(14, 23, 17, 0.78);
    z-index: 2;
  }

  /* TOP HEADER */
  .top-header {
    position: absolute;
    top: 40px;
    left: 50px;
    right: 50px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 10;
  }

  .logo-box {
    background: rgba(255, 255, 255, 0.96);
    padding: 12px 26px;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
    display: flex;
    align-items: center;
  }

  .logo-box img {
    height: 44px;
    width: auto;
    display: block;
  }

  .top-seal {
    display: flex;
    align-items: center;
    gap: 14px;
    background: rgba(15, 35, 20, 0.88);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(243, 146, 35, 0.6);
    padding: 8px 18px 8px 12px;
    border-radius: 40px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  }

  .top-seal img {
    width: 50px;
    height: 50px;
  }

  .top-seal-text {
    text-align: left;
  }

  .top-seal-title {
    font-size: 13px;
    font-weight: 800;
    color: #f39223;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }

  .top-seal-sub {
    font-size: 11px;
    color: #e2e8f0;
    font-weight: 600;
  }

  /* MAIN CONTENT AREA */
  .content-card {
    position: absolute;
    bottom: 50px;
    left: 50px;
    right: 50px;
    background: rgba(17, 30, 21, 0.94);
    backdrop-filter: blur(16px);
    border: 2px solid rgba(255, 255, 255, 0.12);
    border-radius: 28px;
    padding: 40px 45px;
    z-index: 10;
    box-shadow: 0 20px 50px rgba(0,0,0,0.55);
  }

  .category-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #f39223;
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    padding: 6px 16px;
    border-radius: 20px;
    margin-bottom: 16px;
  }

  .card-title {
    font-size: 38px;
    font-weight: 900;
    color: #ffffff;
    line-height: 1.2;
    margin-bottom: 12px;
    letter-spacing: -0.5px;
  }

  .card-title span {
    color: #f39223;
  }

  .card-subtitle {
    font-size: 20px;
    color: #cbd5e1;
    font-weight: 500;
    line-height: 1.45;
    margin-bottom: 24px;
  }

  /* GRID / BULLETS */
  .usp-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .usp-row {
    display: flex;
    align-items: center;
    gap: 14px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 12px 18px;
    border-radius: 14px;
  }

  .usp-check {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #2e6819;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 15px;
    flex-shrink: 0;
  }

  .usp-label {
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
  }

  /* FOOTER STRIP IN CARD */
  .contact-strip {
    margin-top: 25px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .contact-info {
    font-size: 15px;
    color: #94a3b8;
    font-weight: 600;
  }

  .contact-info strong {
    color: #f1f5f9;
  }

  .phone-badge {
    background: #f39223;
    color: #ffffff;
    font-size: 18px;
    font-weight: 800;
    padding: 10px 22px;
    border-radius: 30px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 14px rgba(243, 146, 35, 0.4);
  }

  /* SPECIALE GRID VOOR 5-PUNTS METING */
  .meting-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .meting-item {
    display: flex;
    align-items: center;
    gap: 16px;
    background: rgba(255, 255, 255, 0.05);
    padding: 10px 18px;
    border-radius: 12px;
  }

  .meting-num {
    background: #f39223;
    color: #fff;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 14px;
    flex-shrink: 0;
  }

  .meting-text {
    font-size: 16px;
    font-weight: 600;
  }

  .meting-text strong {
    color: #f39223;
  }

  /* 4 STANDEN CARDS */
  .standen-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .stand-box {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 16px;
    border-radius: 16px;
  }

  .stand-title {
    font-size: 17px;
    font-weight: 800;
    color: #f39223;
    margin-bottom: 4px;
  }

  .stand-desc {
    font-size: 14px;
    color: #cbd5e1;
    line-height: 1.35;
  }
</style>
</head>
<body>
  {BODY_CONTENT}
</body>
</html>
"""

# Definieer de slides
SLIDES = [
    {
        "filename": "0_HERO_GROOTSTE_SHOWROOM_DORDRECHT.jpg",
        "bg": WORKSPACE / "assets/certified_fitform_occasion_showroom.jpg",
        "category": "OFFICIEEL FITFORM DEALER & ZITSPECIALIST",
        "title": "Grootste Showroom Sta-op Stoelen <span>Dordrecht & Regio</span>",
        "subtitle": "Ruim 30+ Fitform, Doge & Prominent modellen direct op voorraad en klaar om te testen.",
        "content_type": "usp_grid",
        "usps": [
            "Gratis 5-Punts Zitmeting",
            "1 Jaar Volledige Garantie aan Huis",
            "Gratis Bezorgd & Ingesteld",
            "Inruil Oude Stoel Mogelijk"
        ]
    },
    {
        "filename": "1_GEERTJAN_DESKUNDIG_ZITADVIES.jpg",
        "bg": WORKSPACE / "assets/geertjan_advies_showroom.jpg",
        "category": "VAKKUNDIG MAATWERK",
        "title": "Gratis 5-Punts Zitmeting door <span>Geertjan</span>",
        "subtitle": "Geen standaard meubelverkoper, maar deskundig zitadvies door Bewegingstechnoloog Geertjan Klein Haneveld.",
        "content_type": "meting_list",
        "metingen": [
            "<strong>1. Zithoogte:</strong> Voeten ontspannen plat op de vloer zonder beknelling",
            "<strong>2. Zitdiepte:</strong> Geen druk in de knieholte, bekken goed aangesloten",
            "<strong>3. Armleuninghoogte:</strong> Schouders en nekspieren volledig ontspannen",
            "<strong>4. Lendensteun:</strong> Exacte aansluiting in uw natuurlijke rugholte",
            "<strong>5. Zithoek & Kanteling:</strong> Stabiele ondersteuning en optimaal comfort"
        ]
    },
    {
        "filename": "2_GROTE_COLLECTIE_EN_VOORRAAD.jpg",
        "bg": WORKSPACE / "assets/certified_fitform_occasion_showroom.jpg",
        "category": "DIRECT LEVERBAAR UIT VOORRAAD",
        "title": "Ruime Keuze uit <span>Topmerken & Maten</span>",
        "subtitle": "Direct proefzitten op ruim 30 sta-op stoelen van Fitform, Doge en Prominent in alle maten (XS t/m XXL).",
        "content_type": "usp_grid",
        "usps": [
            "Zowel Nieuw als Certified Occasion",
            "1, 2 of 3 Motoren (Onafhankelijk)",
            "Stof, Velours, Microvezel & Leer",
            "Direct Meenemen of Gratis Bezorgd"
        ]
    },
    {
        "filename": "3_ALLE_STANDEN_EN_FUNCTIES.jpg",
        "bg": WORKSPACE / "assets/geertjan_werkplaats_afstelling.jpg",
        "category": "ERGONOMIE & GEMAK",
        "title": "De 4 Belangrijkste Standen <span>voor Uw Lichaam</span>",
        "subtitle": "Elektrisch bedienbaar met overzichtelijke handbediening voor maximale zelfstandigheid:",
        "content_type": "standen_grid",
        "standen": [
            ("1. Actief & Gezond Zitten", "Rechte rug en optimale lendensteun, voorkomt onderuitzakken en rugpijn."),
            ("2. Rustig & Veilig Opstaan", "Vloeiende sta-op beweging die knieën, heupen en benen ontlast."),
            ("3. Ergonomisch Kantelen", "Zitting en rug kantelen samen naar achteren; ontlast direct de tussenwervelschijven."),
            ("4. Lig- & Slaapstand", "Benen hoger dan het hart voor een perfecte bloedsomloop en ontspanning.")
        ]
    },
    {
        "filename": "4_CERTIFIED_FITFORM_15_PUNTS_KEURING.jpg",
        "bg": WORKSPACE / "assets/geertjan_werkplaats_keuring.jpg",
        "category": "CERTIFIED FITFORM OCCASIONS",
        "title": "15-Punts Keuring & Revisie <span>met 1 Jaar Garantie</span>",
        "subtitle": "Elke gereviseerde stoel wordt in onze eigen werkplaats met uiterste precisie gekeurd en klaargemaakt.",
        "content_type": "usp_grid",
        "usps": [
            "Motoren & Lagers 100% Getest",
            "Dieptereiniging & Hygiënisch Fris",
            "Voorzien van Officieel Certificaat",
            "1 Jaar Volledige Garantie aan Huis"
        ]
    },
    {
        "filename": "5_VRIJBLIJVEND_PROEFZITTEN_SHOWROOM.jpg",
        "bg": WORKSPACE / "assets/pand_merwedestraat_239_open_gevel.jpg.webp",
        "category": "SHOWROOM DORDRECHT",
        "title": "Kom Vrijblijvend Proefzitten <span>in Dordrecht</span>",
        "subtitle": "Ervaar zelf het comfort. Wij nemen alle tijd voor u met een vers kopje koffie of thee.",
        "content_type": "usp_grid",
        "usps": [
            "Merwedestraat 239, Dordrecht",
            "In pand Schipper Compact Wonen",
            "Gratis Parkeren Direct voor de Deur",
            "Geen Opdringerige Verkoop"
        ]
    },
    {
        "filename": "6_GRATIS_THUISBEZORGING_EN_PLAATSING.jpg",
        "bg": WORKSPACE / "assets/Sta-op-stoel-DORDRECHT-interior.png",
        "category": "EIGEN BEZORGSERVICE",
        "title": "Gratis Thuisbezorgd & <span>in Uw Huiskamer Geplaatst</span>",
        "subtitle": "Wij bezorgen door heel Nederland & Vlaanderen en stellen de stoel direct perfect af.",
        "content_type": "usp_grid",
        "usps": [
            "Bezorging op Afspraak",
            "Netjes Binnen Geplaatst & Uitgepakt",
            "Persoonlijke Uitleg Handbediening",
            "Oude Stoel Desgewenst Meegenomen"
        ]
    }
]

def render_slide(slide_info):
    filename = slide_info["filename"]
    bg_path = slide_info["bg"]
    
    # Body content opbouwen
    inner = ""
    # Logo & seal
    inner += f'''
    <img src="file://{bg_path}" class="bg-image">
    <div class="bg-overlay-gradient"></div>

    <div class="top-header">
      <div class="logo-box">
        <img src="file:///tmp/logo_cropped.png" alt="staopstoelen.nl">
      </div>
      <div class="top-seal">
        <img src="file://{WORKSPACE}/assets/sticker_certified_fitform.svg" alt="Certified Fitform">
        <div class="top-seal-text">
          <div class="top-seal-title">Certified Fitform</div>
          <div class="top-seal-sub">Erkend Zitspecialist</div>
        </div>
      </div>
    </div>

    <div class="content-card">
      <div class="category-pill">{slide_info["category"]}</div>
      <div class="card-title">{slide_info["title"]}</div>
      <div class="card-subtitle">{slide_info["subtitle"]}</div>
    '''

    if slide_info["content_type"] == "usp_grid":
        inner += '<div class="usp-grid">'
        for u in slide_info["usps"]:
            inner += f'''
            <div class="usp-row">
              <div class="usp-check">✓</div>
              <div class="usp-label">{u}</div>
            </div>'''
        inner += '</div>'
    elif slide_info["content_type"] == "meting_list":
        inner += '<div class="meting-list">'
        for m in slide_info["metingen"]:
            inner += f'''
            <div class="meting-item">
              <div class="meting-num">•</div>
              <div class="meting-text">{m}</div>
            </div>'''
        inner += '</div>'
    elif slide_info["content_type"] == "standen_grid":
        inner += '<div class="standen-grid">'
        for st_title, st_desc in slide_info["standen"]:
            inner += f'''
            <div class="stand-box">
              <div class="stand-title">{st_title}</div>
              <div class="stand-desc">{st_desc}</div>
            </div>'''
        inner += '</div>'

    inner += f'''
      <div class="contact-strip">
        <div class="contact-info">
          <strong>Showroom:</strong> Merwedestraat 239, Dordrecht &bull; Gratis parkeren &bull; <strong>staopstoelen.nl</strong>
        </div>
        <div class="phone-badge">
          <svg style="width: 18px; height: 18px; fill: currentColor;" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
          078 - 631 4858
        </div>
      </div>
    </div>
    '''

    full_html = HTML_TEMPLATE.replace("{BODY_CONTENT}", inner)
    temp_html = f"/tmp/slide_{filename}.html"
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(full_html)

    temp_png = f"/tmp/slide_{filename}.png"
    cmd = [
        CHROME_BIN,
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        "--window-size=1200,1200",
        f"--screenshot={temp_png}",
        f"file://{temp_html}"
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    dest_jpg = OUTPUT_DIR / filename
    im = Image.open(temp_png).convert("RGB")
    im.save(dest_jpg, "JPEG", quality=95)
    print(f"✅ Slide gegenereerd: {dest_jpg.name}")

def main():
    print(f"--- Genereren Generieke Marktplaats Advertentieserie ---")
    for s in SLIDES:
        render_slide(s)

    # 7e/laatste foto is ALTIJD de officiële Bedrijfsinfo Banner
    dest_banner = OUTPUT_DIR / "7_BEDRIJFSINFO_SHOWROOM_EN_SERVICE.jpg"
    shutil.copy2(MASTER_BANNER, dest_banner)
    print(f"✅ Afsluitende banner gekopieerd: {dest_banner.name}")
    print(f"Voltooid! Alle 8 foto's staan klaar in {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
