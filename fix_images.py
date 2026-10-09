import json
import os
import urllib.request
import re

def fuzzy_match(name, files):
    # Very simple fuzzy match based on keywords
    name_clean = re.sub(r'[^a-zA-Z0-9]', '', name).lower()
    best_match = None
    best_score = -1
    
    for f in files:
        if f in ['.', '..'] or not f.lower().endswith('.jpg') and not f.lower().endswith('.png'):
            continue
            
        f_clean = re.sub(r'[^a-zA-Z0-9]', '', f).lower()
        
        # Check if all words in name are in f
        words = re.findall(r'[a-zA-Z0-9]+', name.lower())
        score = sum(1 for w in words if w in f.lower())
        
        # Specifically boost 'main' or '1' or 'scaled' for the main image
        if '1' in f or 'scaled' in f or 'main' in f:
            score += 0.5
            
        if score > best_score:
            best_score = score
            best_match = f
            
    return best_match if best_score > 0 else None

with open('remote_images.txt', 'r') as f:
    remote_images = [line.strip() for line in f if line.strip()]

with open('database.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

for cat in db:
    for item in db[cat]:
        # Only fix if the image name looks like our local placeholder format
        if item.get('image') and 'assets/stoelen/chair_' in item['image']:
            match = fuzzy_match(item['name'], remote_images)
            if match:
                item['image'] = f"assets/stoelen/{match}"
                print(f"Fixed {item['name']} -> {match}")
            else:
                print(f"Could not find match for {item['name']}")

with open('database.json', 'w', encoding='utf-8') as f:
    json.dump(db, f, indent=2, ensure_ascii=False)
