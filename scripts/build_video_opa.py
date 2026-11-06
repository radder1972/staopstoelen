#!/usr/bin/env python3
"""
scripts/build_video_opa.py
Staand (1080x1920) emotioneel social-media filmpje "Opa wil weer zelf opstaan".
Verloop: opa alleen (treurige muziek) -> kleinzoon + krant -> onze advertentie ->
Geertjan met koffie -> arm in arm de winkel in -> eindkaart.

Stem: ElevenLabs (Alexander, eleven_multilingual_v2)
Muziek: Kevin MacLeod (incompetech.com) "Sad Trio" + "Heartwarming"
        Licensed under Creative Commons: By Attribution 4.0 – vermelding verplicht in de post.
Output: assets/video/staopstoelen_opa_staand.mp4  (python3 scripts/build_video_opa.py)
        assets/video/staopstoelen_oma_staand.mp4  (python3 scripts/build_video_opa.py oma)
"""
import json, os, ssl, subprocess, sys, urllib.request
from pathlib import Path

WS = Path('/Users/matthiasradder/AntiGravity Projecten/Staopstoelen.nl')
os.chdir(WS)
FFMPEG = '/Users/matthiasradder/.local/bin/ffmpeg'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
VOICE_ID = 'g5MYumTmZlFU9tYSmTp9'  # Alexander - warme Nederlandse verteller
VARIANT = sys.argv[1] if len(sys.argv) > 1 else 'opa'
D = WS / 'assets/marketing/video_opa'          # gedeelde slides, muziek en Geertjan-scène
V = WS / f'assets/marketing/video_{VARIANT}'   # variant-specifieke beelden
A = D / 'audio'
P = V / 'parts'
VA = V / 'audio'                               # variant-specifieke voice-overs
VA.mkdir(parents=True, exist_ok=True)
for p in (A, P, WS / 'assets/video'):
    p.mkdir(parents=True, exist_ok=True)
W, H, FPS = 1080, 1920, 30
ctx = ssl._create_unverified_context()

def api_key():
    for line in open(WS / '.env'):
        if line.startswith('ELEVENLABS_API_KEY='):
            return line.split('=', 1)[1].strip().strip('"\'')
    return os.environ.get('ELEVENLABS_API_KEY', '')

END_TEXT = 'Merwedestraat tweehonderdnegenendertig, Dordrecht. Bel nul zeven acht, zes drie één, achtenveertig achtenvijftig.'
VARIANTS = {
    'opa': [
        dict(id=1, img=V/'scene1_opa_alleen.jpg', min=6.0, caption='Elke dag een beetje moeilijker…',
             text='Opstaan uit zijn stoel. Voor opa werd het elke dag een beetje moeilijker.'),
        dict(id=2, img=V/'scene2_kleinzoon_krant.jpg', min=4.0, caption='“Opa, kijk eens…”',
             text='Tot zijn kleinzoon iets zag in de krant.'),
        dict(id=3, img=D/'slide_advertentie.png', min=3.5, caption='', zoom=False,
             text='Staopstoelen punt nl, in Dordrecht. Kom gewoon even zitten.'),
        dict(id=4, img=D/'scene3_geertjan_welkom.jpg', min=4.0, caption='De koffie staat klaar.',
             text='Bij Geertjan staat de koffie altijd klaar.'),
        dict(id=5, img=V/'scene4_arm_in_arm.jpg', min=5.0, caption='Samen de juiste stoel vinden.',
             text='Samen zoeken we de stoel die precies bij u past. Zodat opa weer zelf kan opstaan.'),
        dict(id=6, img=D/'slide_eindkaart.png', min=4.5, caption='', zoom=False, text=END_TEXT),
    ],
    'oma': [
        dict(id=1, img=V/'scene1_oma_alleen.jpg', min=6.0, caption='Elke dag een beetje moeilijker…',
             text='Opstaan uit haar stoel. Voor oma werd het elke dag een beetje moeilijker.'),
        dict(id=2, img=V/'scene2_kleindochter_krant.jpg', min=4.0, caption='“Oma, kijk eens…”',
             text='Tot haar kleindochter iets zag in de krant.'),
        dict(id=3, img=D/'slide_advertentie.png', min=3.5, caption='', zoom=False,
             text='Staopstoelen punt nl, in Dordrecht. Kom gewoon even zitten.'),
        dict(id=4, img=D/'scene3_geertjan_welkom.jpg', min=4.0, caption='De koffie staat klaar.',
             text='Bij Geertjan staat de koffie altijd klaar.'),
        dict(id=5, img=V/'scene4_arm_in_arm.jpg', min=5.0, caption='Samen de juiste stoel vinden.',
             text='Samen zoeken we de stoel die precies bij u past. Zodat oma weer zelf kan opstaan.'),
        dict(id=6, img=D/'slide_eindkaart.png', min=4.5, caption='', zoom=False, text=END_TEXT),
    ],
}
SCENES = VARIANTS[VARIANT]


