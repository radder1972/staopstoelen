#!/usr/bin/env python3
"""
Genereert een UITERST DYNAMISCHE, levendige en enthousiaste voice-over voor de Afspraak-video
(stem: Alexander - Warm, Natural Dutch Narrator met hoge expressie en energie).
Geen enkele zin wordt afgekapt door automatische duratiemeting en 0.8s adempauze aan het slot.
"""

import os
import sys
import json
import ssl
import re
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

AFSPRAAK_SCENES = [
    {
        "num": 1,
        "name": "Waarom Inmeten?",
        "text": "Een verkeerde zithoogte of zitdiepte geeft rugpijn en vermoeide benen. Daarom koopt u een sta-op stoel nooit zomaar ongezien uit een doos!",
        "out_file": "assets/audio/afspraak_scene_1.m4a"
    },
    {
        "num": 2,
        "name": "De Zitmeting door Geertjan",
        "text": "In onze showroom in Dordrecht neemt bewegingstechnoloog Geertjan uitgebreid de tijd om uw zithoogte, zitdiepte en armleggerhoogte tot op de millimeter nauwkeurig in te meten.",
        "out_file": "assets/audio/afspraak_scene_2.m4a"
    },
    {
        "num": 3,
        "name": "30+ Stoelen Proefzitten",
        "text": "U probeert rustig meer dan dertig nieuwe én Certified Fitform stoelen uit! Wij stellen de stoel ter plekke op uw lichaam af, zodat u direct het verschil voelt!",
        "out_file": "assets/audio/afspraak_scene_3.m4a"
    },
    {
        "num": 4,
        "name": "Afspraak Plannen & Showroom",
        "text": "U parkeert gratis voor de deur aan de Merwedestraat 239 in Dordrecht! Of kies hieronder direct uw gewenste dag en tijdstip in onze online agenda.",
        "out_file": "assets/audio/afspraak_scene_4.m4a"
    }
]

def generate_voice(text: str) -> bytes:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    # Hoge dynamiek: stability lager voor intonatie-variatie, style hoog voor expressie & verkoop-energie
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.22,          # Veel expressiever, sprankelend en gevarieerd
            "similarity_boost": 0.78,   # Stemkarakter behouden
            "style": 0.52,              # Hoge dynamiek en levendige storytelling
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

def get_audio_duration(file_path: str) -> float:
    cmd = [FFMPEG, "-i", file_path]
    res = subprocess.run(cmd, capture_output=True, text=True)
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", res.stderr)
    if m:
        h, mn, s = float(m.group(1)), float(m.group(2)), float(m.group(3))
        return h * 3600 + mn * 60 + s
    return 0.0

def main():
    print("🎙️ Starten met genereren van EXTRA DYNAMISCHE voice-overs...")
    tmp_dir = "/tmp/afspraak_high_dynamic"
    os.makedirs(tmp_dir, exist_ok=True)
    
    measured_durations = {}

    for s in AFSPRAAK_SCENES:
        n = s["num"]
        print(f"\n[Scene {n}/4] {s['name']}")
        print(f"  Tekst: \"{s['text']}\"")
        
        mp3_data = generate_voice(s["text"])
        raw_path = f"{tmp_dir}/raw_scene_{n}.mp3"
        with open(raw_path, "wb") as f:
            f.write(mp3_data)
        
        raw_dur = get_audio_duration(raw_path)
        print(f"  ✓ ElevenLabs audio ontvangen: {raw_dur:.2f}s")
        
        # 150ms delay aan begin, 800ms adempauze aan einde, absoluut GEEN harde -t cut
        out_path = s["out_file"]
        filter_str = "adelay=150|150,apad=pad_dur=0.8"
        
        cmd = [
            FFMPEG, "-y",
            "-i", raw_path,
            "-af", filter_str,
            "-c:a", "aac",
            "-b:a", "192k",
            "-ar", "44100",
            out_path
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        final_dur = get_audio_duration(out_path)
        measured_durations[n] = round(final_dur, 2)
        print(f"  ✓ Gemasterd naar {out_path} (totale lengte: {final_dur:.2f}s)")

    print("\n📊 Nieuwe gemeten tijden per scene:")
    for n, dur in measured_durations.items():
        print(f"  Scene {n}: {dur}s")

    return measured_durations

if __name__ == "__main__":
    main()
