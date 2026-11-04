#!/usr/bin/env python3
"""
scripts/generate_showroom_video.py
Genereert een vloeiende, cinematische 720p 30fps video rondleiding van de nieuwe showroom,
met transformaties van de oorspronkelijke POV foto's naar:
1) Stap 1: Nieuw interieur saliegroen (wipe naar rechts)
2) Extra Stap: Warm eiken visgraat PVC vloertje (wipe naar links)
Dit wordt 2x uitgevoerd: zowel voor de etalage als voor de centrale stoelenopstelling!
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

FONT_TITLE = load_font(30, bold=True)
FONT_SUB = load_font(19, bold=False)
FONT_BADGE = load_font(15, bold=True)
FONT_TAG = load_font(13, bold=True)

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
    
    if iw / ih > aspect:
        base_h = ih
        base_w = int(ih * aspect)
    else:
        base_w = iw
        base_h = int(iw / aspect)
        
    crop_w = int(base_w / zoom)
    crop_h = int(base_h / zoom)
    
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
    
    grad = Image.new("RGBA", (WIDTH, 140), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(grad)
    for y in range(140):
        alpha = int((y / 140.0) ** 1.5 * 180)
        g_draw.line([(0, y), (WIDTH, y)], fill=(15, 30, 20, alpha))
    frame.paste(grad, (0, HEIGHT - 140), grad)
    
    draw = ImageDraw.Draw(frame)
    base_y = HEIGHT - 95
    
    if badge_text:
        bbox = draw.textbbox((0, 0), badge_text, font=FONT_BADGE)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        bx = 50
        by = base_y - 28
        draw.rounded_rectangle([bx, by, bx + tw + 18, by + th + 10], radius=5, fill=badge_color)
        draw.text((bx + 9, by + 4), badge_text, fill=(255, 255, 255), font=FONT_BADGE)
        
    draw.text((50, base_y + 4), title, fill=(255, 255, 255), font=FONT_TITLE)
    draw.text((50, base_y + 40), subtitle, fill=(210, 230, 215), font=FONT_SUB)
    return frame

def draw_transition_wipe(frame_base, frame_overlay, progress, direction='ltr', 
                         label_base="ORIGINEEL", label_overlay="NIEUW ✦", 
                         line_color=(245, 140, 45, 240), overlay_tag_bg=(35, 95, 45, 225)):
    """
    Maakt een interactieve sliding wipe met verticale scheidslijn en subtiele glow-schaduw.
    - direction == 'ltr': schuift naar RECHTS (frame_overlay vult vanaf links).
    - direction == 'rtl': schuift naar LINKS (frame_overlay vult vanaf rechts).
    """
    p = ease_in_out(progress)
    res = Image.new("RGB", (WIDTH, HEIGHT))
    
    if direction == 'ltr':
        split_x = int(WIDTH * p)
        if split_x > 0:
            res.paste(frame_overlay.crop((0, 0, split_x, HEIGHT)), (0, 0))
        if split_x < WIDTH:
            res.paste(frame_base.crop((split_x, 0, WIDTH, HEIGHT)), (split_x, 0))
        tag_left_text = label_overlay
        tag_left_bg = overlay_tag_bg
        tag_right_text = label_base
        tag_right_bg = (15, 23, 42, 220)
    else:  # rtl (schuift naar links over het scherm)
        split_x = int(WIDTH * (1.0 - p))
        if split_x > 0:
            res.paste(frame_base.crop((0, 0, split_x, HEIGHT)), (0, 0))
        if split_x < WIDTH:
            res.paste(frame_overlay.crop((split_x, 0, WIDTH, HEIGHT)), (split_x, 0))
        tag_left_text = label_base
        tag_left_bg = (35, 95, 45, 220)
        tag_right_text = label_overlay
        tag_right_bg = overlay_tag_bg

    # Scheidslijn met warme glow
    draw = ImageDraw.Draw(res, "RGBA")
    glow_w = 10
    draw.rectangle([split_x - glow_w, 0, split_x + glow_w, HEIGHT], fill=(line_color[0], line_color[1], line_color[2], 70))
    line_w = 4
    draw.rectangle([split_x - line_w // 2, 0, split_x + line_w // 2, HEIGHT], fill=line_color)
    
    # Labels links en rechts van de scheidslijn
    if split_x > 155:
        bbox = draw.textbbox((0, 0), tag_left_text, font=FONT_TAG)
        tw = bbox[2] - bbox[0]
        draw.rounded_rectangle([split_x - tw - 24, 25, split_x - 12, 55], radius=5, fill=tag_left_bg)
        draw.text((split_x - tw - 18, 31), tag_left_text, fill=(255, 255, 255), font=FONT_TAG)
        
    if split_x < WIDTH - 155:
        bbox = draw.textbbox((0, 0), tag_right_text, font=FONT_TAG)
        tw = bbox[2] - bbox[0]
        draw.rounded_rectangle([split_x + 12, 25, split_x + tw + 24, 55], radius=5, fill=tag_right_bg)
        draw.text((split_x + 18, 31), tag_right_text, fill=(255, 255, 255), font=FONT_TAG)
        
    return res

def main():
    output_path = 'assets/showroom_rondleiding_merwedestraat.mp4'
    print(f"🎬 Start generatie van vernieuwde cinematische video mét Visgraat PVC: {output_path}")
    
    # Laad alle bronafbeeldingen
    img_pand_orig = Image.open('assets/pand.jpg').convert("RGB")
    img_pand_new = Image.open('assets/pand_makeover_huisstijl_merwedestraat.jpg').convert("RGB")
    
    img_orig_et = Image.open('assets/showroom_origineel_etalage.webp').convert("RGB")
    img_rend_et = Image.open('assets/showroom_render_etalage_merwedestraat.jpg').convert("RGB")
    img_visgraat_et = Image.open('assets/showroom_render_etalage_visgraat_pvc.jpg').convert("RGB")
    
    img_orig_st = Image.open('assets/showroom_origineel_stoelen.webp').convert("RGB")
    img_rend_st = Image.open('assets/showroom_render_stoelen_merwedestraat.jpg').convert("RGB")
    img_visgraat_st = Image.open('assets/showroom_render_stoelen_visgraat_pvc.jpg').convert("RGB")
    
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
    
    frame_idx = 0
    
    # -------------------------------------------------------------
    # SCENE 1: PUI & GEVEL MAKE-OVER (0 - 165 frames = 5.5s)
    # Grijze pui blijft behouden, borden & vlaggen naar huisstijl
    # -------------------------------------------------------------
    print("  ► Renderen Scene 1: Gevel Make-Over (Grijze pui, stoel in raam, borden & vlaggen)...")
    for f in range(165):
        t = f / 165.0
        zoom_orig = 1.0 + 0.06 * ease_in_out(t)
        zoom_new = 1.04 + 0.08 * ease_in_out(t)
        
        f_orig = get_cam_frame(img_pand_orig, zoom=zoom_orig, pan_x=0.0, pan_y=0.04 * ease_in_out(t))
        f_new = get_cam_frame(img_pand_new, zoom=zoom_new, pan_x=-0.01 * ease_in_out(t), pan_y=0.01)
        
        if f < 45:
            frame = f_orig
            frame = draw_lower_third(frame, "Winkelpand Merwedestraat 239", "Het vertrouwde adres van Schipper Compact Wonen in Dordrecht", "HUIDIGE GEVEL POV", (15, 23, 42))
        elif f < 115:
            st = (f - 45) / 70.0
            frame = draw_transition_wipe(f_orig, f_new, st, direction='ltr', label_base="ORIGINEEL", label_overlay="NIEUWE HUISSTIJL ✦", line_color=(245, 140, 45, 240), overlay_tag_bg=(35, 95, 45, 225))
            frame = draw_lower_third(frame, "Gevel Make-Over in Onze Huisstijl", "Grijze pui behouden • Nieuwe gevelborden, vlaggen en oranje stoel in raam", "GEVEL MAKE-OVER ✦", (220, 120, 30))
        else:
            frame = f_new
            frame = draw_lower_third(frame, "Grijze Pui met Staopstoelen Huisstijl", "Inclusief Certified Fitform borden, vlaggen en onze grijze bezorgbus", "NIEUWE GEVEL ✦", (35, 95, 45))
            
        writer.append_data(np.array(frame))
        frame_idx += 1
        
    # -------------------------------------------------------------
    # SCENE 2: ETALAGE TRANSFORMATIE (240 frames = 8.0s)
    # 1. Origineel (0 - 45)
    # 2. Swipe RECHTS naar Saliegroen interieur (45 - 105)
    # 3. Hold Saliegroen (105 - 135)
    # 4. Swipe LINKS naar Visgraat PVC Vloertje! (135 - 195)
    # 5. Hold Visgraat PVC (195 - 240)
    # -------------------------------------------------------------
    print("  ► Renderen Scene 2: Etalage Transformatie (Origineel -> Saliegroen -> Visgraat PVC)...")
    for f in range(240):
        t = f / 240.0
        zoom_orig = 1.0 + 0.05 * ease_in_out(t)
        zoom_rend = 1.04 + 0.06 * ease_in_out(t)
        zoom_vis = 1.06 + 0.07 * ease_in_out(t)
        
        f_orig = get_cam_frame(img_orig_et, zoom=zoom_orig, pan_x=0.02 * ease_in_out(t), pan_y=-0.02)
        f_rend = get_cam_frame(img_rend_et, zoom=zoom_rend, pan_x=-0.01 * ease_in_out(t), pan_y=-0.01)
        f_vis = get_cam_frame(img_visgraat_et, zoom=zoom_vis, pan_x=-0.02 * ease_in_out(t), pan_y=-0.01)
        
        if f < 45:
            # 1. Origineel
            frame = f_orig
            frame = draw_lower_third(frame, "Bestaande Situatie Etalage", "Brede glazen pui aan de straat met authentieke entreedeur", "ORIGINELE ETALAGE POV", (15, 23, 42))
        elif f < 105:
            # 2. Swipe naar RECHTS -> Saliegroen
            st = (f - 45) / 60.0
            frame = draw_transition_wipe(f_orig, f_rend, st, direction='ltr', label_base="ORIGINEEL", label_overlay="SALIEGROEN ✦", line_color=(245, 140, 45, 240), overlay_tag_bg=(35, 95, 45, 225))
            frame = draw_lower_third(frame, "Stap 1: Saliegroene Wanden & Rust in Etalage", "Monumentengroen houtwerk • Hero sta-op stoel met Dordts uitzicht", "STAP 1: SALIEGROEN ✦", (220, 120, 30))
        elif f < 135:
            # 3. Hold Saliegroen
            frame = f_rend
            frame = draw_lower_third(frame, "Etalage met Saliegroen & Monumentengroen", "100% behoud van het authentieke uitzicht op de Merwedestraat", "STAP 1: SALIEGROEN ✦", (35, 95, 45))
        elif f < 195:
            # 4. Swipe naar LINKS -> Visgraat PVC!
            st = (f - 135) / 60.0
            frame = draw_transition_wipe(f_rend, f_vis, st, direction='rtl', label_base="SALIEGROEN", label_overlay="VISGRAAT PVC ★", line_color=(245, 170, 30, 245), overlay_tag_bg=(217, 119, 6, 230))
            frame = draw_lower_third(frame, "Extra Stap: Warm Eiken Visgraat PVC Vloertje", "Luxe drempelloze visgraatstroken tot aan de pui en entree", "EXTRA STAP: VISGRAAT PVC ✨", (217, 119, 6))
        else:
            # 5. Hold Visgraat PVC
            frame = f_vis
            frame = draw_lower_third(frame, "Etalage met Eiken Visgraat & Hero Stoel", "Boutique uitstraling met 100% behoud van het Dordtse straatbeeld", "LUXE BOUTIQUE SFEER ✨", (180, 83, 9))
            
        writer.append_data(np.array(frame))
        frame_idx += 1

    # -------------------------------------------------------------
    # SCENE 3: STOELEN & ACHTERWAND TRANSFORMATIE (240 frames = 8.0s)
    # 1. Origineel (0 - 45)
    # 2. Swipe RECHTS naar Saliegroen interieur (45 - 105)
    # 3. Hold Saliegroen (105 - 135)
    # 4. Swipe LINKS naar Visgraat PVC Vloertje! (135 - 195)
    # 5. Hold Visgraat PVC (195 - 240)
    # -------------------------------------------------------------
    print("  ► Renderen Scene 3: Stoelenopstelling (Origineel -> Saliegroen -> Visgraat PVC)...")
    for f in range(240):
        t = f / 240.0
        zoom_orig = 1.0 + 0.05 * ease_in_out(t)
        zoom_rend = 1.04 + 0.06 * ease_in_out(t)
        zoom_vis = 1.06 + 0.07 * ease_in_out(t)
        
        f_orig = get_cam_frame(img_orig_st, zoom=zoom_orig, pan_x=0.03 * ease_in_out(t), pan_y=0.0)
        f_rend = get_cam_frame(img_rend_st, zoom=zoom_rend, pan_x=0.01 * ease_in_out(t), pan_y=0.01)
        f_vis = get_cam_frame(img_visgraat_st, zoom=zoom_vis, pan_x=0.01 * ease_in_out(t), pan_y=0.01)
        
        if f < 45:
            # 1. Origineel
            frame = f_orig
            frame = draw_lower_third(frame, "Bestaande Stoelenopstelling", "Ruime opstelling van sta-op stoelen op laminaatvloer", "HUIDIGE SHOWROOM POV", (15, 23, 42))
        elif f < 105:
            # 2. Swipe naar RECHTS -> Saliegroen
            st = (f - 45) / 60.0
            frame = draw_transition_wipe(f_orig, f_rend, st, direction='ltr', label_base="ORIGINEEL", label_overlay="SALIEGROEN ✦", line_color=(245, 140, 45, 240), overlay_tag_bg=(35, 95, 45, 225))
            frame = draw_lower_third(frame, "Stap 1: Warme Saliegroene Wanden & Sfeerverlichting", "Maakt van de showroom direct een gezellige, warme huiskamer", "STAP 1: SALIEGROEN ✦", (220, 120, 30))
        elif f < 135:
            # 3. Hold Saliegroen
            frame = f_rend
            frame = draw_lower_third(frame, "Certified Fitform Plaque & Meetstation", "Geertjan's 5-punts zitmeting spotlight en zorgbedden op de achtergrond", "STAP 1: SALIEGROEN ✦", (35, 95, 45))
        elif f < 195:
            # 4. Swipe naar LINKS -> Visgraat PVC!
            st = (f - 135) / 60.0
            frame = draw_transition_wipe(f_rend, f_vis, st, direction='rtl', label_base="SALIEGROEN", label_overlay="VISGRAAT PVC ★", line_color=(245, 170, 30, 245), overlay_tag_bg=(217, 119, 6, 230))
            frame = draw_lower_third(frame, "Extra Stap: Warm Eiken Visgraat PVC Vloertje", "Warm 90° eiken patroon vloeit naadloos door onder alle fauteuils", "EXTRA STAP: VISGRAAT PVC ✨", (217, 119, 6))
        else:
            # 5. Hold Visgraat PVC
            frame = f_vis
            frame = draw_lower_third(frame, "Zithoek met Warm Eiken Visgraat PVC", "Exclusieve, huiselijke sfeer voor ontspannen en deskundig proefzitten", "LUXE BOUTIQUE SFEER ✨", (180, 83, 9))
            
        writer.append_data(np.array(frame))
        frame_idx += 1

    last_scene_frame = frame.copy()

    # -------------------------------------------------------------
    # SCENE 4: BROADCAST KWALITEIT SLOTKAART (155 frames = 5.2s)
    # -------------------------------------------------------------
    print("  ► Renderen Scene 4: Broadcast Slotkaart (Huisstijl & Garanties)...")
    fade_frames = 15
    total_outro_frames = 155
    for f in range(total_outro_frames):
        t = f / float(total_outro_frames)
        zoom = 1.0 + 0.015 * ease_in_out(t)
        base_outro = get_cam_frame(img_outro, zoom=zoom, pan_x=0.0, pan_y=0.0)
        
        if f < fade_frames:
            blend_alpha = f / float(fade_frames)
            frame = Image.blend(last_scene_frame, base_outro, blend_alpha)
        else:
            frame = base_outro
            
        writer.append_data(np.array(frame))
        frame_idx += 1
        
    writer.close()
    
    # Poster afbeelding updaten
    poster_frame = get_cam_frame(img_pand_new, zoom=1.04, pan_x=-0.01, pan_y=0.01)
    poster_frame = draw_lower_third(poster_frame, "Showroom Dordrecht • Merwedestraat 239", "Grijze pui behouden • Nieuwe Staopstoelen huisstijl & bezorgbus", "BEKIJK RONDLEIDING ▶", (220, 120, 30))
    poster_frame.save('assets/showroom_video_poster.jpg', quality=95)
    poster_frame.save('assets/gevel_video_new_preview.jpg', quality=95)
    
    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"✅ Video succesvol gegenereerd: {output_path} ({file_size_mb:.2f} MB, {frame_idx} frames, {frame_idx/FPS:.1f} seconden)")

if __name__ == '__main__':
    main()
