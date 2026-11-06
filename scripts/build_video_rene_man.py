#!/usr/bin/env python3
"""
scripts/build_video_rene_man.py
Staand (1080x1920) emotioneel social-media filmpje (tearjerker) voor een MAN met de stoere Sta-op stoel René:
"Ik zet toch geen ziekenhuisstoel in mijn kamer..." -> Ontdekking van de stoere olijfgroene design-stoel René op accu,
met verstelbare hoofdsteun, Herzwaage-ligstand en onzichtbare sta-op hulp.
Aanbieding: Van € 2.695,- voor € 2.345,- (€ 350,- korting).

Output:
  - assets/video/staopstoelen_rene_man_aanbieding_staand.mp4
  - assets/video/staopstoelen_rene_man_aanbieding_web.mp4
"""
import json, os, shutil, ssl, subprocess, urllib.request
from pathlib import Path

WS = Path('/Users/matthiasradder/AntiGravity Projecten/Staopstoelen.nl')
os.chdir(WS)
FFMPEG = '/Users/matthiasradder/.local/bin/ffmpeg'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
VOICE_ID = 'g5MYumTmZlFU9tYSmTp9'  # Alexander - warme Nederlandse verteller

D_OPA = WS / 'assets/marketing/video_opa'
D_RENE = WS / 'assets/marketing/video_rene'
D = WS / 'assets/marketing/video_rene_man'
A = D / 'audio'
P = D / 'parts'
for p in (D, A, P, WS / 'assets/video'):
    p.mkdir(parents=True, exist_ok=True)

W, H, FPS = 1080, 1920, 30
ctx = ssl._create_unverified_context()

def api_key():
    for line in open(WS / '.env'):
        if line.startswith('ELEVENLABS_API_KEY='):
            return line.split('=', 1)[1].strip().strip('"\'')
    return os.environ.get('ELEVENLABS_API_KEY', '')

def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def duration(path):
    r = subprocess.run([FFMPEG, '-i', str(path)], stderr=subprocess.PIPE, text=True)
    for l in r.stderr.splitlines():
        if 'Duration:' in l:
            h, m, s = l.split('Duration:')[1].split(',')[0].strip().split(':')
            return int(h) * 3600 + int(m) * 60 + float(s)

def tts(text, out):
    if out.exists():
        return
    payload = {
        'text': text,
        'model_id': 'eleven_multilingual_v2',
        'voice_settings': {'stability': 0.48, 'similarity_boost': 0.80, 'style': 0.18, 'use_speaker_boost': True}
    }
    req = urllib.request.Request(
        f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}',
        data=json.dumps(payload).encode(), method='POST',
        headers={'xi-api-key': api_key(), 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'}
    )
    out.write_bytes(urllib.request.urlopen(req, context=ctx, timeout=120).read())

def render_html(html, out, transparent=False):
    tmp = D / '_tmp_slide.html'
    tmp.write_text(html, encoding='utf-8')
    run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', f'--window-size={W},{H}',
         '--virtual-time-budget=6000', *(['--default-background-color=00000000'] if transparent else []),
         f'--screenshot={out}', tmp.as_uri()])
    tmp.unlink()

FONT = "<link href='https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&family=Outfit:wght@400;500;600;700&display=swap' rel='stylesheet'>"
BASE = "*{margin:0;padding:0;box-sizing:border-box} html,body{width:1080px;height:1920px;overflow:hidden}"

