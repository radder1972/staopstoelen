#!/usr/bin/env python3
"""
scripts/build_video_geertjan_rene.py

Bouwt de 9:16 (1080x1920) showroomvideo waarin Geertjan (gladgeschoren, dicht bij de originele video)
de Design Sta-op stoel René aanprijst (€ 350,- voordeel, volledig op accu, zónder medische uitstraling),
inclusief staopstoelen.nl logo-pill, actie-badge, gesynchroniseerde ondertiteling en Certified Fitform eindkaart.
"""
import base64
import io
import shutil
import subprocess
import sys
from pathlib import Path
from PIL import Image

WS = Path("/Users/matthiasradder/AntiGravity Projecten/Staopstoelen.nl")
FFMPEG = "/Users/matthiasradder/.local/bin/ffmpeg"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

FONT = "<link href='https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Outfit:wght@500;600;700&display=swap' rel='stylesheet'>"
BASE = "*{margin:0;padding:0;box-sizing:border-box} html,body{width:1080px;height:1920px;overflow:hidden;background:transparent}"

def duration(path: Path) -> float:
    r = subprocess.run([FFMPEG, "-i", str(path)], stderr=subprocess.PIPE, text=True)
    for line in r.stderr.splitlines():
        if "Duration:" in line:
            h, m, s = line.split("Duration:")[1].split(",")[0].strip().split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    return 10.0

def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

def render_ov(html: str, out: Path):
    tmp = out.parent / f"_tmp_{out.stem}.html"
    tmp.write_text(html, encoding="utf-8")
    run([
        CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
        "--window-size=1080,1920", "--virtual-time-budget=4000",
        "--default-background-color=00000000", f"--screenshot={out}", tmp.as_uri()
    ])
    tmp.unlink(missing_ok=True)

def build_overlays(work_dir: Path):
    logo_img = Image.open(WS / "assets/staopstoelen_logo_alleen_letters.png").convert("RGBA")
    bbox = logo_img.getbbox()
    if bbox:
        logo_img = logo_img.crop(bbox)
    buf = io.BytesIO()
    logo_img.save(buf, format="PNG")
    logo_uri = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

    # Top pill + subtle € 350,- actie tag
    render_ov(f"""<html><head>{FONT}<style>{BASE}
      .top{{position:absolute;top:52px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:12px}}
      .pill{{background:rgba(255,255,255,0.95);padding:14px 36px;border-radius:60px;box-shadow:0 12px 32px rgba(0,0,0,0.18);display:flex;align-items:center}}
      .pill img{{height:44px}}
      .tag{{font-family:Montserrat;font-weight:800;font-size:23px;color:#fff;background:#f39223;padding:7px 24px;border-radius:40px;letter-spacing:0.6px;text-transform:uppercase;box-shadow:0 8px 22px rgba(0,0,0,0.22)}}
    </style></head><body>
      <div class="top">
        <div class="pill"><img src="{logo_uri}"></div>
        <div class="tag">Design Sta-op stoel René • € 350,- Voordeel</div>
      </div>
    </body></html>""", work_dir / "ov_top.png")

    # Sub 1: Dit is de nieuwe sta-op stoel René:
    render_ov(f"""<html><head>{FONT}<style>{BASE}
      .bot{{position:absolute;bottom:76px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:12px}}
      .name{{font-family:Outfit;font-weight:600;font-size:30px;color:#fff;background:#4b8f24;padding:8px 26px;border-radius:40px;box-shadow:0 8px 24px rgba(0,0,0,0.25)}}
      .cap{{font-family:Montserrat;font-weight:900;font-size:48px;color:#fff;text-align:center;line-height:1.18;
            background:rgba(24,28,32,0.84);padding:22px 40px;border-radius:24px;max-width:960px;box-shadow:0 14px 36px rgba(0,0,0,0.3)}}
      .accent{{color:#f39223}}
    </style></head><body>
      <div class="bot">
        <div class="name">Geertjan • Specialist Ergonomisch Zitcomfort</div>
        <div class="cap">“Dit is de nieuwe<br>sta-op stoel <span class="accent">René!</span>”</div>
      </div>
    </body></html>""", work_dir / "ov_sub1.png")

    # Sub 2: Een stijlvolle designfauteuil op accu, zónder medische uitstraling.
    render_ov(f"""<html><head>{FONT}<style>{BASE}
      .bot{{position:absolute;bottom:76px;left:0;right:0;display:flex;flex-direction:column;align-items:center}}
      .cap{{font-family:Montserrat;font-weight:800;font-size:44px;color:#fff;text-align:center;line-height:1.22;
            background:rgba(24,28,32,0.84);padding:22px 40px;border-radius:24px;max-width:960px;box-shadow:0 14px 36px rgba(0,0,0,0.3)}}
      .green{{color:#7ed957}}
    </style></head><body>
      <div class="bot">
        <div class="cap">Stijlvolle draaifauteuil <span class="green">op accu</span>,<br>zónder medische uitstraling.</div>
      </div>
    </body></html>""", work_dir / "ov_sub2.png")

    # Sub 3: Nu met € 350,- voordeel — kom hem proefzitten in Dordrecht!
    render_ov(f"""<html><head>{FONT}<style>{BASE}
      .bot{{position:absolute;bottom:76px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:12px}}
      .price{{font-family:Montserrat;font-weight:900;font-size:30px;color:#fff;background:#2f5f15;border:2px solid #fff;padding:8px 28px;border-radius:40px;box-shadow:0 8px 24px rgba(0,0,0,0.3)}}
      .price s{{color:#c8dec0;font-weight:600;margin-right:8px}}
      .cap{{font-family:Montserrat;font-weight:800;font-size:44px;color:#fff;text-align:center;line-height:1.2;
            background:rgba(24,28,32,0.84);padding:20px 38px;border-radius:24px;max-width:960px;box-shadow:0 14px 36px rgba(0,0,0,0.3)}}
      .accent{{color:#f39223}}
    </style></head><body>
      <div class="bot">
        <div class="price"><s>€ 2.695,-</s> Nu € 2.345,- incl. accu</div>
        <div class="cap">Nu <span class="accent">€ 350,- voordeel</span> — kom gerust<br>proefzitten in Dordrecht!</div>
      </div>
    </body></html>""", work_dir / "ov_sub3.png")

