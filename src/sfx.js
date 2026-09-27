// Every sound in the game: ZzFX parameter arrays, played through vendor/zzfx.js. No audio files.
// Paste any array into the ZzFX designer (https://zzfx.3d2k.com) to audition/tweak it, then paste it back here.
// Parameter order: [volume, randomness, frequency, attack, sustain, release, shape, shapeCurve, slide, deltaSlide,
//   pitchJump, pitchJumpTime, repeatTime, noise, modulation, bitCrush, delay, sustainVolume, decay, tremolo, filter]
// randomness = ± fraction applied to pitch on every play (0.1 = ±10%). filter > 0 = high-pass, < 0 = low-pass (Hz).

// Snip: a short, bright metallic "shk" (chaotic waveform + heavy pitch noise, high-passed, no pitch slide, so it never
// reads as a chirp), ±5% per play.
export const snip = [0.65, 0.05, 2200, 0, 0.004, 0.05, 4, 0.5, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0.4, 0.02, 0, 2500];
// Multi-snip: played after `snip` when the zone held 2+ enemies: a second, higher "shk" (a double snip).
export const snipMulti = [0.55, 0.05, 3000, 0, 0.003, 0.04, 4, 0.5, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0.4, 0.02, 0, 3200];
export const snipMultiDelayMs = 55;
// Too-slow close: dull, muffled thump (low, noisy, low-passed). Must never be mistaken for a snip.
export const thump = [0.8, 0.05, 90, 0, 0.02, 0.12, 0, 1, -6, 0, 0, 0, 0, 0.4, 0, 0, 0, 0.5, 0.05, 0, -600];
// Enemy hit that it survives: soft fabric rip (filtered noise). Kills have no sound of their own (the snip covers it).
export const rip = [0.4, 0.2, 400, 0, 0.03, 0.12, 4, 0.5, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0.6, 0.04, 0, -1800];
// Brute armor clang: metallic ping (triangle with frequency modulation, long ring).
export const clang = [0.6, 0.02, 1300, 0, 0.02, 0.35, 1, 1, 0, 0, 0, 0, 0, 0, 40, 0, 0, 0.4, 0.02, 0.2];
// Tower placed: soft pin-into-cushion pop.
export const pinPop = [0.5, 0.05, 700, 0, 0.01, 0.06, 0, 2, -60, 0, 0, 0, 0, 0, 0, 0, 0, 0.5];
// Magnet Pin pulse: low hum.
export const magnetHum = [0.35, 0, 70, 0.08, 0.35, 0.2, 0, 1, 0, 0, 0, 0, 0.08, 0, 0, 0, 0, 0.8, 0.05, 0.3];
// Needle Pin shot: a quick high "thwip" falling in pitch, a little noisy, high-passed so it stays under the snip.
export const needle = [0.3, 0.1, 1900, 0, 0.005, 0.06, 0, 1.5, -45, 0, 0, 0, 0, 3, 0, 0, 0, 0.5, 0.02, 0, 1500];
// Wave clear: short ascending 3-note arpeggio (C5 E5 G5); game over: the descending version (G4 E4 C4).
export const waveClear = [
  [0.4, 0, 523, 0, 0.05, 0.18, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.7, 0.02],
  [0.4, 0, 659, 0, 0.05, 0.18, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.7, 0.02],
  [0.4, 0, 784, 0, 0.08, 0.3, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.7, 0.02],
];
export const gameOver = [
  [0.4, 0, 392, 0, 0.08, 0.25, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.7, 0.03],
  [0.4, 0, 330, 0, 0.08, 0.25, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.7, 0.03],
  [0.4, 0, 262, 0, 0.15, 0.5, 0, 1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0.7, 0.05],
];
export const arpeggioGapMs = 110;
// Helicopter: rising whir (saw with a fast repeating tremolo) lasting the whole 1.6s spin.
export const heliWhir = [0.45, 0, 180, 0.1, 1.3, 0.2, 2, 1, 6, 0, 0, 0, 0.06, 0, 0, 0, 0, 0.7, 0.05, 0.5, 1200];
