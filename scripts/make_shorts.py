#!/usr/bin/env python3
"""Cut vertical YouTube Shorts (1080x1920) from a long video.

Usage:
  python3 scripts/make_shorts.py INPUT.mp4 clips.json [--words words.json] [--out output/shorts] [--fit crop|blur]

clips.json:  [{"start": 83.2, "end": 128.0, "title": "He did WHAT?!"}, ...]
words.json:  [{"text": "hello", "start": 1.02, "end": 1.31}, ...]   (word timestamps, optional)

Each clip gets: vertical framing, a hook title for the first 2.5s, and bold
word-by-word captions (2-3 words per line, the current word highlighted).
"""
import argparse, json, os, subprocess, sys

W, H = 1080, 1920


def ass_time(t):
    t = max(t, 0)
    h, r = divmod(t, 3600)
    m, s = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def esc(s):
    return s.replace("\\", "").replace("{", "(").replace("}", ")").replace("\n", " ")


def build_ass(clip, words, path):
    start, end = clip["start"], clip["end"]
    dur = end - start
    lines = [
        "[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}", "WrapStyle: 0", "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
        "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        "Style: Cap,DejaVu Sans,92,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,7,3,2,60,60,560,1",
        "Style: Hook,DejaVu Sans,78,&H00FFFFFF,&H00FFFFFF,&H00000000,&HC0000000,1,0,0,0,100,100,0,0,3,18,0,8,70,70,230,1",
        "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    if clip.get("title"):
        lines.append(f"Dialogue: 1,{ass_time(0)},{ass_time(min(2.5, dur))},Hook,,0,0,0,,"
                     f"{{\\fad(150,250)}}{esc(clip['title']).upper()}")
    seg = [w for w in words if w["end"] > start and w["start"] < end]
    groups, cur = [], []
    for w in seg:
        cur.append(w)
        if len(cur) == 3 or w["text"].rstrip().endswith((".", "?", "!", ",")):
            groups.append(cur); cur = []
    if cur:
        groups.append(cur)
    for gi, g in enumerate(groups):
        g_end = groups[gi + 1][0]["start"] if gi + 1 < len(groups) else g[-1]["end"]
        for i, w in enumerate(g):
            ws = w["start"] - start
            we = (g[i + 1]["start"] if i + 1 < len(g) else g_end) - start
            if we <= ws:
                continue
            txt = " ".join(
                (r"{\c&H00E6FF&\fscx112\fscy112}" + esc(x["text"].strip()).upper() + r"{\r}") if j == i
                else esc(x["text"].strip()).upper()
                for j, x in enumerate(g))
            lines.append(f"Dialogue: 0,{ass_time(ws)},{ass_time(min(we, dur))},Cap,,0,0,0,,{txt}")
    with open(path, "w") as f:
        f.write("\n".join(lines) + "\n")


def render(inp, clip, words, out, fit):
    ass = out[:-4] + ".ass"
    build_ass(clip, words, ass)
    if fit == "crop":
        vf = f"scale=-2:{H},crop={W}:{H},setsar=1"
    else:  # blurred background, full frame centred
        vf = (f"split[a][b];[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=30:3,eq=brightness=-0.15[bg];"
              f"[b]scale={W}:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1")
    vf += f",ass='{ass}'"
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-ss", str(clip["start"]), "-to", str(clip["end"]), "-i", inp,
           "-filter_complex", f"[0:v]{vf}[v]", "-map", "[v]", "-map", "0:a?",
           "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30",
           "-c:a", "aac", "-b:a", "160k", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
           "-movflags", "+faststart", out]
    subprocess.run(cmd, check=True)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("input"); p.add_argument("clips")
    p.add_argument("--words"); p.add_argument("--out", default="output/shorts")
    p.add_argument("--fit", choices=["crop", "blur"], default="crop")
    a = p.parse_args()
    clips = json.load(open(a.clips))
    words = json.load(open(a.words)) if a.words else []
    os.makedirs(a.out, exist_ok=True)
    for i, c in enumerate(clips, 1):
        d = c["end"] - c["start"]
        if d > 180:
            sys.exit(f"clip {i} is {d:.0f}s; Shorts max is 180s")
        out = os.path.join(a.out, f"short_{i:02d}.mp4")
        render(a.input, c, words, out, a.fit)
        print(f"✓ {out}  ({d:.1f}s)  {c.get('title', '')}")


if __name__ == "__main__":
    main()