def build_master(clip_path: Path, work_dir: Path, out_path: Path, t1: float = 2.45, t2: float = 6.15):
    work_dir.mkdir(parents=True, exist_ok=True)
    build_overlays(work_dir)
    eindkaart = WS / "assets/marketing/video_opa/slide_eindkaart.png"
    music = WS / "assets/marketing/video_opa/audio/heartwarming.mp3"

    raw_dur = duration(clip_path)
    pad_tail = 0.15
    s1_dur = raw_dur + pad_tail
    t3_end = raw_dur - 0.05
    outro_dur = 4.4
    xf = 0.45

    s1_vid = work_dir / "_s1_speaking.mp4"
    run([
        FFMPEG, "-y",
        "-i", str(clip_path),
        "-loop", "1", "-t", f"{s1_dur:.2f}", "-i", str(work_dir / "ov_top.png"),
        "-loop", "1", "-t", f"{s1_dur:.2f}", "-i", str(work_dir / "ov_sub1.png"),
        "-loop", "1", "-t", f"{s1_dur:.2f}", "-i", str(work_dir / "ov_sub2.png"),
        "-loop", "1", "-t", f"{s1_dur:.2f}", "-i", str(work_dir / "ov_sub3.png"),
        "-filter_complex",
        f"[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1,tpad=stop_mode=clone:stop_duration={pad_tail}[bg];"
        f"[1:v]format=rgba,fade=t=in:st=0.10:d=0.30:alpha=1,fade=t=out:st={s1_dur - 0.50:.2f}:d=0.35:alpha=1[top];"
        f"[2:v]format=rgba,fade=t=in:st=0.08:d=0.20:alpha=1,fade=t=out:st={t1 - 0.18:.2f}:d=0.18:alpha=1[s1];"
        f"[3:v]format=rgba,fade=t=in:st={t1:.2f}:d=0.20:alpha=1,fade=t=out:st={t2 - 0.18:.2f}:d=0.18:alpha=1[s2];"
        f"[4:v]format=rgba,fade=t=in:st={t2:.2f}:d=0.20:alpha=1,fade=t=out:st={t3_end - 0.20:.2f}:d=0.25:alpha=1[s3];"
        f"[bg][top]overlay=0:0[t0];"
        f"[t0][s1]overlay=0:0:enable='between(t,0,{t1:.2f})'[u1];"
        f"[u1][s2]overlay=0:0:enable='between(t,{t1:.2f},{t2:.2f})'[u2];"
        f"[u2][s3]overlay=0:0:enable='between(t,{t2:.2f},{t3_end + 0.10:.2f})',format=yuv420p[v]",
        "-map", "[v]", "-t", f"{s1_dur:.2f}",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", str(s1_vid)
    ])

    s2_vid = work_dir / "_s2_outro.mp4"
    n_outro = int(outro_dur * 30)
    run([
        FFMPEG, "-y",
        "-loop", "1", "-i", str(eindkaart),
        "-vf", f"scale=1080:1920,zoompan=z='1+0.025*on/{n_outro}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n_outro}:s=1080x1920:fps=30,format=yuv420p",
        "-t", f"{outro_dur:.2f}", "-r", "30",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", str(s2_vid)
    ])

    stitched_vid = work_dir / "_stitched_master.mp4"
    offset = s1_dur - xf
    total_dur = s1_dur + outro_dur - xf
    run([
        FFMPEG, "-y",
        "-i", str(s1_vid), "-i", str(s2_vid),
        "-filter_complex", f"[0:v][1:v]xfade=transition=fade:duration={xf}:offset={offset:.2f},format=yuv420p[v]",
        "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-crf", "18", str(stitched_vid)
    ])

    swell = max(0.5, raw_dur - 0.15)
    audio_fc = (
        f"[1:a]atrim=0:{raw_dur:.2f},asetpts=PTS-STARTPTS,loudnorm=I=-14:TP=-1.0:LRA=7,aresample=48000,pan=stereo|c0=c0|c1=c1,"
        f"afade=t=out:st={raw_dur - 0.12:.2f}:d=0.12,apad=whole_dur={total_dur:.2f}[speech];"
        f"[2:a]atrim=0:{total_dur:.2f},asetpts=PTS-STARTPTS,aresample=48000,"
        f"volume='if(lt(t,{swell:.2f}),0.09,0.09+0.14*min(1,(t-{swell:.2f})/0.8))':eval=frame,"
        f"afade=t=in:st=0:d=0.7,afade=t=out:st={total_dur - 1.1:.2f}:d=1.1[bgm];"
        f"[speech][bgm]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[aout]"
    )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    run([
        FFMPEG, "-y",
        "-i", str(stitched_vid),
        "-i", str(clip_path),
        "-i", str(music),
        "-filter_complex", audio_fc,
        "-map", "0:v", "-map", "[aout]",
        "-t", f"{total_dur:.2f}",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
        str(out_path)
    ])

    desktop_out = Path.home() / "Desktop/Google_Ads_PMax_Videos/Geertjan_Rene_Aanrader_9x16.mp4"
    desktop_out.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(out_path, desktop_out)
    raw_out = WS / "assets/video/staopstoelen_geertjan_rene_aanrader_raw.mp4"
    shutil.copy2(clip_path, raw_out)
    print(f"✅ Master klaar: {out_path} ({total_dur:.1f}s)")
    print(f"✅ Bureaublad kopie: {desktop_out}")
    print(f"✅ Ruwe clip: {raw_out}")

if __name__ == "__main__":
    clip = Path(sys.argv[1])
    work = Path(sys.argv[2])
    out = Path(sys.argv[3])
    t1 = float(sys.argv[4]) if len(sys.argv) > 4 else 2.60
    t2 = float(sys.argv[5]) if len(sys.argv) > 5 else 6.20
    build_master(clip, work, out, t1, t2)
