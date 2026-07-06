import os

files_to_update = [
    'index.html',
    'staopstoelen.html',
    'seniorenstoelen.html',
    'keuzehulp.html',
    'revisie.html',
    'ervaringen.html',
    'faq.html',
    'info.html',
    'afspraak.html',
    'winkel.html',
    'beheer.html'
]

for filename in files_to_update:
    filepath = filename
    if not os.path.exists(filepath):
        print(f"Skipping {filename} (not found)")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace footer version or header version
    content_updated = content.replace('Versie 9.11', 'Versie 9.12')
    content_updated = content_updated.replace('v9.11', 'v9.12')
    content_updated = content_updated.replace('style.css?v=9.11', 'style.css?v=9.12')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content_updated)
        
    print(f"Updated {filename} to version 9.12")
