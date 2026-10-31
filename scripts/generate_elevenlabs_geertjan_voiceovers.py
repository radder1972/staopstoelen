#!/usr/bin/env python3
"""
Genereert de voice-overs voor de Geertjan Keuze Video via ElevenLabs API
Stem: Alexander - Warm, Natural Dutch Narrator (g5MYumTmZlFU9tYSmTp9)
Verhaal: Start bij TPM afzetten -> Flyers sorteren op deurmat -> Budget beter benutten -> Sluitende businesscase -> Advies
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
        "name": "De Flyer op de Mat & De Echte Vraag",
        "text": "Beste Geertjan. Daar ligt hij: onze prachtige nieuwe flyer op de deurmat. Je denkt misschien: moeten we nu tienduizend flyers laten verspreiden in Dordrecht? Maar voordat we twaalfhonderdvijftig euro uitgeven aan drukwerk en bezorging, moeten we eerst eens eerlijk kijken naar waar jouw marketingbudget op dít moment naartoe gaat.",
        "image": "assets/marketing/video_slides/scene_1.png",
        "audio": "assets/marketing/video_audio/scene_1.mp3",
        "zoom_rate": 0.0004
    },
    {
        "id": 2,
        "name": "De Olifant in de Kamer: TPM",
        "text": "Want elke maand betaal je trouw vierhonderd euro aan een extern bureau zoals TPM. Dat is achtenveertig honderd euro per jaar aan vaste marketingkosten. Maar wat levert het jou als ondernemer nou werkelijk op? Rapporten vol marketingjargon, vage kliks, en nul garantie op echte mensen die plaatsnemen in een stoel in jouw showroom in Dordrecht.",
        "image": "assets/marketing/video_slides/scene_2.png",
        "audio": "assets/marketing/video_audio/scene_2.mp3",
        "zoom_rate": 0.0003
    },
    {
        "id": 3,
        "name": "Het Sorteren op de Deurmat",
        "text": "En hoe zit het dan met die tienduizend flyers op de deurmat? Laten we de brievenbussen in Dordrecht eens eerlijk sorteren. Tweeënveertig procent heeft een Nee-Nee sticker. Jonge gezinnen gooien hem meteen bij het oud papier, en bij seniorencomplexen komt de bezorger de centrale hal vaak niet eens in. Van die twaalfhonderdvijftig euro aan Spotta verdwijnt achtennegentig procent bij het afval. Eén enkele showroombezoeker kost je dan zeshonderd tot twaalfhonderd euro!",
        "image": "assets/marketing/video_slides/scene_3.png",
        "audio": "assets/marketing/video_audio/scene_3.mp3",
        "zoom_rate": 0.0002
    },
    {
        "id": 4,
        "name": "Hoe Benutten We Dat Budget Beter?",
        "text": "Hoe kunnen we die vierhonderd euro per maand die je nu aan TPM uitgeeft, wél maximaal laten renderen? Door datzelfde budget te investeren in gerichte online marketing via Matthias. Geen willekeurige deuren, maar mensen die nú googelen naar een sta-opstoel in Dordrecht. In de eerste testdagen hebben we al honderdachtenvijftig sessies en drieëndertig actieve zoekers binnengehaald. Voor veertig tot vijfenzeventig euro heb je een gekwalificeerde showroomafspraak.",
        "image": "assets/marketing/video_slides/scene_4.png",
        "audio": "assets/marketing/video_audio/scene_4.mp3",
        "zoom_rate": 0.0003
    },
    {
        "id": 5,
        "name": "De Sluitende Businesscase",
        "text": "Laten we de businesscase keihard maken. Bij TPM ben je je vierhonderd euro kwijt zonder garantie. Met gerichte online marketing haal je maandelijks zes tot twaalf gerichte afspraken binnen. Verkoop je uit die afspraken slechts één sta-opstoel met een marge van twaalfhonderd euro? Dan is je complete marketingbudget voor bijna drie maanden al terugverdiend. Elke extra verkoop is pure winst.",
        "image": "assets/marketing/video_slides/scene_5.png",
        "audio": "assets/marketing/video_audio/scene_5.mp3",
        "zoom_rate": 0.0002
    },
    {
        "id": 6,
        "name": "Het Definitieve Strategische Besluit",
        "text": "Het definitieve besluit voor Geertjan: zeg TPM op en verschuif dat maandbudget naar gerichte online marketing door Matthias. Dát is de motor die klanten binnenbrengt. En die prachtige flyer? Druk vijfhonderd stuks voor vijfendertig euro en geef hem in de showroom mee met de negenenzeventig euro voucher om twijfelaars definitief over de streep te trekken. Dát is hoe we van marketing een winstmachine maken voor Staopstoelen punt nl.",
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
        audio_file = sc["audio"]
        if os.path.exists(audio_file) and os.path.getsize(audio_file) > 10000:
            print(f"  ✓ Bestaande ElevenLabs audio gebruikt: {audio_file}")
        else:
            print(f"  Generating ElevenLabs audio...")
            mp3_bytes = generate_voice(sc["text"])
            with open(audio_file, "wb") as f:
                f.write(mp3_bytes)
            
        dur = get_audio_duration(audio_file)
        scene_dur = dur + 1.3
        scene_durations.append(scene_dur)
        audio_size_kb = os.path.getsize(audio_file) // 1024
        print(f"  ✓ Audio gereed: {audio_size_kb} KB (Duur: {dur:.2f}s -> Scene: {scene_dur:.2f}s)")
        
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
