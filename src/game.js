// Game state + update(dt): state machine (TITLE -> SELECT | SETTINGS, SELECT -> [TUTORIAL] -> PLAYING -> WAVE_CLEAR -> ... -> GAME_OVER),
// waves along a fixed path, the workshop, thread economy, towers, the Helicopter special, onboarding, scoring, pooled
// entities (plain data), snip resolution, blade contact, run reports. No canvas calls here: render.js draws `state`.
// Title / select / settings / game-over / coach screens are HTML in index.html; this module only shows, hides and fills them.
import { CONFIG as C } from './config.js';
import { view, TAU, DEG, clamp, segDistSq } from './core.js';
import { input, updateInput, resetSnipBuffer, holdTouch } from './input.js';
import { weapon, scaleFor, setWeapon, bladeReachPx, spinReachPx, isSlide, cut, setCutZone, cutZoneHits } from './scissors.js';
import { tween, tweens, makeTweens, easing } from './tween.js';
import { makeRng } from '../vendor/mulberry32.js';
import { sfx, sfxSnip, sfxSequence } from './audio.js';
import { saveRun } from './runlog.js';
import { KNOB_KEYS } from './debug.js';

// ======================= state =======================
// mode: 'TITLE' | 'SELECT' | 'SETTINGS' | 'TUTORIAL' | 'PLAYING' | 'WAVE_CLEAR' | 'GAME_OVER'. modeT = seconds in the current mode
// (wave clock while PLAYING). fx = effect timers/amplitudes read by the renderer. Entity pools hold plain objects
// with an `on` flag. events = a small ring of one-off happenings for the renderer (thread pickups, placements).
export const state = {
  mode: 'TITLE', modeT: 0, wave: 0, hp: 0, score: 0, won: false, seed: 0, thread: 0, paused: false, pauseCard: 'menu',
  bannerT: 0, workshopHitT: 0, clock: 0,
  stats: { snips: 0, kills: 0 },
  // flash = snip flash on the blades, tooSlow = "too slow" wobble, cut = cut-zone ghost, kick = snip world punch,
  // space = Space-key snap pulse, ring = pivot shock ring (at ringX/ringY), camShake = kill screen shake (px),
  // hitStop = seconds of world freeze left
  fx: { flash: 0, tooSlow: 0, cut: 0, kick: 0, space: 0, ring: 0, ringX: 0, ringY: 0, camShake: 0, hitStop: 0 },
  path: { x: new Float32Array(0), y: new Float32Array(0), cum: new Float32Array(0), n: 0, len: 1 },
  enemies: [], frags: [], parts: [], labels: [], nums: [], pops: [],
  towers: [],                // one per CONFIG.level.spots entry (towers[i] stands on spot i when on)
  // Helicopter: charge = snip kills banked; phase '' | 'open' | 'spin' | 'close'; spread/rot drive the blades while active
  heli: { charge: 0, active: false, phase: '', spread: 0, rot: 0, theta0: 0, tick: 0, bannerT: 0 },
  tut: { step: 0, t: 0, theta0: 0, ver0: 0, nagT: 0 },
  run: { t0: 0, multiSnips: 0, towers: {}, specials: 0, leaks: 0 },
  events: { seq: 0, list: [] },
};
const fx = state.fx, heli = state.heli, tut = state.tut;
export const live = () => state.mode === 'PLAYING' || state.mode === 'WAVE_CLEAR' || state.mode === 'TUTORIAL';
export const accuracyText = () => state.stats.snips ? Math.round(state.stats.kills / state.stats.snips * 100) + '%' : '—';

// one-off events for the renderer: kind 'thread' (+n pickup at x,y), 'place' (tower built)
for (let i = 0; i < 32; i++) state.events.list.push({ seq: -1, kind: '', x: 0, y: 0, n: 0 });
function emit(kind, x, y, n) {
  const ev = state.events.list[state.events.seq % state.events.list.length];
  ev.seq = state.events.seq++; ev.kind = kind; ev.x = x; ev.y = y; ev.n = n;
}

// Real-time tweens (screen shake, hit-stop itself) keep running through hit-stop; the world group (`tweens`) doesn't.
const rtTweens = makeTweens();

// ======================= seeded randomness =======================
// Gameplay randomness comes from mulberry32 streams seeded by state.seed (Date.now() per run, or ?seed=N in the URL):
// spawn = enemy variation, hit = shove chance, fx = fragment bursts. Separate streams keep spawns independent of how
// many hits or kills happened. Purely visual sparkle (particles) still uses Math.random.
const urlSeed = (() => { const s = new URLSearchParams(location.search).get('seed'); return s !== null && /^\d+$/.test(s) ? Number(s) : null; })();
export const rng = { spawn: makeRng(0), hit: makeRng(1), fx: makeRng(2) };
function seedRun(seed) {
  state.seed = seed;
  rng.spawn = makeRng(seed); rng.hit = makeRng(seed ^ 0x9E3779B9); rng.fx = makeRng(seed ^ 0x85EBCA6B);
}

const els = {
  title: document.getElementById('title'), select: document.getElementById('select'), settings: document.getElementById('settings'), over: document.getElementById('over'),
  reset: document.getElementById('reset'), tray: document.getElementById('tray'), coach: document.getElementById('coach'),
  coachText: document.getElementById('coach-text'), mute: document.getElementById('mute'), pauseBtn: document.getElementById('pause'),
  pause: document.getElementById('pause-screen'), pinsIntro: document.getElementById('pins-intro'), pauseWave: document.getElementById('pause-wave'), pauseScore: document.getElementById('pause-score'),
  pauseAcc: document.getElementById('pause-acc'), pauseSeed: document.getElementById('pause-seed'),
  overTitle: document.getElementById('over-title'), overScore: document.getElementById('over-score'),
  overWaves: document.getElementById('over-waves'), overAcc: document.getElementById('over-acc'), overSeed: document.getElementById('over-seed'),
};
function showScreens() {
  const m = state.mode;
  els.title.hidden = m !== 'TITLE';
  els.select.hidden = m !== 'SELECT';
  els.settings.hidden = m !== 'SETTINGS';
  els.over.hidden = m !== 'GAME_OVER';
  els.reset.hidden = els.mute.hidden = m !== 'GAME_OVER';        // mid-run they're on the pause card, out of the way

  els.pauseBtn.hidden = !live();
  els.pause.hidden = !state.paused || state.pauseCard !== 'menu';
  els.pinsIntro.hidden = !state.paused || state.pauseCard !== 'pins';
  els.tray.hidden = state.paused || (m !== 'PLAYING' && m !== 'WAVE_CLEAR');
  els.coach.hidden = state.paused || m !== 'TUTORIAL';
}

