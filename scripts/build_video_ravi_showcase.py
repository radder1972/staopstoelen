#!/usr/bin/env python3
"""
scripts/build_video_ravi_showcase.py
Luxe 9:16 Showcase & Aanbiedingsvideo (1080x1920) voor de DFM Design Sta-op stoel Ravi:
Laat de Ravi schitteren in ALLE kleuren/stofferingen (Cognac & Weefstof duo, Olijfgroen & Taupe Bouclé duo,
Zand-Taupe & Crème Bouclé duo), in 3 maten (Small, Medium & Large), én in ALLE standen
(Actieve zitstand, Uitgeklapte voetensteun, Volledige relaxstand, Veilige sta-op hulp met automatische draaiblokkering,
4-knops bediening in de armleuning en oppompbare lendensteun).
Aanbieding: € 350,- korting (van € 2.295,- voor € 1.945,-).
"""
import json, math, os, shutil, ssl, struct, subprocess, urllib.request, wave
from pathlib import Path
from PIL import Image

WS = Path("/Users/matthiasradder/AntiGravity Projecten/Staopstoelen.nl")
FFMPEG = "/Users/matthiasradder/.local/bin/ffmpeg"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
VOICE_ID = "g5MYumTmZlFU9tYSmTp9"  # Alexander

CUR_BRAIN = Path("/Users/matthiasradder/.gemini/antigravity/brain/5a71c862-1402-4ffc-8876-2c899186c109")
D_OPA = WS / "assets/marketing/video_opa"
D_MAN = WS / "assets/marketing/video_rene_man"
D_RAVI = WS / "assets/marketing/video_ravi"
S_DIR = WS / "assets/stoelen"
WORK = WS / "assets/marketing/video_ravi_showcase"
A = WORK / "audio"
P = WORK / "parts"
OUT_DIR = Path.home() / "Downloads/Staopstoelen_YouTube_Videos"

for p in (WORK, A, P, OUT_DIR, WS / "assets/video"):
    p.mkdir(parents=True, exist_ok=True)

# Copy the newly generated Ravi showcase images into assets/stoelen/ and create 4:5 gallery crops
img_olijfgroen = S_DIR / "ravi_showcase_olijfgroen_duo.jpg"
img_zand_boucle = S_DIR / "ravi_showcase_zand_boucle_duo.jpg"
shutil.copy2(CUR_BRAIN / "ravi_showcase_olijfgroen_duo_jpg_1794056158337.jpg", img_olijfgroen)
shutil.copy2(CUR_BRAIN / "ravi_showcase_zand_boucle_duo_jpg_1794056185988.jpg", img_zand_boucle)

# Also create 4:5 gallery crops (960x1200) for website gallery & modal
for src_p, dst_name in [
    (img_olijfgroen, "ravi_kleur_olijfgroen_duo_gallery.jpg"),
    (img_zand_boucle, "ravi_kleur_zand_boucle_duo_gallery.jpg"),
]:
    im = Image.open(src_p).convert("RGB")
    # Crop vertical 960x1440 centered on the chair (y=240..1440) -> 960x1200 (4:5)
    cropped = im.crop((0, 260, im.width, min(im.height, 260 + int(im.width * 1.25))))
    cropped.save(S_DIR / dst_name, quality=92)

W, H, FPS = 1080, 1920, 30
ctx = ssl._create_unverified_context()

def api_key():
    for line in open(WS / ".env"):
        if line.startswith("ELEVENLABS_API_KEY="):
            return line.split("=", 1)[1].strip().strip("\"'")
    return os.environ.get("ELEVENLABS_API_KEY", "")

def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def duration(path):
    r = subprocess.run([FFMPEG, "-i", str(path)], stderr=subprocess.PIPE, text=True)
    for l in r.stderr.splitlines():
        if "Duration:" in l:
            h, m, s = l.split("Duration:")[1].split(",")[0].strip().split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)

def tts(text, out, speed=0.95):
    if out.exists():
        return
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.55,
            "similarity_boost": 0.82,
            "style": 0.14,
            "use_speaker_boost": True,
            "speed": speed
        }
    }
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
        data=json.dumps(payload).encode(), method="POST",
        headers={"xi-api-key": api_key(), "Content-Type": "application/json", "Accept": "audio/mpeg"}
    )
    out.write_bytes(urllib.request.urlopen(req, context=ctx, timeout=120).read())

