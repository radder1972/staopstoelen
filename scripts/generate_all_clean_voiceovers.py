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
        "name": "Revisie Scene 2 (Motortest & Techniek)",
        "text": "De drie Deense Linak motoren en alle bekabeling worden technisch volledig doorgemeten op geruisloze en soepele werking.",
        "duration": 8.50,
        "delay_ms": 200,
        "out_files": ["assets/audio/revisie_scene_2.m4a"]
    },
    {
        "name": "Consumer Scene 3 (Waarom Certified Fitform - Keuring & Reiniging)",
        "text": "Elke stoel krijgt een dertig-punten keuring, stoom-dieptereiniging en wordt door staopstoelen punt nl exact op maat afgesteld. Retouren zijn minder dan twee procent.",
        "duration": 12.33,
        "delay_ms": 200,
        "out_files": [
            "assets/audio/consumer_scene_3.m4a",
            "assets/audio/scene_3.m4a"
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
            cmd = [
                FFMPEG, "-y",
                "-i", raw_mp3,
                "-af", filter_str,
                "-t", str(dur),
                "-c:a", "aac",
                "-b:a", "192k",
                "-ar", "44100",
                out_path
            ]
            subprocess.run(cmd, check=True, capture_output=True)
            print(f"  ✓ Opgeslagen als {out_path}")

    # Also save MP3 version of scene_3 for web compatibility
    print("  -> Exporting assets/audio/scene_3.mp3...")
    cmd_mp3 = [
        FFMPEG, "-y",
        "-i", "/tmp/eleven_clean/task_2_raw.mp3",
        "-af", "adelay=200|200,apad=whole_dur=12.33",
        "-t", "12.33",
        "-c:a", "libmp3lame",
        "-b:a", "192k",
        "-ar", "44100",
        "assets/audio/scene_3.mp3"
    ]
    subprocess.run(cmd_mp3, check=True, capture_output=True)
    print("  ✓ Opgeslagen als assets/audio/scene_3.mp3")

    print("\n🎉 ALL AUDIO TRACKS SUCCESSFULLY GENERATED AND REPLACED!")

if __name__ == "__main__":
    main()
