#!/usr/bin/env python3
"""Generate narration for an explainer project with Kokoro (local, free).

  python3 explainer/narrate_kokoro.py <project dir> <kokoro model dir>

Reads <project>/script.json, writes <project>/voice.wav (48 kHz mono),
<project>/beats.json (start/end of every beat) and <project>/words.json
(word timestamps from faster-whisper, used for fine cues and subtitles).
The model dir must hold kokoro-v1.0.onnx and voices-v1.0.bin.
"""
import json, sys, wave
import numpy as np
from kokoro_onnx import Kokoro

proj, mdir = sys.argv[1], sys.argv[2]
S = json.load(open(f"{proj}/script.json"))
V = S["voice"]
k = Kokoro(f"{mdir}/kokoro-v1.0.onnx", f"{mdir}/voices-v1.0.bin")

LEAD = 0.6
pieces, beats, t, prev_part = [], [], LEAD, None
sr_out = 24000
pieces.append(np.zeros(int(LEAD * sr_out), np.float32))
for b in S["beats"]:
    if prev_part is not None:
        gap = S["gapPart"] if b["part"] != prev_part else S["gapBeat"]
        pieces.append(np.zeros(int(gap * sr_out), np.float32)); t += gap
    audio, sr = k.create(b["text"], voice=V["voice"], speed=V["speed"], lang="en-us")
    assert sr == sr_out
    # trim leading/trailing near-silence so beat times are tight
    thr = 0.01 * np.max(np.abs(audio))
    idx = np.where(np.abs(audio) > thr)[0]
    audio = audio[max(0, idx[0] - 240): idx[-1] + 2400]
    beats.append({"id": b["id"], "part": b["part"], "s": round(t, 3), "e": round(t + len(audio) / sr, 3), "text": b["text"]})
    pieces.append(audio.astype(np.float32)); t += len(audio) / sr
    pad = b.get("padAfter", 0)
    if pad: pieces.append(np.zeros(int(pad * sr_out), np.float32)); t += pad
    prev_part = b["part"]
    print(b["id"], f"{beats[-1]['s']:.2f}-{beats[-1]['e']:.2f}", flush=True)

voice = np.concatenate(pieces)
voice = voice / (np.max(np.abs(voice)) + 1e-9) * 0.89
# 24 kHz -> 48 kHz (linear is fine for speech here; ffmpeg does the final encode)
up = np.interp(np.arange(len(voice) * 2) / 2, np.arange(len(voice)), voice).astype(np.float32)
with wave.open(f"{proj}/voice.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(48000)
    w.writeframes((np.clip(up, -1, 1) * 32767).astype(np.int16).tobytes())
json.dump(beats, open(f"{proj}/beats.json", "w"), indent=1)

# word timings
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
a16 = np.interp(np.linspace(0, len(voice) - 1, int(len(voice) * 16000 / sr_out)), np.arange(len(voice)), voice).astype(np.float32)
segs, _ = m.transcribe(a16, word_timestamps=True, beam_size=5)
words = [{"w": x.word.strip(), "s": round(x.start, 3), "e": round(x.end, 3)} for s in segs for x in s.words]
json.dump(words, open(f"{proj}/words.json", "w"))
print("total", round(t, 2), "s;", len(words), "words")
