import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import subprocess, math, sys, os, random

FFMPEG = '/Users/matthiasradder/Library/Python/3.14/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
FONT_BOLD = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
FONT_REG = '/System/Library/Fonts/Supplemental/Arial.ttf'

def render_scene3():
    base = Image.open('assets/dutch_technician_fitform_workshop_v2.jpg').convert('RGB')
    bw, bh = base.size
    
    fps = 30
    duration = 12.33
    total_frames = int(duration * fps)
    
    out_video = 'assets/video/scene3_werkplaats.mp4'
    audio_file = 'assets/audio/consumer_scene_3.m4a'
    
    # Target resolution: 1920x1080
    tw, th = 1920, 1080
    
    cmd = [
        FFMPEG, '-y',
        '-f', 'rawvideo',
        '-vcodec', 'rawvideo',
        '-s', f'{tw}x{th}',
        '-pix_fmt', 'rgba',
        '-r', str(fps),
        '-i', '-',
        '-i', audio_file,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '19',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        out_video
    ]
    
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    
    # Pre-generate steam particles
    # Steam rises from the upholstery cleaner near the chair (x: 450..650, y: 550..400)
    num_particles = 45
    particles = []
    for i in range(num_particles):
        particles.append({
            'x': random.uniform(500, 680),
            'y': random.uniform(350, 650),
            'vx': random.uniform(-0.8, 1.2),
            'vy': random.uniform(-2.5, -4.5),
            'radius': random.uniform(25, 70),
            'growth': random.uniform(0.6, 1.4),
            'alpha': random.uniform(0.15, 0.45),
            'phase': random.uniform(0, math.pi * 2)
        })
    
    # Ambient sunbeam dust motes
    dust = []
    for i in range(35):
        dust.append({
            'x': random.uniform(200, 1800),
            'y': random.uniform(100, 900),
            'vx': random.uniform(-0.4, 0.4),
            'vy': random.uniform(-0.3, 0.3),
            'size': random.uniform(2, 5),
            'alpha': random.uniform(0.2, 0.6)
        })

    font_kicker = ImageFont.truetype(FONT_BOLD, 22)
    font_title = ImageFont.truetype(FONT_BOLD, 38)
    font_sub = ImageFont.truetype(FONT_REG, 24)
    font_badge = ImageFont.truetype(FONT_BOLD, 20)

    print(f'Rendering Scene 3 ({total_frames} frames)...')

    for f in range(total_frames):
        t = f / float(fps)
        progress = f / float(total_frames)
        
        # 1. Smooth Camera Motion: slow zoom from 1.00 to 1.08 + subtle drift
        zoom = 1.0 + 0.08 * progress
        crop_w = bw / zoom
        crop_h = bh / zoom
        
        # Drift slightly towards Geertjan's hands/ruler
        cx = bw * (0.48 + 0.04 * math.sin(progress * math.pi * 0.7))
        cy = bh * (0.50 + 0.02 * math.cos(progress * math.pi * 0.5))
        
        x0 = max(0, min(bw - crop_w, cx - crop_w / 2.0))
        y0 = max(0, min(bh - crop_h, cy - crop_h / 2.0))
        
        frame_crop = base.crop((int(x0), int(y0), int(x0 + crop_w), int(y0 + crop_h)))
        frame = frame_crop.resize((tw, th), Image.Resampling.BILINEAR).convert('RGBA')
        
        # 2. Atmospheric Steam Effect Layer
        steam_overlay = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
        steam_draw = ImageDraw.Draw(steam_overlay)
        
        for p in particles:
            # Update particle position
            px = p['x'] + p['vx'] * t * 15 + math.sin(t * 2.0 + p['phase']) * 12
            py = p['y'] + p['vy'] * t * 15
            
            # Reset particle when it floats off
            cycle_y = (py - 150) % 550 + 150
            cycle_progress = (650 - cycle_y) / 500.0
            
            rad = p['radius'] + cycle_progress * p['growth'] * 60
            curr_alpha = int(255 * p['alpha'] * math.sin(cycle_progress * math.pi))
            
            # Map coordinates to 1920x1080 screen space (chair is center-left to center)
            sx = (px / bw) * tw + 100
            sy = (cycle_y / bh) * th - 40
            
            if curr_alpha > 5:
                # Soft white-blue steam puff
                steam_draw.ellipse(
                    [(sx - rad, sy - rad), (sx + rad, sy + rad)],
                    fill=(245, 250, 255, max(0, min(255, curr_alpha)))
                )
        
        # Blur the steam overlay for ultra-soft vapor look
        steam_overlay = steam_overlay.filter(ImageFilter.GaussianBlur(radius=18))
        frame = Image.alpha_composite(frame, steam_overlay)
        
        # 3. Ambient Dust Motes in Sunbeams
        draw = ImageDraw.Draw(frame)
        for d in dust:
            dx = (d['x'] + d['vx'] * t * 20) % tw
            dy = (d['y'] + d['vy'] * t * 20) % th
            brightness = int(255 * d['alpha'] * (0.7 + 0.3 * math.sin(t * 3.0 + dx)))
            draw.ellipse(
                [(dx - d['size'], dy - d['size']), (dx + d['size'], dy + d['size'])],
                fill=(255, 248, 220, max(0, min(255, brightness)))
            )
            
        # 4. Animated Holographic Measurement Scan Line (during seconds 2.5 to 8.5)
        if 2.5 <= t <= 8.5:
            scan_prog = (t - 2.5) / 6.0
            # Scan along the ruler and chair height
            scan_y = int(th * 0.42 + math.sin(scan_prog * math.pi * 3) * 110)
            scan_x_start = int(tw * 0.48)
            scan_x_end = int(tw * 0.88)
            
            # Green laser glow line
            scan_alpha = int(180 * math.sin(scan_prog * math.pi))
            draw.line([(scan_x_start, scan_y), (scan_x_end, scan_y)], fill=(75, 255, 75, scan_alpha), width=2)
            draw.line([(scan_x_start, scan_y-1), (scan_x_end, scan_y-1)], fill=(200, 255, 200, int(scan_alpha * 0.6)), width=1)
            
            # Measurement badge following the scan line
            badge_text = f"Zithoogte: 46 cm • Linak Motoren OK"
            draw.rectangle([(scan_x_end - 340, scan_y - 32), (scan_x_end, scan_y - 4)], fill=(18, 43, 7, 210))
            draw.text((scan_x_end - 325, scan_y - 28), badge_text, font=font_badge, fill=(106, 177, 60, 240))
        
        # 5. Broadcast Lower Third (smooth slide in from t=0.6s)
        lt_progress = min(1.0, max(0.0, (t - 0.6) / 0.5))
        if lt_progress > 0:
            lt_y_offset = int((1.0 - math.pow(lt_progress, 0.4)) * 120)
            lt_x = 90
            lt_y = 860 + lt_y_offset
            
            # Backdrop card with glassmorphism dark tint
            card_w = 980
            card_h = 145
            
            # Shadow
            draw.rounded_rectangle([(lt_x+4, lt_y+4), (lt_x + card_w+4, lt_y + card_h+4)], radius=16, fill=(0, 0, 0, 100))
            # Card body
            draw.rounded_rectangle([(lt_x, lt_y), (lt_x + card_w, lt_y + card_h)], radius=16, fill=(18, 32, 20, 225), outline=(75, 143, 36, 200), width=2)
            
            # Kicker pill
            draw.rounded_rectangle([(lt_x + 24, lt_y + 16), (lt_x + 360, lt_y + 46)], radius=8, fill=(243, 146, 35, 240))
            draw.text((lt_x + 38, lt_y + 20), "15-PUNTS KEURING & REVISIE", font=font_kicker, fill=(255, 255, 255, 255))
            
            # Title
            draw.text((lt_x + 24, lt_y + 54), "Geertjan Klein Haneveld", font=font_title, fill=(255, 255, 255, 255))
            
            # Subtitle
            draw.text((lt_x + 24, lt_y + 102), "Bewegingstechnoloog & Zitspecialist • Werkplaats Dordrecht", font=font_sub, fill=(180, 220, 160, 240))
            
            # Checkmark badge on right
            draw.rounded_rectangle([(lt_x + card_w - 230, lt_y + 42), (lt_x + card_w - 24, lt_y + 102)], radius=12, fill=(75, 143, 36, 240))
            draw.text((lt_x + card_w - 212, lt_y + 58), "✓ 100% OP MAAT", font=ImageFont.truetype(FONT_BOLD, 22), fill=(255, 255, 255, 255))

        # 6. Staopstoelen.nl watermark logo top left
        draw.rectangle([(80, 50), (380, 100)], fill=(0, 0, 0, 120))
        draw.text((95, 58), "staopstoelen", font=ImageFont.truetype(FONT_BOLD, 32), fill=(106, 177, 60, 255))
        draw.text((310, 58), ".nl", font=ImageFont.truetype(FONT_BOLD, 32), fill=(243, 146, 35, 255))
        
        proc.stdin.write(np.array(frame).tobytes())
        
        if f % 90 == 0:
            print(f'  Frame {f}/{total_frames} ({t:.1f}s)...')
            
    proc.stdin.close()
    proc.wait()
    print('Scene 3 video generated successfully:', out_video)

if __name__ == '__main__':
    render_scene3()
