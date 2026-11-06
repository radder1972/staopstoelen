#!/usr/bin/env python3
"""
scripts/import_from_schipper.py
Geautomatiseerde import van stoelen vanaf schippercompactwonen.nl (WooCommerce Store API)
naar Staopstoelen.nl:
1. Zoekt het model via https://schippercompactwonen.nl/wp-json/wc/store/v1/products?search=<query>
2. Downloadt alle originele productfoto's op hoge resolutie naar assets/stoelen/
3. Zet een schone entry in database.json en live_database.json
4. Genereert direct de statische SEO-productpagina in stoelen/<slug>.html en werkt sitemap.xml bij

Gebruik:
  python3 scripts/import_from_schipper.py rene
  python3 scripts/import_from_schipper.py rene --price 2150 --old-price 2500
"""
import argparse, datetime, html, json, os, re, ssl, urllib.parse, urllib.request
from pathlib import Path

WS = Path('/Users/matthiasradder/AntiGravity Projecten/Staopstoelen.nl')
os.chdir(WS)
ctx = ssl._create_unverified_context()

def fetch_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Staopstoelen-Importer/1.0'})
    with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
        return json.loads(r.read().decode('utf-8'))

def download_file(url, dest: Path):
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={'User-Agent': 'Staopstoelen-Importer/1.0'})
    with urllib.request.urlopen(req, context=ctx, timeout=60) as r:
        dest.write_bytes(r.read())

def get_image_width(path: Path) -> int:
    try:
        from PIL import Image
        with Image.open(path) as im:
            return im.width
    except Exception:
        return 0

