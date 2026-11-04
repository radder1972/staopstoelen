#!/usr/bin/env python3
"""
scripts/generate_showroom_video.py
Genereert een vloeiende, cinematische 720p 30fps video rondleiding van de nieuwe showroom,
met transformaties van de oorspronkelijke POV foto's naar:
1) Gevel Make-Over (investering ca. € 1.750 - € 2.850)
2) Etalage: Stap 1 Saliegroen & Rust (investering ca. € 1.100 - € 2.200) -> Extra Stap: Visgraat PVC
3) Stoelenopstelling: 25 stoelen capaciteit (terugverdientijd: 2 à 3 stoelen!)
4) Volledige Investerings- & Rendementskaart (Quick Win: € 3.000 - € 4.500)
5) Broadcast Slotkaart met garanties en contact
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
    index = 1 if bold else 0
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
    return t * t * (3.0 - 2.0 * t)

def get_cam_frame(img, zoom=1.0, pan_x=0.0, pan_y=0.0):
    iw, ih = img.size
    aspect = WIDTH / HEIGHT
    
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
    else:
        split_x = int(WIDTH * (1.0 - p))
        if split_x > 0:
            res.paste(frame_base.crop((0, 0, split_x, HEIGHT)), (0, 0))
        if split_x < WIDTH:
            res.paste(frame_overlay.crop((split_x, 0, WIDTH, HEIGHT)), (split_x, 0))
        tag_left_text = label_base
        tag_left_bg = (35, 95, 45, 220)
        tag_right_text = label_overlay
        tag_right_bg = overlay_tag_bg

    draw = ImageDraw.Draw(res, "RGBA")
    glow_w = 10
    draw.rectangle([split_x - glow_w, 0, split_x + glow_w, HEIGHT], fill=(line_color[0], line_color[1], line_color[2], 70))
    line_w = 4
    draw.rectangle([split_x - line_w // 2, 0, split_x + line_w // 2, HEIGHT], fill=line_color)
    
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

def render_investment_card():
    img = Image.new('RGB', (WIDTH, HEIGHT), (16, 38, 20))
    overlay = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    o_draw = ImageDraw.Draw(overlay)
    for r in range(550, 100, -20):
        a = int(40 * (1 - r/550))
        o_draw.ellipse([WIDTH//2 - r, HEIGHT//2 - r, WIDTH//2 + r, HEIGHT//2 + r], fill=(235, 140, 45, a))
    img.paste(overlay, (0, 0), overlay)

    draw = ImageDraw.Draw(img)

    # Top Bar
    draw.text((WIDTH//2, 45), 'INVESTERING & BUSINESS CASE SHOWROOM', fill=(245, 170, 30), font=load_font(15, True), anchor='mm')
    draw.text((WIDTH//2, 80), 'Make-Over Merwedestraat 239 • Dordrecht', fill=(255, 255, 255), font=load_font(30, True), anchor='mm')
    draw.text((WIDTH//2, 115), 'Slimme Quick Win: Binnen 1 week gerealiseerd zónder ingrijpend sloopwerk', fill=(210, 230, 215), font=load_font(16, False), anchor='mm')

    # 3 Columns
    card_w = 360
    card_h = 420
    y_start = 145

    # Card 1: Gevel
    x1 = 60
    draw.rounded_rectangle([x1, y_start, x1 + card_w, y_start + card_h], radius=14, fill=(24, 55, 30), outline=(50, 105, 60), width=2)
    draw.rounded_rectangle([x1 + 20, y_start + 20, x1 + card_w - 20, y_start + 65], radius=8, fill=(35, 80, 42))
    draw.text((x1 + card_w//2, y_start + 42), '1. GEVEL MAKE-OVER', fill=(245, 170, 30), font=load_font(15, True), anchor='mm')
    draw.text((x1 + card_w//2, y_start + 105), '€ 1.750 - € 2.850', fill=(255, 255, 255), font=load_font(26, True), anchor='mm')
    draw.text((x1 + card_w//2, y_start + 130), 'excl. btw • inclusief montage', fill=(180, 210, 185), font=load_font(12, False), anchor='mm')
    bullets1 = [
        '• 10m Strakke witte Dibond gevelpanelen',
        '• UV-bestendige Staopstoelen belettering',
        '• 2x Schuine gevelvlaggen (45° houders)',
        '• Subtiele zandstraal raambelettering',
        '• Grijze pui behouden (geen sloopwerk)'
    ]
    by = y_start + 165
    for b in bullets1:
        draw.text((x1 + 25, by), b, fill=(225, 240, 230), font=load_font(14, False))
        by += 32
    draw.rounded_rectangle([x1 + 20, y_start + card_h - 55, x1 + card_w - 20, y_start + card_h - 20], radius=6, fill=(18, 43, 22))
    draw.text((x1 + card_w//2, y_start + card_h - 38), 'Directe stopkracht vanaf de straat', fill=(74, 222, 128), font=load_font(13, True), anchor='mm')

    # Card 2: Interieur Styling
    x2 = 460
    draw.rounded_rectangle([x2, y_start, x2 + card_w, y_start + card_h], radius=14, fill=(24, 55, 30), outline=(50, 105, 60), width=2)
    draw.rounded_rectangle([x2 + 20, y_start + 20, x2 + card_w - 20, y_start + 65], radius=8, fill=(35, 80, 42))
    draw.text((x2 + card_w//2, y_start + 42), '2. INTERIEUR STYLING', fill=(245, 170, 30), font=load_font(15, True), anchor='mm')
    draw.text((x2 + card_w//2, y_start + 105), '€ 1.100 - € 2.200', fill=(255, 255, 255), font=load_font(26, True), anchor='mm')
    draw.text((x2 + card_w//2, y_start + 130), 'excl. btw • snelle uitvoering', fill=(180, 210, 185), font=load_font(12, False), anchor='mm')
    bullets2 = [
        '• Achterwand & zijwanden in saliegroen',
        '• Akoestische eiken lattenwand om zuil',
        '• Verhoogd eiken podium in etalageruit',
        '• Gerichte 2700K spot op oranje stoel',
        '• Certified Fitform & meetprotocol borden'
    ]
    by = y_start + 165
    for b in bullets2:
        draw.text((x2 + 25, by), b, fill=(225, 240, 230), font=load_font(14, False))
        by += 32
    draw.rounded_rectangle([x2 + 20, y_start + card_h - 55, x2 + card_w - 20, y_start + card_h - 20], radius=6, fill=(18, 43, 22))
    draw.text((x2 + card_w//2, y_start + card_h - 38), 'Warme, huiselijke boutique sfeer', fill=(74, 222, 128), font=load_font(13, True), anchor='mm')

    # Card 3: Rendement
    x3 = 860
    draw.rounded_rectangle([x3, y_start, x3 + card_w, y_start + card_h], radius=14, fill=(35, 45, 25), outline=(235, 140, 45), width=2)
    draw.rounded_rectangle([x3 + 20, y_start + 20, x3 + card_w - 20, y_start + 65], radius=8, fill=(217, 119, 6))
    draw.text((x3 + card_w//2, y_start + 42), '3. BUSINESS CASE & RENDEMENT', fill=(255, 255, 255), font=load_font(14, True), anchor='mm')
    draw.text((x3 + card_w//2, y_start + 105), '2 à 3 Stoelen', fill=(245, 170, 30), font=load_font(26, True), anchor='mm')
    draw.text((x3 + card_w//2, y_start + 130), 'terugverdientijd complete make-over!', fill=(235, 190, 150), font=load_font(12, True), anchor='mm')
    bullets3 = [
        '• Totaal Quick Win: ca. € 3.000 - € 4.500',
        '• Ruimte voor 25 fauteuils (was slaapzone)',
        '• Directe stijging showroom-conversie',
        '• Professionele uitstraling op Marktplaats',
        '• Optioneel: Eiken visgraat PVC vloertje'
    ]
    by = y_start + 165
    for b in bullets3:
        draw.text((x3 + 25, by), b, fill=(245, 235, 220), font=load_font(14, False))
        by += 32
    draw.rounded_rectangle([x3 + 20, y_start + card_h - 55, x3 + card_w - 20, y_start + card_h - 20], radius=6, fill=(180, 83, 9))
    draw.text((x3 + card_w//2, y_start + card_h - 38), 'Zeer hoog rendement & snel terugverdiend', fill=(255, 255, 255), font=load_font(12.5, True), anchor='mm')

    # Bottom Ribbon
    draw.rounded_rectangle([60, 595, WIDTH - 60, 675], radius=12, fill=(235, 130, 35))
    draw.text((WIDTH//2, 622), 'TOTAAL QUICK WIN: CA. € 3.000,- TOT € 4.500,- EXCL. BTW', fill=(255, 255, 255), font=load_font(19, True), anchor='mm')
    draw.text((WIDTH//2, 650), 'Inclusief gevelplaten, vlaggen, raamfolie, saliegroene wanden, akoestische zuil en etalagepodium', fill=(255, 240, 225), font=load_font(13.5, False), anchor='mm')

    return img

def main():
    output_path = 'assets/showroom_rondleiding_merwedestraat.mp4'
    print(f"🎬 Start generatie van complete video mét Investerings- & Rendementsraming: {output_path}")
    
    img_pand_orig = Image.open('assets/pand.jpg').convert("RGB")
    img_pand_new = Image.open('assets/pand_makeover_huisstijl_merwedestraat.jpg').convert("RGB")
    
    img_orig_et = Image.open('assets/showroom_origineel_etalage.webp').convert("RGB")
    img_rend_et = Image.open('assets/showroom_render_etalage_merwedestraat.jpg').convert("RGB")
    img_visgraat_et = Image.open('assets/showroom_render_etalage_visgraat_pvc.jpg').convert("RGB")
    
    img_orig_st = Image.open('assets/showroom_origineel_stoelen.webp').convert("RGB")
    img_rend_st = Image.open('assets/showroom_render_stoelen_merwedestraat.jpg').convert("RGB")
    img_visgraat_st = Image.open('assets/showroom_render_stoelen_visgraat_pvc.jpg').convert("RGB")
    
    img_invest = render_investment_card()
    
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
    # -------------------------------------------------------------
    print("  ► Renderen Scene 1: Gevel Make-Over & Investering...")
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
            frame = draw_lower_third(frame, "Gevel Make-Over: ca. € 1.750 - € 2.850", "Grijze pui behouden • Nieuwe Dibond panelen, 45° vlaggen & oranje stoel", "GEVEL MAKE-OVER ✦", (220, 120, 30))
        else:
            frame = f_new
            frame = draw_lower_third(frame, "Nieuwe Gevel: ca. € 1.750 - € 2.850", "Inclusief Dibond beplating, vlaggen, raamfolie en montage", "INVESTERING GEVEL ✦", (35, 95, 45))
            
        writer.append_data(np.array(frame))
        frame_idx += 1
        
    # -------------------------------------------------------------
    # SCENE 2: ETALAGE TRANSFORMATIE (240 frames = 8.0s)
    # -------------------------------------------------------------
    print("  ► Renderen Scene 2: Etalage Transformatie...")
    for f in range(240):
        t = f / 240.0
        zoom_orig = 1.0 + 0.05 * ease_in_out(t)
        zoom_rend = 1.04 + 0.06 * ease_in_out(t)
        zoom_vis = 1.06 + 0.07 * ease_in_out(t)
        
        f_orig = get_cam_frame(img_orig_et, zoom=zoom_orig, pan_x=0.02 * ease_in_out(t), pan_y=-0.02)
        f_rend = get_cam_frame(img_rend_et, zoom=zoom_rend, pan_x=-0.01 * ease_in_out(t), pan_y=-0.01)
        f_vis = get_cam_frame(img_visgraat_et, zoom=zoom_vis, pan_x=-0.02 * ease_in_out(t), pan_y=-0.01)
        
        if f < 45:
            frame = f_orig
            frame = draw_lower_third(frame, "Bestaande Situatie Etalage", "Brede glazen pui aan de straat met authentieke entreedeur", "ORIGINELE ETALAGE POV", (15, 23, 42))
        elif f < 105:
            st = (f - 45) / 60.0
            frame = draw_transition_wipe(f_orig, f_rend, st, direction='ltr', label_base="ORIGINEEL", label_overlay="SALIEGROEN ✦", line_color=(245, 140, 45, 240), overlay_tag_bg=(35, 95, 45, 225))
            frame = draw_lower_third(frame, "Stap 1: Saliegroene Wanden & Rust in Etalage", "Investering styling & wanden ca. € 1.100 - € 2.200 • Oranje stoel in raam", "STAP 1: STYLING ✦", (220, 120, 30))
        elif f < 135:
            frame = f_rend
            frame = draw_lower_third(frame, "Styling & Wanden: ca. € 1.100 - € 2.200", "Saliegroen, akoestische zuil, etalagepodium en Fitform borden", "STAP 1: STYLING ✦", (35, 95, 45))
        elif f < 195:
            st = (f - 135) / 60.0
            frame = draw_transition_wipe(f_rend, f_vis, st, direction='rtl', label_base="SALIEGROEN", label_overlay="VISGRAAT PVC ★", line_color=(245, 170, 30, 245), overlay_tag_bg=(217, 119, 6, 230))
            frame = draw_lower_third(frame, "Extra Stap: Warm Eiken Visgraat PVC Vloertje", "Oranje Fitform trots in het raam • Optionele boutique upgrade", "EXTRA STAP: VISGRAAT PVC ✨", (217, 119, 6))
        else:
            frame = f_vis
            frame = draw_lower_third(frame, "Etalage met Eiken Visgraat & Hero Stoel", "Boutique uitstraling met 100% behoud van het Dordtse straatbeeld", "LUXE BOUTIQUE SFEER ✨", (180, 83, 9))
            
        writer.append_data(np.array(frame))
        frame_idx += 1

    # -------------------------------------------------------------
    # SCENE 3: STOELEN & ACHTERWAND (240 frames = 8.0s)
    # -------------------------------------------------------------
    print("  ► Renderen Scene 3: Stoelenopstelling & 25 Stoelen Capaciteit...")
    for f in range(240):
        t = f / 240.0
        zoom_orig = 1.0 + 0.05 * ease_in_out(t)
        zoom_rend = 1.04 + 0.06 * ease_in_out(t)
        zoom_vis = 1.06 + 0.07 * ease_in_out(t)
        
        f_orig = get_cam_frame(img_orig_st, zoom=zoom_orig, pan_x=0.03 * ease_in_out(t), pan_y=0.0)
        f_rend = get_cam_frame(img_rend_st, zoom=zoom_rend, pan_x=0.01 * ease_in_out(t), pan_y=0.01)
        f_vis = get_cam_frame(img_visgraat_st, zoom=zoom_vis, pan_x=0.01 * ease_in_out(t), pan_y=0.01)
        
        if f < 45:
            frame = f_orig
            frame = draw_lower_third(frame, "Bestaande Stoelenopstelling", "Ruime opstelling van sta-op stoelen op laminaatvloer", "HUIDIGE SHOWROOM POV", (15, 23, 42))
        elif f < 105:
            st = (f - 45) / 60.0
            frame = draw_transition_wipe(f_orig, f_rend, st, direction='ltr', label_base="ORIGINEEL", label_overlay="SALIEGROEN ✦", line_color=(245, 140, 45, 240), overlay_tag_bg=(35, 95, 45, 225))
            frame = draw_lower_third(frame, "Capaciteit voor 25 Fauteuils (was Slaapzone)", "Slaapzone vervangen door Occasion Galerij • Direct meer keuze", "25 STOELEN CAPACITEIT ✦", (220, 120, 30))
        elif f < 135:
            frame = f_rend
            frame = draw_lower_third(frame, "Certified Fitform Plaque & Meetstation", "Geertjan's 5-punts zitmeting spotlight en zorgbedden op de achtergrond", "STAP 1: SALIEGROEN ✦", (35, 95, 45))
        elif f < 195:
            st = (f - 135) / 60.0
            frame = draw_transition_wipe(f_rend, f_vis, st, direction='rtl', label_base="SALIEGROEN", label_overlay="VISGRAAT PVC ★", line_color=(245, 170, 30, 245), overlay_tag_bg=(217, 119, 6, 230))
            frame = draw_lower_third(frame, "Terugverdientijd: Slechts 2 à 3 Stoelen!", "Quick Win make-over al terugverdiend met 2 à 3 verkopen", "BUSINESS CASE ★", (217, 119, 6))
        else:
            frame = f_vis
            frame = draw_lower_third(frame, "Zithoek met Warm Eiken Visgraat PVC", "Exclusieve, huiselijke sfeer voor ontspannen en deskundig proefzitten", "LUXE BOUTIQUE SFEER ✨", (180, 83, 9))
            
        writer.append_data(np.array(frame))
        frame_idx += 1

    last_scene_frame = frame.copy()

    # -------------------------------------------------------------
    # SCENE 4: INVESTERINGS- & RENDEMENTSKAART (160 frames = 5.3s)
    # Volledig overzicht van de kosten en de business case!
    # -------------------------------------------------------------
    print("  ► Renderen Scene 4: Investerings- & Terugverdienoverzicht (Business Case)...")
    fade_frames = 15
    total_invest_frames = 160
    for f in range(total_invest_frames):
        t = f / float(total_invest_frames)
        zoom = 1.0 + 0.015 * ease_in_out(t)
        base_invest = get_cam_frame(img_invest, zoom=zoom, pan_x=0.0, pan_y=0.0)
        
        if f < fade_frames:
            blend_alpha = f / float(fade_frames)
            frame = Image.blend(last_scene_frame, base_invest, blend_alpha)
        else:
            frame = base_invest
            
        writer.append_data(np.array(frame))
        frame_idx += 1

    last_invest_frame = frame.copy()

    # -------------------------------------------------------------
    # SCENE 5: BROADCAST KWALITEIT SLOTKAART (140 frames = 4.7s)
    # -------------------------------------------------------------
    print("  ► Renderen Scene 5: Broadcast Slotkaart (Huisstijl, Adres & Contact)...")
    total_outro_frames = 140
    for f in range(total_outro_frames):
        t = f / float(total_outro_frames)
        zoom = 1.0 + 0.012 * ease_in_out(t)
        base_outro = get_cam_frame(img_outro, zoom=zoom, pan_x=0.0, pan_y=0.0)
        
        if f < fade_frames:
            blend_alpha = f / float(fade_frames)
            frame = Image.blend(last_invest_frame, base_outro, blend_alpha)
        else:
            frame = base_outro
            
        writer.append_data(np.array(frame))
        frame_idx += 1
        
    writer.close()
    
    poster_frame = get_cam_frame(img_pand_new, zoom=1.04, pan_x=-0.01, pan_y=0.01)
    poster_frame = draw_lower_third(poster_frame, "Showroom Dordrecht • Merwedestraat 239", "Grijze pui behouden • Nieuwe Staopstoelen huisstijl & bezorgbus", "BEKIJK RONDLEIDING ▶", (220, 120, 30))
    poster_frame.save('assets/showroom_video_poster.jpg', quality=95)
    poster_frame.save('assets/gevel_video_new_preview.jpg', quality=95)
    
    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"✅ Complete video succesvol gegenereerd: {output_path} ({file_size_mb:.2f} MB, {frame_idx} frames, {frame_idx/FPS:.1f} seconden)")

if __name__ == '__main__':
    main()
