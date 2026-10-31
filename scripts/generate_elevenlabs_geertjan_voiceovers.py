#!/usr/bin/env python3
"""
Genereert de voice-overs voor de Geertjan Keuze Video via ElevenLabs API
Stem: Alexander - Warm, Natural Dutch Narrator (g5MYumTmZlFU9tYSmTp9)
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
FFMPEG = "/Users/matthiasradder/.local/bin/ffmpeg"
ctx = ssl._create_unverified_context()

os.makedirs("assets/marketing/video_audio", exist_ok=True)
os.makedirs("assets/marketing/video_parts", exist_ok=True)
os.makedirs("assets/video", exist_ok=True)

SCENES = [
    {
        "id": 1,
        "name": "De Deurmat Realiteit",
        "text": "Beste Geertjan. Stel je voor: tienduizend flyers vallen door de brievenbus op de deurmatten in Dordrecht en omstreken. Het ziet er schitterend uit, maar wat gebeurt er daarna écht met je investering van twaalfhonderdvijftig euro?",
        "image": "assets/marketing/video_slides/scene_1.png",
        "audio": "assets/marketing/video_audio/scene_1.mp3",
        "zoom_rate": 0.0004
    },
    {
        "id": 2,
        "name": "De Realiteit aan de Voordeur (Drie Deuren)",
        "text": "Kijk naar de realiteit aan de voordeur. Tweeënveertig procent van de huizen in Dordrecht heeft een Nee-Nee sticker. Jonge gezinnen gooien de flyer direct bij het oud papier, en bij seniorencomplexen komt de bezorger de centrale hal vaak niet eens in. Van die tienduizend stuks levert het hooguit één of twee showroombezoekers op. Dat betekent zeshonderd tot twaalfhonderdvijftig euro per bezoeker!",
        "image": "assets/marketing/video_slides/scene_2.png",
        "audio": "assets/marketing/video_audio/scene_2.mp3",
        "zoom_rate": 0.0002
    },
    {
        "id": 3,
        "name": "Het Externe Bureau (TPM)",
        "text": "Voorheen betaalde je vierhonderd euro per maand aan een extern bureau zoals TPM. Dat is achtenveertig honderd euro per jaar. Maar wat kreeg je ervoor terug? Vage rapportages over vertoningen, algemene kliks, en nul garantie op echte mensen die plaatsnemen in een stoel in jouw showroom.",
        "image": "assets/marketing/video_slides/scene_3.png",
        "audio": "assets/marketing/video_audio/scene_3.mp3",
        "zoom_rate": 0.0003
    },
    {
        "id": 4,
        "name": "Matthias Online Marketing",
        "text": "Kijk nu eens naar online marketing door Matthias. In slechts enkele testdagen hebben we al honderdachtenvijftig directe sessies en drieëndertig actieve zoekers via Google binnengehaald. Geen willekeurige deuren, maar mensen die nú op zoek zijn naar een sta-opstoel in de regio Dordrecht!",
        "image": "assets/marketing/video_slides/scene_4.png",
        "audio": "assets/marketing/video_audio/scene_4.mp3",
        "zoom_rate": 0.0003
    },
    {
        "id": 5,
        "name": "De Keiharde Vergelijking Matrix",
        "text": "Zet de cijfers naast elkaar. Flyers kosten zeshonderd tot twaalfhonderdvijftig euro per bezoeker. Online marketing via Matthias kost slechts veertig tot vijfenzeventig euro per afspraak. Verkoop je één sta-opstoel, dan is het complete maandbudget al dubbel en dwars terugverdiend!",
        "image": "assets/marketing/video_slides/scene_5.png",
        "audio": "assets/marketing/video_audio/scene_5.mp3",
        "zoom_rate": 0.0002
    },
    {
        "id": 6,
        "name": "Het Definitieve Strategische Advies",
        "text": "Ons advies aan Geertjan: gooi de flyer zeker niet weg, maar zet hem slim in! Online marketing is de motor die de mensen naar de showroom brengt. En de fysieke flyer geef je mee als dealcloser met de negenenzeventig euro All-in House voucher voor twijfelende klanten. Dát is de slimste investering voor Staopstoelen punt nl!",
        "image": "assets/marketing/video_slides/scene_6.png",
        "audio": "assets/marketing/video_audio/scene_6.mp3",
        "zoom_rate": 0.0003,
        "fade_out": True
    }
]

def generate_voice(text: str) -> bytes:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.45,
            "similarity_boost": 0.78,
            "style": 0.05,
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
    cmd = [
        FFMPEG, "-i", file_path
    ]
    res = subprocess.run(cmd, stderr=subprocess.PIPE, text=True)
    for line in res.stderr.splitlines():
        if "Duration:" in line:
            # Duration: 00:00:12.15, start: ...
            parts = line.split("Duration:")[1].split(",")[0].strip().split(":")
            dur = float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
            return dur
    return 15.0

def render_scene(scene, scene_dur):
    out_part = f"assets/marketing/video_parts/part_{scene['id']}.mp4"
    frames = int(scene_dur * 30)
    rate = scene['zoom_rate']
    
    print(f"🎬 Render Scene {scene['id']} ({scene_dur:.2f}s)...")
    
    vf = f"zoompan=z='min(zoom+{rate},1.06)':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30"
    if scene.get("fade_out"):
        vf += f",fade=t=out:st={scene_dur-1.5}:d=1.5"
        af = f"adelay=450|450,afade=t=out:st={scene_dur-1.5}:d=1.5,apad=pad_dur=2.0"
    else:
        af = "adelay=450|450,apad=pad_dur=2.0"
        
    cmd = [
        FFMPEG, "-y",
        "-loop", "1", "-i", scene["image"],
        "-i", scene["audio"],
        "-vf", vf,
        "-af", af,
        "-t", f"{scene_dur:.2f}",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        out_part
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"  ✓ Part {scene['id']} gereed")
    return out_part

def main():
    print(f"🎙️ Genereren ElevenLabs studio voice-overs (Stem: Alexander - {VOICE_ID})...")
    
    scene_durations = []
    part_files = []
    
    for sc in SCENES:
        print(f"\n[Scene {sc['id']}: {sc['name']}]")
        print(f"  Generating ElevenLabs audio...")
        mp3_bytes = generate_voice(sc["text"])
        audio_file = sc["audio"]
        with open(audio_file, "wb") as f:
            f.write(mp3_bytes)
            
        dur = get_audio_duration(audio_file)
        # Give 0.45s delay in front + 0.8s breath/outro buffer
        scene_dur = dur + 1.3
        scene_durations.append(scene_dur)
        print(f"  ✓ Audio opgeslagen: {len(mp3_bytes)//1024} KB (Duur: {dur:.2f}s -> Scene: {scene_dur:.2f}s)")
        
        part_file = render_scene(sc, scene_dur)
        part_files.append(part_file)

    concat_list_file = "assets/marketing/video_parts/concat_list.txt"
    with open(concat_list_file, "w") as f:
        for p in part_files:
            abs_path = os.path.abspath(p)
            f.write(f"file '{abs_path}'\n")

    final_video = "assets/video/geertjan_keuze_advies_video.mp4"
    print(f"\n📦 Samenvoegen en optimaliseren voor streaming (+faststart): {final_video}...")
    concat_cmd = [
        FFMPEG, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list_file,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-ar", "44100",
        "-movflags", "+faststart",
        final_video
    ]
    subprocess.run(concat_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Print summary
    probe_cmd = [FFMPEG, "-i", final_video]
    res = subprocess.run(probe_cmd, stderr=subprocess.PIPE, text=True)
    for line in res.stderr.splitlines():
        if "Duration" in line or "Video:" in line or "Audio:" in line:
            print("  " + line.strip())

    total_size_mb = os.path.getsize(final_video) / (1024 * 1024)
    print(f"\n🎉 Definitieve ElevenLabs Master Video gebouwd!")
    print(f"   Bestand: {final_video} ({total_size_mb:.1f} MB)")
    
    # Save chapter metadata for the web player
    curr_time = 0.0
    chapters = []
    for sc, dur in zip(SCENES, scene_durations):
        chapters.append({
            "id": sc["id"],
            "name": sc["name"],
            "startTime": round(curr_time, 1)
        })
        curr_time += dur
    
    with open("assets/marketing/video_chapters.json", "w") as f:
        json.dump(chapters, f, indent=2)
    print("   Hoofdstukken opgeslagen in assets/marketing/video_chapters.json")

if __name__ == "__main__":
    main()
