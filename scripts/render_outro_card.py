#!/usr/bin/env python3
"""
scripts/render_outro_card.py
Renders broadcast-quality 1280x720 slides using Headless Chrome:
1. Scene 4 Investment & Business Case slides (3 progressive highlight states:
   assets/invest_card_step1.png, assets/invest_card_step2.png, assets/invest_card_step3.png)
2. Scene 5 Broadcast Outro slide (assets/outro_card_broadcast.png) matching GEMINI.md
   and featuring the new 3D green sta-op stoel logo + official Certified Fitform seal.
"""

import os
import base64
import subprocess
from pathlib import Path

WORKSPACE = Path('/Users/matthiasradder/AntiGravity Projecten/Staopstoelen.nl')
CHROME_BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

def to_b64(path, mime):
    with open(path, 'rb') as f:
        data = base64.b64encode(f.read()).decode('utf-8')
    return f"data:{mime};base64,{data}"

logo_b64 = to_b64(WORKSPACE / 'assets/staopstoelen_logo_cropped_transparent.png', 'image/png')
chair_logo_b64 = to_b64(WORKSPACE / 'assets/icons/stoel_logo_header_s2.png', 'image/png')
geertjan_b64 = to_b64(WORKSPACE / 'assets/geertjan_advies_showroom.jpg', 'image/jpeg')
cert_b64 = to_b64(WORKSPACE / 'assets/sticker_certified_fitform.png', 'image/png')
thumb_gevel_b64 = to_b64(WORKSPACE / 'assets/pand_makeover_huisstijl_merwedestraat.jpg', 'image/jpeg')
thumb_etalage_b64 = to_b64(WORKSPACE / 'assets/showroom_render_etalage_visgraat_pvc.jpg', 'image/jpeg')
thumb_stoelen_b64 = to_b64(WORKSPACE / 'assets/showroom_render_stoelen_visgraat_pvc.jpg', 'image/jpeg')

def render_html_to_png(html_str, output_path, temp_name='temp_slide.html'):
    temp_html = WORKSPACE / 'scripts' / temp_name
    temp_html.write_text(html_str, encoding='utf-8')
    cmd = [
        CHROME_BIN,
        '--headless',
        '--disable-gpu',
        '--window-size=1280,720',
        '--default-background-color=00000000',
        '--hide-scrollbars',
        f'--screenshot={output_path}',
        f'file://{temp_html}'
    ]
    subprocess.run(cmd, capture_output=True, text=True)
    if temp_html.exists():
        temp_html.unlink()
    if output_path.exists():
        print(f"✅ Generated {output_path.name} ({os.path.getsize(output_path)} bytes)")

