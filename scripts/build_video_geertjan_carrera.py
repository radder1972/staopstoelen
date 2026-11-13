#!/usr/bin/env python3
"""
Bouwt de 9:16 Geertjan x DFM Sta-op stoel Carrera video met HTML/CSS overlays,
vaste eindkaart (slide_eindkaart.png), zachte achtergrondmuziek en Geertjans
ElevenLabs-stem (al gesynchroniseerd in de inputvideo).
"""
import argparse
import os
import shutil
import subprocess
from pathlib import Path

ROOT = Path("/Users/matthiasradder/AntiGravity Projecten/Staopstoelen.nl")
FFMPEG = "/Users/matthiasradder/.local/bin/ffmpeg"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ENDCARD = ROOT / "assets/marketing/video_opa/slide_eindkaart.png"
BGM = ROOT / "assets/marketing/video_opa/audio/heartwarming.mp3"
SCRATCH_BUILD = Path(
    "/Users/matthiasradder/.gemini/antigravity/brain/b9299d56-d6e1-4822-892b-a3d6d8b13b75/scratch/carrera_geertjan/build"
)

OVERLAY_CSS = """
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 1080px;
  height: 1920px;
  background: transparent;
  overflow: hidden;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.top-wrap {
  position: absolute;
  top: 56px;
  left: 48px;
  right: 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.brand-pill {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: rgba(24, 38, 30, 0.84);
  backdrop-filter: blur(10px);
  color: #ffffff;
  padding: 15px 28px;
  border-radius: 999px;
  font-size: 27px;
  font-weight: 700;
  letter-spacing: -0.01em;
  border: 2px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
}
.brand-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #d96b27;
  box-shadow: 0 0 0 4px rgba(217, 107, 39, 0.28);
}
.bottom-grad {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 600px;
  background: linear-gradient(180deg, rgba(16, 26, 20, 0) 0%, rgba(16, 26, 20, 0.72) 55%, rgba(16, 26, 20, 0.90) 100%);
}
.caption-wrap {
  position: absolute;
  left: 52px;
  right: 52px;
  bottom: 108px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 18px;
}
.price-pill {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  background: #d96b27;
  color: #ffffff;
  font-size: 32px;
  font-weight: 800;
  padding: 14px 30px;
  border-radius: 999px;
  box-shadow: 0 14px 32px rgba(217, 107, 39, 0.36);
  border: 2px solid rgba(255, 255, 255, 0.28);
}
.sub-card {
  width: 100%;
  background: rgba(250, 248, 244, 0.96);
  color: #1c2b22;
  padding: 30px 36px;
  border-radius: 26px;
  font-size: 46px;
  line-height: 1.22;
  font-weight: 800;
  letter-spacing: -0.02em;
  box-shadow: 0 22px 48px rgba(0, 0, 0, 0.34);
  border-left: 10px solid #2b4c3b;
}
.sub-card .accent { color: #d96b27; }
.sub-card .green { color: #2b4c3b; }
"""


