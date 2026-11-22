#!/usr/bin/env python3
"""Procedural documentary score, one mood per part, timed to beats.json.

  python3 explainer/score.py <project dir> <duration seconds>

Writes <project>/music.wav (48 kHz mono). Instruments are synthesized:
felt piano (decaying harmonics), pizzicato (Karplus-Strong), string pad,
low cello drone, clock tick and a soft low pulse. A small reverb glues them.
"""
import json, sys, wave
import numpy as np

proj, DUR = sys.argv[1], float(sys.argv[2])
SR = 24000
N = int(DUR * SR)
rng = np.random.default_rng(7)
beats = json.load(open(f"{proj}/beats.json"))

def part_start(p):
    return next(b["s"] for b in beats if b["part"] == p)

# section boundaries (start a little before the first beat of each part)
bounds = [("cold", 0.0)] + [(p, part_start(p) - 1.0) for p in ["p1", "p2", "p3", "p4", "p5", "p6", "end"]]
bounds.append(("_", DUR))

def midi(m): return 440.0 * 2 ** ((m - 69) / 12)

def env_adsr(n, a, r):
    e = np.ones(n, np.float32)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e

def piano(f, dur, vel=0.5):
    n = int((dur + 2.5) * SR); t = np.arange(n) / SR
    out = np.zeros(n, np.float32)
    for k in range(1, 9):
        fk = f * k * (1 + 0.0004 * k * k)
        if fk > SR / 2.2: break
        out += (1 / k ** 1.4) * np.sin(2 * np.pi * fk * t) * np.exp(-t * (0.9 + 0.55 * k))
    out *= env_adsr(n, 0.004, 0.25)
    # release when the key lifts
    rel = int(dur * SR)
    if rel < n: out[rel:] *= np.exp(-np.arange(n - rel) / (0.35 * SR))
    return out * vel * 0.32

def pizz(f, vel=0.5):
    n = int(1.2 * SR); p = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p).astype(np.float32); out = np.zeros(n, np.float32)
    last = 0.0
    for i in range(n):
        v = buf[i % p]; nv = 0.994 * (0.5 * v + 0.5 * last); last = v; buf[i % p] = nv; out[i] = v
    return out * vel * 0.25

def saw(f, n, detune=0.0):
    t = np.arange(n) / SR
    ph = (f * (1 + detune) * t) % 1.0
    return (2 * ph - 1).astype(np.float32)

def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    # vectorised one-pole via lfilter-free recursion in chunks
    y = np.empty_like(x); acc = 0.0
    for i in range(0, len(x), 4096):
        seg = x[i:i + 4096]
        out = np.empty_like(seg)
        for j, v in enumerate(seg):
            acc = (1 - a) * v + a * acc; out[j] = acc
        y[i:i + 4096] = out
    return y

def pad(freqs, dur, vel=0.4, bright=1400):
    n = int((dur + 1.5) * SR)
    x = np.zeros(n, np.float32)
    for f in freqs:
        for d in (-0.004, 0.0, 0.005):
            x += saw(f, n, d)
    x = lowpass(x / (3 * len(freqs)), bright)
    return x * env_adsr(n, 1.2, 1.6) * vel * 0.5

def cello(f, dur, vel=0.4):
    n = int((dur + 1.0) * SR); t = np.arange(n) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.clip(t - 0.4, 0, 1)
    ph = np.cumsum(f * vib / SR) % 1.0
    x = lowpass((2 * ph - 1).astype(np.float32), 700)
    return x * env_adsr(n, 0.6, 0.9) * vel * 0.6

def tick(vel=0.3):
    n = int(0.03 * SR)
    x = rng.uniform(-1, 1, n).astype(np.float32)
    x = x - lowpass(x, 3000)
    return x * np.exp(-np.arange(n) / (0.005 * SR)) * vel

def pulse(vel=0.5):
    n = int(0.5 * SR); t = np.arange(n) / SR
    f = 60 * np.exp(-t * 6) + 40
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)).astype(np.float32) * vel

def boom(vel=0.8):
    n = int(3.0 * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * np.cumsum(45 * np.exp(-t * 1.5) + 30) / SR) * np.exp(-t * 1.6)
    noise = lowpass(rng.uniform(-1, 1, n).astype(np.float32), 400) * np.exp(-t * 3) * 0.6
    return (x + noise).astype(np.float32) * vel

