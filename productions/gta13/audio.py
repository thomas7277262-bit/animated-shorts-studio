"""Original synthwave score + sound effects for the GTA 13-years short, mixed under the narration.

    python3 productions/gta13/audio.py narration.mp3 words.json out.wav
All music and effects are synthesized here (no samples), so there is nothing to license.
"""
import json, subprocess, sys
import numpy as np

SR = 48000
DUR = 93.6
N = int(DUR * SR)
rng = np.random.default_rng(13)

def tt(sec): return np.arange(int(sec * SR)) / SR
def place(buf, sig, at, gain=1.0):
    s = int(at * SR)
    if s >= len(buf): return
    e = min(len(buf), s + len(sig))
    if s < 0: sig = sig[-s:]; s = 0; e = min(len(buf), len(sig))
    buf[s:e] += sig[: e - s] * gain
def lp_fast(x, cutoff):  # FFT brick-ish low-pass for long signals
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x))
def hp_fast(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 - 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x))
def midi(m): return 440 * 2 ** ((m - 69) / 12)
def saw(f, t): return 2 * ((t * f) % 1) - 1

# ---------------- drums ----------------
def kick(gain=1.0):
    t = tt(0.45); f = 45 + 110 * np.exp(-t * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-t * 7) + 0.3 * np.tanh(4 * np.sin(ph)) * np.exp(-t * 18)) * gain
def snare():
    t = tt(0.35); n = rng.standard_normal(len(t))
    return 0.55 * hp_fast(n, 1500) * np.exp(-t * 14) + 0.4 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25)
def hat(open_=False):
    t = tt(0.25 if open_ else 0.06); return 0.25 * hp_fast(rng.standard_normal(len(t)), 7000) * np.exp(-t * (12 if open_ else 70))
KICK, SNARE, HAT, OHAT = kick(), snare(), hat(), hat(True)

# ---------------- score ----------------
BPM = 95; BEAT = 60 / BPM; BAR = 4 * BEAT
PROG = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [55, 60, 64]), (55, [55, 59, 62])]  # Am F C G
# sections: (start, end, kind)
SECTIONS = [(0.0, 8.3, 'intro'), (8.3, 24.1, 'groove'), (25.4, 43.8, 'filtered'), (43.8, 62.9, 'groove'),
            (62.9, 77.65, 'build'), (78.92, 87.8, 'drop'), (87.8, 93.6, 'outro')]
drums = np.zeros(N); bass = np.zeros(N); pad = np.zeros(N); arp = np.zeros(N)

def section_at(t):
    for a, b, k in SECTIONS:
        if a <= t < b: return k
    return None

