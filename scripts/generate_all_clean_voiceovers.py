#!/usr/bin/env python3
"""
Genereert 100% schone studio voice-overs via ElevenLabs API (stem: Alexander - Warm, Natural Dutch Narrator)
zonder enige claim over '150 kg belastingtest' of 'ozon'.
"""

import os
import sys
import json
import ssl
import urllib.request
import subprocess

def get_api_key():
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key and os.path.exists(".env"):
        with open(".env") as f:
            for line in f:
                if line.startswith("ELEVENLABS_API_KEY="):
                    key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    return key or ""

API_KEY = get_api_key()
VOICE_ID = "g5MYumTmZlFU9tYSmTp9" # Alexander - Warm, Natural Dutch Narrator
FFMPEG = "/Users/matthiasradder/Library/Python/3.14/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1"
ctx = ssl._create_unverified_context()

TASKS = [
    {
        "name": "Revisie Scene 1 (Kaal Frame & Demontage)",
        "text": "Wij demonteren elke Fitform stoel tot op het stalen basisframe. Geen cosmetisch poetswerk, maar een grondige inspectie van de complete constructie.",
        "duration": 10.20,
        "delay_ms": 200,
        "out_files": ["assets/audio/revisie_scene_1.m4a"]
    },
    {
        "name": "Revisie Scene 2 (Linak Motortest & Techniek)",
        "text": "De drie Deense Linak motoren en alle bekabeling worden technisch volledig doorgemeten op geruisloze en soepele werking.",
        "duration": 8.00,
        "delay_ms": 200,
        "out_files": ["assets/audio/revisie_scene_2.m4a"]
    },
    {
        "name": "Revisie Scene 3 (Professionele Reiniging & Koudschuim)",
        "text": "De stoel wordt grondig professioneel gereinigd en waar nodig wordt de bekleding vervangen. Het koudschuim wordt gecontroleerd op actieve veerkracht.",
        "duration": 10.30,
        "delay_ms": 200,
        "out_files": ["assets/audio/revisie_scene_3.m4a"]
    },
    {
        "name": "Revisie Scene 4 (Persoonlijk Zitadvies & Duimstok)",
        "text": "Een sta-op stoel moet passen als een maatkostuum. Met de duimstok meten we zithoogte, zitdiepte en armleggers exact op uw lichaam af.",
        "duration": 10.80,
        "delay_ms": 200,
        "out_files": ["assets/audio/revisie_scene_4.m4a"]
    },
    {
        "name": "Revisie Scene 5 (Handmatige Topswing Afstelling)",
        "text": "Bewegingstechnoloog Geertjan stelt de topswing-neksteun en de lendensteun handmatig met precisie af voor een optimale rughouding.",
        "duration": 8.80,
        "delay_ms": 200,
        "out_files": ["assets/audio/revisie_scene_5.m4a"]
    },
    {
        "name": "Revisie Scene 6 (15-Punts Keuring & 1 Jaar Garantie)",
        "text": "Pas na onze vijftien-punts kwaliteitscontrole is de stoel weer in topstaat: inclusief één jaar volledige garantie aan huis. Welkom in Dordrecht.",
        "duration": 11.20,
        "delay_ms": 200,
        "out_files": ["assets/audio/revisie_scene_6.m4a"]
    },
    {
        "name": "Consumer Scene 2 (Sweet Spot - 1 Jaar Garantie)",
        "text": "Staopstoelen punt nl overbrugt dit gat met Certified Fitform. Nederlandse topkwaliteit voor 1550 euro, mét één jaar volledige garantie aan huis.",
        "duration": 10.67,
        "delay_ms": 200,
        "out_files": ["assets/audio/consumer_scene_2.m4a"]
    },
    {
        "name": "Consumer Scene 3 (15-Punts Kwaliteitskeuring & Reiniging)",
        "text": "Elke stoel krijgt een vijftien-punts kwaliteitskeuring, professionele reiniging en wordt door staopstoelen punt nl exact op uw lichaam afgesteld. Zo zit uw stoel weer echt als nieuw, voor jarenlang zorgeloos zitcomfort.",
        "duration": 12.33,
        "delay_ms": 200,
        "out_files": [
            "assets/audio/consumer_scene_3.m4a",
            "assets/audio/scene_3.m4a",
            "assets/audio/scene_3.mp3"
        ]
    }
]

def generate_voice(text: str) -> bytes:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.50,
            "similarity_boost": 0.75,
            "style": 0.0,
            "use_speaker_boost": True
        }
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "xi-api-key": API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
        },
        method="POST"
    )
    with urllib.request.urlopen(req, context=ctx) as resp:
        return resp.read()

def main():
    print("🎙️ Starting ElevenLabs clean voiceover generation...")
    os.makedirs("/tmp/eleven_clean", exist_ok=True)

    for i, t in enumerate(TASKS, 1):
        print(f"\n[{i}/{len(TASKS)}] Generating: {t['name']}")
        print(f"  Tekst: \"{t['text']}\"")
        mp3_bytes = generate_voice(t["text"])
        raw_mp3 = f"/tmp/eleven_clean/task_{i}_raw.mp3"
        with open(raw_mp3, "wb") as f:
            f.write(mp3_bytes)
        print(f"  ✓ ElevenLabs audio ontvangen ({len(mp3_bytes) // 1024} KB)")

        # Master to exact duration with gentle delay and padding
        delay = t["delay_ms"]
        dur = t["duration"]
        filter_str = f"adelay={delay}|{delay},apad=whole_dur={dur}"

        for out_path in t["out_files"]:
            print(f"  -> Exporting {out_path} (exact {dur}s)...")
            codec = "libmp3lame" if out_path.endswith(".mp3") else "aac"
            cmd = [
                FFMPEG, "-y",
                "-i", raw_mp3,
                "-af", filter_str,
                "-t", str(dur),
                "-c:a", codec,
                "-b:a", "192k",
                "-ar", "44100",
                out_path
            ]
            subprocess.run(cmd, check=True, capture_output=True)
            print(f"  ✓ Opgeslagen als {out_path}")

    print("\n🎉 ALL AUDIO TRACKS SUCCESSFULLY GENERATED AND REPLACED!")

if __name__ == "__main__":
    main()
