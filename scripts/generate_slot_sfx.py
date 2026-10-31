#!/usr/bin/env python3
"""
Genereert authentieke Slot Machine / Fruitmachine geluidseffecten:
1. Hendel trekken (mechanische klik)
2. Rollen spinnen (ratelend geluid)
3. 3x Stoppen van rollen (harde 'thump/ding')
4. Jackpot belsignaal & fanfare
5. Kletterende munten (coin payout cascade)
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

def generate_slot_sfx(total_duration=22.0):
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

    # 1. 0.0s - 0.4s: Lever pull mechanical ratchet
    lever = np.zeros(int(SAMPLE_RATE * 0.4), dtype=np.float32)
    for i in range(5):
        click = create_tone(180 + i * 30, 0.04, decay=40, wave_type='triangle')
        idx = int(i * 0.07 * SAMPLE_RATE)
        lever[idx:idx+len(click)] += click * 0.7
    add_sound(lever, 0.1, gain=0.6)

    # 2. 0.5s - 3.2s: Reels spinning rhythmic clicks
    spin_clicks = np.zeros(int(SAMPLE_RATE * 2.8), dtype=np.float32)
    t_curr = 0.0
    dt = 0.05
    while t_curr < 2.6:
        # pitch rises slightly as it spins
        freq = 320 + np.random.uniform(-40, 60)
        click = create_tone(freq, 0.03, decay=50, wave_type='triangle')
        idx = int(t_curr * SAMPLE_RATE)
        if idx + len(click) < len(spin_clicks):
            spin_clicks[idx:idx+len(click)] += click * 0.45
        t_curr += dt
        dt *= 1.02 # slow down slightly
    add_sound(spin_clicks, 0.5, gain=0.7)

    # 3. Reel stops with solid 'CLANK-DING'
    # Stop 1 at 1.4s
    stop1 = create_tone(523.25, 0.25, decay=12, wave_type='triangle') + create_tone(260, 0.25, decay=20, wave_type='square') * 0.4
    add_sound(stop1, 1.4, gain=0.8)

    # Stop 2 at 2.2s
    stop2 = create_tone(659.25, 0.25, decay=12, wave_type='triangle') + create_tone(330, 0.25, decay=20, wave_type='square') * 0.4
    add_sound(stop2, 2.2, gain=0.85)

    # Stop 3 at 3.0s (JACKPOT LOCK-IN)
    stop3 = create_tone(783.99, 0.35, decay=10, wave_type='triangle') + create_tone(392, 0.35, decay=15, wave_type='square') * 0.5
    add_sound(stop3, 3.0, gain=1.0)

    # 4. 3.2s - 6.5s: JACKPOT FANFARE & BELLS!
    chords = [
        (523.25, 0.3),  # C5
        (659.25, 0.3),  # E5
        (783.99, 0.3),  # G5
        (1046.50, 0.5), # C6
        (1318.51, 0.6), # E6
        (1567.98, 0.8), # G6
    ]
    t_fanfare = 3.2
    for freq, dur in chords:
        # bell harmonic
        bell = create_tone(freq, dur, decay=6.0, wave_type='sine') * 0.7 + \
               create_tone(freq * 2, dur, decay=10.0, wave_type='sine') * 0.3
        add_sound(bell, t_fanfare, gain=0.75)
        t_fanfare += 0.16

    # Repeated celebration chime at 4.6s & 5.4s
    for offset in [4.6, 5.4, 6.2]:
        bell_hit = create_tone(1046.50, 0.4, decay=7, wave_type='sine') * 0.5 + \
                    create_tone(1318.51, 0.4, decay=7, wave_type='sine') * 0.5
        add_sound(bell_hit, offset, gain=0.55)

    # 5. 3.8s - 8.5s: Cascading gold coins pouring into metal tray
    np.random.seed(42)
    coin_times = np.sort(np.random.uniform(3.6, 7.8, 45))
    for ct in coin_times:
        coin_freq = np.random.uniform(2200, 4200)
        coin_dur = np.random.uniform(0.06, 0.14)
        coin = create_tone(coin_freq, coin_dur, decay=np.random.uniform(25, 45), wave_type='sine')
        add_sound(coin, ct, gain=np.random.uniform(0.25, 0.55))

    # Normalize to avoid clipping
    max_val = np.max(np.abs(audio))
    if max_val > 0.95:
        audio = audio / max_val * 0.95

    # Write WAV file
    out_wav = "assets/marketing/video_audio/slot_machine_sfx.wav"
    with wave.open(out_wav, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        int16_samples = (audio * 32767).astype(np.int16)
        wf.writeframes(int16_samples.tobytes())

    print(f"✓ Slot Machine SFX WAV gegenereerd: {out_wav} (Duur: {total_duration:.1f}s)")
    return out_wav

if __name__ == "__main__":
    generate_slot_sfx()
