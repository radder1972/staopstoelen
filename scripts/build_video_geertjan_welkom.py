#!/usr/bin/env python3
"""
scripts/build_video_geertjan_welkom.py

Bouwt de 9:16 (1080x1920) welkomstvideo "Welkom in Dordrecht" met Geertjan in de showroom,
inclusief huisstijl-logo pill, exact gesynchroniseerde ondertiteling en de vaste
Certified Fitform eindkaart (Merwedestraat 239, Dordrecht • 078 - 631 4858 • WhatsApp 06 - 22 23 29 64).
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

FONT = "<link href='https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Outfit:wght@500;600&display=swap' rel='stylesheet'>"
BASE = "*{margin:0;padding:0;box-sizing:border-box} html,body{width:1080px;height:1920px;overflow:hidden;background:transparent}"

def duration(path: Path) -> float:
    r = subprocess.run([FFMPEG, "-i", str(path)], stderr=subprocess.PIPE, text=True)
    for line in r.stderr.splitlines():
        if "Duration:" in line:
            h, m, s = line.split("Duration:")[1].split(",")[0].strip().split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    return 9.0

def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

def render_ov(html: str, out: Path):
    tmp = out.parent / "_tmp_ov.html"
    tmp.write_text(html, encoding="utf-8")
    run([
        CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
        "--window-size=1080,1920", "--virtual-time-budget=4000",
        "--default-background-color=00000000", f"--screenshot={out}", tmp.as_uri()
    ])
    tmp.unlink()

def build_overlays(work_dir: Path):
    logo_img = Image.open(WS / "assets/staopstoelen_logo_alleen_letters.png").convert("RGBA")
    bbox = logo_img.getbbox()
    if bbox:
        logo_img = logo_img.crop(bbox)
    buf = io.BytesIO()
    logo_img.save(buf, format="PNG")
    logo_uri = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

    # Top pill persistent during Scene 1
    render_ov(f"""<html><head>{FONT}<style>{BASE}
      .top{{position:absolute;top:76px;left:0;right:0;display:flex;justify-content:center}}
      .pill{{background:rgba(255,255,255,0.95);padding:18px 40px;border-radius:60px;box-shadow:0 12px 32px rgba(0,0,0,0.18);display:flex;align-items:center}}
      .pill img{{height:50px}}
    </style></head><body>
      <div class="top"><div class="pill"><img src="{logo_uri}"></div></div>
    </body></html>""", work_dir / "ov_top.png")

    # Sub 1 (0.10 - 2.15s): Welkom in Dordrecht!
    render_ov(f"""<html><head>{FONT}<style>{BASE}
      .bot{{position:absolute;bottom:210px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:16px}}
      .name{{font-family:Outfit;font-weight:600;font-size:34px;color:#fff;background:#4b8f24;padding:10px 28px;border-radius:40px;box-shadow:0 8px 24px rgba(0,0,0,0.25)}}
      .cap{{font-family:Montserrat;font-weight:900;font-size:62px;color:#fff;text-align:center;line-height:1.15;
            background:rgba(24,28,32,0.78);padding:26px 46px;border-radius:26px;max-width:960px;box-shadow:0 14px 36px rgba(0,0,0,0.28)}}
      .accent{{color:#f39223}}
    </style></head><body>
      <div class="bot">
        <div class="name">Geertjan • Showroom Dordrecht</div>
        <div class="cap">“Welkom in <span class="accent">Dordrecht!</span>”</div>
      </div>
    </body></html>""", work_dir / "ov_sub1.png")

    # Sub 2 (2.15 - 4.95s): Bij staopstoelen.nl staat de koffie voor u klaar.
    render_ov(f"""<html><head>{FONT}<style>{BASE}
      .bot{{position:absolute;bottom:210px;left:0;right:0;display:flex;flex-direction:column;align-items:center}}
      .cap{{font-family:Montserrat;font-weight:800;font-size:50px;color:#fff;text-align:center;line-height:1.22;
            background:rgba(24,28,32,0.78);padding:26px 42px;border-radius:26px;max-width:960px;box-shadow:0 14px 36px rgba(0,0,0,0.28)}}
      .green{{color:#7ed957}}
    </style></head><body>
      <div class="bot">
        <div class="cap">Bij <span class="green">staopstoelen.nl</span> staat<br>de koffie voor u klaar.</div>
      </div>
    </body></html>""", work_dir / "ov_sub2.png")

    # Sub 3 (4.95 - 8.10s): Kom gerust vrijblijvend proefzitten.
    render_ov(f"""<html><head>{FONT}<style>{BASE}
      .bot{{position:absolute;bottom:210px;left:0;right:0;display:flex;flex-direction:column;align-items:center}}
      .cap{{font-family:Montserrat;font-weight:800;font-size:52px;color:#fff;text-align:center;line-height:1.22;
            background:rgba(24,28,32,0.78);padding:26px 44px;border-radius:26px;max-width:960px;box-shadow:0 14px 36px rgba(0,0,0,0.28)}}
      .accent{{color:#f39223}}
    </style></head><body>
      <div class="bot">
        <div class="cap">Kom gerust vrijblijvend<br><span class="accent">proefzitten!</span></div>
      </div>
    </body></html>""", work_dir / "ov_sub3.png")

def build_master(clip_path: Path, work_dir: Path, out_path: Path):
    build_overlays(work_dir)
    eindkaart = WS / "assets/marketing/video_opa/slide_eindkaart.png"
    music = WS / "assets/marketing/video_opa/audio/heartwarming.mp3"

    clip_dur = min(duration(clip_path), 8.6)
    outro_dur = 4.4
    xf = 0.5

    # 1. Scene 1: Geertjan speaking + top logo pill + 3 timed subtitles
    s1_vid = work_dir / "_s1_speaking.mp4"
    run([
        FFMPEG, "-y",
        "-i", str(clip_path),
        "-loop", "1", "-t", f"{clip_dur:.2f}", "-i", str(work_dir / "ov_top.png"),
        "-loop", "1", "-t", f"{clip_dur:.2f}", "-i", str(work_dir / "ov_sub1.png"),
        "-loop", "1", "-t", f"{clip_dur:.2f}", "-i", str(work_dir / "ov_sub2.png"),
        "-loop", "1", "-t", f"{clip_dur:.2f}", "-i", str(work_dir / "ov_sub3.png"),
        "-filter_complex",
        f"[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1[bg];"
        f"[1:v]format=rgba,fade=t=in:st=0.10:d=0.30:alpha=1,fade=t=out:st={clip_dur - 0.55:.2f}:d=0.35:alpha=1[top];"
        f"[2:v]format=rgba,fade=t=in:st=0.08:d=0.22:alpha=1,fade=t=out:st=1.95:d=0.20:alpha=1[s1];"
        f"[3:v]format=rgba,fade=t=in:st=2.15:d=0.22:alpha=1,fade=t=out:st=4.75:d=0.20:alpha=1[s2];"
        f"[4:v]format=rgba,fade=t=in:st=4.95:d=0.22:alpha=1,fade=t=out:st=7.75:d=0.30:alpha=1[s3];"
        f"[bg][top]overlay=0:0[t0];"
        f"[t0][s1]overlay=0:0:enable='between(t,0,2.16)'[t1];"
        f"[t1][s2]overlay=0:0:enable='between(t,2.15,4.96)'[t2];"
        f"[t2][s3]overlay=0:0:enable='between(t,4.95,8.10)',format=yuv420p[v]",
        "-map", "[v]", "-t", f"{clip_dur:.2f}",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", str(s1_vid)
    ])

    # 2. Scene 2: Certified Fitform Outro Card
    s2_vid = work_dir / "_s2_outro.mp4"
    n_outro = int(outro_dur * 30)
    run([
        FFMPEG, "-y",
        "-loop", "1", "-i", str(eindkaart),
        "-vf", f"scale=1080:1920,zoompan=z='1+0.025*on/{n_outro}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n_outro}:s=1080x1920:fps=30,format=yuv420p",
        "-t", f"{outro_dur:.2f}", "-r", "30",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", str(s2_vid)
    ])

    # 3. Crossfade Scene 1 -> Scene 2
    stitched_vid = work_dir / "_stitched_master.mp4"
    offset = clip_dur - xf
    total_dur = clip_dur + outro_dur - xf
    run([
        FFMPEG, "-y",
        "-i", str(s1_vid), "-i", str(s2_vid),
        "-filter_complex", f"[0:v][1:v]xfade=transition=fade:duration={xf}:offset={offset:.2f},format=yuv420p[v]",
        "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-crf", "18", str(stitched_vid)
    ])

    # 4. Audio mix: Geertjan's natural speech + gentle warm acoustic music bed swelling softly on the outro card
    audio_fc = (
        f"[1:a]atrim=0:{clip_dur:.2f},asetpts=PTS-STARTPTS,loudnorm=I=-14:TP=-1.0:LRA=7,aresample=48000,pan=stereo|c0=c0|c1=c1,"
        f"afade=t=out:st={clip_dur - 0.50:.2f}:d=0.50,apad=whole_dur={total_dur:.2f}[speech];"
        f"[2:a]atrim=0:{total_dur:.2f},asetpts=PTS-STARTPTS,aresample=48000,"
        f"volume='if(lt(t,7.6),0.09,0.09+0.13*min(1,(t-7.6)/0.8))':eval=frame,"
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

    # Also copy to Desktop/Google_Ads_PMax_Videos and save clean raw clip
    desktop_out = Path.home() / "Desktop/Google_Ads_PMax_Videos/Geertjan_Welkom_Dordrecht_9x16.mp4"
    desktop_out.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(out_path, desktop_out)
    raw_out = WS / "assets/video/staopstoelen_geertjan_welkom_raw.mp4"
    shutil.copy2(clip_path, raw_out)
    print(f"✅ Master klaar: {out_path} ({total_dur:.1f}s)")
    print(f"✅ Bureaublad kopie: {desktop_out}")
    print(f"✅ Ruwe clip (zonder tekst): {raw_out}")

if __name__ == "__main__":
    clip = Path(sys.argv[1])
    work = Path(sys.argv[2])
    out = Path(sys.argv[3])
    build_master(clip, work, out)