# step through 16th notes on a fixed grid starting at 0.15 s (first slam)
GRID0 = 0.15
steps = int((DUR - GRID0) / (BEAT / 4))
for i in range(steps):
    t0 = GRID0 + i * BEAT / 4
    k = section_at(t0)
    if not k: continue
    bar = int(i // 16); s16 = i % 16
    root, chord = PROG[bar % 4]
    # drums
    if k in ('groove', 'drop', 'build') or (k == 'intro' and t0 > 2.0):
        if s16 in (0, 8) or (k == 'drop' and s16 in (0, 4, 8, 12)): place(drums, KICK, t0, 0.9)
        if s16 in (4, 12) and k != 'intro': place(drums, SNARE, t0, 0.55)
        if s16 % 2 == 0: place(drums, OHAT if s16 % 4 == 2 and k == 'drop' else HAT, t0, 0.5)
        if k == 'build' and t0 > 75.0: place(drums, SNARE, t0, 0.25 + 0.5 * (t0 - 75) / 2.6)  # snare roll
    if k == 'filtered' and s16 in (0, 8): place(drums, KICK, t0, 0.45)
    if k == 'outro' and s16 == 0 and t0 < 92.0: place(drums, KICK, t0, 0.6)
    # bass: 8ths on root
    if k in ('groove', 'drop', 'build', 'filtered', 'intro') and s16 % 2 == 0:
        n = int(BEAT / 2 * SR); tb = np.arange(n) / SR; f = midi(root - 24 + (12 if s16 % 4 == 2 and k == 'drop' else 0))
        sig = (saw(f, tb) * 0.6 + np.sin(2 * np.pi * f * tb)) * np.minimum(1, tb / 0.005) * np.exp(-tb * 5)
        place(bass, sig, t0, 0.35 if k != 'filtered' else 0.25)
    # arp: 16ths through chord tones, up an octave
    if k in ('groove', 'drop', 'build', 'filtered'):
        note = chord[[0, 1, 2, 1][s16 % 4]] + 12 + (12 if s16 >= 8 and k == 'drop' else 0)
        n = int(BEAT / 4 * SR); ta = np.arange(n) / SR; f = midi(note)
        sq = np.sign(np.sin(2 * np.pi * f * ta)) * 0.5 + saw(f * 1.005, ta) * 0.3
        place(arp, sq * np.exp(-ta * 18), t0, 0.12)
    # pad: one chord per bar
    if s16 == 0 and k:
        n = int(BAR * SR); tp = np.arange(n) / SR
        sig = sum(saw(midi(m), tp) + saw(midi(m) * 1.004, tp) + saw(midi(m) * 0.996, tp) for m in chord) / 9
        e = np.minimum(1, tp / 0.4) * np.minimum(1, (BAR - tp) / 0.3)
        place(pad, sig * e, t0, 0.5)

# filter the pad/arp per section (darker in the "filtered" part)
pad = lp_fast(pad, 1800); arp = lp_fast(arp, 5000)
def gain_curve(points):
    xs, ys = zip(*points); return np.interp(np.arange(N) / SR, xs, ys)
dark = gain_curve([(0, 1), (25.3, 1), (25.4, 0.35), (43.7, 0.35), (43.8, 1), (DUR, 1)])
arp_f = lp_fast(arp, 900)
arp = arp * dark + arp_f * (1 - dark) * 1.4
music = drums + bass + pad + arp
# silences: twist hit (24.1–25.4) and pre-reveal (77.65–78.92), fade out at the end
music *= gain_curve([(0, 1), (24.1, 1), (24.15, 0), (25.35, 0), (25.45, 1), (77.6, 1), (77.7, 0), (78.9, 0), (78.92, 1), (91.0, 1), (93.4, 0), (DUR, 0)])

# ---------------- sound effects ----------------
fx = np.zeros(N)
def impact(big=1.0):
    t = tt(2.0); f = 40 + 60 * np.exp(-t * 10); ph = 2 * np.pi * np.cumsum(f) / SR
    boom = np.sin(ph) * np.exp(-t * 2.2)
    crack = lp_fast(rng.standard_normal(len(t)), 3000) * np.exp(-t * 9) * 0.5
    return (boom + crack) * big
def whoosh(d=0.6, up=True):
    t = tt(d); n = rng.standard_normal(len(t)); shape = np.sin(np.pi * t / d) ** 2
    return hp_fast(lp_fast(n, 2500), 300) * shape * 0.6
def tick(): t = tt(0.03); return np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 200) * 0.5
def click(): t = tt(0.04); return hp_fast(rng.standard_normal(len(t)), 2000) * np.exp(-t * 120) * 0.6
def ding():
    t = tt(1.2); return (np.sin(2 * np.pi * 1318 * t) + 0.5 * np.sin(2 * np.pi * 2637 * t)) * np.exp(-t * 3) * 0.35
