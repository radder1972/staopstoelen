#!/usr/bin/env python3
import json, math, os, shutil, ssl, struct, subprocess, urllib.request, wave
from pathlib import Path

WS = Path("/Users/matthiasradder/AntiGravity Projecten/Staopstoelen.nl")
FFMPEG = "/Users/matthiasradder/.local/bin/ffmpeg"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
VOICE_ID = "g5MYumTmZlFU9tYSmTp9"

D_OPA = WS / "assets/marketing/video_opa"
D_MAN = WS / "assets/marketing/video_rene_man"
OUT_DIR = Path.home() / "Downloads/Staopstoelen_YouTube_Videos"
OLD_SCRATCH = Path("/Users/matthiasradder/.gemini/antigravity/brain/9a1bfd43-0fc0-4c63-a273-d61cb6c12656/scratch")
CUR_BRAIN = Path("/Users/matthiasradder/.gemini/antigravity/brain/5a71c862-1402-4ffc-8876-2c899186c109")
WORK = CUR_BRAIN / "scratch/video_kom_en_zie_clean"
A = WORK / "audio"
P = WORK / "parts"
if WORK.exists():
    shutil.rmtree(WORK)
for p in (OUT_DIR, WORK, A, P):
    p.mkdir(parents=True, exist_ok=True)

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

def tts(text, out):
    if out.exists():
        return
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.50, "similarity_boost": 0.82, "style": 0.16, "use_speaker_boost": True}
    }
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
        data=json.dumps(payload).encode(), method="POST",
        headers={"xi-api-key": api_key(), "Content-Type": "application/json", "Accept": "audio/mpeg"}
    )
    out.write_bytes(urllib.request.urlopen(req, context=ctx, timeout=120).read())

FONT = "<link href='https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&family=Outfit:wght@400;500;600;700&display=swap' rel='stylesheet'>"
BASE = "*{margin:0;padding:0;box-sizing:border-box} html,body{width:1080px;height:1920px;overflow:hidden}"

def render_overlay(html, out):
    tmp = WORK / "_tmp_ov.html"
    tmp.write_text(html, encoding="utf-8")
    run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--window-size={W},{H}",
         "--virtual-time-budget=4000", "--default-background-color=00000000", f"--screenshot={out}", tmp.as_uri()])
    tmp.unlink()

def caption_png(text, out):
    render_overlay(f"""<html><head>{FONT}<style>{BASE}
      body{{background:transparent;display:flex;align-items:flex-end;justify-content:center;padding-bottom:280px}}
      div{{font-family:Montserrat;font-weight:900;font-size:60px;color:#fff;text-align:center;line-height:1.18;
           background:rgba(29,32,36,.68);padding:26px 44px;border-radius:24px;max-width:980px}}
    </style></head><body><div>{text}</div></body></html>""", out)

# Save updated Kom en Zie scene images into project assets and use them
img_vader_src = CUR_BRAIN / "kom_en_zie_scene6_rear_v2_jpg_1794043327598.jpg"
img_podium_src = CUR_BRAIN / "kom_en_zie_scene7_rij_staop_v6_clean_jpg_1794041670465.jpg"
img_vader = D_MAN / "kom_en_zie_scene6_vader_staop.jpg"
img_podium = D_MAN / "kom_en_zie_scene7_rij_staop.jpg"
shutil.copy2(img_vader_src, img_vader)
shutil.copy2(img_podium_src, img_podium)