// ======================= layout (weapon scale + level) =======================
// Called on resize (after view.W/H are set) and on weapon change.
export function layout() { applyWeaponScale(); placeLevel(); buildPath(); placeSpots(); }
function applyWeaponScale() { view.S = scaleFor(weapon.def); }

// Switch weapons: size it for this screen (the caller then re-rasterizes its art).
export function selectWeapon(id) { setWeapon(id); applyWeaponScale(); }

// The plate is drawn full height, centred: level units -> screen px.
function placeLevel() { view.L = view.H / C.level.h; view.LX = (view.W - C.level.w * view.L) / 2; }
export const levelX = x => view.LX + x * view.L, levelY = y => y * view.L;

// C.level.path (level units) -> Catmull-Rom polyline in px, rebuilt on resize. Enemies store progress u (0..1).
function buildPath() {
  const P = C.level.path, n = P.length, steps = C.pathSmoothSteps, L = view.L, LX = view.LX, path = state.path;
  const N = (n - 1) * steps + 1, X = new Float32Array(N), Y = new Float32Array(N), cum = new Float32Array(N);
  let k = 0;
  for (let i = 0; i < n - 1; i++) {
    const p0 = P[Math.max(i - 1, 0)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(i + 2, n - 1)];
    for (let s = 0; s < steps; s++, k++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      X[k] = LX + L * 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      Y[k] = L * 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
    }
  }
  X[k] = levelX(P[n - 1][0]); Y[k] = levelY(P[n - 1][1]);
  for (let i = 1; i < N; i++) cum[i] = cum[i - 1] + Math.hypot(X[i] - X[i - 1], Y[i] - Y[i - 1]);
  path.x = X; path.y = Y; path.cum = cum; path.n = N; path.len = Math.max(1, cum[N - 1]);
  for (const e of enemies) if (e.on && !e.pinned) { e.seg = 0; pathPoint(e); e.x = e.px + e.ox; e.y = e.py + e.oy; }
}
// Each tower sits on its spot; fx/fy = the nearest road point and fu = its road progress (where a Magnet Pin clumps
// enemies).
function placeSpots() {
  const { x: X, y: Y, cum, n, len } = state.path;
  C.level.spots.forEach(([sx, sy], i) => {
    const t = towers[i]; if (!t) return;
    t.x = levelX(sx); t.y = levelY(sy);
    let best = Infinity;
    for (let k = 0; k < n; k++) { const d = (X[k] - t.x) ** 2 + (Y[k] - t.y) ** 2; if (d < best) { best = d; t.fx = X[k]; t.fy = Y[k]; t.fu = cum[k] / len; } }
  });
}
// Sets e.px/e.py to the road point at progress e.u; e.seg is a search hint (the boss walks backwards too).
function pathPoint(e) {
  const { x: pathX, y: pathY, cum: pathCum, n: pathN } = state.path, d = e.u * state.path.len;
  let s = e.seg;
  while (s > 0 && pathCum[s] > d) s--;
  while (s < pathN - 2 && pathCum[s + 1] < d) s++;
  e.seg = s;
  const segLen = pathCum[s + 1] - pathCum[s], t = segLen > 0 ? clamp((d - pathCum[s]) / segLen, 0, 1) : 0;
  e.px = pathX[s] + (pathX[s + 1] - pathX[s]) * t;
  e.py = pathY[s] + (pathY[s + 1] - pathY[s]) * t;
}

// ======================= flow =======================
function clearWorld() {
  for (const e of enemies) e.on = false;
  for (const f of frags) f.on = false;
  for (const p of parts) p.on = false;
  for (const l of labels) l.on = false;
  for (const n of nums) n.on = false;
  for (const p of pops) p.on = false;
  for (const t of towers) t.on = false;
  tweens.clear(); rtTweens.clear();
  const last = input.last;
  last.ms = -1; last.kind = ''; last.ver++;
  fx.cut = fx.flash = fx.tooSlow = fx.kick = fx.ring = fx.space = fx.hitStop = fx.camShake = 0; state.bannerT = state.workshopHitT = 0;
  heli.active = false; heli.phase = ''; heli.spread = heli.rot = 0; heli.bannerT = 0;
  state.paused = false;
  resetSnipBuffer();
}

export function goTitle() { clearWorld(); state.mode = 'TITLE'; showScreens(); }
export function goSelect() { clearWorld(); state.mode = 'SELECT'; showScreens(); }
export function goSettings() { clearWorld(); state.mode = 'SETTINGS'; showScreens(); }

const ONBOARDED_KEY = 'battleScissors.onboarded';
function onboarded() { try { return localStorage.getItem(ONBOARDED_KEY) === '1'; } catch (e) { return true; } }

// Start a run. The coach (onboarding) runs first on the very first play, or when asked (title's "How to play").
export function startGame(opts = {}) {
  clearWorld();
  seedRun(urlSeed !== null ? urlSeed : Date.now());
  resetRun();
  if (opts.tutorial || !onboarded()) { state.mode = 'TUTORIAL'; state.wave = 0; tutEnter(0); showScreens(); return; }
  beginWave(1);
  showScreens();
}
function resetRun() {
  state.score = 0; state.hp = C.workshopHp; state.won = false; state.stats.snips = 0; state.stats.kills = 0; state.thread = C.startThread;
  heli.charge = 0;
  const r = state.run; r.t0 = Date.now(); r.multiSnips = 0; r.specials = 0; r.leaks = 0;
  for (const k in C.towers) r.towers[k] = 0;
}

// Wave schedule from CONFIG.waves: each [type, count, atSec] entry spawns `count` of `type` from atSec, gapMs apart.
let spawnList = [], spawnIdx = 0;                             // [[timeSec, typeName], ...] sorted by time
const anyEnemyOn = () => { for (let i = 0; i < enemies.length; i++) if (enemies[i].on) return true; return false; };
function beginWave(n) {
  spawnList = [];
  for (const [name, count, atSec] of C.waves[n - 1]) {
    const t = C.enemyTypes[name];
    if (!t) { console.warn('CONFIG.waves: unknown enemy type', name); continue; }
    for (let i = 0; i < count; i++) spawnList.push([atSec + i * t.gapMs / 1000, name]);
  }
  spawnList.sort((a, b) => a[0] - b[0]);
  spawnIdx = 0;
  state.wave = n; state.mode = 'PLAYING'; state.modeT = 0; state.bannerT = 1;
}