def pop_(): t = tt(0.12); f = 600 + 900 * np.exp(-t * 40); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * 0.35
def scratch():
    t = tt(0.5); f = 300 + 900 * np.abs(np.sin(t * 18)); return np.tanh(3 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * lp_fast(rng.standard_normal(len(t)), 4000) * np.exp(-t * 4) * 0.5
def riser(d):
    t = tt(d); f = 200 + 1800 * (t / d) ** 2; ph = 2 * np.pi * np.cumsum(f) / SR
    return (0.25 * np.sin(ph) + 0.35 * hp_fast(rng.standard_normal(len(t)), 1500) * (t / d)) * (t / d) ** 1.5
def heartbeat():
    out = np.zeros(int(0.9 * SR))
    for st, g in ((0, 1.0), (0.28, 0.7)):
        t = tt(0.2); place(out, np.sin(2 * np.pi * (60 - t * 80) * t) * np.exp(-t * 18) * g, st)
    return out * 1.2

IMPACTS = [(0.15, 1), (0.45, 1), (1.75, 1.2), (6.0, 0.9), (14.0, 0.9), (22.9, 0.8), (25.45, 1.1), (27.5, 0.8), (41.85, 1.0),
           (43.9, 0.8), (49.6, 0.7), (52.4, 0.9), (57.9, 0.8), (59.1, 0.6), (61.4, 0.6), (62.2, 0.8), (63.4, 0.7), (67.7, 0.6),
           (73.2, 0.8), (76.8, 0.9), (78.92, 1.4), (80.08, 1.4), (85.12, 1.3), (86.7, 0.9), (90.56, 1.0)]
for at, g in IMPACTS: place(fx, impact(g), at, 0.55)
for at in (8.3, 24.1, 43.8, 47.6, 50.5, 54.8, 57.2, 62.9, 65.55, 68.95, 72.85, 75.0, 81.3, 87.8, 10.95, 17.85, 21.1, 29.1, 31.4, 34.0, 38.6):
    place(fx, whoosh(0.5), at - 0.25, 0.5)
for yr in range(13):  # odometer ticks (eased between 2.2 and 5.2)
    u = yr / 13; x = (np.cbrt(2 * u) / 2 if u < 0.5 else 1 - np.cbrt(2 - 2 * u) / 2)
    place(fx, tick(), 2.2 + x * 3.0, 0.8)
for i in range(13): place(fx, click(), 8.6 + i * 0.06, 0.5)  # typewriter
place(fx, ding(), 14.0, 0.8)
for at in (11.0, 12.3, 13.6, 15.6, 16.0, 16.64, 19.0, 19.6, 20.0, 31.6, 34.4, 46.2, 50.7, 55.6, 56.5, 58.7, 59.95, 64.5, 64.9, 69.28, 69.96, 70.64, 71.68, 81.36, 82.4, 83.2, 88.6, 91.2):
    place(fx, pop_(), at, 0.7)
place(fx, scratch(), 24.12, 0.8)
place(fx, riser(3.0), 74.6, 0.6)
place(fx, riser(1.2), 77.7, 0.5)
place(fx, heartbeat(), 77.75, 1.0); place(fx, heartbeat(), 78.35, 0.8)
place(fx, ding(), 49.6, 0.5)

# ---------------- mix ----------------
narr_file, words_file, out_file = sys.argv[1:4]
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', narr_file, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
voice = np.frombuffer(raw, dtype=np.float32).copy()
voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
voice /= max(1e-6, np.abs(voice).max()) / 0.9
words = json.load(open(words_file))
mask = np.ones(N)
for w in words:
    a, b = int((w['s'] - 0.12) * SR), int((w['e'] + 0.25) * SR); mask[max(0, a):min(N, b)] = 0
k = 1 - np.exp(-1 / (0.12 * SR)); m = np.empty(N); acc = 1.0
for i in range(0, N, 32):  # smooth the duck curve (block-wise for speed)
    acc += (mask[i:i + 32].mean() - acc) * (1 - (1 - k) ** 32); m[i:i + 32] = acc
duck = 0.14 + 0.86 * m  # about -17 dB under speech
music_bus = music / max(1e-6, np.abs(music).max()) * 0.42 * duck
fx_bus = fx / max(1e-6, np.abs(fx).max()) * 0.5 * (0.3 + 0.7 * m)
# stereo: pad/arp widened slightly with a short delay, voice centred
L = voice + music_bus + fx_bus
R = voice + np.roll(music_bus, int(0.012 * SR)) * 0.97 + fx_bus
st = np.stack([L, R], 1)
st /= max(1.0, np.abs(st).max() / 0.98)
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11', '-ar', str(SR), out_file], input=st.astype(np.float32).tobytes(), check=True)
print('audio written', out_file)
