#!/usr/bin/env python3
"""
scripts/generate_showroom_video.py
Genereert een vloeiende, cinematische 720p 30fps video rondleiding van de nieuwe showroom,
met transformaties van de oorspronkelijke POV foto's naar de nieuwe gerestylde 3D renders.
"""

import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio

WIDTH = 1280
HEIGHT = 720
FPS = 30
FONT_PATH = '/System/Library/Fonts/HelveticaNeue.ttc'

def load_font(size, bold=False):
    index = 1 if bold else 0  # 1 is often Bold in HelveticaNeue.ttc
    try:
        return ImageFont.truetype(FONT_PATH, size, index=index)
    except Exception:
        try:
            return ImageFont.truetype(FONT_PATH, size, index=0)
        except Exception:
            return ImageFont.load_default()

FONT_TITLE = load_font(32, bold=True)
FONT_SUB = load_font(20, bold=False)
FONT_BADGE = load_font(16, bold=True)
FONT_TAG = load_font(14, bold=True)

def ease_in_out(t):
    # Smooth Hermite interpolation
    return t * t * (3.0 - 2.0 * t)

def get_cam_frame(img, zoom=1.0, pan_x=0.0, pan_y=0.0):
    """
    Snijdt een 1280x720 venster uit img met een bepaalde zoomfactor en pan offset.
    pan_x en pan_y zijn genormaliseerd tussen -1.0 en 1.0.
    """
    iw, ih = img.size
    aspect = WIDTH / HEIGHT  # 16:9 = 1.777...
    
    # Bepaal maximale uitsnede met 16:9 verhouding
    if iw / ih > aspect:
        base_h = ih
        base_w = int(ih * aspect)
    else:
        base_w = iw
        base_h = int(iw / aspect)
        
    crop_w = int(base_w / zoom)
    crop_h = int(base_h / zoom)
    
    # Centreer en voeg pan toe
    max_pan_x = (iw - crop_w) / 2
    max_pan_y = (ih - crop_h) / 2
    
    center_x = iw / 2 + pan_x * max_pan_x * 0.8
    center_y = ih / 2 + pan_y * max_pan_y * 0.8
    
    x1 = max(0, min(iw - crop_w, int(center_x - crop_w / 2)))
    y1 = max(0, min(ih - crop_h, int(center_y - crop_h / 2)))
    x2 = x1 + crop_w
    y2 = y1 + crop_h
    
    cropped = img.crop((x1, y1, x2, y2))
    return cropped.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)

