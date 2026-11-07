#!/usr/bin/env python3
"""
scripts/build_video_rene_showcase.py
Luxe 9:16 Showcase & Aanbiedingsvideo (1080x1920) voor de Design Sta-op stoel René:
Laat de René schitteren in ALLE kleuren/stofferingen (Olijfgroen leer, Cognac & Crème Bouclé duo,
Zand-Taupe duo, Antraciet duo, Roomwit leer), met ZOWEL de 5-teens stervoet ALS de elegante
Ronde Schotelvoet (geborsteld RVS of matzwart), én in ALLE standen (zitstand met verstelbare hoofdsteun,
Herzwaage-ligstand en krachtige sta-op stand op ingebouwde accu).
Aanbieding: € 350,- korting (van € 2.695,- voor € 2.345,- compleet met accu).
"""
import json, math, os, shutil, ssl, struct, subprocess, urllib.request, wave
from pathlib import Path

WS = Path("/Users/matthiasradder/AntiGravity Projecten/Staopstoelen.nl")
FFMPEG = "/Users/matthiasradder/.local/bin/ffmpeg"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
VOICE_ID = "g5MYumTmZlFU9tYSmTp9"  # Alexander

CUR_BRAIN = Path("/Users/matthiasradder/.gemini/antigravity/brain/5a71c862-1402-4ffc-8876-2c899186c109")
D_OPA = WS / "assets/marketing/video_opa"
D_MAN = WS / "assets/marketing/video_rene_man"
S_DIR = WS / "assets/stoelen"
WORK = WS / "assets/marketing/video_rene_showcase"
A = WORK / "audio"
P = WORK / "parts"
OUT_DIR = Path.home() / "Downloads/Staopstoelen_YouTube_Videos"

for p in (WORK, A, P, OUT_DIR, WS / "assets/video"):
    p.mkdir(parents=True, exist_ok=True)

# Copy the newly generated round-base showcase images into assets/stoelen/
img_cognac_rvs = S_DIR / "rene_showcase_cognac_ronde_rvs_voet.jpg"
img_groen_zwart_rond = S_DIR / "rene_showcase_duo_ronde_zwarte_voet.jpg"
shutil.copy2(CUR_BRAIN / "rene_showcase_cognac_ronde_rvs_voet_jpg_1794047222309.jpg", img_cognac_rvs)
shutil.copy2(CUR_BRAIN / "rene_showcase_duo_ronde_zwarte_voet_jpg_1794047252769.jpg", img_groen_zwart_rond)

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

def trim_white(src_path, dst_path, pad=18):
    from PIL import Image, ImageChops
    im = Image.open(src_path).convert("RGB")
    bg = Image.new("RGB", im.size, (255, 255, 255))
    diff = ImageChops.difference(im, bg).convert("L")
    diff = diff.point(lambda x: 255 if x > 12 else 0)
    bbox = diff.getbbox()
    if bbox:
        x0 = max(0, bbox[0] - pad)
        y0 = max(0, bbox[1] - pad)
        x1 = min(im.width, bbox[2] + pad)
        y1 = min(im.height, bbox[3] + pad)
        im = im.crop((x0, y0, x1, y1))
    im.save(dst_path, quality=95)
    return dst_path

