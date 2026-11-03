#!/usr/bin/env python3
"""
scripts/apply_official_gevel_branding.py
Plaatst de échte, officiële beeldmerken op de gevel van de vernieuwde showroom:
1. Rechter hoofdbord: Authentiek zwaar Staopstoelen.nl logo + subtitle
2. Linker bord: Officieel Certified Fitform kwaliteitszegel + 15-punts revisie/garantie
3. Rechter vlag: Officieel Certified Fitform kwaliteitszegel
Met natuurlijke buitenverlichting / daglicht-tint en 100% naadloze integratie.
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

def main():
    pristine_path = 'assets/pand_makeover_huisstijl_merwedestraat_pristine.jpg'
    facade = Image.open(pristine_path).convert("RGBA")
    draw = ImageDraw.Draw(facade)
    
    # -------------------------------------------------------------
    # 1. RECHTER BORD (Boven entree): x: 595..1175, y: 212..301
    # -------------------------------------------------------------
    rx1, rx2 = 595, 1175
    ry1, ry2 = 212, 301
    # Natuurlijke daglichttint (aansluitend bij het originele gevelpaneel)
    for y in range(ry1, ry2 + 1):
        t = (y - ry1) / float(ry2 - ry1)
        r = int(228 + 4 * t)
        g = int(232 + 3 * t)
        b = int(235 + 2 * t)
        draw.line([(rx1, y), (rx2, y)], fill=(r, g, b, 255))
        
    # Subtiele schaduw van TL-armatuur en overstek
    for y in range(ry1, ry1 + 6):
        alpha = int((1.0 - (y - ry1) / 6.0) * 35)
        draw.line([(rx1, y), (rx2, y)], fill=(20, 30, 25, alpha))
        
    # Subtiele schaduw aan de onderkant bij het kozijn
    for y in range(ry2 - 4, ry2 + 1):
        alpha = int(((y - (ry2 - 4)) / 4.0) * 25)
        draw.line([(rx1, y), (rx2, y)], fill=(10, 20, 15, alpha))
        
    # Plaats het échte, officiële Staopstoelen.nl logo
    logo = Image.open('assets/staopstoelen_logo_cropped_transparent.png').convert("RGBA")
    logo_h = 49  # Exacte hoogte
    logo_w = int(logo.width * (logo_h / float(logo.height)))
    logo_res = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
    
    # Centreer op het bord
    board_center_x = (rx1 + rx2) // 2
    lx = board_center_x - logo_w // 2
    ly = ry1 + 6
    facade.paste(logo_res, (lx, ly), logo_res)
    
    # Subtitel
    font_sub = ImageFont.truetype('/System/Library/Fonts/HelveticaNeue.ttc', 13, index=1)
    sub1 = "Schipper Compact Wonen"
    dot = " • "
    sub2 = "Specialist in ergonomisch zitcomfort"
    
    bb1 = draw.textbbox((0, 0), sub1, font=font_sub)
    bb_d = draw.textbbox((0, 0), dot, font=font_sub)
    bb2 = draw.textbbox((0, 0), sub2, font=font_sub)
    
    w1 = bb1[2] - bb1[0]
    wd = bb_d[2] - bb_d[0]
    w2 = bb2[2] - bb2[0]
    total_w = w1 + wd + w2
    
    sx = board_center_x - total_w // 2
    sy = ly + logo_h + 8
    
    draw.text((sx, sy), sub1, fill=(28, 55, 33), font=font_sub)
    draw.text((sx + w1, sy), dot, fill=(234, 88, 12), font=font_sub)
    draw.text((sx + w1 + wd, sy), sub2, fill=(45, 75, 52), font=font_sub)
    
    # -------------------------------------------------------------
    # 2. LINKER BORD: x: 136..580, y: 212..301
    # -------------------------------------------------------------
    lx1, lx2 = 136, 580
    ly1, ly2 = 212, 301
    for y in range(ly1, ly2 + 1):
        t = (y - ly1) / float(ly2 - ly1)
        r = int(228 + 4 * t)
        g = int(232 + 3 * t)
        b = int(235 + 2 * t)
        draw.line([(lx1, y), (lx2, y)], fill=(r, g, b, 255))
        
    for y in range(ly1, ly1 + 6):
        alpha = int((1.0 - (y - ly1) / 6.0) * 35)
        draw.line([(lx1, y), (lx2, y)], fill=(20, 30, 25, alpha))
        
    for y in range(ly2 - 4, ly2 + 1):
        alpha = int(((y - (ly2 - 4)) / 4.0) * 25)
        draw.line([(lx1, y), (lx2, y)], fill=(10, 20, 15, alpha))
        
    # Herstel kozijnbalk onder het linkerbord van x: 110 tot 250, y: 300..314
    for y in range(300, 314):
        draw.line([(110, y), (250, y)], fill=(52, 66, 78, 255))
        
    # Plaats het officiële Certified Fitform keurmerk
    cert = Image.open('assets/sticker_certified_fitform.png').convert("RGBA")
    cert_dim = 70
    cert_res = cert.resize((cert_dim, cert_dim), Image.Resampling.LANCZOS)
    cx = lx1 + 22
    cy = ly1 + (ly2 - ly1 - cert_dim) // 2
    facade.paste(cert_res, (cx, cy), cert_res)
    
    # Teksten rechts van het zegel
    tx = cx + cert_dim + 20
    font_h1 = ImageFont.truetype('/System/Library/Fonts/HelveticaNeue.ttc', 17.5, index=1)
    font_h2 = ImageFont.truetype('/System/Library/Fonts/HelveticaNeue.ttc', 14.5, index=1)
    font_small = ImageFont.truetype('/System/Library/Fonts/HelveticaNeue.ttc', 11.5, index=0)
    
    draw.text((tx, ly1 + 11), "15-Punts Keuring & Revisie", fill=(26, 56, 33), font=font_h1)
    draw.text((tx, ly1 + 36), "1 tot 2 Jaar Garantie aan Huis", fill=(46, 104, 25), font=font_h2)
    draw.text((tx, ly1 + 59), "Officieel Certified Fitform Partner • Showroom Dordrecht", fill=(100, 118, 110), font=font_small)
    
    # -------------------------------------------------------------
    # 3. RECHTER VLAG: Volledig dekkend Certified Fitform zegel
    # -------------------------------------------------------------
    cert_flag = cert.resize((82, 82), Image.Resampling.LANCZOS)
    cert_flag_rot = cert_flag.rotate(-28, expand=True, resample=Image.Resampling.BICUBIC)
    # Centreer precies over de oude badge
    facade.paste(cert_flag_rot, (1222, 192), cert_flag_rot)
    
    # Opslaan naar de actieve gevelafbeelding
    out_rgb = facade.convert("RGB")
    out_path = 'assets/pand_makeover_huisstijl_merwedestraat.jpg'
    out_rgb.save(out_path, quality=95)
    print(f"✅ Voltooid: {out_path} geüpdatet met officiële logo's en fotorealistische tint!")

if __name__ == '__main__':
    main()