def tts(text, out):
    if out.exists():
        return
    payload = {'text': text, 'model_id': 'eleven_multilingual_v2',
               'voice_settings': {'stability': 0.5, 'similarity_boost': 0.78, 'style': 0.15, 'use_speaker_boost': True}}
    req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}',
        data=json.dumps(payload).encode(), method='POST',
        headers={'xi-api-key': api_key(), 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
    out.write_bytes(urllib.request.urlopen(req, context=ctx, timeout=120).read())

def duration(path):
    r = subprocess.run([FFMPEG, '-i', str(path)], stderr=subprocess.PIPE, text=True)
    for l in r.stderr.splitlines():
        if 'Duration:' in l:
            h, m, s = l.split('Duration:')[1].split(',')[0].strip().split(':')
            return int(h) * 3600 + int(m) * 60 + float(s)

def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def render_html(html, out, transparent=False):
    tmp = D / '_tmp_slide.html'
    tmp.write_text(html, encoding='utf-8')
    run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', f'--window-size={W},{H}',
         '--virtual-time-budget=6000', *(['--default-background-color=00000000'] if transparent else []),
         f'--screenshot={out}', tmp.as_uri()])
    tmp.unlink()

FONT = "<link href='https://fonts.googleapis.com/css2?family=Montserrat:wght@600;800;900&family=Outfit:wght@400;600&display=swap' rel='stylesheet'>"
BASE = "*{margin:0;padding:0;box-sizing:border-box} html,body{width:1080px;height:1920px;overflow:hidden}"

def slides():
    ad = (WS / 'krant_advertentie_a5.pdf')
    adpng = D / '_ad.png'
    run(['sips', '-s', 'format', 'png', '-Z', '1800', str(ad), '--out', str(adpng)])
    render_html(f"""<html><head>{FONT}<style>{BASE}
      body{{background:#d8d2c4;display:flex;align-items:center;justify-content:center}}
      img{{width:900px;box-shadow:0 30px 70px rgba(0,0,0,.35);transform:rotate(-2deg)}}
    </style></head><body><img src='{adpng.as_uri()}'></body></html>""", D / 'slide_advertentie.png')
    adpng.unlink()
    render_html(f"""<html><head>{FONT}<style>{BASE}
      body{{background:linear-gradient(180deg,#fbf9f5,#eef7eb);font-family:Outfit;color:#1d2024;
           display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:60px}}
      .logo{{width:860px;mix-blend-mode:multiply}} .seal{{width:300px}}
      h2{{font-family:Montserrat;font-weight:900;font-size:64px;color:#2f5f15;line-height:1.1}}
      .adr{{font-size:44px;line-height:1.5}} .adr .dot{{color:#f39223;font-weight:900;padding:0 14px}}
      .bel{{background:#f39223;color:#fff;border-radius:90px;padding:34px 70px;font-family:Montserrat}}
      .bel .t{{font-size:36px;font-weight:600}} .bel .n{{font-size:88px;font-weight:900}}
      .wa{{font-size:38px;color:#4a5568}}
    </style></head><body>
      <img class='logo' src='{(WS/"assets/marketing/logo_letters_bijgesneden.png").as_uri()}'>
      <h2>Proefzitten?<br>U bent van harte welkom!</h2>
      <img class='seal' src='{(WS/"assets/sticker_certified_fitform.svg").as_uri()}'>
      <div class='adr'>Merwedestraat 239, Dordrecht<br>Di t/m vr 10–16 uur<span class='dot'>•</span>Ma &amp; za op afspraak</div>
      <div class='bel'><div class='t'>Bel voor advies</div><div class='n'>078 - 631 4858</div></div>
      <div class='wa'>WhatsApp Geertjan: 06 - 22 23 29 64</div>
    </body></html>""", D / 'slide_eindkaart.png')