# All 9 scenes with clean, natural Dutch pronunciation ("mee-diese", written-out amounts)
SCENES = [
    dict(id=1, img=D_MAN/"rene_man_scene1_schaamte.jpg", min=6.0,
         caption="“Zondag bij Kom en Zie weer zo’n pijn in mijn rug…”",
         text="Elke week die pijn in zijn rug bij het opstaan. Zelfs op zondagochtend bij Kom en Zie kon pap bijna niet meer blijven staan tijdens de aanbidding. Maar zo’n lompe, mee-diese stoel in huis? Daar wilde hij niks van weten."),
    dict(id=2, img=D_MAN/"rene_man_scene2_telefoon_ontdekking.jpg", min=5.0,
         caption="“Pap, kijk eens… dit is de René.”",
         text="Tot ik hem de stoere René liet zien op Staopstoelen punt nl. Een moderne draaifauteuil op accu, met verstelbare hoofdsteun, hartbalans-ligstand én onzichtbare sta-op hulp."),
    dict(id=3, img=D_MAN/"slide_rene_man_aanbieding.png", min=5.0, caption="", zoom=False,
         text="De Sta-op stoel René. Nu tijdelijk met drie-honderd-vijftig euro korting... Van twee-duizend zes-honderd vijf-en-negentig euro, nu voor twee-duizend drie-honderd vijf-en-veertig euro."),
    dict(id=4, img=D_OPA/"scene3_geertjan_welkom.jpg", min=3.8,
         caption="Rustig uitproberen met een kopje koffie.",
         text="Bij Geertjan in Dordrecht stond de koffie al voor ons klaar."),
    dict(id=5, img=D_MAN/"rene_man_scene4_trots_in_rene.jpg", min=5.0,
         caption="Doordeweeks écht uitrusten. Zonder pijn opstaan.",
         text="Precies op zijn lengte en rug afgesteld. Doordeweeks komt zijn rug nu écht tot rust in zijn stoere groene René, en staat hij thuis zonder enige moeite op."),
    dict(id=6, img=img_vader, min=6.5,
         caption="Op accu zonder snoer: dus gewoon mee naar Kom en Zie!",
         text="En omdat de René op een accu werkt zonder snoer, neemt pap hem op zondagochtend bij Kom en Zie gewoon mee de zaal in! Met één druk op de knop staat hij bij het eerste aanbiddingslied weer met zijn hand in de lucht vooraan!"),
    dict(id=7, img=img_podium, min=6.5,
         caption="Een week later: de héle voorste rij op accu omhoog!",
         text="Sterker nog: een week later stond de héle voorste rij bij Kom en Zie vol met groene René-stoelen op accu! Bij het eerste refrein gingen ze allemaal tegelijk met één druk op de knop de lucht in!"),
    dict(id=8, is_live=True, min=28.0,
         text="Deze aanbiddingsdienst, én paasdienst, wordt mede mogelijk gemaakt door... Staopstoelen punt nl! Voor iedereen die op zondag weer zonder moeite wil opstaan."),
    dict(id=9, img=D_MAN/"slide_rene_man_eindkaart.png", min=5.5, caption="", zoom=False,
         text="Kom de René vrijblijvend uitproberen aan de Merwedestraat tweehonderd negenendertig in Dordrecht. Of bel nul zeven acht, zes drie één, achtenveertig, achtenvijftig."),
]

XF = 0.6
parts = []
vo_files = []

# Reuse verified clean voiceovers
WORK3_A = OLD_SCRATCH / "video_kom_en_zie_v3/audio"
reuse_map = {
    1: CUR_BRAIN / "scratch/vo_1_kez_clean.mp3",
    2: D_MAN / "audio/vo_2.mp3",
    3: CUR_BRAIN / "scratch/vo_3_kez_clean.mp3",
    4: D_MAN / "audio/vo_4.mp3",
    5: WORK3_A / "vo_5.mp3",
    6: WORK3_A / "vo_6.mp3",
    7: WORK3_A / "vo_rij.mp3",
    8: WORK3_A / "vo_7.mp3",
    9: D_MAN / "audio/vo_6.mp3",
}