export let lastReport = null;
function endGame(won) {
  state.paused = false;
  state.mode = 'GAME_OVER'; state.won = won;
  els.overTitle.textContent = won ? 'DRAWER DEFENDED!' : 'WORKSHOP OVERRUN';
  els.overTitle.dataset.text = els.overTitle.textContent;       // the felt heading's outline layer (index.html .card h2)
  els.overTitle.classList.toggle('win', won); els.overTitle.classList.toggle('lose', !won);
  els.overScore.textContent = String(state.score);
  els.overWaves.textContent = (won ? C.waves.length : state.wave - 1) + ' / ' + C.waves.length;
  els.overAcc.textContent = accuracyText();
  els.overSeed.textContent = String(state.seed);
  if (!won) sfxSequence('gameOver');
  lastReport = buildReport();
  saveRun(lastReport);
  showScreens();
}

// Compact playtest report for the "Copy run report" button (also kept in localStorage). inProgress = taken from the
// pause screen mid-run (not saved).
function buildReport(inProgress = false) {
  const s = state.stats, r = state.run, cfg = {};
  for (const k of KNOB_KEYS) cfg[k] = C[k];
  return {
    seed: state.seed, weapon: weapon.id, won: state.won, wavesReached: state.wave, score: state.score,
    snips: s.snips, kills: s.kills, accuracy: s.snips ? +(s.kills / s.snips).toFixed(3) : 0, multiSnips: r.multiSnips,
    towers: { ...r.towers }, specialUses: r.specials, deathsAtWorkshop: r.leaks,
    durationSec: Math.round((Date.now() - r.t0) / 1000), device: navigator.userAgent, config: cfg,
    replay: location.origin + location.pathname + '?seed=' + state.seed, endedAt: new Date().toISOString(),
    ...(inProgress ? { inProgress: true } : {}),
  };
}

// ======================= pause =======================
// Freezes the whole game (update() returns before input, timers and tweens). Paused time doesn't count toward the run
// duration. Resuming re-arms snip detection so finger movement during the pause can't fire a snip.
// card = which card the pause shows: 'menu' (RESUME + run report) or 'pins' (the one-time Pin placement explainer).
let pausedAt = 0;
export function setPaused(p, card = 'menu') {
  if (p === state.paused || (p && !live())) return;
  state.paused = p;
  if (p) state.pauseCard = card;
  if (p) {
    pausedAt = Date.now();
    els.pauseWave.textContent = state.mode === 'TUTORIAL' ? 'Tutorial' : state.wave + ' / ' + C.waves.length;
    els.pauseScore.textContent = String(state.score);
    els.pauseAcc.textContent = accuracyText();
    els.pauseSeed.textContent = String(state.seed);
  } else {
    state.run.t0 += Date.now() - pausedAt;
    resetSnipBuffer();
  }
  showScreens();
}
export const togglePause = () => setPaused(!state.paused);
export const reportNow = () => buildReport(true);

// ======================= onboarding (coach) =======================
const COACH = ['Put two fingers on the screen.', 'Spread them.', 'Now PINCH FAST.', 'Slow closes do nothing. Try one.', 'Rotate your hand to aim.', 'Go.'];
// desktop wording (mouse + wheel): hold opens, release snaps shut, so the slow close uses the wheel
const COACH_DESK = ['Move the mouse over the table.', 'Hold the left button to open.', 'Now release to SNIP.',
  'Slow closes do nothing. Scroll up to open, then scroll down slowly.', 'Press A or D to aim.', 'Go.'];
// 'hold' touch wording: hold opens, lift snaps shut; there is no slow close or rotation, so steps 3 and 4 are skipped
const COACH_HOLD = ['Put a finger on the screen.', 'Hold it down: the blades open.', 'Now LIFT to SNIP.', '', '', 'Go.'];
const touchy = () => input.usingTouch || (input.touchCapable && !input.mouse.used);
const holdTut = () => touchy() && holdTouch();
const coachFor = step => (holdTut() ? COACH_HOLD : touchy() ? COACH : COACH_DESK)[step];
// the step after this one ('hold' touch jumps from the practice Scraps straight to Go.)
const nextStep = step => step === 2 && holdTut() ? 5 : step + 1;
function tutEnter(step) {
  tut.step = step; tut.t = 0;
  els.coachText.textContent = coachFor(step);
  if (step === 2) {                                             // three stationary Scraps inside the current cut zone
    const p = input.pose, a = visBladeAngle(), L = bladeReachPx();
    if (isSlide()) {                                            // a slide weapon's zone is its hole: a small triangle inside it
      const ax = Math.sin(p.theta), ay = -Math.cos(p.theta), r = L * 0.45;
      for (const [u, v] of [[-0.87, 0.5], [0.87, 0.5], [0, -1]]) pinScrap(p.x + (ay * -u + ax * v) * r, p.y + (ax * u + ay * v) * r);
    } else {
      const spots = [[-0.45, 0.55], [0, 0.72], [0.45, 0.55]];
      for (const [k, d] of spots) {
        const ang = p.theta + k * a;
        pinScrap(p.x + Math.sin(ang) * L * d, p.y - Math.cos(ang) * L * d);
      }
    }
  }
  if (step === 3) { tut.ver0 = input.last.ver; tut.nagT = 0; }
  if (step === 4) tut.theta0 = input.pose.theta;
}
function pinScrap(x, y) {
  const e = spawnEnemy('scrap'); if (!e) return;
  e.pinned = true; e.x = e.px = x; e.y = e.py = y;
}
function tutUpdate(dt) {
  tut.t += dt;
  if (!(tut.nagT > 0) && els.coachText.textContent !== coachFor(tut.step)) els.coachText.textContent = coachFor(tut.step);
  switch (tut.step) {
    case 0: if (input.gripping) tutEnter(1); break;
    case 1: if (input.rawSpread > C.tutSpreadFrac) tutEnter(2); break;
    case 2: { let left = 0; for (const e of enemies) if (e.on && e.pinned) left++; if (!left) tutEnter(nextStep(2)); break; }
    case 3:
      if (input.last.ver !== tut.ver0) {
        if (input.last.kind === 'too slow') { tutEnter(4); break; }
        tut.ver0 = input.last.ver; tut.nagT = C.tutNagMs / 1000;          // closed too fast: nudge, then restore the prompt
        els.coachText.textContent = 'Too fast! Take about two seconds to close.';
      }
      if (tut.nagT > 0 && (tut.nagT -= dt) <= 0) els.coachText.textContent = coachFor(3);
      break;
    case 4: { let d = (input.pose.theta - tut.theta0) % TAU; if (d > Math.PI) d -= TAU; else if (d < -Math.PI) d += TAU;
      if (Math.abs(d) > C.tutRotateDeg * DEG) tutEnter(5); break; }
    case 5: if (tut.t * 1000 >= C.tutGoMs) finishTutorial(); break;
  }
}
export function tutSkip() {
  if (state.mode !== 'TUTORIAL') return;
  if (tut.step === 2) for (const e of enemies) if (e.on && e.pinned) e.on = false;
  const next = nextStep(tut.step);
  if (next >= 5) finishTutorial(); else tutEnter(next);
}
export function tutSkipAll() { if (state.mode === 'TUTORIAL') finishTutorial(); }
function finishTutorial() {
  try { localStorage.setItem(ONBOARDED_KEY, '1'); } catch (e) { /* storage blocked */ }
  clearWorld();
  seedRun(state.seed);                                          // the practice Scraps used the spawn stream: restart it
  resetRun();
  beginWave(1);
  showScreens();
}

