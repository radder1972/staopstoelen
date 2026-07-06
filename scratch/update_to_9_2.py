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
    content_updated = content.replace('Versie 9.1', 'Versie 9.2')
    content_updated = content_updated.replace('v9.1', 'v9.2')
    content_updated = content_updated.replace('style.css?v=9.1', 'style.css?v=9.2')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content_updated)
        
    print(f"Updated {filename} to version 9.2")