def build_invest_html(active_step=3):
    # active_step: 1 = highlight col 1, 2 = highlight col 2, 3 = highlight col 3 + bottom banner
    c1_class = "card active-green" if active_step == 1 else "card"
    c2_class = "card active-green" if active_step == 2 else "card"
    c3_class = "card active-orange" if active_step == 3 else "card card-orange-Idle"
    bar_class = "total-bar active-bar" if active_step == 3 else "total-bar"

    check_green = """<svg class="chk chk-green" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg>"""
    check_orange = """<svg class="chk chk-orange" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg>"""

    return f"""<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<style>
  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
  }}
  body {{
    width: 1280px;
    height: 720px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: radial-gradient(circle at 50% 0%, #1d3b23 0%, #0d1f11 75%, #08140b 100%);
    color: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 28px 44px 30px 44px;
  }}

  /* TOP BAR */
  .top-bar {{
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .brand-pill {{
    display: flex;
    align-items: center;
    gap: 10px;
    background: #ffffff;
    border: 1.5px solid #d8e6d9;
    padding: 6px 18px 6px 8px;
    border-radius: 40px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  }}
  .brand-chair {{
    width: 38px;
    height: 38px;
    object-fit: contain;
  }}
  .brand-logo {{
    height: 24px;
    width: auto;
    object-fit: contain;
  }}
  .title-center {{
    text-align: center;
  }}
  .eyebrow {{
    display: inline-block;
    background: rgba(243, 146, 35, 0.18);
    border: 1px solid rgba(243, 146, 35, 0.5);
    color: #fbbf24;
    font-size: 11.5px;
    font-weight: 800;
    letter-spacing: 1px;
    padding: 4px 14px;
    border-radius: 20px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }}
  .title-center h1 {{
    font-size: 29px;
    font-weight: 900;
    letter-spacing: -0.3px;
    color: #ffffff;
  }}
  .title-center p {{
    font-size: 14px;
    color: #a7f3d0;
    margin-top: 2px;
    font-weight: 500;
  }}
  .cert-mini {{
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.16);
    padding: 7px 16px;
    border-radius: 40px;
  }}
  .cert-mini img {{
    width: 36px;
    height: 36px;
    object-fit: contain;
  }}
  .cert-mini div {{
    font-size: 11.5px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.25;
  }}
  .cert-mini span {{
    display: block;
    color: #fb923c;
    font-size: 10.5px;
    font-weight: 700;
  }}

  /* 3 COLUMNS */
  .grid {{
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 22px;
    height: 456px;
  }}
  .card {{
    background: rgba(22, 46, 27, 0.85);
    border: 1.5px solid rgba(110, 175, 118, 0.3);
    border-radius: 20px;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 12px 30px rgba(0,0,0,0.28);
    position: relative;
    overflow: hidden;
  }}
  .card-orange-Idle {{
    background: rgba(44, 34, 20, 0.88);
    border: 1.5px solid rgba(245, 158, 11, 0.45);
  }}
  .active-green {{
    background: linear-gradient(180deg, rgba(34, 74, 42, 0.96) 0%, rgba(20, 45, 25, 0.96) 100%);
    border: 2.5px solid #4ade80;
    box-shadow: 0 14px 36px rgba(74, 222, 128, 0.22);
    transform: translateY(-3px);
  }}
  .active-orange {{
    background: linear-gradient(180deg, rgba(62, 42, 18, 0.96) 0%, rgba(36, 25, 12, 0.96) 100%);
    border: 2.5px solid #f59e0b;
    box-shadow: 0 14px 36px rgba(245, 158, 11, 0.28);
    transform: translateY(-3px);
  }}

  .card-top {{
    display: flex;
    flex-direction: column;
    gap: 12px;
  }}
  .card-header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }}
  .step-badge {{
    font-size: 12px;
    font-weight: 800;
    padding: 5px 12px;
    border-radius: 8px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }}
  .badge-green {{
    background: rgba(74, 222, 128, 0.16);
    color: #86efac;
    border: 1px solid rgba(74, 222, 128, 0.35);
  }}
  .badge-orange {{
    background: #ea580c;
    color: #ffffff;
  }}
  .thumb {{
    width: 64px;
    height: 42px;
    border-radius: 8px;
    object-fit: cover;
    border: 1.5px solid rgba(255,255,255,0.25);
  }}

  .price-box {{
    background: rgba(0,0,0,0.25);
    border-radius: 12px;
    padding: 10px 14px;
    text-align: center;
    border: 1px solid rgba(255,255,255,0.08);
  }}
  .price-main {{
    font-size: 25px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: -0.3px;
  }}
  .price-orange {{
    color: #fbbf24;
  }}
  .price-sub {{
    font-size: 11.5px;
    color: #94a3b8;
    margin-top: 2px;
    font-weight: 600;
  }}

  .bullet-list {{
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 9px;
    margin: 6px 0;
  }}
  .bullet-list li {{
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 13.5px;
    color: #ecfdf5;
    font-weight: 500;
    line-height: 1.3;
  }}
  .chk {{
    width: 17px;
    height: 17px;
    flex-shrink: 0;
  }}
  .chk-green {{
    color: #4ade80;
  }}
  .chk-orange {{
    color: #fbbf24;
  }}

  .card-foot {{
    padding: 9px 12px;
    border-radius: 10px;
    font-size: 12.5px;
    font-weight: 800;
    text-align: center;
  }}
  .foot-green {{
    background: rgba(20, 83, 45, 0.7);
    color: #86efac;
    border: 1px solid rgba(74, 222, 128, 0.25);
  }}
  .foot-orange {{
    background: linear-gradient(90deg, #d97706 0%, #ea580c 100%);
    color: #ffffff;
  }}

  /* BOTTOM TOTAL BAR */
  .total-bar {{
    height: 76px;
    background: linear-gradient(90deg, #d97706 0%, #ea580c 50%, #c2410c 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 28px;
    box-shadow: 0 10px 28px rgba(234, 88, 12, 0.35);
    border: 1.5px solid rgba(255,255,255,0.25);
  }}
  .active-bar {{
    border: 2px solid #fde68a;
    box-shadow: 0 12px 34px rgba(245, 158, 11, 0.5);
  }}
  .total-left h2 {{
    font-size: 19px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: 0.2px;
  }}
  .total-left p {{
    font-size: 13px;
    color: #ffedd5;
    font-weight: 600;
    margin-top: 2px;
  }}
  .total-right {{
    background: rgba(0,0,0,0.25);
    padding: 10px 20px;
    border-radius: 30px;
    font-size: 15px;
    font-weight: 800;
    color: #fde68a;
    border: 1px solid rgba(255,255,255,0.2);
  }}
</style>
</head>
<body>

  <!-- TOP HEADER -->
  <div class="top-bar">
    <div class="brand-pill">
      <img src="{chair_logo_b64}" class="brand-chair" alt="Logo">
      <img src="{logo_b64}" class="brand-logo" alt="staopstoelen.nl">
    </div>
    <div class="title-center">
      <span class="eyebrow">Investering &amp; Business Case Showroom</span>
      <h1>Make-Over Merwedestraat 239 • Dordrecht</h1>
      <p>Slimme Quick Win: Binnen 1 week gerealiseerd zónder ingrijpend sloopwerk</p>
    </div>
    <div class="cert-mini">
      <img src="{cert_b64}" alt="Certified Fitform">
      <div>
        CERTIFIED FITFORM
        <span>Showroom Concept</span>
      </div>
    </div>
  </div>

  <!-- 3 CARDS -->
  <div class="grid">
    <!-- COL 1 -->
    <div class="{c1_class}">
      <div class="card-top">
        <div class="card-header">
          <span class="step-badge badge-green">1. Gevel Make-Over</span>
          <img src="{thumb_gevel_b64}" class="thumb" alt="Gevel">
        </div>
        <div class="price-box">
          <div class="price-main">€ 1.750 - € 2.850</div>
          <div class="price-sub">excl. btw • inclusief montage</div>
        </div>
        <ul class="bullet-list">
          <li>{check_green}<span>10m Strakke witte Dibond gevelpanelen</span></li>
          <li>{check_green}<span>UV-bestendige Staopstoelen belettering</span></li>
          <li>{check_green}<span>2x Schuine gevelvlaggen (45° houders)</span></li>
          <li>{check_green}<span>Subtiele zandstraal raambelettering</span></li>
          <li>{check_green}<span>Grijze pui behouden (geen sloopwerk)</span></li>
        </ul>
      </div>
      <div class="card-foot foot-green">Directe stopkracht vanaf de straat</div>
    </div>

    <!-- COL 2 -->
    <div class="{c2_class}">
      <div class="card-top">
        <div class="card-header">
          <span class="step-badge badge-green">2. Interieur Styling</span>
          <img src="{thumb_etalage_b64}" class="thumb" alt="Etalage">
        </div>
        <div class="price-box">
          <div class="price-main">€ 1.100 - € 2.200</div>
          <div class="price-sub">excl. btw • snelle uitvoering</div>
        </div>
        <ul class="bullet-list">
          <li>{check_green}<span>Achterwand &amp; zijwanden in saliegroen</span></li>
          <li>{check_green}<span>Akoestische eiken lattenwand om zuil</span></li>
          <li>{check_green}<span>Verhoogd eiken podium in etalageruit</span></li>
          <li>{check_green}<span>Gerichte 2700K spot op oranje stoel</span></li>
          <li>{check_green}<span>Certified Fitform &amp; meetprotocol borden</span></li>
        </ul>
      </div>
      <div class="card-foot foot-green">Warme, huiselijke boutique sfeer</div>
    </div>

    <!-- COL 3 -->
    <div class="{c3_class}">
      <div class="card-top">
        <div class="card-header">
          <span class="step-badge badge-orange">3. Business Case &amp; ROI</span>
          <img src="{thumb_stoelen_b64}" class="thumb" alt="Showroom">
        </div>
        <div class="price-box">
          <div class="price-main price-orange">2 à 3 Stoelen</div>
          <div class="price-sub">terugverdientijd complete make-over!</div>
        </div>
        <ul class="bullet-list">
          <li>{check_orange}<span>Totaal Quick Win: ca. € 3.000 - € 4.500</span></li>
          <li>{check_orange}<span>Ruimte voor 25 fauteuils (was slaapzone)</span></li>
          <li>{check_orange}<span>Directe stijging showroom-conversie</span></li>
          <li>{check_orange}<span>Professionele uitstraling op Marktplaats</span></li>
          <li>{check_orange}<span>Optioneel: Eiken visgraat PVC vloertje</span></li>
        </ul>
      </div>
      <div class="card-foot foot-orange">Zeer hoog rendement &amp; snel terugverdiend</div>
    </div>
  </div>

  <!-- BOTTOM BAR -->
  <div class="{bar_class}">
    <div class="total-left">
      <h2>TOTAAL QUICK WIN: CA. € 3.000,- TOT € 4.500,- EXCL. BTW</h2>
      <p>Inclusief gevelplaten, vlaggen, raamfolie, saliegroene wanden, akoestische zuil en etalagepodium</p>
    </div>
    <div class="total-right">
      Terugverdiend met 2 à 3 stoelen
    </div>
  </div>

</body>
</html>"""


