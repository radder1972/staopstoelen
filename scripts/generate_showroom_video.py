#!/usr/bin/env python3
"""
scripts/generate_showroom_video.py
Genereert een hoogwaardige, cinematische showroom-transformatievideo (720p HD, 30fps)
van de winkel aan de Merwedestraat 239 in Dordrecht, gesynchroniseerd met de
professionele Nederlandse voice-over en achtergrondmuziek (master_soundtrack.m4a).

Verbeteringen:
1. Schone originele gevel-foto zonder kranten-tekstvlak onderin (volledig zicht op klinkerstraat).
2. Moderne broadcast lower-third kaarten met 3D groene sta-op stoel logo & voortgangsbalk.
3. Luxe Voor/Na wipe-slider met ronde schuifknop (‹ › pijltjes) en vector-badges (geen ontbrekende symbolen/tofu-blokjes).
4. Vloeiende crossfades tussen alle scènes met exact behoud van frame-aantallen (1415 frames = 47.17s) voor 100% audio-sync.
5. Dynamische 3-staps Investerings- & Business Case kaart (Scene 4) en Broadcast Slotkaart (Scene 5) gerenderd via Headless Chrome.
"""

import os
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio

WIDTH = 1280
HEIGHT = 720
FPS = 30
TOTAL_FRAMES = 320 + 300 + 270 + 315 + 210  # 1415 frames = 47.17s
FFMPEG = '/Users/matthiasradder/.local/bin/ffmpeg'

def get_font(size, bold=False):
    font_paths = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf"
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                idx = 1 if (bold and fp.endswith('.ttc')) else 0
                return ImageFont.truetype(fp, size, index=idx)
            except Exception:
                try:
                    return ImageFont.truetype(fp, size)
                except Exception:
                    pass
    return ImageFont.load_default()

FONT_BADGE = get_font(13, bold=True)
FONT_TITLE = get_font(26, bold=True)
FONT_SUB = get_font(16, bold=False)
FONT_TAG = get_font(13, bold=True)

# Preload brand assets for HUD overlays
CHAIR_ICON_PATH = 'assets/icons/stoel_logo_header_s2.png'
LOGO_TEXT_PATH = 'assets/staopstoelen_logo_cropped_transparent.png'

def load_hud_assets():
    chair_hud = None
    if os.path.exists(CHAIR_ICON_PATH):
        raw_c = Image.open(CHAIR_ICON_PATH).convert('RGBA')
        chair_hud = raw_c.resize((44, 44), Image.Resampling.LANCZOS)
        chair_small = raw_c.resize((26, 26), Image.Resampling.LANCZOS)
    else:
        chair_small = None

    logo_small = None
    if os.path.exists(LOGO_TEXT_PATH):
        raw_l = Image.open(LOGO_TEXT_PATH).convert('RGBA')
        lh = 20
        lw = int(raw_l.width * (lh / raw_l.height))
        logo_small = raw_l.resize((lw, lh), Image.Resampling.LANCZOS)

    return chair_hud, chair_small, logo_small

CHAIR_HUD, CHAIR_SMALL, LOGO_SMALL = load_hud_assets()

def load_and_prep(path, target_w=1480, target_h=832):
    """Laad afbeelding en schaal naar 16:9 met marge voor soepele Ken Burns beweging."""
    img = Image.open(path).convert('RGB')
    w, h = img.size
    target_ratio = target_w / target_h
    img_ratio = w / h
    if img_ratio > target_ratio:
        new_h = target_h
        new_w = int(new_h * img_ratio)
    else:
        new_w = target_w
        new_h = int(new_w / img_ratio)
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    return img.crop((left, top, left + target_w, top + target_h))

def ease_in_out(t):
    return t * t * (3.0 - 2.0 * t)

def get_cam_frame(img, zoom=1.0, pan_x=0.0, pan_y=0.0):
    """Subtiele Ken Burns camera pan & zoom."""
    w, h = img.size
    crop_w = WIDTH / zoom
    crop_h = HEIGHT / zoom
    max_dx = (w - crop_w) / 2.0
    max_dy = (h - crop_h) / 2.0
    cx = (w / 2.0) + (pan_x * max_dx)
    cy = (h / 2.0) + (pan_y * max_dy)
    left = max(0, min(w - crop_w, cx - crop_w / 2.0))
    top = max(0, min(h - crop_h, cy - crop_h / 2.0))
    cropped = img.crop((int(left), int(top), int(left + crop_w), int(top + crop_h)))
    return cropped.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)