// ======================= kill impact (tweens) =======================
// Hit-stop: fx.hitStop counts the freeze down in real time; a new kill extends it to the longer of the two.
function startHitStop(sec) {
  const rem = Math.max(fx.hitStop, sec);
  rtTweens.cancel('hitstop');
  fx.hitStop = rem;
  rtTweens.add(fx, HITSTOP_END, rem * 1000, easing.linear, null, 'hitstop');
}
const HITSTOP_END = { hitStop: 0 };
// Screen shake: amplitude a0 decays as a0 * e^(-3t / killShakeMs) and snaps to 0 once below 0.05px. Kills stack
// onto whatever shake is left, up to `cap`.
function addShake(px, cap = C.killShakeMaxPx) {
  const a0 = Math.min(cap, fx.camShake + px);
  rtTweens.cancel('shake');
  fx.camShake = a0;
  if (a0 <= 0.05) { fx.camShake = 0; return; }
  const L = Math.log(a0 / 0.05);                                 // e-folds until the 0.05px cutoff
  rtTweens.add(fx, SHAKE_END, C.killShakeMs * L / 3, p => 1 - Math.exp(-L * p), null, 'shake');
}
const SHAKE_END = { camShake: 0 };

// ======================= snips =======================
// Hooked to input's snip detector. (px, py, theta, spread) = pose at the widest point of the close.
let snipMulti = false;                                        // current snip had >= multiSnipMin enemies in its zone
function doSnip(px, py, theta, spread, strong) {
  if (!live() || heli.active) return;                          // the Helicopter owns the blades while it spins
  setCutZone(px, py, theta, spread);
  // wider opening = more closing power
  const power = C.powerAtMinOpen + (1 - C.powerAtMinOpen) * clamp((spread - C.snipOpenFrom) / (1 - C.snipOpenFrom), 0, 1);
  input.last.power = power;
  fx.cut = 1; fx.flash = (strong ? 1 : 0.5) * (0.5 + 0.5 * power); fx.kick = (strong ? 1 : 0.4) * power;
  state.stats.snips++;
  if (input.usingTouch && navigator.vibrate) { try { navigator.vibrate(strong ? C.hapticMs : C.weakHapticMs); } catch (e) { /* ignore */ } }
  burst(input.pose.x, input.pose.y, strong);
  spawnLabel(input.pose.x, input.pose.y, strong ? LABEL_SNIP : LABEL_NICK);
  const ax = Math.sin(theta), ay = -Math.cos(theta), pad = C.hitPadPx;
  let inZone = 0;
  for (let i = 0; i < enemies.length; i++) { const e = enemies[i]; if (e.on && cutZoneHits(e.x, e.y, e.r, pad)) inZone++; }
  snipMulti = inZone >= C.multiSnipMin;
  if (snipMulti) state.run.multiSnips++;
  sfxSnip(snipMulti);
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]; if (!e.on) continue;
    if (cutZoneHits(e.x, e.y, e.r, pad)) strike(e, px, py, ax, ay, cut.L, strong, power);
  }
}

function tooSlow() { if (live() && !heli.active) { fx.tooSlow = 1; sfx('thump'); } }

// Rendered opening, 0 (shut) .. 1 (fully open): includes the Space-key snap-shut pulse and the Helicopter's forced spread.
export function visOpen() {
  let sp = heli.active ? heli.spread : input.pose.spread;
  if (!heli.active && fx.space > 0) sp *= fx.space > 0.5 ? 0 : 1 - fx.space * 2;
  return sp;
}
// ...as a blade angle in radians (0 for a slide weapon).
export const visBladeAngle = () => visOpen() * weapon.def.maxOpenDeg * DEG;
// Rendered aim: the player's hand, or the Helicopter's spin while it runs.
export function bladeTheta() { return heli.active ? heli.theta0 + heli.rot : input.pose.theta; }

// Closing blades push: while the visible blades are closing, each blade (a tapered capsule from pivot to tip)
// shoves any ball in front of its cutting edge out of the way (and a little toward the tips). A ball the blade
// jumped past this frame is caught too. Opening, idle, or just moving the scissors: blades pass through.
let prevBladeA = -1;
function onGrip() { prevBladeA = -1; }
function bladeContacts(dt) {
  const a = visBladeAngle(), aPrev = prevBladeA, pose = input.pose, S = view.S, theta = bladeTheta();
  prevBladeA = a;
  if (aPrev < 0 || input.scAlpha < 0.5 || S <= 0 || isSlide()) return;   // slide weapons have no swinging edge to shove with
  if ((aPrev - a) / (weapon.def.maxOpenDeg * DEG) / dt < C.contactMinCloseSpeed) return;
  const len = bladeReachPx(), w0 = C.bladeHalfWidthBase * len, w1 = C.bladeHalfWidthTip * len;
  const ax = Math.sin(theta), ay = -Math.cos(theta);
  for (let b = 0; b < 2; b++) {
    const sgn = b === 0 ? -1 : 1;
    const ang = theta + sgn * a, dx = Math.sin(ang), dy = -Math.cos(ang);
    const cdx = b === 0 ? -dy : dy, cdy = b === 0 ? dx : -dx;   // the way this blade's edge moves as it closes
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i]; if (!e.on || e.pinned || e.type.pushScale <= 0) continue;   // immovable (boss): blades pass through
      const rx = e.x - pose.x, ry = e.y - pose.y;
      const along = rx * dx + ry * dy, across = rx * cdx + ry * cdy;   // across > 0: in front of the edge
      const t = clamp(along / len, 0, 1), reach = e.r + w0 + (w1 - w0) * t;
      if (along < -reach || along > len + reach) continue;
      let nx, ny, shift;
      if (across < 0) {
        // behind the edge: only matters if the blade swept past the ball's center this frame
        const psi = Math.atan2(ax * ry - ay * rx, ax * rx + ay * ry) * sgn;   // angle out from center, on this side
        if (psi > aPrev) continue;
        nx = cdx; ny = cdy; shift = reach - across;
      } else {
        nx = rx - dx * len * t; ny = ry - dy * len * t;
        const dist = Math.hypot(nx, ny);
        if (dist >= reach) continue;
        if (dist > 0.001) { nx /= dist; ny /= dist; } else { nx = cdx; ny = cdy; }
        shift = reach - dist;
      }
      e.ox += nx * shift; e.oy += ny * shift; e.x += nx * shift; e.y += ny * shift;   // keep the ball in front of the closing blade
      const push = C.contactPushSpeed * e.type.pushScale, vn = e.pvx * nx + e.pvy * ny;
      if (vn < push) { e.pvx += nx * (push - vn); e.pvy += ny * (push - vn); }
      const vs = e.pvx * dx + e.pvy * dy, slide = push * C.contactSlide;
      if (vs < slide) { e.pvx += dx * (slide - vs); e.pvy += dy * (slide - vs); }
      keepOnRoad(e); e.x = e.px + e.ox; e.y = e.py + e.oy;       // at the road's edge the blade slides past instead
    }
  }
}

