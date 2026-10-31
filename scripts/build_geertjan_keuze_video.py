import os
import subprocess
import json

FFMPEG = "/Users/matthiasradder/.local/bin/ffmpeg"
OUTPUT_DIR = "assets/marketing/video_parts"
FINAL_VIDEO = "assets/video/geertjan_keuze_advies_video.mp4"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs("assets/video", exist_ok=True)

SCENES = [
    {
        "id": 1,
        "name": "De Deurmat Realiteit",
        "image": "assets/marketing/video_slides/scene_1.png",
        "audio": "assets/marketing/video_audio/scene_1.mp3",
        "duration": 13.5,
        "zoom_rate": 0.0004
    },
    {
        "id": 2,
        "name": "De Drie Deuren",
        "image": "assets/marketing/video_slides/scene_2.png",
        "audio": "assets/marketing/video_audio/scene_2.mp3",
        "duration": 21.2,
        "zoom_rate": 0.0002
    },
    {
        "id": 3,
        "name": "Het Externe Bureau (TPM)",
        "image": "assets/marketing/video_slides/scene_3.png",
        "audio": "assets/marketing/video_audio/scene_3.mp3",
        "duration": 17.2,
        "zoom_rate": 0.0003
    },
    {
        "id": 4,
        "name": "Matthias Online Marketing",
        "image": "assets/marketing/video_slides/scene_4.png",
        "audio": "assets/marketing/video_audio/scene_4.mp3",
        "duration": 16.0,
        "zoom_rate": 0.0003
    },
    {
        "id": 5,
        "name": "De Vergelijking Matrix",
        "image": "assets/marketing/video_slides/scene_5.png",
        "audio": "assets/marketing/video_audio/scene_5.mp3",
        "duration": 17.2,
        "zoom_rate": 0.0002
    },
    {
        "id": 6,
        "name": "Het Definitieve Advies",
        "image": "assets/marketing/video_slides/scene_6.png",
        "audio": "assets/marketing/video_audio/scene_6.mp3",
        "duration": 20.0,
        "zoom_rate": 0.0003,
        "fade_out": True
    }
]

def render_scene(scene):
    out_part = f"{OUTPUT_DIR}/part_{scene['id']}.mp4"
    frames = int(scene['duration'] * 30)
    dur = scene['duration']
    rate = scene['zoom_rate']
    
    print(f"🎬 Rendering Scene {scene['id']}: {scene['name']} ({dur}s)...")
    
    vf = f"zoompan=z='min(zoom+{rate},1.06)':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30"
    if scene.get("fade_out"):
        vf += f",fade=t=out:st={dur-1.5}:d=1.5"
        af = f"adelay=450|450,afade=t=out:st={dur-1.5}:d=1.5,apad=pad_dur=2.0"
    else:
        af = "adelay=450|450,apad=pad_dur=2.0"
        
    cmd = [
        FFMPEG, "-y",
        "-loop", "1", "-i", scene["image"],
        "-i", scene["audio"],
        "-vf", vf,
        "-af", af,
        "-t", str(dur),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        out_part
    ]
    subprocess.run(cmd, check=True)
    print(f"✅ Scene {scene['id']} klaar -> {out_part}")
    return out_part

def main():
    part_files = []
    for sc in SCENES:
        part_files.append(render_scene(sc))
        
    concat_list_file = f"{OUTPUT_DIR}/concat_list.txt"
    with open(concat_list_file, "w") as f:
        for p in part_files:
            abs_path = os.path.abspath(p)
            f.write(f"file '{abs_path}'\n")
            
    print(f"\n📦 Samenvoegen tot definitieve master video: {FINAL_VIDEO}...")
    concat_cmd = [
        FFMPEG, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list_file,
        "-c", "copy",
        FINAL_VIDEO
    ]
    subprocess.run(concat_cmd, check=True)
    
    # Check output size & duration
    probe_cmd = [FFMPEG, "-i", FINAL_VIDEO]
    res = subprocess.run(probe_cmd, stderr=subprocess.PIPE, text=True)
    for line in res.stderr.splitlines():
        if "Duration" in line or "Video:" in line or "Audio:" in line:
            print("  " + line.strip())
            
    print(f"\n🎉 Video succesvol gebouwd! Locatie: {FINAL_VIDEO}")

if __name__ == "__main__":
    main()
