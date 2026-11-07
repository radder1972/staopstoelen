#!/usr/bin/env python3
"""
package_marktplaats_advertentie.py

Zorgt ervoor dat elke Marktplaats advertentie-fotomap compleet en volgens de vaste
standaard van Staopstoelen.nl wordt ingericht.

Vaste volgorde:
  0_..._HERO_MET_BADGE.jpg  (Vrijstaand met Certified Fitform badge)
  1_... t/m 5_...           (Functionele standen & details)
  6_..._COZY_SHOT.jpg       (Warme sfeervolle woonkamer lifestyle foto)
  7_BEDRIJFSINFO_SHOWROOM_EN_SERVICE.jpg (Vaste bedrijfsinfo & garantie banner)

Gebruik:
  python3 scripts/package_marktplaats_advertentie.py           # Synchroniseert alle advertentiemappen
  python3 scripts/package_marktplaats_advertentie.py <map_pad> # Synchroniseert specifieke map
"""

import os
import sys
import shutil
import glob
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
BANNER_SOURCE = WORKSPACE_ROOT / "assets" / "marketing" / "bedrijfsinfo_banner_staopstoelen.jpg"
BANNER_FILENAME = "7_BEDRIJFSINFO_SHOWROOM_EN_SERVICE.jpg"
TEXT_SOURCE = WORKSPACE_ROOT / "assets" / "marketing" / "ADVERTENTIETEKST_MARKTPLAATS.txt"
TEXT_FILENAME = "ADVERTENTIETEKST_MARKTPLAATS.txt"

DOWNLOADS_DIR = Path.home() / "Downloads"

def sync_banner_to_folder(folder_path: Path):
    if not folder_path.is_dir():
        return False
    
    # Plaats algemene advertentietekst alleen in de generieke showroom-map (of als er nog geen tekstbestand in staat)
    if "Profiel" not in folder_path.name:
        dest_txt = folder_path / TEXT_FILENAME
        if ("Generiek" in folder_path.name or not dest_txt.exists()) and TEXT_SOURCE.exists():
            shutil.copy2(TEXT_SOURCE, dest_txt)
            print(f"📝 Advertentietekst (met 06-nummer) geplaatst in: {folder_path.name}")

    if not BANNER_SOURCE.exists():
        print(f"Fout: Bronbanner niet gevonden op {BANNER_SOURCE}")
        return False

    dest = folder_path / BANNER_FILENAME
    shutil.copy2(BANNER_SOURCE, dest)
    print(f"✅ Bedrijfsinfo banner geplaatst in: {folder_path.name}/{BANNER_FILENAME}")
    return True

def auto_sync_all_advertenties():
    print(f"--- Synchroniseren Marktplaats Advertenties met Bedrijfsinfo Banner ---")
    count = 0
    # Zoek alle Marktplaats mappen in ~/Downloads
    for p in DOWNLOADS_DIR.glob("Marktplaats*"):
        if p.is_dir():
            sync_banner_to_folder(p)
            count += 1
            
    # Check ook Desktop indien aanwezig
    desktop = Path.home() / "Desktop"
    for p in desktop.glob("*Marktplaats*"):
        if p.is_dir():
            sync_banner_to_folder(p)
            count += 1
            
    print(f"Klaar: {count} advertentiemappen geüpdatet met de nieuwste bedrijfsinfo banner.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target = Path(sys.argv[1]).resolve()
        sync_banner_to_folder(target)
    else:
        auto_sync_all_advertenties()