// A snip landing on an enemy. Damage is graded: most at the pivot, least at the tips, scaled by how wide the close
// began (power) and halved for a nick. Shoves grow toward the tips, along the closing edge.
// Armored (Brute): the first snip clangs for 0 unless e.slowed. Boss: x seamMult if the closed-blade line crosses the
// glowing seam, else x offSeamMult; never shoved.
function strike(e, px, py, ax, ay, L, strong, power) {
  const t = e.type;
  const rx = e.x - px, ry = e.y - py, d = Math.hypot(rx, ry) || 1;
  const g = Math.pow(clamp(d / L, 0, 1), C.gradeCurve);
  if (e.armored) {
    e.armored = false;                                           // armor is spent either way
    if (!e.slowed) { clang(e); return; }
  }
  let dmg = (C.damageAtPivot + (C.damageAtTip - C.damageAtPivot) * g) * power * weapon.def.damageMult, numG = g;
  if (!strong) dmg *= C.weakDamageMult;
  if (t.boss) {
    // the closed-blade line: pivot to tip, or for a slide weapon the line where its blades meet, across the hole
    const onSeam = cut.slide ? seamHit(e, px - ax * L, py - ay * L, ax, ay, 2 * L) : seamHit(e, px, py, ax, ay, L);
    dmg *= onSeam ? C.seamMult : C.offSeamMult;
    if (onSeam) { numG = 0; sparks(e.x + Math.cos(e.seamA) * e.r, e.y + Math.sin(e.seamA) * e.r, 14, 3); }
  }
  let push = C.pushSpeed * g * power * t.pushScale;
  if (!strong) push *= C.weakPushMult;
  e.hp -= dmg;
  if (e.hp <= 0.001) { killEnemy(e); return; }
  sfx('rip');
  spawnNumber(e.x, e.y - e.r, dmg, numG);
  e.hitT = Math.min(1, 0.35 + dmg * 0.4);
  sparks(e.x, e.y, 3 + Math.round(7 * (1 - g)), 1);
  if (push > 0 && !e.pinned && rng.hit() < C.pushChanceAtPivot + (C.pushChanceAtTip - C.pushChanceAtPivot) * g) {
    // right of the aim line: right blade closes counter-clockwise; left: left blade closes clockwise
    const side = ax * ry - ay * rx;
    const tx = side > 0 ? ry / d : -ry / d, ty = side > 0 ? -rx / d : rx / d;
    e.pvx += tx * push; e.pvy += ty * push;
  }
}

function killEnemy(e, bySnip = true) {
  e.on = false; tweens.cancel(e); e.pulling = false;           // stop any magnet pull mid-flight
  shatter(e); awardKill(e, bySnip);                              // no kill sound: the snip (or SHRED's whir) already made one
}

// Fire Pin burn tick: dmg to e, ignoring armor. Returns true if it killed e.
function burn(e, dmg) {
  e.hp -= dmg;
  sparks(e.x, e.y - e.r * 0.4, 4, 4);
  if (e.hp <= 0.001) { snipMulti = false; killEnemy(e, false); return true; }
  spawnNumber(e.x, e.y - e.r, dmg, -1);
  e.hitT = Math.max(e.hitT, 0.25);
  return false;
}

// bySnip = false (a burn kill): score and thread as usual, but no SHRED charge (that comes from snips).
function awardKill(e, bySnip = true) {
  const t = e.type;
  state.stats.kills++;
  const pts = Math.round(t.score * (snipMulti ? C.multiSnipMult : 1));
  state.score += pts;
  spawnPopup(e.x, e.y, pts, snipMulti);
  if (state.mode !== 'TUTORIAL') {
    state.thread += C.threadPerKill; emit('thread', e.x, e.y, C.threadPerKill);
    if (bySnip && !heli.active) heli.charge = Math.min(C.heliKillsToCharge, heli.charge + 1);
  }
  if (t.boss || t.tier >= 2) startHitStop((t.boss ? C.bossHitStopMs : C.hitStopMs) / 1000);
  addShake(e.r * C.killShakePerR);
}

// On-seam = the closed-blade line (pivot along the aim, length L) passes within seamHitTolPx of the glowing seam arc.
function seamHit(e, px, py, ax, ay, L) {
  const half = C.seamArcDeg * DEG, tol2 = C.seamHitTolPx * C.seamHitTolPx, ex = px + ax * L, ey = py + ay * L;
  for (let k = -2; k <= 2; k++) {
    const a = e.seamA + k / 2 * half;
    if (segDistSq(e.x + Math.cos(a) * e.r, e.y + Math.sin(a) * e.r, px, py, ex, ey) <= tol2) return true;
  }
  return false;
}

// Armor absorbs the snip.
function clang(e) {
  spawnLabel(e.x, e.y - e.r * 0.4, LABEL_CLANG);
  sparks(e.x, e.y - e.r * 0.7, 12, 0);
  e.hitT = 0.5;
  sfx('clang');
  if (input.usingTouch && navigator.vibrate) { try { navigator.vibrate(C.weakHapticMs); } catch (err) { /* ignore */ } }
}

