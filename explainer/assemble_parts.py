#!/usr/bin/env python3
"""Rebuild a project's narration from per-part recordings (e.g. ElevenLabs).

  python3 explainer/assemble_parts.py <project dir> <parts dir>

<parts dir> holds one audio file per script part, named <part>.mp3 (cold.mp3,
p1.mp3 ...), each reading that part's beats in order. Each file is split into
beats at the pause before each beat's first word (faster-whisper word times),
then the narration is reassembled with the script's gaps and pads, exactly as
narrate_kokoro.py does. Writes voice.wav, beats.json and words.json.
"""
import json, re, subprocess, sys, wave
import numpy as np
from faster_whisper import WhisperModel

proj, pdir = sys.argv[1], sys.argv[2]
S = json.load(open(f"{proj}/script.json"))
SR = 48000
model = WhisperModel("small.en", device="cpu", compute_type="int8")

def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()

def words_of(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
    a16 = np.frombuffer(raw, np.float32).copy()
    segs, _ = model.transcribe(a16, word_timestamps=True, beam_size=5)
    return [{"w": x.word.strip(), "s": x.start, "e": x.end} for s in segs for x in s.words]

norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())

def trim(a):
    thr = 0.012 * np.max(np.abs(a))
    idx = np.where(np.abs(a) > thr)[0]
    return a[max(0, idx[0] - 480): idx[-1] + 4800] if len(idx) else a

parts = []
for b in S["beats"]:
    if not parts or parts[-1][0] != b["part"]: parts.append((b["part"], []))
    parts[-1][1].append(b)

pieces, beats, t = [np.zeros(int(0.6 * SR), np.float32)], [], 0.6
prev_part = None
for name, bs in parts:
    a = load(f"{pdir}/{name}.mp3")
    ws = words_of(f"{pdir}/{name}.mp3")
    total_chars = sum(len(b["text"]) for b in bs)
    cuts, wi, acc = [0.0], 0, 0
    for k in range(1, len(bs)):
        acc += len(bs[k - 1]["text"])
        expect = acc / total_chars * (ws[-1]["e"] if ws else len(a) / SR)
        first = norm(bs[k]["text"].split()[0])
        best, best_score = None, -1e9
        for j in range(max(1, wi), len(ws)):
            if abs(ws[j]["s"] - expect) > 12: continue
            gap = ws[j]["s"] - ws[j - 1]["e"]
            match = norm(ws[j]["w"]).startswith(first[:4]) or first.startswith(norm(ws[j]["w"])[:4] or "~")
            score = gap * 3 + (100.0 if match else 0) - abs(ws[j]["s"] - expect) * 0.05
            if score > best_score: best, best_score = j, score
        wi = best + 1
        cuts.append((ws[best - 1]["e"] + ws[best]["s"]) / 2)
        print(f"  {bs[k]['id']} starts at {ws[best]['s']:.2f}s ('{ws[best]['w']}', gap {ws[best]['s'] - ws[best - 1]['e']:.2f}s)", flush=True)
    cuts.append(len(a) / SR)
    for k, b in enumerate(bs):
        if prev_part is not None:
            gap = S["gapPart"] if b["part"] != prev_part else S["gapBeat"]
            pieces.append(np.zeros(int(gap * SR), np.float32)); t += gap
        seg = trim(a[int(cuts[k] * SR): int(cuts[k + 1] * SR)])
        beats.append({"id": b["id"], "part": b["part"], "s": round(t, 3), "e": round(t + len(seg) / SR, 3), "text": b["text"]})
        pieces.append(seg); t += len(seg) / SR
        pad = b.get("padAfter", 0)
        if pad: pieces.append(np.zeros(int(pad * SR), np.float32)); t += pad
        prev_part = b["part"]
    print(name, "done", flush=True)

voice = np.concatenate(pieces)
voice = voice / (np.max(np.abs(voice)) + 1e-9) * 0.89
with wave.open(f"{proj}/voice.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(voice, -1, 1) * 32767).astype(np.int16).tobytes())
json.dump(beats, open(f"{proj}/beats.json", "w"), indent=1)
allw = words_of(f"{proj}/voice.wav")
json.dump([{"w": x["w"], "s": round(x["s"], 3), "e": round(x["e"], 3)} for x in allw], open(f"{proj}/words.json", "w"))
print("total", round(t, 2), "s;", len(allw), "words")
