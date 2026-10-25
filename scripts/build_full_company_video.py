import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import subprocess, math, sys, os, random, time

FFMPEG = '/Users/matthiasradder/Library/Python/3.14/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
FONT_BOLD = 'assets/fonts/Montserrat-Bold.ttf'
FONT_XBOLD = 'assets/fonts/Montserrat-ExtraBold.ttf'
FONT_SEMI = 'assets/fonts/Montserrat-SemiBold.ttf'
FONT_REG = 'assets/fonts/Montserrat-Regular.ttf'

font_kicker = ImageFont.truetype(FONT_BOLD, 17)
font_title = ImageFont.truetype(FONT_XBOLD, 30)
font_sub = ImageFont.truetype(FONT_SEMI, 19)
font_pill = ImageFont.truetype(FONT_BOLD, 17)
font_badge = ImageFont.truetype(FONT_BOLD, 18)

TW, TH = 1920, 1080
FPS = 30

os.makedirs('assets/video', exist_ok=True)

def draw_huisstijl_card(
    frame,
    lt_x, lt_y, card_w, card_h,
    kicker_text, kicker_color='green',
    title_text='', title_highlight='', title_highlight_color=(75, 143, 36, 255),
    subtitle_text='',
    chip_text='', chip_type='check', chip_color=(243, 146, 35, 255),
    left_accent_color=None
):
    overlay = Image.new('RGBA', (TW, TH), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    
    # Soft drop shadow
    odraw.rounded_rectangle(
        [(lt_x + 2, lt_y + 8), (lt_x + card_w + 2, lt_y + card_h + 8)],
        radius=22, fill=(0, 0, 0, 55)
    )
    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=8))
    frame.alpha_composite(overlay)
    
    draw = ImageDraw.Draw(frame)
    
    # 1. Main Frosted Glass Card: NO GREEN BORDERS, lightly translucent
    draw.rounded_rectangle(
        [(lt_x, lt_y), (lt_x + card_w, lt_y + card_h)],
        radius=22, fill=(255, 255, 255, 195), outline=(255, 255, 255, 160), width=1
    )
    
    # 2. Kicker Pill Badge
    kw = font_kicker.getlength(kicker_text)
    pill_w = kw + 38
    pill_h = 30
    pill_x = lt_x + 24
    pill_y = lt_y + 18
    if kicker_color == 'orange':
        draw.rounded_rectangle([(pill_x, pill_y), (pill_x + pill_w, pill_y + pill_h)], radius=15, fill=(255, 247, 237, 240), outline=(243, 146, 35, 140), width=1)
        draw.ellipse([(pill_x + 10, pill_y + 11), (pill_x + 18, pill_y + 19)], fill=(243, 146, 35, 255))
        draw.text((pill_x + 26, pill_y + 5), kicker_text, font=font_kicker, fill=(180, 83, 9, 255))
    else:
        draw.rounded_rectangle([(pill_x, pill_y), (pill_x + pill_w, pill_y + pill_h)], radius=15, fill=(234, 247, 232, 240), outline=(75, 143, 36, 140), width=1)
        draw.ellipse([(pill_x + 10, pill_y + 11), (pill_x + 18, pill_y + 19)], fill=(75, 143, 36, 255))
        draw.text((pill_x + 26, pill_y + 5), kicker_text, font=font_kicker, fill=(35, 84, 27, 255))
        
    # 3. Title & Highlight (with more breathing room from kicker pill)
    title_x = lt_x + 24
    title_y = lt_y + 70
    draw.text((title_x, title_y), title_text, font=font_title, fill=(18, 43, 7, 255))
    if title_highlight:
        tw = font_title.getlength(title_text + ' ')
        draw.text((title_x + tw, title_y), title_highlight, font=font_title, fill=title_highlight_color)
        
    # 4. Subtitle
    draw.text((lt_x + 24, lt_y + 124), subtitle_text, font=font_sub, fill=(55, 65, 81, 255))
    
    # 5. Action Chip / Badge on the right
    if chip_text:
        chip_w = font_pill.getlength(chip_text) + 68
        chip_w = max(215, chip_w)
        chip_h = 54
        chip_x = lt_x + card_w - chip_w - 24
        chip_y = lt_y + 64
        draw.rounded_rectangle([(chip_x, chip_y), (chip_x + chip_w, chip_y + chip_h)], radius=16, fill=chip_color)
        if chip_type == 'check':
            draw.line([(chip_x + 22, chip_y + 27), (chip_x + 30, chip_y + 37)], fill=(255, 255, 255, 255), width=3)
            draw.line([(chip_x + 30, chip_y + 37), (chip_x + 44, chip_y + 17)], fill=(255, 255, 255, 255), width=3)
            draw.text((chip_x + 52, chip_y + 16), chip_text, font=font_pill, fill=(255, 255, 255, 255))
        elif chip_type == 'warning':
            draw.ellipse([(chip_x + 18, chip_y + 15), (chip_x + 40, chip_y + 37)], outline=(255, 255, 255, 255), width=2)
            draw.text((chip_x + 26, chip_y + 16), '!', font=font_pill, fill=(255, 255, 255, 255))
            draw.text((chip_x + 48, chip_y + 16), chip_text, font=font_pill, fill=(255, 255, 255, 255))
        elif chip_type in ('button', 'calendar'):
            # Vector Calendar Icon for Maak Afspraak
            cx = chip_x + 20
            cy = chip_y + 18
            draw.rounded_rectangle([(cx, cy + 3), (cx + 17, cy + 18)], radius=3, outline=(255, 255, 255, 255), width=2)
            draw.line([(cx, cy + 8), (cx + 17, cy + 8)], fill=(255, 255, 255, 255), width=2)
            draw.line([(cx + 4, cy), (cx + 4, cy + 4)], fill=(255, 255, 255, 255), width=2)
            draw.line([(cx + 13, cy), (cx + 13, cy + 4)], fill=(255, 255, 255, 255), width=2)
            draw.rectangle([(cx + 6, cy + 11), (cx + 11, cy + 15)], fill=(255, 255, 255, 255))
            draw.text((chip_x + 48, chip_y + 16), chip_text, font=font_pill, fill=(255, 255, 255, 255))

