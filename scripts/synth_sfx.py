"""Synthesised soft sounds (no API): python scripts/synth_sfx.py [key ...]
Writes assets/_candidates/sfx/<key>/v3_01.mp3; install with `sfx.py pick <key> 1 --version v3`.
Design: low-mid sine tones (C4-G5 max), soft attack, long decay, pentatonic notes only, no highs."""
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "_candidates" / "sfx"
SR = 44100
NOTES = {"do": 261.63, "re": 293.66, "mi": 329.63, "fa": 349.23, "sol": 392.0, "la": 440.0, "si": 493.88, "do2": 523.25}
HZ = {"C3": 130.81, "G3": 196.0, "C4": 261.63, "D4": 293.66, "E4": 329.63, "G4": 392.0,
      "A4": 440.0, "C5": 523.25, "D5": 587.33, "E5": 659.25}


def tone(freq, dur, vol=0.5, attack=0.03, decay=5.0):
    t = np.arange(int(SR * dur)) / SR
    env = np.minimum(t / attack, 1.0) * np.exp(-decay * t)
    wave_ = np.sin(2 * np.pi * freq * t) + 0.18 * np.sin(4 * np.pi * freq * t) + 0.05 * np.sin(6 * np.pi * freq * t)
    return vol * env * wave_ / 1.23


def place(buf, sig, at):
    i = int(at * SR)
    buf[i:i + len(sig)] += sig[:len(buf) - i]


def echo(buf, delay=0.23, gain=0.32, taps=4):
    out = buf.copy()
    for k in range(1, taps + 1):
        d = int(delay * SR * k)
        out[d:] += buf[:len(buf) - d] * gain ** k
    return out


def lowpass(x, cutoff=1800):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    prev = 0.0
    for i, v in enumerate(x):
        prev = (1 - a) * v + a * prev
        y[i] = prev
    return y


def finish(x, peak=0.35):
    x = lowpass(x)
    fade = int(0.04 * SR)
    x[-fade:] *= np.linspace(1, 0, fade)
    return x * (peak / max(np.abs(x).max(), 1e-6))


def catch():
    b = np.zeros(int(SR * 1.2))
    place(b, tone(HZ["G4"], 0.8, 0.5), 0.0)
    place(b, tone(HZ["C5"], 0.8, 0.4), 0.16)
    return finish(echo(b, 0.2, 0.25, 3), 0.3)


def jar_fill():
    b = np.zeros(int(SR * 1.4))
    place(b, tone(HZ["C3"] * 1.5, 1.2, 0.5, attack=0.15, decay=2.6), 0.0)
    place(b, tone(HZ["G3"] * 1.5, 1.2, 0.3, attack=0.2, decay=2.6), 0.1)
    return finish(echo(b, 0.25, 0.25, 2), 0.2)


def note(name):
    def f():
        b = np.zeros(int(SR * 1.3))
        place(b, tone(NOTES[name], 1.2, 0.5, attack=0.02, decay=4.5), 0.0)
        place(b, tone(NOTES[name] / 2, 1.2, 0.2, attack=0.02, decay=5.0), 0.0)  # warm octave below
        return finish(echo(b, 0.18, 0.22, 3), 0.28)
    return f


def celebrate():
    b = np.zeros(int(SR * 6.0))
    melody = [("E4", 0), ("G4", .5), ("A4", 1.0), ("G4", 1.5), ("E4", 2.0), ("D4", 2.5), ("C4", 3.0)]
    for n, t in melody:
        place(b, tone(HZ[n], 1.2, 0.5, decay=3.5), t)
    for n in ("C4", "E4", "G4"):  # final soft chord
        place(b, tone(HZ[n], 2.4, 0.3, attack=0.08, decay=1.6), 3.6)
    return finish(echo(b, 0.3, 0.3, 4), 0.32)


def tap_miss():
    t = np.arange(int(SR * 0.35)) / SR
    f = 200 + 90 * np.exp(-25 * t)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(t / 0.01, 1) * np.exp(-14 * t)
    return finish(x, 0.15)


def ambience():
    L = 24.0  # seamless: every partial and LFO completes whole cycles in L seconds
    n = int(SR * L)
    t = np.arange(n) / SR
    def q(f): return round(f * L) / L
    x = np.zeros(n)
    for i, f in enumerate([HZ["C3"], HZ["G3"], HZ["E4"]]):
        lfo = 0.6 + 0.4 * np.sin(2 * np.pi * (2 + i) / L * t + i)
        x += 0.3 * lfo * np.sin(2 * np.pi * q(f) * t)
    b = np.zeros(n)
    for k, (name, at) in enumerate([("G4", 3), ("E4", 9), ("A4", 14.5), ("D4", 19)]):
        s = tone(HZ[name], 4.0, 0.25, attack=0.12, decay=1.3)
        idx = (np.arange(len(s)) + int(at * SR)) % n  # wrap so the loop is seamless
        np.add.at(b, idx, s)
    x = x + b
    x = lowpass(x, 1200)
    return x * (0.3 / np.abs(x).max())


SOUNDS = {**{f"catch_{n}": note(n) for n in NOTES}, "catch": catch, "jar_fill": jar_fill, "celebrate": celebrate, "tap_miss": tap_miss, "ambience": ambience}


def main():
    keys = sys.argv[1:] or list(SOUNDS)
    for k in keys:
        d = OUT / k
        d.mkdir(parents=True, exist_ok=True)
        x = SOUNDS[k]()
        wav, mp3 = d / "v3_01.wav", d / "v3_01.mp3"
        with wave.open(str(wav), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-q:a", "3", str(mp3)], check=True)
        wav.unlink()
        print("saved", mp3.relative_to(ROOT))


if __name__ == "__main__":
    main()
