#!/usr/bin/env python3
"""
Builds the high-energy, fast-paced 43.5s audio master track for Geertjan's video:
- Combines the 4 fast, silence-trimmed ElevenLabs voiceovers:
  * Ch 1 (0.2s - 10.4s): 10.387 MP views, 106 clicks (€ 0,14), 5 website clicks
  * Ch 2 (10.8s - 21.7s): GA4 vs TPM (€ 22,22 vs € 0,14, 158x goedkoper)
  * Ch 3 (22.0s - 31.4s): Fruitmachine & Jackpot (10.387 / 106 / € 1.200 marge)
  * Ch 4 (31.8s - 43.5s): Stop TPM, zet motor aan, vul showroom Dordrecht (82x ROI)
- Synthesizes synchronized Sound Effects (whooshes, counter ticks, card pops,
  slot machine lever/spin/reel-locks/jackpot bells, and subtle upbeat corporate pulse).
"""

import math
import struct
import wave
import random
import subprocess

FFMPEG = "/Users/matthiasradder/.local/bin/ffmpeg"
SR = 44100
DURATION = 43.8
N_SAMPLES = int(SR * DURATION)

def generate_sfx_wav(filename: str):
    buf = [0.0] * N_SAMPLES
    rng = random.Random(42)

    def add_tone(start_t, dur, freq_start, freq_end=None, vol=0.2, wave_type="sine", attack=0.01, decay=True):
        if freq_end is None:
            freq_end = freq_start
        s0 = int(start_t * SR)
        n = int(dur * SR)
        phase = 0.0
        for i in range(n):
            idx = s0 + i
            if idx >= N_SAMPLES:
                break
            t = i / SR
            frac = i / max(1, n)
            freq = freq_start + (freq_end - freq_start) * frac
            phase += 2.0 * math.pi * freq / SR
            if wave_type == "sine":
                val = math.sin(phase)
            elif wave_type == "triangle":
                val = 2.0 * abs(2.0 * (phase / (2.0 * math.pi) - math.floor(phase / (2.0 * math.pi) + 0.5))) - 1.0
            else:
                val = math.sin(phase) + 0.3 * math.sin(2 * phase)
            env = 1.0
            if t < attack:
                env = t / attack
            elif decay:
                env = math.exp(-3.5 * frac)
            buf[idx] += val * vol * env

    def add_whoosh(start_t, dur=0.38, vol=0.22):
        s0 = int(start_t * SR)
        n = int(dur * SR)
        lp = 0.0
        for i in range(n):
            idx = s0 + i
            if idx >= N_SAMPLES:
                break
            frac = i / max(1, n)
            env = math.sin(math.pi * frac) ** 1.5
            noise = rng.uniform(-1.0, 1.0)
            alpha = 0.04 + 0.18 * math.sin(math.pi * frac)
            lp = lp + alpha * (noise - lp)
            tone = math.sin(2.0 * math.pi * (140 + 280 * frac) * (i / SR))
            buf[idx] += (lp * 0.75 + tone * 0.25) * vol * env

    def add_pop_chime(start_t, base_freq=587.33, vol=0.20):
        add_tone(start_t, 0.18, base_freq, base_freq * 1.0, vol=vol, wave_type="rich")
        add_tone(start_t + 0.06, 0.28, base_freq * 1.5, base_freq * 1.5, vol=vol * 0.85, wave_type="sine")

    def add_counter_ticks(start_t, dur, count=18, vol=0.11):
        for k in range(count):
            t = start_t + (k / count) * dur
            pitch = 700 + 500 * (k / count)
            add_tone(t, 0.035, pitch, pitch * 1.1, vol=vol, wave_type="triangle", attack=0.003)

    # 1. Subtle upbeat modern corporate pulse (120 BPM = 0.5s beat)
    for beat in range(int(DURATION * 2)):
        t_beat = beat * 0.5
        # Soft warm sub-bass pulse on every beat
        add_tone(t_beat, 0.22, 65.41, 55.0, vol=0.07, wave_type="sine", attack=0.015)
        # Subtle high marimba/pluck on off-beats
        if beat % 2 == 1:
            add_tone(t_beat, 0.12, 523.25, 523.25, vol=0.035, wave_type="triangle", attack=0.005)
        if beat % 4 == 0:
            add_tone(t_beat, 0.35, 130.81, 130.81, vol=0.045, wave_type="sine", attack=0.01)

    # 2. Chapter 1 SFX (0.0s - 10.6s)
    add_whoosh(0.05, 0.35, vol=0.26)
    add_pop_chime(0.55, 523.25, vol=0.22)       # Card 1: 10.387 Views
    add_counter_ticks(0.75, 1.5, count=20, vol=0.12)
    add_pop_chime(3.45, 659.25, vol=0.22)       # Card 2: 106 Kliks (€ 0,14)
    add_counter_ticks(3.65, 1.3, count=16, vol=0.12)
    add_pop_chime(6.75, 783.99, vol=0.25)       # Card 3: 5 Websitekliks

    # 3. Chapter 2 SFX (10.6s - 21.8s)
    add_whoosh(10.55, 0.40, vol=0.28)
    # Red warning buzz for TPM (€ 22,22)
    add_tone(11.1, 0.35, 165.0, 145.0, vol=0.20, wave_type="rich")
    add_tone(12.6, 0.25, 140.0, 110.0, vol=0.22, wave_type="rich")
    # Rising GA4 growth curve sweep (14.0s - 17.2s)
    add_whoosh(13.8, 0.35, vol=0.22)
    add_counter_ticks(14.1, 2.4, count=26, vol=0.13)
    add_pop_chime(16.6, 587.33, vol=0.24)       # 237 GA4 sessies badge
    add_pop_chime(18.2, 783.99, vol=0.26)       # 158x Goedkoper badge!

    # 4. Chapter 3 SFX: Casino Slot Machine (21.8s - 31.6s)
    add_whoosh(21.75, 0.38, vol=0.28)
    # Lever Pull at 22.3s
    add_tone(22.30, 0.18, 320.0, 120.0, vol=0.35, wave_type="rich")
    add_tone(22.45, 0.14, 180.0, 480.0, vol=0.32, wave_type="triangle")
    # Spinning Reels whirr/ticks (22.6s - 26.8s)
    t_spin = 22.60
    while t_spin < 26.80:
        pitch = 420 + ((int(t_spin * 25) % 6) * 55)
        add_tone(t_spin, 0.035, pitch, pitch, vol=0.15, wave_type="triangle", attack=0.002)
        t_spin += 0.055

    # Reel 1 Lock at 24.2s (10.387 VERTONINGEN)
    add_tone(24.20, 0.18, 130.0, 75.0, vol=0.42, wave_type="rich", attack=0.003)
    add_pop_chime(24.22, 523.25, vol=0.30)

    # Reel 2 Lock at 25.5s (106 KLIKS)
    add_tone(25.50, 0.18, 145.0, 80.0, vol=0.42, wave_type="rich", attack=0.003)
    add_pop_chime(25.52, 659.25, vol=0.32)

    # Reel 3 Lock at 26.8s (€ 1.200 MARGE) + JACKPOT!
    add_tone(26.80, 0.22, 165.0, 85.0, vol=0.45, wave_type="rich", attack=0.003)
    # Jackpot fanfare triad (C5 - E5 - G5 - C6)
    for idx_n, freq in enumerate([523.25, 659.25, 783.99, 1046.50]):
        add_tone(26.85 + idx_n * 0.11, 0.65, freq, freq, vol=0.30, wave_type="rich")
    # Raining gold coins shimmer (27.2s - 30.8s)
    for c in range(28):
        ct = 27.20 + c * 0.12
        cfreq = rng.choice([1318.5, 1568.0, 1760.0, 2093.0, 2637.0])
        add_tone(ct, 0.09, cfreq, cfreq * 1.02, vol=0.13, wave_type="sine", attack=0.002)

    # 5. Chapter 4 SFX: Showroom & Conclusie (31.6s - 43.5s)
    add_whoosh(31.55, 0.40, vol=0.28)
    add_pop_chime(32.30, 523.25, vol=0.22)      # Step 1: Stop TPM
    add_pop_chime(34.20, 659.25, vol=0.22)      # Step 2: Schaal Motor
    add_pop_chime(36.20, 783.99, vol=0.24)      # Step 3: Vul Showroom
    # Finale triumphant major chord at 41.2s
    for freq in [261.63, 329.63, 392.00, 523.25, 783.99]:
        add_tone(41.20, 2.2, freq, freq, vol=0.14, wave_type="rich", attack=0.03)

    # Write WAV
    with wave.open(filename, "w") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        raw = bytearray()
        for sample in buf:
            clamped = max(-0.95, min(0.95, sample))
            val = int(clamped * 32767)
            raw += struct.pack("<hh", val, val)
        wf.writeframes(raw)

