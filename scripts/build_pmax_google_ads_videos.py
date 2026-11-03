#!/usr/bin/env python3
"""
build_pmax_google_ads_videos.py

Genereert de twee verplichte Google Ads Performance Max (PMax) video's:
1. Vierkant 1:1  (1080 x 1080 px)
2. Verticaal 9:16 (1080 x 1920 px)

Plaatst beide direct op het Bureaublad in:
~/Desktop/Google_Ads_PMax_Videos/
"""

import os
import sys
import math
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

FFMPEG = '/Users/matthiasradder/Library/Python/3.14/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
WORKSPACE = Path(__file__).resolve().parent.parent

# Output directory on Desktop
DESKTOP_DIR = Path.home() / "Desktop" / "Google_Ads_PMax_Videos"
DESKTOP_DIR.mkdir(parents=True, exist_ok=True)

# Fonts
FONT_BOLD = str(WORKSPACE / "assets/fonts/Montserrat-Bold.ttf")
FONT_XBOLD = str(WORKSPACE / "assets/fonts/Montserrat-ExtraBold.ttf")
FONT_SEMI = str(WORKSPACE / "assets/fonts/Montserrat-SemiBold.ttf")
FONT_REG = str(WORKSPACE / "assets/fonts/Montserrat-Regular.ttf")

# Images
IMG_CHAIR = Image.open(WORKSPACE / "assets/stoelen/fitform_570_zand_visgraatvloer.jpg").convert("RGB")
IMG_GEERTJAN = Image.open(WORKSPACE / "assets/geertjan_advies_showroom.jpg").convert("RGB")
IMG_SHOWROOM = Image.open(WORKSPACE / "assets/showroom_origineel_stoelen.webp").convert("RGB")
IMG_PAND = Image.open(WORKSPACE / "assets/pand.jpg").convert("RGB")

LOGO_IMG = Image.open(WORKSPACE / "assets/staopstoelen_logo_alleen_letters.png").convert("RGBA")
SEAL_IMG = Image.open(WORKSPACE / "assets/sticker_certified_fitform.png").convert("RGBA")

# Colors
C_DARK = (15, 23, 42, 255)
C_WHITE = (255, 255, 255, 255)
C_FOREST = (75, 143, 36, 255)      # #4b8f24
C_FOREST_DARK = (26, 66, 11, 255)
C_TERRACOTTA = (243, 146, 35, 255)  # #f39223
C_GOLD = (254, 216, 87, 255)
C_CREAM = (250, 248, 245, 255)

AUDIO_FILE = "/tmp/pmax_voiceover_mix.aac"
FPS = 30
DURATION = 19.66
TOTAL_FRAMES = int(DURATION * FPS)


