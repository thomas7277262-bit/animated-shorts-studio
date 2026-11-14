#!/usr/bin/env python3
"""Forced alignment of a known script to narration audio (free, offline: pocketsphinx acoustic model).
   python3 render/align.py narration.mp3 script_lines.json out.json
   Output: {report, lines:[{id,text,start,end,words:[{w,start,end}]}]}  (seconds)"""
import json, re, subprocess, sys
import numpy as np
from pocketsphinx import Decoder

SR = 16000
EXTRA = {"brax": "B R AE K S", "brax's": "B R AE K S IH Z", "glitching": "G L IH CH IH NG"}

def norm(tok):
    """display token -> list of dictionary words it is spoken as"""
    t = tok.lower().replace("’", "'")
    parts = [re.sub(r"[^a-z']", "", p).strip("'") for p in re.split(r"[-–—]", t)]
    return [p for p in parts if p]

def main(audio, lines_path, out_path):
    lines = json.load(open(lines_path))
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", audio, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    toks = []   # (display word, line idx, [spoken words])
    for li, l in enumerate(lines):
        for t in l["text"].split():
            toks.append((t, li, norm(t)))
    spoken = [w for _, _, ws in toks for w in ws]
    dec = Decoder(samprate=SR, bestpath=False, loglevel="ERROR")
    for w, p in EXTRA.items():
        dec.add_word(w, p, True)
    dec.set_align_text(" ".join(spoken))
    dec.start_utt(); dec.process_raw(pcm, full_utt=True); dec.end_utt()
    seg = [s for s in dec.seg() if s.word not in ("<s>", "</s>", "<sil>", "[NOISE]")]
    words = [re.sub(r"\(\d+\)$", "", s.word) for s in seg]
    if words != spoken:
        raise SystemExit(f"alignment failed: got {len(words)} words, expected {len(spoken)}")
    k = 0; out_words = []
    for disp, li, ws in toks:
        a = seg[k].start_frame / 100.0; b = (seg[k + len(ws) - 1].end_frame + 1) / 100.0
        out_words.append(dict(w=disp, line=li, start=round(a, 3), end=round(b, 3))); k += len(ws)
    out_lines = []
    for li, l in enumerate(lines):
        ws = [dict(w=w["w"], start=w["start"], end=w["end"]) for w in out_words if w["line"] == li]
        out_lines.append(dict(id=l["id"], text=l["text"], start=ws[0]["start"], end=ws[-1]["end"], words=ws))
    report = dict(method="pocketsphinx forced alignment", audio_s=round(len(pcm) / 2 / SR, 3), words=len(out_words),
                  speech_start=out_words[0]["start"], speech_end=out_words[-1]["end"])
    json.dump(dict(report=report, lines=out_lines), open(out_path, "w"), indent=1)
    print(json.dumps(report))

if __name__ == "__main__":
    main(*sys.argv[1:4])