def build_slides():
    logo_uri = (WS / 'assets/marketing/logo_letters_bijgesneden.png').as_uri()
    rene_groen_cozy_uri = (WS / 'assets/stoelen/chair_rene_groen_cozy.jpg').as_uri()
    rene_groen_studio_uri = (WS / 'assets/stoelen/Sta-op-stoel-RENE.jpg').as_uri()

    # Slide 3: Aanbiedingskaart Sta-op stoel René (Groene uitvoering)
    render_html(f"""<html><head>{FONT}<style>{BASE}
      body{{background:#fbf9f5;font-family:'Outfit',sans-serif;color:#1d2024;display:flex;flex-direction:column}}
      .top{{padding:48px 50px 28px;text-align:center;border-bottom:8px solid #4b8f24;background:#fff}}
      .top img{{height:76px;mix-blend-mode:multiply}}
      .top .sub{{font-family:'Montserrat';font-weight:700;font-size:28px;color:#4a5568;margin-top:12px}}
      .hero{{position:relative;height:860px;background:url('{rene_groen_cozy_uri}') center center / cover}}
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
      h1{{font-family:'Montserrat';font-weight:900;font-size:60px;color:#2f5f15;line-height:1.1}}
      .tagline{{font-size:36px;color:#4a5568;font-weight:600;margin-top:10px}}
      ul{{list-style:none;margin-top:26px;display:flex;flex-direction:column;gap:18px}}
      li{{font-size:34px;font-weight:500;padding-left:46px;position:relative;line-height:1.25}}
      li::before{{content:'✓';position:absolute;left:0;top:0;color:#f39223;font-weight:900;font-size:38px}}
      .foot{{background:#eef7eb;border-left:10px solid #4b8f24;padding:24px 32px;border-radius:16px;
             font-size:32px;font-weight:600;color:#2f5f15}}
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
          <div class='van'>Van € 2.695,-</div>
          <div class='voor'>€ 2.345,-</div>
          <div class='lbl'>Compleet met accu</div>
        </div>
      </div>
      <div class='info'>
        <div>
          <h1>Design Sta-op stoel René</h1>
          <div class='tagline'>Stoere draaifauteuil met onzichtbare sta-op hulp.</div>
          <ul>
            <li><b>Standaard met accu</b>: 100% snoerloos vrij in de kamer</li>
            <li><b>Verstelbare hoofdsteun</b> in hoogte én hoek voor nek &amp; hoofd</li>
            <li><b>Herzwaage-ligstand &amp; sta-op hulp</b> met draaiblokkering</li>
            <li>Op maat in <b>stof, leer of duo-stoffering</b> (XS t/m XL)</li>
          </ul>
        </div>
        <div class='foot'>Gratis bezorgd &amp; op maat afgesteld in de Drechtsteden</div>
      </div>
    </body></html>""", D / 'slide_rene_man_aanbieding.png')

    # Slide 6: Eindkaart met groene René + aanbieding + contact
    render_html(f"""<html><head>{FONT}<style>{BASE}
      body{{background:linear-gradient(180deg,#fbf9f5,#eef7eb);font-family:Outfit;color:#1d2024;
           display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:42px;padding:40px}}
      .logo{{width:820px;mix-blend-mode:multiply}}
      .card{{background:#fff;border-radius:32px;padding:34px 44px;display:flex;align-items:center;gap:36px;
             box-shadow:0 16px 40px rgba(0,0,0,.10);border:3px solid #b8dcad;width:940px;text-align:left}}
      .card img{{width:260px;height:260px;object-fit:contain}}
      .card .t h3{{font-family:Montserrat;font-size:46px;font-weight:900;color:#2f5f15}}
      .card .t .van{{font-size:32px;color:#718096;text-decoration:line-through;margin-top:6px}}
      .card .t .nu{{font-family:Montserrat;font-size:64px;font-weight:900;color:#f39223;line-height:1.05}}
      .card .t .s{{font-size:28px;color:#4a5568;margin-top:6px}}
      h2{{font-family:Montserrat;font-weight:900;font-size:62px;color:#2f5f15;line-height:1.12}}
      .adr{{font-size:42px;line-height:1.45}} .adr .dot{{color:#f39223;font-weight:900;padding:0 14px}}
      .bel{{background:#f39223;color:#fff;border-radius:90px;padding:32px 68px;font-family:Montserrat}}
      .bel .t{{font-size:34px;font-weight:600}} .bel .n{{font-size:84px;font-weight:900}}
      .wa{{font-size:36px;color:#4a5568;font-weight:600}}
    </style></head><body>
      <img class='logo' src='{logo_uri}'>
      <h2>De René zelf uitproberen?<br>De koffie staat klaar!</h2>
      <div class='card'>
        <img src='{rene_groen_studio_uri}'>
        <div class='t'>
          <h3>Sta-op stoel René</h3>
          <div class='van'>Adviesprijs € 2.695,-</div>
          <div class='nu'>Nu € 2.345,-</div>
          <div class='s'>Stof, leer of duo • Met accu • 2M / 3M + Herzwaage</div>
        </div>
      </div>
      <div class='adr'>Merwedestraat 239, Dordrecht<br>Di t/m vr 10–16 uur<span class='dot'>•</span>Ma &amp; za op afspraak</div>
      <div class='bel'><div class='t'>Bel voor advies of proefzitten</div><div class='n'>078 - 631 4858</div></div>
      <div class='wa'>WhatsApp Geertjan: 06 - 22 23 29 64</div>
    </body></html>""", D / 'slide_rene_man_eindkaart.png')