def main():
    sfx_wav = "assets/marketing/video_audio/dynamic_sfx_bed.wav"
    print("🎵 Genereren van dynamische SFX + Pulse audio bed...")
    generate_sfx_wav(sfx_wav)

    out_mp3 = "assets/marketing/video_audio/dynamic_master_audio.mp3"
    # Mix voiceovers at exact timestamps (200ms, 10800ms, 22000ms, 31800ms) with SFX bed
    filter_complex = (
        "[1:a]adelay=200|200,volume=1.15[v1];"
        "[2:a]adelay=10800|10800,volume=1.15[v2];"
        "[3:a]adelay=22000|22000,volume=1.15[v3];"
        "[4:a]adelay=31800|31800,volume=1.15[v4];"
        "[0:a]volume=0.55[sfx];"
        "[v1][v2][v3][v4][sfx]amix=inputs=5:duration=first:dropout_transition=0,dynaudnorm=f=150:g=11"
    )
    cmd = [
        FFMPEG, "-y",
        "-i", sfx_wav,
        "-i", "assets/marketing/video_audio/fast_1.mp3",
        "-i", "assets/marketing/video_audio/fast_2.mp3",
        "-i", "assets/marketing/video_audio/fast_3.mp3",
        "-i", "assets/marketing/video_audio/fast_4.mp3",
        "-filter_complex", filter_complex,
        "-t", f"{DURATION:.2f}",
        "-c:a", "libmp3lame",
        "-b:a", "192k",
        out_mp3
    ]
    subprocess.run(cmd, check=True, stderr=subprocess.DEVNULL)
    print(f"✓ Master audio gereed -> {out_mp3} ({DURATION:.1f}s)")

if __name__ == "__main__":
    main()