def draw_lower_third(frame, title, subtitle, badge_text=None, badge_color=(235, 130, 60)):
    """Voegt een subtiele, chique lower-third balk toe aan het frame."""
    draw = ImageDraw.Draw(frame, "RGBA")
    
    # Subtiele gradient overlay onderaan voor leesbaarheid
    grad = Image.new("RGBA", (WIDTH, 140), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(grad)
    for y in range(140):
        alpha = int((y / 140.0) ** 1.5 * 180)
        g_draw.line([(0, y), (WIDTH, y)], fill=(15, 30, 20, alpha))
    frame.paste(grad, (0, HEIGHT - 140), grad)
    
    # Teksten tekenen
    draw = ImageDraw.Draw(frame)
    base_y = HEIGHT - 95
    
    if badge_text:
        # Badge pill
        bbox = draw.textbbox((0, 0), badge_text, font=FONT_BADGE)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        bx = 50
        by = base_y - 28
        draw.rounded_rectangle([bx, by, bx + tw + 18, by + th + 10], radius=5, fill=badge_color)
        draw.text((bx + 9, by + 4), badge_text, fill=(255, 255, 255), font=FONT_BADGE)
        
    draw.text((50, base_y + 4), title, fill=(255, 255, 255), font=FONT_TITLE)
    draw.text((50, base_y + 42), subtitle, fill=(210, 230, 215), font=FONT_SUB)
    return frame

def draw_transition_wipe(frame_orig, frame_new, progress):
    """
    Maakt een soepele interactieve swipe/wipe met een verticale scheidslijn
    en subtiele glow-schaduw, zoals in professionele architectuur/interieur transformatievideo's.
    """
    p = ease_in_out(progress)
    split_x = int(WIDTH * p)
    
    res = Image.new("RGB", (WIDTH, HEIGHT))
    # Links de nieuwe render
    if split_x > 0:
        crop_new = frame_new.crop((0, 0, split_x, HEIGHT))
        res.paste(crop_new, (0, 0))
    # Rechts het origineel
    if split_x < WIDTH:
        crop_orig = frame_orig.crop((split_x, 0, WIDTH, HEIGHT))
        res.paste(crop_orig, (split_x, 0))
        
    # Scheidslijn met schaduw
    draw = ImageDraw.Draw(res, "RGBA")
    line_w = 4
    draw.rectangle([split_x - line_w // 2, 0, split_x + line_w // 2, HEIGHT], fill=(245, 140, 45, 240))
    # Kleine labels links en rechts van de scheidslijn
    if split_x > 140:
        draw.rounded_rectangle([split_x - 120, 25, split_x - 15, 55], radius=4, fill=(46, 104, 25, 210))
        draw.text((split_x - 105, 31), "NIEUW ✦", fill=(255, 255, 255), font=FONT_TAG)
    if split_x < WIDTH - 140:
        draw.rounded_rectangle([split_x + 15, 25, split_x + 120, 55], radius=4, fill=(15, 23, 42, 210))
        draw.text((split_x + 30, 31), "ORIGINEEL", fill=(255, 255, 255), font=FONT_TAG)
        
    return res

def draw_outro_card(progress):
    """Tekent een stijlvolle, chique slotkaart met logo, garanties en adres."""
    img = Image.new("RGB", (WIDTH, HEIGHT), (18, 43, 22))
    draw = ImageDraw.Draw(img, "RGBA")
    
    # Warme radiale achtergrond gloed in het midden
    p = ease_in_out(min(1.0, progress * 1.5))
    glow_alpha = int(45 * p)
    for r in range(400, 100, -20):
        draw.ellipse([WIDTH//2 - r, HEIGHT//2 - r, WIDTH//2 + r, HEIGHT//2 + r], fill=(235, 140, 45, int(glow_alpha * (1 - r/400))))
        
    draw = ImageDraw.Draw(img)
    # Probeer logo te laden
    logo_path = 'assets/staopstoelen_logo_alleen_letters.png'
    if os.path.exists(logo_path):
        try:
            logo = Image.open(logo_path).convert("RGBA")
            lw = 420
            lh = int(logo.height * (lw / logo.width))
            logo_resized = logo.resize((lw, lh), Image.Resampling.LANCZOS)
            img.paste(logo_resized, (WIDTH//2 - lw//2, 130), logo_resized)
        except Exception:
            draw.text((WIDTH//2, 170), "staopstoelen.nl", fill=(255, 255, 255), font=load_font(48, True), anchor="mm")
    else:
        draw.text((WIDTH//2, 170), "staopstoelen.nl", fill=(255, 255, 255), font=load_font(48, True), anchor="mm")
        
    # Subtitel
    draw.text((WIDTH//2, 255), "Specialist in ergonomisch zitcomfort • Bewegingstechnoloog Geertjan", fill=(200, 230, 205), font=load_font(21, False), anchor="mm")
    
    # 3 Bullet highlights
    badges = [
        "✓ 5-Punts Ergonomische Zitmeting",
        "✓ Certified Fitform Garantie aan Huis",
        "✓ Gratis Parkeren voor de Deur"
    ]
    bx_start = 140
    for i, b in enumerate(badges):
        bx = bx_start + i * 350
        draw.rounded_rectangle([bx, 310, bx + 320, 360], radius=8, fill=(28, 65, 33), outline=(60, 120, 70), width=1)
        draw.text((bx + 160, 335), b, fill=(240, 245, 240), font=load_font(15, True), anchor="mm")
        
    # Adres & Contact blok
    draw.rounded_rectangle([WIDTH//2 - 280, 410, WIDTH//2 + 280, 520], radius=12, fill=(24, 55, 28), outline=(235, 140, 45), width=2)
    draw.text((WIDTH//2, 442), "Showroom Dordrecht • Merwedestraat 239", fill=(255, 255, 255), font=load_font(23, True), anchor="mm")
    draw.text((WIDTH//2, 485), "Bel voor advies: 078 - 631 4858  •  WhatsApp: 06 - 22 23 29 64", fill=(235, 170, 110), font=load_font(18, True), anchor="mm")
    
    # CTA Knop
    draw.rounded_rectangle([WIDTH//2 - 180, 560, WIDTH//2 + 180, 625], radius=30, fill=(235, 130, 35))
    draw.text((WIDTH//2, 592), "Kom Gerust Proefzitten →", fill=(255, 255, 255), font=load_font(22, True), anchor="mm")
    
    return img

def main():
    output_path = 'assets/showroom_rondleiding_merwedestraat.mp4'
    print(f"🎬 Start generatie van vernieuwde cinematische video: {output_path}")
    
    # Laad alle bronafbeeldingen
    img_pand_orig = Image.open('assets/pand.jpg').convert("RGB")
    img_pand_new = Image.open('assets/pand_makeover_huisstijl_merwedestraat.jpg').convert("RGB")
    img_orig_et = Image.open('assets/showroom_origineel_etalage.webp').convert("RGB")
    img_rend_et = Image.open('assets/showroom_render_etalage_merwedestraat.jpg').convert("RGB")
    img_orig_st = Image.open('assets/showroom_origineel_stoelen.webp').convert("RGB")
    img_rend_st = Image.open('assets/showroom_render_stoelen_merwedestraat.jpg').convert("RGB")
    
    # Broadcast-kwaliteit slotkaart
    outro_path = 'assets/outro_card_broadcast.png'
    if not os.path.exists(outro_path):
        import subprocess
        subprocess.run(['python3', 'scripts/render_outro_card.py'], check=True)
    img_outro = Image.open(outro_path).convert("RGB")
    
    writer = imageio.get_writer(
        output_path,
        fps=FPS,
        codec='libx264',
        quality=8,
        pixelformat='yuv420p',
        ffmpeg_params=['-movflags', '+faststart']
    )
    
    total_frames = 640  # ~21.3 seconden @ 30 fps
    frame_idx = 0
    
    # -------------------------------------------------------------
    # SCENE 1: PUI & GEVEL MAKE-OVER (0 - 165 frames = 5.5s)
    # Grijze pui blijft behouden, borden & vlaggen naar huisstijl
    # -------------------------------------------------------------
    print("  ► Renderen Scene 1: Gevel Make-Over (Grijze pui, nieuwe borden & vlaggen)...")
    for f in range(165):
        t = f / 165.0
        zoom_orig = 1.0 + 0.06 * ease_in_out(t)
        zoom_new = 1.04 + 0.08 * ease_in_out(t)
        
        f_orig = get_cam_frame(img_pand_orig, zoom=zoom_orig, pan_x=0.0, pan_y=0.04 * ease_in_out(t))
        f_new = get_cam_frame(img_pand_new, zoom=zoom_new, pan_x=-0.01 * ease_in_out(t), pan_y=0.01)
        
        if f < 45:
            # Bestaande gevel
            frame = f_orig
            frame = draw_lower_third(frame, "Winkelpand Merwedestraat 239", "Het vertrouwde pand van Schipper Compact Wonen in Dordrecht", "HUIDIGE GEVEL POV", (15, 23, 42))
        elif f < 115:
            # Magische transformatie swipe
            st = (f - 45) / 70.0
            frame = draw_transition_wipe(f_orig, f_new, st)
            frame = draw_lower_third(frame, "Gevel Make-Over in Onze Huisstijl", "Grijze pui behouden • Nieuwe Staopstoelen gevelborden & vlaggen", "GEVEL MAKE-OVER ✦", (220, 120, 30))
        else:
            # Vernieuwde gevel met grijze bezorgbus
            frame = f_new
            frame = draw_lower_third(frame, "Grijze Pui met Staopstoelen Huisstijl", "Inclusief Certified Fitform borden, vlaggen en onze grijze bezorgbus", "NIEUWE GEVEL ✦", (35, 95, 45))
            
        writer.append_data(np.array(frame))
        frame_idx += 1
        
    # -------------------------------------------------------------
    # SCENE 2: ETALAGE TRANSFORMATIE (165 - 325 frames = 5.3s)
    # -------------------------------------------------------------
    print("  ► Renderen Scene 2: Etalage Transformatie (Origineel naar Nieuw)...")
    for f in range(160):
        t = f / 160.0
        zoom_orig = 1.0 + 0.06 * ease_in_out(t)
        zoom_rend = 1.06 + 0.08 * ease_in_out(t)
        
        f_orig = get_cam_frame(img_orig_et, zoom=zoom_orig, pan_x=0.02 * ease_in_out(t), pan_y=-0.02)
        f_rend = get_cam_frame(img_rend_et, zoom=zoom_rend, pan_x=-0.02 * ease_in_out(t), pan_y=-0.01)
        
        if f < 45:
            # Puur origineel
            frame = f_orig
            frame = draw_lower_third(frame, "Bestaande Situatie Etalage", "Brede glazen pui aan de straat met authentieke entreedeur", "ORIGINELE ETALAGE POV", (15, 23, 42))
        elif f < 110:
            # Magische swipe overgang
            st = (f - 45) / 65.0
            frame = draw_transition_wipe(f_orig, f_rend, st)
            frame = draw_lower_third(frame, "Transformatie naar Rust & Eiken Podium", "Vervangt rollators in het venster door een design blikvanger", "GERESTYLEDE ETALAGE", (220, 120, 30))
        else:
            # Puur nieuwe render
            frame = f_rend
            frame = draw_lower_third(frame, "Etalage met Eiken Podium & Hero Stoel", "100% behoud van het authentieke Dordtse uitzicht naar buiten", "NIEUWE IMPRESSIE ✦", (35, 95, 45))
            
        writer.append_data(np.array(frame))
        frame_idx += 1

    # -------------------------------------------------------------
    # SCENE 3: STOELEN & SALIEGROENE WAND (325 - 485 frames = 5.3s)
    # -------------------------------------------------------------
    print("  ► Renderen Scene 3: Stoelenopstelling & Saliegroene Wand...")
    for f in range(160):
        t = f / 160.0
        zoom_orig = 1.0 + 0.06 * ease_in_out(t)
        zoom_rend = 1.06 + 0.08 * ease_in_out(t)
        
        f_orig = get_cam_frame(img_orig_st, zoom=zoom_orig, pan_x=0.04 * ease_in_out(t), pan_y=0.0)
        f_rend = get_cam_frame(img_rend_st, zoom=zoom_rend, pan_x=0.02 * ease_in_out(t), pan_y=0.02 * ease_in_out(t))
        
        if f < 45:
            # Puur origineel
            frame = f_orig
            frame = draw_lower_third(frame, "Bestaande Stoelenopstelling", "Ruime opstelling van sta-op stoelen op laminaatvloer", "HUIDIGE SHOWROOM POV", (15, 23, 42))
        elif f < 110:
            # Magische swipe overgang
            st = (f - 45) / 65.0
            frame = draw_transition_wipe(f_orig, f_rend, st)
            frame = draw_lower_third(frame, "Warme Saliegroene Wanden & Sfeerverlichting", "Maakt van de ruimte direct een gezellige, warme huiskamer", "TRANSFORMATIE ✦", (220, 120, 30))
        else:
            # Puur nieuwe render
            frame = f_rend
            frame = draw_lower_third(frame, "Certified Fitform Plaque & Meetstation", "Geertjan's 5-punts zitmeting spotlight en zorgbedden op de achtergrond", "NIEUWE IMPRESSIE ✦", (35, 95, 45))
            
        writer.append_data(np.array(frame))
        frame_idx += 1

    last_scene_frame = frame.copy()

    # -------------------------------------------------------------
    # SCENE 4: BROADCAST KWALITEIT SLOTKAART (155 frames = 5.2s)
    # Bevat officieel logo, Certified Fitform zegel, 5-punts zitmeting,
    # 4 garanties, adres Dordrecht en directe telefoon & WhatsApp CTA.
    # -------------------------------------------------------------
    print("  ► Renderen Scene 4: Broadcast Slotkaart (Huisstijl & Garanties)...")
    fade_frames = 15
    total_outro_frames = 155
    for f in range(total_outro_frames):
        t = f / float(total_outro_frames)
        # Zeer subtiele, filmische slow-push zoom
        zoom = 1.0 + 0.015 * ease_in_out(t)
        base_outro = get_cam_frame(img_outro, zoom=zoom, pan_x=0.0, pan_y=0.0)
        
        if f < fade_frames:
            # Vloeiende cross-dissolve overgang vanaf Scene 3
            blend_alpha = f / float(fade_frames)
            frame = Image.blend(last_scene_frame, base_outro, blend_alpha)
        else:
            frame = base_outro
            
        writer.append_data(np.array(frame))
        frame_idx += 1
        
    writer.close()
    
    # Genereer tevens een haarscherpe poster afbeelding van de gevel make-over
    poster_frame = get_cam_frame(img_pand_new, zoom=1.04, pan_x=-0.01, pan_y=0.01)
    poster_frame = draw_lower_third(poster_frame, "Showroom Dordrecht • Merwedestraat 239", "Grijze pui behouden • Nieuwe Staopstoelen huisstijl & bezorgbus", "BEKIJK RONDLEIDING ▶", (220, 120, 30))
    poster_frame.save('assets/showroom_video_poster.jpg', quality=95)
    poster_frame.save('assets/gevel_video_new_preview.jpg', quality=95)
    print("📸 Posters opgeslagen: assets/showroom_video_poster.jpg en assets/gevel_video_new_preview.jpg")
    
    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"✅ Video succesvol gegenereerd: {output_path} ({file_size_mb:.2f} MB, {frame_idx} frames, {frame_idx/FPS:.1f} seconden)")

if __name__ == '__main__':
    main()