def build_showcase_slides():
    logo_uri = (WS / "assets/marketing/logo_letters_bijgesneden.png").as_uri()
    groen_cozy = (S_DIR / "chair_rene_groen_cozy.jpg").as_uri()
    taupe_cozy = (S_DIR / "chair_rene_cozy.jpg").as_uri()
    cognac_rond = img_cognac_rvs.as_uri()
    groen_zwart_rond = img_groen_zwart_rond.as_uri()
    antraciet_duo = trim_white(S_DIR / "rene_dfm_duo_stof_leer.jpg", WORK / "_trim_antraciet.jpg").as_uri()
    boucle_studio = trim_white(S_DIR / "rene_dfm_boucle_studio.jpg", WORK / "_trim_boucle.jpg").as_uri()
    leder_wit = trim_white(S_DIR / "rene_dfm_leder_vooraanzicht.jpg", WORK / "_trim_wit.jpg").as_uri()
    onderstellen = trim_white(S_DIR / "rene_dfm_onderstellen.jpg", WORK / "_trim_onderstellen.jpg", pad=10).as_uri()
    standen_3 = trim_white(S_DIR / "rene_dfm_3_standen_m3.jpg", WORK / "_trim_standen3.jpg", pad=12).as_uri()
    hoofdsteun = trim_white(S_DIR / "rene_dfm_hoofdsteun_detail.jpg", WORK / "_trim_hoofdsteun.jpg", pad=10).as_uri()
    achterkant_accu = trim_white(S_DIR / "rene_dfm_achterkant_accu.jpg", WORK / "_trim_accu.jpg", pad=12).as_uri()
    taupe_relax = trim_white(S_DIR / "Sta-op-stoel-RENE-4.jpeg", WORK / "_trim_relax.jpg", pad=12).as_uri()

    # Slide A: Alle Kleuren, Leer, Bouclé & Duo-Stoffering Bento Grid
    render_html(f"""<html><head>{FONT}<style>{BASE}
      body{{background:#fbf9f5;font-family:'Outfit',sans-serif;color:#1d2024;display:flex;flex-direction:column;padding:42px}}
      .hdr{{text-align:center;margin-bottom:28px}}
      .hdr .pill{{display:inline-block;background:#eef7eb;color:#2f5f15;font-family:'Montserrat';font-weight:800;
                  font-size:24px;padding:10px 28px;border-radius:40px;letter-spacing:1px;text-transform:uppercase}}
      .hdr h1{{font-family:'Montserrat';font-weight:900;font-size:54px;color:#1d2024;line-height:1.12;margin-top:14px}}
      .hdr p{{font-size:32px;color:#4a5568;font-weight:500;margin-top:8px}}
      .grid{{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:510px 510px 490px;gap:24px;flex:1}}
      .card{{background:#fff;border-radius:28px;overflow:hidden;position:relative;box-shadow:0 12px 30px rgba(0,0,0,.08);border:2px solid #ece7df}}
      .card img{{width:100%;height:100%;object-fit:cover}}
      .card.contain img{{object-fit:contain;padding:24px 24px 86px 24px;background:#fff}}
      .lbl{{position:absolute;left:18px;bottom:18px;right:18px;background:rgba(29,32,36,.88);color:#fff;
            padding:14px 20px;border-radius:18px;font-family:'Montserrat';font-weight:700;font-size:25px;
            display:flex;align-items:center;justify-content:space-between}}
      .lbl span.dot{{width:22px;height:22px;border-radius:50%;display:inline-block;border:2px solid #fff;flex-shrink:0}}
    </style></head><body>
      <div class='hdr'>
        <div class='pill'>Stof • Kwaliteitsleer • Duo-Stoffering</div>
        <h1>In élke kleur &amp; combinatie</h1>
        <p>Stel de René samen voor jouw woonkamer</p>
      </div>
      <div class='grid'>
        <div class='card'>
          <img src='{cognac_rond}'>
          <div class='lbl'><span>Duo Cognac &amp; Crème Bouclé</span><span class='dot' style='background:#7c421c'></span></div>
        </div>
        <div class='card'>
          <img src='{groen_cozy}'>
          <div class='lbl'><span>Olijfgroen Kwaliteitsleer</span><span class='dot' style='background:#5d6643'></span></div>
        </div>
        <div class='card'>
          <img src='{taupe_cozy}'>
          <div class='lbl'><span>Duo Zand-Taupe &amp; Leer</span><span class='dot' style='background:#b7a99a'></span></div>
        </div>
        <div class='card contain'>
          <img src='{antraciet_duo}'>
          <div class='lbl'><span>Duo Lichtgrijs &amp; Antraciet</span><span class='dot' style='background:#4a4d52'></span></div>
        </div>
        <div class='card contain'>
          <img src='{boucle_studio}'>
          <div class='lbl'><span>Zacht Crème Bouclé</span><span class='dot' style='background:#e9e4da'></span></div>
        </div>
        <div class='card contain'>
          <img src='{leder_wit}'>
          <div class='lbl'><span>Roomwit Leder</span><span class='dot' style='background:#f0ede6'></span></div>
        </div>
      </div>
    </body></html>""", WORK / "slide_kleuren_grid.png")

    # Slide B: Ronde Schotelvoet (RVS & Zwart) + Stervoet Showcase
    render_html(f"""<html><head>{FONT}<style>{BASE}
      body{{background:#fbf9f5;font-family:'Outfit',sans-serif;color:#1d2024;display:flex;flex-direction:column;padding:42px}}
      .hdr{{text-align:center;margin-bottom:24px}}
      .hdr .pill{{display:inline-block;background:#f39223;color:#fff;font-family:'Montserrat';font-weight:800;
                  font-size:24px;padding:10px 28px;border-radius:40px;letter-spacing:1px;text-transform:uppercase}}
      .hdr h1{{font-family:'Montserrat';font-weight:900;font-size:52px;color:#1d2024;line-height:1.12;margin-top:14px}}
      .top-photos{{display:grid;grid-template-columns:1fr 1fr;gap:24px;height:1020px}}
      .pbox{{border-radius:28px;overflow:hidden;position:relative;box-shadow:0 14px 34px rgba(0,0,0,.12);border:3px solid #fff}}
      .pbox img{{width:100%;height:100%;object-fit:cover;object-position:center bottom}}
      .pbox .tag{{position:absolute;bottom:20px;left:20px;right:20px;background:rgba(29,32,36,.88);color:#fff;
                  padding:18px 22px;border-radius:20px;font-family:'Montserrat'}}
      .pbox .tag .t1{{font-size:28px;font-weight:800;color:#f39223}}
      .pbox .tag .t2{{font-size:24px;font-weight:600;margin-top:4px}}
      .bases-card{{margin-top:26px;background:#fff;border-radius:28px;padding:28px 32px;flex:1;
                   display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 12px 30px rgba(0,0,0,.07);border:2px solid #e5dfd5}}
      .bases-card h2{{font-family:'Montserrat';font-size:34px;font-weight:800;color:#2f5f15;text-align:center}}
      .bases-card img{{width:100%;height:260px;object-fit:contain}}
      .bases-foot{{background:#eef7eb;padding:18px 26px;border-radius:18px;font-size:28px;font-weight:700;
                   color:#2f5f15;text-align:center}}
    </style></head><body>
      <div class='hdr'>
        <div class='pill'>Kies jouw favoriete draai-onderstel</div>
        <h1>Stervoet óf Ronde Schotelvoet</h1>
      </div>
      <div class='top-photos'>
        <div class='pbox'>
          <img src='{cognac_rond}'>
          <div class='tag'>
            <div class='t1'>Ronde Voet RVS</div>
            <div class='t2'>Geborsteld staal • In de prijs!</div>
          </div>
        </div>
        <div class='pbox'>
          <img src='{groen_zwart_rond}'>
          <div class='tag'>
            <div class='t1'>Ronde Voet Zwart</div>
            <div class='t2'>Matzwart staal • 360° draaibaar</div>
          </div>
        </div>
      </div>
      <div class='bases-card'>
        <h2>6 Onderstellen: Ronde Schotelvoet of 5-teens Stervoet</h2>
        <img src='{onderstellen}'>
        <div class='bases-foot'>✓ Automatische draaiblokkering zodra de sta-op stand actief wordt</div>
      </div>
    </body></html>""", WORK / "slide_ronde_voet_en_onderstellen.png")

    # Slide C: Alle Standen (Actief Zitten, Herzwaage-ligstand, Sta-op hulp & Draadloze Accu)
    render_html(f"""<html><head>{FONT}<style>{BASE}
      body{{background:#fbf9f5;font-family:'Outfit',sans-serif;color:#1d2024;display:flex;flex-direction:column;padding:42px}}
      .hdr{{text-align:center;margin-bottom:22px}}
      .hdr .pill{{display:inline-block;background:#2f5f15;color:#fff;font-family:'Montserrat';font-weight:800;
                  font-size:24px;padding:10px 28px;border-radius:40px;letter-spacing:1px;text-transform:uppercase}}
      .hdr h1{{font-family:'Montserrat';font-weight:900;font-size:52px;color:#1d2024;line-height:1.12;margin-top:12px}}
      .main-standen{{background:#fff;border-radius:28px;padding:28px 32px;box-shadow:0 12px 30px rgba(0,0,0,.08);border:2px solid #e5dfd5}}
      .main-standen img{{width:100%;height:500px;object-fit:contain}}
      .labels-3{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;margin-top:18px;text-align:center}}
      .labels-3 div{{background:#eef7eb;border-radius:16px;padding:16px 12px;font-family:'Montserrat';font-weight:800;font-size:26px;color:#2f5f15}}
      .details{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:24px;flex:1}}
      .dcard{{background:#fff;border-radius:24px;overflow:hidden;display:flex;flex-direction:column;
              box-shadow:0 10px 26px rgba(0,0,0,.07);border:2px solid #e5dfd5}}
      .dcard .imgwrap{{flex:1;display:flex;align-items:center;justify-content:center;padding:24px;background:#fff;overflow:hidden}}
      .dcard .imgwrap img{{width:100%;height:100%;object-fit:contain}}
      .dcard .txt{{height:220px;padding:22px 18px;background:#1d2024;color:#fff;display:flex;flex-direction:column;justify-content:center;text-align:center}}
      .dcard .txt h3{{font-family:'Montserrat';font-size:28px;font-weight:800;color:#f39223;line-height:1.15}}
      .dcard .txt p{{font-size:24px;margin-top:8px;line-height:1.25;color:#e2e8f0}}
    </style></head><body>
      <div class='hdr'>
        <div class='pill'>3 Fluisterstille Motoren • Standaard op Accu</div>
        <h1>Elke denkbare stand met 1 druk op de knop</h1>
      </div>
      <div class='main-standen'>
        <img src='{standen_3}'>
        <div class='labels-3'>
          <div>1. Actief Zitten</div>
          <div>2. Herzwaage Ligstand</div>
          <div>3. Veilige Sta-op Hulp</div>
        </div>
      </div>
      <div class='details'>
        <div class='dcard'>
          <div class='imgwrap'><img src='{hoofdsteun}'></div>
          <div class='txt'>
            <h3>Topswing Hoofdsteun</h3>
            <p>Verstelbaar in hoogte én kantelhoek voor nek &amp; tv</p>
          </div>
        </div>
        <div class='dcard'>
          <div class='imgwrap'><img src='{taupe_relax}'></div>
          <div class='txt'>
            <h3>Onafhankelijk Verstelbaar</h3>
            <p>Rugleuning en voetensteun los te bedienen</p>
          </div>
        </div>
        <div class='dcard'>
          <div class='imgwrap'><img src='{achterkant_accu}'></div>
          <div class='txt'>
            <h3>100% Snoerloos op Accu</h3>
            <p>Geen losse snoeren over de vloer in huis</p>
          </div>
        </div>
      </div>
    </body></html>""", WORK / "slide_alle_standen.png")