def render_overlay_png(html_body: str, out_png: Path) -> None:
    html_file = out_png.with_suffix(".html")
    html_doc = f"""<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<style>{OVERLAY_CSS}</style>
</head>
<body>
  <div class="top-wrap">
    <div class="brand-pill"><span class="brand-dot"></span>Design Sta-op stoel Carrera &bull; 5 Maten (S t/m XXL)</div>
  </div>
  <div class="bottom-grad"></div>
  <div class="caption-wrap">
    {html_body}
  </div>
</body>
</html>"""
    html_file.write_text(html_doc, encoding="utf-8")
    subprocess.run(
        [
            CHROME,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--default-background-color=00000000",
            "--window-size=1080,1920",
            f"--screenshot={out_png}",
            f"file://{html_file}",
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def run_cmd(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Synced 9:16 video met Geertjans stem")
    parser.add_argument("--out", required=True, help="Master 1080x1920 output MP4")
    parser.add_argument("--web", required=True, help="Web 900x1600 compressed MP4")
    parser.add_argument("--poster", required=True, help="Poster JPG")
    parser.add_argument("--desktop", required=True, help="Kopie voor Desktop Google Ads")
    args = parser.parse_args()

    SCRATCH_BUILD.mkdir(parents=True, exist_ok=True)
    ov1 = SCRATCH_BUILD / "ov1_carrera.png"
    ov2 = SCRATCH_BUILD / "ov2_carrera.png"
    ov3 = SCRATCH_BUILD / "ov3_carrera.png"

    render_overlay_png(
        '<div class="sub-card">“Dit is de sta-op<br>stoel <span class="accent">Carrera!</span>”</div>',
        ov1,
    )
    render_overlay_png(
        '<div class="sub-card">Slanke draaifauteuil in <span class="green">5 maten</span>,<br>z&oacute;nder medische uitstraling.</div>',
        ov2,
    )
    render_overlay_png(
        '<div class="price-pill">Compleet op maat &bull; &euro; 2.500,-</div>'
        '<div class="sub-card">Kom hem vrijblijvend<br><span class="accent">proefzitten in Dordrecht!</span></div>',
        ov3,
    )

    body_out = SCRATCH_BUILD / "carrera_body_overlay.mp4"
    end_out = SCRATCH_BUILD / "carrera_endcard.mp4"
    concat_vid = SCRATCH_BUILD / "carrera_concat.mp4"
    master_out = Path(args.out)
    web_out = Path(args.web)
    poster_out = Path(args.poster)
    desktop_out = Path(args.desktop)

    master_out.parent.mkdir(parents=True, exist_ok=True)
    web_out.parent.mkdir(parents=True, exist_ok=True)
    poster_out.parent.mkdir(parents=True, exist_ok=True)
    desktop_out.parent.mkdir(parents=True, exist_ok=True)

    t1 = 2.15
    t2 = 6.55
    end_dur = 4.4

    # 1. Overlay PNG cards on synced main clip
    filter_ov = (
        "[0:v]scale=1080:1920,setsar=1,fps=30,format=rgba[base];"
        "[base][1:v]overlay=0:0:enable='between(t,0,{t1:.2f})'[v1];"
        "[v1][2:v]overlay=0:0:enable='between(t,{t1:.2f},{t2:.2f})'[v2];"
        "[v2][3:v]overlay=0:0:enable='gte(t,{t2:.2f})'[vout]"
    ).format(t1=t1, t2=t2)

    run_cmd([
        FFMPEG, "-y",
        "-i", args.input,
        "-i", str(ov1),
        "-i", str(ov2),
        "-i", str(ov3),
        "-filter_complex", filter_ov,
        "-map", "[vout]",
        "-map", "0:a",
        "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "1",
        str(body_out),
    ])

    # 2. Build 4.4s endcard video with silent mono audio track
    run_cmd([
        FFMPEG, "-y",
        "-loop", "1", "-t", f"{end_dur:.2f}", "-i", str(ENDCARD),
        "-f", "lavfi", "-t", f"{end_dur:.2f}", "-i", "anullsrc=r=48000:cl=mono",
        "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=#1c2b22,fps=30,format=yuv420p,fade=t=in:st=0:d=0.35,fade=t=out:st=3.90:d=0.50",
        "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "1",
        "-shortest",
        str(end_out),
    ])

    # 3. Concatenate body + endcard
    concat_txt = SCRATCH_BUILD / "concat.txt"
    concat_txt.write_text(f"file '{body_out}'\nfile '{end_out}'\n", encoding="utf-8")
    run_cmd([
        FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", str(concat_txt),
        "-c", "copy", str(concat_vid),
    ])

    # 4. Mix subtle background music under clean speech
    total_dur = 11.73 + end_dur
    bgm_filter = (
        f"[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,volume=1.18[voice];"
        f"[1:a]aresample=48000,atrim=0:{total_dur:.2f},asetpts=PTS-STARTPTS,"
        f"volume=0.075,afade=t=in:st=0:d=0.4,afade=t=out:st={total_dur - 1.1:.2f}:d=1.1[music];"
        f"[voice][music]amix=inputs=2:duration=first:dropout_transition=2,alimiter=limit=0.95[aout]"
    )
    run_cmd([
        FFMPEG, "-y",
        "-i", str(concat_vid),
        "-stream_loop", "-1", "-i", str(BGM),
        "-filter_complex", bgm_filter,
        "-map", "0:v", "-map", "[aout]",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
        str(master_out),
    ])

    # 5. Copy master to Desktop Google Ads PMax folder
    shutil.copy2(master_out, desktop_out)

    # 6. Compress web MP4 (900x1600, CRF 23, faststart)
    run_cmd([
        FFMPEG, "-y",
        "-i", str(master_out),
        "-vf", "scale=900:1600",
        "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        str(web_out),
    ])

    # 7. Extract clean poster JPG at 0.8s (clean thumbnail)
    run_cmd([
        FFMPEG, "-y", "-ss", "0.80",
        "-i", str(master_out),
        "-vframes", "1", "-q:v", "2",
        str(poster_out),
    ])
    print("Master:", master_out, master_out.stat().st_size)
    print("Web:", web_out, web_out.stat().st_size)
    print("Desktop:", desktop_out, desktop_out.stat().st_size)
    print("Poster:", poster_out, poster_out.stat().st_size)


if __name__ == "__main__":
    main()
