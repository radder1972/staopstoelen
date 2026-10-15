#!/usr/bin/env python3
"""
scripts/sync_version.py
Automatische synchronisatie van het actieve versienummer over de gehele website:
- Leest of update VERSION
- Synchroniseert style.css?v=<versie> en app.js?v=<versie> in alle HTML bestanden
- Synchroniseert 'Gerealiseerd door BewegingsTechnologen. | Versie <versie>' in alle footers
- Synchroniseert scratch/generate_regiopaginas.py en api/sync_static_pages.php
- Regenereert alle 15 regiopagina's
"""

import sys
import os
import glob
import re
import subprocess

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERSION_FILE = os.path.join(PROJECT_ROOT, "VERSION")

def get_current_version():
    if os.path.exists(VERSION_FILE):
        with open(VERSION_FILE, "r", encoding="utf-8") as f:
            v = f.read().strip()
            if v:
                return v
    return "10.44"

def bump_version_string(v_str):
    parts = v_str.split(".")
    if len(parts) == 2:
        try:
            minor = int(parts[1])
            return f"{parts[0]}.{minor + 1:02d}"
        except ValueError:
            pass
    return v_str

def main():
    target_version = None

    if len(sys.argv) > 1:
        arg = sys.argv[1].strip()
        if arg == "--bump":
            target_version = bump_version_string(get_current_version())
        else:
            target_version = arg
    else:
        target_version = get_current_version()

    print(f"🔄 Synchroniseren naar actieve versie: {target_version}")

    # 1. Update VERSION bestand
    with open(VERSION_FILE, "w", encoding="utf-8") as f:
        f.write(target_version + "\n")

    # 2. Update package.json version
    pkg_file = os.path.join(PROJECT_ROOT, "package.json")
    if os.path.exists(pkg_file):
        with open(pkg_file, "r", encoding="utf-8") as f:
            pkg_content = f.read()
        pkg_content = re.sub(r'"version":\s*"[^"]+"', f'"version": "{target_version}.0"', pkg_content)
        with open(pkg_file, "w", encoding="utf-8") as f:
            f.write(pkg_content)
        print("  ✓ package.json bijgewerkt")

    # 3. Update generate_regiopaginas.py template
    regio_script = os.path.join(PROJECT_ROOT, "scratch", "generate_regiopaginas.py")
    if os.path.exists(regio_script):
        with open(regio_script, "r", encoding="utf-8") as f:
            regio_content = f.read()

        # Update CSS en JS links
        regio_content = re.sub(r'style\.css\?v=[0-9\.]+', f'style.css?v={target_version}', regio_content)
        regio_content = re.sub(r'app\.js\?v=[0-9\.]+', f'app.js?v={target_version}', regio_content)

        # Update or ensure footer version string
        if "Gerealiseerd door BewegingsTechnologen. | Versie" in regio_content:
            regio_content = re.sub(
                r'Gerealiseerd door BewegingsTechnologen\.\s*\|\s*Versie\s+[0-9\.]+',
                f'Gerealiseerd door BewegingsTechnologen. | Versie {target_version}',
                regio_content
            )
        else:
            regio_content = re.sub(
                r'<p style="font-size: 0\.85rem; color: rgba\(255,255,255,0\.5\);">Showroom Merwedestraat 239 Dordrecht \| KvK: 23078426</p>',
                f'<p style="font-size: 0.85rem; color: rgba(255,255,255,0.5);">Gerealiseerd door BewegingsTechnologen. | Versie {target_version}</p>',
                regio_content
            )

        with open(regio_script, "w", encoding="utf-8") as f:
            f.write(regio_content)
        print("  ✓ generate_regiopaginas.py bijgewerkt")

    # 4. Update api/sync_static_pages.php
    php_sync = os.path.join(PROJECT_ROOT, "api", "sync_static_pages.php")
    if os.path.exists(php_sync):
        with open(php_sync, "r", encoding="utf-8") as f:
            php_content = f.read()
        php_content = re.sub(r'style\.css\?v=[0-9\.]+', f'style.css?v={target_version}', php_content)
        php_content = re.sub(r'app\.js\?v=[0-9\.]+', f'app.js?v={target_version}', php_content)
        php_content = re.sub(
            r'Gerealiseerd door BewegingsTechnologen\.\s*\|\s*Versie\s+[0-9\.]+',
            f'Gerealiseerd door BewegingsTechnologen. | Versie {target_version}',
            php_content
        )
        with open(php_sync, "w", encoding="utf-8") as f:
            f.write(php_content)
        print("  ✓ api/sync_static_pages.php bijgewerkt")

    # 5. Update alle HTML bestanden in root en in stoelen/
    html_files = glob.glob(os.path.join(PROJECT_ROOT, "*.html")) + glob.glob(os.path.join(PROJECT_ROOT, "stoelen", "*.html"))
    updated_count = 0
    for path in html_files:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        orig_content = content

        # Update CSS & JS query params
        content = re.sub(r'style\.css\?v=[0-9\.]+', f'style.css?v={target_version}', content)
        content = re.sub(r'app\.js\?v=[0-9\.]+', f'app.js?v={target_version}', content)

        # Update footer version
        content = re.sub(
            r'Gerealiseerd door BewegingsTechnologen\.\s*\|\s*Versie\s+[0-9\.]+',
            f'Gerealiseerd door BewegingsTechnologen. | Versie {target_version}',
            content
        )

        if content != orig_content:
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            updated_count += 1

    print(f"  ✓ {updated_count} HTML bestanden bijgewerkt met Versie {target_version}")

    # 6. Regenereer de 15 regiopagina's
    if os.path.exists(regio_script):
        subprocess.run([sys.executable, regio_script], check=True, cwd=PROJECT_ROOT)
        print("  ✓ 15 regiopagina's opnieuw gegenereerd")

    print(f"🎉 Versie {target_version} is nu overal 100% synchroon!")

if __name__ == "__main__":
    main()
