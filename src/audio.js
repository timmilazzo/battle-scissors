// Sound playback: every sound is a ZzFX parameter array from sfx.js, played through vendor/zzfx.js. No audio files.
// Browsers keep audio silent until a user gesture: unlockAudio() is called from the PLAY button. Mute persists.
import { zzfx, zzfxX } from '../vendor/zzfx.js';
import * as SFX from './sfx.js';

const MUTE_KEY = 'battleScissors.muted';
let muted = false;
try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { /* storage blocked */ }
const lastPlayed = {};              // name -> ms timestamp, to stop one frame from stacking the same sound

export const isMuted = () => muted;
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { /* storage blocked */ }
}
export function unlockAudio() { if (zzfxX.state !== 'running') zzfxX.resume().catch(() => {}); }

// Play a named sfx.js array. minGapMs throttles repeats of the same sound (e.g. many rips in one frame).
export function sfx(name, minGapMs = 30) {
  if (muted || zzfxX.state !== 'running') return;
  const now = performance.now();
  if (now - (lastPlayed[name] || -1e9) < minGapMs) return;
  lastPlayed[name] = now;
  try { zzfx(...SFX[name]); } catch (e) { /* bad parameters shouldn't break the game */ }
}

// Play a list of arrays (an arpeggio) SFX.arpeggioGapMs apart.
export function sfxSequence(name) {
  if (muted || zzfxX.state !== 'running') return;
  SFX[name].forEach((p, i) => setTimeout(() => { if (!muted) zzfx(...p); }, i * SFX.arpeggioGapMs));
}

// Snip, plus a soft second tone when it was a multi-snip.
export function sfxSnip(multi) {
  sfx('snip', 0);
  if (multi && !muted) setTimeout(() => sfx('snipMulti', 0), SFX.snipMultiDelayMs);
}
