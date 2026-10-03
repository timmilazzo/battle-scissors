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
// Cork Pin pop: a hollow "thoonk" (a cork out of a bottle: a quick low sine bending up, a breath of noise).
export const corkPop = [0.7, 0.05, 180, 0, 0.01, 0.09, 0, 1.2, 40, 0, 0, 0, 0, 1.5, 0, 0, 0, 0.6, 0.02, 0, -2500];
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
// Boss roars (the intro card, and the Unstitcher's phase changes): each boss has its own.
// Seam Ripper: a tearing, rising screech (noisy saw, pitch sweeping up, a little bit-crushed).
export const roarRipper = [0.9, 0.05, 160, 0.04, 0.45, 0.5, 2, 1.8, 3, 0, 0, 0, 0, 2.2, 0, 0.12, 0, 0.7, 0.08, 0.35, 0];
// Brute King: a deep chesty bellow (low square, pitch sagging, heavy tremolo, low-passed).
export const roarKing = [1.1, 0.03, 70, 0.08, 0.7, 0.6, 3, 2.2, -1.2, 0, 0, 0, 0, 0.8, 0, 0.05, 0, 0.8, 0.1, 0.5, -700];
// The Unstitcher: an eerie warble that jumps up an interval halfway (sine with modulation, echoing delay).
export const roarUnstitcher = [0.8, 0.02, 110, 0.1, 0.8, 0.6, 0, 1, 0, 0, 55, 0.35, 0, 0.4, 12, 0, 0.12, 0.7, 0.1, 0.3, 0];
// A boss's seam splits open (snip now!): a bright rising two-tone chirp.
export const seamOpen = [0.45, 0, 880, 0, 0.06, 0.12, 0, 1.5, 12, 0, 440, 0.05, 0, 0, 0, 0, 0, 0.6, 0.02];
// The Brute King winds up for a charge (get ready!): a low rising growl with a heavy tremolo.
export const kingWindup = [0.7, 0.05, 55, 0.25, 0.7, 0.2, 3, 1.5, 1.5, 0, 0, 0, 0, 0.6, 0, 0, 0, 0.8, 0.2, 0.6, -600];
// The Brute King's armor drops after a charge: a metallic clatter falling in pitch.
export const armorOff = [0.55, 0.05, 900, 0, 0.03, 0.25, 1, 1, -18, 0, 0, 0, 0.04, 0.5, 30, 0, 0, 0.5, 0.03];
// Its thimble helmet hits the ground: a tinny clunk that bounces once (repeat).
export const helmetLand = [0.5, 0.1, 620, 0, 0.01, 0.14, 1, 1, 0, 0, 0, 0, 0.07, 0.3, 20, 0, 0, 0.4, 0.02];
// ...and goes back on: a short clink rising into place.
export const helmetOn = [0.45, 0.02, 700, 0, 0.02, 0.12, 1, 1, 12, 0, 300, 0.04, 0, 0, 20, 0, 0, 0.5, 0.02];
// Critter squish (silverfish): a wet crunch: a short noisy crack, low-passed, sagging in pitch with a squelchy wobble.
export const squish = [0.9, 0.1, 220, 0, 0.03, 0.14, 4, 2.4, -14, 0, 0, 0, 0, 3.5, 18, 0.2, 0, 0.5, 0.04, 0.3, -1400];
// A silverfish skitters away from opening blades: a tiny dry tick-tick (repeating noisy blip, high-passed).
export const skitter = [0.25, 0.2, 2600, 0, 0.02, 0.05, 4, 1, 0, 0, 0, 0, 0.025, 6, 0, 0, 0, 0.4, 0.01, 0, 2000];
// --- the five worlds (docs/worlds.md) ---
// A snip in a Burr's spikes (tip half of the blades): a dull prickly poke, nothing like a cut.
export const spikes = [0.45, 0.1, 500, 0, 0.01, 0.08, 4, 1, -20, 0, 0, 0, 0, 5, 0, 0, 0, 0.5, 0.02, 0, -2500];
// An autumn gust blows across the road: a low-passed noise whoosh swelling up and away.
export const gust = [0.5, 0.1, 300, 0.25, 0.4, 0.5, 4, 1, 2, 0, 0, 0, 0, 8, 0, 0, 0, 0.6, 0.1, 0.3, -900];
// A Moth takes off: soft papery wing flaps (a repeating noisy blip, high-passed, quiet).
export const flutter = [0.2, 0.2, 900, 0, 0.12, 0.05, 4, 1, 0, 0, 0, 0, 0.03, 4, 0, 0, 0, 0.3, 0.02, 0, 1200];
// The Bobbin spools off a Scrap: a soft rising pop.
export const spool = [0.35, 0.05, 520, 0, 0.02, 0.08, 0, 1.5, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.02];
// Something sticks to (or shakes loose from) the Honey Dipper: a low squelch.
export const stick = [0.5, 0.1, 160, 0, 0.04, 0.12, 0, 2, -8, 0, 0, 0, 0, 1.5, 20, 0, 0, 0.6, 0.04, 0.4, -1200];
// The Twine Ball wraps an enemy up: a quick falling whip of string.
export const wrap = [0.4, 0.1, 700, 0, 0.08, 0.1, 2, 1, -30, 0, 0, 0, 0.02, 2, 0, 0, 0, 0.5, 0.02, 0, 800];
// A small metallic tick: the Bottle Cap bouncing off the road's edge, a helmetless boss shaking off its daze.
export const clink = [0.35, 0.1, 1800, 0, 0.01, 0.1, 1, 1, 0, 0, 0, 0, 0, 0, 30, 0, 0, 0.4, 0.01];
// The Bottle Cap starts a roll: a tinny rattle running on.
export const capRoll = [0.35, 0.1, 400, 0, 0.6, 0.2, 4, 1, 0, 0, 0, 0, 0.05, 3, 0, 0, 0, 0.5, 0.05, 0.6, -1600];
// The Skeleton Key turns (its teeth open, the Moths come): a two-step lock click.
export const keyClick = [0.6, 0.02, 1500, 0, 0.005, 0.05, 1, 1, 0, 0, -600, 0.08, 0.12, 0.5, 0, 0, 0, 0.4, 0.01];
// The Snow Globe shakes (snip now; the Pins are snowed under): a sloshing glassy shimmer.
export const globeShake = [0.45, 0.1, 1200, 0.05, 0.9, 0.4, 0, 1, 0, 0, 0, 0, 0.07, 0.3, 8, 0, 0.08, 0.5, 0.05, 0.6, 2000];
// Mini boss and new boss roars (the mini bosses' as they walk on, the bosses' on their intro card).
// The Bobbin: a whirring spin-up (saw, pitch sliding up, a fast flutter).
export const roarBobbin = [0.8, 0.03, 120, 0.05, 0.6, 0.4, 2, 1, 5, 0, 0, 0, 0.04, 0.5, 0, 0, 0, 0.7, 0.08, 0.5, 0];
// The Zipper: a rising zzzip (buzzy saw, steep slide, a little crushed).
export const roarZipper = [0.8, 0.05, 200, 0.02, 0.5, 0.25, 2, 1, 12, 0, 0, 0, 0.015, 1, 0, 0.1, 0, 0.7, 0.05, 0, 0];
// The Honey Dipper: a gloopy low warble with an echo.
export const roarDipper = [0.85, 0.03, 90, 0.08, 0.6, 0.5, 0, 1.5, -1, 0, 0, 0, 0, 0.5, 6, 0, 0.1, 0.8, 0.1, 0.4, -800];
// The Bottle Cap: a tinny clattering rattle.
export const roarCap = [0.8, 0.05, 600, 0, 0.4, 0.4, 1, 1, -4, 0, 0, 0, 0.05, 1, 25, 0, 0, 0.5, 0.05, 0.4];
// The Snow Globe: a glassy chime that drops an interval, echoing.
export const roarGlobe = [0.75, 0.02, 1046, 0.02, 0.6, 0.8, 0, 1, 0, 0, 262, 0.15, 0, 0, 3, 0, 0.15, 0.6, 0.1, 0.4];
// The Twine Ball: a deep rolling rumble (low tan wave, heavy tremolo, low-passed).
export const roarTwine = [1, 0.03, 60, 0.1, 0.8, 0.6, 3, 2, -0.5, 0, 0, 0, 0, 1.2, 0, 0.05, 0, 0.8, 0.1, 0.7, -500];
// The Skeleton Key: an iron groan that creaks in steps (repeat), like a lock forced round.
export const roarKey = [0.9, 0.03, 140, 0.05, 0.7, 0.6, 2, 2, -1.5, 0, 0, 0, 0.09, 1, 0, 0.1, 0.1, 0.7, 0.1, 0.3, -1200];
// --- the Skills (the second move slot, game.js "Skills") ---
// Tailor's Focus: the world slows: a soft descending whoom (sine sliding down, long release, an echo).
export const focusIn = [0.6, 0, 620, 0.04, 0.25, 0.7, 0, 1, -3, 0, 0, 0, 0, 0, 0, 0, 0.15, 0.6, 0.1, 0.2, -1800];
// Thimble Guard: the brass cap goes on, and stops an enemy: a bright metal clink with a ring (higher than the armor clang).
export const thimble = [0.55, 0.03, 2300, 0, 0.01, 0.3, 1, 1, 0, 0, 0, 0, 0, 0, 60, 0, 0, 0.5, 0.02, 0.1];
// Seam Mark: tailor's chalk across felt: a short dry scratch (noisy, high-passed, a quick repeat).
export const chalk = [0.4, 0.2, 1600, 0, 0.06, 0.04, 4, 1, 0, 0, 0, 0, 0.03, 12, 0, 0, 0, 0.4, 0.02, 0, 2500];
// Pinking Cut: a long zigzag rip (filtered noise chopped by a fast repeat).
export const pinking = [0.6, 0.1, 500, 0, 0.18, 0.12, 4, 1, 0, 0, 0, 0, 0.035, 10, 0, 0, 0, 0.6, 0.04, 0, -2500];
// Basting Stitch: a needle running through cloth: quick falling ticks.
export const basting = [0.4, 0.05, 900, 0, 0.12, 0.05, 0, 1.5, -20, 0, 0, 0, 0.04, 1, 0, 0, 0, 0.5, 0.02];
