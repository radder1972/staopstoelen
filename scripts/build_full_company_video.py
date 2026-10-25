import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import subprocess, math, sys, os, random, time

FFMPEG = '/Users/matthiasradder/Library/Python/3.14/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
FONT_BOLD = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
FONT_REG = '/System/Library/Fonts/Supplemental/Arial.ttf'

TW, TH = 1920, 1080
FPS = 30

os.makedirs('assets/video', exist_ok=True)

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
        draw = ImageDraw.Draw(frame)
        
        # Lower Third Card (slide in at t=0.5s) on right side in open living room space
        lt_prog = min(1.0, max(0.0, (t - 0.5) / 0.5))
        if lt_prog > 0:
            lt_y = 860 + int((1.0 - math.pow(lt_prog, 0.4)) * 120)
            lt_x = 860
            card_w = 970
            card_h = 145
            
            draw.rounded_rectangle([(lt_x+4, lt_y+4), (lt_x + card_w+4, lt_y + card_h+4)], radius=16, fill=(0, 0, 0, 100))
            draw.rounded_rectangle([(lt_x, lt_y), (lt_x + card_w, lt_y + card_h)], radius=16, fill=(18, 24, 32, 230), outline=(243, 146, 35, 180), width=2)
            
            # Kicker
            draw.rounded_rectangle([(lt_x + 24, lt_y + 16), (lt_x + 370, lt_y + 46)], radius=8, fill=(243, 146, 35, 240))
            draw.text((lt_x + 38, lt_y + 20), "DE HUIDIGE ZORGMARKT", font=font_kicker, fill=(255, 255, 255, 255))
            
            # Title
            draw.text((lt_x + 24, lt_y + 54), "Het Senioren Dilemma", font=font_title, fill=(255, 255, 255, 255))
            
            # Subtitle
            draw.text((lt_x + 24, lt_y + 102), "Nieuw is onbetaalbaar (€ 4.500+) • Marktplaats is een risico", font=font_sub, fill=(220, 225, 230, 240))
            
            # Warning chip on right
            draw.rounded_rectangle([(lt_x + card_w - 240, lt_y + 45), (lt_x + card_w - 24, lt_y + 100)], radius=10, fill=(185, 28, 28, 230))
            draw.text((lt_x + card_w - 215, lt_y + 60), "! ONZEKERHEID", font=font_pill, fill=(255, 255, 255, 255))

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
            lt_y = 860 + int((1.0 - math.pow(lt_prog, 0.4)) * 120)
            lt_x = 90
            card_w = 980
            card_h = 145
            
            draw.rounded_rectangle([(lt_x+4, lt_y+4), (lt_x + card_w+4, lt_y + card_h+4)], radius=16, fill=(0, 0, 0, 100))
            draw.rounded_rectangle([(lt_x, lt_y), (lt_x + card_w, lt_y + card_h)], radius=16, fill=(18, 35, 18, 230), outline=(106, 177, 60, 200), width=2)
            
            # Kicker
            draw.rounded_rectangle([(lt_x + 24, lt_y + 16), (lt_x + 380, lt_y + 46)], radius=8, fill=(75, 143, 36, 240))
            draw.text((lt_x + 38, lt_y + 20), "OFFICIEEL FITFORM DEALER", font=font_kicker, fill=(255, 255, 255, 255))
            
            # Title
            draw.text((lt_x + 24, lt_y + 54), "Certified Fitform Occasion", font=font_title, fill=(255, 255, 255, 255))
            
            # Subtitle
            draw.text((lt_x + 24, lt_y + 102), "Medische topkwaliteit voor de helft van de prijs: v.a. € 1.050,-", font=font_sub, fill=(190, 225, 180, 240))
            
            # Green badge on right
            draw.rounded_rectangle([(lt_x + card_w - 240, lt_y + 42), (lt_x + card_w - 24, lt_y + 102)], radius=12, fill=(243, 146, 35, 240))
            draw_checkmark(draw, lt_x + card_w - 220, lt_y + 58, size=24, color=(255, 255, 255, 255), width=3)
            draw.text((lt_x + card_w - 185, lt_y + 58), "2 JAAR GARANTIE", font=font_pill, fill=(255, 255, 255, 255))

        draw_watermark(frame, 'right')
        proc.stdin.write(np.array(frame).tobytes())
        
    proc.stdin.close()
    proc.wait()
    print("Scene 2 completed:", out_video)

