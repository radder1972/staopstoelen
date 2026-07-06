import re

with open("scratch/live_occasion_category.html", "r", encoding="utf-8") as f:
    html = f.read()

# Find price tags
price_matches = [m.start() for m in re.finditer(r'class=["\']price["\']', html, re.IGNORECASE)]
print(f"Found {len(price_matches)} occurrences of class='price':")
for idx in price_matches[:5]:
    start = max(0, idx - 150)
    end = min(len(html), idx + 200)
    print(f"[{idx}]: ...{html[start:end]}...")
    print("=" * 60)