def caption_png(text, out):
    render_html(f"""<html><head>{FONT}<style>{BASE}
      body{{background:transparent;display:flex;align-items:flex-end;justify-content:center;padding-bottom:260px}}
      div{{font-family:Montserrat;font-weight:900;font-size:58px;color:#fff;text-align:center;line-height:1.18;
           background:rgba(29,32,36,.72);padding:26px 44px;border-radius:24px;max-width:980px;
           box-shadow:0 14px 34px rgba(0,0,0,.35)}}
    </style></head><body><div>{text}</div></body></html>""", out, transparent=True)

build_showcase_slides()

SCENES = [
    dict(id=1, img=S_DIR/"chair_rene_groen_cozy.jpg", min=6.0, zoom=True,
         caption="De Design Sta-op stoel René: nu € 350,- korting!",
         text="Zoek je het gemak van een sta-op stoel, maar dan in het jasje van een prachtige, moderne design-fauteuil? Maak kennis met onze tijdelijke aanbieding: de Sta-op stoel René."),
    dict(id=2, img=img_cognac_rvs, min=6.0, zoom=True,
         caption="Stof, leer of duo-stoffering • Ook op ronde voet!",
         text="Stel de René helemaal samen in jouw eigen stijl. Kies voor zachte bouclé-stof, soepel kwaliteitsleer, of een mooie duo-stof-feering met twee kleuren en materialen."),
    dict(id=3, img=WORK/"slide_kleuren_grid.png", min=6.0, zoom=False,
         caption="",
         text="Van warm cognac met crème bouclé, tot stoer olijfgroen, zand-taupe, antraciet of roomwit leer: elke René wordt op maat gemaakt voor jouw interieur."),
    dict(id=4, img=img_groen_zwart_rond, min=5.5, zoom=True,
         caption="NIEUW: Ronde schotelvoet in zwart óf geborsteld RVS!",
         text="Ook het draai-onderstel kies je zelf. Naast de luchtige stervoet kun je kiezen voor deze strakke ronde schotelvoet in matzwart of geborsteld RVS."),
    dict(id=5, img=WORK/"slide_ronde_voet_en_onderstellen.png", min=5.5, zoom=False,
         caption="",
         text="De ronde RVS schotelvoet is zelfs standaard bij de prijs inbegrepen! Volledig draaibaar, én met automatische draaiblokkering zodra je opstaat."),
    dict(id=6, img=WORK/"slide_alle_standen.png", min=6.5, zoom=False,
         caption="",
         text="Met drie fluisterstille motoren en een ingebouwde accu staat de René helemaal vrij in de kamer, zonder snoeren over de vloer. Van actieve zitstand met verstelbare hoofdsteun, naar de gewichtloze hartbalans-ligstand, tot een veilige sta-op hulp."),
    dict(id=7, img=D_MAN/"slide_rene_man_aanbieding.png", min=6.0, zoom=False,
         caption="",
         text="De Sta-op stoel René. Nu tijdelijk met drie-honderd-vijftig euro korting... Van twee-duizend zes-honderd vijf-en-negentig euro, nu voor twee-duizend drie-honderd vijf-en-veertig euro."),
    dict(id=8, img=D_OPA/"scene3_geertjan_welkom.jpg", min=4.2, zoom=True,
         caption="Alle kleuren & maten (XS t/m XL) proefzitten in Dordrecht.",
         text="Bij Geertjan in Dordrecht staat de koffie al klaar om alle kleuren, stoffen en maten rustig uit te proberen."),
    dict(id=9, img=D_MAN/"slide_rene_man_eindkaart.png", min=5.5, zoom=False,
         caption="",
         text="Kom vrijblijvend langs aan de Merwedestraat tweehonderd negenendertig in Dordrecht. Of bel nul zeven acht, zes drie één, achtenveertig, achtenvijftig."),
]

# Reuse verified slow whole-euro vo_3 for Scene 7 and address vo_6 for Scene 9
reuse_map = {
    7: CUR_BRAIN / "scratch/vo_3_kez_clean.mp3",
    9: D_MAN / "audio/vo_6.mp3",
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

out_yt = OUT_DIR / "14_SHORT_Stoel_Rene_Showcase_Alle_Kleuren_Standen_En_Ronde_Voet.mp4"
out_ws = WS / "assets/video/staopstoelen_rene_showcase_alle_kleuren_standen.mp4"

run([FFMPEG, "-y", "-i", str(video), "-i", str(voice_wav), "-i", str(music_wav),
     "-filter_complex",
     "[1:a]volume=1.22[vm];[2:a]volume=0.38[mu];[mu][vm]amix=inputs=2:normalize=0,alimiter=limit=0.96[a]",
     "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-ar", "48000", "-b:a", "192k", "-shortest",
     "-movflags", "+faststart", str(out_yt)])

shutil.copy2(out_yt, out_ws)
print(f"Klaar: {out_yt} ({total:.1f} s)")