outro_html = f"""<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <style>
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }}
    body {{
      width: 1280px;
      height: 720px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f8faf7;
      color: #1a2a1e;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 34px 48px;
    }}

    /* TOP HEADER */
    .header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 78px;
    }}
    .logo-row {{
      display: flex;
      align-items: center;
      gap: 16px;
    }}
    .chair-badge {{
      width: 66px;
      height: 66px;
      border-radius: 50%;
      background: #ffffff;
      border: 2px solid #d8e6d9;
      box-shadow: 0 4px 14px rgba(18,43,7,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 5px;
      flex-shrink: 0;
    }}
    .chair-badge img {{
      width: 100%;
      height: 100%;
      object-fit: contain;
    }}
    .logo-container {{
      display: flex;
      flex-direction: column;
      justify-content: center;
    }}
    .logo-img {{
      height: 46px;
      width: auto;
      object-fit: contain;
      image-rendering: -webkit-optimize-contrast;
      display: block;
    }}
    .logo-sub {{
      font-size: 15px;
      font-weight: 700;
      color: #2e6819;
      margin-top: 5px;
      letter-spacing: 0.2px;
    }}
    .cert-badge {{
      display: flex;
      align-items: center;
      gap: 15px;
      background: #ffffff;
      padding: 8px 22px;
      border-radius: 40px;
      box-shadow: 0 4px 18px rgba(0,0,0,0.06);
      border: 1.5px solid #d8e6d9;
    }}
    .cert-img {{
      width: 52px;
      height: 52px;
      object-fit: contain;
    }}
    .cert-text h4 {{
      font-size: 15.5px;
      font-weight: 800;
      color: #1a3821;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }}
    .cert-text p {{
      font-size: 12px;
      font-weight: 700;
      color: #ea580c;
    }}

    /* MAIN CONTENT */
    .main {{
      display: flex;
      gap: 26px;
      height: 415px;
      align-items: stretch;
    }}

    /* LEFT HERO CARD */
    .hero-card {{
      flex: 0 0 465px;
      background: #ffffff;
      border-radius: 20px;
      padding: 16px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.06);
      border: 1.5px solid #e1ebe2;
      display: flex;
      flex-direction: column;
    }}
    .hero-img-wrap {{
      width: 100%;
      height: 225px;
      border-radius: 14px;
      overflow: hidden;
      position: relative;
    }}
    .hero-img {{
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 25%;
    }}
    .hero-tag {{
      position: absolute;
      top: 12px;
      left: 12px;
      background: #ea580c;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      padding: 5px 12px;
      border-radius: 6px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }}
    .hero-content {{
      padding: 16px 6px 4px 6px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      flex: 1;
    }}
    .hero-title {{
      font-size: 20px;
      font-weight: 800;
      color: #1e3d23;
      margin-bottom: 6px;
    }}
    .hero-desc {{
      font-size: 13.5px;
      line-height: 1.5;
      color: #4b5563;
    }}

    /* RIGHT GRID (4 GUARANTEES) */
    .usp-grid {{
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 16px;
    }}
    .usp-card {{
      background: #ffffff;
      border-radius: 18px;
      padding: 22px 20px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.05);
      border: 1.5px solid #e1ebe2;
      display: flex;
      align-items: center;
      gap: 18px;
    }}
    .usp-icon {{
      width: 54px;
      height: 54px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }}
    .icon-green {{
      background: #eaf5eb;
      border: 1.5px solid #c8e6c9;
    }}
    .icon-orange {{
      background: #fff3e6;
      border: 1.5px solid #ffe0b2;
    }}
    .usp-text h5 {{
      font-size: 16px;
      font-weight: 800;
      color: #1a2a1e;
      margin-bottom: 5px;
      line-height: 1.25;
    }}
    .usp-text p {{
      font-size: 13px;
      line-height: 1.4;
      color: #64748b;
    }}

    /* BOTTOM BAR */
    .footer-bar {{
      height: 86px;
      background: #18331d;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      box-shadow: 0 10px 25px rgba(24,51,29,0.25);
    }}
    .footer-left h3 {{
      font-size: 18.5px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 4px;
    }}
    .footer-left p {{
      font-size: 13.5px;
      color: #c4d7c6;
    }}
    .footer-left .bullet {{
      color: #ea580c;
      margin: 0 8px;
      font-size: 16px;
    }}
    .footer-btn {{
      background: #ea580c;
      color: #ffffff;
      padding: 13px 26px;
      border-radius: 35px;
      display: flex;
      align-items: center;
      gap: 14px;
      font-weight: 800;
      font-size: 16.5px;
      box-shadow: 0 4px 14px rgba(234,88,12,0.4);
      letter-spacing: 0.3px;
    }}
    .btn-item {{
      display: flex;
      align-items: center;
      gap: 8px;
    }}
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="logo-row">
      <div class="chair-badge">
        <img src="{chair_logo_b64}" alt="Sta-op Stoel Icoon">
      </div>
      <div class="logo-container">
        <img src="{logo_b64}" class="logo-img" alt="staopstoelen.nl">
        <div class="logo-sub">Dé Zitspecialist van de Drechtsteden &amp; Randstad</div>
      </div>
    </div>
    <div class="cert-badge">
      <img src="{cert_b64}" class="cert-img" alt="Certified Fitform">
      <div class="cert-text">
        <h4>Certified Fitform</h4>
        <p>Officieel Keurmerk • 100% Maatwerk</p>
      </div>
    </div>
  </div>

  <!-- MAIN -->
  <div class="main">
    <!-- HERO ZITMETING -->
    <div class="hero-card">
      <div class="hero-img-wrap">
        <span class="hero-tag">PERSOONLIJK ZITADVIES</span>
        <img src="{geertjan_b64}" class="hero-img" alt="Geertjan 5-punts zitmeting">
      </div>
      <div class="hero-content">
        <h3 class="hero-title">Deskundige 5-Punts Zitmeting</h3>
        <p class="hero-desc">
          Elk lichaam is uniek. Bewegingstechnoloog Geertjan stelt zithoogte, zitdiepte, rughoogte en armleggers exact op maat af voor ontspannen zitcomfort en moeiteloos opstaan.
        </p>
      </div>
    </div>

    <!-- 4 GUARANTEES -->
    <div class="usp-grid">
      <div class="usp-card">
        <div class="usp-icon icon-green">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2e6819" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
        <div class="usp-text">
          <h5>1 tot 2 Jaar Garantie</h5>
          <p>100% technisch gekeurd &amp; gereviseerd in onze eigen werkplaats.</p>
        </div>
      </div>
      <div class="usp-card">
        <div class="usp-icon icon-orange">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 17h4V5H2v12h3"/>
            <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/>
            <circle cx="7.5" cy="17.5" r="2.5"/>
            <circle cx="17.5" cy="17.5" r="2.5"/>
          </svg>
        </div>
        <div class="usp-text">
          <h5>Gratis Bezorging</h5>
          <p>Kosteloos in regio Drechtsteden; keurig op maat afgesteld aan huis.</p>
        </div>
      </div>
      <div class="usp-card">
        <div class="usp-icon icon-orange">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="usp-text">
          <h5>Direct Leverbaar</h5>
          <p>Grootste assortiment Fitform occasions rijklaar uit voorraad.</p>
        </div>
      </div>
      <div class="usp-card">
        <div class="usp-icon icon-green">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2e6819" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
            <path d="M3 21v-5h5"/>
          </svg>
        </div>
        <div class="usp-text">
          <h5>Inruil Oude Stoel</h5>
          <p>Wilt u uw stoel inruilen? Vraag vrijblijvend naar de inruilwaarde.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer-bar">
    <div class="footer-left">
      <h3>Kom gerust vrijblijvend proefzitten</h3>
      <p>
        Merwedestraat 239, Dordrecht
        <span class="bullet">•</span>
        Gratis parkeren voor de deur
        <span class="bullet">•</span>
        staopstoelen.nl
      </p>
    </div>
    <div class="footer-btn">
      <div class="btn-item">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
        <span>078 - 631 4858</span>
      </div>
      <span style="opacity: 0.5; font-weight: 300;">|</span>
      <div class="btn-item">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        <span>06 - 22 23 29 64</span>
      </div>
    </div>
  </div>

</body>
</html>
"""

if __name__ == '__main__':
    print("Rendering Scene 4 Investment Cards (Steps 1, 2, 3) & Scene 5 Outro Card...")
    render_html_to_png(build_invest_html(1), WORKSPACE / 'assets/invest_card_step1.png', 'temp_inv1.html')
    render_html_to_png(build_invest_html(2), WORKSPACE / 'assets/invest_card_step2.png', 'temp_inv2.html')
    render_html_to_png(build_invest_html(3), WORKSPACE / 'assets/invest_card_step3.png', 'temp_inv3.html')
    render_html_to_png(outro_html, WORKSPACE / 'assets/outro_card_broadcast.png', 'temp_outro.html')