def caption_png(text, out):
    render_html(f"""<html><head>{FONT}<style>{BASE}
      body{{background:transparent;display:flex;align-items:flex-end;justify-content:center;padding-bottom:280px}}
      div{{font-family:Montserrat;font-weight:900;font-size:68px;color:#fff;text-align:center;line-height:1.18;
           background:rgba(29,32,36,.62);padding:26px 44px;border-radius:24px;max-width:980px}}
    </style></head><body><div>{text}</div></body></html>""", out, transparent=True)

SCENES = [
    dict(id=1, img=D/'rene_man_scene1_schaamte.jpg', min=6.0,
         caption='“Ik zet toch geen ziekenhuisstoel in mijn kamer…”',
         text='Elke avond die pijn in zijn rug bij het opstaan. Maar zo’n lompe, mee-diese stoel in huis? Daar wilde pap absoluut niks van weten.'),
    dict(id=2, img=D/'rene_man_scene2_telefoon_ontdekking.jpg', min=5.0,
         caption='“Pap, kijk eens… dit is de René.”',
         text='Tot ik hem de stoere René liet zien op Staopstoelen punt nl. Een moderne draaifauteuil op accu, met verstelbare hoofdsteun, hartbalans-ligstand én onzichtbare sta-op hulp.'),
    dict(id=3, img=D/'slide_rene_man_aanbieding.png', min=5.0, caption='', zoom=False,
         text='De Sta-op stoel René. Nu tijdelijk met driehonderd vijftig euro korting: van tweeduizend zeshonderd vijfennegentig euro, nu voor tweeduizend driehonderd vijfenveertig euro.'),
    dict(id=4, img=D_OPA/'scene3_geertjan_welkom.jpg', min=3.8,
         caption='Rustig uitproberen met een kopje koffie.',
         text='Bij Geertjan in Dordrecht stond de koffie al voor ons klaar.'),
    dict(id=5, img=D/'rene_man_scene4_trots_in_rene.jpg', min=5.2,
         caption='Weer trots én zonder moeite opstaan.',
         text='Precies op zijn lengte en zithoogte afgesteld. Nu staat pap weer zonder moeite op, uit een stoere stoel waar hij écht trots op is.'),
    dict(id=6, img=D/'slide_rene_man_eindkaart.png', min=5.0, caption='', zoom=False,
         text='Kom de René vrijblijvend uitproberen aan de Merwedestraat tweehonderdnegenendertig in Dordrecht. Of bel nul zeven acht, zes drie één, achtenveertig achtenvijftig.'),
]