music = np.zeros(N + 10 * SR, np.float32)
def add(x, at, gain=1.0):
    i = int(at * SR)
    if i >= len(music): return
    j = min(len(music), i + len(x)); music[i:j] += x[: j - i] * gain

# chords as MIDI note lists
C = {"C": [48, 55, 60, 64], "G": [43, 55, 59, 62], "Am": [45, 57, 60, 64], "F": [41, 57, 60, 65], "Dm": [38, 57, 62, 65],
     "Em": [40, 55, 59, 64], "E": [40, 56, 59, 64], "Bb": [46, 58, 62, 65], "A": [45, 57, 61, 64], "Csus": [48, 55, 60, 65],
     "Fmaj7": [41, 57, 60, 64], "Gsus": [43, 55, 60, 62]}

def section(name, a, b):
    if name == "cold":  # mysterious, warm: slow piano motif over a pad
        bpm, prog = 66, ["Dm", "Bb", "F", "A"]
        bar = 4 * 60 / bpm; t = a; i = 0
        motif = [74, 72, 69, 72]
        while t < b - 0.5:
            ch = C[prog[i % 4]]
            add(pad([midi(m) for m in ch[1:]], bar, 0.35, 900), t)
            add(cello(midi(ch[0] - 12), bar, 0.25), t)
            for k, m in enumerate(motif):
                add(piano(midi(m - (0 if i % 2 == 0 else 2)), 0.9, 0.35), t + k * bar / 4)
            t += bar; i += 1
    elif name == "p1":  # optimism: piano arpeggios + pizzicato, major
        bpm, prog = 92, ["C", "G", "Am", "F"]
        beat = 60 / bpm; t = a; i = 0
        while t < b - 0.5:
            ch = C[prog[(i // 4) % 4]]
            if i % 4 == 0: add(pad([midi(m) for m in ch[1:]], 4 * beat, 0.22, 1600), t)
            add(pizz(midi(ch[0]), 0.5), t)
            for k in range(2):
                add(piano(midi(ch[1 + (i * 2 + k) % 3] + 12), 0.35, 0.28), t + k * beat / 2)
            t += beat; i += 1
    elif name == "p2":  # explainer: light pizzicato + ticks
        bpm, prog = 96, ["F", "Dm", "Bb", "C"]
        beat = 60 / bpm; t = a; i = 0
        while t < b - 0.5:
            ch = C[prog[(i // 4) % 4]]
            if i % 4 == 0: add(pad([midi(m) for m in ch[1:]], 4 * beat, 0.18, 1200), t)
            add(pizz(midi(ch[1 + i % 3]), 0.45), t)
            if i % 2 == 1: add(pizz(midi(ch[1 + (i + 1) % 3] + 12), 0.3), t + beat / 2)
            add(tick(0.12), t)
            t += beat; i += 1
    elif name == "p3":  # tension: ticking pulse, drone, rising strings
        bpm = 100; beat = 60 / bpm; t = a; i = 0
        prog = ["Am", "F", "Dm", "E"]
        span = b - a
        while t < b - 0.5:
            k = (t - a) / span  # intensity ramp 0..1
            ch = C[prog[(i // 8) % 4]]
            if i % 8 == 0:
                add(cello(midi(ch[0] - 12), 8 * beat, 0.35 + 0.2 * k), t)
                add(pad([midi(m) for m in ch[1:]], 8 * beat, 0.12 + 0.18 * k, 800 + 900 * k), t)
            add(tick(0.22), t)
            if i % 2 == 0: add(pulse(0.25 + 0.3 * k), t)
            if k > 0.5 and i % 4 == 2: add(pizz(midi(ch[2] + 12), 0.35), t)
            t += beat; i += 1
    elif name == "p4":  # the fall: low strings, sparse piano
        bpm = 60; bar = 4 * 60 / bpm; t = a; i = 0
        prog = ["Dm", "Bb", "Gsus", "A"]
        add(boom(0.7), a + 1.0)
        while t < b - 0.5:
            ch = C[prog[i % 4]]
            add(cello(midi(ch[0] - 12), bar, 0.4), t)
            add(cello(midi(ch[2] - 12), bar, 0.22), t + 0.3)
            add(piano(midi(ch[3] + 12), 1.5, 0.22), t + bar / 2)
            t += bar; i += 1
    elif name == "p5":  # the argument: reflective solo piano
        bpm = 72; beat = 60 / bpm; t = a; i = 0
        prog = ["Em", "C", "G", "Gsus"]
        while t < b - 0.5:
            ch = C[prog[(i // 4) % 4]]
            if i % 4 == 0: add(piano(midi(ch[0]), 3.0, 0.3), t)
            add(piano(midi(ch[1 + i % 3] + 12), 0.8, 0.22 + 0.06 * (i % 2)), t)
            t += beat; i += 1
    elif name == "p6":  # today: modern pad + sparse piano
        bpm = 80; bar = 4 * 60 / bpm; t = a; i = 0
        prog = ["Csus", "Fmaj7", "Am", "Gsus"]
        while t < b - 0.5:
            ch = C[prog[i % 4]]
            add(pad([midi(m) for m in ch], bar, 0.3, 2000), t)
            add(piano(midi(ch[2] + 12), 0.6, 0.2), t + bar * 0.25)
            add(piano(midi(ch[3] + 12), 0.6, 0.18), t + bar * 0.75)
            t += bar; i += 1
    elif name == "end":  # return of the opening motif, resolved, then outro
        bpm, prog = 70, ["F", "C", "Dm", "Bb", "F", "C", "Gsus", "C"]
        bar = 4 * 60 / bpm; t = a; i = 0
        while t < b - 0.5:
            ch = C[prog[i % len(prog)]]
            add(pad([midi(m) for m in ch[1:]], bar, 0.3, 1400), t)
            for k, m in enumerate([72, 74, 76, 79] if i % 2 == 0 else [77, 76, 74, 72]):
                add(piano(midi(m), 0.9, 0.3), t + k * bar / 4)
            add(cello(midi(ch[0] - 12), bar, 0.25), t)
            t += bar; i += 1

for (name, a), (_, b) in zip(bounds, bounds[1:]):
    seg = np.zeros_like(music)
    keep = music.copy(); music[:] = 0
    section(name, a, b + 1.5)
    # fade section edges for 1.5 s crossfades
    ia, ib = int(a * SR), int((b + 1.5) * SR)
    music[:max(0, ia)] = 0
    fi = int(1.5 * SR)
    music[ia:ia + fi] *= np.linspace(0, 1, len(music[ia:ia + fi]))
    tail = music[ib - fi:ib]; music[ib - fi:ib] = tail * np.linspace(1, 0, len(tail)); music[ib:] = 0
    music += keep
    print("section", name, round(a, 1), round(b, 1), flush=True)

music = music[:N]
# balance: bring every section to its target loudness, with 2 s gain ramps
TARGET = {"cold": -22, "p1": -23, "p2": -24, "p3": -21, "p4": -22, "p5": -24, "p6": -24, "end": -22}
gain = np.ones(N, np.float32)
pts = []
for (name, a), (_, b) in zip(bounds, bounds[1:]):
    seg = music[int(a * SR):int(b * SR)]
    rms = 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9)
    g = 10 ** ((TARGET[name] - rms) / 20)
    pts += [(a + 1.0, g), (b - 1.0, g)]
xs = np.array([p[0] for p in pts]) * SR; ys = np.array([p[1] for p in pts])
gain = np.interp(np.arange(N), xs, ys).astype(np.float32)
music *= gain
# reverb: exponentially decaying noise impulse, overlap-add FFT convolution
ir_n = int(2.2 * SR)
ir = rng.standard_normal(ir_n).astype(np.float32) * np.exp(-np.arange(ir_n) / (0.45 * SR))
ir = lowpass(ir, 5000); ir /= np.sqrt(np.sum(ir ** 2))
blk = 1 << 17; F = 1 << int(np.ceil(np.log2(blk + ir_n)))
IR = np.fft.rfft(ir, F)
wet = np.zeros(N + F, np.float32)
for i in range(0, N, blk):
    x = music[i:i + blk]
    y = np.fft.irfft(np.fft.rfft(x, F) * IR, F)
    wet[i:i + F] += y.astype(np.float32)
mix = 0.78 * music + 0.32 * wet[:N]
# fade in/out and normalise
fo = int(4 * SR); mix[-fo:] *= np.linspace(1, 0, fo)
mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.8
up = np.interp(np.arange(len(mix) * 2) / 2, np.arange(len(mix)), mix)
with wave.open(f"{proj}/music.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(48000)
    w.writeframes((np.clip(up, -1, 1) * 32767).astype(np.int16).tobytes())
print("music.wav written", round(DUR, 1), "s")
