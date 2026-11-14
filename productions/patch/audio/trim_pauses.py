# Pause-only processing (Test B method without time-stretch, since none is needed):
# every pause >= 0.18 s is shortened to a common cap; the 7 longest (emotional) pauses
# keep 0.32 s. The cap is solved so the result is exactly WORDS at TARGET wpm.
import sys, subprocess, json, numpy as np
src, words, target = sys.argv[1], int(sys.argv[2]), float(sys.argv[3])
SR = 48000
x = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',src,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout,dtype=np.float32).copy()
win = int(SR*0.01)
rms = np.sqrt(np.convolve(x**2, np.ones(win)/win, 'same')[::win] + 1e-12)
sil = 20*np.log10(rms) < -38
runs=[]; i=0
while i < len(sil):
    if sil[i]:
        j=i
        while j<len(sil) and sil[j]: j+=1
        if (j-i)*0.01 >= 0.18 and i>0 and j<len(sil): runs.append([i*win, j*win])
        i=j
    else: i+=1
LONG = 0.32
order = sorted(range(len(runs)), key=lambda k: -(runs[k][1]-runs[k][0]))
longset = set(order[:7])
total = len(x)/SR
want = words/target*60 + 0.008*66  # compensate crossfade overlap at the ~66 edits
fixed = total - sum((b-a)/SR for a,b in runs)
def length(cap): return fixed + sum(min((b-a)/SR, LONG if k in longset else cap) for k,(a,b) in enumerate(runs))
lo, hi = 0.05, 0.6
for _ in range(60):
    mid=(lo+hi)/2
    if length(mid) < want: lo=mid
    else: hi=mid
cap = (lo+hi)/2
FADE = int(0.008*SR)
pieces=[]; pos=0; edits=[]
for k,(a,b) in enumerate(runs):
    c = int((LONG if k in longset else cap)*SR)
    if b-a <= c: continue
    ca, cb = a + c//2, b - c//2
    pieces.append(x[pos:ca]); pos = cb; edits.append(ca/SR)
pieces.append(x[pos:])
y = pieces[0]
for p in pieces[1:]:
    f = min(FADE, len(y), len(p)); r = np.linspace(0,1,f,dtype=np.float32)
    y = np.concatenate([y[:-f], y[-f:]*(1-r) + p[:f]*r, p[f:]])
np.save('trimmed.npy', y)
# speech-activity check: active (non-silent) time must be unchanged
def active(z):
    rr = np.sqrt(np.convolve(z**2, np.ones(win)/win, 'same')[::win] + 1e-12)
    return float((20*np.log10(rr) >= -38).sum()*0.01)
info = dict(raw_s=total, pauses=len(runs), cap_s=round(cap,3), long_cap_s=LONG, edits=len(edits),
            result_s=len(y)/SR, active_before_s=active(x), active_after_s=active(y))
json.dump(info, open('trim_info.json','w'), indent=1); print(json.dumps(info))
subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-af','loudnorm=I=-16:TP=-1.5:LRA=11','-ar','48000','patch_narration_250wpm.wav'], input=y.tobytes(), check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i','patch_narration_250wpm.wav','-c:a','libmp3lame','-b:a','192k','patch_narration_250wpm.mp3'], check=True)
