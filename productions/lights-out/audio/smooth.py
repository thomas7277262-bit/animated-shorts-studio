# Smooth-flow processing: graded pause shortening + gentle pitch-preserving tempo change
# to land exactly on the target words-per-minute.
import sys, subprocess, json, numpy as np
src, out, words, target = sys.argv[1], sys.argv[2], int(sys.argv[3]), float(sys.argv[4])
SR = 48000
x = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',src,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout,dtype=np.float32).copy()
win = int(SR*0.01)
db = 20*np.log10(np.sqrt(np.convolve(x**2,np.ones(win)/win,'same')[::win]+1e-12))
s = db < -38; runs=[]; i=0
while i < len(s):
    if s[i]:
        j=i
        while j<len(s) and s[j]: j+=1
        if (j-i)*0.01 >= 0.12 and i>0 and j<len(s): runs.append([i*win, j*win])
        i=j
    else: i+=1
L = [(b-a)/SR for a,b in runs]
top7 = set(sorted(range(len(runs)), key=lambda k: -L[k])[:7])
def cap(k):
    if k in top7: return 0.42          # dramatic beats ("So I went.", "…and went out.")
    if L[k] < 0.30: return 0.11        # commas / breaths inside a sentence
    if L[k] < 0.50: return 0.20        # between sentences
    return 0.26                        # longer scene breaks
FADE = int(0.008*SR); pieces=[]; pos=0
for k,(a,b) in enumerate(runs):
    c = int(cap(k)*SR)
    if b-a <= c: continue
    ca, cb = a + c//2, b - c//2
    pieces.append(x[pos:ca]); pos = cb
pieces.append(x[pos:])
y = pieces[0]
for p in pieces[1:]:
    f=min(FADE,len(y),len(p)); r=np.linspace(0,1,f,dtype=np.float32)
    y=np.concatenate([y[:-f], y[-f:]*(1-r)+p[:f]*r, p[f:]])
trimmed = len(y)/SR
want = words/target*60
tempo = trimmed/want            # < 1 means slightly slower
tmp = out + '.tmp.wav'
subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-',tmp], input=y.tobytes(), check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',tmp,'-af',f'rubberband=tempo={tempo:.4f}:pitch=1:formant=preserved:transients=mixed:pitchq=quality,loudnorm=I=-16:TP=-1.5:LRA=11','-ar','48000',out.replace('.mp3','.wav')],check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',out.replace('.mp3','.wav'),'-c:a','libmp3lame','-b:a','192k',out],check=True)
import os; os.remove(tmp)
info=dict(pauses_edited=len(runs), after_trim_s=round(trimmed,2), tempo=round(tempo,4), note='tempo < 1 = slowed down (pitch preserved)')
json.dump(info, open(out+'.json','w'), indent=1); print(json.dumps(info))