def draw_checkmark(draw, x, y, size=16, color=(255, 255, 255, 255), width=3):
    pts = [
        (x, y + size * 0.5),
        (x + size * 0.4, y + size * 0.9),
        (x + size * 1.0, y + size * 0.1)
    ]
    draw.line([pts[0], pts[1]], fill=color, width=width)
    draw.line([pts[1], pts[2]], fill=color, width=width)

SWOOSH_LEFT = Image.open('assets/swoosh_badge_left.png').convert('RGBA')
SWOOSH_RIGHT = Image.open('assets/swoosh_badge_right.png').convert('RGBA')

def draw_watermark(frame, side='left'):
    if side == 'left':
        frame.alpha_composite(SWOOSH_LEFT, (0, 0))
    else:
        frame.alpha_composite(SWOOSH_RIGHT, (TW - SWOOSH_RIGHT.width, 0))

# ==============================================================================
# SCENE 1: HET DILEMMA (11.7s)
# ==============================================================================
def render_scene1():
    print("--- Rendering Scene 1: Het Dilemma ---")
    base = Image.open('assets/senior_chair_dilemma_v4.jpg').convert('RGB')
    bw, bh = base.size
    
    duration = 11.70
    total_frames = int(duration * FPS)
    out_video = 'assets/video/scene1_dilemma.mp4'
    audio_file = 'assets/audio/consumer_scene_1.m4a'
    
    cmd = [
        FFMPEG, '-y',
        '-f', 'rawvideo', '-vcodec', 'rawvideo', '-s', f'{TW}x{TH}',
        '-pix_fmt', 'rgba', '-r', str(FPS), '-i', '-',
        '-i', audio_file,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '19',
        '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
        '-shortest', out_video
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    
    font_kicker = ImageFont.truetype(FONT_BOLD, 22)
    font_title = ImageFont.truetype(FONT_BOLD, 38)
    font_sub = ImageFont.truetype(FONT_REG, 24)
    font_pill = ImageFont.truetype(FONT_BOLD, 22)
    
    for f in range(total_frames):
        t = f / float(FPS)
        prog = f / float(total_frames)
        
        # Slow cinematic push-in on the father & daughter at the table
        zoom = 1.00 + 0.06 * math.sin(prog * math.pi * 0.5)
        crop_w = bw / zoom
        crop_h = bh / zoom
        
        # Natural framing centered on father & daughter
        cx = bw * 0.46
        cy = bh * 0.50
        
        x0 = max(0, min(bw - crop_w, cx - crop_w / 2.0))
        y0 = max(0, min(bh - crop_h, cy - crop_h / 2.0))
        
        frame = base.crop((int(x0), int(y0), int(x0 + crop_w), int(y0 + crop_h))).resize((TW, TH), Image.Resampling.BILINEAR).convert('RGBA')
        
        # Lower Third Card (slide in at t=0.5s) on right side in open living room space
        lt_prog = min(1.0, max(0.0, (t - 0.5) / 0.5))
        if lt_prog > 0:
            lt_y = 838 + int((1.0 - math.pow(lt_prog, 0.4)) * 120)
            lt_x = 840
            card_w = 1000
            card_h = 182
            
            draw_huisstijl_card(
                frame, lt_x, lt_y, card_w, card_h,
                kicker_text="HET SENIOREN-DILEMMA", kicker_color='orange',
                title_text="Het Dilemma in de Markt:", title_highlight="€ 4.500 vs. € 500", title_highlight_color=(243, 146, 35, 255),
                subtitle_text="Nieuw is onbetaalbaar (€ 4.500+) • Marktplaats is een risico zonder garantie",
                chip_text="MARKTVACUÜM", chip_type='warning', chip_color=(243, 146, 35, 255)
            )

        draw_watermark(frame, 'left')
        proc.stdin.write(np.array(frame).tobytes())
        
    proc.stdin.close()
    proc.wait()
    print("Scene 1 completed:", out_video)

# ==============================================================================
# SCENE 2: DE OPLOSSING / CERTIFIED FITFORM (10.73s)
# ==============================================================================
def render_scene2():
    print("--- Rendering Scene 2: Certified Fitform ---")
    base = Image.open('assets/certified_fitform_living_room_v1.jpg').convert('RGB')
    bw, bh = base.size
    
    duration = 10.73
    total_frames = int(duration * FPS)
    out_video = 'assets/video/scene2_showroom.mp4'
    audio_file = 'assets/audio/consumer_scene_2.m4a'
    
    cmd = [
        FFMPEG, '-y',
        '-f', 'rawvideo', '-vcodec', 'rawvideo', '-s', f'{TW}x{TH}',
        '-pix_fmt', 'rgba', '-r', str(FPS), '-i', '-',
        '-i', audio_file,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '19',
        '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
        '-shortest', out_video
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    
    font_kicker = ImageFont.truetype(FONT_BOLD, 22)
    font_title = ImageFont.truetype(FONT_BOLD, 38)
    font_sub = ImageFont.truetype(FONT_REG, 24)
    font_pill = ImageFont.truetype(FONT_BOLD, 22)
    
    # Sunbeam particles
    sunbeams = []
    for i in range(25):
        sunbeams.append({
            'x': random.uniform(TW*0.4, TW*0.9),
            'y': random.uniform(TH*0.1, TH*0.8),
            'len': random.uniform(150, 400),
            'angle': random.uniform(0.65, 0.75),
            'alpha': random.uniform(0.1, 0.25)
        })
        
    for f in range(total_frames):
        t = f / float(FPS)
        prog = f / float(total_frames)
        
        # Smooth horizontal dolly right showing the armchair in full glory
        zoom = 1.02 + 0.05 * math.sin(prog * math.pi * 0.6)
        crop_w = bw / zoom
        crop_h = bh / zoom
        
        cx = bw * (0.46 + 0.05 * prog)
        cy = bh * 0.50
        
        x0 = max(0, min(bw - crop_w, cx - crop_w / 2.0))
        y0 = max(0, min(bh - crop_h, cy - crop_h / 2.0))
        
        frame = base.crop((int(x0), int(y0), int(x0 + crop_w), int(y0 + crop_h))).resize((TW, TH), Image.Resampling.BILINEAR).convert('RGBA')
        
        # Atmospheric golden sunbeams
        beam_overlay = Image.new('RGBA', (TW, TH), (0, 0, 0, 0))
        beam_draw = ImageDraw.Draw(beam_overlay)
        for b in sunbeams:
            drift = math.sin(t * 1.5 + b['x']) * 30
            bx0 = b['x'] + drift
            by0 = b['y']
            bx1 = bx0 + math.cos(b['angle']) * b['len']
            by1 = by0 + math.sin(b['angle']) * b['len']
            a = int(255 * b['alpha'] * (0.8 + 0.2 * math.sin(t * 2.0)))
            beam_draw.line([(bx0, by0), (bx1, by1)], fill=(255, 245, 210, a), width=8)
            
        beam_overlay = beam_overlay.filter(ImageFilter.GaussianBlur(radius=12))
        frame = Image.alpha_composite(frame, beam_overlay)
        
        draw = ImageDraw.Draw(frame)
        
        # Lower Third Card (slide in at t=0.5s)
        lt_prog = min(1.0, max(0.0, (t - 0.5) / 0.5))
        if lt_prog > 0:
            lt_y = 838 + int((1.0 - math.pow(lt_prog, 0.4)) * 120)
            lt_x = 80
            card_w = 1020
            card_h = 182
            
            draw_huisstijl_card(
                frame, lt_x, lt_y, card_w, card_h,
                kicker_text="OFFICIEEL FITFORM DEALER", kicker_color='green',
                title_text="Certified Fitform Occasion", title_highlight="v.a. € 1.050,-", title_highlight_color=(75, 143, 36, 255),
                subtitle_text="Medische topkwaliteit voor minder dan de helft van de prijs • Showroom Dordrecht",
                chip_text="2 JAAR GARANTIE", chip_type='check', chip_color=(243, 146, 35, 255)
            )

        draw_watermark(frame, 'right')
        proc.stdin.write(np.array(frame).tobytes())
        
    proc.stdin.close()
    proc.wait()
    print("Scene 2 completed:", out_video)

font_cad_h1 = ImageFont.truetype(FONT_XBOLD, 17)
font_cad_dim = ImageFont.truetype(FONT_BOLD, 14)
font_cad_val = ImageFont.truetype(FONT_XBOLD, 16)
font_cad_sub = ImageFont.truetype(FONT_REG, 12)
font_cad_tag = ImageFont.truetype(FONT_BOLD, 13)

def draw_cad_check(draw, x, y, size=14, color=(34, 197, 94, 255), width=3):
    draw.line([(x, y + size * 0.5), (x + size * 0.4, y + size * 0.9)], fill=color, width=width)
    draw.line([(x + size * 0.4, y + size * 0.9), (x + size * 1.0, y + size * 0.1)], fill=color, width=width)

def render_cad_blueprint_animation(frame, t, wire_im):
    if t < 0.4:
        return
    
    entry_prog = min(1.0, max(0.0, (t - 0.4) / 0.6))
    entry_ease = math.sin(entry_prog * math.pi * 0.5)
    
    panel_x = 80
    panel_y = int(120 + (1.0 - entry_ease) * 20)
    panel_w = 680
    panel_h = 700
    
    overlay = Image.new('RGBA', (TW, TH), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    
    # 1. Background Glass Panel (lightly translucent, no harsh green border)
    panel_alpha = int(205 * entry_ease)
    odraw.rounded_rectangle(
        [(panel_x, panel_y), (panel_x + panel_w, panel_y + panel_h)],
        radius=18,
        fill=(12, 28, 16, panel_alpha),
        outline=(255, 255, 255, int(60 * entry_ease)),
        width=1
    )
    
    # 2. Grid lines
    grid_step = 34
    grid_alpha = int(45 * entry_ease)
    for gx in range(panel_x + grid_step, panel_x + panel_w, grid_step):
        odraw.line([(gx, panel_y + 12), (gx, panel_y + panel_h - 12)], fill=(75, 143, 36, grid_alpha), width=1)
    for gy in range(panel_y + grid_step, panel_y + panel_h, grid_step):
        odraw.line([(panel_x + 12, gy), (panel_x + panel_w - 12, gy)], fill=(75, 143, 36, grid_alpha), width=1)
        
    # 3. Header Bar
    odraw.rounded_rectangle(
        [(panel_x + 16, panel_y + 16), (panel_x + panel_w - 16, panel_y + 64)],
        radius=10,
        fill=(22, 50, 26, int(240 * entry_ease))
    )
    
    # Live pulsing dot
    pulse_a = int(180 + 75 * math.sin(t * 6.0)) if entry_prog >= 1.0 else int(255 * entry_ease)
    odraw.ellipse([(panel_x + 30, panel_y + 32), (panel_x + 44, panel_y + 46)], fill=(34, 197, 94, pulse_a))
    odraw.text((panel_x + 54, panel_y + 24), 'CAD MAATVOERING & INMETEN', font=font_cad_h1, fill=(255, 255, 255, int(255 * entry_ease)))
    odraw.text((panel_x + 54, panel_y + 44), 'FITFORM 570 VARIO • WERKPLAATS KALIBRATIE', font=font_cad_sub, fill=(134, 239, 172, int(230 * entry_ease)))
    
    # 4. Wireframe Chair
    cw_x = panel_x + 55
    cw_y = panel_y + 115
    if entry_ease > 0.05:
        if entry_ease < 0.99:
            warr = np.array(wire_im)
            warr[:, :, 3] = (warr[:, :, 3].astype(float) * entry_ease).astype(np.uint8)
            faded_wire = Image.fromarray(warr, mode='RGBA')
            overlay.alpha_composite(faded_wire, (cw_x, cw_y))
        else:
            overlay.alpha_composite(wire_im, (cw_x, cw_y))
            
    # 5. Laser Scan Beam (t=1.0s to 3.5s)
    if 1.0 <= t <= 3.5:
        scan_prog = (t - 1.0) / 2.5
        beam_y = cw_y + int(scan_prog * 420)
        beam_a = int(220 * math.sin(scan_prog * math.pi))
        odraw.line([(panel_x + 30, beam_y), (panel_x + panel_w - 30, beam_y)], fill=(75, 255, 120, beam_a), width=2)
        odraw.line([(panel_x + 30, beam_y - 1), (panel_x + panel_w - 30, beam_y - 1)], fill=(200, 255, 220, beam_a // 2), width=1)
        odraw.line([(panel_x + 30, beam_y + 1), (panel_x + panel_w - 30, beam_y + 1)], fill=(200, 255, 220, beam_a // 2), width=1)
        
    # 6. Stage 1: ZITHOOGTE (t >= 2.2s)
    if t >= 2.2:
        zh_prog = min(1.0, max(0.0, (t - 2.2) / 0.8))
        zh_x = cw_x + 440 - 30
        zh_y1 = cw_y + 240
        zh_y2 = zh_y1 + int(zh_prog * 180)
        
        odraw.line([(zh_x, zh_y1), (zh_x, zh_y2)], fill=(243, 146, 35, 240), width=2)
        if zh_prog > 0.4:
            odraw.polygon([(zh_x, zh_y1), (zh_x - 5, zh_y1 + 10), (zh_x + 5, zh_y1 + 10)], fill=(243, 146, 35, 255))
        if zh_prog >= 0.95:
            odraw.polygon([(zh_x, zh_y2), (zh_x - 5, zh_y2 - 10), (zh_x + 5, zh_y2 - 10)], fill=(243, 146, 35, 255))
            
        cur_val = 40.0 + zh_prog * 6.0
        val_str = f'{cur_val:.1f} cm' if zh_prog < 1.0 else '46 cm (40-60)'
        badge_a = int(240 * min(1.0, zh_prog * 1.5))
        odraw.rounded_rectangle([(zh_x + 12, (zh_y1 + zh_y2) // 2 - 20), (zh_x + 175, (zh_y1 + zh_y2) // 2 + 20)], radius=6, fill=(243, 146, 35, badge_a))
        odraw.text((zh_x + 20, (zh_y1 + zh_y2) // 2 - 16), 'ZITHOOGTE', font=font_cad_tag, fill=(255, 255, 255, badge_a))
        odraw.text((zh_x + 20, (zh_y1 + zh_y2) // 2 + 1), val_str, font=font_cad_val, fill=(255, 255, 255, badge_a))
        
    # 7. Stage 2: ZITDIEPTE (t >= 4.2s)
    if t >= 4.2:
        zd_prog = min(1.0, max(0.0, (t - 4.2) / 0.8))
        zd_y = cw_y + 435
        zd_x1 = cw_x + 120
        zd_x2 = zd_x1 + int(zd_prog * 240)
        
        odraw.line([(zd_x1, zd_y), (zd_x2, zd_y)], fill=(75, 220, 100, 240), width=2)
        if zd_prog > 0.4:
            odraw.polygon([(zd_x1, zd_y), (zd_x1 + 10, zd_y - 5), (zd_x1 + 10, zd_y + 5)], fill=(75, 220, 100, 255))
        if zd_prog >= 0.95:
            odraw.polygon([(zd_x2, zd_y), (zd_x2 - 10, zd_y - 5), (zd_x2 - 10, zd_y + 5)], fill=(75, 220, 100, 255))
            
        cur_zd = 43.0 + zd_prog * 5.0
        val_zd = f'{cur_zd:.1f} cm' if zd_prog < 1.0 else 'ZITDIEPTE: 48 cm'
        badge_a = int(240 * min(1.0, zd_prog * 1.5))
        mid_x = (zd_x1 + zd_x2) // 2
        odraw.rounded_rectangle([(mid_x - 75, zd_y + 8), (mid_x + 75, zd_y + 44)], radius=6, fill=(20, 70, 30, badge_a), outline=(75, 220, 100, badge_a), width=1)
        odraw.text((mid_x - 65, zd_y + 11), val_zd, font=font_cad_dim, fill=(134, 239, 172, badge_a))
        odraw.text((mid_x - 65, zd_y + 26), '43 - 53 cm instelbaar', font=font_cad_sub, fill=(200, 255, 220, badge_a))
        
    # 8. Stage 3: ARMLEGGERS (t >= 6.2s)
    if t >= 6.2:
        arm_prog = min(1.0, max(0.0, (t - 6.2) / 0.8))
        arm_x = cw_x + 60
        arm_y1 = cw_y + 190
        arm_y2 = arm_y1 + int(arm_prog * 80)
        
        odraw.line([(arm_x, arm_y1), (arm_x, arm_y2)], fill=(56, 189, 248, 240), width=2)
        if arm_prog > 0.4:
            odraw.polygon([(arm_x, arm_y1), (arm_x - 5, arm_y1 + 8), (arm_x + 5, arm_y1 + 8)], fill=(56, 189, 248, 255))
        if arm_prog >= 0.95:
            odraw.polygon([(arm_x, arm_y2), (arm_x - 5, arm_y2 - 8), (arm_x + 5, arm_y2 - 8)], fill=(56, 189, 248, 255))
            
        cur_arm = 16.0 + arm_prog * 6.0
        val_arm = f'{cur_arm:.1f} cm' if arm_prog < 1.0 else '22 cm (16-29 cm)'
        badge_a = int(240 * min(1.0, arm_prog * 1.5))
        odraw.rounded_rectangle([(arm_x - 170, arm_y1 + 10), (arm_x - 10, arm_y1 + 52)], radius=6, fill=(14, 50, 70, badge_a), outline=(56, 189, 248, badge_a), width=1)
        odraw.text((arm_x - 162, arm_y1 + 14), 'ARMLEGGERS', font=font_cad_tag, fill=(224, 242, 254, badge_a))
        odraw.text((arm_x - 162, arm_y1 + 31), val_arm, font=font_cad_val, fill=(56, 189, 248, badge_a))
        
    # 9. Stage 4: LENDENSTEUN ILP (t >= 8.0s)
    if t >= 8.0:
        len_prog = min(1.0, max(0.0, (t - 8.0) / 0.6))
        len_x = cw_x + 190
        len_y = cw_y + 200
        
        pulse_r = 6 + (2 * math.sin(t * 8.0) if len_prog >= 1.0 else 0)
        odraw.ellipse([(len_x - pulse_r, len_y - pulse_r), (len_x + pulse_r, len_y + pulse_r)], fill=(243, 146, 35, 255), outline=(255, 255, 255, 255), width=2)
        
        line_len = int(len_prog * 60)
        odraw.line([(len_x, len_y), (len_x + line_len, len_y - int(line_len * 0.75))], fill=(243, 146, 35, 240), width=2)
        if len_prog >= 0.95:
            odraw.line([(len_x + 60, len_y - 45), (len_x + 180, len_y - 45)], fill=(243, 146, 35, 240), width=2)
            odraw.rounded_rectangle([(len_x + 60, len_y - 70), (len_x + 235, len_y - 48)], radius=5, fill=(243, 146, 35, 240))
            odraw.text((len_x + 68, len_y - 66), 'ILP LENDENSTEUN', font=font_cad_tag, fill=(255, 255, 255, 255))
            draw_cad_check(odraw, len_x + 208, len_y - 66, size=14, color=(255, 255, 255, 255), width=2)
            
    # 10. Corner Brackets
    cb_len = 16
    for bx, by in [
        (panel_x + 8, panel_y + 8),
        (panel_x + panel_w - 8, panel_y + 8),
        (panel_x + 8, panel_y + panel_h - 8),
        (panel_x + panel_w - 8, panel_y + panel_h - 8)
    ]:
        dx = -1 if bx > panel_x + 50 else 1
        dy = -1 if by > panel_y + 50 else 1
        odraw.line([(bx, by), (bx + dx * cb_len, by)], fill=(200, 235, 210, int(130 * entry_ease)), width=1)
        odraw.line([(bx, by), (bx, by + dy * cb_len)], fill=(200, 235, 210, int(130 * entry_ease)), width=1)
        
    # 11. Bottom Status Bar (t >= 9.5s)
    if t >= 9.5:
        st_prog = min(1.0, max(0.0, (t - 9.5) / 0.5))
        st_a = int(240 * st_prog)
        odraw.rounded_rectangle(
            [(panel_x + 16, panel_y + panel_h - 52), (panel_x + panel_w - 16, panel_y + panel_h - 16)],
            radius=8,
            fill=(18, 43, 22, st_a),
            outline=(75, 143, 36, int(160 * st_prog)),
            width=1
        )
        odraw.text((panel_x + 28, panel_y + panel_h - 43), 'STATUS: 100% OP MAAT GECALIBREERD VOOR DE KLANT', font=font_cad_dim, fill=(134, 239, 172, st_a))
        draw_cad_check(odraw, panel_x + panel_w - 80, panel_y + panel_h - 44, size=15, color=(34, 197, 94, st_a), width=3)
        odraw.text((panel_x + panel_w - 60, panel_y + panel_h - 43), 'OK', font=font_cad_val, fill=(34, 197, 94, st_a))
        
    frame.alpha_composite(overlay)

# ==============================================================================
# SCENE 3: DE WERKPLAATS & 30-PUNTS KEURING (12.33s)
# ==============================================================================
def render_scene3():
    print("--- Rendering Scene 3: De Werkplaats ---")
    base = Image.open('assets/dutch_technician_fitform_workshop_v5.jpg').convert('RGB')
    bw, bh = base.size
    
    duration = 12.33
    total_frames = int(duration * FPS)
    out_video = 'assets/video/scene3_werkplaats.mp4'
    audio_file = 'assets/audio/consumer_scene_3.m4a'
    
    cmd = [
        FFMPEG, '-y',
        '-f', 'rawvideo', '-vcodec', 'rawvideo', '-s', f'{TW}x{TH}',
        '-pix_fmt', 'rgba', '-r', str(FPS), '-i', '-',
        '-i', audio_file,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '19',
        '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
        '-shortest', out_video
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    
    # Subtle steam particles near chair
    num_particles = 30
    particles = []
    for i in range(num_particles):
        particles.append({
            'x': random.uniform(bw * 0.65, bw * 0.88),
            'y': random.uniform(bh * 0.40, bh * 0.70),
            'vx': random.uniform(-0.5, 0.6),
            'vy': random.uniform(-1.8, -3.2),
            'radius': random.uniform(15, 45),
            'growth': random.uniform(0.4, 1.0),
            'alpha': random.uniform(0.10, 0.25),
            'phase': random.uniform(0, math.pi * 2)
        })
    
    font_kicker = ImageFont.truetype(FONT_BOLD, 22)
    font_title = ImageFont.truetype(FONT_BOLD, 38)
    font_sub = ImageFont.truetype(FONT_REG, 24)
    font_pill = ImageFont.truetype(FONT_BOLD, 22)
    font_badge = ImageFont.truetype(FONT_BOLD, 20)
    
    wire_im = Image.open('assets/wireframe_fitform_570_cad.png').convert('RGBA')

    for f in range(total_frames):
        t = f / float(FPS)
        prog = f / float(total_frames)
        
        zoom = 1.0 + 0.05 * math.sin(prog * math.pi * 0.5)
        crop_w = bw / zoom
        crop_h = bh / zoom
        
        cx = bw * 0.58
        cy = bh * 0.50
        
        x0 = max(0, min(bw - crop_w, cx - crop_w / 2.0))
        y0 = max(0, min(bh - crop_h, cy - crop_h / 2.0))
        
        frame = base.crop((int(x0), int(y0), int(x0 + crop_w), int(y0 + crop_h))).resize((TW, TH), Image.Resampling.BILINEAR).convert('RGBA')
        
        # Steam layer
        steam_overlay = Image.new('RGBA', (TW, TH), (0, 0, 0, 0))
        steam_draw = ImageDraw.Draw(steam_overlay)
        
        for p in particles:
            px = p['x'] + p['vx'] * t * 15 + math.sin(t * 2.0 + p['phase']) * 8
            py = p['y'] + p['vy'] * t * 15
            cycle_y = (py - 150) % 550 + 150
            cycle_prog = (650 - cycle_y) / 500.0
            rad = p['radius'] + cycle_prog * p['growth'] * 40
            curr_alpha = int(255 * p['alpha'] * math.sin(cycle_prog * math.pi))
            sx = (px / bw) * TW
            sy = (cycle_y / bh) * TH
            if curr_alpha > 5:
                steam_draw.ellipse([(sx - rad, sy - rad), (sx + rad, sy + rad)], fill=(245, 250, 255, max(0, min(255, curr_alpha))))
        
        steam_overlay = steam_overlay.filter(ImageFilter.GaussianBlur(radius=18))
        frame = Image.alpha_composite(frame, steam_overlay)
        
        # Animated CAD Blueprint Wireframe & Measurement Panel
        render_cad_blueprint_animation(frame, t, wire_im)
        
        draw = ImageDraw.Draw(frame)
        
        # Holographic Measurement Scan Line (t=2.5s to 8.5s) across armrest & seat
        if 2.5 <= t <= 8.5:
            scan_prog = (t - 2.5) / 6.0
            scan_y = int(TH * 0.56 + math.sin(scan_prog * math.pi * 3) * 15)
            scan_x_start = int(TW * 0.55)
            scan_x_end = int(TW * 0.88)
            scan_alpha = int(200 * math.sin(scan_prog * math.pi))
            draw.line([(scan_x_start, scan_y), (scan_x_end, scan_y)], fill=(75, 255, 75, scan_alpha), width=2)
            
            draw.rectangle([(scan_x_end - 340, scan_y - 32), (scan_x_end, scan_y - 4)], fill=(18, 43, 7, 210))
            draw.text((scan_x_end - 325, scan_y - 28), "Zithoogte: 46 cm • 100% Maatwerk", font=font_badge, fill=(106, 177, 60, 240))
        
        # Lower Third Card
        lt_prog = min(1.0, max(0.0, (t - 0.6) / 0.5))
        if lt_prog > 0:
            lt_y = 838 + int((1.0 - math.pow(lt_prog, 0.4)) * 120)
            lt_x = 80
            card_w = 1020
            card_h = 182
            
            draw_huisstijl_card(
                frame, lt_x, lt_y, card_w, card_h,
                kicker_text="30-PUNTS TECHNISCHE KEURING", kicker_color='orange',
                title_text="Geertjan Klein Haneveld", title_highlight="100% op Maat", title_highlight_color=(75, 143, 36, 255),
                subtitle_text="Bewegingstechnoloog & Zitspecialist • Werkplaats Merwedestraat 239",
                chip_text="100% OP MAAT", chip_type='check', chip_color=(75, 143, 36, 255)
            )

        draw_watermark(frame, 'right')
        proc.stdin.write(np.array(frame).tobytes())
        
    proc.stdin.close()
    proc.wait()
    print("Scene 3 completed:", out_video)

# ==============================================================================
# SCENE 4: DE ZEKERHEID & AFSPRAAK (12.54s)
# ==============================================================================
def render_scene4():
    print("--- Rendering Scene 4: Geertjan in de Showroom ---")
    base = Image.open('assets/geert_in_de_winkel_169.jpg').convert('RGB')
    bw, bh = base.size
    
    duration = 12.54
    total_frames = int(duration * FPS)
    out_video = 'assets/video/scene4_zekerheid.mp4'
    audio_file = 'assets/audio/consumer_scene_4.m4a'
    
    cmd = [
        FFMPEG, '-y',
        '-f', 'rawvideo', '-vcodec', 'rawvideo', '-s', f'{TW}x{TH}',
        '-pix_fmt', 'rgba', '-r', str(FPS), '-i', '-',
        '-i', audio_file,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '19',
        '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
        '-shortest', out_video
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    
    font_kicker = ImageFont.truetype(FONT_BOLD, 22)
    font_title = ImageFont.truetype(FONT_BOLD, 36)
    font_sub = ImageFont.truetype(FONT_REG, 24)
    font_pill = ImageFont.truetype(FONT_BOLD, 22)
    
    for f in range(total_frames):
        t = f / float(FPS)
        prog = f / float(total_frames)
        
        # Gentle cinematic push-in towards Geertjan's warm smile in the showroom (centering on Geertjan at ~65% width)
        zoom = 1.00 + 0.05 * math.sin(prog * math.pi * 0.5)
        crop_w = bw / zoom
        crop_h = bh / zoom
        cx = bw * 0.65
        cy = bh * 0.48
        x0 = max(0, min(bw - crop_w, cx - crop_w / 2.0))
        y0 = max(0, min(bh - crop_h, cy - crop_h / 2.0))
        frame = base.crop((int(x0), int(y0), int(x0 + crop_w), int(y0 + crop_h))).resize((TW, TH), Image.Resampling.BILINEAR).convert('RGBA')
        
        draw = ImageDraw.Draw(frame)
        
        # Lower Third / Showroom CTA Card (slide up at t=0.5s)
        lt_prog = min(1.0, max(0.0, (t - 0.5) / 0.5))
        if lt_prog > 0:
            card_w = 1040
            card_h = 182
            lt_x = 80
            lt_y = 838 + int((1.0 - math.pow(lt_prog, 0.4)) * 120)
            
            draw_huisstijl_card(
                frame, lt_x, lt_y, card_w, card_h,
                kicker_text="SHOWROOM DORDRECHT & AAN HUIS", kicker_color='orange',
                title_text="Kom Vrijblijvend Proefzitten", title_highlight="in Dordrecht", title_highlight_color=(75, 143, 36, 255),
                subtitle_text="Merwedestraat 239 • Bel direct: 078 - 631 4858 • Gratis parkeren voor de deur",
                chip_text="MAAK AFSPRAAK", chip_type='button', chip_color=(75, 143, 36, 255)
            )

        draw_watermark(frame, 'left')
        proc.stdin.write(np.array(frame).tobytes())
        
    proc.stdin.close()
    proc.wait()
    print("Scene 4 completed:", out_video)

# ==============================================================================
# MASTER VIDEO: ASSEMBLE ALL 4 SCENES
# ==============================================================================
def assemble_master_video():
    print("--- Assembling Master Bedrijfsvideo ---")
    out_master = 'assets/video/staopstoelen_bedrijfsvideo_dordrecht.mp4'
    
    # List of files for ffmpeg concat
    concat_list = 'scripts/concat_list.txt'
    with open(concat_list, 'w') as f:
        f.write("file '../assets/video/scene1_dilemma.mp4'\n")
        f.write("file '../assets/video/scene2_showroom.mp4'\n")
        f.write("file '../assets/video/scene3_werkplaats.mp4'\n")
        f.write("file '../assets/video/scene4_zekerheid.mp4'\n")
        
    cmd = [
        FFMPEG, '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', concat_list,
        '-c', 'copy',
        out_master
    ]
    subprocess.run(cmd, check=True)
    print("MASTER VIDEO GENERATED SUCCESSFULLY:", out_master)

if __name__ == '__main__':
    t0 = time.time()
    render_scene1()
    render_scene2()
    render_scene3()
    render_scene4()
    assemble_master_video()
    print(f"Total video production finished in {time.time() - t0:.1f}s!")