FONT = "<link href='https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&family=Outfit:wght@400;500;600;700&display=swap' rel='stylesheet'>"
BASE = "*{margin:0;padding:0;box-sizing:border-box} html,body{width:1080px;height:1920px;overflow:hidden}"

def render_html(html, out, transparent=False):
    tmp = WORK / "_tmp_slide.html"
    tmp.write_text(html, encoding="utf-8")
    run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--window-size={W},{H}",
         "--virtual-time-budget=5000", *(["--default-background-color=00000000"] if transparent else []),
         f"--screenshot={out}", tmp.as_uri()])
    tmp.unlink()

def build_showcase_slides():
    logo_uri = (WS / "assets/marketing/logo_letters_bijgesneden.png").as_uri()
    cognac_cozy = (WS / "assets/chair_ravi_cozy.png").as_uri()
    olijfgroen_duo = img_olijfgroen.as_uri()
    zand_boucle_duo = img_zand_boucle.as_uri()
    ravi_trots = (D_RAVI / "ravi_scene4_trots_in_ravi.jpg").as_uri()
    ravi_1 = (S_DIR / "Sta-op-stoel-RAVI-1-kopie.jpg").as_uri()
    ravi_2_been = (S_DIR / "Sta-op-stoel-RAVI-2-rotated.jpg").as_uri()
    ravi_3_relax = (S_DIR / "Sta-op-stoel-RAVI-3-rotated.jpg").as_uri()
    ravi_4_staop = (S_DIR / "Sta-op-stoel-RAVI-4-rotated.jpg").as_uri()
    ravi_5_voor = (S_DIR / "Sta-op-stoel-RAVI-5-rotated.jpg").as_uri()
    ravi_6_zij = (S_DIR / "Sta-op-stoel-RAVI-6-rotated.jpg").as_uri()
    ravi_7_knoppen = (S_DIR / "Sta-op-stoel-RAVI-7-rotated.jpg").as_uri()
    ravi_8_stof = (S_DIR / "Sta-op-stoel-RAVI-8-rotated.jpg").as_uri()

    # Slide A: Alle Kleuren, Leer, Bouclé & Duo-Stoffering + Maten S / M / L Bento Grid
    render_html(f"""<html><head>{FONT}<style>{BASE}
      body{{background:#fbf9f5;font-family:'Outfit',sans-serif;color:#1d2024;display:flex;flex-direction:column;padding:42px}}
      .hdr{{text-align:center;margin-bottom:26px}}
      .hdr .pill{{display:inline-block;background:#eef7eb;color:#2f5f15;font-family:'Montserrat';font-weight:800;
                  font-size:24px;padding:10px 28px;border-radius:40px;letter-spacing:1px;text-transform:uppercase}}
      .hdr h1{{font-family:'Montserrat';font-weight:900;font-size:52px;color:#1d2024;line-height:1.12;margin-top:14px}}
      .hdr p{{font-size:31px;color:#4a5568;font-weight:500;margin-top:8px}}
      .grid{{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:510px 510px 490px;gap:24px;flex:1}}
      .card{{background:#fff;border-radius:28px;overflow:hidden;position:relative;box-shadow:0 12px 30px rgba(0,0,0,.08);border:2px solid #ece7df}}
      .card img{{width:100%;height:100%;object-fit:cover}}
      .lbl{{position:absolute;left:18px;bottom:18px;right:18px;background:rgba(29,32,36,.88);color:#fff;
            padding:14px 20px;border-radius:18px;font-family:'Montserrat';font-weight:700;font-size:24px;
            display:flex;align-items:center;justify-content:space-between}}
      .lbl span.dot{{width:22px;height:22px;border-radius:50%;display:inline-block;border:2px solid #fff;flex-shrink:0}}
    </style></head><body>
      <div class='hdr'>
        <div class='pill'>Small • Medium • Large &nbsp;|&nbsp; Stof, Leer &amp; Duo</div>
        <h1>In élke kleur &amp; combinatie</h1>
        <p>Stel de DFM Ravi helemaal naar wens samen</p>
      </div>
      <div class='grid'>
        <div class='card'>
          <img src='{cognac_cozy}'>
          <div class='lbl'><span>Duo Cognac Leer &amp; Weefstof</span><span class='dot' style='background:#b67c49'></span></div>
        </div>
        <div class='card'>
          <img src='{olijfgroen_duo}'>
          <div class='lbl'><span>Duo Olijfgroen &amp; Taupe</span><span class='dot' style='background:#5d6643'></span></div>
        </div>
        <div class='card'>
          <img src='{zand_boucle_duo}'>
          <div class='lbl'><span>Duo Zand-Taupe &amp; Bouclé</span><span class='dot' style='background:#c6b39e'></span></div>
        </div>
        <div class='card'>
          <img src='{ravi_8_stof}'>
          <div class='lbl'><span>Vakmanschap: Leer &amp; Bouclé</span><span class='dot' style='background:#8c6c49'></span></div>
        </div>
        <div class='card'>
          <img src='{ravi_6_zij}'>
          <div class='lbl'><span>Slanke Doorlopende Kuip</span><span class='dot' style='background:#7a5c3e'></span></div>
        </div>
        <div class='card'>
          <img src='{ravi_trots}'>
          <div class='lbl'><span>Op Maat in S, M &amp; L</span><span class='dot' style='background:#2f5f15'></span></div>
        </div>
      </div>
    </body></html>""", WORK / "slide_ravi_kleuren_grid.png")

    # Slide B: Alle 4 Standen + 4-Knops Bediening & Oppompbare Lendensteun
    render_html(f"""<html><head>{FONT}<style>{BASE}
      body{{background:#fbf9f5;font-family:'Outfit',sans-serif;color:#1d2024;display:flex;flex-direction:column;padding:42px}}
      .hdr{{text-align:center;margin-bottom:22px}}
      .hdr .pill{{display:inline-block;background:#2f5f15;color:#fff;font-family:'Montserrat';font-weight:800;
                  font-size:24px;padding:10px 28px;border-radius:40px;letter-spacing:1px;text-transform:uppercase}}
      .hdr h1{{font-family:'Montserrat';font-weight:900;font-size:50px;color:#1d2024;line-height:1.12;margin-top:12px}}
      .grid4{{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:520px 520px;gap:22px}}
      .scard{{background:#fff;border-radius:26px;overflow:hidden;position:relative;box-shadow:0 12px 28px rgba(0,0,0,.08);border:2px solid #e5dfd5}}
      .scard img{{width:100%;height:100%;object-fit:cover}}
      .scard .step{{position:absolute;top:16px;left:16px;background:#f39223;color:#fff;font-family:'Montserrat';
                    font-weight:900;font-size:22px;padding:8px 18px;border-radius:30px;box-shadow:0 6px 16px rgba(0,0,0,.2)}}
      .scard .lbl{{position:absolute;left:16px;bottom:16px;right:16px;background:rgba(29,32,36,.88);color:#fff;
                   padding:14px 18px;border-radius:16px;font-family:'Montserrat';font-weight:700;font-size:24px;text-align:center}}
      .bottom-row{{display:grid;grid-template-columns:1.15fr 1fr;gap:22px;margin-top:22px;flex:1}}
      .bcard{{background:#1d2024;color:#fff;border-radius:26px;overflow:hidden;display:flex;align-items:center;
              padding:24px 28px;gap:24px;box-shadow:0 12px 28px rgba(0,0,0,.1)}}
      .bcard img{{width:210px;height:210px;border-radius:20px;object-fit:cover;border:3px solid #f39223;flex-shrink:0}}
      .bcard h3{{font-family:'Montserrat';font-size:28px;font-weight:800;color:#f39223;line-height:1.18}}
      .bcard p{{font-size:24px;color:#e2e8f0;margin-top:8px;line-height:1.3}}
      .bcard-green{{background:#eef7eb;border:2px solid #b8dcad;color:#1d2024;border-radius:26px;padding:24px 28px;
                    display:flex;flex-direction:column;justify-content:center}}
      .bcard-green h3{{font-family:'Montserrat';font-size:28px;font-weight:800;color:#2f5f15;line-height:1.2}}
      .bcard-green ul{{list-style:none;margin-top:12px;display:flex;flex-direction:column;gap:8px;font-size:24px;font-weight:600;color:#2d3748}}
    </style></head><body>
      <div class='hdr'>
        <div class='pill'>2 Onafhankelijke Motoren • Veilige Draaivoet</div>
        <h1>Alle standen in één elegante fauteuil</h1>
      </div>
      <div class='grid4'>
        <div class='scard'>
          <img src='{ravi_5_voor}'>
          <div class='step'>1. Actief Zitten</div>
          <div class='lbl'>360° Draaifauteuil op Stervoet</div>
        </div>
        <div class='scard'>
          <img src='{ravi_2_been}'>
          <div class='step'>2. Beensteun Uit</div>
          <div class='lbl'>Voetensteun los verstelbaar</div>
        </div>
        <div class='scard'>
          <img src='{ravi_3_relax}'>
          <div class='step'>3. Relaxstand</div>
          <div class='lbl'>Rug &amp; benen traploos achterover</div>
        </div>
        <div class='scard'>
          <img src='{ravi_4_staop}'>
          <div class='step'>4. Sta-op Hulp</div>
          <div class='lbl'>Met automatische draaiblokkering</div>
        </div>
      </div>
      <div class='bottom-row'>
        <div class='bcard'>
          <img src='{ravi_7_knoppen}'>
          <div>
            <h3>4-Knops Bediening + Lendensteun</h3>
            <p>Netjes in de armleuning verwerkt + oppompbare steun in de onderrug.</p>
          </div>
        </div>
        <div class='bcard-green'>
          <h3>✓ Slimme Veiligheid</h3>
          <ul>
            <li>• Blokkeert draaien bij opstaan</li>
            <li>• Geen losse afstandsbediening</li>
            <li>• Leverbaar in S, M en L</li>
          </ul>
        </div>
      </div>
    </body></html>""", WORK / "slide_ravi_alle_standen.png")

    # Slide C: Aanbiedingskaart Sta-op stoel Ravi (vernieuwd & haarscherp)
    render_html(f"""<html><head>{FONT}<style>{BASE}
      body{{background:#fbf9f5;font-family:'Outfit',sans-serif;color:#1d2024;display:flex;flex-direction:column}}
      .top{{padding:48px 50px 28px;text-align:center;border-bottom:8px solid #4b8f24;background:#fff}}
      .top img{{height:76px;mix-blend-mode:multiply}}
      .top .sub{{font-family:'Montserrat';font-weight:700;font-size:28px;color:#4a5568;margin-top:12px}}
      .hero{{position:relative;height:860px;background:url('{cognac_cozy}') center center / cover}}
      .badge-actie{{position:absolute;top:36px;left:36px;background:#f39223;color:#fff;padding:20px 36px;
                    border-radius:22px;font-family:'Montserrat';box-shadow:0 12px 30px rgba(0,0,0,.3)}}
      .badge-actie .k{{font-size:26px;font-weight:800;text-transform:uppercase;letter-spacing:1px}}
      .badge-actie .v{{font-size:48px;font-weight:900;line-height:1.05}}
      .price-card{{position:absolute;right:36px;bottom:-50px;background:#2f5f15;color:#fff;padding:28px 42px;
                   border-radius:28px;text-align:center;box-shadow:0 16px 40px rgba(0,0,0,.35);border:5px solid #fff}}
      .price-card .van{{font-size:32px;color:#d5e5cf;text-decoration:line-through;font-weight:600}}
      .price-card .voor{{font-family:'Montserrat';font-size:74px;font-weight:900;line-height:1.05;color:#fff}}
      .price-card .lbl{{font-size:26px;color:#f39223;font-weight:700;margin-top:4px}}
      .info{{flex:1;padding:74px 56px 36px;display:flex;flex-direction:column;justify-content:space-between}}
      h1{{font-family:'Montserrat';font-weight:900;font-size:58px;color:#2f5f15;line-height:1.1}}
      .tagline{{font-size:35px;color:#4a5568;font-weight:600;margin-top:10px}}
      ul{{list-style:none;margin-top:24px;display:flex;flex-direction:column;gap:16px}}
      li{{font-size:34px;font-weight:500;padding-left:46px;position:relative;line-height:1.25}}
      li::before{{content:'✓';position:absolute;left:0;top:0;color:#f39223;font-weight:900;font-size:38px}}
      .foot{{background:#eef7eb;border-left:10px solid #4b8f24;padding:22px 32px;border-radius:16px;
             font-size:31px;font-weight:600;color:#2f5f15}}
    </style></head><body>
      <div class='top'>
        <img src='{logo_uri}'>
        <div class='sub'>Tijdelijke Showroom-aanbieding &nbsp;•&nbsp; Dordrecht</div>
      </div>
      <div class='hero'>
        <div class='badge-actie'>
          <div class='k'>Tijdelijk voordeel</div>
          <div class='v'>€ 350,- korting</div>
        </div>
        <div class='price-card'>
          <div class='van'>Van € 2.295,-</div>
          <div class='voor'>€ 1.945,-</div>
          <div class='lbl'>S / M / L • Op maat</div>
        </div>
      </div>
      <div class='info'>
        <div>
          <h1>DFM Sta-op stoel Ravi</h1>
          <div class='tagline'>Zo stijlvol dat niemand ziet dat het een sta-op stoel is.</div>
          <ul>
            <li><b>Onzichtbare sta-op hulp</b> met automatische draaiblokkering</li>
            <li><b>2 motoren</b>: voetensteun &amp; rug los te bedienen</li>
            <li><b>4-knops bediening</b> + oppompbare lendensteun</li>
            <li>In <b>Small, Medium &amp; Large</b> in stof, leer of duo-stoffering</li>
          </ul>
        </div>
        <div class='foot'>Gratis bezorgd in de Drechtsteden • Bezorging door heel NL</div>
      </div>
    </body></html>""", WORK / "slide_ravi_aanbieding.png")

    # Slide D: Eindkaart
    render_html(f"""<html><head>{FONT}<style>{BASE}
      body{{background:linear-gradient(180deg,#fbf9f5,#eef7eb);font-family:Outfit;color:#1d2024;
           display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:40px;padding:40px}}
      .logo{{width:820px;mix-blend-mode:multiply}}
      .card{{background:#fff;border-radius:32px;padding:32px 42px;display:flex;align-items:center;gap:34px;
             box-shadow:0 16px 40px rgba(0,0,0,.10);border:3px solid #b8dcad;width:940px;text-align:left}}
      .card img{{width:250px;height:250px;object-fit:cover;border-radius:20px}}
      .card .t h3{{font-family:Montserrat;font-size:46px;font-weight:900;color:#2f5f15}}
      .card .t .van{{font-size:32px;color:#718096;text-decoration:line-through;margin-top:6px}}
      .card .t .nu{{font-family:Montserrat;font-size:64px;font-weight:900;color:#f39223;line-height:1.05}}
      .card .t .s{{font-size:28px;color:#4a5568;margin-top:6px}}
      h2{{font-family:Montserrat;font-weight:900;font-size:60px;color:#2f5f15;line-height:1.12}}
      .adr{{font-size:40px;line-height:1.45}} .adr .dot{{color:#f39223;font-weight:900;padding:0 14px}}
      .bel{{background:#f39223;color:#fff;border-radius:90px;padding:30px 68px;font-family:Montserrat}}
      .bel .t{{font-size:34px;font-weight:600}} .bel .n{{font-size:82px;font-weight:900}}
      .wa{{font-size:35px;color:#4a5568;font-weight:600}}
    </style></head><body>
      <img class='logo' src='{logo_uri}'>
      <h2>De Ravi zelf uitproberen?<br>De koffie staat klaar!</h2>
      <div class='card'>
        <img src='{cognac_cozy}'>
        <div class='t'>
          <h3>DFM Sta-op stoel Ravi</h3>
          <div class='van'>Adviesprijs € 2.295,-</div>
          <div class='nu'>Nu € 1.945,-</div>
          <div class='s'>S / M / L • Stof, leer &amp; duo • 2 motoren</div>
        </div>
      </div>
      <div class='adr'>Merwedestraat 239, Dordrecht<br>Di t/m vr 10–16 uur<span class='dot'>•</span>Ma &amp; za op afspraak</div>
      <div class='bel'><div class='t'>Bel voor advies of proefzitten</div><div class='n'>078 - 631 4858</div></div>
      <div class='wa'>WhatsApp Geertjan: 06 - 22 23 29 64</div>
    </body></html>""", WORK / "slide_ravi_eindkaart.png")

