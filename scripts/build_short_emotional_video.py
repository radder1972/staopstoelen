#!/usr/bin/env python3
"""
Korte, krachtige, emotionele Master Video voor Geertjan (ca. 50-55 sec)
Kernboodschap bovenaan: "We doen iets heel bijzonders: WE GENEREREN ÉCHT VERKEER!"
Businesscase van de klik & de winnende formule.
Stem: Alexander via ElevenLabs API (g5MYumTmZlFU9tYSmTp9)
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
        "name": "We Genereren Écht Verkeer!",
        "text": "Geertjan, besef even wat we hier samen aan het doen zijn. We doen iets heel bijzonders: WE GENEREREN ÉCHT VERKEER! Kijk naar de afgelopen drie dagen op Marktplaats: meer dan achtduizend driehonderd vertoningen en negenentachtig mensen die doelgericht op jouw stoelen hebben geklikt!",
        "image": "assets/marketing/video_slides/short_scene_1.png",
        "audio": "assets/marketing/video_audio/short_scene_1.mp3",
        "zoom_rate": 0.0004
    },
    {
        "id": 2,
        "name": "Het 7-Dagen Groei-Dagboek",
        "text": "Kijk naar ons dagboek van de afgelopen zeven dagen. Waar we bij TPM begonnen met stilstand en vierhonderd euro vaste kosten, bouwden we in zeven dagen een actieve machine. Van de eerste Google zoekers naar een explosie op Marktplaats. In één week tijd van nul naar meer dan achtduizend vertoningen en negenentachtig actieve kliks!",
        "image": "assets/marketing/video_slides/short_scene_dagboek.png",
        "audio": "assets/marketing/video_audio/short_scene_dagboek.mp3",
        "zoom_rate": 0.0003
    },
    {
        "id": 3,
        "name": "De Businesscase van de Klik",
        "text": "En kijk nu naar de businesscase van die klik. Negenentachtig geïnteresseerden hebben jou bij elkaar nog geen veertien euro gekost. Dat is amper vijftien cent per bezoeker! Als uit al die mensen maar één iemand naar de Merwedestraat komt en een stoel koopt, pak je twaalfhonderd euro marge. Die veertien euro levert je een veelvoud aan winst op!",
        "image": "assets/marketing/video_slides/short_scene_2.png",
        "audio": "assets/marketing/video_audio/short_scene_2.mp3",
        "zoom_rate": 0.0003
    },
    {
        "id": 4,
        "name": "De Winnende Formule",
        "text": "Dát is de boodschap, Geertjan. Stop die vierhonderd euro aan TPM en stop met gokken op tienduizend flyers in de papierbak. Deze online motor brengt dagelijks échte mensen. En die flyer? Die drukken we voor vijfendertig euro als perfecte showroom-afsluiter. Dít is onze winnende formule!",
        "image": "assets/marketing/video_slides/short_scene_3.png",
        "audio": "assets/marketing/video_audio/short_scene_3.mp3",
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
            "stability": 0.38,
            "similarity_boost": 0.82,
            "style": 0.15,
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
    res = subprocess.run(cmd, stderr=subprocess.PIPE, text=True)
    for line in res.stderr.splitlines():
        if "Duration:" in line:
            parts = line.split("Duration:")[1].split(",")[0].strip().split(":")
            dur = float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
            return dur
    return 15.0

def render_scene(scene, scene_dur):
    out_part = f"assets/marketing/video_parts/part_{scene['id']}.mp4"
    frames = int(scene_dur * 30)
    rate = scene['zoom_rate']
    
    print(f"🎬 Render Scene {scene['id']}: {scene['name']} ({scene_dur:.2f}s)...")
    
    vf = f"zoompan=z='min(zoom+{rate},1.06)':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30"
    if scene.get("fade_out"):
        vf += f",fade=t=out:st={scene_dur-1.2}:d=1.2"
        af = f"adelay=400|400,afade=t=out:st={scene_dur-1.2}:d=1.2,apad=pad_dur=1.5"
    else:
        af = "adelay=400|400,apad=pad_dur=1.5"
        
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
    print(f"  ✓ Scene {scene['id']} gereed -> {out_part}")
    return out_part

def main():
    print(f"🎙️ Genereren ElevenLabs studio voice-overs (Stem: Alexander - {VOICE_ID})...")
    
    scene_durations = []
    part_files = []
    
    for sc in SCENES:
        print(f"\n[Scene {sc['id']}: {sc['name']}]")
        audio_file = sc["audio"]
        print(f"  Genereren van ElevenLabs audio...")
        mp3_bytes = generate_voice(sc["text"])
        with open(audio_file, "wb") as f:
            f.write(mp3_bytes)
            
        dur = get_audio_duration(audio_file)
        scene_dur = dur + 1.1
        scene_durations.append(scene_dur)
        print(f"  ✓ Audio gereed: {len(mp3_bytes)//1024} KB (Duur: {dur:.2f}s -> Scene: {scene_dur:.2f}s)")
        
        part_file = render_scene(sc, scene_dur)
        part_files.append(part_file)

    concat_list_file = "assets/marketing/video_parts/concat_list.txt"
    with open(concat_list_file, "w") as f:
        for p in part_files:
            abs_path = os.path.abspath(p)
            f.write(f"file '{abs_path}'\n")

    final_video = "assets/video/geertjan_keuze_advies_video.mp4"
    print(f"\n📦 Samenvoegen tot master video: {final_video}...")
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

    # Print duration & format
    probe_cmd = [FFMPEG, "-i", final_video]
    res = subprocess.run(probe_cmd, stderr=subprocess.PIPE, text=True)
    for line in res.stderr.splitlines():
        if "Duration" in line or "Video:" in line or "Audio:" in line:
            print("  " + line.strip())

    total_size_mb = os.path.getsize(final_video) / (1024 * 1024)
    print(f"\n🎉 Korte Master Video Succesvol Gebouwd!")
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
