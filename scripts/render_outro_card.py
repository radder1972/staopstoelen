#!/usr/bin/env python3
"""
scripts/render_outro_card.py
Renders the broadcast-quality 1280x720 outro slide matching the authentic corporate
identity from GEMINI.md and assets/marketing/bedrijfsinfo_banner_staopstoelen.jpg.
"""

import os
import base64
import subprocess
from pathlib import Path

WORKSPACE = Path('/Users/matthiasradder/AntiGravity Projecten/Staopstoelen.nl')

def to_b64(path, mime):
    with open(path, 'rb') as f:
        data = base64.b64encode(f.read()).decode('utf-8')
    return f"data:{mime};base64,{data}"

logo_b64 = to_b64(WORKSPACE / 'assets/staopstoelen_logo_cropped_transparent.png', 'image/png')
geertjan_b64 = to_b64(WORKSPACE / 'assets/geertjan_advies_showroom.jpg', 'image/jpeg')
cert_b64 = to_b64(WORKSPACE / 'assets/sticker_certified_fitform.png', 'image/png')

html_content = f"""<!DOCTYPE html>
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
    .logo-container {{
      display: flex;
      flex-direction: column;
      justify-content: center;
    }}
    .logo-img {{
      height: 48px;
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
    <div class="logo-container">
      <img src="{logo_b64}" class="logo-img" alt="staopstoelen.nl">
      <div class="logo-sub">Dé Zitspecialist van de Drechtsteden &amp; Randstad</div>
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
        <span class="hero-tag">★ PERSOONLIJK ZITADVIES</span>
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

temp_html = WORKSPACE / 'scripts/outro_rendered.html'
temp_html.write_text(html_content, encoding='utf-8')

chrome_bin = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
output_img = WORKSPACE / 'assets/outro_card_broadcast.png'

cmd = [
    chrome_bin,
    '--headless',
    '--disable-gpu',
    '--window-size=1280,720',
    '--hide-scrollbars',
    f'--screenshot={output_img}',
    f'file://{temp_html}'
]

print("Rendering outro card with Chrome...")
res = subprocess.run(cmd, capture_output=True, text=True)
if output_img.exists():
    print(f"✅ Generated {output_img} ({os.path.getsize(output_img)} bytes)")