def caption_png(text, out):
    render_html(f"""<html><head>{FONT}<style>{BASE}
      body{{background:transparent;display:flex;align-items:flex-end;justify-content:center;padding-bottom:260px}}
      div{{font-family:Montserrat;font-weight:900;font-size:58px;color:#fff;text-align:center;line-height:1.18;
           background:rgba(29,32,36,.72);padding:26px 44px;border-radius:24px;max-width:980px;
           box-shadow:0 14px 34px rgba(0,0,0,.35)}}
    </style></head><body><div>{text}</div></body></html>""", out, transparent=True)

build_showcase_slides()

SCENES = [
    dict(id=1, img=WS/"assets/chair_ravi_cozy.png", min=6.0, zoom=True,
         caption="De Design Sta-op stoel Ravi: nu € 350,- korting!",
         text="Zoek je het gemak van een sta-op stoel, maar dan in het jasje van een slanke, moderne design-fauteuil? Maak kennis met onze tijdelijke aanbieding: de Sta-op stoel Ravi."),
    dict(id=2, img=img_olijfgroen, min=6.0, zoom=True,
         caption="Stof, leer of duo-stoffering • Small, Medium & Large",
         text="Stel de Ravi helemaal samen in jouw eigen smaak. Kies voor één kleur leer of stof, of ga voor deze prachtige duo-stof-feering met zacht kwaliteitsleer aan de binnenkant en een rijke weefstof aan de buitenschaal."),
    dict(id=3, img=WORK/"slide_ravi_kleuren_grid.png", min=6.0, zoom=False,
         caption="",
         text="Van warm cognac en zand-taupe met crème bouclé, tot stijlvol olijfgroen: elke Ravi is leverbaar in Small, Medium en Large, volledig afgestemd op jouw woonkamer én postuur."),
    dict(id=4, img=img_zand_boucle, min=5.5, zoom=True,
         caption="Onzichtbare sta-op hulp • Veilige 360° draaivoet",
         text="Het mooiste? Aan de buitenkant ziet helemaal niemand dat er onder deze elegante draaifauteuil een volwaardige sta-op hulp verborgen zit."),
    dict(id=5, img=WORK/"slide_ravi_alle_standen.png", min=6.5, zoom=False,
         caption="",
         text="Met twee fluisterstille motoren bedien je de voetensteun en rugleuning los van elkaar via de vier-knops bediening in de armleuning. Inclusief oppompbare lendensteun voor je onderrug, én automatische draaiblokkering zodra je opstaat."),
    dict(id=6, img=WORK/"slide_ravi_aanbieding.png", min=6.0, zoom=False,
         caption="",
         text="De Sta-op stoel Ravi. Nu tijdelijk met drie-honderd-vijftig euro korting... Van twee-duizend twee-honderd vijf-en-negentig euro, nu voor negentien-honderd vijf-en-veertig euro."),
    dict(id=7, img=D_OPA/"scene3_geertjan_welkom.jpg", min=4.2, zoom=True,
         caption="Alle kleuren & maten (S, M en L) proefzitten in Dordrecht.",
         text="Bij Geertjan in Dordrecht staat de koffie al klaar om alle kleuren, stoffen en maten rustig uit te proberen."),
    dict(id=8, img=WORK/"slide_ravi_eindkaart.png", min=5.5, zoom=False,
         caption="",
         text="Kom vrijblijvend langs aan de Merwedestraat tweehonderd negenendertig in Dordrecht. Of bel nul zeven acht, zes drie één, achtenveertig, achtenvijftig."),
]

