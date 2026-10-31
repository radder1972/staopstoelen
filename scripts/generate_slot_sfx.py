#!/usr/bin/env python3
"""
Genereert authentieke Slot Machine / Fruitmachine geluidseffecten gesynchroniseerd met de voice-over van Alexander:
- 0.0s - 5.5s: Standby ambient hum
- 5.8s - 6.3s: Hendel omlaag trekken (mechanische klik/ratchet)
- 6.4s - 14.8s: Rollen spinnen op topsnelheid met ratelend geluid
- 10.5s: Reel 1 STOPT met 'THUD-CLANK' (Fitform Stoel)
- 12.5s: Reel 2 STOPT met 'THUD-CLANK' (97 Stoelkliks)
- 14.8s: Reel 3 STOPT met 'JACKPOT SLAM' (€ 1.200 Marge)
- 14.8s - 18.0s: JACKPOT FANFARE, bellen & kletterende gouden munten
"""

import numpy as np
import wave
import struct

SAMPLE_RATE = 44100

def create_tone(freq, duration, decay=5.0, wave_type='sine'):
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
    if wave_type == 'sine':
        sig = np.sin(2 * np.pi * freq * t)
    elif wave_type == 'square':
        sig = np.sign(np.sin(2 * np.pi * freq * t))
    elif wave_type == 'triangle':
        sig = 2 * np.abs(2 * (t * freq - np.floor(t * freq + 0.5))) - 1
    env = np.exp(-decay * t)
    return sig * env

def generate_slot_sfx(total_duration=18.5):
    total_samples = int(SAMPLE_RATE * total_duration)
    audio = np.zeros(total_samples, dtype=np.float32)

    def add_sound(sound, start_time, gain=1.0):
        start_idx = int(start_time * SAMPLE_RATE)
        end_idx = start_idx + len(sound)
        if end_idx > total_samples:
            sound = sound[:total_samples - start_idx]
            end_idx = total_samples
        if start_idx < total_samples:
            audio[start_idx:end_idx] += sound * gain

    # 1. 5.8s - 6.4s: Lever pull mechanical ratchet
    lever = np.zeros(int(SAMPLE_RATE * 0.5), dtype=np.float32)
    for i in range(6):
        click = create_tone(160 + i * 35, 0.04, decay=40, wave_type='triangle')
        idx = int(i * 0.06 * SAMPLE_RATE)
        if idx + len(click) < len(lever):
            lever[idx:idx+len(click)] += click * 0.75
    # Heavy lever clank at release
    clank = create_tone(120, 0.12, decay=25, wave_type='square') * 0.6 + create_tone(240, 0.12, decay=35, wave_type='sine') * 0.5
    idx_rel = int(0.38 * SAMPLE_RATE)
    if idx_rel + len(clank) < len(lever):
        lever[idx_rel:idx_rel+len(clank)] += clank
    add_sound(lever, 5.8, gain=0.65)

    # 2. 6.4s - 14.8s: Reels spinning rhythmic fast clicks
    t_curr = 6.4
    dt = 0.038
    while t_curr < 14.8:
        # pitch changes slightly
        freq = 300 + np.random.uniform(-30, 40)
        click = create_tone(freq, 0.025, decay=60, wave_type='triangle')
        # Volume reduces after reel 1 and reel 2 stop
        cur_gain = 0.45
        if t_curr > 10.5: cur_gain = 0.35
        if t_curr > 12.5: cur_gain = 0.25
        add_sound(click, t_curr, gain=cur_gain)
        t_curr += dt
        if t_curr > 13.5:
            dt *= 1.025  # slow down before final reel

    # 3. Reel stops with heavy mechanical CLANK & DING
    # Stop 1 at 10.5s (Fitform Stoel)
    stop1 = create_tone(523.25, 0.25, decay=12, wave_type='triangle') * 0.8 + create_tone(180, 0.25, decay=20, wave_type='square') * 0.5
    add_sound(stop1, 10.5, gain=0.85)

    # Stop 2 at 12.5s (97 Kliks)
    stop2 = create_tone(659.25, 0.25, decay=12, wave_type='triangle') * 0.85 + create_tone(220, 0.25, decay=20, wave_type='square') * 0.55
    add_sound(stop2, 12.5, gain=0.9)

    # Stop 3 at 14.8s (JACKPOT LOCK-IN: € 1.200 Marge)
    stop3 = create_tone(783.99, 0.45, decay=8, wave_type='triangle') * 1.0 + create_tone(130, 0.45, decay=15, wave_type='square') * 0.7
    add_sound(stop3, 14.8, gain=1.0)

    # 4. 14.9s - 18.0s: JACKPOT FANFARE & BELLS!
    chords = [
        (523.25, 0.25),  # C5
        (659.25, 0.25),  # E5
        (783.99, 0.28),  # G5
        (1046.50, 0.45), # C6
        (1318.51, 0.55), # E6
        (1567.98, 0.75), # G6
    ]
    t_fanfare = 14.9
    for freq, dur in chords:
        bell = create_tone(freq, dur, decay=6.0, wave_type='sine') * 0.7 + \
               create_tone(freq * 2, dur, decay=10.0, wave_type='sine') * 0.3
        add_sound(bell, t_fanfare, gain=0.7)
        t_fanfare += 0.16

    # Repeated celebration chimes at 16.0s, 16.7s, 17.4s
    for offset in [16.0, 16.7, 17.4]:
        bell_hit = create_tone(1046.50, 0.35, decay=7, wave_type='sine') * 0.5 + \
                   create_tone(1567.98, 0.35, decay=7, wave_type='sine') * 0.5
        add_sound(bell_hit, offset, gain=0.6)

    # 5. 15.0s - 18.2s: Cascading gold coins pouring into metal tray
    np.random.seed(42)
    coin_times = np.sort(np.random.uniform(15.0, 18.2, 50))
    for ct in coin_times:
        coin_freq = np.random.uniform(2400, 4400)
        coin_dur = np.random.uniform(0.06, 0.14)
        coin = create_tone(coin_freq, coin_dur, decay=np.random.uniform(25, 45), wave_type='sine')
        add_sound(coin, ct, gain=np.random.uniform(0.3, 0.6))

    # Normalize to avoid clipping
    max_val = np.max(np.abs(audio))
    if max_val > 0.95:
        audio = audio / max_val * 0.95

    out_wav = "assets/marketing/video_audio/slot_machine_sfx.wav"
    with wave.open(out_wav, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        int16_samples = (audio * 32767).astype(np.int16)
        wf.writeframes(int16_samples.tobytes())

    print(f"✓ Gesynchroniseerde Slot Machine SFX WAV gegenereerd: {out_wav} (Duur: {total_duration:.1f}s)")
    return out_wav

if __name__ == "__main__":
    generate_slot_sfx()