def draw_diamond_star(draw, cx, cy, r, fill):
    """Tekent een strakke 4-punts ster (vervangt ✦ / ★ / ✨ zonder ontbrekende font-glyphs)."""
    r_in = r * 0.38
    pts = [
        (cx, cy - r),
        (cx + r_in, cy - r_in),
        (cx + r, cy),
        (cx + r_in, cy + r_in),
        (cx, cy + r),
        (cx - r_in, cy + r_in),
        (cx - r, cy),
        (cx - r_in, cy - r_in),
    ]
    draw.polygon(pts, fill=fill)

def draw_top_brand_pill(frame):
    """Subtiele huisstijl-pill linksboven met het nieuwe 3D groene sta-op stoel icoon."""
    overlay = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    px, py = 36, 22
    pw, ph = 206, 38
    draw.rounded_rectangle([px, py + 2, px + pw, py + ph + 2], radius=19, fill=(0, 0, 0, 65))
    draw.rounded_rectangle([px, py, px + pw, py + ph], radius=19, fill=(255, 255, 255, 238), outline=(216, 230, 217, 255), width=1)
    if CHAIR_SMALL is not None:
        overlay.paste(CHAIR_SMALL, (px + 8, py + 6), CHAIR_SMALL)
    if LOGO_SMALL is not None:
        overlay.paste(LOGO_SMALL, (px + 40, py + 9), LOGO_SMALL)
    return Image.alpha_composite(frame.convert('RGBA'), overlay).convert('RGB')

def draw_lower_third(frame, title, subtitle, badge_text, badge_color=(243, 146, 35), global_progress=0.0, is_play_icon=False):
    """Moderne broadcast lower-third kaart met 3D stoel-icoon, vector-badge en voortgangsbalk."""
    overlay = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Zachte onderste vignette voor extra diepte
    for y in range(HEIGHT - 160, HEIGHT):
        alpha = int(115 * ((y - (HEIGHT - 160)) / 160.0) ** 1.4)
        draw.line([(0, y), (WIDTH, y)], fill=(8, 18, 10, alpha))

    # Broadcast kaart afmetingen
    card_x = 36
    card_y = HEIGHT - 126
    tb_title = draw.textbbox((0, 0), title, font=FONT_TITLE)
    tb_sub = draw.textbbox((0, 0), subtitle, font=FONT_SUB)
    text_w = max(tb_title[2] - tb_title[0], tb_sub[2] - tb_sub[0])
    card_w = min(WIDTH - 72, max(580, text_w + 135))
    card_h = 98

    # Schaduw + Glassmorphic kaart achtergrond
    draw.rounded_rectangle([card_x, card_y + 4, card_x + card_w, card_y + card_h + 4], radius=18, fill=(0, 0, 0, 110))
    draw.rounded_rectangle(
        [card_x, card_y, card_x + card_w, card_y + card_h],
        radius=18,
        fill=(14, 31, 18, 232),
        outline=(255, 255, 255, 45),
        width=1
    )

    # Gekleurde linker accent-balk binnen de kaart
    draw.rounded_rectangle([card_x + 8, card_y + 12, card_x + 14, card_y + card_h - 12], radius=3, fill=badge_color + (255,))

    # Witte cirkel met ons nieuwe 3D groene sta-op stoel logo
    circle_cx, circle_cy, circle_r = card_x + 50, card_y + card_h // 2, 27
    draw.ellipse([circle_cx - circle_r, circle_cy - circle_r, circle_cx + circle_r, circle_cy + circle_r], fill=(255, 255, 255, 250), outline=(210, 230, 212, 255), width=2)
    if CHAIR_HUD is not None:
        overlay.paste(CHAIR_HUD, (circle_cx - 22, circle_cy - 22), CHAIR_HUD)

    # Badge pill boven de kaart (links uitgelijnd met de tekst)
    tx = card_x + 92
    clean_badge = badge_text.replace('✦', '').replace('★', '').replace('✨', '').replace('▶', '').strip()
    tb_badge = draw.textbbox((0, 0), clean_badge, font=FONT_BADGE)
    bw = (tb_badge[2] - tb_badge[0]) + 40
    bh = 25
    by = card_y - 13

    draw.rounded_rectangle([tx, by + 2, tx + bw, by + bh + 2], radius=12, fill=(0, 0, 0, 90))
    draw.rounded_rectangle([tx, by, tx + bw, by + bh], radius=12, fill=badge_color + (255,), outline=(255, 255, 255, 90), width=1)

    # Vector icoon in de badge (play-driehoek of 4-punts ster)
    ic_x = tx + 14
    ic_y = by + bh // 2
    if is_play_icon:
        draw.polygon([(ic_x - 4, ic_y - 5), (ic_x - 4, ic_y + 5), (ic_x + 5, ic_y)], fill=(255, 255, 255, 255))
    else:
        draw_diamond_star(draw, ic_x, ic_y, 5.5, (255, 255, 255, 255))

    draw.text((tx + 25, by + 5), clean_badge, font=FONT_BADGE, fill=(255, 255, 255, 255))

    # Hoofdtitel & Subtitel in de kaart
    draw.text((tx, card_y + 19), title, font=FONT_TITLE, fill=(255, 255, 255, 255))
    draw.text((tx, card_y + 55), subtitle, font=FONT_SUB, fill=(208, 228, 212, 255))

    # Subtiele voortgangsbalk helemaal onderaan het frame
    if global_progress > 0:
        bar_h = 4
        draw.rectangle([0, HEIGHT - bar_h, WIDTH, HEIGHT], fill=(255, 255, 255, 35))
        prog_w = int(WIDTH * min(1.0, max(0.0, global_progress)))
        draw.rectangle([0, HEIGHT - bar_h, prog_w, HEIGHT], fill=(243, 146, 35, 240))

    return Image.alpha_composite(frame.convert('RGBA'), overlay).convert('RGB')