# ==============================================================================
# SCENE 3: DE WERKPLAATS & 30-PUNTS KEURING (12.33s)
# ==============================================================================
def render_scene3():
    print("--- Rendering Scene 3: De Werkplaats ---")
    base = Image.open('assets/dutch_technician_fitform_workshop_v4.jpg').convert('RGB')
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
            lt_y = 860 + int((1.0 - math.pow(lt_prog, 0.4)) * 120)
            lt_x = 90
            card_w = 980
            card_h = 145
            
            draw.rounded_rectangle([(lt_x+4, lt_y+4), (lt_x + card_w+4, lt_y + card_h+4)], radius=16, fill=(0, 0, 0, 100))
            draw.rounded_rectangle([(lt_x, lt_y), (lt_x + card_w, lt_y + card_h)], radius=16, fill=(18, 32, 20, 230), outline=(75, 143, 36, 200), width=2)
            
            # Kicker
            draw.rounded_rectangle([(lt_x + 24, lt_y + 16), (lt_x + 360, lt_y + 46)], radius=8, fill=(243, 146, 35, 240))
            draw.text((lt_x + 38, lt_y + 20), "30-PUNTS KEURING & REVISIE", font=font_kicker, fill=(255, 255, 255, 255))
            
            # Title
            draw.text((lt_x + 24, lt_y + 54), "Geertjan Klein Haneveld", font=font_title, fill=(255, 255, 255, 255))
            
            # Subtitle
            draw.text((lt_x + 24, lt_y + 102), "Bewegingstechnoloog & Zitspecialist • Werkplaats Dordrecht", font=font_sub, fill=(180, 220, 160, 240))
            
            # Graphic Checkmark Badge on right
            draw.rounded_rectangle([(lt_x + card_w - 230, lt_y + 42), (lt_x + card_w - 24, lt_y + 102)], radius=12, fill=(75, 143, 36, 240))
            draw_checkmark(draw, lt_x + card_w - 210, lt_y + 58, size=24, color=(255, 255, 255, 255), width=3)
            draw.text((lt_x + card_w - 175, lt_y + 58), "100% OP MAAT", font=font_pill, fill=(255, 255, 255, 255))

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
        
        # Gentle cinematic push-in towards Geertjan's warm smile in the showroom
        zoom = 1.00 + 0.05 * math.sin(prog * math.pi * 0.5)
        crop_w = bw / zoom
        crop_h = bh / zoom
        cx = bw * 0.50
        cy = bh * 0.48
        x0 = max(0, min(bw - crop_w, cx - crop_w / 2.0))
        y0 = max(0, min(bh - crop_h, cy - crop_h / 2.0))
        frame = base.crop((int(x0), int(y0), int(x0 + crop_w), int(y0 + crop_h))).resize((TW, TH), Image.Resampling.BILINEAR).convert('RGBA')
        
        draw = ImageDraw.Draw(frame)
        
        # Lower Third / Showroom CTA Card (slide up at t=0.5s)
        lt_prog = min(1.0, max(0.0, (t - 0.5) / 0.5))
        if lt_prog > 0:
            card_w = 1100
            card_h = 148
            lt_x = (TW - card_w) // 2
            lt_y = 870 + int((1.0 - math.pow(lt_prog, 0.4)) * 120)
            
            draw.rounded_rectangle([(lt_x+4, lt_y+4), (lt_x + card_w+4, lt_y + card_h+4)], radius=16, fill=(0, 0, 0, 110))
            draw.rounded_rectangle([(lt_x, lt_y), (lt_x + card_w, lt_y + card_h)], radius=16, fill=(15, 28, 18, 235), outline=(75, 143, 36, 200), width=2)
            
            # Kicker
            draw.rounded_rectangle([(lt_x + 24, lt_y + 16), (lt_x + 390, lt_y + 46)], radius=8, fill=(243, 146, 35, 240))
            draw.text((lt_x + 38, lt_y + 20), "SHOWROOM DORDRECHT", font=font_kicker, fill=(255, 255, 255, 255))
            
            # Title
            draw.text((lt_x + 24, lt_y + 54), "Kom Proefzitten in Dordrecht", font=font_title, fill=(255, 255, 255, 255))
            
            # Subtitle
            draw.text((lt_x + 24, lt_y + 102), "Merwedestraat 239 • Bel direct: 078 - 631 4858", font=font_sub, fill=(255, 220, 180, 240))
            
            # Green CTA button
            btn_w = 230
            btn_h = 50
            btn_x = lt_x + card_w - btn_w - 24
            btn_y = lt_y + 48
            draw.rounded_rectangle([(btn_x, btn_y), (btn_x + btn_w, btn_y + btn_h)], radius=12, fill=(75, 143, 36, 240))
            draw.text((btn_x + 24, btn_y + 14), "MAAK AFSPRAAK", font=font_pill, fill=(255, 255, 255, 255))

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