// ======================= special: Helicopter =======================
// Charged by snip kills. Snap fully open (outBack), spin 720° (inOutSine) hitting everything within blade reach every
// heliTickMs, then snap shut into a normal full-open snip. The pivot still follows the hand; spread and aim don't.
const HELI_OPEN = { spread: 1 }, HELI_SHUT = { spread: 0 };
export function trySpecial() {
  if (!live() || state.mode === 'TUTORIAL' || heli.active || heli.charge < C.heliKillsToCharge || !input.gripping || input.scAlpha < 0.5) return;
  heli.charge = 0; heli.active = true; heli.phase = 'open'; heli.spread = input.pose.spread; heli.rot = 0;
  heli.theta0 = input.pose.theta; heli.tick = 0; heli.bannerT = 1; state.run.specials++;
  tween(heli, HELI_OPEN, C.heliOpenMs, easing.outBack, heliSpin, 'heli');
}
function heliSpin() {
  heli.phase = 'spin';
  sfx('heliWhir', 0);
  tween(heli, { rot: TAU * C.heliSpinTurns }, C.heliSpinMs, easing.inOutSine, heliClose, 'heli');
}
function heliClose() { heli.phase = 'close'; tween(heli, HELI_SHUT, C.heliCloseMs, easing.linear, heliDone, 'heli'); }
function heliDone() {
  const theta = heli.theta0 + heli.rot;
  heli.active = false; heli.phase = ''; heli.spread = 0;
  resetSnipBuffer();
  doSnip(input.pose.x, input.pose.y, theta, 1, true);            // the final snap-close is a normal full-open snip
  addShake(C.heliFinalShakePx, C.heliFinalShakePx);
}
// One spin tick: 1 damage to everything within blade reach, ignoring armor; leaves them slowed for a while.
function heliTick() {
  const p = input.pose, reach = spinReachPx();
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]; if (!e.on || Math.hypot(e.x - p.x, e.y - p.y) > reach + e.r) continue;
    e.hp -= C.heliTickDamage; e.slowT = C.heliSlowSec; e.slowed = true;
    snipMulti = false;
    if (e.hp <= 0.001) { killEnemy(e); continue; }
    sfx('rip', 60);
    spawnNumber(e.x, e.y - e.r, C.heliTickDamage, 0.5);
    e.hitT = Math.min(1, 0.35 + C.heliTickDamage * 0.4);
  }
}

// ======================= towers =======================
// One tower per level spot (towers[i] stands on C.level.spots[i]). Plain data: { on, type, x, y (the spot, px),
// fx, fy, fu (nearest road point and its progress), timer (magnet period clock), pulse (1 -> 0 visual after a pull) }.
const towers = state.towers;
for (let i = 0; i < C.level.spots.length; i++) towers.push({ on: false, type: '', x: 0, y: 0, fx: 0, fy: 0, fu: 0, timer: 0, pulse: 0 });
export const canAfford = type => state.thread >= C.towers[type].cost;
export const towerReach = type => C.towers[type].radius * view.L;   // a Pin's radius in px

// Build a `type` Pin on spot i (the action bar's spot picker). Returns '' on success, else why not.
export function buildTower(i, type) {
  const t = towers[i];
  if (state.mode !== 'PLAYING' && state.mode !== 'WAVE_CLEAR') return 'mode';
  if (!t || t.on) return 'taken';
  if (!canAfford(type)) return 'cost';
  t.on = true; t.type = type; t.timer = 0; t.pulse = 0;
  state.thread -= C.towers[type].cost; state.run.towers[type]++;
  sfx('pinPop', 0); emit('place', t.x, t.y, 0);
  return '';
}
// Magnet pull: moves each enemy's place in the line (its road progress u) pullKeep of the way from the Pin's road
// point (inOutSine), so the ones ahead are dragged back and the ones behind hauled forward: a real clump that keeps
// walking together afterwards. Sideways shove offsets shrink by the same factor. The enemy doesn't walk while pulled.
// Tagged by the enemy so a kill cancels it.
function pullDone(e) { e.pulling = false; }
function magnetPull(t) {
  const def = C.towers.magnet, reach = towerReach('magnet'), k = def.pullKeep;
  t.pulse = 1; sfx('magnetHum', 0);
  for (const e of enemies) {
    if (!e.on || e.pinned || e.type.pushScale <= 0 || Math.hypot(e.x - t.x, e.y - t.y) > reach) continue;
    tweens.cancel(e);
    e.pulling = true; e.pvx = e.pvy = 0;
    tween(e, { u: t.fu + (e.u - t.fu) * k, ox: e.ox * k, oy: e.oy * k }, def.pullMs, easing.inOutSine, pullDone, e);
  }
}

// ======================= entity pools (plain data) =======================
const enemies = state.enemies;
// type = CONFIG.enemyTypes entry, name = its key. slowed = in an Ice Pin aura or recently hit by the Helicopter
// (slowT seconds left); lets the first snip through a Brute's armor. burning = on fire from a Fire Pin (burnLeft =
// seconds of burning left once out of its ring, burnT = seconds toward the next burn tick).
// leg = boss turn index, seamA = boss seam angle, age = seconds alive, pulling = a Magnet Pin is moving it (a tween owns u),
// pinned = onboarding target that never moves.
for (let i = 0; i < C.maxEnemies; i++) enemies.push({ on: false, type: null, name: '', x: 0, y: 0, px: 0, py: 0, ox: 0, oy: 0,
  u: 0, seg: 0, speed: 0, r: 0, hp: 0, maxHp: 0, armored: false, slowed: false, slowT: 0, burning: false, burnLeft: 0, burnT: 0, leg: 0, seamA: 0, age: 0,
  pvx: 0, pvy: 0, phase: 0, hitT: 0, pulling: false, pinned: false });

// Returns the enemy, or null if the pool is full (the schedule retries next frame).
function spawnEnemy(name) {
  let e = null;
  for (let i = 0; i < enemies.length; i++) if (!enemies[i].on) { e = enemies[i]; break; }
  if (!e) return null;
  const t = C.enemyTypes[name];
  e.on = true; e.type = t; e.name = name; e.r = t.r; e.hp = e.maxHp = t.hp * (1 + C.hpPerWave * Math.max(0, state.wave - 1));
  e.armored = !!t.armor; e.slowed = false; e.slowT = 0; e.burning = false; e.burnLeft = 0; e.burnT = 0; e.leg = 0; e.seamA = rng.spawn() * TAU; e.age = 0;
  e.speed = 1 / t.traverseSec; e.u = 0; e.seg = 0; e.ox = 0; e.oy = 0; e.pvx = 0; e.pvy = 0; e.hitT = 0;
  e.pulling = false; e.pinned = false;
  e.phase = rng.spawn() * TAU;
  pathPoint(e); e.x = e.px; e.y = e.py;
  return e;
}

