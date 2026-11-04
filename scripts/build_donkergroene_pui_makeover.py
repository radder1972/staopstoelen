#!/usr/bin/env python3
"""
scripts/build_donkergroene_pui_makeover.py

Genereert de definitieve gevel- en puifoto van Merwedestraat 239:
1. Pui-houtwerk: Kozijnen, stijlen, dorpels, borstwering en entreedeur in klassiek monumentengroen (RAL 6009).
2. Rechter hoofdbord: Beeldmerk in de goedgekeurde "kleur midden" (#386f24 / RGB 56, 111, 36) en warm oranje (#f39223).
3. Linker gevelbord: Certified Fitform zegel en garantieteksten in passende warme merkkleuren.
4. Volkswagen Transporter bezorgbus: Logo op de flank in de juiste merkkleuren (groen en oranje) met 'ZITSPECIALIST • DORDRECHT'.
5. Etalage: Uitgeklapte oranje Fitform sta-op stoel prominent in het raam onder de showroomspot.
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
from scipy import ndimage

WORKSPACE = '/Users/matthiasradder/AntiGravity Projecten/Staopstoelen.nl'

def main():
    print("🚀 Genereren van gevelmake-over met donkergroen houtwerk, logo-groen bord en bus...")
    
    # Gebruik de scherpe, goedgekeurde basis met oranje stoel in etalage
    base_path = f'{WORKSPACE}/assets/pand_makeover_huisstijl_merwedestraat_pristine.jpg'
    if not os.path.exists(base_path):
        base_path = f'{WORKSPACE}/assets/pand_makeover_huisstijl_merwedestraat.jpg'
        
    im = Image.open(base_path).convert('RGBA')
    arr = np.array(im)
    h, w = arr.shape[:2]
    yy, xx = np.ogrid[:h, :w]

    # 1. HOUTWERK VAN DE PUI NAAR CHIQUE MONUMENTENGROEN (RAL 6009)
    mask_wood = np.zeros((h, w), dtype=bool)
    # Bovenbalk / lijst onder de reclameborden
    mask_wood |= (yy >= 296) & (yy <= 316) & (xx >= 138) & (xx <= 1155)
    # Linker raam: stijlen en borstwering
    mask_wood |= (yy >= 305) & (yy <= 585) & (xx >= 138) & (xx <= 158)
    mask_wood |= (yy >= 580) & (yy <= 610) & (xx >= 138) & (xx <= 598)
    # Deurposten en deurkader
    mask_wood |= (yy >= 305) & (yy <= 618) & (xx >= 595) & (xx <= 616)
    mask_wood |= (yy >= 305) & (yy <= 618) & (xx >= 730) & (xx <= 750)
    mask_wood |= (yy >= 308) & (yy <= 332) & (xx >= 605) & (xx <= 740)
    mask_wood |= (yy >= 595) & (yy <= 620) & (xx >= 605) & (xx <= 740)
    # Deurstijlen en onderpaneel van de deur
    mask_wood |= (yy >= 325) & (yy <= 595) & (xx >= 614) & (xx <= 628)
    mask_wood |= (yy >= 325) & (yy <= 595) & (xx >= 716) & (xx <= 730)
    mask_wood |= (yy >= 505) & (yy <= 598) & (xx >= 614) & (xx <= 730)
    # Rechter raam: tussenstijlen, rechter stijl en borstwering
    mask_wood |= (yy >= 305) & (yy <= 585) & (xx >= 745) & (xx <= 760)
    mask_wood |= (yy >= 305) & (yy <= 585) & (xx >= 942) & (xx <= 960)
    mask_wood |= (yy >= 305) & (yy <= 585) & (xx >= 1135) & (xx <= 1155)
    mask_wood |= (yy >= 580) & (yy <= 610) & (xx >= 745) & (xx <= 1155)

    lum = (arr[:,:,0].astype(float) + arr[:,:,1].astype(float) + arr[:,:,2].astype(float)) / 3.0
    mask_wood &= (lum < 215)
    mask_f = ndimage.gaussian_filter(mask_wood.astype(np.float32), sigma=1.0)

    # Monumentengroen RAL 6009
    target_g = np.array([24.0, 54.0, 32.0])
    for c in range(3):
        norm_lum = np.clip(lum / 115.0, 0.25, 1.8)
        recolored = np.clip(target_g[c] * norm_lum, 0, 255)
        arr[:, :, c] = (arr[:, :, c] * (1.0 - mask_f) + recolored * mask_f).astype(np.uint8)

    # 2. RECHTER HOOFDBORD: GOEDGEKEURDE KLEUR MIDDEN (#386f24)
    r_board_mask = (xx >= 595) & (xx <= 1145) & (yy >= 214) & (yy <= 296)
    is_content = ((arr[:,:,0] < 205) | (arr[:,:,1] < 205) | (arr[:,:,2] < 190)) & r_board_mask
    mask_r_dil = ndimage.binary_dilation(is_content, iterations=3)
    source_r = r_board_mask & (~mask_r_dil)
    dist_r, (idx_ry, idx_rx) = ndimage.distance_transform_edt(~source_r, return_indices=True)
    arr[mask_r_dil, :3] = arr[idx_ry[mask_r_dil], idx_rx[mask_r_dil], :3]
    smooth_r = ndimage.gaussian_filter(arr[:,:,:3].astype(np.float32), sigma=(0.8, 0.8, 0))
    arr[mask_r_dil, :3] = smooth_r[mask_r_dil, :].astype(np.uint8)

    img_wood = Image.fromarray(arr, 'RGBA')

    logo_raw = Image.open(f'{WORKSPACE}/assets/staopstoelen_logo_cropped_transparent.png').convert('RGBA')
    l_arr = np.array(logo_raw).copy()
    mask_g = (l_arr[:,:,3] > 40) & (l_arr[:,:,1] > l_arr[:,:,0])
    target_logo_green = (56, 111, 36) # Optie 1: #386f24
    for y, x in zip(*np.where(mask_g)):
        lum_val = l_arr[y, x, 1] / 109.0
        l_arr[y, x, 0] = int(np.clip(target_logo_green[0] * lum_val, 0, 255))
        l_arr[y, x, 1] = int(np.clip(target_logo_green[1] * lum_val, 0, 255))
        l_arr[y, x, 2] = int(np.clip(target_logo_green[2] * lum_val, 0, 255))
    logo_col = Image.fromarray(l_arr, 'RGBA')
    logo_h = 51
    logo_w = int(logo_col.width * (logo_h / float(logo_col.height)))
    logo_res = logo_col.resize((logo_w, logo_h), Image.Resampling.LANCZOS)

    lx = 870 - logo_w // 2
    ly = 217

    logo_alpha = np.array(logo_res)[:, :, 3]
    sh_mask = Image.fromarray((logo_alpha * 0.25).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))
    sh_color = Image.new('RGBA', (logo_w, logo_h), (20, 25, 20, 180))
    img_wood.paste(sh_color, (lx + 1, ly + 2), sh_mask)
    img_wood.paste(logo_res, (lx, ly), logo_res)

    draw_r = ImageDraw.Draw(img_wood)
    font_sub = ImageFont.truetype('/System/Library/Fonts/HelveticaNeue.ttc', 13.5, index=1)
    sub1 = 'Schipper Compact Wonen'
    dot = ' • '
    sub2 = 'Specialist in ergonomisch zitcomfort'
    bb1 = draw_r.textbbox((0, 0), sub1, font=font_sub)
    bbd = draw_r.textbbox((0, 0), dot, font=font_sub)
    bb2 = draw_r.textbbox((0, 0), sub2, font=font_sub)
    w1, wd, w2 = bb1[2]-bb1[0], bbd[2]-bbd[0], bb2[2]-bb2[0]
    tot_w = w1 + wd + w2
    sx = 870 - tot_w // 2
    sy = ly + logo_h + 3
    draw_r.text((sx, sy), sub1, fill=(42, 85, 28), font=font_sub)
    draw_r.text((sx + w1, sy), dot, fill=(234, 88, 12), font=font_sub)
    draw_r.text((sx + w1 + wd, sy), sub2, fill=(42, 85, 28), font=font_sub)

    # 3. LINKER BORD: CERTIFIED FITFORM ZEGEL & GARANTIES
    board_l_mask = (xx >= 140) & (xx <= 575) & (yy >= 214) & (yy <= 296)
    is_l_content = ((arr[:,:,0] < 205) | (arr[:,:,1] < 205) | (arr[:,:,2] < 190)) & board_l_mask
    mask_l_dil = ndimage.binary_dilation(is_l_content, iterations=3)
    source_l = board_l_mask & (~mask_l_dil)
    dist_l, (idx_ly, idx_lx) = ndimage.distance_transform_edt(~source_l, return_indices=True)
    arr_w = np.array(img_wood)
    arr_w[mask_l_dil, :3] = arr_w[idx_ly[mask_l_dil], idx_lx[mask_l_dil], :3]
    smooth_l = ndimage.gaussian_filter(arr_w[:,:,:3].astype(np.float32), sigma=(0.8, 0.8, 0))
    arr_w[mask_l_dil, :3] = smooth_l[mask_l_dil, :].astype(np.uint8)
    img_wood = Image.fromarray(arr_w, 'RGBA')

    cert_path = f'{WORKSPACE}/assets/sticker_certified_fitform.png'
    cert = Image.open(cert_path).convert('RGBA')
    b_dim = 96
    cert_res = cert.resize((b_dim, b_dim), Image.Resampling.LANCZOS)
    sh_cert = Image.new('RGBA', (b_dim + 4, b_dim + 4), (0, 0, 0, 0))
    ImageDraw.Draw(sh_cert).ellipse([2, 3, b_dim + 1, b_dim + 2], fill=(20, 25, 20, 45))
    sh_cert = sh_cert.filter(ImageFilter.GaussianBlur(1.5))
    bx = 171
    by = 214
    img_wood.paste(sh_cert, (bx - 1, by), sh_cert)
    img_wood.paste(cert_res, (bx, by), cert_res)

    draw_l = ImageDraw.Draw(img_wood)
    font_h1 = ImageFont.truetype('/System/Library/Fonts/HelveticaNeue.ttc', 17, index=1)
    font_h2 = ImageFont.truetype('/System/Library/Fonts/HelveticaNeue.ttc', 14.5, index=1)
    font_small = ImageFont.truetype('/System/Library/Fonts/HelveticaNeue.ttc', 11.5, index=0)
    tx = 282
    ty1 = 227
    draw_l.text((tx, ty1), '15-Punts Keuring & Revisie', fill=(42, 85, 28), font=font_h1)
    ty2 = ty1 + 22
    draw_l.text((tx, ty2), '1 tot 2 Jaar Garantie aan Huis', fill=(55, 108, 36), font=font_h2)
    ty3 = ty2 + 19
    draw_l.text((tx, ty3), 'Certified Fitform Partner • Showroom Dordrecht', fill=(85, 110, 92), font=font_small)

    # 4. VOLKSWAGEN TRANSPORTER: JUISTE KLEUREN (GROEN & ORANJE)
    draw_bus = ImageDraw.Draw(img_wood)
    for y in range(390, 474):
        t_bus = (y - 390) / float(474 - 390)
        r = int(116 + 12 * t_bus)
        g = int(123 + 12 * t_bus)
        b = int(128 + 11 * t_bus)
        draw_bus.line([(0, y), (142, y)], fill=(r, g, b, 255))
    draw_bus.line([(142, 390), (142, 474)], fill=(55, 60, 65, 230))

    sw, sh = 106 * 4, 38 * 4
    canvas = Image.new('RGBA', (sw, sh), (0, 0, 0, 0))
    bus_logo_w = int(sw * 0.86)
    bus_logo_h = int(logo_col.height * (bus_logo_w / float(logo_col.width)))
    bus_logo_res = logo_col.resize((bus_logo_w, bus_logo_h), Image.Resampling.LANCZOS)
    b_lx = (sw - bus_logo_w) // 2
    b_ly = int(3 * 4)

    b_arr = np.array(bus_logo_res)
    b_alpha = b_arr[:, :, 3]
    dilated = ndimage.binary_dilation(b_alpha > 40, iterations=int(1.3 * 4))
    white_mask = Image.fromarray((dilated * 255).astype(np.uint8))
    white_sil = Image.new('RGBA', (bus_logo_w, bus_logo_h), (255, 255, 255, 240))
    canvas.paste(white_sil, (b_lx, b_ly), white_mask)
    canvas.paste(bus_logo_res, (b_lx, b_ly), bus_logo_res)

    draw_bcanvas = ImageDraw.Draw(canvas)
    font_bus_sub = ImageFont.truetype('/System/Library/Fonts/HelveticaNeue.ttc', int(7.0 * 4), index=1)
    sub_bus = 'ZITSPECIALIST • DORDRECHT'
    bb_bus = draw_bcanvas.textbbox((0, 0), sub_bus, font=font_bus_sub)
    s_w = bb_bus[2] - bb_bus[0]
    bs_x = (sw - s_w) // 2
    bs_y = b_ly + bus_logo_h + int(2.5 * 4)
    draw_bcanvas.text((bs_x + 1, bs_y + 1), sub_bus, fill=(20, 25, 30, 210), font=font_bus_sub)
    draw_bcanvas.text((bs_x, bs_y), sub_bus, fill=(255, 255, 255, 255), font=font_bus_sub)

    bus_final = canvas.resize((106, 38), Image.Resampling.LANCZOS)
    img_wood.paste(bus_final, (18, 416), bus_final)

    out_final = img_wood.convert('RGB')
    out_path = f'{WORKSPACE}/assets/pand_makeover_huisstijl_merwedestraat.jpg'
    out_final.save(out_path, quality=95)
    print(f"✅ Definitieve pui & gevel succesvol opgeslagen in {out_path}!")

if __name__ == '__main__':
    main()