def import_chair(query: str, override_price=None, override_old_price=None, is_offer=False, badge=None, ambient_image=None):
    url = f"https://schippercompactwonen.nl/wp-json/wc/store/v1/products?search={urllib.parse.quote(query)}"
    products = fetch_json(url)
    if not products:
        raise SystemExit(f"Geen product gevonden op schippercompactwonen.nl voor '{query}'")

    # Kies beste match
    prod = products[0]
    for p in products:
        if query.lower() in p.get('slug', '').lower() or query.lower() in p.get('name', '').lower():
            prod = p
            break

    slug = prod['slug']
    raw_name = html.unescape(prod['name']).strip()
    # Mooie schrijfwijze (bijv. RENE -> René)
    name = re.sub(r'\bRENE\b', 'René', raw_name)
    model = re.sub(r'^(?:sta-?op\s+stoel|senioren\s*stoel)\s+', '', name, flags=re.I).strip()

    # Prijs uit WooCommerce (in centen)
    prices = prod.get('prices', {})
    minor = int(prices.get('currency_minor_unit', 2))
    wc_price = int(float(prices.get('price', 0)) / (10 ** minor)) if prices.get('price') else 0
    wc_reg = int(float(prices.get('regular_price', 0)) / (10 ** minor)) if prices.get('regular_price') else wc_price

    price = override_price if override_price is not None else wc_price
    old_price = override_old_price if override_old_price is not None else (wc_reg if wc_reg > price else None)

    # Attributen & specificaties
    specs = {}
    brand = "DFM"
    for attr in prod.get('attributes', []):
        attr_name = attr.get('name', '').strip()
        terms = [html.unescape(t.get('name', '')).strip() for t in attr.get('terms', []) if t.get('name')]
        val = " / ".join(terms)
        if not val:
            continue
        if attr_name.lower() == 'merk':
            brand = val
        specs[attr_name] = val

    # Foto's downloaden
    downloaded = []
    for img in prod.get('images', []):
        src = img.get('src', '')
        if not src:
            continue
        fname = os.path.basename(urllib.parse.urlparse(src).path)
        local_rel = f"assets/stoelen/{fname}"
        local_abs = WS / local_rel
        if not local_abs.exists():
            download_file(src, local_abs)
        downloaded.append((local_rel, get_image_width(local_abs)))

    # Als de eerste thumbnail heel klein is (<400px) en de 2e foto scherp (>=600px), zet de scherpe foto voorop!
    if len(downloaded) >= 2 and downloaded[0][1] < 400 and downloaded[1][1] >= 600:
        ordered_imgs = [x[0] for x in downloaded[1:]] + [downloaded[0][0]]
    else:
        ordered_imgs = [x[0] for x in downloaded]

    main_img = ordered_imgs[0] if ordered_imgs else ""
    img_up = ordered_imgs[1] if len(ordered_imgs) > 1 else None
    img_lie = ordered_imgs[2] if len(ordered_imgs) > 2 else None

    desc = prod.get('description') or prod.get('short_description') or ''
    desc = desc.replace('RENE', 'René')

    entry = {
        "id": slug,
        "name": name,
        "brand": brand,
        "model": model,
        "price": price,
        "old_price": old_price,
        "condition": "nieuw",
        "status": "beschikbaar",
        "type": "staop",
        "material": "stof / leer",
        "badge": badge or ("Aanbieding" if old_price and old_price > price else "Draaibaar & Accu"),
        "badgeType": "new",
        "image": main_img,
        "imageUp": img_up,
        "imageLie": img_lie,
        "ambientImage": ambient_image,
        "gallery": ordered_imgs,
        "features": [
            "Verstelbare hoofdsteun (in hoogte én hoek, optioneel elektrisch)",
            "Standaard met onzichtbaar weggewerkte accu (snoerloos in de kamer)",
            "2 onafhankelijke motoren & automatische draaiblokkering bij het opstaan"
        ],
        "specifications": specs,
        "is_offer": bool(is_offer or (old_price and old_price > price)),
        "description": desc,
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    # Update database.json & live_database.json (haal eerst actuele live database op zodat we niets overschrijven)
    try:
        live_resp = urllib.request.urlopen("https://staopstoelen.nl/api/chairs.php", context=ctx, timeout=20).read()
        live_items = json.loads(live_resp.decode('utf-8')).get('staopstoelen', [])
    except Exception:
        live_items = None

    # Upload gedownloade foto's + eventuele sfeerfoto direct naar de live server via api/upload.php
    import base64
    upload_list = [x[0] for x in downloaded]
    if ambient_image:
        upload_list.append(ambient_image)
    live_gallery = []
    for rel_path in upload_list:
        p = WS / rel_path
        if not p.exists():
            continue
        fname = p.name
        (WS / 'assets' / fname).write_bytes(p.read_bytes())
        mime = 'image/png' if fname.lower().endswith('.png') else 'image/jpeg'
        b64 = f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode('ascii')
        try:
            u_req = urllib.request.Request(
                "https://staopstoelen.nl/api/upload.php",
                data=json.dumps({"filename": fname, "fileData": b64}).encode('utf-8'),
                headers={'Content-Type': 'application/json', 'User-Agent': 'Staopstoelen-Importer/1.0'},
                method='POST'
            )
            urllib.request.urlopen(u_req, context=ctx, timeout=60).read()
        except Exception as e:
            print(f"Waarschuwing: live upload van {fname} mislukt: {e}")
        live_gallery.append(f"assets/{fname}")

    if live_gallery:
        entry['image'] = live_gallery[0]
        entry['imageUp'] = live_gallery[1] if len(live_gallery) > 1 else None
        entry['imageLie'] = live_gallery[2] if len(live_gallery) > 2 else None
        if ambient_image:
            entry['ambientImage'] = f"assets/{Path(ambient_image).name}"
        entry['gallery'] = live_gallery

    for db_name in ('database.json', 'live_database.json'):
        db_path = WS / db_name
        if not db_path.exists():
            continue
        db = json.loads(db_path.read_text(encoding='utf-8'))
        items = list(live_items) if live_items is not None else db.get('staopstoelen', [])
        replaced = False
        for i, it in enumerate(items):
            if it.get('id') == slug:
                items[i] = entry
                replaced = True
                break
        if not replaced:
            items.append(entry)
        db['staopstoelen'] = items
        db_path.write_text(json.dumps(db, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

    # Push direct naar de live MySQL database & laat de server stoelen/<slug>.html en sitemap.xml aanmaken
    try:
        push_req = urllib.request.Request(
            "https://staopstoelen.nl/api/chairs.php",
            data=(WS / 'database.json').read_bytes(),
            headers={'Content-Type': 'application/json', 'User-Agent': 'Staopstoelen-Importer/1.0'},
            method='POST'
        )
        push_res = urllib.request.urlopen(push_req, context=ctx, timeout=30).read().decode('utf-8')
        print("Live server gesynchroniseerd:", push_res)
    except Exception as e:
        print(f"Waarschuwing: live DB push mislukt: {e}")

    # Genereer statische SEO-pagina in stoelen/<slug>.html op basis van template
    build_static_seo_page(entry)
    update_sitemap(entry)
    print(f"Geïmporteerd: {entry['name']} ({slug}) -> € {price} (was: {old_price}) | {len(ordered_imgs)} foto's")
    return entry

def fmt_eur(val):
    return f"{int(val):,}".replace(",", ".")

def build_static_seo_page(chair):
    tpl_path = WS / 'stoelen/sta-op-stoel-ravi.html'
    html_str = tpl_path.read_text(encoding='utf-8')

    cid = chair['id']
    cname = chair['name']
    brand = chair['brand']
    model = chair['model']
    price = chair['price']
    old_price = chair.get('old_price')
    main_img = chair['image']
    gallery = list(chair.get('gallery', []))
    if chair.get('ambientImage') and chair['ambientImage'] not in gallery:
        gallery.append(chair['ambientImage'])

    # Vervang basisvelden uit Ravi-template
    html_str = html_str.replace('sta-op-stoel-ravi', cid)
    html_str = html_str.replace('Sta-op stoel Ravi', cname)
    html_str = html_str.replace('<span class="modal-spec-value">Ravi</span>', f'<span class="modal-spec-value">{html.escape(model)}</span>')
    html_str = html_str.replace('assets/stoelen/Sta-op-stoel-RAVI-1-kopie.jpg', main_img)
    html_str = html_str.replace('"price": "1945"', f'"price": "{int(price)}"')

    # Prijsbox (met of zonder van/voor aanbiedingsprijs)
    if old_price and old_price > price:
        korting = int(old_price - price)
        price_box = f'''<div class="modal-price-box" style="margin-top: 20px; width: 100%; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; margin-bottom: 16px;">
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
            <span style="text-decoration: line-through; color: #8a9097; font-size: 1.05rem; font-weight: 600;">Adviesprijs: € {fmt_eur(old_price)},-</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: linear-gradient(115deg, #ea580c 0%, #256616 100%); color: #ffffff; font-size: 0.8rem; font-weight: 800; padding: 3px 9px; border-radius: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Actieprijs</span>
              <span class="price-value" style="color: var(--color-forest); font-weight: 800; font-size: 2rem; line-height: 1.1;">€ {fmt_eur(price)},-</span>
            </div>
            <span style="font-size: 0.85rem; color: #284e1b; font-weight: 700; background: rgba(75, 143, 36, 0.1); padding: 3px 12px; border-radius: 999px;">Uw voordeel: € {fmt_eur(korting)},-</span>
          </div>
        </div>'''
    else:
        price_box = f'''<div class="modal-price-box" style="margin-top: 20px; width: 100%; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; margin-bottom: 16px;">
          <span class="price-value" style="font-size: 1.95rem; font-weight: 800; color: var(--color-forest); line-height: 1;">€ {fmt_eur(price)},-</span>
        </div>'''

    html_str = re.sub(
        r'<div class="modal-price-box"[\s\S]*?</div>\s*(?=<!-- Action CTA Buttons -->)',
        price_box + '\n\n        ',
        html_str
    )

    # Thumbnails
    thumbs = []
    for idx, g in enumerate(gallery):
        act = ' active' if idx == 0 else ''
        thumbs.append(f'''              <div class="gallery-thumbnail{act}" onclick="switchDetailPhoto('../{g}', this)" title="Bekijk foto {idx+1}">
                <img src="../{g}" alt="Foto {idx+1} {html.escape(cname)}" style="width: 100%; height: 100%; object-fit: contain;">
              </div>''')
    thumbs_block = '<div class="modal-gallery-thumbnails" style="justify-content: flex-start; margin-top: 14px; padding: 4px 2px;">\n' + '\n'.join(thumbs) + '\n          </div>'
    html_str = re.sub(r'<div class="modal-gallery-thumbnails"[\s\S]*?</div>\s*</div>\s*(?=<div class="modal-highlights-box")', thumbs_block + '\n\n        ', html_str)

    # Features
    feats_li = ''.join(f'<li>{html.escape(f)}</li>' for f in chair.get('features', []))
    html_str = re.sub(r'<ul class="modal-highlights-list">[\s\S]*?</ul>', f'<ul class="modal-highlights-list">\n            {feats_li}\n          </ul>', html_str)

    # Specificaties
    spec_items = [
        ('Merk', brand),
        ('Model', model),
        ('Staat', 'Nieuw'),
        ('Materiaal', chair.get('material', 'Stof / Leer')),
    ]
    for k, v in chair.get('specifications', {}).items():
        if k.lower() not in ('merk', 'model', 'staat', 'materiaal'):
            spec_items.append((k, v))
    spec_html = '\n'.join(
        f'''            <div class="modal-spec-item">
              <span class="modal-spec-label">{html.escape(k)}</span>
              <span class="modal-spec-value">{html.escape(v)}</span>
            </div>''' for k, v in spec_items
    )
    html_str = re.sub(r'<div class="modal-specs-grid">[\s\S]*?</div>\s*</div>\s*(?=<!-- Description -->)', f'<div class="modal-specs-grid">\n{spec_html}\n          </div>\n        </div>\n\n        ', html_str)

    # Beschrijving
    desc_clean = chair['description'].replace('\n', ' ')
    html_str = re.sub(r'"description": ".*?",\s*"brand":', lambda m: f'"description": {json.dumps(desc_clean, ensure_ascii=False)},\n    "brand":', html_str)
    html_str = re.sub(r'(Over de .*?</h3>\s*<div>)[\s\S]*?(</div>\s*</div>\s*</div>\s*</div>\s*<!-- Showroom)', lambda m: m.group(1) + chair['description'] + m.group(2), html_str)

    out_file = WS / f"stoelen/{cid}.html"
    out_file.write_text(html_str, encoding='utf-8')

def update_sitemap(chair):
    sm_path = WS / 'sitemap.xml'
    if not sm_path.exists():
        return
    sm = sm_path.read_text(encoding='utf-8')
    loc = f"https://staopstoelen.nl/stoelen/{chair['id']}.html"
    if loc in sm:
        return
    today = datetime.date.today().isoformat()
    block = f"""  <url>
    <loc>{loc}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>https://staopstoelen.nl/{chair['image']}</image:loc>
      <image:title>{html.escape(chair['name'])}</image:title>
    </image:image>
  </url>
</urlset>"""
    sm = sm.replace('</urlset>', block)
    sm_path.write_text(sm, encoding='utf-8')

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('query', help='Zoekterm of slug op schippercompactwonen.nl (bijv. rene)')
    ap.add_argument('--price', type=int, default=None, help='Actieprijs / verkoopprijs in EUR')
    ap.add_argument('--old-price', type=int, default=None, help='Oorspronkelijke prijs in EUR')
    ap.add_argument('--ambient', type=str, default=None, help='Pad naar cozy sfeerfoto')
    args = ap.parse_args()
    import_chair(args.query, override_price=args.price, override_old_price=args.old_price, ambient_image=args.ambient)