// Shoves (snips, blade contact) can push an enemy toward the road's edge but never off it: its offset from the
// centreline is capped at level.roadHalfWidth, and velocity still pushing outward is dropped so it slides along the edge.
function keepOnRoad(e) {
  const max = C.level.roadHalfWidth * view.L, d2 = e.ox * e.ox + e.oy * e.oy;
  if (d2 <= max * max) return;
  const d = Math.sqrt(d2), nx = e.ox / d, ny = e.oy / d;
  e.ox = nx * max; e.oy = ny * max;
  const vn = e.pvx * nx + e.pvy * ny;
  if (vn > 0) { e.pvx -= nx * vn; e.pvy -= ny * vn; }
}

function reachWorkshop(e) {
  e.on = false; tweens.cancel(e); e.pulling = false;
  state.hp = Math.max(0, state.hp - e.type.tier); state.workshopHitT = 1;
  state.thread += C.threadPerLeak; state.run.leaks++; emit('thread', e.x, e.y, C.threadPerLeak);
  sparks(e.x, e.y, 8, 0);
  if (state.hp <= 0) endGame(false);
}

// fragments: life fades 1 -> 0 over fragmentLifeMs (a world tween), then the fragment switches off
const frags = state.frags;
for (let i = 0; i < C.maxEnemies * C.fragmentsPerKill + 12; i++) frags.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, sz: 0, life: 0, color: '' });
const FRAG_FADED = { life: 0 };
const fragDone = f => { f.on = false; };
function shatter(e) {
  let made = 0;
  for (let i = 0; i < frags.length && made < C.fragmentsPerKill; i++) {
    const f = frags[i]; if (f.on) continue;
    const ang = (made / C.fragmentsPerKill) * TAU + rng.fx() * 0.6, sp = C.fragmentSpeed * (0.6 + rng.fx() * 0.6);
    f.on = true; f.x = e.x + Math.cos(ang) * e.r * 0.3; f.y = e.y + Math.sin(ang) * e.r * 0.3;
    f.vx = Math.cos(ang) * sp; f.vy = Math.sin(ang) * sp - 40;
    f.rot = ang; f.vr = (rng.fx() - 0.5) * 14; f.sz = e.r * 0.55; f.life = 1; f.color = made & 1 ? e.type.patch : e.type.color;
    tween(f, FRAG_FADED, C.fragmentLifeMs, easing.linear, fragDone, 'frag');
    made++;
  }
  sparks(e.x, e.y, 10, 0);
}

// particles: c = colour index for the renderer (2 alternates white/cyan, 3 = gold, 4 = ember). Visual only, so Math.random.
const parts = state.parts;
for (let i = 0; i < 240; i++) parts.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, decay: 0, c: 0 });
function sparks(x, y, n, colorIdx) {
  for (let i = 0; i < parts.length && n > 0; i++) {
    const p = parts[i]; if (p.on) continue;
    const ang = Math.random() * TAU, sp = 120 + Math.random() * 320;
    p.on = true; p.x = x; p.y = y; p.vx = Math.cos(ang) * sp; p.vy = Math.sin(ang) * sp;
    p.life = 1; p.decay = 2.2 + Math.random() * 1.8; p.c = colorIdx === 2 ? (i & 1) : colorIdx;
    n--;
  }
}
function burst(x, y, strong) { sparks(x, y, strong ? C.snipParticles : C.snipParticles >> 1, 2); fx.ring = strong ? 1 : 0.6; fx.ringX = x; fx.ringY = y; }

// big floating words; kind indexes the renderer's label tables
export const LABEL_SNIP = 0, LABEL_NICK = 1, LABEL_CLANG = 2;
const labels = state.labels;
for (let i = 0; i < 6; i++) labels.push({ on: false, x: 0, y: 0, t: 0, kind: 0 });
function spawnLabel(x, y, kind) {
  let l = labels[0];
  for (let i = 0; i < labels.length; i++) { if (!labels[i].on) { l = labels[i]; break; } if (labels[i].t > l.t) l = labels[i]; }
  l.on = true; l.x = x; l.y = y; l.t = 0; l.kind = kind;
}

// floating damage numbers; g = strike grade (0 = pivot / seam hit .. 1 = tips, -1 = Fire Pin burn), which the renderer colours
const nums = state.nums;
for (let i = 0; i < 16; i++) nums.push({ on: false, x: 0, y: 0, t: 0, text: '', g: 0 });
function spawnNumber(x, y, dmg, g) {
  let n = nums[0];
  for (let i = 0; i < nums.length; i++) { if (!nums[i].on) { n = nums[i]; break; } if (nums[i].t > n.t) n = nums[i]; }
  n.on = true; n.x = x; n.y = y; n.t = 0; n.text = Number.isInteger(dmg) ? String(dmg) : dmg.toFixed(1); n.g = g;
}

// floating "+score" popups at kill locations
const pops = state.pops;
for (let i = 0; i < 16; i++) pops.push({ on: false, x: 0, y: 0, t: 0, text: '', multi: false });
function spawnPopup(x, y, pts, multi) {
  let p = pops[0];
  for (let i = 0; i < pops.length; i++) { if (!pops[i].on) { p = pops[i]; break; } if (pops[i].t > p.t) p = pops[i]; }
  p.on = true; p.x = x; p.y = y; p.t = 0; p.multi = multi; p.text = '+' + pts + (multi ? ' MULTI' : '');
}

export function spaceSnip() {
  if (!live() || heli.active || !input.gripping || input.scAlpha < 0.5) return;
  const last = input.last, pose = input.pose;
  last.ms = 0; last.speed = 0; last.kind = 'Space'; last.ver++;
  doSnip(pose.x, pose.y, pose.theta, pose.spread, true);
  fx.space = 1; resetSnipBuffer();
}

// Hooks for input.initInput().
// Event-driven hooks (keys, third finger) are ignored while paused; frame-driven ones never run then.
const unlessPaused = fn => (...a) => { if (!state.paused) fn(...a); };
export const gameHooks = { onSnip: doSnip, onTooSlow: tooSlow, onGrip: onGrip, onSpace: unlessPaused(spaceSnip), onReset: goTitle,
  onSpecial: unlessPaused(trySpecial), onPause: togglePause };

