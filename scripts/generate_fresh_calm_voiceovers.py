#!/usr/bin/env python3
"""
Genereert 4 rustige, professionele ElevenLabs studio voice-overs voor de Master Video.
Stem: Alexander (g5MYumTmZlFU9tYSmTp9)
Focus:
- De 3 Kerngetallen (Bereik 8.995 -> 97 Kliks -> Websitebezoekers GA4)
- Het Keiharde Bewijs in GA4 (TPM: € 22,22 per bezoeker vs Onze motor: € 0,15 per klik)
- De Marketing Machine & Jackpot (8.995 / 97 / € 0,15 / 82x ROI)
- Conclusie: Stop TPM, vul de showroom Merwedestraat 239 Dordrecht!
"""

import os
import json
import ssl
import urllib.request
import subprocess

def get_api_key():
    if os.path.exists(".env"):
        with open(".env") as f:
            for line in f:
                if line.startswith("ELEVENLABS_API_KEY="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    return os.environ.get("ELEVENLABS_API_KEY", "")

API_KEY = get_api_key()
VOICE_ID = "g5MYumTmZlFU9tYSmTp9" # Alexander
FFMPEG = "/Users/matthiasradder/.local/bin/ffmpeg"
ctx = ssl._create_unverified_context()

SCRIPTS = {
    1: {
        "file": "assets/marketing/video_audio/short_scene_1.mp3",
        "text": "Geertjan, laten we er eens heel rustig naar kijken. Wat we hier samen neerzetten draait om drie heldere kerngetallen. Eén: het bereik vóór de klik. Bijna negenduizend gerichte stoelzoekers in de regio zagen jouw advertenties. Twee: de advertentiekliks. Zevenennegentig mensen klikten bewust door voor vijftien cent per stuk. En drie: de websitebezoekers. Dat zien we nu ook zwart-op-wit terug in Google Analytics. We genereren écht verkeer naar Staopstoelen punt nl."
    },
    2: {
        "file": "assets/marketing/video_audio/short_scene_dagboek.mp3",
        "text": "Kijk rustig naar de keiharde feiten in Google Analytics. TPM kost Geertjan vierhonderd euro per maand. In de afgelopen vijf dagen bracht die TPM-banner welgeteld drie bezoekers naar de website. Dat is meer dan tweeëntwintig euro per bezoeker! Terwijl onze eigen advertenties zevenennegentig gerichte proefzitters trokken voor amper vijftien cent per klik. Honderdachtenveertig keer goedkoper én zwart-op-wit bewezen in Analytics."
    },
    3: {
        "file": "assets/marketing/video_audio/short_scene_fruitmachine.mp3",
        "text": "Marketing is voor Geertjan geen gokkast meer waar je vierhonderd euro in gooit en hoopt op geluk. Met onze online motor trekken we aan de hendel en valt de jackpot: voor amper vijftien cent per klik pak je zevenennegentig gerichte proefzitters en twaalfhonderd euro marge op één verkochte stoel!"
    },
    4: {
        "file": "assets/marketing/video_audio/short_scene_3.mp3",
        "text": "De conclusie is glashelder, Geertjan. Zeg die vierhonderd euro per maand aan TPM direct op. Zet dat budget in op onze eigen online machine en leid elke bezoeker naar een afspraak in jouw showroom aan de Merwedestraat. Eén extra verkochte stoel dekt de complete advertentiekosten al tweeëntachtig keer terug. Dít is onze winnende formule!"
    }
}

def generate_voice(text: str) -> bytes:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.45,       # Slightly higher stability for a calm, composed delivery
            "similarity_boost": 0.85,
            "style": 0.10,
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

def get_duration(fpath):
    cmd = [FFMPEG, "-i", fpath]
    res = subprocess.run(cmd, stderr=subprocess.PIPE, text=True)
    for line in res.stderr.splitlines():
        if "Duration:" in line:
            parts = line.split("Duration:")[1].split(",")[0].strip().split(":")
            return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
    return 15.0

def main():
    print(f"🎙️ Genereren van 4 rustige ElevenLabs voice-overs (Alexander)...")
    durations = {}
    for scene_id, data in SCRIPTS.items():
        print(f"  Genereren Scene {scene_id}...")
        audio_bytes = generate_voice(data["text"])
        with open(data["file"], "wb") as f:
            f.write(audio_bytes)
        dur = get_duration(data["file"])
        durations[scene_id] = dur
        print(f"  ✓ Scene {scene_id} opgeslagen ({dur:.2f}s) -> {data['file']}")
    
    with open("assets/marketing/video_audio/durations.json", "w") as f:
        json.dump(durations, f, indent=2)
    print("\n✓ Alle 4 voice-overs succesvol gegenereerd!")

if __name__ == "__main__":
    main()
