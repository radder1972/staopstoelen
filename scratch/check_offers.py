import urllib.request
import ssl
import json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

url = "https://schippercompactwonen.nl/staopstoelen-test/api/chairs.php"
try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
        db_data = json.loads(response.read().decode('utf-8'))
        chairs = db_data.get('staopstoelen', [])
        
        offers = [c for c in chairs if c.get('is_offer') is True]
        print(f"Total chairs: {len(chairs)}")
        print(f"Chairs with is_offer=True: {len(offers)}")
        for o in offers:
            print(f"  - {o['name']} (ID: {o['id']})")
except Exception as e:
    print("Error:", e)
