import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
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
    
    # 1. Main Frosted Glass Card: lightly translucent white
    draw.rounded_rectangle(
        [(lt_x, lt_y), (lt_x + card_w, lt_y + card_h)],
        radius=22, fill=(255, 255, 255, 215), outline=(255, 255, 255, 180), width=1
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
        draw.rounded_rectangle([(pill_x, pill_y), (pill_x + pill_w, pill_y + pill_h)], radius=15, fill=(240, 253, 244, 240), outline=(75, 143, 36, 140), width=1)
        draw.ellipse([(pill_x + 10, pill_y + 11), (pill_x + 18, pill_y + 19)], fill=(75, 143, 36, 255))
        draw.text((pill_x + 26, pill_y + 5), kicker_text, font=font_kicker, fill=(31, 61, 16, 255))

    # 3. Main Title & Highlight
    title_x = lt_x + 24
    title_y = lt_y + 56
    draw.text((title_x, title_y), title_text, font=font_title, fill=(18, 43, 7, 255))
    if title_highlight:
        tw = font_title.getlength(title_text)
        draw.text((title_x + tw + 10, title_y), title_highlight, font=font_title, fill=title_highlight_color)
        
    # 4. Subtitle / Explanatory Copy
    sub_y = lt_y + 100
    draw.text((title_x, sub_y), subtitle_text, font=font_sub, fill=(71, 85, 105, 255))
    
    # 5. Right Feature Chip Badge
    if chip_text:
        chip_w = font_pill.getlength(chip_text) + 64
        chip_h = 50
        chip_x = lt_x + card_w - chip_w - 24
        chip_y = lt_y + 54
        draw.rounded_rectangle([(chip_x, chip_y), (chip_x + chip_w, chip_y + chip_h)], radius=16, fill=chip_color)
        if chip_type == 'check':
            draw.line([(chip_x + 20, chip_y + 25), (chip_x + 28, chip_y + 34)], fill=(255, 255, 255, 255), width=3)
            draw.line([(chip_x + 28, chip_y + 34), (chip_x + 40, chip_y + 16)], fill=(255, 255, 255, 255), width=3)
            draw.text((chip_x + 48, chip_y + 14), chip_text, font=font_pill, fill=(255, 255, 255, 255))
        elif chip_type == 'warning':
            draw.ellipse([(chip_x + 18, chip_y + 15), (chip_x + 40, chip_y + 37)], outline=(255, 255, 255, 255), width=2)
            draw.text((chip_x + 26, chip_y + 16), '!', font=font_pill, fill=(255, 255, 255, 255))
            draw.text((chip_x + 48, chip_y + 14), chip_text, font=font_pill, fill=(255, 255, 255, 255))
        elif chip_type in ('button', 'calendar'):
            cx = chip_x + 18
            cy = chip_y + 16
            draw.rounded_rectangle([(cx, cy + 3), (cx + 17, cy + 18)], radius=3, outline=(255, 255, 255, 255), width=2)
            draw.line([(cx, cy + 8), (cx + 17, cy + 8)], fill=(255, 255, 255, 255), width=2)
            draw.line([(cx + 4, cy), (cx + 4, cy + 4)], fill=(255, 255, 255, 255), width=2)
            draw.line([(cx + 13, cy), (cx + 13, cy + 4)], fill=(255, 255, 255, 255), width=2)
            draw.rectangle([(cx + 6, cy + 11), (cx + 11, cy + 15)], fill=(255, 255, 255, 255))
            draw.text((chip_x + 44, chip_y + 14), chip_text, font=font_pill, fill=(255, 255, 255, 255))

SWOOSH_LEFT = Image.open('assets/swoosh_badge_left.png').convert('RGBA')
SWOOSH_RIGHT = Image.open('assets/swoosh_badge_right.png').convert('RGBA')

def draw_watermark(frame, side='left'):
    if side == 'left':
        frame.alpha_composite(SWOOSH_LEFT, (0, 0))
    else:
        frame.alpha_composite(SWOOSH_RIGHT, (TW - SWOOSH_RIGHT.width, 0))

SEAL_CERTIFIED = Image.open('assets/sticker_certified_fitform.png').convert('RGBA')
SEAL_BASE = SEAL_CERTIFIED.resize((175, 175), Image.Resampling.LANCZOS).rotate(-5, resample=Image.Resampling.BICUBIC, expand=True)

def draw_seal_stamp(frame, t, start_t=0.8, base_x=120, base_y=640):
    if t < start_t:
        return
    prog = min(1.0, max(0.0, (t - start_t) / 0.45))
    if prog <= 0:
        return
    if prog < 0.7:
        scale_f = 1.35 - 0.45 * (prog / 0.7)
    else:
        scale_f = 0.90 + 0.10 * ((prog - 0.7) / 0.3)
    cur_w = max(10, int(SEAL_BASE.width * scale_f))
    cur_h = max(10, int(SEAL_BASE.height * scale_f))
    cur_seal = SEAL_BASE.resize((cur_w, cur_h), Image.Resampling.LANCZOS)
    float_y = math.sin((t - start_t - 0.6) * 1.8) * 3 if (t - start_t) > 0.6 else 0
    pos_x = base_x - (cur_w - SEAL_BASE.width) // 2
    pos_y = int(base_y + float_y) - (cur_h - SEAL_BASE.height) // 2
    if prog < 1.0:
        alpha_mask = Image.new('L', (cur_w, cur_h), int(255 * prog))
        r, g, b, a = cur_seal.split()
        a = ImageChops.multiply(a, alpha_mask)
        cur_seal = Image.merge('RGBA', (r, g, b, a))
    frame.alpha_composite(cur_seal, (pos_x, pos_y))

# ==============================================================================
# SCENE 1: WAAROM INMETEN?
# ==============================================================================
def render_afspraak_scene1():
    print("--- Rendering Afspraak Scene 1: Waarom Inmeten? ---")
    base = Image.open('assets/certified_fitform_living_room_v1.jpg').convert('RGB')
    bw, bh = base.size
    
    duration = 8.36
    total_frames = int(duration * FPS)
    out_video = 'assets/video/afspraak_s1_waarom.mp4'
    audio_file = 'assets/audio/afspraak_scene_1.m4a'
    
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
    
    for f in range(total_frames):
        t = f / float(FPS)
        prog = f / float(total_frames)
        
        # Subtle cinematic zoom towards the chair
        zoom = 1.01 + 0.05 * math.sin(prog * math.pi * 0.5)
        crop_w = bw / zoom
        crop_h = bh / zoom
        cx = bw * 0.52
        cy = bh * 0.50
        x0 = max(0, min(bw - crop_w, cx - crop_w / 2.0))
        y0 = max(0, min(bh - crop_h, cy - crop_h / 2.0))
        frame = base.crop((int(x0), int(y0), int(x0 + crop_w), int(y0 + crop_h))).resize((TW, TH), Image.Resampling.BILINEAR).convert('RGBA')
        
        # Lower Third Card (slide in at t=0.4s)
        lt_prog = min(1.0, max(0.0, (t - 0.4) / 0.45))
        if lt_prog > 0:
            lt_y = 855 + int((1.0 - math.pow(lt_prog, 0.4)) * 120)
            lt_x = 80
            card_w = 1140
            card_h = 165
            
            draw_huisstijl_card(
                frame, lt_x, lt_y, card_w, card_h,
                kicker_text="ERGONOMISCH ZITADVIES", kicker_color='orange',
                title_text="Waarom een Sta-op Stoel", title_highlight="op Maat Moet Passen", title_highlight_color=(243, 146, 35, 255),
                subtitle_text="Een afwijking van 2 cm veroorzaakt al rugklachten • Koop nooit ongezien uit een doos",
                chip_text="100% OP MAAT", chip_type='check', chip_color=(75, 143, 36, 255)
            )

        draw_watermark(frame, 'right')
        proc.stdin.write(np.array(frame).tobytes())
        
    proc.stdin.close()
    proc.wait()
    print("Afspraak Scene 1 completed:", out_video)

# ==============================================================================
# SCENE 2: DE ZITMETING DOOR GEERTJAN
# ==============================================================================
def render_afspraak_scene2():
    print("--- Rendering Afspraak Scene 2: Persoonlijke Zitmeting ---")
    base = Image.open('assets/geert_en_dame_showroom_169.jpg').convert('RGB')
    bw, bh = base.size
    
    duration = 10.50
    total_frames = int(duration * FPS)
    out_video = 'assets/video/afspraak_s2_zitmeting.mp4'
    audio_file = 'assets/audio/afspraak_scene_2.m4a'
    
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
    
    for f in range(total_frames):
        t = f / float(FPS)
        prog = f / float(total_frames)
        
        # Slow pan across the showroom with Geertjan
        zoom = 1.02 + 0.04 * math.sin(prog * math.pi * 0.6)
        crop_w = bw / zoom
        crop_h = bh / zoom
        cx = bw * (0.42 + 0.04 * prog)
        cy = bh * 0.50
        x0 = max(0, min(bw - crop_w, cx - crop_w / 2.0))
        y0 = max(0, min(bh - crop_h, cy - crop_h / 2.0))
        frame = base.crop((int(x0), int(y0), int(x0 + crop_w), int(y0 + crop_h))).resize((TW, TH), Image.Resampling.BILINEAR).convert('RGBA')
        
        # Lower Third Card (slide in at t=0.4s) on right side where background is calm
        lt_prog = min(1.0, max(0.0, (t - 0.4) / 0.45))
        if lt_prog > 0:
            lt_y = 855 + int((1.0 - math.pow(lt_prog, 0.4)) * 120)
            lt_x = 720
            card_w = 1120
            card_h = 165
            
            draw_huisstijl_card(
                frame, lt_x, lt_y, card_w, card_h,
                kicker_text="STAP 1 • HET PASFORMULIER", kicker_color='green',
                title_text="Persoonlijke Zitmeting door", title_highlight="Geertjan", title_highlight_color=(75, 143, 36, 255),
                subtitle_text="Zithoogte, zitdiepte, armleggers & lendensteun tot op de millimeter opgemeten",
                chip_text="BEWEGINGSTECHNOLOOG", chip_type='check', chip_color=(243, 146, 35, 255)
            )

        draw_watermark(frame, 'left')
        proc.stdin.write(np.array(frame).tobytes())
        
    proc.stdin.close()
    proc.wait()
    print("Afspraak Scene 2 completed:", out_video)

# ==============================================================================
# SCENE 3: PROEFZITTEN & AFSTELLEN
# ==============================================================================
def render_afspraak_scene3():
    print("--- Rendering Afspraak Scene 3: Proefzitten in Dordrecht ---")
    base = Image.open('assets/dutch_technician_fitform_workshop_v5.jpg').convert('RGB')
    bw, bh = base.size
    
    duration = 9.59
    total_frames = int(duration * FPS)
    out_video = 'assets/video/afspraak_s3_proefzitten.mp4'
    audio_file = 'assets/audio/afspraak_scene_3.m4a'
    
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
    
    for f in range(total_frames):
        t = f / float(FPS)
        prog = f / float(total_frames)
        
        # Slow pan on the measuring ruler and precision craftsmanship
        zoom = 1.02 + 0.04 * math.sin(prog * math.pi * 0.5)
        crop_w = bw / zoom
        crop_h = bh / zoom
        cx = bw * (0.50 - 0.03 * prog)
        cy = bh * 0.50
        x0 = max(0, min(bw - crop_w, cx - crop_w / 2.0))
        y0 = max(0, min(bh - crop_h, cy - crop_h / 2.0))
        frame = base.crop((int(x0), int(y0), int(x0 + crop_w), int(y0 + crop_h))).resize((TW, TH), Image.Resampling.BILINEAR).convert('RGBA')
        
        # Lower Third Card (slide in at t=0.4s) on left side
        lt_prog = min(1.0, max(0.0, (t - 0.4) / 0.45))
        if lt_prog > 0:
            lt_y = 855 + int((1.0 - math.pow(lt_prog, 0.4)) * 120)
            lt_x = 80
            card_w = 1140
            card_h = 165
            
            draw_huisstijl_card(
                frame, lt_x, lt_y, card_w, card_h,
                kicker_text="STAP 2 • DIRECT ERVAREN", kicker_color='orange',
                title_text="Vrijblijvend Proefzitten:", title_highlight="30+ Stoelen", title_highlight_color=(75, 143, 36, 255),
                subtitle_text="Wij stellen de stoel ter plekke op maat af • Voel direct het gezonde verschil",
                chip_text="30+ MODELLEN", chip_type='check', chip_color=(75, 143, 36, 255)
            )

        draw_watermark(frame, 'right')
        proc.stdin.write(np.array(frame).tobytes())
        
    proc.stdin.close()
    proc.wait()
    print("Afspraak Scene 3 completed:", out_video)

# ==============================================================================
# SCENE 4: PLAN UW AFSPRAAK
# ==============================================================================
def render_afspraak_scene4():
    print("--- Rendering Afspraak Scene 4: Plan uw Gratis Zitadvies ---")
    base = Image.open('assets/geertjan_advies_showroom.jpg').convert('RGB')
    bw, bh = base.size
    
    duration = 9.10
    total_frames = int(duration * FPS)
    out_video = 'assets/video/afspraak_s4_afspraak.mp4'
    audio_file = 'assets/audio/afspraak_scene_4.m4a'
    
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
    
    for f in range(total_frames):
        t = f / float(FPS)
        prog = f / float(total_frames)
        
        # Elegant push-in on Geertjan giving consultation
        zoom = 1.01 + 0.05 * math.sin(prog * math.pi * 0.5)
        crop_w = bw / zoom
        crop_h = bh / zoom
        cx = bw * 0.48
        cy = bh * 0.50
        x0 = max(0, min(bw - crop_w, cx - crop_w / 2.0))
        y0 = max(0, min(bh - crop_h, cy - crop_h / 2.0))
        frame = base.crop((int(x0), int(y0), int(x0 + crop_w), int(y0 + crop_h))).resize((TW, TH), Image.Resampling.BILINEAR).convert('RGBA')
        
        # Lower Third Card (slide in at t=0.4s) on right side
        lt_prog = min(1.0, max(0.0, (t - 0.4) / 0.45))
        if lt_prog > 0:
            lt_y = 855 + int((1.0 - math.pow(lt_prog, 0.4)) * 120)
            lt_x = 80
            card_w = 1140
            card_h = 165
            
            draw_huisstijl_card(
                frame, lt_x, lt_y, card_w, card_h,
                kicker_text="KOFFIE STAAT KLAAR", kicker_color='green',
                title_text="Plan uw Gratis Zitadvies", title_highlight="in Dordrecht", title_highlight_color=(243, 146, 35, 255),
                subtitle_text="Merwedestraat 239, Dordrecht • 078 - 631 4858 • Gratis bezorgd & geplaatst",
                chip_text="MAAK AFSPRAAK", chip_type='calendar', chip_color=(75, 143, 36, 255)
            )

        draw_seal_stamp(frame, t, start_t=0.6, base_x=120, base_y=640)
        draw_watermark(frame, 'right')
        proc.stdin.write(np.array(frame).tobytes())
        
    proc.stdin.close()
    proc.wait()
    print("Afspraak Scene 4 completed:", out_video)

# ==============================================================================
# ASSEMBLE FULL ZITMETING VIDEO
# ==============================================================================
def assemble_zitmeting_video():
    print("--- Assembling Master Zitmeting Video ---")
    out_master = 'assets/video/zitmeting_proefzitten_dordrecht.mp4'
    concat_list = 'scripts/concat_afspraak.txt'
    with open(concat_list, 'w') as f:
        f.write("file '../assets/video/afspraak_s1_waarom.mp4'\n")
        f.write("file '../assets/video/afspraak_s2_zitmeting.mp4'\n")
        f.write("file '../assets/video/afspraak_s3_proefzitten.mp4'\n")
        f.write("file '../assets/video/afspraak_s4_afspraak.mp4'\n")
        
    cmd = [
        FFMPEG, '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', concat_list,
        '-c', 'copy',
        out_master
    ]
    subprocess.run(cmd, check=True)
    print("ZITMETING VIDEO READY:", out_master)

if __name__ == '__main__':
    t0 = time.time()
    render_afspraak_scene1()
    render_afspraak_scene2()
    render_afspraak_scene3()
    render_afspraak_scene4()
    assemble_zitmeting_video()
    print(f"Total video production finished in {time.time() - t0:.1f}s!")