def draw_pill_tag(draw, x, y, text, bg_rgba, has_star=False, align_right=False):
    clean_t = text.replace('✦', '').replace('★', '').replace('✨', '').strip()
    tb = draw.textbbox((0, 0), clean_t, font=FONT_TAG)
    tw = tb[2] - tb[0]
    pad_l = 28 if has_star else 16
    pw = tw + pad_l + 16
    ph = 32
    rx = (x - pw) if align_right else x

    draw.rounded_rectangle([rx, y + 2, rx + pw, y + ph + 2], radius=16, fill=(0, 0, 0, 85))
    draw.rounded_rectangle([rx, y, rx + pw, y + ph], radius=16, fill=bg_rgba, outline=(255, 255, 255, 110), width=1)
    if has_star:
        draw_diamond_star(draw, rx + 15, y + ph // 2, 5.5, (255, 225, 130, 255))
    draw.text((rx + pad_l, y + 8), clean_t, font=FONT_TAG, fill=(255, 255, 255, 255))

def draw_transition_wipe(frame_base, frame_overlay, progress, direction='ltr', label_base="VOOR • ORIGINEEL", label_overlay="NA • NIEUWE HUISSTIJL", line_color=(245, 140, 45, 250), overlay_tag_bg=(35, 95, 45, 235)):
    """Luxe Voor/Na wipe-transformatie met centrale ronde schuifknop (‹ ›) en strakke pill-tags."""
    p = ease_in_out(max(0.0, min(1.0, progress)))
    comp = frame_base.copy()
    if direction == 'ltr':
        split_x = int(WIDTH * p)
        if split_x > 0:
            crop_over = frame_overlay.crop((0, 0, split_x, HEIGHT))
            comp.paste(crop_over, (0, 0))
    else:
        split_x = int(WIDTH * (1.0 - p))
        if split_x < WIDTH:
            crop_over = frame_overlay.crop((split_x, 0, WIDTH, HEIGHT))
            comp.paste(crop_over, (split_x, 0))

    overlay = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    if 12 < split_x < WIDTH - 12:
        # Zachte gloed + scherpe verticale scheidingslijn
        draw.line([(split_x, 0), (split_x, HEIGHT)], fill=(0, 0, 0, 95), width=12)
        draw.line([(split_x, 0), (split_x, HEIGHT)], fill=line_color, width=4)
        draw.line([(split_x, 0), (split_x, HEIGHT)], fill=(255, 255, 255, 220), width=1)

        # Ronde interactieve slider-handle in het midden
        cy = HEIGHT // 2 - 22
        hr = 22
        draw.ellipse([split_x - hr, cy - hr + 3, split_x + hr, cy + hr + 3], fill=(0, 0, 0, 110))
        draw.ellipse([split_x - hr, cy - hr, split_x + hr, cy + hr], fill=line_color[:3] + (255,), outline=(255, 255, 255, 255), width=3)

        # Linker chevron ‹ en rechter chevron › in de ronde knop
        # Links ‹
        draw.line([(split_x - 5, cy - 6), (split_x - 11, cy), (split_x - 5, cy + 6)], fill=(255, 255, 255, 255), width=2)
        # Rechts ›
        draw.line([(split_x + 5, cy - 6), (split_x + 11, cy), (split_x + 5, cy + 6)], fill=(255, 255, 255, 255), width=2)

    # Voor / Na labels aan weerszijden van de slider-lijn (bovenaan y=24)
    tag_y = 24
    if direction == 'ltr':
        if split_x > 450:
            draw_pill_tag(draw, split_x - 18, tag_y, label_overlay, overlay_tag_bg, has_star=True, align_right=True)
        if split_x < WIDTH - 200:
            draw_pill_tag(draw, split_x + 18, tag_y, label_base, (15, 23, 42, 220), has_star=False, align_right=False)
    else:
        if split_x > 430:
            draw_pill_tag(draw, split_x - 18, tag_y, label_base, (35, 95, 45, 220), has_star=False, align_right=True)
        if split_x < WIDTH - 250:
            draw_pill_tag(draw, split_x + 18, tag_y, label_overlay, overlay_tag_bg, has_star=True, align_right=False)

    return Image.alpha_composite(comp.convert('RGBA'), overlay).convert('RGB')

def main():
    print("🚀 Start genereren van vernieuwde Showroom Transformatie Video (Merwedestraat 239)...")
    # Render eerst de allernieuwste Scene 4 & Scene 5 kaarten via Chrome
    subprocess.run(['python3', 'scripts/render_outro_card.py'], check=True)

    # 1. Bron-afbeeldingen inladen
    img_pand_orig = load_and_prep('assets/pand_clean_straat.jpg' if os.path.exists('assets/pand_clean_straat.jpg') else 'assets/pand.jpg')
    img_pand_new = load_and_prep('assets/pand_makeover_huisstijl_merwedestraat.jpg')

    img_orig_et = load_and_prep('assets/showroom_origineel_etalage.webp')
    img_rend_et = load_and_prep('assets/showroom_render_etalage_merwedestraat.jpg')
    img_visgraat_et = load_and_prep('assets/showroom_render_etalage_visgraat_pvc.jpg')

    img_orig_st = load_and_prep('assets/showroom_origineel_stoelen.webp')
    img_rend_st = load_and_prep('assets/showroom_render_stoelen_merwedestraat.jpg')
    img_visgraat_st = load_and_prep('assets/showroom_render_stoelen_visgraat_pvc.jpg')

    # Scene 4: 3 dynamische stappen van de investeringskaart
    img_inv1 = load_and_prep('assets/invest_card_step1.png', target_w=1310, target_h=737)
    img_inv2 = load_and_prep('assets/invest_card_step2.png', target_w=1310, target_h=737)
    img_inv3 = load_and_prep('assets/invest_card_step3.png', target_w=1310, target_h=737)

    # Scene 5: Broadcast Slotkaart
    img_outro = load_and_prep('assets/outro_card_broadcast.png', target_w=1310, target_h=737)

    temp_raw_video = '/tmp/showroom_raw_silent.mp4'
    final_video_path = 'assets/showroom_rondleiding_merwedestraat.mp4'
    master_audio = 'assets/audio/showroom_video/master_soundtrack.m4a'

    writer = imageio.get_writer(
        temp_raw_video,
        fps=FPS,
        codec='libx264',
        quality=9,
        pixelformat='yuv420p',
        macro_block_size=16
    )

    frame_idx = 0
    fade_len = 15

    # -------------------------------------------------------------
    # SCENE 1: GEVEL MAKE-OVER (320 frames = 10.67s)
    # -------------------------------------------------------------
    print("  ► Renderen Scene 1: Gevel Make-Over (320 frames)...")
    for f in range(320):
        t = f / 320.0
        prog = frame_idx / float(TOTAL_FRAMES)
        zoom_orig = 1.0 + 0.05 * ease_in_out(t)
        zoom_new = 1.02 + 0.06 * ease_in_out(t)

        f_orig = get_cam_frame(img_pand_orig, zoom=zoom_orig, pan_x=0.0, pan_y=0.02 * ease_in_out(t))
        f_new = get_cam_frame(img_pand_new, zoom=zoom_new, pan_x=-0.01 * ease_in_out(t), pan_y=0.01)

        if f < 75:
            frame = draw_top_brand_pill(f_orig)
            frame = draw_lower_third(frame, "Winkelpand Merwedestraat 239", "Het vertrouwde adres van Schipper Compact Wonen in Dordrecht", "HUIDIGE GEVEL POV", (30, 58, 138), prog)
        elif f < 195:
            st = (f - 75) / 120.0
            frame = draw_transition_wipe(f_orig, f_new, st, direction='ltr', label_base="VOOR • ORIGINEEL", label_overlay="NA • NIEUWE HUISSTIJL", line_color=(243, 146, 35, 250), overlay_tag_bg=(35, 95, 45, 235))
            frame = draw_top_brand_pill(frame)
            frame = draw_lower_third(frame, "Gevel Make-Over: ca. € 1.750 - € 2.850", "Grijze pui behouden • Nieuwe Dibond panelen, 45° vlaggen & oranje stoel", "GEVEL MAKE-OVER", (220, 110, 25), prog)
        else:
            frame = draw_top_brand_pill(f_new)
            frame = draw_lower_third(frame, "Nieuwe Gevel: ca. € 1.750 - € 2.850", "Inclusief Dibond beplating, vlaggen, raamfolie en vakkundige montage", "INVESTERING GEVEL", (46, 104, 25), prog)

        writer.append_data(np.array(frame))
        frame_idx += 1

    prev_scene_last = frame.copy()

    # -------------------------------------------------------------
    # SCENE 2: ETALAGE TRANSFORMATIE (300 frames = 10.0s)
    # -------------------------------------------------------------
    print("  ► Renderen Scene 2: Etalage Transformatie (300 frames)...")
    for f in range(300):
        t = f / 300.0
        prog = frame_idx / float(TOTAL_FRAMES)
        zoom_orig = 1.0 + 0.05 * ease_in_out(t)
        zoom_rend = 1.04 + 0.06 * ease_in_out(t)
        zoom_vis = 1.06 + 0.07 * ease_in_out(t)

        f_orig = get_cam_frame(img_orig_et, zoom=zoom_orig, pan_x=0.02 * ease_in_out(t), pan_y=-0.02)
        f_rend = get_cam_frame(img_rend_et, zoom=zoom_rend, pan_x=-0.01 * ease_in_out(t), pan_y=-0.01)
        f_vis = get_cam_frame(img_visgraat_et, zoom=zoom_vis, pan_x=-0.02 * ease_in_out(t), pan_y=-0.01)

        if f < 45:
            frame = draw_top_brand_pill(f_orig)
            frame = draw_lower_third(frame, "Bestaande Situatie Etalage", "Brede glazen pui aan de straat met authentieke entreedeur", "ORIGINELE ETALAGE POV", (30, 58, 138), prog)
        elif f < 135:
            st = (f - 45) / 90.0
            frame = draw_transition_wipe(f_orig, f_rend, st, direction='ltr', label_base="VOOR • ORIGINEEL", label_overlay="STAP 1 • SALIEGROEN", line_color=(243, 146, 35, 250), overlay_tag_bg=(35, 95, 45, 235))
            frame = draw_top_brand_pill(frame)
            frame = draw_lower_third(frame, "Stap 1: Saliegroene Wanden & Rust in Etalage", "Investering styling & wanden ca. € 1.100 - € 2.200 • Oranje stoel in raam", "STAP 1: STYLING", (220, 110, 25), prog)
        elif f < 165:
            frame = draw_top_brand_pill(f_rend)
            frame = draw_lower_third(frame, "Styling & Wanden: ca. € 1.100 - € 2.200", "Saliegroen, akoestische zuil, etalagepodium en Fitform keurmerkborden", "STAP 1: STYLING", (46, 104, 25), prog)
        elif f < 255:
            st = (f - 165) / 90.0
            frame = draw_transition_wipe(f_rend, f_vis, st, direction='rtl', label_base="STAP 1 • SALIEGROEN", label_overlay="EXTRA • VISGRAAT PVC", line_color=(245, 165, 25, 250), overlay_tag_bg=(194, 65, 12, 235))
            frame = draw_top_brand_pill(frame)
            frame = draw_lower_third(frame, "Extra Stap: Warm Eiken Visgraat PVC Vloertje", "Oranje Fitform trots in het raam • Optionele boutique vloer-upgrade", "EXTRA STAP: VISGRAAT PVC", (217, 119, 6), prog)
        else:
            frame = draw_top_brand_pill(f_vis)
            frame = draw_lower_third(frame, "Etalage met Eiken Visgraat & Hero Stoel", "Boutique uitstraling met 100% behoud van het Dordtse straatbeeld", "LUXE BOUTIQUE SFEER", (180, 83, 9), prog)

        if f < fade_len:
            frame = Image.blend(prev_scene_last, frame, ease_in_out(f / float(fade_len)))

        writer.append_data(np.array(frame))
        frame_idx += 1

    prev_scene_last = frame.copy()

    # -------------------------------------------------------------
    # SCENE 3: STOELEN & ACHTERWAND (270 frames = 9.0s)
    # -------------------------------------------------------------
    print("  ► Renderen Scene 3: Stoelenopstelling & 25 Stoelen (270 frames)...")
    for f in range(270):
        t = f / 270.0
        prog = frame_idx / float(TOTAL_FRAMES)
        zoom_orig = 1.0 + 0.05 * ease_in_out(t)
        zoom_rend = 1.04 + 0.06 * ease_in_out(t)
        zoom_vis = 1.06 + 0.07 * ease_in_out(t)

        f_orig = get_cam_frame(img_orig_st, zoom=zoom_orig, pan_x=0.03 * ease_in_out(t), pan_y=0.0)
        f_rend = get_cam_frame(img_rend_st, zoom=zoom_rend, pan_x=0.01 * ease_in_out(t), pan_y=0.01)
        f_vis = get_cam_frame(img_visgraat_st, zoom=zoom_vis, pan_x=0.01 * ease_in_out(t), pan_y=0.01)

        if f < 45:
            frame = draw_top_brand_pill(f_orig)
            frame = draw_lower_third(frame, "Bestaande Stoelenopstelling", "Ruime opstelling van sta-op stoelen op de huidige vloer", "HUIDIGE SHOWROOM POV", (30, 58, 138), prog)
        elif f < 125:
            st = (f - 45) / 80.0
            frame = draw_transition_wipe(f_orig, f_rend, st, direction='ltr', label_base="VOOR • ORIGINEEL", label_overlay="STAP 1 • SALIEGROEN", line_color=(243, 146, 35, 250), overlay_tag_bg=(35, 95, 45, 235))
            frame = draw_top_brand_pill(frame)
            frame = draw_lower_third(frame, "Capaciteit voor 25 Fauteuils (was Slaapzone)", "Slaapzone vervangen door Occasion Galerij • Direct meer keuze", "25 STOELEN CAPACITEIT", (220, 110, 25), prog)
        elif f < 155:
            frame = draw_top_brand_pill(f_rend)
            frame = draw_lower_third(frame, "Certified Fitform Plaque & Meetstation", "Geertjan's 5-punts zitmeting spotlight en keurmerkborden aan de wand", "STAP 1: SALIEGROEN", (46, 104, 25), prog)
        elif f < 235:
            st = (f - 155) / 80.0
            frame = draw_transition_wipe(f_rend, f_vis, st, direction='rtl', label_base="STAP 1 • SALIEGROEN", label_overlay="EXTRA • VISGRAAT PVC", line_color=(245, 165, 25, 250), overlay_tag_bg=(194, 65, 12, 235))
            frame = draw_top_brand_pill(frame)
            frame = draw_lower_third(frame, "Terugverdientijd: Slechts 2 à 3 Stoelen!", "Quick Win make-over al volledig terugverdiend met 2 à 3 verkopen", "BUSINESS CASE & ROI", (217, 119, 6), prog)
        else:
            frame = draw_top_brand_pill(f_vis)
            frame = draw_lower_third(frame, "Zithoek met Warm Eiken Visgraat PVC", "Exclusieve, huiselijke sfeer voor ontspannen en deskundig proefzitten", "LUXE BOUTIQUE SFEER", (180, 83, 9), prog)

        if f < fade_len:
            frame = Image.blend(prev_scene_last, frame, ease_in_out(f / float(fade_len)))

        writer.append_data(np.array(frame))
        frame_idx += 1

    prev_scene_last = frame.copy()

    # -------------------------------------------------------------
    # SCENE 4: INVESTERINGS- & RENDEMENTSKAART (315 frames = 10.5s)
    # Dynamische highlight van Kolom 1 -> Kolom 2 -> Kolom 3 & Totaal
    # -------------------------------------------------------------
    print("  ► Renderen Scene 4: Dynamische Investerings- & Business Case Kaart (315 frames)...")
    for f in range(315):
        t = f / 315.0
        zoom = 1.0 + 0.015 * ease_in_out(t)
        c1 = get_cam_frame(img_inv1, zoom=zoom, pan_x=0.0, pan_y=0.0)
        c2 = get_cam_frame(img_inv2, zoom=zoom, pan_x=0.0, pan_y=0.0)
        c3 = get_cam_frame(img_inv3, zoom=zoom, pan_x=0.0, pan_y=0.0)

        if f < 95:
            base_invest = c1
        elif f < 110:
            base_invest = Image.blend(c1, c2, ease_in_out((f - 95) / 15.0))
        elif f < 195:
            base_invest = c2
        elif f < 210:
            base_invest = Image.blend(c2, c3, ease_in_out((f - 195) / 15.0))
        else:
            base_invest = c3

        if f < fade_len:
            frame = Image.blend(prev_scene_last, base_invest, ease_in_out(f / float(fade_len)))
        else:
            frame = base_invest

        writer.append_data(np.array(frame))
        frame_idx += 1

    prev_scene_last = frame.copy()

    # -------------------------------------------------------------
    # SCENE 5: BROADCAST KWALITEIT SLOTKAART (210 frames = 7.0s)
    # -------------------------------------------------------------
    print("  ► Renderen Scene 5: Broadcast Slotkaart (210 frames)...")
    for f in range(210):
        t = f / 210.0
        zoom = 1.0 + 0.012 * ease_in_out(t)
        base_outro = get_cam_frame(img_outro, zoom=zoom, pan_x=0.0, pan_y=0.0)

        if f < fade_len:
            frame = Image.blend(prev_scene_last, base_outro, ease_in_out(f / float(fade_len)))
        elif f > 195:
            fade_out = (210 - f) / 15.0
            black = Image.new('RGB', (WIDTH, HEIGHT), (0, 0, 0))
            frame = Image.blend(black, base_outro, fade_out)
        else:
            frame = base_outro

        writer.append_data(np.array(frame))
        frame_idx += 1

    writer.close()

    print(f"🎬 Raw video klaar: {temp_raw_video} ({frame_idx} frames, {frame_idx/FPS:.2f}s)")
    print("🎵 Muxen met Master Soundtrack (Voiceover + Muziek)...")

    cmd = [
        FFMPEG, '-y',
        '-i', temp_raw_video,
        '-i', master_audio,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', '+faststart',
        final_video_path
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        file_size_mb = os.path.getsize(final_video_path) / (1024 * 1024)
        print(f"✅ Definitieve video met Voiceover & Muziek succesvol gereed: {final_video_path} ({file_size_mb:.2f} MB)")
    else:
        print("❌ Fout bij muxen:", res.stderr)

    # Poster afbeeldingen updaten (met voor/na split of gepolijste nieuwe gevel + strakke play-badge zonder tofu-blokje)
    poster_base = get_cam_frame(img_pand_orig, zoom=1.03, pan_x=0.0, pan_y=0.01)
    poster_new = get_cam_frame(img_pand_new, zoom=1.03, pan_x=-0.01, pan_y=0.01)
    poster_frame = draw_transition_wipe(
        poster_base,
        poster_new,
        0.68,
        direction='ltr',
        label_base="VOOR • ORIGINEEL",
        label_overlay="NA • NIEUWE HUISSTIJL",
        line_color=(243, 146, 35, 250),
        overlay_tag_bg=(35, 95, 45, 235)
    )
    poster_frame = draw_top_brand_pill(poster_frame)
    poster_frame = draw_lower_third(
        poster_frame,
        "Showroom Dordrecht • Merwedestraat 239",
        "Bekijk de gevel, etalage & interieur make-over + complete business case",
        "BEKIJK RONDLEIDING",
        (220, 110, 25),
        global_progress=0.0,
        is_play_icon=True
    )
    poster_frame.save('assets/showroom_video_poster.jpg', quality=95)
    poster_frame.save('assets/gevel_video_new_preview.jpg', quality=95)
    print("✅ Video posters geüpdatet: assets/showroom_video_poster.jpg & assets/gevel_video_new_preview.jpg")

if __name__ == '__main__':
    main()