# Reuse verified address voiceover for Scene 8
reuse_map = {
    8: D_MAN / "audio/vo_6.mp3",
}

XF = 0.6
parts = []
vo_files = []

for s in SCENES:
    sid = s["id"]
    vo_raw = A / f"vo_raw_{sid}.mp3"
    if sid in reuse_map and reuse_map[sid].exists():
        shutil.copy2(reuse_map[sid], vo_raw)
    else:
        tts(s["text"], vo_raw, speed=0.95)
    vo_wav = A / f"vo_{sid}.wav"
    run([FFMPEG, "-y", "-i", str(vo_raw), "-af", "loudnorm=I=-14:TP=-1.0:LRA=7,aresample=48000,pan=stereo|c0=c0|c1=c1", "-c:a", "pcm_s16le", str(vo_wav)])
    s["vo_dur"] = duration(vo_wav)
    vo_files.append(vo_wav)

    s["dur"] = max(s["min"], s["vo_dur"] + 1.40)
    n = int(s["dur"] * FPS)
    zoom = s.get("zoom", True)
    vf = (f"scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840,zoompan=z='1+0.09*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={W}x{H}:fps={FPS}"
          if zoom else f"scale={W}:{H},zoompan=z='1+0.03*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={W}x{H}:fps={FPS}")
    part_out = P / f"part_{sid}.mp4"
    cmd = [FFMPEG, "-y", "-loop", "1", "-i", str(s["img"])]
    if s["caption"]:
        cap = P / f"cap_{sid}.png"
        caption_png(s["caption"], cap)
        cmd += ["-loop", "1", "-i", str(cap), "-filter_complex",
                f"[0:v]{vf}[b];[1:v]format=rgba,fade=t=in:st=0.35:d=0.45:alpha=1[c];[b][c]overlay=0:0:shortest=1,format=yuv420p[v]",
                "-map", "[v]"]
    else:
        cmd += ["-vf", vf + ",format=yuv420p"]
    cmd += ["-t", f"{s['dur']:.2f}", "-r", str(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "19", str(part_out)]
    run(cmd)
    parts.append(part_out)

durs = [duration(p) for p in parts]
for s, d in zip(SCENES, durs):
    s["dur"] = d

inputs = sum([["-i", str(p)] for p in parts], [])
chain, last, offset = [], "[0:v]", 0.0
for i in range(1, len(parts)):
    offset += durs[i - 1] - XF
    lbl = f"[x{i}]"
    chain.append(f"{last}[{i}:v]xfade=transition=fade:duration={XF}:offset={offset:.2f}{lbl}")
    last = lbl
total = sum(durs) - XF * (len(parts) - 1)
chain.append(f"{last}fade=t=out:st={total-0.8:.2f}:d=0.8,format=yuv420p[v]")
video = P / "video_only.mp4"
run([FFMPEG, "-y", *inputs, "-filter_complex", ";".join(chain), "-map", "[v]", "-c:v", "libx264", "-crf", "19", str(video)])

# Build sequential non-overlapping voice track
sr = 48000
nch = 2
total_frames = int(math.ceil(total * sr))
voice_buf = [0] * (total_frames * nch)

starts = []
scene_start = 0.0
prev_end = 0.0
for idx, s in enumerate(SCENES):
    desired_start = scene_start + 0.35
    actual_start = max(desired_start, prev_end + 0.45)
    starts.append(actual_start)
    with wave.open(str(vo_files[idx]), "rb") as wv:
        raw = wv.readframes(wv.getnframes())
        samples = struct.unpack(f"<{len(raw)//2}h", raw)
        start_idx = int(actual_start * sr) * nch
        for j, val in enumerate(samples):
            pos = start_idx + j
            if pos < len(voice_buf):
                voice_buf[pos] = val
    prev_end = actual_start + s["vo_dur"]
    scene_start += s["dur"] - XF
    print(f"Scene {s['id']}: dur={s['dur']:.2f}s, vo={actual_start:.2f}s..{prev_end:.2f}s")

voice_wav = A / "voice_sequential.wav"
with wave.open(str(voice_wav), "wb") as wout:
    wout.setnchannels(nch)
    wout.setsampwidth(2)
    wout.setframerate(sr)
    wout.writeframes(struct.pack(f"<{len(voice_buf)}h", *voice_buf))

# Warm, uplifting background music (looped heartwarming track)
music_wav = A / "music.wav"
run([FFMPEG, "-y", "-stream_loop", "-1", "-i", str(D_OPA / "audio/heartwarming.mp3"),
     "-filter_complex",
     f"[0:a]loudnorm=I=-19:TP=-1.5,atrim=0:{total:.2f},afade=t=in:d=1.5:curve=qsin,afade=t=out:st={total-2.5:.2f}:d=2.5:curve=qsin,aresample=48000,pan=stereo|c0=c0|c1=c1[m]",
     "-map", "[m]", "-c:a", "pcm_s16le", str(music_wav)])

out_yt = OUT_DIR / "15_SHORT_Stoel_Ravi_Showcase_Alle_Kleuren_En_Standen.mp4"
out_ws = WS / "assets/video/staopstoelen_ravi_showcase_alle_kleuren_standen.mp4"

run([FFMPEG, "-y", "-i", str(video), "-i", str(voice_wav), "-i", str(music_wav),
     "-filter_complex",
     "[1:a]volume=1.22[vm];[2:a]volume=0.38[mu];[mu][vm]amix=inputs=2:normalize=0,alimiter=limit=0.96[a]",
     "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-ar", "48000", "-b:a", "192k", "-shortest",
     "-movflags", "+faststart", str(out_yt)])

shutil.copy2(out_yt, out_ws)
print(f"Klaar: {out_yt} ({total:.1f} s)")