for s in SCENES:
    sid = s["id"]
    vo_raw = A / f"vo_raw_{sid}.mp3"
    if sid in reuse_map and reuse_map[sid].exists():
        shutil.copy2(reuse_map[sid], vo_raw)
    else:
        tts(s["text"], vo_raw)
    # Normalize each voiceover to a consistent, clear -14 LUFS wav
    vo_wav = A / f"vo_{sid}.wav"
    run([FFMPEG, "-y", "-i", str(vo_raw), "-af", "loudnorm=I=-14:TP=-1.0:LRA=7,aresample=48000,pan=stereo|c0=c0|c1=c1", "-c:a", "pcm_s16le", str(vo_wav)])
    s["vo_dur"] = duration(vo_wav)
    vo_files.append(vo_wav)

    # Guarantee that the scene duration is ALWAYS at least vo_dur + 1.35s (so XF=0.6s never causes any overlap!)
    if s.get("is_live"):
        s["dur"] = 28.0
        # Copy the already rendered 28s live worship video part from WORK3
        part_out = P / f"part_{sid}.mp4"
        shutil.copy2(OLD_SCRATCH / "video_kom_en_zie_v3/parts/part_7.mp4", part_out)
        parts.append(part_out)
        continue

    s["dur"] = max(s["min"], s["vo_dur"] + 1.40)
    n = int(s["dur"] * FPS)
    zoom = s.get("zoom", True)
    vf = (f"scale=2160:-2,crop=2160:3840,zoompan=z='1+0.10*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={W}x{H}:fps={FPS}"
          if zoom else f"scale={W}:{H},zoompan=z='1+0.035*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={W}x{H}:fps={FPS}")
    if sid == 1:
        vf += ",eq=saturation=0.75:brightness=-0.03"
    part_out = P / f"part_{sid}.mp4"
    cmd = [FFMPEG, "-y", "-loop", "1", "-i", str(s["img"])]
    if s["caption"]:
        cap = P / f"cap_{sid}.png"
        caption_png(s["caption"], cap)
        cmd += ["-loop", "1", "-i", str(cap), "-filter_complex",
                f"[0:v]{vf}[b];[1:v]format=rgba,fade=t=in:st=0.4:d=0.5:alpha=1[c];[b][c]overlay=0:0:shortest=1,format=yuv420p[v]",
                "-map", "[v]"]
    else:
        cmd += ["-vf", vf + ",format=yuv420p"]
    cmd += ["-t", f"{s['dur']:.2f}", "-r", str(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "19", str(part_out)]
    run(cmd)
    parts.append(part_out)

# Re-verify exact durations from the rendered MP4 parts
durs = [duration(p) for p in parts]
for s, d in zip(SCENES, durs):
    s["dur"] = d

# Stitch video parts with 0.6s xfade
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

# Build Voice Track sequentially in Python wave buffer so TWO VOICES CAN NEVER OVERLAP!
sr = 48000
nch = 2
total_frames = int(math.ceil(total * sr))
voice_buf = [0] * (total_frames * nch)

starts = []
scene_start = 0.0
prev_end = 0.0
for idx, s in enumerate(SCENES):
    # Start 0.35s into scene (or 2.2s into the live worship scene 8), AND strictly >= prev_end + 0.45s
    desired_start = scene_start + (2.2 if s.get("is_live") else 0.35)
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
    print(f"Scene {s['id']}: scene_dur={s['dur']:.2f}s, vo_start={actual_start:.2f}s, vo_end={prev_end:.2f}s")

voice_wav = A / "voice_sequential.wav"
with wave.open(str(voice_wav), "wb") as wout:
    wout.setnchannels(nch)
    wout.setsampwidth(2)
    wout.setframerate(sr)
    wout.writeframes(struct.pack(f"<{len(voice_buf)}h", *voice_buf))

# Build Smooth Music Track with 7.5s crossfade into Kom en Zie worship music
sad_len = durs[0] + durs[1] - XF
scene6_start = sum(durs[:5]) - 5 * XF
worship_entry = scene6_start - 3.5
heart_len = worship_entry - sad_len + 3.5 + 7.5
worship_len = total - worship_entry + 5.0

music_raw = A / "music_raw.wav"
run([FFMPEG, "-y",
     "-ss", "14", "-t", f"{sad_len+3.5:.2f}", "-i", str(D_OPA/"audio/sad_trio.mp3"),
     "-t", f"{heart_len:.2f}", "-i", str(D_OPA/"audio/heartwarming.mp3"),
     "-ss", "58", "-t", f"{worship_len:.2f}", "-i", str(OLD_SCRATCH / "kom_en_zie_praise_sdr.mp4"),
     "-filter_complex",
     f"[0:a]loudnorm=I=-18:TP=-1.5,afade=t=in:d=1.8:curve=qsin[s];"
     f"[1:a]loudnorm=I=-18:TP=-1.5[h];"
     f"[2:a]loudnorm=I=-14:TP=-1.2[w];"
     f"[s][h]acrossfade=d=3.5:c1=qsin:c2=qsin[sh];"
     f"[sh][w]acrossfade=d=7.5:c1=qsin:c2=qsin,atrim=0:{total:.2f},afade=t=out:st={total-2.8:.2f}:d=2.8:curve=qsin,aresample=48000,pan=stereo|c0=c0|c1=c1[m]",
     "-map", "[m]", "-c:a", "pcm_s16le", str(music_raw)])

scene8_start = sum(durs[:7]) - 7 * XF
vo8_start = starts[7]
scene9_start = starts[8]
speech_intervals = [(st, st + s["vo_dur"]) for st, s in zip(starts, SCENES)]

def base_swell(t_sec):
    if t_sec < worship_entry:
        return 0.25
    elif t_sec < scene8_start:
        p = (t_sec - worship_entry) / max(0.1, (scene8_start - worship_entry))
        return 0.25 + (0.42 - 0.25) * (0.5 - 0.5 * math.cos(math.pi * min(1.0, max(0.0, p))))
    elif t_sec < scene9_start - 1.2:
        if t_sec < scene8_start + 2.0:
            p = (t_sec - scene8_start) / 2.0
            return 0.42 + (0.72 - 0.42) * (0.5 - 0.5 * math.cos(math.pi * p))
        return 0.86
    else:
        p = min(1.0, max(0.0, (t_sec - (scene9_start - 1.2)) / 1.8))
        return 0.86 + (0.28 - 0.86) * (0.5 - 0.5 * math.cos(math.pi * p))

def speech_duck_factor(t_sec):
    factor = 1.0
    for a, b in speech_intervals:
        fade_in_start = a - 0.75
        fade_out_end = b + 1.35
        if fade_in_start <= t_sec <= fade_out_end:
            target = 0.34 if abs(a - vo8_start) < 0.5 else 0.78
            if t_sec < a:
                p = (t_sec - fade_in_start) / 0.75
                f = 1.0 - (1.0 - target) * (0.5 - 0.5 * math.cos(math.pi * p))
            elif t_sec <= b:
                f = target
            else:
                p = (t_sec - b) / 1.35
                f = target + (1.0 - target) * (0.5 - 0.5 * math.cos(math.pi * p))
            factor = min(factor, f)
    return factor

music_shaped = A / "music_shaped.wav"
with wave.open(str(music_raw), "rb") as wr, wave.open(str(music_shaped), "wb") as ww:
    params = wr.getparams()
    ww.setparams(params)
    chunk = 4800
    frame_idx = 0
    while True:
        data = wr.readframes(chunk)
        if not data:
            break
        samples = list(struct.unpack(f"<{len(data)//2}h", data))
        for i in range(0, len(samples), nch):
            t_sec = frame_idx / sr
            g = base_swell(t_sec) * speech_duck_factor(t_sec)
            for c in range(nch):
                val = int(samples[i + c] * g)
                samples[i + c] = max(-32767, min(32767, val))
            frame_idx += 1
        ww.writeframes(struct.pack(f"<{len(samples)}h", *samples))

out = OUT_DIR / "13_SHORT_Stoel_Rene_Kom_En_Zie_Met_Echte_Aanbidding_En_SponsorBumper.mp4"
run([FFMPEG, "-y", "-i", str(video), "-i", str(voice_wav), "-i", str(music_shaped), "-filter_complex",
     "[1:a]volume=1.22[vm];[2:a]volume=1.0[mu];[mu][vm]amix=inputs=2:normalize=0,alimiter=limit=0.96[a]",
     "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-ar", "48000", "-b:a", "192k", "-shortest",
     "-movflags", "+faststart", str(out)])

# Also sync to project assets and older Kom en Zie filenames in OUT_DIR so whichever one the user opens is updated
shutil.copy2(out, WS / "assets/video/staopstoelen_rene_kom_en_zie_staand.mp4")
for alt_name in [
    "11_SHORT_Stoel_Rene_Kom_En_Zie_Editie_Op_Accu.mp4",
    "12_SHORT_Stoel_Rene_Kom_En_Zie_Hele_Voorste_Rij_Op_Accu.mp4",
]:
    alt_path = OUT_DIR / alt_name
    if alt_path.exists():
        shutil.copy2(out, alt_path)

print(f"Klaar (100% synchroon zonder overlap): {out} ({total:.1f} s)")