def caption_png(text, out):
    render_html(f"""<html><head>{FONT}<style>{BASE}
      body{{background:transparent;display:flex;align-items:flex-end;justify-content:center;padding-bottom:300px}}
      div{{font-family:Montserrat;font-weight:900;font-size:78px;color:#fff;text-align:center;line-height:1.15;
           background:rgba(29,32,36,.55);padding:26px 46px;border-radius:24px;max-width:960px}}
    </style></head><body><div>{text}</div></body></html>""", out, transparent=True)

def build():
    slides()
    parts = []
    for s in SCENES:
        vo = VA / f"vo_{s['id']}.mp3"
        tts(s['text'], vo)
        s['dur'] = max(s['min'], duration(vo) + 1.0)
        n = int(s['dur'] * FPS)
        zoom = s.get('zoom', True)
        vf = (f"scale=2160:-2,crop=2160:3840,zoompan=z='1+0.10*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={W}x{H}:fps={FPS}"
              if zoom else f"scale={W}:{H},zoompan=z='1+0.04*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={W}x{H}:fps={FPS}")
        if s['id'] == 1:  # koel, somber
            vf += ',eq=saturation=0.75:brightness=-0.03'
        out = P / f"part_{s['id']}.mp4"
        cmd = [FFMPEG, '-y', '-loop', '1', '-i', str(s['img'])]
        if s['caption']:
            cap = P / f"cap_{s['id']}.png"
            caption_png(s['caption'], cap)
            cmd += ['-loop', '1', '-i', str(cap), '-filter_complex',
                    f"[0:v]{vf}[b];[1:v]format=rgba,fade=t=in:st=0.6:d=0.6:alpha=1[c];[b][c]overlay=0:0:shortest=1,format=yuv420p[v]",
                    '-map', '[v]']
        else:
            cmd += ['-vf', vf + ',format=yuv420p']
        cmd += ['-t', f"{s['dur']:.2f}", '-r', str(FPS), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', str(out)]
        run(cmd)
        parts.append(out)

    # video met crossfades
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

    # voice-over op de juiste starttijden
    starts, t = [], 0.0
    for s in SCENES:
        starts.append(t + 0.35)
        t += s['dur'] - XF
    vin = sum([['-i', str(VA / f"vo_{s['id']}.mp3")] for s in SCENES], [])
    vch = [f"[{i}:a]adelay={int(st*1000)}|{int(st*1000)}[v{i}]" for i, st in enumerate(starts)]
    vch.append(''.join(f'[v{i}]' for i in range(len(SCENES))) + f"amix=inputs={len(SCENES)}:normalize=0[vo]")
    voice = VA / 'voice_track.wav'
    run([FFMPEG, '-y', *vin, '-filter_complex', ';'.join(vch), '-map', '[vo]', '-t', f'{total:.2f}', str(voice)])

    # muziek: treurig (Sad Trio) -> hoopvol (Heartwarming) vanaf scène 3
    sad_len = SCENES[0]['dur'] + SCENES[1]['dur'] - XF
    music = VA / 'music_track.wav'
    run([FFMPEG, '-y', '-ss', '14', '-t', f'{sad_len+2:.2f}', '-i', str(A/'sad_trio.mp3'),
         '-t', f'{total:.2f}', '-i', str(A/'heartwarming.mp3'), '-filter_complex',
         f"[0:a]loudnorm=I=-20:TP=-2,afade=t=in:d=1.5[s];[1:a]loudnorm=I=-20:TP=-2[h];"
         f"[s][h]acrossfade=d=2:c1=tri:c2=tri,atrim=0:{total:.2f},afade=t=out:st={total-2.5:.2f}:d=2.5[m]",
         '-map', '[m]', str(music)])

    out = WS / f'assets/video/staopstoelen_{VARIANT}_staand.mp4'
    run([FFMPEG, '-y', '-i', str(video), '-i', str(voice), '-i', str(music), '-filter_complex',
         "[1:a]asplit=2[vk][vm];[2:a]volume=0.45[mu];[mu][vk]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[duck];"
         "[duck][vm]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5[a]",
         '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-ar', '48000', '-b:a', '192k', '-shortest',
         '-movflags', '+faststart', str(out)])
    print(f'Klaar: {out} ({total:.1f} s)')

if __name__ == '__main__':
    build()
