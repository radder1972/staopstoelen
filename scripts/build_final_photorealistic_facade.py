#!/usr/bin/env python3
"""
scripts/build_final_photorealistic_facade.py

Bouwt de definitieve, 100% fotorealistische gevel en bus voor staopstoelen.nl:
- Behoudt alle werkelijke fotografische details van het pand (gevelkozijnen, lichtbalken, schroeven, bakstenen).
- Bus: Officieel beeldmerk met 'staopstoelen' in groen, '.nl' in oranje + 'ZITSPECIALIST • DORDRECHT' strak eronder,
       volledig binnen het paneel met ruime marges (geen afgesneden tekst of naadoverschrijding).
- Rechter bord: Behoudt de authentieke gevelverlichting, logo en compacte ondertitel.
- Linker bord: Naadloos geïntegreerd op de originele Dibond plaat. Bevat het officiële Certified Fitform zegel
       en compacte garantieteksten (15-Punts Keuring & Revisie, 1 tot 2 Jaar Garantie aan Huis, Certified Fitform Partner).
- Rechter vlag: Natuurlijk wapperende vlag met 'staopstoelen' in merkgroen, '.nl' in oranje en het officiële
       Certified Fitform keurmerk in natuurlijk doekperspectief.
- Linker vlag: 100% originele fototextuur met vlaggenstok en merkkleuren.
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
from scipy import ndimage

WORKSPACE = '/Users/matthiasradder/AntiGravity Projecten/Staopstoelen.nl'

def build_bus_lettering(w, h):
    scale = 4
    sw, sh = w * scale, h * scale
    canvas = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    
    logo = Image.open(f'{WORKSPACE}/assets/staopstoelen_logo_cropped_transparent.png').convert("RGBA")
    logo_w = int(sw * 0.86)
    logo_h = int(logo.height * (logo_w / float(logo.width)))
    logo_res = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
    
    lx = (sw - logo_w) // 2
    ly = int(3 * scale)
    
    # Subtiele witte vinyl contour voor hoog contrast op Indium Grey lak
    logo_arr = np.array(logo_res)
    alpha = logo_arr[:, :, 3]
    dilated = ndimage.binary_dilation(alpha > 40, iterations=int(1.2 * scale))
    white_mask = Image.fromarray((dilated * 255).astype(np.uint8))
    white_sil = Image.new("RGBA", (logo_w, logo_h), (255, 255, 255, 235))
    canvas.paste(white_sil, (lx, ly), white_mask)
    canvas.paste(logo_res, (lx, ly), logo_res)
    
    draw = ImageDraw.Draw(canvas)
    font_sub = ImageFont.truetype('/System/Library/Fonts/HelveticaNeue.ttc', int(7.0 * scale), index=1)
    sub = "ZITSPECIALIST • DORDRECHT"
    bb = draw.textbbox((0, 0), sub, font=font_sub)
    sub_w = bb[2] - bb[0]
    sx = (sw - sub_w) // 2
    sy = ly + logo_h + int(2.5 * scale)
    
    draw.text((sx + 1, sy + 1), sub, fill=(20, 25, 30, 210), font=font_sub)
    draw.text((sx, sy), sub, fill=(255, 255, 255, 255), font=font_sub)
    
    return canvas.resize((w, h), Image.Resampling.LANCZOS)

def main():
    print("🚀 Definitieve fotorealistische revisie van gevel, bus en vlaggen...")
    pristine_path = f'{WORKSPACE}/assets/pand_makeover_huisstijl_merwedestraat_pristine.jpg'
    img = Image.open(pristine_path).convert("RGBA")
    arr = np.array(img)
    
    # -------------------------------------------------------------
    # 1. BUSBELETTERING (In merkkleuren met veilige marges)
    # -------------------------------------------------------------
    print("  ► 1. Bus: lak inpaint & officiële belettering...")
    draw = ImageDraw.Draw(img)
    for y in range(390, 474):
        t = (y - 390) / float(474 - 390)
        r = int(116 + 12 * t)
        g = int(123 + 12 * t)
        b = int(128 + 11 * t)
        draw.line([(0, y), (142, y)], fill=(r, g, b, 255))
    draw.line([(142, 390), (142, 474)], fill=(55, 60, 65, 230))
    
    bus_art = build_bus_lettering(106, 38)
    img.paste(bus_art, (18, 416), bus_art)
    
    # Update array na bus aanpassing
    arr = np.array(img)
    
    # -------------------------------------------------------------
    # 2. LINKER GEVELBORD (100% natuurlijk behoud van origineel frame & schroeven)
    # -------------------------------------------------------------
    print("  ► 2. Linker gevelbord: naadloze inpainting & officiële zegel + teksten...")
    yy, xx = np.ogrid[:img.height, :img.width]
    board_mask = (xx >= 140) & (xx <= 575) & (yy >= 214) & (yy <= 296)
    
    dark_text = (arr[:,:,0] < 125) & (arr[:,:,1] < 125) & (arr[:,:,2] < 125) & board_mask & (xx >= 275)
    is_orange = (arr[:,:,0] > 150) & (arr[:,:,2] < 110) & board_mask & (xx <= 270)
    dist_old_badge = np.sqrt(((xx - 220)/1.1)**2 + (yy - 270)**2)
    is_badge = (dist_old_badge < 48) & board_mask & (is_orange | (arr[:,:,0] < 165))
    
    mask_to_inpaint = dark_text | is_badge
    mask_dil = ndimage.binary_dilation(mask_to_inpaint, iterations=2)
    
    source_pixels = board_mask & (~mask_dil)
    dist, (idx_y, idx_x) = ndimage.distance_transform_edt(~source_pixels, return_indices=True)
    
    arr[mask_dil, :3] = arr[idx_y[mask_dil], idx_x[mask_dil], :3]
    smooth_arr = ndimage.gaussian_filter(arr[:,:,:3].astype(np.float32), sigma=(1.0, 1.0, 0))
    arr[mask_dil, :3] = smooth_arr[mask_dil, :].astype(np.uint8)
    
    img = Image.fromarray(arr, 'RGBA')
    
    # Officiële Certified Fitform sticker (diameter 98px)
    cert = Image.open(f'{WORKSPACE}/assets/sticker_certified_fitform.png').convert('RGBA')
    b_dim = 98
    cert_res = cert.resize((b_dim, b_dim), Image.Resampling.LANCZOS)
    
    c_arr = np.array(cert_res).astype(np.float32)
    c_arr[:, :, 0] *= (208.0 / 255.0)
    c_arr[:, :, 1] *= (212.0 / 255.0)
    c_arr[:, :, 2] *= (216.0 / 255.0)
    cert_adj = Image.fromarray(np.clip(c_arr, 0, 255).astype(np.uint8), 'RGBA')
    
    shadow = Image.new('RGBA', (b_dim + 6, b_dim + 6), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse([2, 3, b_dim + 3, b_dim + 4], fill=(20, 25, 20, 45))
    shadow = shadow.filter(ImageFilter.GaussianBlur(1.5))
    
    bx = 171
    by = 214
    img.paste(shadow, (bx - 2, by - 1), shadow)
    img.paste(cert_adj, (bx, by), cert_adj)
    
    # Typografie op het linkerbord: strak en compact uitgelijnd
    draw_board = ImageDraw.Draw(img)
    font_h1 = ImageFont.truetype('/System/Library/Fonts/HelveticaNeue.ttc', 17, index=1)
    font_h2 = ImageFont.truetype('/System/Library/Fonts/HelveticaNeue.ttc', 14.5, index=1)
    font_small = ImageFont.truetype('/System/Library/Fonts/HelveticaNeue.ttc', 11.5, index=0)
    
    tx = 282
    ty1 = 227
    draw_board.text((tx, ty1), '15-Punts Keuring & Revisie', fill=(24, 52, 28), font=font_h1)
    ty2 = ty1 + 22
    draw_board.text((tx, ty2), '1 tot 2 Jaar Garantie aan Huis', fill=(44, 100, 25), font=font_h2)
    ty3 = ty2 + 19
    draw_board.text((tx, ty3), 'Certified Fitform Partner • Showroom Dordrecht', fill=(82, 102, 92), font=font_small)
    
    # -------------------------------------------------------------
    # 3. RECHTER HOOFDBORD OP DE PUI (Het officiële zware Staopstoelen.nl logo!)
    # -------------------------------------------------------------
    print("  ► 3. Rechter hoofdbord: officieel zwaar beeldmerk & compacte ondertitel...")
    arr = np.array(img)
    r_board_mask = (xx >= 595) & (xx <= 1145) & (yy >= 214) & (yy <= 296)
    
    is_content = ((arr[:,:,0] < 202) | (arr[:,:,1] < 202) | (arr[:,:,2] < 185)) & r_board_mask
    mask_r_dil = ndimage.binary_dilation(is_content, iterations=3)
    
    source_r = r_board_mask & (~mask_r_dil)
    dist_r, (idx_ry, idx_rx) = ndimage.distance_transform_edt(~source_r, return_indices=True)
    
    arr[mask_r_dil, :3] = arr[idx_ry[mask_r_dil], idx_rx[mask_r_dil], :3]
    smooth_r = ndimage.gaussian_filter(arr[:,:,:3].astype(np.float32), sigma=(0.8, 0.8, 0))
    arr[mask_r_dil, :3] = smooth_r[mask_r_dil, :].astype(np.uint8)
    
    img = Image.fromarray(arr, 'RGBA')
    
    # Plaats het authentieke zware beeldmerk (staopstoelen_logo_cropped_transparent.png)
    logo = Image.open(f'{WORKSPACE}/assets/staopstoelen_logo_cropped_transparent.png').convert('RGBA')
    logo_h = 51
    logo_w = int(logo.width * (logo_h / float(logo.height)))
    logo_res = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
    
    lx = 870 - logo_w // 2
    ly = 217
    
    l_arr = np.array(logo_res).astype(np.float32)
    l_arr[:, :, 0] *= (208.0 / 255.0)
    l_arr[:, :, 1] *= (212.0 / 255.0)
    l_arr[:, :, 2] *= (216.0 / 255.0)
    logo_adj = Image.fromarray(np.clip(l_arr, 0, 255).astype(np.uint8), 'RGBA')
    
    img.paste(logo_adj, (lx, ly), logo_adj)
    
    # Ondertitel strak en harmonieus onder het officiële logo
    draw_r = ImageDraw.Draw(img)
    font_sub = ImageFont.truetype('/System/Library/Fonts/HelveticaNeue.ttc', 13.5, index=1)
    sub1 = 'Schipper Compact Wonen'
    dot = ' • '
    sub2 = 'Specialist in ergonomisch zitcomfort'
    
    bb1 = draw_r.textbbox((0, 0), sub1, font=font_sub)
    bbd = draw_r.textbbox((0, 0), dot, font=font_sub)
    bb2 = draw_r.textbbox((0, 0), sub2, font=font_sub)
    w1 = bb1[2] - bb1[0]
    wd = bbd[2] - bbd[0]
    w2 = bb2[2] - bb2[0]
    tot_w = w1 + wd + w2
    
    sx = 870 - tot_w // 2
    sy = ly + logo_h + 3  # Slechts 3px tussenruimte
    
    draw_r.text((sx, sy), sub1, fill=(28, 55, 33), font=font_sub)
    draw_r.text((sx + w1, sy), dot, fill=(234, 88, 12), font=font_sub)
    draw_r.text((sx + w1 + wd, sy), sub2, fill=(45, 75, 52), font=font_sub)
    
    # -------------------------------------------------------------
    # 4. RECHTER VLAG (Sta op stoelen in groen, .nl in oranje + officiële zegel)
    # -------------------------------------------------------------
    print("  ► 4. Rechter vlag: doekkleuren & officiële zegel in perspectief...")
    arr = np.array(img)
    
    flag_poly = [(1174, 82), (1324, 230), (1270, 286), (1222, 238), (1156, 174)]
    mask_poly = Image.new('L', (img.width, img.height), 0)
    ImageDraw.Draw(mask_poly).polygon(flag_poly, fill=255)
    flag_mask = np.array(mask_poly) > 0
    
    text_box = (xx >= 1180) & (xx <= 1285) & (yy >= 142) & (yy <= 215)
    dark_letters = (arr[:,:,0] < 115) & (arr[:,:,1] < 115) & (arr[:,:,2] < 115) & flag_mask & text_box
    
    for y_idx, x_idx in zip(*np.where(dark_letters)):
        lum = (int(arr[y_idx, x_idx, 0]) + int(arr[y_idx, x_idx, 1]) + int(arr[y_idx, x_idx, 2])) / 3.0
        factor = lum / 100.0
        arr[y_idx, x_idx, 0] = int(np.clip(35 * factor + 5, 0, 255))
        arr[y_idx, x_idx, 1] = int(np.clip(90 * factor + 15, 0, 255))
        arr[y_idx, x_idx, 2] = int(np.clip(25 * factor + 5, 0, 255))
        
    img = Image.fromarray(arr, 'RGBA')
    
    # Plaats de officiële Certified Fitform sticker op de vlag in natuurlijk doekperspectief
    cert_flag = cert.resize((62, 54), Image.Resampling.LANCZOS)
    cert_flag_rot = cert_flag.rotate(-32, expand=True, resample=Image.Resampling.BICUBIC)
    
    cf_arr = np.array(cert_flag_rot).astype(np.float32)
    cf_arr[:, :, 0] *= (222.0 / 255.0)
    cf_arr[:, :, 1] *= (224.0 / 255.0)
    cf_arr[:, :, 2] *= (228.0 / 255.0)
    cert_flag_adj = Image.fromarray(np.clip(cf_arr, 0, 255).astype(np.uint8), 'RGBA')
    
    fx = 1256 - cert_flag_adj.width // 2
    fy = 258 - cert_flag_adj.height // 2
    img.paste(cert_flag_adj, (fx, fy), cert_flag_adj)
    
    # -------------------------------------------------------------
    # 4. OPSLAAN & VERIFIËREN
    # -------------------------------------------------------------
    out_rgb = img.convert("RGB")
    out_path = f'{WORKSPACE}/assets/pand_makeover_huisstijl_merwedestraat.jpg'
    out_rgb.save(out_path, quality=95)
    print(f"✅ Definitieve gevel succesvol gegenereerd: {out_path}")

if __name__ == '__main__':
    main()