def get_ken_burns_crop(img: Image.Image, target_w: int, target_h: int, progress: float, zoom_in=True):
    iw, ih = img.size
    target_ratio = target_w / target_h
    img_ratio = iw / ih

    # Calculate base crop box
    if img_ratio > target_ratio:
        base_h = ih
        base_w = int(ih * target_ratio)
    else:
        base_w = iw
        base_h = int(iw / target_ratio)

    # Zoom factor (1.00 to 1.08)
    if zoom_in:
        scale = 1.0 - 0.08 * progress
    else:
        scale = 0.92 + 0.08 * progress

    crop_w = int(base_w * scale)
    crop_h = int(base_h * scale)

    # Center crop
    cx = iw // 2
    cy = ih // 2
    left = max(0, min(iw - crop_w, cx - crop_w // 2))
    top = max(0, min(ih - crop_h, cy - crop_h // 2))

    cropped = img.crop((left, top, left + crop_w, top + crop_h))
    return cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)


def render_video(is_vertical: bool):
    W = 1080
    H = 1920 if is_vertical else 1080
    mode_name = "Verticaal (9:16)" if is_vertical else "Vierkant (1:1)"
    out_filename = "2_Verticaal_9x16_Staopstoelen_PMax.mp4" if is_vertical else "1_Vierkant_1x1_Staopstoelen_PMax.mp4"
    out_path = DESKTOP_DIR / out_filename

    print(f"\n🎬 Start rendering {mode_name} ({W}x{H}) naar {out_filename}...")

    # Setup FFmpeg pipe
    cmd = [
        FFMPEG, '-y',
        '-f', 'rawvideo', '-vcodec', 'rawvideo', '-s', f'{W}x{H}',
        '-pix_fmt', 'rgba', '-r', str(FPS), '-i', '-',
        '-i', AUDIO_FILE,
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
        '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
        '-shortest', str(out_path)
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

    # Fonts sizing based on layout
    scale_factor = 1.15 if is_vertical else 1.0
    f_tag = ImageFont.truetype(FONT_BOLD, int(22 * scale_factor))
    f_title = ImageFont.truetype(FONT_XBOLD, int(42 * scale_factor))
    f_sub = ImageFont.truetype(FONT_SEMI, int(26 * scale_factor))
    f_contact = ImageFont.truetype(FONT_BOLD, int(24 * scale_factor))
    f_phone = ImageFont.truetype(FONT_XBOLD, int(28 * scale_factor))

    # 4 scenes timing (in seconds)
    s1_end = 4.90
    s2_end = 9.80
    s3_end = 14.70
    s4_end = 19.66

    for frame_idx in range(TOTAL_FRAMES):
        t = frame_idx / FPS

        # Determine current scene and scene progress
        if t < s1_end:
            scene = 1
            s_prog = t / s1_end
            bg_img = IMG_CHAIR
            tag = "ERGONOMISCH ZITCOMFORT"
            title = "Heerlijk Zitten,\nMakkelijk Opstaan"
            sub = "Nieuwe & Gereviseerde Fitform Stoelen"
        elif t < s2_end:
            scene = 2
            s_prog = (t - s1_end) / (s2_end - s1_end)
            bg_img = IMG_GEERTJAN
            tag = "BEWEGINGSTECHNOLOOG GEERTJAN"
            title = "5-Punts Ergonomische\nZitmeting op Maat"
            sub = "Zithoogte, zitdiepte, armleggers & lendensteun"
        elif t < s3_end:
            scene = 3
            s_prog = (t - s2_end) / (s3_end - s2_end)
            bg_img = IMG_SHOWROOM
            tag = "SHOWROOM DORDRECHT"
            title = "30+ Stoelen Direct\nUit Voorraad Leverbaar"
            sub = "1 Jaar Garantie aan Huis • Gratis Bezorgd"
        else:
            scene = 4
            s_prog = (t - s3_end) / (s4_end - s3_end)
            bg_img = IMG_PAND
            tag = "KOM VRIJBLIJVEND PROEFZITTEN"
            title = "Welkom in Onze Showroom\nSchipper Compact Wonen"
            sub = "Merwedestraat 239 • Dordrecht"

        # 1. Base Background with Ken Burns zoom
        frame = get_ken_burns_crop(bg_img, W, H, s_prog, zoom_in=(scene % 2 == 1)).convert("RGBA")

        # 2. Gradient vignette for ultra readability
        vignette = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        vdraw = ImageDraw.Draw(vignette)

        if is_vertical:
            # Vertical layout: dark overlays at top and bottom
            vdraw.rectangle([0, 0, W, 280], fill=(15, 23, 42, 180))
            vdraw.rectangle([0, H - 760, W, H], fill=(15, 23, 42, 235))
            # Subtle gradient transition
            for y in range(H - 850, H - 760):
                alpha = int(235 * ((y - (H - 850)) / 90))
                vdraw.line([(0, y), (W, y)], fill=(15, 23, 42, alpha))
        else:
            # Square layout: dark bottom overlay for card
            vdraw.rectangle([0, H - 460, W, H], fill=(15, 23, 42, 225))
            for y in range(H - 540, H - 460):
                alpha = int(225 * ((y - (H - 540)) / 80))
                vdraw.line([(0, y), (W, y)], fill=(15, 23, 42, alpha))

        frame = Image.alpha_composite(frame, vignette)
        draw = ImageDraw.Draw(frame)

        # 3. Header: Brand Logo & Top Accent Strip
        top_bar_h = 10 if not is_vertical else 14
        draw.rectangle([0, 0, W, top_bar_h], fill=C_TERRACOTTA)

        # Logo placement (Top Left)
        logo_w = 320 if is_vertical else 260
        logo_h = int(LOGO_IMG.height * (logo_w / LOGO_IMG.width))
        resized_logo = LOGO_IMG.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
        logo_y = 45 if is_vertical else 35
        frame.alpha_composite(resized_logo, (50, logo_y))

        # Certified Fitform Stamp (Top Right)
        seal_size = 140 if is_vertical else 115
        resized_seal = SEAL_IMG.resize((seal_size, seal_size), Image.Resampling.LANCZOS)
        frame.alpha_composite(resized_seal, (W - seal_size - 45, logo_y - 10))

        # 4. Floating Info Card (Bottom area)
        card_pad = 50
        if is_vertical:
            card_y = H - 690
        else:
            card_y = H - 420

        # Kicker Tag Pill
        tag_bbox = draw.textbbox((0, 0), tag, font=f_tag)
        tag_w = tag_bbox[2] - tag_bbox[0]
        tag_h = tag_bbox[3] - tag_bbox[1]
        pill_w = tag_w + 32
        pill_h = tag_h + 16
        draw.rounded_rectangle([card_pad, card_y, card_pad + pill_w, card_y + pill_h], radius=8, fill=C_FOREST_DARK if scene == 2 else C_TERRACOTTA)
        draw.text((card_pad + 16, card_y + 8), tag, font=f_tag, fill=C_WHITE)

        # Title
        title_y = card_y + pill_h + 16
        draw.text((card_pad, title_y), title, font=f_title, fill=C_WHITE, spacing=10)

        # Subtitle
        title_lines = title.count("\n") + 1
        sub_y = title_y + (title_lines * int(50 * scale_factor)) + 8
        draw.text((card_pad, sub_y), sub, font=f_sub, fill=C_GOLD)

        # 5. Scene 4 Call-to-Action Bar (Showroom Contact)
        if scene == 4:
            cta_y = sub_y + int(50 * scale_factor)
            cta_w = W - (2 * card_pad)
            cta_h = int(140 * scale_factor) if is_vertical else 110

            # CTA Pill Box
            draw.rounded_rectangle([card_pad, cta_y, card_pad + cta_w, cta_y + cta_h], radius=14, fill=C_FOREST)
            draw.rounded_rectangle([card_pad, cta_y, card_pad + cta_w, cta_y + cta_h], radius=14, outline=C_GOLD, width=3)

            phone_text = "📞 078 - 631 4858   💬 WhatsApp: 06 - 22 23 29 64"
            web_text = "Merwedestraat 239, Dordrecht • www.staopstoelen.nl"
            draw.text((card_pad + 24, cta_y + 16), phone_text, font=f_phone, fill=C_WHITE)
            draw.text((card_pad + 24, cta_y + 16 + int(42 * scale_factor)), web_text, font=f_contact, fill=C_GOLD)

        # Send raw frame to ffmpeg
        proc.stdin.write(frame.tobytes())

        if frame_idx % 60 == 0:
            pct = int((frame_idx / TOTAL_FRAMES) * 100)
            print(f"  [{pct}%] Frame {frame_idx}/{TOTAL_FRAMES} gereed...")

    proc.stdin.close()
    proc.wait()
    print(f"✅ {mode_name} succesvol gegenereerd: {out_path}")


def main():
    print("=" * 65)
    print("🎬 GENEREREN GOOGLE ADS PMAX VIDEO'S (1:1 VIERKANT & 9:16 VERTICAAL)")
    print(f"Map: {DESKTOP_DIR}")
    print("=" * 65)

    # Render Vierkant (1:1)
    render_video(is_vertical=False)

    # Render Verticaal (9:16)
    render_video(is_vertical=True)

    print("\n🎉 Beide video's zijn klaar en staan op je Bureaublad!")
    for f in DESKTOP_DIR.glob("*.mp4"):
        sz_mb = f.stat().st_size / (1024 * 1024)
        print(f"  📁 {f.name} ({sz_mb:.1f} MB)")


if __name__ == "__main__":
    main()