// ======================= update =======================
export function update(now, dt) {
  if (state.paused) return;                                      // frozen: no input, timers, tweens or clock
  updateInput(now, dt);                                          // input keeps running through hit-stop so no gesture is lost
  state.clock += dt;
  const frozen = fx.hitStop > 0;                                 // kill hit-stop: freeze the world
  rtTweens.update(dt);                                           // screen shake + the hit-stop countdown run regardless
  if (frozen) return;

  // --- timers ---
  const ms = dt * 1000;
  fx.flash = Math.max(0, fx.flash - ms / C.flashMs);
  fx.tooSlow = Math.max(0, fx.tooSlow - ms / C.shakeMs);
  fx.cut = C.cutZoneShowMs > 0 ? Math.max(0, fx.cut - ms / C.cutZoneShowMs) : 0;
  fx.kick = Math.max(0, fx.kick - ms / 120);
  fx.space = Math.max(0, fx.space - ms / C.spacePulseMs);
  fx.ring = Math.max(0, fx.ring - ms / 300);
  state.bannerT = Math.max(0, state.bannerT - ms / C.waveBannerMs);
  state.workshopHitT = Math.max(0, state.workshopHitT - ms / C.workshopHitMs);
  heli.bannerT = Math.max(0, heli.bannerT - ms / C.heliBannerMs);

  // --- waves / onboarding ---
  if (state.mode === 'PLAYING') {
    state.modeT += dt;
    // board cleared mid-wave: skip the wave clock ahead so the next spawn is at most emptyWaveWaitSec away
    if (spawnIdx < spawnList.length && !anyEnemyOn()) state.modeT = Math.max(state.modeT, spawnList[spawnIdx][0] - C.emptyWaveWaitSec);
    while (spawnIdx < spawnList.length && spawnList[spawnIdx][0] <= state.modeT && spawnEnemy(spawnList[spawnIdx][1])) spawnIdx++;
  } else if (state.mode === 'WAVE_CLEAR') {
    state.modeT += dt;
    if (state.modeT * 1000 >= C.waveClearMs) { if (state.wave >= C.waves.length) endGame(true); else beginWave(state.wave + 1); }
  } else if (state.mode === 'TUTORIAL') tutUpdate(dt);

  // --- towers ---
  for (const t of towers) {
    if (!t.on) continue;
    if (t.pulse > 0) t.pulse = Math.max(0, t.pulse - dt * 2);
    if (t.type === 'magnet' && live()) { t.timer += dt; if (t.timer >= C.towers.magnet.periodSec) { t.timer -= C.towers.magnet.periodSec; magnetPull(t); } }
  }

  // --- Helicopter spin ticks ---
  if (heli.phase === 'spin') { heli.tick += ms; while (heli.tick >= C.heliTickMs) { heli.tick -= C.heliTickMs; heliTick(); } }

  // --- enemies walk the road; shoves are an offset that springs back onto it ---
  if (live()) {
    const pushKeep = Math.exp(-C.pushDrag * dt), returnKeep = Math.exp(-C.pathReturnRate * dt);
    let alive = 0;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i]; if (!e.on) continue;
      e.age += dt;
      if (e.hitT > 0) e.hitT = Math.max(0, e.hitT - dt * 5);
      if (e.pinned) { alive++; continue; }                        // onboarding targets stay put
      // slowed: inside an Ice Pin aura, or recently hit by the Helicopter. burning: inside a Fire Pin aura, or left one
      // less than burnSec ago.
      let inIce = false, inFire = false;
      for (const t of towers) {
        if (!t.on || t.type === 'magnet' || Math.hypot(e.x - t.x, e.y - t.y) > towerReach(t.type)) continue;
        if (t.type === 'ice') inIce = true; else inFire = true;
      }
      if (e.slowT > 0) e.slowT = Math.max(0, e.slowT - dt);
      e.slowed = inIce || e.slowT > 0;
      if (inFire) e.burnLeft = C.towers.fire.burnSec; else if (e.burnLeft > 0) e.burnLeft = Math.max(0, e.burnLeft - dt);
      e.burning = inFire || e.burnLeft > 0;
      if (e.burning) {                                           // burn in whole ticks, counted from catching fire
        const def = C.towers.fire, tick = def.burnTickMs / 1000;
        e.burnT += dt;
        if (e.burnT >= tick) { e.burnT -= tick; if (burn(e, def.burnDps * tick)) continue; }
      } else e.burnT = 0;
      const step = e.speed * dt * (e.slowed ? C.slowSpeedMult : 1);
      if (e.type.boss) {                                         // walks to each turn point in bossTurns, then to the workshop
        const target = e.leg < C.bossTurns.length ? C.bossTurns[e.leg] : 1;
        e.u = e.u < target ? Math.min(target, e.u + step) : Math.max(target, e.u - step);
        if (e.u === target && e.leg < C.bossTurns.length) e.leg++;
        e.seamA = (e.seamA + TAU * dt / C.seamPeriodSec) % TAU;
      } else if (!e.pulling) e.u += step;                        // while a Magnet pulls it, its tween owns u, ox, oy
      if (e.u >= 1) { reachWorkshop(e); if (!live()) break; continue; }
      pathPoint(e);
      if (!e.pulling) { e.ox = (e.ox + e.pvx * dt) * returnKeep; e.oy = (e.oy + e.pvy * dt) * returnKeep; keepOnRoad(e); }
      e.pvx *= pushKeep; e.pvy *= pushKeep;
      e.x = e.px + e.ox; e.y = e.py + e.oy;
      alive++;
    }
    if (live()) bladeContacts(dt);
    if (state.mode === 'PLAYING' && spawnIdx >= spawnList.length && alive === 0) {
      state.mode = 'WAVE_CLEAR'; state.modeT = 0;
      sfxSequence('waveClear');
      showScreens();
    }
  }

  // --- effects ---
  for (let i = 0; i < nums.length; i++) {
    const n = nums[i]; if (!n.on) continue;
    n.t += dt; n.y -= 40 * dt; if (n.t > 0.7) n.on = false;
  }
  for (let i = 0; i < pops.length; i++) {
    const p = pops[i]; if (!p.on) continue;
    p.t += ms / C.scorePopupMs; p.y -= C.scorePopupRisePx * dt; if (p.t >= 1) p.on = false;
  }
  for (let i = 0; i < frags.length; i++) {
    const f = frags[i]; if (!f.on) continue;
    f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 420 * dt; f.vx *= 0.985; f.rot += f.vr * dt;
  }
  tweens.update(dt);                                             // world tweens (fragment fades, magnet pulls, Helicopter)
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]; if (!p.on) continue;
    p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.93; p.vy *= 0.93;
    p.life -= p.decay * dt; if (p.life <= 0) p.on = false;
  }
  for (let i = 0; i < labels.length; i++) {
    const l = labels[i]; if (!l.on) continue;
    l.t += dt; l.y -= 60 * dt; if (l.t > 0.6) l.on = false;
  }
}