def build():
    build_slides()
    # Hergebruik voice-over 3, 4 en 6 van video_rene (identieke tekst)
    rene_a = D_RENE / 'audio'
    for reuse_id in (3, 4, 6):
        src = rene_a / f'vo_{reuse_id}.mp3'
        dst = A / f'vo_{reuse_id}.mp3'
        if src.exists() and not dst.exists():
            dst.write_bytes(src.read_bytes())

    parts = []
    for s in SCENES:
        vo = A / f"vo_{s['id']}.mp3"
        tts(s['text'], vo)
        s['dur'] = max(s['min'], duration(vo) + 0.9)
        n = int(s['dur'] * FPS)
        zoom = s.get('zoom', True)
        vf = (f"scale=2160:-2,crop=2160:3840,zoompan=z='1+0.10*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={W}x{H}:fps={FPS}"
              if zoom else f"scale={W}:{H},zoompan=z='1+0.035*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={W}x{H}:fps={FPS}")
        if s['id'] == 1:
            vf += ',eq=saturation=0.75:brightness=-0.03'
        out = P / f"part_{s['id']}.mp4"
        cmd = [FFMPEG, '-y', '-loop', '1', '-i', str(s['img'])]
        if s['caption']:
            cap = P / f"cap_{s['id']}.png"
            caption_png(s['caption'], cap)
            cmd += ['-loop', '1', '-i', str(cap), '-filter_complex',
                    f"[0:v]{vf}[b];[1:v]format=rgba,fade=t=in:st=0.5:d=0.6:alpha=1[c];[b][c]overlay=0:0:shortest=1,format=yuv420p[v]",
                    '-map', '[v]']
        else:
            cmd += ['-vf', vf + ',format=yuv420p']
        cmd += ['-t', f"{s['dur']:.2f}", '-r', str(FPS), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', str(out)]
        run(cmd)
        parts.append(out)

    XF = 0.6
    inputs = sum([['-i', str(p)] for p in parts], [])
    chain, last, offset = [], '[0:v]', 0.0
    for i in range(1, len(parts)):
        offset += SCENES[i - 1]['dur'] - XF
        lbl = f'[x{i}]'
        chain.append(f"{last}[{i}:v]xfade=transition=fade:duration={XF}:offset={offset:.2f}{lbl}")
        last = lbl
    total = sum(s['dur'] for s in SCENES) - XF * (len(parts) - 1)
    chain.append(f"{last}fade=t=out:st={total-0.8:.2f}:d=0.8,format=yuv420p[v]")
    video = P / 'video_only.mp4'
    run([FFMPEG, '-y', *inputs, '-filter_complex', ';'.join(chain), '-map', '[v]', '-c:v', 'libx264', '-crf', '19', str(video)])

    starts, t = [], 0.0
    for s in SCENES:
        starts.append(t + 0.35)
        t += s['dur'] - XF
    vin = sum([['-i', str(A / f"vo_{s['id']}.mp3")] for s in SCENES], [])
    vch = [f"[{i}:a]adelay={int(st*1000)}|{int(st*1000)}[v{i}]" for i, st in enumerate(starts)]
    vch.append(''.join(f'[v{i}]' for i in range(len(SCENES))) + f"amix=inputs={len(SCENES)}:normalize=0[vo]")
    voice = A / 'voice_track.wav'
    run([FFMPEG, '-y', *vin, '-filter_complex', ';'.join(vch), '-map', '[vo]', '-t', f'{total:.2f}', str(voice)])

    sad_len = SCENES[0]['dur'] + SCENES[1]['dur'] - XF
    music = A / 'music_track.wav'
    run([FFMPEG, '-y', '-ss', '14', '-t', f'{sad_len+2:.2f}', '-i', str(D_OPA/'audio/sad_trio.mp3'),
         '-t', f'{total:.2f}', '-i', str(D_OPA/'audio/heartwarming.mp3'), '-filter_complex',
         f"[0:a]loudnorm=I=-20:TP=-2,afade=t=in:d=1.5[s];[1:a]loudnorm=I=-20:TP=-2[h];"
         f"[s][h]acrossfade=d=2:c1=tri:c2=tri,atrim=0:{total:.2f},afade=t=out:st={total-2.5:.2f}:d=2.5[m]",
         '-map', '[m]', str(music)])

    out = WS / 'assets/video/staopstoelen_rene_man_aanbieding_staand.mp4'
    run([FFMPEG, '-y', '-i', str(video), '-i', str(voice), '-i', str(music), '-filter_complex',
         "[1:a]asplit=2[vk][vm];[2:a]volume=0.45[mu];[mu][vk]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[duck];"
         "[duck][vm]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5[a]",
         '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-ar', '48000', '-b:a', '192k', '-shortest',
         '-movflags', '+faststart', str(out)])

    web_out = WS / 'assets/video/staopstoelen_rene_man_aanbieding_web.mp4'
    shutil.copy2(out, web_out)
    print(f'Klaar: {out} ({total:.1f} s)')

if __name__ == '__main__':
    build()
