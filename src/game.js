// Game state + update(dt): state machine (TITLE -> MAP | SETTINGS, MAP -> SELECT -> PLAYING -> WAVE_CLEAR -> ... -> GAME_OVER,
// or level 0 -> TUTORIAL -> the map), waves along the current level's road (one route, or several at a fork), the workshop, thread
// economy, towers, bosses, the two move slots (SHRED's Helicopter spin and the Skills), the level-0 tutorial script, scoring,
// pooled entities (plain data), snip
// resolution, blade contact, run reports. No canvas calls here: render.js draws `state`.
// Title / select / settings / game-over / boss-card screens are HTML in index.html; this module only shows, hides and fills them.
import { CONFIG as C, VERSION } from './config.js';
import { view, level, TAU, DEG, clamp, segDistSq } from './core.js';
import { input, updateInput, resetSnipBuffer, holdTouch, setEasyOnly } from './input.js';
import { weapon, scaleFor, setWeapon, bladeReachPx, spinReachPx, isSlide, cut, setCutZone, cutZoneHits, sharpness, sharpMult, shredDef } from './scissors.js';
import { tween, tweens, makeTweens, easing } from './tween.js';
import { makeRng } from '../vendor/mulberry32.js';
import { sfx, sfxSnip, sfxSequence } from './audio.js';
import { saveRun } from './runlog.js';
import { UI_ART, uiUrl } from './kit.js';
import { loadLevel, hasLevel, levelInfo } from './levels/index.js';
import { recordLevelResult, onMap } from './levelSelect.js';
import { Save, persist, levelRecord } from './save.js';
import { STORY } from './story.js';
import { trackRunStart, trackRunEnd } from './analytics.js';
import { KNOB_KEYS } from './debug.js';
import { levelBefore, settleRun, wearBlade, levelPlace, mapIds, mapIndex } from './meta.js';
import { pinDef, pinCost, towerDef, towerReachOf, rankUpCost } from './pins.js';
import { skillDef, setMove } from './skills.js';
import { critters, splats, plan as critterPlan, planCritters, critterWave, critterWaveEnd, updateCritters, snipCritters, clearCritters, introActive } from './critters.js';

// ======================= state =======================
// mode: 'TITLE' | 'MAP' | 'SELECT' | 'SETTINGS' | 'TUTORIAL' | 'PLAYING' | 'WAVE_CLEAR' | 'GAME_OVER'. modeT = seconds in the current mode
// (wave clock while PLAYING). fx = effect timers/amplitudes read by the renderer. Entity pools hold plain objects
// with an `on` flag. events = a small ring of one-off happenings for the renderer (thread pickups, placements).
export const state = {
  mode: 'TITLE', modeT: 0, wave: 0, hp: 0, score: 0, won: false, seed: 0, thread: 0, paused: false, pauseCard: 'menu',
  bannerT: 0, workshopHitT: 0, clock: 0, bossCardT: 0, goalsT: 0,
  // world rules (worldRule()): gustT = the autumn gust clock (wave clock seconds), gustBannerT = its banner 1 -> 0;
  // dark = the night's dark is on; lights[0..lightN) = its pools of light ({ x, y, r } world px, pooled, rebuilt by buildLights when the
  // level, the screen or the Pins change; lightsVer counts rebuilds so render.js re-masks only then).
  // miniBannerT / miniName = a mini boss's name banner (1 -> 0), as it walks on.
  gustT: 0, gustBannerT: 0, dark: false, lights: [], lightN: 0, lightsVer: 0, miniBannerT: 0, miniName: '',
  stats: { snips: 0, kills: 0 },
  // flash = snip flash on the blades, tooSlow = "too slow" wobble, cut = cut-zone ghost, kick = snip world punch,
  // space = Space-key snap pulse, ring = pivot shock ring (at ringX/ringY), camShake = kill screen shake (px),
  // hitStop = seconds of world freeze left
  fx: { flash: 0, tooSlow: 0, cut: 0, kick: 0, space: 0, ring: 0, ringX: 0, ringY: 0, camShake: 0, hitStop: 0 },
  // one polyline per route of the current level ({ x, y, cum, n, len }, px); enemies walk paths[e.route]
  paths: [],
  // one per entrance of a level with several (empty otherwise): where its road comes onto the screen, which way it points, and
  // seconds until something is due there (next, 99 = nothing soon), for the renderer's arrows
  entryMarks: [],
  enemies: [], frags: [], parts: [], labels: [], nums: [], pops: [], needles: [],
  curls: [],                 // the Ribbon Shears' ribbon curls on the road (pooled, CONFIG.curlMax; see dropCurl)
  towers: [],                // one per spot of the current level (towers[i] stands on spot i when on)
  // Helicopter (SHRED's spin; only one runs at a time, whichever slot holds it): phase '' | 'open' | 'spin' | 'close';
  // spread/rot drive the blades while active. Its charge and armed live on its move slot (moves below).
  heli: { active: false, phase: '', spread: 0, rot: 0, theta0: 0, tick: 0, bannerT: 0 },
  // The two move slots (the moves section): each holds SHRED, a Skill or nothing for this run (Save.moves[i] if this level
  // allows it; pickMove). Plain objects, the same fields for every move: i = its place (0 = slot 1), id ('' = empty, 'shred'
  // or a CONFIG.skills id), def (SHRED: scissors.js shredDef; a Skill: skills.js skillDef; cached at the run's start),
  // need = charge events to fill it (SHRED: snip kills; 0 = no meter), charge 0..1, armed = the full meter was tapped (SHRED
  // and Mark, Pinking, Basting wait for their moment; Focus and Thimble go off at once), go = the next press on the table
  // came (SHRED starts there, Mark taps, Basting starts its drag), uses = times used this run, marksLeft = Seam Mark marks
  // still to place this use, focusT = Tailor's Focus seconds left (real time), bannerT = its word banner 1 -> 0, laneT /
  // lx0..ly1 = the Pinking Cut's zigzag flash (1 -> 0) and where it ran, sewing = a Basting drag is under way from (sx, sy)
  // to (ex, ey) (world px). The same move is never in both slots.
  moves: [newSlot(0), newSlot(1)],
  thimble: 0,                // Thimble Guard: enemies the brass thimble on the heart pad will still stop (render.js draws it)
  thimbleHitT: 0,            // ...1 -> 0 after it stops one (a flash on the cap)
  stitches: [],              // Basting Stitch lines across the road (pooled, CONFIG.skills.basting.bastingMax; see sewStitch)
  // level 0 (see the tutorial section): step 1..5, rep = ghost repeats this step (it grows more obvious), cyc = seconds
  // into the ghost's demo, vis = ghost fade, away = seconds until it comes back after the player lets go, holdT = the
  // player's current hold, meter = step 2's hold ring (0..1), ok = step 2 passed (the next lift moves on), cuts = step 5
  // Scraps done (cut or through), winT = celebration left.
  // ghost = the hand for render.js: x, y fingertip, a alpha, down press 0..1, sc scissors risen 0..1, open 0..1, meter hold
  // ring 0..1, scale / alpha emphasis, cutT / cx / cy / cutOpen = the fading cut zone of its last snip.
  tut: { step: 0, t: 0, rep: 0, cyc: 0, prevCyc: 0, cycLen: 4, vis: 0, away: 0, holdT: 0, meter: 0, ok: false, wasGrip: false,
    cuts: 0, next: 0, spawnLeft: 0, spawnT: 0, advanceT: 0, walkIn: false, winT: 0, burstT: 0,
    taps: [], ghost: { x: 0, y: 0, a: 0, down: 0, sc: 0, open: 0, meter: 0, scale: 1, alpha: 0.6, cutT: 0, cx: 0, cy: 0, cutOpen: 0 } },
  // run = report counters: bestSnipKills = most kills by one snip, beetleExecutes = Button Beetles executed in the Cigar
  // Cutter's ring, prunerBite = a Ratchet Pruners armor-down bite ended a boss's armored phase (achievements.js)
  // critterKills = critters squished this run (src/critters.js)
  // specials = SHRED's uses this run, whichever slot held it (the noSpecial star, the run report; every move's own count is
  // on its slot, moves[i].uses)
  run: { t0: 0, multiSnips: 0, towers: {}, rankUps: 0, specials: 0, leaks: 0, stars: 0, bestSnipKills: 0, beetleExecutes: 0, prunerBite: false, critterKills: 0 },
  sharpMult: 1,              // snip damage multiplier from the weapon's edge at the run's start (sharpMult in scissors.js; x1 in level 0)
  sharpAtStart: 0,           // that edge, 0 (dull) .. 1 (sharp), for the run report
  tally: null,               // the finished run's Buttons (meta.js settleRun), for the results card
  events: { seq: 0, list: [] },
  critters, splats,          // src/critters.js pools: bonus targets only a manual snip hits, and their squish splats
};
const fx = state.fx, heli = state.heli, tut = state.tut, moves = state.moves;
// Which slot holds each move this run (null = neither), so an effect finds its numbers without a search: slotOf.shred,
// slotOf.mark, ... (kept by setSlot; the same move is never in both slots).
const slotOf = { shred: null };
for (const id in C.skills) slotOf[id] = null;
export const live = () => state.mode === 'PLAYING' || state.mode === 'WAVE_CLEAR' || state.mode === 'TUTORIAL';
export const accuracyText = () => state.stats.snips ? Math.round(state.stats.kills / state.stats.snips * 100) + '%' : '—';

// one-off events for the renderer: kind 'thread' (+n pickup at x,y), 'bonus' (a critter's bigger +n pickup), 'place' (tower built)
for (let i = 0; i < 32; i++) state.events.list.push({ seq: -1, kind: '', x: 0, y: 0, n: 0 });
function emit(kind, x, y, n) {
  const ev = state.events.list[state.events.seq % state.events.list.length];
  ev.seq = state.events.seq++; ev.kind = kind; ev.x = x; ev.y = y; ev.n = n;
}

// Real-time tweens (screen shake, hit-stop itself) keep running through hit-stop; the world group (`tweens`) doesn't.
const rtTweens = makeTweens();

// ======================= seeded randomness =======================
// Gameplay randomness comes from mulberry32 streams seeded by state.seed (Date.now() per run, or ?seed=N in the URL):
// spawn = enemy variation, hit = shove chance, fx = fragment bursts, critter = critter schedule and lanes. Separate
// streams keep spawns independent of how many hits or kills happened. Purely visual sparkle (particles) still uses Math.random.
const urlSeed = (() => { const s = new URLSearchParams(location.search).get('seed'); return s !== null && /^\d+$/.test(s) ? Number(s) : null; })();
export const rng = { spawn: makeRng(0), hit: makeRng(1), fx: makeRng(2), critter: makeRng(3) };
function seedRun(seed) {
  state.seed = seed;
  rng.spawn = makeRng(seed); rng.hit = makeRng(seed ^ 0x9E3779B9); rng.fx = makeRng(seed ^ 0x85EBCA6B); rng.critter = makeRng(seed ^ 0xC2B2AE35);
}

const els = {
  title: document.getElementById('title'), map: document.getElementById('map'), select: document.getElementById('select'), settings: document.getElementById('settings'), over: document.getElementById('over'),
  reset: document.getElementById('reset'), tray: document.getElementById('tray'), tutSkip: document.getElementById('tut-skip'),
  bossCard: document.getElementById('boss-card'), bossName: document.getElementById('boss-name'), bossPortrait: document.getElementById('boss-portrait'), bossTaunt: document.getElementById('boss-taunt'), mute: document.getElementById('mute'), pauseBtn: document.getElementById('pause'),
  pause: document.getElementById('pause-screen'), pinsIntro: document.getElementById('pins-intro'), pauseWave: document.getElementById('pause-wave'), pauseScore: document.getElementById('pause-score'),
  pauseAcc: document.getElementById('pause-acc'), pauseSeed: document.getElementById('pause-seed'), pauseGoals: document.getElementById('pause-goals'),
  goals: document.getElementById('goals'), goalsList: document.getElementById('goals-list'), goalsDispatch: document.getElementById('goals-dispatch'), selectGoals: document.getElementById('select-goals'),
  overTitle: document.getElementById('over-title'), overScore: document.getElementById('over-score'), overLevel: document.getElementById('over-level'),
  overSelect: document.getElementById('over-select'), overPrimary: document.getElementById('over-primary'), overMap: document.getElementById('over-map'), again: document.getElementById('again'),
  overWaves: document.getElementById('over-waves'), overKills: document.getElementById('over-kills'), overAcc: document.getElementById('over-acc'), overSeed: document.getElementById('over-seed'),
};
function showScreens() {
  const m = state.mode;
  els.title.hidden = m !== 'TITLE';
  els.map.hidden = m !== 'MAP';
  els.select.hidden = m !== 'SELECT';
  els.settings.hidden = m !== 'SETTINGS';
  els.over.hidden = m !== 'GAME_OVER';
  els.reset.hidden = els.mute.hidden = m !== 'GAME_OVER';        // mid-run they're on the pause card, out of the way

  els.pauseBtn.hidden = !live();
  els.pause.hidden = !state.paused || state.pauseCard !== 'menu';
  els.pinsIntro.hidden = !state.paused || state.pauseCard !== 'pins';
  els.tray.hidden = (state.paused && state.pauseCard !== 'build') || (m !== 'PLAYING' && m !== 'WAVE_CLEAR');   // the Pin picker's pause keeps the board
  els.tutSkip.hidden = state.paused || m !== 'TUTORIAL';
  els.bossCard.hidden = state.paused || state.bossCardT <= 0 || !live();
  const goalsOn = !state.paused && state.goalsT > 0 && live();
  if (goalsOn && els.goals.hidden) els.goals.style.setProperty('--dur', Math.round(state.goalsT * 1000) + 'ms');   // (re)shown: its fade spans the time left
  els.goals.hidden = !goalsOn;
}

// ======================= layout (weapon scale + level) =======================
// Called on resize (after view.W/H are set) and on weapon change.
export function layout() { applyZoom(); applyWeaponScale(); placeLevel(); buildPath(); placeSpots(); buildLights(); }
// The world zoom for the current level (see core.js): a size-1.5 level is seen 1 / 1.5 as big.
function applyZoom() { view.Z = 1 / (level().size || 1); view.W = view.SW / view.Z; view.H = view.SH / view.Z; }
function applyWeaponScale() { view.S = scaleFor(weapon.def); }

// Switch weapons: size it for this screen (the caller then re-rasterizes its art).
export function selectWeapon(id) { setWeapon(id); applyWeaponScale(); }

// The plate is drawn full height, centred: level units -> screen px.
function placeLevel() { const lv = level(); view.L = view.H / lv.h; view.LX = (view.W - lv.w * view.L) / 2; }
export const levelX = x => view.LX + x * view.L, levelY = y => y * view.L;

// Switch levels (select screen): one tower slot per spot of the new level. The caller then re-runs the resize chain
// (layout, prerender, measureActionBar) and rebuilds the action bar's + buttons. The level comes from loadLevel()
// (src/levels/index.js); a random one is built from `seed` (startGame passes the run's seed and calls onLevelBuilt).
export function setLevel(id, seed = Date.now()) {
  if (!hasLevel(id)) id = C.defaultLevel;
  view.levelId = id; view.levelDef = loadLevel(id, seed);
  towers.length = 0;
  for (let i = 0; i < level().spots.length; i++) {
    towers.push({ on: false, type: '', rank: 1, def: null, x: 0, y: 0, fx: 0, fy: 0, fu: [], timer: 0, pulse: 0, aim: -Math.PI / 2, kick: 0, snowedT: 0, pop2: 0 });
  }
}

// Each route of the level (level units) -> a Catmull-Rom polyline in px, rebuilt on resize. Enemies store progress u
// (0..1) along their own route.
function buildPath() {
  const routes = level().paths;
  state.paths.length = routes.length;
  routes.forEach((P, r) => {
    const n = P.length, steps = C.pathSmoothSteps, L = view.L, LX = view.LX;
    const path = state.paths[r] || (state.paths[r] = { x: null, y: null, cum: null, n: 0, len: 1, lenU: 1 });
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
    path.lenU = path.len / L;                                     // the same length in plate units (independent of the screen)
  });
  // where each entrance's road first shows on screen (its first path's first stretch inside the view, a little in from the edges)
  const lv = level(), marks = state.entryMarks, pad = C.entryMarkInsetPx;
  marks.length = lv.entries > 1 ? lv.entries : 0;
  for (let k = 0; k < marks.length; k++) {
    const r = lv.entryOf.indexOf(k), p = state.paths[r], m = marks[k] || (marks[k] = { x: 0, y: 0, ang: 0, next: 99 });
    let i = 0;
    while (i < p.n - 4 && (p.x[i] < pad || p.x[i] > view.W - pad || p.y[i] < pad || p.y[i] > view.H - pad)) i++;
    m.x = p.x[i]; m.y = p.y[i]; m.ang = Math.atan2(p.y[i + 3] - p.y[i], p.x[i + 3] - p.x[i]);
  }
  for (const e of enemies) if (e.on && !e.pinned) { if (e.route >= routes.length) e.route = 0; e.seg = 0; pathPoint(e); e.x = e.px + e.ox; e.y = e.py + e.oy; }
}
// Each tower sits on its spot; fx/fy = the nearest road point on any route (where the Magnet ring collapses) and
// fu[r] = the progress of route r's nearest point (where a Magnet Pin clumps that route's enemies).
function placeSpots() {
  level().spots.forEach(([sx, sy], i) => {
    const t = towers[i]; if (!t) return;
    t.x = levelX(sx); t.y = levelY(sy);
    t.fu.length = state.paths.length;
    let best = Infinity;
    state.paths.forEach(({ x: X, y: Y, cum, n, len }, r) => {
      let bestR = Infinity;
      for (let k = 0; k < n; k++) {
        const d = (X[k] - t.x) ** 2 + (Y[k] - t.y) ** 2;
        if (d < bestR) { bestR = d; t.fu[r] = cum[k] / len; }
        if (d < best) { best = d; t.fx = X[k]; t.fy = Y[k]; }
      }
    });
  });
}
// Sets e.px/e.py to the road point at progress e.u on its route; e.seg is a search hint (the boss walks backwards too).
function pathPoint(e) {
  const path = state.paths[e.route], { x: pathX, y: pathY, cum: pathCum, n: pathN } = path, d = e.u * path.len;
  let s = e.seg;
  while (s > 0 && pathCum[s] > d) s--;
  while (s < pathN - 2 && pathCum[s + 1] < d) s++;
  e.seg = s;
  const segLen = pathCum[s + 1] - pathCum[s], t = segLen > 0 ? clamp((d - pathCum[s]) / segLen, 0, 1) : 0;
  e.px = pathX[s] + (pathX[s + 1] - pathX[s]) * t;
  e.py = pathY[s] + (pathY[s + 1] - pathY[s]) * t;
}
// NRM = the unit normal of e's road at its current stretch (left of the walking direction): Leaves drift and the Bottle
// Cap bounces along it. One reused object.
const NRM = { x: 0, y: 0 };
function roadNormal(e) {
  const p = state.paths[e.route], s = Math.min(e.seg, p.n - 2), dx = p.x[s + 1] - p.x[s], dy = p.y[s + 1] - p.y[s], d = Math.hypot(dx, dy) || 1;
  NRM.x = -dy / d; NRM.y = dx / d;
}

// ======================= flow =======================
function clearWorld() {
  if (state.mode === 'PLAYING' || state.mode === 'WAVE_CLEAR') trackRunEnd(buildReport(true));   // a run left mid-way: a quit
  for (const e of enemies) e.on = false;
  for (const f of frags) f.on = false;
  for (const p of parts) p.on = false;
  for (const l of labels) l.on = false;
  for (const n of nums) n.on = false;
  for (const p of pops) p.on = false;
  for (const t of towers) t.on = false;
  for (const n of needles) n.on = false;
  for (const c of curls) c.on = false;
  tweens.clear(); rtTweens.clear();
  const last = input.last;
  last.ms = -1; last.kind = ''; last.ver++;
  fx.cut = fx.flash = fx.tooSlow = fx.kick = fx.ring = fx.space = fx.hitStop = fx.camShake = 0; state.bannerT = state.workshopHitT = 0;
  heli.active = false; heli.phase = ''; heli.spread = heli.rot = 0; heli.bannerT = 0;
  clearMoves();
  state.paused = false; state.bossCardT = 0; state.goalsT = 0;
  state.gustT = state.gustBannerT = state.miniBannerT = 0;
  buildLights();                                                // the Pins are gone: so are their lights
  tut.step = 0; tut.winT = 0; tut.ghost.cutT = 0; tut.vis = 0;
  clearCritters();
  setEasyOnly(false);                                           // level 0 forces Hold controls only while it runs
  resetSnipBuffer();
}

export function goTitle() { clearWorld(); state.mode = 'TITLE'; showScreens(); }
export function goMap() { clearWorld(); state.mode = 'MAP'; showScreens(); }
// The weapon screen lists the level's star goals (all still to play for), so the run itself starts quiet.
export function goSelect() {
  clearWorld(); state.mode = 'SELECT';
  els.selectGoals.hidden = isTutorial();
  if (!isTutorial()) fillGoals(els.selectGoals, true);
  showScreens();
}
export function goSettings() { clearWorld(); state.mode = 'SETTINGS'; showScreens(); }

// Start a run on the current level. Level 0 (CONFIG.tutLevel) is the tutorial: its script runs instead of waves.
// main.js sets these: after a random level is rebuilt for a new run, re-run the resize chain and the + buttons; after
// level 0 is cleared, go to the level map (which plays the reward reveal).
let onLevelBuilt = () => {}, onTutorialDone = () => {}, onRunEnd = () => {};
export function setLevelHook(fn) { onLevelBuilt = fn; }
export function setRunEndHook(fn) { onRunEnd = fn; }            // the results card (results.js) plays the tally
export function setTutorialDoneHook(fn) { onTutorialDone = fn; }

let bgWaitT = 0;                                                 // seconds this run's wave clock has waited for the level art
export function startGame() {
  bgWaitT = 0;
  clearWorld();
  seedRun(urlSeed !== null ? urlSeed : Date.now());
  if (levelInfo(view.levelId).random) { setLevel(view.levelId, state.seed); onLevelBuilt(); }   // a new road every run
  if (isEndless()) planEndless();
  resetRun();
  if (isTutorial()) {
    state.mode = 'TUTORIAL'; state.wave = 0; state.bannerT = 1;   // the banner shows the level name
    setEasyOnly(true); tutEnter(1); showScreens(); return;
  }
  beginWave(1);
  trackRunStart(view.levelId, weapon.id);
  showGoals();
  showScreens();
}
function resetRun() {
  state.score = 0; state.hp = C.workshopHp; state.won = false; state.stats.snips = 0; state.stats.kills = 0; state.thread = level().startThread ?? C.startThread;
  state.gustT = 0;
  for (let i = 0; i < moves.length; i++) setSlot(moves[i], '');  // empty both first, so a move can change places
  for (let i = 0; i < moves.length; i++) setSlot(moves[i], pickMove(i));
  const r = state.run; r.t0 = Date.now(); r.multiSnips = 0; r.specials = 0; r.leaks = 0; r.stars = 0;
  r.bestSnipKills = 0; r.beetleExecutes = 0; r.prunerBite = false; r.critterKills = 0; r.rankUps = 0;
  if (!isTutorial()) planCritters(level(), levelWaves(), rng.critter, isBossName);   // mini bosses' waves keep their critters
  state.sharpAtStart = sharpness(weapon.id); state.sharpMult = isTutorial() ? 1 : sharpMult(state.sharpAtStart); state.tally = null;
  for (const k in C.towers) r.towers[k] = 0;
}

// The level's waves (its own, or CONFIG.waves; an endless level's are generated, endlessWaves).
export const isEndless = () => !!level().endless;
export const levelWaves = () => isEndless() ? endlessWaves : (!isTutorial() && debugWaves) || level().waves || C.waves;
// A full boss (the last wave alone, the intro card), not a mini boss (a wave entry like any type, CONFIG.bosses mini).
const isBossName = n => !!(C.enemyTypes[n] && C.enemyTypes[n].boss && !C.enemyTypes[n].mini);
// Dev only: ?waves=leaf:5,burr:2;moth:4,bobbin:1 replaces any non-endless level's waves (not level 0): waves split by ';',
// entries 'type:count' or 'type:count@atSec' (default: 2s, then 6s apart), to try new enemies on any road.
const debugWaves = (() => {
  const s = new URLSearchParams(location.search).get('waves');
  if (!s) return null;
  return s.split(';').map(w => w.split(',').filter(Boolean).map((p, i) => {
    const [type, rest = '1'] = p.split(':'), [count, at] = rest.split('@');
    return [type.trim(), Math.max(1, parseInt(count, 10) || 1), at !== undefined ? Number(at) : 2 + 6 * i];
  })).filter(w => w.length);
})();

// ---------- endless (Random Quilt) ----------
// Waves made from the run seed (their own stream, so they don't move with spawns or hits): planWaves at the start, more
// as the run gets there. Wave n is a boss alone every bossEvery-th wave (the bosses in turn, trailed by Scraps from the
// second time round), else groupsBase + groupsPerWave x (n - 1) groups of a type drawn by weight among those unlocked by
// wave n, each group sizePerWave a wave bigger; from miniFromWave on, every miniEvery-th of those non-boss waves also
// brings one mini boss (the minis in turn) halfway through. The mini boss is fixed by n alone (no draw from the stream),
// so a seed's waves stay the same either way.
const endlessWaves = [];
let endlessRng = Math.random;
function endlessWave(n) {
  const E = C.endless, rnd = endlessRng;
  if (n % E.bossEvery === 0) {
    const cycle = n / E.bossEvery, w = [[E.bosses[(cycle - 1) % E.bosses.length], 1, 0]];
    const esc = Math.floor((cycle - 1) / E.bosses.length) * E.bossEscortPerCycle;
    if (esc > 0) w.push(['scrap', esc, 4]);
    return w;
  }
  const pool = E.types.filter(t => n >= t[1] && C.enemyTypes[t[0]]), total = pool.reduce((a, t) => a + t[2], 0);
  const groups = Math.min(E.groupsMax, Math.round(E.groupsBase + E.groupsPerWave * (n - 1))), grow = 1 + E.sizePerWave * (n - 1);
  const w = [];
  let at = 2;
  for (let g = 0; g < groups; g++) {
    let r = rnd() * total, pick = pool[0];
    for (const t of pool) { if ((r -= t[2]) <= 0) { pick = t; break; } }
    w.push([pick[0], Math.max(1, Math.round(pick[3] * grow)), Math.round(at)]);
    at += E.groupGapSec * (0.8 + 0.4 * rnd());
  }
  const mini = endlessMini(n);
  if (mini) w.push([mini, 1, Math.round(at / 2)]);
  return w;
}
// The mini boss of endless wave n ('' = none): counting the non-boss waves from miniFromWave, the 1st, then every
// miniEvery-th, brings the next of CONFIG.endless.minis.
function endlessMini(n) {
  const E = C.endless;
  if (!E.minis || !E.minis.length || !E.miniEvery || n < E.miniFromWave || n % E.bossEvery === 0) return '';
  let k = 0;
  for (let w = E.miniFromWave; w <= n; w++) if (w % E.bossEvery !== 0) k++;
  if ((k - 1) % E.miniEvery !== 0) return '';
  const name = E.minis[Math.floor((k - 1) / E.miniEvery) % E.minis.length];
  return C.enemyTypes[name] ? name : '';
}
function planEndless() {
  endlessWaves.length = 0;
  endlessRng = makeRng(state.seed ^ 0x3C6EF372);
  for (let n = 1; n <= C.endless.planWaves; n++) endlessWaves.push(endlessWave(n));
}
// A boss's hp x on an endless run: more each time round the three.
const bossHpScale = () => isEndless() ? 1 + C.endless.bossHpPerCycle * Math.floor((state.wave / C.endless.bossEvery - 1) / C.endless.bosses.length) : 1;

// Wave schedule from levelWaves(): each [type, count, atSec] entry spawns `count` of `type` from atSec, gapMs apart.
let spawnList = [], spawnIdx = 0;                             // [[timeSec, typeName, entrance], ...] sorted by time
const anyEnemyOn = () => { for (let i = 0; i < enemies.length; i++) if (enemies[i].on) return true; return false; };
// A boss wave opens on the boss's intro card (and roar) instead of the WAVE banner; the boss walks on as it closes.
function beginWave(n) {
  spawnList = [];
  while (isEndless() && endlessWaves.length < n) endlessWaves.push(endlessWave(endlessWaves.length + 1));
  let boss = '';
  const ne = level().entries || 1;
  for (const [name, count, atSec, entry] of levelWaves()[n - 1]) {
    const t = C.enemyTypes[name];
    if (!t) { console.warn('CONFIG.waves: unknown enemy type', name); continue; }
    const big = t.boss && !t.mini;                              // a mini boss is a wave entry like any type (no card, any route)
    if (big) boss = name;
    const at = big ? Math.max(atSec, C.bossIntroMs / 1000) : atSec;
    // which entrance each comes in by: the entry's own 4th field (an index), else drawn now (only where there's a choice), so its warning can show first
    // (a boss always takes the longest route, so it comes in by that route's entrance)
    const bossEntry = big && ne > 1 ? level().entryOf[longestRoute()] : -1;
    for (let i = 0; i < count; i++) spawnList.push([at + i * t.gapMs / 1000, name, bossEntry >= 0 ? bossEntry : entry !== undefined ? Math.min(entry, ne - 1) : ne > 1 ? Math.floor(rng.spawn() * ne) : 0]);
  }
  spawnList.sort((a, b) => a[0] - b[0]);
  spawnIdx = 0;
  critterWave(n, spawnList.length ? spawnList[spawnList.length - 1][0] : 0, rng.critter);
  state.wave = n; state.mode = 'PLAYING'; state.modeT = 0; state.bannerT = boss ? 0 : 1; state.gustT = 0;
  if (boss) showBossCard(boss);
}
function showBossCard(name) {
  const def = C.bosses[name]; if (!def) return;
  els.bossPortrait.src = uiUrl(UI_ART.portraits[name] || UI_ART.portraits.seamRipper); els.bossName.textContent = def.name; els.bossTaunt.textContent = def.taunt;
  state.bossCardT = C.bossIntroMs / 1000;
  sfx(def.roar, 0); addShake(8, 8);
  showScreens();
}

// The level after the current one on the level map, across a world's end into the next world's first (offered on the
// win card), or '' after the last / off the map / when that level's file isn't there.
export function nextLevelId() {
  const ids = mapIds(), i = ids.indexOf(view.levelId), next = i >= 0 ? ids[i + 1] || '' : '';
  return next && hasLevel(next) ? next : '';
}

// A win's stars: 1 for clearing, +1 per star rule met (noDamage: nothing reached the workshop; noSpecial: no SHRED;
// pin: built at least one Pin;
// critters: every critter that came was squished, and at least one came).
function starsEarned() {
  const rules = level().starRules || {}, r = state.run;
  return 1 + (rules.noDamage && !r.leaks ? 1 : 0) + (rules.noSpecial && !r.specials ? 1 : 0) +
    (rules.pin && Object.values(r.towers).some(n => n > 0) ? 1 : 0) +
    (rules.critters && critterPlan.spawned > 0 && critterPlan.killed >= critterPlan.spawned ? 1 : 0);
}
// The level's star goals in star order (clearing, then its starRules; words in CONFIG.starGoals), each with how it
// stands this run: 'on' = still to play for, 'met' = done already, 'lost' = gone for this run.
export function starGoals() {
  if (isEndless()) {                                              // endless: no stars, the goal and the record to beat
    const rec = Save.levels[view.levelId] || {};
    const out = [{ key: 'survive', text: 'Survive: a boss every ' + C.endless.bossEvery + ' waves', status: 'on' }];
    if (rec.bestWave) out.push({ key: 'best', text: 'Best: ' + rec.bestWave + ' waves · ' + (rec.bestKills | 0) + ' kills', status: 'on' });
    return out;
  }
  const rules = level().starRules || {}, r = state.run, G = C.starGoals;
  const out = [{ key: 'clear', text: G.clear, status: 'on' }];
  for (const k of ['noDamage', 'noSpecial', 'pin', 'critters']) {
    if (!rules[k]) continue;
    let status = 'on';
    if (k === 'noDamage' && r.leaks) status = 'lost';
    if (k === 'noSpecial' && r.specials) status = 'lost';
    if (k === 'pin' && Object.values(r.towers).some(n => n > 0)) status = 'met';
    if (k === 'critters') {                                       // one crawled off unsquished
      let crawling = 0; for (const c of critters) if (c.on) crawling++;
      if (critterPlan.spawned - critterPlan.killed - crawling > 0) status = 'lost';
    }
    out.push({ key: k, text: G[k] || k, status });
  }
  return out;
}
// A goal list (the weapon screen, the star goals card, the pause card): a star and the words per goal; the third
// star's goal (the level's feat) is marked out. fresh = before a run (the weapon screen): every goal still 'on'.
function fillGoals(ul, fresh = false) {
  ul.textContent = '';
  starGoals().forEach((g, i) => {
    const li = document.createElement('li');
    li.className = (fresh ? 'on' : g.status) + (i >= 2 ? ' feat' : '');
    li.innerHTML = '<i></i><span></span>'; li.lastChild.textContent = g.text;
    ul.appendChild(li);
  });
}
// A level's first wave: Tomato's dispatch line (story.js) with the star goals under it, under the banner for
// CONFIG.starGoalsMs. Only levels with a line get the card: one with something new (a boss, a new Pin, enemy or
// mechanic); the goals alone don't earn one (they're on the weapon screen and the pause card).
function showGoals() {
  const line = STORY.dispatch[view.levelId] || '';
  if (!line) return;
  els.goalsDispatch.hidden = !line;
  els.goalsDispatch.firstChild.textContent = STORY.narrator.toUpperCase() + ' SAYS';
  els.goalsDispatch.lastChild.textContent = line;
  fillGoals(els.goalsList);
  state.goalsT = C.starGoalsMs / 1000;
}

export let lastReport = null;
function endGame(won) {
  state.paused = false;
  state.mode = 'GAME_OVER'; state.won = won;
  const endless = isEndless(), survived = state.wave - 1;
  // an endless run's personal records (read before recordLevelResult moves bestScore): which this run beat
  const rec = levelRecord(view.levelId);
  state.endlessRec = endless ? { waves: survived, kills: state.stats.kills, score: state.score,
    bestWaves: Math.max(rec.bestWave | 0, survived), bestKills: Math.max(rec.bestKills | 0, state.stats.kills), bestScore: Math.max(rec.bestScore | 0, state.score),
    newWaves: survived > (rec.bestWave | 0), newKills: state.stats.kills > (rec.bestKills | 0), newScore: state.score > (rec.bestScore | 0) } : null;
  if (endless) { rec.bestWave = state.endlessRec.bestWaves; rec.bestKills = state.endlessRec.bestKills; }
  els.overTitle.textContent = endless ? 'SURVIVED ' + survived + (survived === 1 ? ' WAVE' : ' WAVES') : won ? 'DRAWER DEFENDED!' : 'WORKSHOP OVERRUN';
  els.overTitle.dataset.text = els.overTitle.textContent;       // the felt heading's outline layer (index.html .card h2)
  els.overTitle.classList.toggle('win', won); els.overTitle.classList.toggle('lose', !won);
  els.overLevel.textContent = level().name;
  state.run.stars = won ? starsEarned() : 0;
  const before = levelBefore(view.levelId);
  recordLevelResult(view.levelId, won, state.score, state.run.stars, level().unlockOnClear);
  els.overScore.textContent = String(state.score);
  els.overWaves.textContent = endless ? survived + ' / ∞' : (won ? levelWaves().length : state.wave - 1) + ' / ' + levelWaves().length;
  els.overKills.textContent = String(state.stats.kills);
  els.overAcc.textContent = accuracyText();
  els.overSeed.textContent = String(state.seed);
  if (!won) sfxSequence('gameOver');
  lastReport = buildReport();
  state.tally = settleRun(lastReport, before);
  state.tally.unlock = won && !before.cleared ? level().unlockOnClear : null;
  state.tally.endless = state.endlessRec;
  const mapped = onMap(view.levelId);
  // the big button after a win: NEXT LEVEL when there is one (nextLevelId, across a world's end too) and nothing is
  // waiting to be shown on the map; TO THE MAP when this win queued rewards (Save.reveals: a morning-after note, new
  // scissors, stock on sale, Pin tiers: the map plays their cards) or it was the last level. TRY AGAIN after a loss;
  // off the map (Random Quilt, Custom Road) a win offers another go (a new quilt) and the small button goes to the title.
  // (main.js plays 'next': straight in with the same weapon, or through the weapon screen when that level brings a new tool.)
  const primary = !won || !mapped ? 'again' : nextLevelId() && !Save.reveals.length && !state.tally.chest ? 'next' : 'map';
  els.overSelect.dataset.act = primary;
  els.overPrimary.textContent = primary === 'next' ? 'NEXT LEVEL' : primary === 'map' ? 'TO THE MAP' : endless ? 'NEW QUILT' : !won ? 'TRY AGAIN' : levelInfo(view.levelId).random ? 'NEW QUILT' : 'PLAY AGAIN';
  els.overMap.textContent = mapped ? 'Map' : 'Title';
  els.overMap.hidden = primary === 'map'; els.again.hidden = primary === 'again';
  lastReport.buttons = { stars: state.tally.starButtons, score: state.tally.scoreButtons, achievements: state.tally.achievements.map(a => a.id), total: state.tally.total };
  saveRun(lastReport);
  trackRunEnd(lastReport);
  showScreens();
  onRunEnd();
}

// Compact playtest report (kept in localStorage, sent as run_ended by analytics.js, carried by feedback). inProgress =
// a run left mid-way (clearWorld: quit to the map or title, or restarted); only sent, never saved.
function buildReport(inProgress = false) {
  const s = state.stats, r = state.run, cfg = {};
  for (const k of KNOB_KEYS) cfg[k] = C[k];
  return {
    version: VERSION, seed: state.seed, level: view.levelId, ...(level().gen ? { recipe: level().recipe } : {}), weapon: weapon.id, won: state.won, wavesReached: state.wave, score: state.score,
    snips: s.snips, kills: s.kills, accuracy: s.snips ? +(s.kills / s.snips).toFixed(3) : 0, multiSnips: r.multiSnips,
    towers: { ...r.towers }, specialUses: r.specials, moves: moves.map(m => m.id), moveUses: moves.map(m => m.uses), deathsAtWorkshop: r.leaks, stars: r.stars,
    boss: levelWaves().some(w => w.some(([n]) => isBossName(n))), bestSnipKills: r.bestSnipKills,
    beetleExecutes: r.beetleExecutes, prunerBite: r.prunerBite, critterKills: r.critterKills, critterSpawns: critterPlan.spawned, rankUps: r.rankUps, upgradeTier: weapon.def.tier | 0, sharpness: +state.sharpAtStart.toFixed(3),
    ...(isEndless() ? { endless: true, wavesSurvived: Math.max(0, state.wave - 1) } : {}),
    durationSec: Math.round((Date.now() - r.t0) / 1000), device: navigator.userAgent, config: cfg,
    replay: location.origin + location.pathname + '?seed=' + state.seed + '&level=' + view.levelId +
      (view.levelId === 'custom' ? '&recipe=' + encodeURIComponent(level().recipe) : ''), endedAt: new Date().toISOString(),
    ...(inProgress ? { inProgress: true } : {}),
  };
}

// ======================= pause =======================
// Freezes the whole game (update() returns before input, timers and tweens). Paused time doesn't count toward the run
// duration. Resuming re-arms snip detection so finger movement during the pause can't fire a snip.
// card = which card the pause shows: 'menu' (RESUME + run report), 'pins' (the new-Pin explainer, once per Pin type) or
// 'build' (none: the Pin picker is open over the board, actionBar.js).
let pausedAt = 0;
export function setPaused(p, card = 'menu') {
  if (p === state.paused || (p && !live())) return;
  state.paused = p;
  if (p) state.pauseCard = card;
  if (p) {
    pausedAt = Date.now();
    els.pauseWave.textContent = state.mode === 'TUTORIAL' ? 'Level 0' : state.wave + ' / ' + (isEndless() ? '∞' : levelWaves().length);
    els.pauseScore.textContent = String(state.score);
    els.pauseAcc.textContent = accuracyText();
    els.pauseSeed.textContent = String(state.seed);
    els.pauseGoals.hidden = state.mode === 'TUTORIAL';
    if (state.mode !== 'TUTORIAL') fillGoals(els.pauseGoals);
  } else {
    state.run.t0 += Date.now() - pausedAt;
    resetSnipBuffer();
  }
  showScreens();
}
export const togglePause = () => setPaused(!state.paused);

// ======================= level 0: the no-text tutorial =======================
// For a young player who can't read, Hold controls only: a translucent ghost hand (tut.ghost, drawn by render.js) shows
// each step and repeats every tutGhostCycleMs, holding longer and more obviously each time (tut.rep). It hides while
// the player's own finger is down and comes back tutGhostReturnMs after a lift that didn't pass the step (one repeat
// further along, so a player who only taps sees ever longer, bigger holds).
//   1 touch anywhere. 2 hold until the blades open (tutHoldSec; a ring round the finger fills), then lift.
//   3 three frozen Scraps: press below them, hold, lift. If the player's blades are out but none of them is inside,
//     they walk into the blades. 4 a row of six: the ghost shows one wide cut; the step passes once the row is gone,
//     however it was cut. 5 no ghost: tutFinishCount Scraps walk the road; once each is cut or through, it's cleared.
// Every step ends on the player's first success: nothing makes them repeat it. No Pins, thread or SHRED, and the heart
// can't be hurt. Each step has a small skip arrow (#tut-skip) for adults.
export const isTutorial = () => view.levelId === C.tutLevel;
const ghost = tut.ghost;
const ENTER = 0.45, PRESS = 0.15, REL = 0.12, MOVE = 0.4, EXIT = 0.4;   // ghost demo timing (s): arrive, press, release, glide, leave
const easeOut = k => 1 - (1 - k) * (1 - k), easeInOut = k => k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k);

// Where things go: the road's x at a screen y (level 0's road is straight, but ask the path anyway), the ghost's first
// press point, and a point in the blades of scissors held at finger (fx, fy) aiming up: d = fraction of blade length out
// from the pivot, k = fraction of the full-open half-angle.
function roadXAt(y) {
  const p = state.paths[0]; let best = 0, bd = Infinity;
  for (let k = 0; k < p.n; k++) { const d = Math.abs(p.y[k] - y); if (d < bd) { bd = d; best = k; } }
  return p.x[best];
}
const fingerY = () => view.H * C.tutFingerY;
const fingerX = () => roadXAt(fingerY());
function bladePoint(fx, fy, d, k) {
  const L = bladeReachPx(), a = k * weapon.def.maxOpenDeg * DEG;
  return [fx + Math.sin(a) * L * d, fy - C.pivotOffsetPx - Math.cos(a) * L * d];
}
// The finger point that puts a group's centre d blade-lengths out along the aim.
function fingerFor(list, d) {
  let x = 0, y = 0; for (const e of list) { x += e.x; y += e.y; }
  return [x / list.length, y / list.length + d * bladeReachPx() + C.pivotOffsetPx];
}
const practiceList = [];
function practice() {                                                   // the frozen practice Scraps (a reused list)
  practiceList.length = 0;
  for (const e of enemies) if (e.on && e.pinned) practiceList.push(e);
  return practiceList;
}

function tutScrap(x, y, k) {
  const e = spawnEnemy('scrap'); if (!e) return null;
  e.pinned = true; e.x = e.px = x; e.y = e.py = y; e.tutK = k; e.hp = e.maxHp = C.tutScrapHp; e.hitT = 0.8;
  sparks(x, y, 5, 3);
  return e;
}
function clearPractice() { for (const e of enemies) if (e.on && e.pinned) e.on = false; }

// The setups for steps 3 and 4.
function setupThree() {
  const fx = fingerX(), fy = fingerY();
  [[0.5, -0.45], [0.75, 0], [0.5, 0.45]].forEach(([d, k], i) => tutScrap(...bladePoint(fx, fy, d, k), i));
  sfx('pinPop', 0);
}
function setupRow() {                                                    // six abreast: a full-open cut takes them all
  const fx = fingerX(), fy = fingerY(), L = bladeReachPx(), y = fy - C.pivotOffsetPx - 0.8 * L;
  const half = 0.8 * L * Math.sin(weapon.def.maxOpenDeg * DEG) + 8, gap = 2 * half / 5;
  for (let i = 0; i < 6; i++) tutScrap(fx + (i - 2.5) * gap, y, i);
  sfx('pinPop', 0);
}

function tutEnter(step) {
  clearPractice();
  tut.step = step; tut.t = 0; tut.rep = 0; tut.cyc = tut.prevCyc = 0; tut.away = 0; tut.ok = false; tut.meter = 0;
  tut.walkIn = false; tut.advanceT = 0;
  if (step === 3) setupThree();
  else if (step === 4) setupRow();
  else if (step === 5) { tut.cuts = 0; tut.spawnLeft = C.tutFinishCount; tut.spawnT = 0.6; }
  planGhost();
}
// A step passed: a chime, then the next one after a beat.
function tutPass(next) { sfxSequence('waveClear'); tut.advanceT = 0.6; tut.next = next; }

// The ghost's demo for this step and repeat: a list of presses { x, y, hold (s), open (the blades open while held),
// rel (s into the demo when it lets go) }. Holds grow with each repeat.
function planGhost() {
  const hold = Math.min(C.tutGhostHoldMax, C.tutGhostHoldSec + C.tutGhostHoldGrow * tut.rep), taps = tut.taps;
  taps.length = 0;
  const fx = fingerX(), fy = fingerY();
  if (tut.step === 1) taps.push({ x: fx, y: fy, hold: 0.35 + 0.1 * Math.min(tut.rep, 4), open: false });
  else if (tut.step === 2) taps.push({ x: fx, y: fy, hold, open: true });
  else if (tut.step === 3 || tut.step === 4) {
    const list = practice();
    if (list.length) { const [x, y] = fingerFor(list, tut.step === 3 ? 0.62 : 0.8); taps.push({ x, y, hold: Math.max(hold, 1.1), open: true }); }
  }
  let t = ENTER;
  taps.forEach((p, i) => { t += PRESS + p.hold; p.rel = t; t += REL + (i < taps.length - 1 ? MOVE : EXIT); });
  tut.cycLen = Math.max(C.tutGhostCycleMs / 1000, t + 0.5);
  ghost.scale = 1 + 0.07 * Math.min(tut.rep, 4); ghost.alpha = Math.min(0.9, 0.55 + 0.08 * tut.rep);
}
// The ghost at t seconds into its demo.
function ghostPose(t) {
  const g = ghost, taps = tut.taps;
  g.a = g.down = g.sc = g.open = g.meter = 0;
  if (!taps.length) return;
  const p0 = taps[0];
  if (t < ENTER) { const k = easeOut(t / ENTER); g.x = p0.x + 70 * (1 - k); g.y = p0.y + 110 * (1 - k); g.a = k; return; }
  t -= ENTER;
  for (let i = 0; i < taps.length; i++) {
    const p = taps[i], openSec = C.tutGhostOpenMs / 1000;
    g.x = p.x; g.y = p.y; g.a = 1;
    if (t < PRESS) { g.down = t / PRESS; return; }
    t -= PRESS;
    if (t < p.hold) { g.down = 1; g.meter = t / p.hold; g.sc = Math.min(1, t / 0.25); g.open = p.open ? Math.min(1, t / openSec) : 0; return; }
    t -= p.hold;
    if (t < REL) { g.down = 1 - t / REL; g.sc = 1; return; }                    // let go: the blades snap shut
    t -= REL;
    const nx = taps[i + 1];
    if (nx) {
      if (t < MOVE) { const k = easeInOut(t / MOVE); g.x = p.x + (nx.x - p.x) * k; g.y = p.y + (nx.y - p.y) * k; g.sc = 1 - Math.min(1, t / 0.2); return; }
      t -= MOVE;
    } else {
      if (t < EXIT) { const k = t / EXIT; g.x = p.x + 40 * k; g.y = p.y + 60 * k; g.a = 1 - k; g.sc = 1 - k; }
      else g.a = 0;                                                        // gone until the next repeat
      return;
    }
  }
}
// The ghost lets go: its cut zone flashes and the practice Scraps inside it flash as if cut (they stay: they're the
// player's to cut).
function ghostCut(p) {
  const open = p.open ? Math.min(1, p.hold / (C.tutGhostOpenMs / 1000)) : 0;
  ghost.cutT = 1; ghost.cx = p.x; ghost.cy = p.y - C.pivotOffsetPx; ghost.cutOpen = open;
  if (!p.open) return;
  sfx('snip', 0);
  const L = bladeReachPx(), a = open * weapon.def.maxOpenDeg * DEG;
  for (const e of enemies) {
    if (!e.on || !e.pinned) continue;
    const rx = e.x - ghost.cx, ry = e.y - ghost.cy, d = Math.hypot(rx, ry);
    if (d <= L + e.r && Math.abs(Math.atan2(rx, -ry)) <= a + Math.atan2(e.r + C.hitPadPx, Math.max(d, 1))) { e.hitT = 0.9; sparks(e.x, e.y, 4, 2); }
  }
}
// Is e inside blades held at the current pose, opened to half-angle a?
function inBlades(e, a) {
  const p = input.pose, rx = e.x - p.x, ry = e.y - p.y, d = Math.hypot(rx, ry), reach = e.r + C.hitPadPx;
  if (d > bladeReachPx() + reach) return false;
  let off = Math.atan2(rx, -ry) - p.theta; off = Math.atan2(Math.sin(off), Math.cos(off));
  return Math.abs(off) <= a + Math.atan2(reach, Math.max(d, 1));
}

function tutUpdate(dt) {
  tut.t += dt;
  if (tut.winT > 0) { tutCelebrate(dt); return; }
  if (tut.advanceT > 0) { if ((tut.advanceT -= dt) <= 0) tutEnter(tut.next); }

  // the player's finger (or held mouse button: a mouse over the table always shows its scissors): count the hold; a
  // lift that didn't pass the step brings the ghost back sooner, one repeat on
  const grip = input.gripping && (input.usingTouch || input.mouse.held);
  if (grip !== tut.wasGrip) {
    tut.wasGrip = grip;
    if (!grip) {
      if (tut.step === 2 && tut.ok) tutPass(3);
      else if (tut.step < 5 && tut.advanceT <= 0) { tut.away = C.tutGhostReturnMs / 1000; tut.rep++; }
      tut.walkIn = false;
    }
  }
  tut.holdT = grip ? tut.holdT + dt : 0;

  // the ghost: plays while the player's hands are off, starting over each cycle (one repeat further)
  const show = tut.step < 5 && !grip && tut.away <= 0 && tut.advanceT <= 0;
  tut.vis = show ? Math.min(1, tut.vis + dt * 4) : Math.max(0, tut.vis - dt * 6);
  if (tut.away > 0 && (tut.away -= dt) <= 0) { tut.cyc = tut.prevCyc = 0; planGhost(); }
  if (show) {
    tut.cyc += dt;
    if (tut.cyc >= tut.cycLen) { tut.rep++; planGhost(); tut.cyc = tut.prevCyc = 0; }
    for (const p of tut.taps) if (tut.prevCyc < p.rel && tut.cyc >= p.rel) ghostCut(p);
  } else if (grip) tut.cyc = 0;
  tut.prevCyc = tut.cyc;
  ghostPose(tut.cyc);
  if (ghost.cutT > 0) ghost.cutT = Math.max(0, ghost.cutT - dt / 0.35);
  if (tut.advanceT > 0) return;

  switch (tut.step) {
    case 1: if (grip) tutEnter(2); break;                            // the same touch goes on counting as step 2's hold
    case 2:
      tut.meter = grip ? Math.min(1, tut.holdT / C.tutHoldSec) : 0;
      if (grip && !tut.ok && tut.holdT >= C.tutHoldSec && input.pose.spread >= C.tutHoldOpen) {
        tut.ok = true; sfx('pinPop', 0); sparks(input.pose.x, input.pose.y, 14, 3);
      }
      break;
    case 3: {
      const list = practice();
      if (!list.length) { tutPass(4); break; }
      // blades out, nothing in them: the Scraps walk in (a column up the blades) and follow them until the lift
      if (grip && input.scAlpha > 0.5) {
        const a = Math.max(visBladeAngle(), 0.12);
        if (!tut.walkIn && !list.some(e => inBlades(e, a))) tut.walkIn = true;
        if (tut.walkIn) {
          const p = input.pose, L = bladeReachPx(), step = C.tutWalkInPxPerSec * dt;
          for (const e of list) {
            const d = [0.45, 0.68, 0.9][e.tutK] || 0.6, ang = p.theta + [-0.3, 0, 0.3][e.tutK] * a;
            const tx = p.x + Math.sin(ang) * L * d, ty = p.y - Math.cos(ang) * L * d, dx = tx - e.x, dy = ty - e.y, dist = Math.hypot(dx, dy);
            e.walking = dist > 2;
            if (dist > step) { e.x += dx / dist * step; e.y += dy / dist * step; } else { e.x = tx; e.y = ty; }
            e.px = e.x; e.py = e.y;
          }
        }
      } else for (const e of list) e.walking = false;
      break;
    }
    case 4:
      if (!practice().length) tutPass(5);                              // the row is gone, however it was cut
      break;
    case 5:
      if (tut.spawnLeft > 0 && (tut.spawnT -= dt) <= 0) {
        const e = spawnEnemy('scrap');
        if (e) { e.hp = e.maxHp = C.tutScrapHp; e.speed *= C.tutWalkMult; tut.spawnLeft--; tut.spawnT = C.tutFinishGapMs / 1000; }
      }
      if (tut.cuts >= C.tutFinishCount) { tut.winT = C.tutWinMs / 1000; tut.burstT = 0; sfxSequence('waveClear'); }
      break;
  }
}
// Cleared: gold bursts for tutWinMs, then the level map.
function tutCelebrate(dt) {
  if ((tut.burstT -= dt) <= 0) {
    tut.burstT = 0.22;
    sparks(view.W * (0.2 + Math.random() * 0.6), view.H * (0.2 + Math.random() * 0.5), 16, 3);
  }
  if ((tut.winT -= dt) <= 0) finishTutorial();
}
export function tutSkip() {
  if (state.mode !== 'TUTORIAL') return;
  if (tut.winT > 0 || tut.step >= 5) { finishTutorial(); return; }
  tutEnter(tut.step + 1);
}
// Level 0 cleared (or skipped through): the tutorial is done for good, the level is recorded (its reward queues the map's
// reveal), then main.js opens the map.
function finishTutorial() {
  Save.tutorialDone = true; persist();
  state.won = true;
  state.run.stars = starsEarned();
  recordLevelResult(view.levelId, true, state.score, state.run.stars, level().unlockOnClear);
  lastReport = buildReport(); saveRun(lastReport);
  clearWorld();
  onTutorialDone();
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
let snipInZone = 0, snipKills = 0;                            // enemies in the current snip's zone / cut by it (bosses, level 0)
let snipLit = false;                                          // the current snip has shown its LIT word (once per snip)
function doSnip(px, py, theta, spread, strong) {
  if (!live() || heli.active || sewing()) return;              // the Helicopter owns the blades while it spins; a Basting drag sews, it doesn't snip
  setCutZone(px, py, theta, spread);
  // wider opening = more closing power
  const power = C.powerAtMinOpen + (1 - C.powerAtMinOpen) * clamp((spread - C.snipOpenFrom) / (1 - C.snipOpenFrom), 0, 1);
  input.last.power = power;
  fx.cut = 1; fx.flash = (strong ? 1 : 0.5) * (0.5 + 0.5 * power); fx.kick = (strong ? 1 : 0.4) * power;
  state.stats.snips++;
  if (!isTutorial()) wearBlade(weapon.id);                     // every snip attempt wears the edge a little (level 0 doesn't)
  if (input.usingTouch && Save.settings.haptics && navigator.vibrate) { try { navigator.vibrate(strong ? C.hapticMs : C.weakHapticMs); } catch (e) { /* ignore */ } }
  burst(input.pose.x, input.pose.y, strong);
  if (!isTutorial()) spawnLabel(input.pose.x, input.pose.y, strong ? LABEL_SNIP : LABEL_NICK);   // level 0 has no words
  const ax = Math.sin(theta), ay = -Math.cos(theta), pad = C.hitPadPx;
  let inZone = 0;
  // a Moth in the air (e.air) is out of reach of every snip
  for (let i = 0; i < enemies.length; i++) { const e = enemies[i]; if (e.on && !e.air && cutZoneHits(e.x, e.y, e.r, pad)) inZone++; }
  snipMulti = inZone >= C.multiSnipMin; snipInZone = inZone; snipKills = 0; snipLit = false;
  if (snipMulti) state.run.multiSnips++;
  sfxSnip(snipMulti);
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]; if (!e.on || e.air) continue;
    if (cutZoneHits(e.x, e.y, e.r, pad)) strike(e, px, py, ax, ay, cut.L, strong, power);
  }
  // the move slots: an armed Pinking Cut goes off with this snip; the snip charges Focus (clean and full-open), Seam Mark
  // (a nick that hit, or a near-miss) and Pinking (a multi-snip), whichever slots hold them. SHRED's final snap isn't a
  // manual snip: it does neither.
  if (!shredSnap) {
    const pk = slotOf.pinking;
    if (pk && pk.armed) pinkingCut(pk, px, py, ax, ay, cut.L, power);
    skillSnipCharge(strong, spread, inZone, pad);
  }
  if (snipKills > state.run.bestSnipKills) state.run.bestSnipKills = snipKills;
  if (!shredSnap && !isTutorial()) snipCritters(pad, critterSquished);   // SHRED's final snap isn't a manual snip
  if (weapon.def.curlSec && !isTutorial()) dropCurl(px + ax * cut.L * 0.55, py + ay * cut.L * 0.55, cut.L);   // Ribbon Shears: a curl on the road
}

// Ribbon Shears: every snip (hit or miss) leaves a ribbon curl on the road point nearest the cut's centre (cx, cy), if
// the road comes within a blade length (L) of it. For curlSec (the weapon's, longer at tier 3) whatever crosses within
// curlPx of it walks at curlSlow of its speed (bosses ignore it; the enemy loop checks). Pooled: a full pool replaces
// the curl closest to fading.
const curls = state.curls;
// kind: 'ribbon' (the Ribbon Shears' curl) or 'pinking' (a tier-3 Pinking Cut's trail mark, rot = the lane's heading).
for (let i = 0; i < C.curlMax; i++) curls.push({ on: false, kind: 'ribbon', x: 0, y: 0, t: 0, life: 1, slow: 1, rot: 0 });
let curlN = 0;                                                  // curls on (the enemy loop skips the check when 0)
function dropCurl(cx, cy, L) {
  let best = L * L, bx = 0, by = 0, found = false;
  for (let r = 0; r < state.paths.length; r++) {
    const p = state.paths[r];
    for (let k = 0; k < p.n; k++) { const dx = p.x[k] - cx, dy = p.y[k] - cy, d = dx * dx + dy * dy; if (d < best) { best = d; bx = p.x[k]; by = p.y[k]; found = true; } }
  }
  if (!found) return;
  placeCurl('ribbon', bx, by, weapon.def.curlSec, weapon.def.curlSlow, Math.random() * TAU);   // rot: visual only
}
// A curl (or a Pinking trail mark) at (x, y) for life seconds, slowing to `slow`: a free one, else the closest to fading.
function placeCurl(kind, x, y, life, slow, rot) {
  let c = curls[0];
  for (let i = 0; i < curls.length; i++) { if (!curls[i].on) { c = curls[i]; break; } if (curls[i].t < c.t) c = curls[i]; }
  if (!c.on) curlN++;
  c.on = true; c.kind = kind; c.x = x; c.y = y; c.t = c.life = life; c.slow = slow; c.rot = rot;
}

// A critter squished by a manual snip: its fixed Thread (never Buttons), a wet crunch, the +n flying to the counter.
// The lifetime count feeds the one-time "Squish 25" achievement.
function critterSquished(c) {
  const n = C.critters[c.kind].thread;
  state.thread += n; state.run.critterKills++;
  emit('bonus', c.x, c.y, n);
  sfx('squish', 0);
  sparks(c.x, c.y, 6, 0);
  Save.critterKills = (Save.critterKills | 0) + 1; persist();
  const th = slotOf.thimble; if (th) moveCharge(th, th.def.fishCharge);   // Thimble Guard charges on squished silverfish
}

function tooSlow() { if (live() && !heli.active && !sewing()) { fx.tooSlow = 1; sfx('thump'); } }

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
      const e = enemies[i]; if (!e.on || e.pinned || e.air || e.type.pushScale <= 0) continue;   // immovable (boss) or flying (Moth): blades pass through
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
// Armored (Brute): the first snip clangs for 0 unless e.slowed. Bosses play by their own rules (bossStrike); never shoved.
// The weapon's edge (state.sharpMult, fixed for the run) scales every snip: sharpDullMult (dull) .. sharpSharpMult (sharp).
const gradedDamage = (g, strong, power) =>
  (C.damageAtPivot + (C.damageAtTip - C.damageAtPivot) * g) * power * weapon.def.damageMult * (strong ? 1 : C.weakDamageMult) *
  state.sharpMult;
// The weak-spot bonus on a graded snip: lampMult for an enemy lit by a Lamp Pin (e.lit), lampMult again for every Stork
// Snips hit (weakAlways); the two stack. (Not the nick's weakDamageMult: that's the penalty for a slow close.)
const weakMult = e => (e.lit ? C.lampMult : 1) * (weapon.def.weakAlways ? C.lampMult : 1);
// The move slots on a graded hit: a Seam Mark's markMult (the mark is spent by the hit), a Basting Stitch's hold's
// bastingDmgMult (1 below its tier 3), from whichever slot holds each.
const skillMult = e => (e.marked && slotOf.mark ? slotOf.mark.def.markMult : 1) * (e.bastedT > 0 && slotOf.basting ? slotOf.basting.def.bastingDmgMult : 1);
let pierceArmor = false;                                        // a tier-2 Pinking Cut's lane is striking: armor doesn't stop it
function strike(e, px, py, ax, ay, L, strong, power) {
  const t = e.type;
  const rx = e.x - px, ry = e.y - py, d = Math.hypot(rx, ry) || 1;
  const g = Math.pow(clamp(d / L, 0, 1), C.gradeCurve);
  if (t.boss) { bossStrike(e, px, py, ax, ay, L, strong, power, g); return; }
  if (e.armored && !e.marked && !pierceArmor) {                 // a Seam Mark (or a tier-2 Pinking lane) goes straight through
    if (--e.armorHits <= 0) e.armored = false;                   // a layer of armor is spent either way (the cold: coldArmor layers)
    if (!e.slowed && !e.soft) { clang(e); return; }              // slowed (Ice, SHRED) or softened (Candle Pin): the snip gets through
  }
  // Button Beetle: the Cigar Cutter executes it with its centre inside the hole; it has no weak spot (flat: tip damage
  // wherever the snip lands). Kitchen Shears (pivotExecute): a Burr or Beetle (pivotTypes) within pivotZone of the pivot
  // dies outright. Scrap Snippers / Stork Snips: a hit within critZone of the pivot does critMult. Ratchet Pruners: the
  // hooked jaw holds a survivor in place for holdSec.
  const W = weapon.def;
  if (t.ringExecute && cut.slide && d <= L) { state.run.beetleExecutes++; sparks(e.x, e.y, 18, 3); killEnemy(e); return; }
  if (W.pivotExecute && !cut.slide && g <= W.pivotZone && W.pivotTypes && W.pivotTypes.includes(e.name)) {
    spawnLabel(e.x, e.y - e.r * 0.4, LABEL_CRACK); sparks(e.x, e.y, 18, 3); killEnemy(e); return;
  }
  // Burr (tipImmune): a hit out in the tip half of the blades (g >= tipImmune) does nothing; the Pruners' jaw still grabs it
  if (t.tipImmune && g >= t.tipImmune) {
    if (weapon.def.holdSec) e.holdT = Math.max(e.holdT, weapon.def.holdSec);
    spawnLabel(e.x, e.y - e.r * 0.4, LABEL_SPIKES); sparks(e.x, e.y - e.r * 0.5, 6, 0); e.hitT = 0.3; sfx('spikes');
    return;
  }
  // The crit: the pair's own (critZone) or, on an enemy lit by a tier-3 Lamp Pin, its lampCrit (the bigger, not both).
  // Then the weak-spot bonus (lit, Stork Snips) and the Candle Pin's melt (an Icicle melts iceFireMult x as fast).
  const gd = t.flat ? 1 : g, crit = !!W.critMult && gd <= W.critZone;
  const critM = Math.max(crit ? W.critMult : 1, e.lit ? e.litCrit : 1);
  const melt = e.soft ? 1 + (e.meltMult - 1) * (t.iceFireMult || 1) : 1;
  const dmg = gradedDamage(gd, strong, power) * critM * weakMult(e) * melt * skillMult(e), numG = critM > 1 ? 0 : gd;
  if (e.lit && !snipLit) { snipLit = true; spawnLabel(e.x, e.y - e.r * 0.4, LABEL_LIT); }   // once per snip: the Lamp's ring is doing it
  if (W.holdSec) e.holdT = Math.max(e.holdT, W.holdSec);
  let push = C.pushSpeed * g * power * t.pushScale;
  if (!strong) push *= C.weakPushMult;
  e.hp -= dmg;
  if (e.hp <= 0.001) { killEnemy(e); return; }                 // (a marked one's death: markDied)
  e.marked = false;                                              // the mark is spent
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
  if (e.escortOf) escortDied(e);
  if (e.marked) markDied(e);                                     // Seam Mark: it may spread, or refund the meter
  shatter(e); awardKill(e, bySnip);                              // no kill sound: the snip (or SHRED's whir) already made one
}

// Fire Pin burn tick: dmg to e, ignoring armor. Returns true if it killed e.
function burn(e, dmg) {
  if (e.type.boss && bossBlocks(e)) return false;
  dmg *= e.type.iceFireMult || 1;                                // an Icicle melts faster (the Candle Pin's meltMult is on graded snips only, strike)
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
  if (bySnip) snipKills++;
  if (state.mode === 'TUTORIAL' && !e.pinned) tut.cuts++;
  const pts = Math.round(t.score * C.enemyRanks.scoreMult[e.rank - 1] * (snipMulti ? C.multiSnipMult : 1));
  state.score += pts;
  if (!isTutorial()) spawnPopup(e.x, e.y, pts, snipMulti);
  if (state.mode !== 'TUTORIAL') {
    const pay = level().threadPerKill ?? C.threadPerKill;   // a level can trim it (its critters make up the difference)
    state.thread += pay; emit('thread', e.x, e.y, pay);
    if (bySnip && slotOf.shred) moveCharge(slotOf.shred);         // SHRED charges on snip kills (not during its spin: moveBusy)
    skillKill(e);                                                // Thimble charges on kills near the heart; Focus refunds at tier 3
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

// Armor absorbs the snip (label = LABEL_SHIELD for the Unstitcher's swarm shield).
function clang(e, buzz = true, label = LABEL_CLANG) {
  spawnLabel(e.x, e.y - e.r * 0.4, label);
  sparks(e.x, e.y - e.r * 0.7, 12, 0);
  e.hitT = 0.5;
  sfx('clang');
  if (buzz && input.usingTouch && Save.settings.haptics && navigator.vibrate) { try { navigator.vibrate(C.weakHapticMs); } catch (err) { /* ignore */ } }
}

// ======================= bosses =======================
// Full bosses come only on boss levels (the last wave is the boss alone, after its intro card); mini bosses (CONFIG.bosses
// mini: true) come as a wave entry like any type, mid-wave, with a short name banner. Each tests one skill, by its mode
// (CONFIG.bosses[name].mode, or .phases by hp for the Unstitcher; e.bdef = that entry, cached at spawn):
//   'seam'  (Seam Ripper; Skeleton Key; Snow Globe; Unstitcher phase 3): timing. Walks the road back and forth
//           (bossTurns; mini bosses and `forward` bosses straight on). Every seamEverySec its seam splits open for
//           seamOpenSec: a snip then does openDmg, otherwise closedDmg. Expert (Pinch) controls must also close the
//           blades across the seam for openDmg (expertOffSeamDmg if not). Flags: unlocks (the Key: each opening lets in
//           unlockMoths Moths by the second entrance), shake (the Globe: the opening is a shake that snows the Pins under).
//   'armor' (Brute King; Twine Ball; Bottle Cap; Unstitcher phase 2): timing + patience. Walks forward; every
//           chargeEverySec it trembles for windupSec, then charges chargePx along the road over chargeSec; the lunge knocks
//           its thimble helmet off (helmet: false = none, it's just dazed) and it stands dazed for armorDownSec while snips
//           do armorDownMult x graded damage; with the armor on they clang for 0 (needles too). Flags: rolling (the Cap: no
//           walking, it rolls again as soon as it's up, bouncing between the road's edges), captures (the Twine Ball: what
//           it rolls over is wrapped and shields it; see captureNear).
//   'swarm' (Unstitcher phase 1; Zipper; Honey Dipper): its escort Scraps hold up a shield that blocks every hit;
//           cutting the last one drops it for shieldDownSec (graded x shieldDownMult), then it returns with a fresh
//           swarm. Flags: escortLine + noRefill (the Zipper: one line of teeth behind it, then open for good), captures
//           (the Dipper: no escorts of its own; enemies that come close stick and shield it; a snip shakes one loose).
//   'trail' (Bobbin): walks and drops a Scrap behind it every spoolEverySec; graded hits always land.
// Bosses can't be slowed (Ice, SHRED) or shoved, and their hp isn't scaled per wave. Fire, needles and SHRED hurt them
// except where the rules above block it (bossBlocks).
export function bossMode(e) {
  const d = e.bdef;
  if (!d) return 'trail';                                        // no CONFIG.bosses entry: it just walks and takes graded hits
  return d.phases ? d.phases[e.bossPhase] : d.mode;
}
const expertControls = () => input.usingTouch && !holdTouch();
const OPEN_FOR_GOOD = 1e9;                                       // a noRefill swarm boss's shield, once its escorts are gone
const NO_TURNS = [];
// Would a non-snip hit (fire, needle, SHRED) bounce off right now? (armor + captures: whatever it wrapped shields it too)
const bossBlocks = e => { const m = bossMode(e); return (m === 'swarm' && e.shieldDownT <= 0) || (m === 'armor' && (e.armored || e.captives > 0)); };

function bossStrike(e, px, py, ax, ay, L, strong, power, g) {
  const def = e.bdef, mode = bossMode(e);
  if (!def) { bossSkillHurt(e, gradedDamage(g, strong, power) * weakMult(e)); return; }
  let dmg;
  if (mode === 'seam') {
    if (e.seamOpen) {
      // Expert: the closed-blade line (pivot to tip, or a slide weapon's line across its hole) must cross the seam (a
      // shaking Snow Globe has no seam line: any snip counts)
      const over = def.shake || !expertControls() || (cut.slide ? seamHit(e, px - ax * L, py - ay * L, ax, ay, 2 * L) : seamHit(e, px, py, ax, ay, L));
      dmg = over ? def.openDmg : def.expertOffSeamDmg;
      sparks(e.x + Math.cos(e.seamA) * e.r, e.y + Math.sin(e.seamA) * e.r, over ? 16 : 6, 3);
    } else dmg = def.closedDmg;
  } else if (mode === 'armor') {
    if (e.armored && !e.marked) { clang(e); return; }           // a Seam Mark ignores the armor (its markMult instead of armorDownMult)
    if (e.captives > 0) { clang(e, true, LABEL_SHIELD); return; }   // dazed, but what it wrapped shields it (cut one of those)
    dmg = gradedDamage(g, strong, power) * weakMult(e) * (e.armored ? 1 : def.armorDownMult);
    bossSkillHurt(e, dmg);
    // the Ratchet Pruners' 3x bite ending a full boss's armored phase (its death, or the Unstitcher into phase 3)
    if (weapon.id === 'pruners' && !def.mini && (!e.on || (def.phaseAt && e.hp / e.maxHp <= def.phaseAt[1]))) state.run.prunerBite = true;
    return;
  } else if (mode === 'trail') {
    dmg = gradedDamage(g, strong, power) * weakMult(e) * (def.hitMult || 1);
    if (e.spoolWarn) { e.swarmT = 0; e.spoolWarn = false; sparks(e.x, e.y, 10, 3); }   // caught mid-spool: that Scrap never comes
  } else {
    if (e.shieldDownT <= 0) {
      if (def.captures) shakeLoose(e);                           // the Honey Dipper: the snip shakes one stuck enemy loose
      clang(e, true, LABEL_SHIELD); return;
    }
    dmg = gradedDamage(g, strong, power) * weakMult(e) * def.shieldDownMult;
  }
  bossSkillHurt(e, dmg);
}
// A snip that landed on a boss: x a Seam Mark (spent) and a Basting hold (mini bosses only).
function bossSkillHurt(e, dmg) { bossHurt(e, dmg * skillMult(e)); if (e.on) e.marked = false; }
function bossHurt(e, dmg) {
  e.hp -= dmg;
  if (e.hp <= 0.001) { killEnemy(e); return; }
  sfx('rip');
  spawnNumber(e.x, e.y - e.r, Math.round(dmg * 10) / 10, 0);
  e.hitT = Math.min(1, 0.35 + dmg * 0.15);
  sparks(e.x, e.y, 8, 1);
}

// Per frame, instead of walking like the others. step = this frame's share of the road at its own speed.
function bossMove(e, dt, step) {
  const def = e.bdef;
  if (!def) { e.u += step; return; }
  if (def.phaseAt) {                                             // the Unstitcher: its phase by hp (def.phases)
    const f = e.hp / e.maxHp, ph = f <= def.phaseAt[1] ? 2 : f <= def.phaseAt[0] ? 1 : 0;
    if (ph !== e.bossPhase) {                                     // next phase: roar, reset its clocks, armor on for an armor phase
      e.bossPhase = ph; e.seamT = e.chargeT = e.swarmT = e.armorDownT = e.shieldDownT = 0; e.seamOpen = e.seamWarn = false;
      e.armored = def.phases[ph] === 'armor'; tweens.cancel(e); e.charging = e.windup = false; e.helmPh = 0;
      sfx(def.roar, 0); addShake(10, 12); sparks(e.x, e.y, 24, 3);
    }
  }
  if (def.captures) e.captives = countEscorts(e);
  const mode = bossMode(e);
  if (mode === 'armor') {
    if (e.armorDownT > 0) {
      // helmet off: it stands dazed while the helmet tumbles off (helmFlySec), lies beside it, and is picked back up
      // (the last helmPickupSec); the charge clock keeps counting. Without a helmet (helmPh stays 0) it is just dazed.
      e.armorDownT = Math.max(0, e.armorDownT - dt); e.helmT += dt; e.chargeT += dt;
      if (e.helmPh === 1 && e.helmT >= C.helmFlySec) {
        e.helmPh = 2; e.helmT = 0; sfx('helmetLand', 0);
        sparks(e.x + e.helmSide * C.helmLand[0] * e.r, e.y + C.helmLand[1] * e.r, 6, 3);
      }
      if (e.helmPh === 2 && e.armorDownT <= C.helmPickupSec) { e.helmPh = 3; e.helmT = 0; }
      if (e.armorDownT <= 0) { e.helmPh = 0; e.helmT = 0; e.armored = true; sfx(def.helmet === false ? 'clink' : 'helmetOn', 0); }
      return;
    }
    e.armored = true;
    if (e.charging) {
      // the lunge: a burst of speed that swells and fades (sine-shaped) so it covers chargePx in chargeSec. chargeT
      // counts the lunge's own time here.
      const T = def.chargeSec, t = Math.min(T, e.chargeT + dt), len = state.paths[e.route].len;
      const du = def.chargePx / len * (Math.cos(Math.PI * e.chargeT / T) - Math.cos(Math.PI * t / T)) / 2;
      e.u = Math.min(1, e.u + du);
      e.spin += du * len / e.r;                                  // a rolling boss turns as it goes (render.js)
      e.chargeT = t;
      if (def.rolling) rollBounce(e, dt);
      if (def.captures) captureNear(e, def, 0, e.chargeN);       // the Twine Ball wraps what it rolls over, tagged by this charge
      if (t >= T) { e.chargeT = 0; chargeDone(e); }
      return;
    }
    if (def.rolling) { e.charging = true; e.chargeT = 0; e.chargeN++; sfx('capRoll', 0); return; }   // back up: off it rolls again
    e.u += step;
    const wasWindup = e.windup;
    e.windup = (e.chargeT += dt) >= def.chargeEverySec - def.windupSec;   // trembling: a lunge is coming
    if (e.windup && !wasWindup) { sfx('kingWindup', 0); if (def.feedType) feed(e, def); }
    if (e.chargeT >= def.chargeEverySec) {
      e.chargeT = 0; e.charging = true; e.windup = false; e.chargeN++;
      sfx('thump', 0); addShake(6, 10);
    }
    return;
  }
  if (mode === 'trail') {                                        // the Bobbin: walks on, a Scrap off the spool every spoolEverySec
    e.u += step;
    e.spoolWarn = (e.swarmT += dt) >= def.spoolEverySec - def.spoolWarnSec;
    if (e.swarmT >= def.spoolEverySec) { e.swarmT = 0; e.spoolWarn = false; spool(e, def); }
    return;
  }
  // 'seam' and 'swarm': forward to each bossTurns point, back, then on to the workshop (mini / forward bosses: straight on)
  const turns = def.mini || def.forward ? NO_TURNS : C.bossTurns;
  const target = e.leg < turns.length ? turns[e.leg] : 1;
  e.u = e.u < target ? Math.min(target, e.u + step) : Math.max(target, e.u - step);
  if (e.u === target && e.leg < turns.length) e.leg++;
  e.seamA = (e.seamA + TAU * dt / C.seamPeriodSec) % TAU;
  if (mode === 'seam') {
    // its timing: seamEverySec / seamOpenSec (the Skeleton Key's unlockEverySec / unlockSec, the Snow Globe's shakeEverySec / shakeSec)
    const per = def.shakeEverySec || def.unlockEverySec || def.seamEverySec, open = def.shakeSec || def.unlockSec || def.seamOpenSec;
    const ph = (e.seamT += dt) % per, was = e.seamOpen;
    e.seamOpen = ph >= per - open;
    e.seamWarn = !e.seamOpen && ph >= per - open - def.seamWarnSec;
    if (e.seamOpen && !was) seamOpened(e, def);
  } else if (def.captures) {
    captureNear(e, def, def.stickPx, 0);                         // the Honey Dipper: what comes close sticks...
    e.shieldDownT = e.captives > 0 ? 0 : 1;                       // ...and shields it while anything is stuck
  } else if (e.shieldDownT > 0) {
    e.shieldDownT = Math.max(0, e.shieldDownT - dt);            // shield down: the swarm clock waits
  } else if (def.noRefill && e.swarmDone) {
    if (!escortAt(e, -1)) e.shieldDownT = OPEN_FOR_GOOD;          // the Zipper's teeth are gone (however they went): open for good
  } else if ((e.swarmT += dt) >= def.swarmEverySec || !escortAt(e, -1)) {
    // shield up: a fresh swarm at once when it has none (its first, or back from being broken), else a refill
    e.swarmT = 0;
    // a Scrap swarm escorting it on its road, just ahead and behind (the Zipper: all behind, in a line), kept with it
    // until it dies, so a wide snip on the boss catches some: the multi-snip it needs. Only empty places are filled.
    const half = Math.ceil(def.swarmSize / 2), len = state.paths[e.route].len;
    let made = 0;
    for (let i = 0; i < def.swarmSize; i++) {
      if (escortAt(e, i)) continue;
      const s = spawnEnemy('scrap'); if (!s) break;
      setRoute(s, e.route); s.escortOf = e; s.escortGen = e.gen; s.escortSlot = i;
      s.escortOff = (def.escortLine ? -(1 + i) : i < half ? -(1 + i) : 1 + i - half) * def.swarmGapPx / len;
      s.u = clamp(e.u + s.escortOff, 0, 0.999); pathPoint(s); s.x = s.px; s.y = s.py;
      made++;
    }
    if (made) e.swarmDone = true;
    sfx('pinPop', 0); sparks(e.x, e.y, 10, 2);
  }
}
// A seam boss's seam opens: the chirp (or its own sound), plus the Snow Globe's shake and the Skeleton Key's Moths.
function seamOpened(e, def) {
  sfx(def.openSfx || 'seamOpen', 0);
  if (def.shake) {                                               // the screen shakes and every built Pin is snowed under (off)
    addShake(def.shakePx, def.shakePx);
    for (const t of towers) if (t.on) t.snowedT = def.snowSec;
    sparks(e.x, e.y - e.r, 14, 0);
  }
  if (def.unlocks) {                                             // a burst of Moths by the level's second entrance (else its only one)
    const entry = (level().entries || 1) > 1 ? 1 : 0;
    for (let i = 0; i < def.unlockMoths; i++) {
      const m = spawnEnemy('moth', entry); if (!m) break;
      m.u = i * 0.012; m.seg = 0; pathPoint(m); m.x = m.px; m.y = m.py;
    }
  }
}
// The Twine Ball winds up: feedCount feedType enemies tumble onto its road feedAheadPx ahead of it (evenly from the near
// end to the far one), stunned till the charge has passed, right where it will roll over and wrap them (it comes alone
// as its level's last wave).
function feed(e, def) {
  const len = state.paths[e.route].len, [near, far] = def.feedAheadPx;
  for (let i = 0; i < def.feedCount; i++) {
    const s = spawnEnemy(def.feedType); if (!s) break;
    setRoute(s, e.route);
    s.u = Math.min(0.98, e.u + (near + (far - near) * (def.feedCount > 1 ? i / (def.feedCount - 1) : 0)) / len);
    s.holdT = def.windupSec + def.chargeSec;                     // they land in a heap and lie there till the charge comes
    pathPoint(s); s.x = s.px; s.y = s.py; sparks(s.x, s.y, 5, 3);
  }
  sfx('spool', 0);
}
// The Bobbin drops a Scrap spoolBackPx behind it on its own road (pooled like any enemy; a full pool skips one).
function spool(e, def) {
  const s = spawnEnemy('scrap'); if (!s) return;
  setRoute(s, e.route); s.u = Math.max(0, e.u - def.spoolBackPx / state.paths[e.route].len);
  pathPoint(s); s.x = s.px; s.y = s.py;
  sfx('spool', 0); sparks(s.x, s.y, 5, 3);
}
// Puts e on route r (an escort or a dropped Scrap joining its boss's road), at that road's walking speed.
function setRoute(e, r) {
  if (e.route === r) return;
  e.route = r; e.seg = 0;
  if (!isTutorial()) e.speed = C.traverseRefLen / (e.type.traverseSec * state.paths[r].lenU) * C.enemyRanks.speedMult[e.rank - 1];
}
// Captures (the Honey Dipper, the Twine Ball): a regular enemy (not a boss, an escort, a practice Scrap or one in the
// air) within gap of boss b's edge becomes its escort, up to maxCaptures, in the next free place around it (ahead and
// behind, swarmGapPx apart), riding along at its speed. tag = the Twine Ball's charge number (what one cut frees).
function captureNear(b, def, gap, tag) {
  for (let i = 0; i < enemies.length && b.captives < def.maxCaptures; i++) {
    const s = enemies[i];
    if (!s.on || s.type.boss || s.escortOf || s.pinned || s.air || state.clock < s.freeAt) continue;   // (freeAt: just shaken / cut loose)
    const reach = b.r + s.r + gap;
    if ((s.x - b.x) * (s.x - b.x) + (s.y - b.y) * (s.y - b.y) > reach * reach) continue;
    let slot = 0;
    while (escortAt(b, slot)) slot++;
    tweens.cancel(s); s.pulling = false; s.holdT = 0; s.pvx = s.pvy = 0;
    setRoute(s, b.route);
    s.escortOf = b; s.escortGen = b.gen; s.escortSlot = slot; s.wrapCharge = tag;
    s.escortOff = (slot & 1 ? 1 : -1) * (1 + (slot >> 1)) * def.swarmGapPx / state.paths[b.route].len;
    b.captives++;
    sfx(bossMode(b) === 'armor' ? 'wrap' : 'stick', 0); sparks(s.x, s.y, 6, 3);
  }
}
// A captured enemy drops back on the road where it is and walks on; nothing catches it again for the boss's unstickSec.
function release(s) { const b = s.escortOf; s.escortOf = null; s.escortSlot = -1; s.wrapCharge = 0; s.freeAt = state.clock + ((b && b.bdef && b.bdef.unstickSec) || 0); }
// The Honey Dipper is snipped while something is stuck to it: the last one stuck shakes loose.
function shakeLoose(b) {
  let last = null;
  for (let k = 0; k < enemies.length; k++) {
    const s = enemies[k];
    if (s.on && s.escortOf === b && s.escortGen === b.gen && (!last || s.escortSlot > last.escortSlot)) last = s;
  }
  if (!last) return;
  release(last); b.captives = Math.max(0, b.captives - 1);
  sparks(last.x, last.y, 8, 3); sfx('stick', 0);
}
// Live escorts of boss b (its swarm, its teeth, what it has caught).
function countEscorts(b) {
  let n = 0;
  for (let k = 0; k < enemies.length; k++) { const s = enemies[k]; if (s.on && s.escortOf === b && s.escortGen === b.gen) n++; }
  return n;
}
// Is escort place i (of the swarm around boss e; -1 = any place) taken by a live Scrap?
function escortAt(e, i) {
  for (let k = 0; k < enemies.length; k++) {
    const s = enemies[k];
    if (s.on && s.escortOf === e && s.escortGen === e.gen && (i < 0 || s.escortSlot === i)) return true;
  }
  return false;
}
// An escort died (cut, burnt, needled, shredded): if it was the last one round a shielded swarm boss, the shield drops
// (for good for a noRefill one); a Twine Ball's wrapped enemy frees everything wrapped on that same charge.
function escortDied(s) {
  const b = s.escortOf;
  if (!b.on || b.gen !== s.escortGen || !b.bdef) return;
  const def = b.bdef;
  if (def.captures) {
    if (bossMode(b) === 'armor') {
      let freed = 0;
      for (let k = 0; k < enemies.length; k++) {
        const o = enemies[k];
        if (o.on && o.escortOf === b && o.escortGen === b.gen && o.wrapCharge === s.wrapCharge) { release(o); freed++; sparks(o.x, o.y, 6, 3); }
      }
      if (freed) sfx('armorOff', 0);
    }
    b.captives = countEscorts(b);
    return;
  }
  if (bossMode(b) !== 'swarm' || b.shieldDownT > 0 || escortAt(b, -1)) return;
  b.shieldDownT = def.noRefill ? OPEN_FOR_GOOD : def.shieldDownSec; b.swarmT = 0;
  sfx('armorOff', 0); sparks(b.x, b.y, 20, 3); addShake(5, 8);
}
// The lunge is over: it knocks its thimble helmet off (to alternating sides; none for helmet: false) and the armor is
// down for armorDownSec.
function chargeDone(e) {
  const def = e.bdef;
  e.charging = false; e.armorDownT = def.armorDownSec; e.armored = false;
  if (def.helmet === false) { sfx('armorOff', 0); sparks(e.x, e.y - e.r * 0.6, 10, 3); return; }   // just dazed (render.js stars)
  e.helmPh = 1; e.helmT = 0; e.helmSide = e.helmSide > 0 ? -1 : 1;
  sfx('armorOff', 0); sparks(e.x, e.y - e.r * 0.8, 12, 3);
}
// The Bottle Cap mid-roll: its sideways place on the road (e.side, world px) bounces between the road's edges.
function rollBounce(e, dt) {
  const max = Math.max(0, level().roadHalfWidth * view.L - e.r * 0.3);
  e.side += e.sideV * dt;
  if (e.side > max || e.side < -max) { e.side = clamp(e.side, -max, max); e.sideV = -e.sideV; sfx('clink', 80); sparks(e.x, e.y, 4, 0); }
  roadNormal(e); e.ox = NRM.x * e.side; e.oy = NRM.y * e.side;
}

// ======================= special: Helicopter =======================
// SHRED is a move like the Skills (the moves section below): it sits in whichever slot the player gave it, and its slot
// (slotOf.shred) holds its charge and armed state; the spin itself (heli) is one at a time.
// Charged by snip kills (shredDef().charge = its slot's need). Snap fully open (outBack), spin shredDef().turns full turns
// (inOutSine; 1 at tier 0, more as SHRED is bought up in the Sewing Box's Moves tab) hitting everything within blade
// reach every heliTickMs, then snap shut into a normal full-open snip. The pivot still follows the hand; spread and aim don't.
const HELI_OPEN = { spread: 1 }, HELI_SHUT = { spread: 0 };
const shredReady = () => { const s = slotOf.shred; return !!s && live() && !heli.active && s.charge >= MOVE_FULL; };
// Start the spin now (the extra finger, the slot's key while gripping, or the press an armed SHRED waited for).
export function trySpecial() {
  const s = slotOf.shred;
  if (!shredReady() || !input.gripping || input.scAlpha < 0.5) return;
  s.armed = s.go = false; s.charge = 0; s.uses++;
  heli.active = true; heli.phase = 'open'; input.scAlpha = 1; heli.spread = input.pose.spread; heli.rot = 0;
  heli.theta0 = input.pose.theta; heli.tick = 0; heli.bannerT = 1; state.run.specials++;
  tween(heli, HELI_OPEN, C.heliOpenMs, easing.outBack, heliSpin, 'heli');
}
function heliSpin() {
  heli.phase = 'spin';
  sfx('heliWhir', 0);
  const turns = shredDef().turns;                                // SHRED's bought tier (CONFIG.shredTiers)
  tween(heli, { rot: TAU * turns }, C.heliTurnMs * turns, easing.inOutSine, heliClose, 'heli');
}
function heliClose() { heli.phase = 'close'; tween(heli, HELI_SHUT, C.heliCloseMs, easing.linear, heliDone, 'heli'); }
let shredSnap = false;                                          // doSnip is SHRED's final snap (critters ignore it)
function heliDone() {
  const theta = heli.theta0 + heli.rot;
  heli.active = false; heli.phase = ''; heli.spread = 0;
  resetSnipBuffer();
  shredSnap = true;
  doSnip(input.pose.x, input.pose.y, theta, 1, true);            // the final snap-close is a normal full-open snip
  shredSnap = false;
  addShake(C.heliFinalShakePx, C.heliFinalShakePx);
}
// SHRED's badge tapped while full (slot m): arm it (the next press on the table starts the spin there); tapped again:
// disarm. Returns whether it is armed now.
function armShred(m) {
  if (!shredReady()) { m.armed = m.go = false; return false; }
  m.armed = !m.armed; m.go = false;
  if (m.armed) disarmOthers(m);                                  // one move armed at a time
  return m.armed;
}
// A new hand on the table: an armed SHRED starts there; an armed Seam Mark marks there, an armed Basting Stitch starts its drag.
function onPress() { for (let i = 0; i < moves.length; i++) if (moves[i].armed) moves[i].go = true; }

// One spin tick: 1 damage to everything within blade reach, ignoring armor; leaves them slowed for a while.
function heliTick() {
  const p = input.pose, reach = spinReachPx();
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]; if (!e.on || e.air || Math.hypot(e.x - p.x, e.y - p.y) > reach + e.r) continue;   // a Moth in the air: out of reach
    if (e.type.boss && bossBlocks(e)) continue;
    e.hp -= C.heliTickDamage;
    if (!e.type.boss) { e.slowT = C.heliSlowSec; e.slowed = true; }        // bosses can't be slowed
    snipMulti = false;
    if (e.hp <= 0.001) { killEnemy(e); continue; }
    sfx('rip', 60);
    spawnNumber(e.x, e.y - e.r, C.heliTickDamage, 0.5);
    e.hitT = Math.min(1, 0.35 + C.heliTickDamage * 0.4);
  }
}

// ======================= the moves: two slots, SHRED and the Skills =======================
// docs/worlds.md "Skills": two free move slots (state.moves), each holding SHRED or any Skill the level allows, picked
// on the weapon screen (Save.moves; skills.js setMove), the same move never in both. SHRED is in play from its level on
// (CONFIG.shredFrom, shredAllowed), a Skill from its own (CONFIG.skillFrom, skillAllowed). Every number comes from the
// slot's def (SHRED: shredDef; a Skill: skills.js skillDef at the tier bought; cached at the run's start). A slot's meter
// (m.charge 0..1) fills by its move's own events (moveCharge: each adds 1 / m.need), never while its effect is on
// (moveBusy; refunds aside). A full meter tapped (actionBar.js) or its key (E slot 1, F slot 2): useMove(i). Only one
// slot is armed at a time. The code is the same for both slots: an effect finds its slot through slotOf[id].
//   shred    charged by snip kills (strike); armed, the next press starts the spin (trySpecial; the Helicopter above).
//   focus    charged by clean full-open snips (skillSnipCharge); goes off at once: the world runs at focusSlow for
//            focusSec (update scales the world's dt right where hit-stop freezes it; input and the blades keep real
//            time); tier 3: kills during it refund the meter (skillKill).
//   thimble  charged by kills within thimbleNearPx of the heart (skillKill) and squished silverfish (critterSquished);
//            goes off at once: state.thimble stops, asked first by reachWorkshop (thimbleStop; big bosses aside).
//   mark     charged by nicks that hit and near-misses (skillSnipCharge); armed, the next press on an enemy marks it
//            (tryMark); strike / bossStrike: markMult x, armor ignored, then spent; a marked death: markDied.
//   pinking  charged by multi-snips (skillSnipCharge); armed, the next snip also cuts the lane (pinkingCut, from doSnip).
//   basting  no meter: armed while bastingCost Thread is there; the next press starts a drag (skillInput) and lifting
//            sews a stitch where the drag crossed the road (finishSew); the enemy loop holds the first to reach it (stitchHold).
export const skillAllowed = id => !!C.skills[id] && !isTutorial() && introduced(C.skillFrom[id]);
// A Skill that appears for the first time on this level (the weapon screen says NEW HERE and gives it a slot).
export const skillIsNew = id => C.skillFrom[id] === view.levelId;
// Whether move id (SHRED or a Skill) is in play on this level.
export const moveAllowed = id => id === 'shred' ? shredAllowed() : skillAllowed(id);
// Slot i's move this run: the one picked on the weapon screen (Save.moves[i]), if this level allows it ('' = empty).
function pickMove(i) { const id = Save.moves[i]; return id && moveAllowed(id) ? id : ''; }
// The slot that holds move id this run, or null.
export const moveSlot = id => slotOf[id] || null;
const MOVE_FULL = 0.999;
function newSlot(i) {
  return { i, id: '', def: null, need: 0, charge: 0, armed: false, go: false, uses: 0, marksLeft: 0, focusT: 0, bannerT: 0,
    laneT: 0, lx0: 0, ly0: 0, lx1: 0, ly1: 0, lw: 0, sewing: false, sx: 0, sy: 0, ex: 0, ey: 0 };
}
// Put move id ('' = none) in slot m, uncharged and unarmed. The move it held stops (its effects end) unless it went to
// the other slot.
function setSlot(m, id) {
  const old = m.id;
  if (old && slotOf[old] === m) { slotOf[old] = null; endEffects(old); }
  m.id = id; cacheDef(m);
  m.charge = 0; m.uses = 0; m.armed = m.go = m.sewing = false; m.marksLeft = 0; m.focusT = 0; m.bannerT = 0; m.laneT = 0;
  if (id) slotOf[id] = m;
}
// The slot's numbers for its move at the tier bought (SHRED: its need = shredDef().charge snip kills).
function cacheDef(m) {
  const id = m.id;
  m.def = id === 'shred' ? shredDef() : id ? skillDef(id) : null;
  m.need = id === 'shred' ? m.def.charge : m.def ? m.def.need : 0;
}
// A move left the slots (the workbench, or a new run): what it left on the board goes.
function endEffects(id) {
  if (id === 'thimble') { state.thimble = 0; state.thimbleHitT = 0; }
  else if (id === 'basting') { for (const s of stitches) s.on = false; stitchN = 0; }
  else if (id === 'mark') for (const e of enemies) e.marked = false;
}
const sewing = () => { const b = slotOf.basting; return !!b && b.sewing; };   // a Basting drag is under way (snips wait)
// Its effect is on (no charge builds): SHRED spinning, Focus running, the Thimble up, Seam Mark marks still to place.
const moveBusy = m => m.id === 'shred' ? heli.active : m.focusT > 0 || m.marksLeft > 0 || (m.id === 'thimble' && state.thimble > 0);
function moveCharge(m, n = 1) {
  if (!m.need || moveBusy(m) || !live()) return;
  m.charge = Math.min(1, m.charge + n / m.need);
}
function moveRefund(m, f) { if (f > 0) m.charge = Math.min(1, m.charge + f); }
// Whether slot m's badge can be used now: SHRED and most Skills on a full meter with nothing on, Basting while its Thread
// is there, Seam Mark while marks are left to place.
export function moveReady(m) {
  if (!live() || !m.id) return false;
  if (m.id === 'shred') return shredReady();
  if (m.id === 'basting') return state.thread >= m.def.bastingCost;
  if (m.marksLeft > 0) return true;
  return m.charge >= MOVE_FULL && !moveBusy(m);
}
// Slot i's badge tapped (actionBar.js): SHRED arms (the next press spins); Focus and Thimble go off at once; Mark, Pinking
// and Basting arm (tapped again: disarm). Returns whether it is armed now.
export function useMove(i) {
  const m = moves[i];
  if (!m || !m.id) return false;
  return m.id === 'shred' ? armShred(m) : armSkill(m);
}
// Slot i's key (E slot 1, F slot 2): as a tap on its badge, except SHRED spins at once when the scissors are in hand.
export function keyMove(i) {
  const m = moves[i];
  if (m && m.id === 'shred' && input.gripping && input.scAlpha >= 0.5) { trySpecial(); return; }
  useMove(i);
}
// The extra finger while gripping: SHRED, whichever slot holds it, spins at once.
function fingerMove() { if (slotOf.shred) trySpecial(); }
// Arming slot m disarms the other (a Basting drag under way finishes first).
function disarmOthers(m) {
  for (let i = 0; i < moves.length; i++) { const o = moves[i]; if (o !== m && !o.sewing) o.armed = o.go = false; }
}
function armSkill(m) {
  if (heli.active || !moveReady(m)) { if (!m.sewing) m.armed = m.go = false; return false; }
  if (m.id === 'focus') { fireFocus(m); return false; }
  if (m.id === 'thimble') { fireThimble(m); return false; }
  m.armed = !m.armed; m.go = false; m.sewing = false;
  if (m.armed) disarmOthers(m);                                  // one move armed at a time
  return m.armed;
}
function skillUsed(m) { m.uses++; m.bannerT = 1; }
function fireFocus(m) { m.charge = 0; m.focusT = m.def.focusSec; skillUsed(m); sfx('focusIn', 0); }
function fireThimble(m) {
  m.charge = 0; state.thimble = m.def.thimbleStops; state.thimbleHitT = 1; skillUsed(m); sfx('thimble', 0);
  const h = heartPoint(); sparks(h.x, h.y, 14, 3);
}
// The heart pad's centre (every route ends on it), in one reused object.
const HEART = { x: 0, y: 0 };
function heartPoint() { const p = state.paths[0]; HEART.x = p.x[p.n - 1]; HEART.y = p.y[p.n - 1]; return HEART; }
// clearWorld: nothing armed or running, nothing on the board (the charges are reset by setSlot at the run's start).
function clearMoves() {
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    m.armed = m.go = m.sewing = false; m.marksLeft = 0; m.focusT = 0; m.bannerT = 0; m.laneT = 0;
  }
  state.thimble = 0; state.thimbleHitT = 0;
  for (const s of stitches) s.on = false;
  stitchN = 0;
}
// The Skill slots' timers (real time: Focus runs on it), once per unfrozen frame.
function tickMoves(dt, ms) {
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    if (m.focusT > 0) m.focusT = Math.max(0, m.focusT - dt);
    m.bannerT = Math.max(0, m.bannerT - ms / C.skillBannerMs);
    m.laneT = Math.max(0, m.laneT - ms / C.skillLaneMs);
  }
}
// Tailor's Focus running: the world's dt is scaled by this (1 otherwise).
const focusScale = () => { const f = slotOf.focus; return f && f.focusT > 0 ? f.def.focusSlow : 1; };
// A manual snip's charge (doSnip), for whichever slots hold these: Focus = a clean one (strong, from fullOpen, hit
// something), Pinking = a multi-snip, Seam Mark = a nick that hit, or a snip that hit nothing with an enemy within
// markNearPx of its cut zone.
function skillSnipCharge(strong, spread, inZone, pad) {
  const f = slotOf.focus, pk = slotOf.pinking, mk = slotOf.mark;
  if (f && strong && inZone > 0 && spread >= f.def.fullOpen) moveCharge(f);
  if (pk && snipMulti) moveCharge(pk);
  if (mk) {
    if (inZone > 0) { if (!strong) moveCharge(mk); return; }
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.on && !e.air && cutZoneHits(e.x, e.y, e.r, pad + mk.def.markNearPx)) { moveCharge(mk); return; }
    }
  }
}
// A kill (awardKill): Thimble charges when it was near the heart; a tier-3 Focus refunds while it runs.
function skillKill(e) {
  const f = slotOf.focus, th = slotOf.thimble;
  if (f && f.focusT > 0) moveRefund(f, f.def.refund);
  if (th) { const h = heartPoint(), dx = e.x - h.x, dy = e.y - h.y, r = th.def.thimbleNearPx; if (dx * dx + dy * dy <= r * r) moveCharge(th); }
}

// Thimble Guard: an enemy reached the capped heart pad. It pops with a clink (no damage, no thread, not a kill); a tier-2
// thimble bumps it back thimbleBumpU up its road instead (the Magnet's tween on u, then dazed thimbleBumpHold); a mini
// boss is always bumped, never popped.
function thimbleStop(e) {
  const d = slotOf.thimble.def, du = d.thimbleBumpU * C.traverseRefLen / state.paths[e.route].lenU;
  state.thimble--; state.thimbleHitT = 1;
  sfx('thimble', 0); sparks(e.x, e.y, 10, 3);
  if (e.type.boss) { e.u = Math.max(0, 0.999 - du); e.seg = 0; e.holdT = Math.max(e.holdT, d.thimbleBumpHold); return; }
  if (d.bump && !e.escortOf) {
    tweens.cancel(e); e.u = 0.999; e.pulling = true; e.pvx = e.pvy = 0; e.pullHold = d.thimbleBumpHold;
    tween(e, { u: Math.max(0, 0.999 - du) }, d.thimbleBumpMs, easing.outCubic, pullDone, e);
    return;
  }
  e.on = false; tweens.cancel(e); e.pulling = false; e.marked = false;
  if (e.escortOf) escortDied(e);
  shatter(e);
}

// Seam Mark: the enemy nearest the press (x, y) within markTapPx of its edge takes a chalk mark (not one in the air, a
// practice Scrap or one already marked). The first mark of a use empties the meter and leaves marks - 1 more to place
// (tier 3) before it disarms. A press on nothing leaves it armed.
function tryMark(m, x, y) {
  const d = m.def;
  let best = null, bd = Infinity;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.on || e.air || e.pinned || e.marked) continue;
    const dd = Math.hypot(e.x - x, e.y - y) - e.r;
    if (dd <= d.markTapPx && dd < bd) { bd = dd; best = e; }
  }
  if (!best) return;
  if (m.marksLeft <= 0) { m.charge = 0; m.marksLeft = d.marks; skillUsed(m); }
  best.marked = true; m.marksLeft--;
  if (m.marksLeft <= 0) m.armed = false;
  sfx('chalk', 0); sparks(best.x, best.y, 8, 0);
}
// A marked enemy died (however): tier 2 refunds the meter, tier 1 passes the mark to up to markSpreadMax unmarked
// neighbours within markSpreadPx.
function markDied(e) {
  e.marked = false;
  const m = slotOf.mark;
  if (!m) return;
  const d = m.def, r2 = d.markSpreadPx * d.markSpreadPx;
  moveRefund(m, d.markRefund);
  if (!d.spread) return;
  for (let i = 0, n = 0; i < enemies.length && n < d.markSpreadMax; i++) {
    const o = enemies[i], dx = o.x - e.x, dy = o.y - e.y;
    if (!o.on || o.marked || o.air || o.pinned || dx * dx + dy * dy > r2) continue;
    o.marked = true; n++; sparks(o.x, o.y, 5, 0);
  }
}

// Pinking Cut: the armed snip (pivot px, py, aim ax, ay, blade length L) also cuts a lane pinkingLen on from the blade
// tips along the aim, pinkingW wide: everything it touches that the snip itself didn't (not in the air or a practice
// Scrap) takes a strike at the tip grade (strike: past the tips, g = 1), through armor at tier 2 (bosses keep their
// rules). Tier 3 leaves trail marks on the road along it (curls of kind 'pinking'). render.js flashes the zigzag.
function pinkingCut(m, px, py, ax, ay, L, power) {
  const d = m.def, x0 = px + ax * L, y0 = py + ay * L, x1 = x0 + ax * d.pinkingLen, y1 = y0 + ay * d.pinkingLen, half = d.pinkingW / 2;
  m.armed = false; m.charge = 0; skillUsed(m); sfx('pinking', 0);
  m.laneT = 1; m.lx0 = x0; m.ly0 = y0; m.lx1 = x1; m.ly1 = y1; m.lw = d.pinkingW;
  pierceArmor = d.armor;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.on || e.air || e.pinned || cutZoneHits(e.x, e.y, e.r, C.hitPadPx)) continue;   // the snip itself had it
    const rr = half + e.r;
    if (segDistSq(e.x, e.y, x0, y0, x1, y1) > rr * rr) continue;
    sparks(e.x, e.y, 4, 3);
    strike(e, px, py, ax, ay, L, true, power);
  }
  pierceArmor = false;
  if (d.trail) {
    const rot = Math.atan2(ay, ax), reach = level().roadHalfWidth * view.L + C.curlPx;
    for (let s = d.pinkingTrailGapPx / 2; s < d.pinkingLen; s += d.pinkingTrailGapPx) {
      const tx = x0 + ax * s, ty = y0 + ay * s;
      if (nearRoad(tx, ty, reach)) placeCurl('pinking', tx, ty, d.pinkingTrailSec, d.pinkingTrailSlow, rot);
    }
  }
}
function nearRoad(x, y, r) {
  const r2 = r * r;
  for (let k = 0; k < state.paths.length; k++) {
    const p = state.paths[k];
    for (let i = 0; i < p.n; i++) { const dx = p.x[i] - x, dy = p.y[i] - y; if (dx * dx + dy * dy <= r2) return true; }
  }
  return false;
}

// Basting Stitch: the stitches across the road (pooled; a full pool replaces the oldest). { on, x, y (the crossing),
// ax, ay, bx, by (the line's ends, across the road), holds (enemies it will still hold), held (so far), sec (how long it
// holds each, from its slot's def as sewn), t (seconds since sewn), fraying (all used, or bastingLifeSec unused), fray
// 1 -> 0 (fading away) }.
const stitches = state.stitches;
for (let i = 0; i < C.skills.basting.bastingMax; i++) stitches.push({ on: false, x: 0, y: 0, ax: 0, ay: 0, bx: 0, by: 0, holds: 0, held: 0, sec: 0, t: 0, fraying: false, fray: 1 });
let stitchN = 0;                                                // stitches on (the enemy loop skips the check when 0)
// Slot m armed with Mark / Basting: the press came (m.go, at input.pressX/Y): mark there, or start the drag; while it
// lasts its end follows the pointer (input.ptX/Y) and lifting (input.ptDown false) sews. Disarms if it can't be used any more.
function skillInput(m) {
  if (m.armed && !m.sewing && !moveReady(m)) { m.armed = m.go = false; return; }
  if (m.go) {
    m.go = false;
    const x = input.pressX / view.Z, y = input.pressY / view.Z;  // screen px -> world px
    if (m.id === 'mark') tryMark(m, x, y);
    else if (m.id === 'basting') { m.sewing = true; m.sx = m.ex = x; m.sy = m.ey = y; }
  }
  if (m.sewing) {
    m.ex = input.ptX / view.Z; m.ey = input.ptY / view.Z;
    if (!input.ptDown) finishSew(m);
  }
}
// The drag ended: a long enough drag (bastingMinDragPx, screen px) that crosses a road sews there and pays bastingCost
// Thread; otherwise nothing happens and it stays armed.
const SEW = { x: 0, y: 0, tx: 0, ty: 0 };
function finishSew(m) {
  m.sewing = false;
  const d = m.def, dx = m.ex - m.sx, dy = m.ey - m.sy;
  if (!live() || Math.hypot(dx, dy) * view.Z < d.bastingMinDragPx || state.thread < d.bastingCost) return;
  if (!roadCrossing(m.sx, m.sy, m.ex, m.ey)) return;
  state.thread -= d.bastingCost; m.armed = false; skillUsed(m);
  sewStitch(d, SEW.x, SEW.y, SEW.tx, SEW.ty);
}
// Where segment a-b crosses a road centreline (of all the crossings, the one nearest the drag's middle): SEW = the point
// and the road's unit direction there. Returns whether there is one.
function roadCrossing(ax, ay, bx, by) {
  const rx = bx - ax, ry = by - ay;
  let best = 2, found = false;
  for (let r = 0; r < state.paths.length; r++) {
    const p = state.paths[r];
    for (let k = 0; k < p.n - 1; k++) {
      const sx = p.x[k + 1] - p.x[k], sy = p.y[k + 1] - p.y[k], den = rx * sy - ry * sx;
      if (Math.abs(den) < 1e-9) continue;
      const qx = p.x[k] - ax, qy = p.y[k] - ay, t = (qx * sy - qy * sx) / den, u = (qx * ry - qy * rx) / den;
      if (t < 0 || t > 1 || u < 0 || u > 1 || Math.abs(t - 0.5) >= best) continue;
      best = Math.abs(t - 0.5); found = true;
      const len = Math.hypot(sx, sy) || 1;
      SEW.x = ax + rx * t; SEW.y = ay + ry * t; SEW.tx = sx / len; SEW.ty = sy / len;
    }
  }
  return found;
}
function sewStitch(d, x, y, tx, ty) {
  const half = level().roadHalfWidth * view.L * 1.15;
  let s = stitches[0];
  for (let i = 0; i < stitches.length; i++) { if (!stitches[i].on) { s = stitches[i]; break; } if (stitches[i].t > s.t) s = stitches[i]; }
  const bit = 1 << stitches.indexOf(s);
  for (let i = 0; i < enemies.length; i++) enemies[i].stitchBits &= ~bit;   // that slot's last stitch held these: forget it
  if (!s.on) stitchN++;
  s.on = true; s.x = x; s.y = y; s.ax = x - ty * half; s.ay = y + tx * half; s.bx = x + ty * half; s.by = y - tx * half;
  s.holds = d.bastingHolds; s.held = 0; s.sec = d.bastingSec; s.t = 0; s.fraying = false; s.fray = 1;
  sfx('basting', 0); sparks(x, y, 10, 0);
}
// Enemy loop: e (not in the air, an escort or a big boss) touching a stitch that still holds and hasn't held it: held
// bastingSec (e.holdT, the Pruners' jaw; e.bastedT for the tier-3 damage). The stitch's last hold starts it fraying.
function stitchHold(e) {
  for (let k = 0; k < stitches.length; k++) {
    const s = stitches[k];
    if (!s.on || s.fraying || s.holds <= 0 || (e.stitchBits & (1 << k))) continue;
    if (segDistSq(e.x, e.y, s.ax, s.ay, s.bx, s.by) > e.r * e.r) continue;
    const sec = s.sec;
    e.stitchBits |= 1 << k; e.holdT = Math.max(e.holdT, sec); e.bastedT = sec;
    s.holds--; s.held++; if (s.holds <= 0) s.fraying = true;
    sfx('stick', 0); sparks(e.x, e.y, 5, 0);
  }
}
function updateStitches(dt) {
  const B = C.skills.basting;
  stitchN = 0;
  for (let i = 0; i < stitches.length; i++) {
    const s = stitches[i]; if (!s.on) continue;
    s.t += dt;
    if (!s.fraying && s.t >= B.bastingLifeSec) s.fraying = true;
    if (s.fraying && (s.fray -= dt / B.bastingFraySec) <= 0) { s.on = false; continue; }
    stitchN++;
  }
}

// ======================= towers =======================
// One tower per spot of the current level (towers[i] stands on level().spots[i]; setLevel rebuilds the list). Plain
// data: { on, type, rank (1..3, in-level, Thread), def (pins.js pinDef at that rank and the type's tier: every number
// the Pin plays by; cached here so the hot loop never allocates), x, y (the spot, px), fx, fy (nearest road point),
// fu[route] (nearest point's progress per route), timer (magnet: period clock; needle: reload seconds left),
// pulse (1 -> 0 visual after a magnet pull), aim (needle: angle it points), kick (needle: 1 -> 0 recoil visual after a shot) }.
const towers = state.towers;
setLevel(view.levelId);
export const canAfford = type => state.thread >= pinCost(type);
// Progression (CONFIG.pinFrom / shredFrom): a tool introduced at map level id is here on every map level from it on;
// off the map (Random Quilt, Custom Road) once that level has been cleared. An unknown id never holds anything back.
function introduced(fromId) {
  if (lab.on) return true;                                       // the playtest workbench: every tool everywhere
  const at = mapIndex(fromId), here = mapIndex(view.levelId);
  if (at < 0) return true;
  return here >= 0 ? here >= at : !!(Save.levels[fromId] && Save.levels[fromId].cleared);
}
// Whether this level lets you build a `type` Pin: introduced by now (or in Save.unlocks.pins, the debug Unlock all), and
// in the level's allowedPins (null = every Pin).
export const pinAllowed = type => (introduced(C.pinFrom[type]) || Save.unlocks.pins.includes(type)) &&
  (!level().allowedPins || level().allowedPins.includes(type));
// A Pin (or SHRED) that appears for the first time on this level (the picker and the weapon screen say NEW).
export const pinIsNew = type => C.pinFrom[type] === view.levelId;
export const shredIsNew = () => C.shredFrom === view.levelId;
// Whether SHRED is in this level at all (its meter, charge and triggers; never in level 0).
export const shredAllowed = () => !isTutorial() && introduced(C.shredFrom);
// Build a `type` Pin on spot i (the action bar's spot picker). Returns '' on success, else why not.
export function buildTower(i, type) {
  const t = towers[i];
  if (state.mode !== 'PLAYING' && state.mode !== 'WAVE_CLEAR') return 'mode';
  if (!t || t.on) return 'taken';
  if (!pinAllowed(type)) return 'not here';
  if (!canAfford(type)) return 'cost';
  t.on = true; t.type = type; t.rank = 1; t.def = pinDef(type); t.timer = 0; t.pulse = 0; t.snowedT = 0; t.pop2 = 0;
  state.thread -= t.def.cost; state.run.towers[type]++;
  buildLights();                                                // a Pin is a little light in the dark (a Lamp Pin a big one)
  sfx('pinPop', 0); emit('place', t.x, t.y, 0);
  return '';
}
// Raise the Pin on spot i to its next rank with Thread (the action bar's rank card). Returns '' on success, else why not.
export function rankUp(i) {
  const t = towers[i], cost = rankUpCost(t);
  if (state.mode !== 'PLAYING' && state.mode !== 'WAVE_CLEAR') return 'mode';
  if (!t || !t.on || !cost) return 'max';
  if (state.thread < cost) return 'cost';
  state.thread -= cost; t.rank++; t.def = towerDef(t); state.run.rankUps++;
  buildLights();                                                // a wider Lamp ring lights more
  sfx('pinPop', 0); emit('place', t.x, t.y, 0);
  return '';
}
// Magnet pull: moves each enemy's place in the line (its road progress u) back toward the anchor, pullBack ring radii
// up the road from the Pin's road point (inOutSine), keeping pullKeep of the gap on the stretch of road nearest the
// Pin and progressively more out toward the ring's edge (pullFalloff), so everyone loses ground, the ones ahead most,
// and lands in a clump that stands still for holdSec (e.holdT, as the Ratchet Pruners' jaw): a real clump that keeps
// walking together afterwards. Sideways shove offsets shrink by the same factor. The enemy doesn't walk while pulled.
// Tagged by the enemy so a kill cancels it.
function pullDone(e) { e.pulling = false; e.holdT = Math.max(e.holdT, e.pullHold); }
function magnetPull(t) {
  // full strength from the Pin out to its nearest road point (the pad sits beside the road), fading to none at the edge
  const def = t.def, reach = towerReachOf(t), near = Math.min(Math.hypot(t.fx - t.x, t.fy - t.y), reach * 0.9);
  t.pulse = 1; sfx('magnetHum', 0);
  const bit = 1 << (towers.indexOf(t) & 31);                     // each Magnet Pin drags a given enemy back once (e.magnets)
  for (const e of enemies) {
    const d = Math.hypot(e.x - t.x, e.y - t.y);
    if (!e.on || e.pinned || e.escortOf || e.air || e.type.pushScale <= 0 || d > reach || (e.magnets & bit)) continue;   // escorts stay with their boss; a Moth in the air slips the pull
    const k = 1 - (1 - def.pullKeep) * Math.pow(1 - clamp((d - near) / (reach - near), 0, 1), def.pullFalloff);   // share of the gap kept
    if (k > 0.98) continue;                                      // at the very edge: too weak to bother
    const au = Math.max(0, t.fu[e.route] - def.pullBack * def.radius / state.paths[e.route].lenU);   // the anchor, up the road
    if (e.u <= au) continue;                                     // already behind the anchor: nothing to drag back
    tweens.cancel(e);
    e.magnets |= bit;
    e.pulling = true; e.pvx = e.pvy = 0; e.pullHold = def.holdSec;
    tween(e, { u: au + (e.u - au) * k, ox: e.ox * k, oy: e.oy * k }, def.pullMs, easing.inOutSine, pullDone, e);
  }
}

// Cork Pin (the trap): armed (t.timer 0) it waits on its road point (t.fx, t.fy, the road point nearest the pad) until
// an enemy's road point (not one in the air, an escort or a practice Scrap) comes within its ring, then pops (corkPop).
// Tier 3 (popTwice) pops once more popSecondSec later (t.pop2 counts down). Then it re-arms over rearmSec (t.timer > 0:
// drawn pressed down, towerArt.js drawCorkTrap).
function corkTower(t, dt) {
  const def = t.def;
  if (t.pop2 > 0) { if ((t.pop2 -= dt) <= 0) { t.pop2 = 0; corkPop(t, true); t.timer = def.rearmSec; } return; }
  if (t.timer > 0) { t.timer = Math.max(0, t.timer - dt); return; }
  const R = towerReachOf(t), r2 = R * R, bit = 1 << (towers.indexOf(t) & 31);   // each Cork pops a given enemy once (e.corks)
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.on || e.pinned || e.air || e.escortOf || (e.corks & bit)) continue;   // one it has popped already can't trip it again
    const dx = e.px - t.fx, dy = e.py - t.fy;
    if (dx * dx + dy * dy > r2) continue;
    corkPop(t, !def.popTwice);
    if (def.popTwice) t.pop2 = def.popSecondSec; else t.timer = def.rearmSec;
    return;
  }
}
// The pop: everything within the ring of the road point (its edge touching) stands stunned for stunSec (e.holdT, as the
// Pruners' jaw; bosses too). No push-back: that let a trap work a slow enemy over again and again. Escorts stay with
// their boss and a Moth in the air flies over it. mark = remember who it popped (e.corks, a bit per Pin), so the trap never
// catches the same enemy twice (a tier-3 second pop marks; its first pop leaves the marking to the second).
function corkPop(t, mark = true) {
  const def = t.def, R = towerReachOf(t), bit = 1 << (towers.indexOf(t) & 31);
  t.pulse = 1; sfx('corkPop', 0); sparks(t.fx, t.fy, 12, 3); addShake(3, 6);
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.on || e.pinned || e.air || e.escortOf || (e.corks & bit) || Math.hypot(e.x - t.fx, e.y - t.fy) > R + e.r) continue;   // once per enemy
    if (mark) e.corks |= bit;
    e.holdT = Math.max(e.holdT, def.stunSec);
  }
}

// Needle Pin (the archer): when reloaded, fires at the enemy in range that is furthest along the road (tier 3: a volley,
// one needle each at the furthest few), then reloads for cooldownSec. It keeps turning toward its current pick between
// shots (t.aim, for the renderer).
function needleTower(t, dt) {
  const def = t.def, reach = towerReachOf(t), mx = t.x, my = t.y - C.needleMuzzle * level().spotR * view.L;
  if (t.kick > 0) t.kick = Math.max(0, t.kick - dt * 4);
  if (t.timer > 0) t.timer = Math.max(0, t.timer - dt);
  let best = null, second = null;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.on || e.pinned || e.air || Math.hypot(e.x - t.x, e.y - t.y) > reach + e.r) continue;   // never aims at a Moth in the air
    if (!best || e.u > best.u) { second = best; best = e; } else if (!second || e.u > second.u) second = e;
  }
  if (!best) return;
  t.aim = Math.atan2(best.y - my, best.x - mx);
  if (t.timer > 0) return;
  const shots = def.volley > 1 ? def.volley : 1;
  for (let s = 0; s < shots; s++) {
    const target = s === 0 || !second ? best : second;
    let n = null;
    for (let i = 0; i < needles.length; i++) if (!needles[i].on) { n = needles[i]; break; }
    if (!n) break;
    const ang = Math.atan2(target.y - my, target.x - mx);
    n.on = true; n.x = mx; n.y = my; n.target = target; n.gen = target.gen; n.dmg = def.damage; n.life = C.needleLostSec;
    n.ang = ang; n.vx = Math.cos(ang); n.vy = Math.sin(ang);
  }
  t.timer = def.cooldownSec; t.kick = 1;
  sfx('needle', 0);
}
// Needles in flight: home on their target at needleSpeed; if it died (or its pool slot was reused) they fly straight on
// for needleLostSec and vanish. A hit deals the Pin's damage (armor rules as for a snip).
function updateNeedles(dt) {
  const sp = C.towers.needle.needleSpeed * view.L;
  for (let i = 0; i < needles.length; i++) {
    const n = needles[i]; if (!n.on) continue;
    let e = n.target;
    if (e && e.air) n.target = e = null;                         // its Moth took off: the needle flies on past
    const alive = e && e.on && e.gen === n.gen;
    if (alive) {
      const dx = e.x - n.x, dy = e.y - n.y, d = Math.hypot(dx, dy);
      if (d <= e.r * 0.7 + sp * dt) { n.on = false; needleHit(e, n.dmg); continue; }
      n.vx = dx / d; n.vy = dy / d; n.ang = Math.atan2(dy, dx);
    } else if ((n.life -= dt) <= 0) { n.on = false; continue; }
    n.x += n.vx * sp * dt; n.y += n.vy * sp * dt;
  }
}
function needleHit(e, dmg) {
  sparks(e.x, e.y, 4, 0);
  if (e.type.boss) { if (bossBlocks(e)) { clang(e, false); return; } }
  else if (e.armored) {                                         // like a snip: the first hit clangs unless slowed or softened, a layer of armor spent
    if (--e.armorHits <= 0) e.armored = false;
    if (!e.slowed && !e.soft) { clang(e, false); return; }
  }
  e.hp -= dmg;
  if (e.hp <= 0.001) { snipMulti = false; killEnemy(e, false); return; }
  sfx('rip', 60);
  spawnNumber(e.x, e.y - e.r, dmg, -2);
  e.hitT = Math.max(e.hitT, 0.35);
}

// ======================= entity pools (plain data) =======================
const enemies = state.enemies;
// type = CONFIG.enemyTypes entry, name = its key, rank = 1..3 (CONFIG.enemyRanks: tougher, recoloured). slowed = in an Ice Pin aura or recently hit by the Helicopter
// (slowT seconds left); lets the first snip through a Brute's armor. burning = on fire from a Fire Pin (burnLeft =
// seconds of burning left once out of its ring, burnT = seconds toward the next burn tick).
// magnets = bit per Magnet Pin (by tower index) that has dragged it back already (each does so once),
// leg = boss turn index, seamA = boss seam angle, age = seconds alive, pulling = a Magnet Pin is moving it (a tween owns u),
// pinned = a level-0 practice Scrap (stands still unless walking into the player's blades: walking, tutK = its place).
// route = which of the level's paths it walks. gen = bumped on every spawn, so a needle aimed at an earlier occupant of
// this pool slot knows its target is gone. Bosses: bossPhase (Unstitcher 0..2), seamT / seamOpen / seamWarn (the opening
// seam), chargeT / windup / charging / armorDownT (the tremble before a lunge, the lunge, and the armor-down window
// after it), helmPh / helmT / helmSide (its helmet then: 0 on, 1 knocked off and flying, 2 on the ground, 3 being picked
// up; time in that stage; which side it lands), swarmT (Scrap swarm clock), shieldDownT (the Unstitcher's swarm shield is down while > 0).
// escortOf (+ escortGen, escortOff) = the Unstitcher a swarm Scrap keeps its place around (road progress offset).
for (let i = 0; i < C.maxEnemies; i++) enemies.push({ on: false, type: null, name: '', x: 0, y: 0, px: 0, py: 0, ox: 0, oy: 0,
  u: 0, seg: 0, route: 0, gen: 0, speed: 0, r: 0, rank: 1, hp: 0, maxHp: 0, armored: false, slowed: false, slowT: 0, slowMult: 1, iced: false, burning: false, burnLeft: 0, burnT: 0, burnDps: 0, pullHold: 0, magnets: 0, leg: 0, seamA: 0, age: 0,
  pvx: 0, pvy: 0, phase: 0, hitT: 0, pulling: false, pinned: false, walking: false, tutK: 0, escortOf: null, escortGen: 0, escortOff: 0, escortSlot: -1,
  holdT: 0, bossPhase: 0, seamT: 0, seamOpen: false, seamWarn: false, chargeT: 0, charging: false, windup: false, armorDownT: 0, swarmT: 0, shieldDownT: 0,
  helmPh: 0, helmT: 0, helmSide: 0,
  // the five worlds (docs/worlds.md): bdef = its CONFIG.bosses entry (bosses and mini bosses; null otherwise), armorHits =
  // armor layers left (1, the cold's coldArmor), air / airT / airH / hopT / hopFrom / hopTo = a Moth's hop (in the air,
  // seconds into it, height 0..1 for the renderer, seconds on the ground, where it took off and lands, as u), hpMul /
  // hpCap = a Snowball's hp scaling and how big it may grow, spin = a rolling boss's turn (radians, drawn), side / sideV =
  // the Bottle Cap's place across the road and its bounce speed, chargeN = charges so far (the Twine Ball tags what each
  // wraps: wrapCharge on the wrapped), captives = enemies stuck to / wrapped by a captures boss, spoolWarn = the Bobbin is
  // about to drop a Scrap, swarmDone = a noRefill swarm boss has had its one swarm, freeAt = state.clock until which no
  // captures boss can catch it again (just shaken or cut loose).
  bdef: null, armorHits: 0, air: false, airT: 0, airH: 0, hopT: 0, hopFrom: 0, hopTo: 0, hpMul: 1, hpCap: 0, spin: 0, side: 0, sideV: 0,
  chargeN: 0, captives: 0, wrapCharge: 0, freeAt: 0, spoolWarn: false, swarmDone: false,
  // the world 3-5 Pins and pairs: lit = in a Lamp Pin's ring this frame (litCrit = a tier-3 Lamp's lampCrit, 0 = none);
  // soft = softened by a Candle Pin (in its ring, or softT seconds of a tier-3 linger left; meltMult = the strongest
  // ring's), curled = slowed by a Ribbon Shears curl this frame (render.js)
  lit: false, litCrit: 0, soft: false, softT: 0, meltMult: 1, curled: false,
  // the Skills: marked = chalk-marked by Seam Mark (drawn; the next graded snip does markMult), bastedT = seconds left of a
  // Basting Stitch's hold (snips do bastingDmgMult), stitchBits = bit per stitch (by pool index) that has held it already
  marked: false, bastedT: 0, stitchBits: 0 });

// A non-boss's hp multiplier (docs/worlds.md "Difficulty"): 1 + hpPerWave x (wave - 1) + levelHp x (hpPerWorld x
// (world - 1) + hpPerLevel x (n - 1)), world / n its place on the map (meta.js levelPlace; Random Quilt / Custom Road
// count as hpOffMapWorld-hpOffMapLevel). Runners have levelHp 0. The tutorial's wave 0 stays at base.
function hpScale(t) {
  if (isEndless()) return 1 + C.endless.hpPerWave * Math.max(0, state.wave - 1);   // endless: tougher by wave only
  const p = lab.place || levelPlace(view.levelId);              // the workbench may stand in for the level's place
  const steps = isTutorial() ? 0 : C.hpPerWorld * (p.world - 1) + C.hpPerLevel * Math.max(0, p.n - 1);
  return 1 + C.hpPerWave * Math.max(0, state.wave - 1) + (t.levelHp || 0) * steps;
}
// The current level's global number on the map, 1..50 (Random Quilt / Custom Road: hpOffMapWorld-hpOffMapLevel's).
function mapLevelNum() { return lab.place ? (lab.place.world - 1) * 10 + lab.place.n : levelPlace(view.levelId).global; }
// Enemy ranks (CONFIG.enemyRanks): the rank mix for this level and wave (0 = rank 1s only), and a wave spawn's rank
// drawn from it (rng.spawn, drawn only where the mix is above 0, so earlier levels' seeded runs replay as before).
function rankMix() {
  const R = C.enemyRanks, lv = mapLevelNum();
  if (isEndless()) return Math.max(0, C.endless.rankPerWave * (state.wave - C.endless.rankFromWave + 1));
  if (isTutorial() || lv < R.fromLevel) return 0;
  return R.start + R.perLevel * (lv - R.fromLevel) + R.perWave * Math.max(0, state.wave - 1);
}
function drawRank() {
  const m = rankMix(); if (m <= 0) return 1;
  const r = rng.spawn();
  return m <= 1 ? (r < m ? 2 : 1) : (r < Math.min(1, m - 1) ? 3 : 2);
}
// An enemy's colours: its rank's (CONFIG.enemyRanks.colors), else its type's.
const enemyColors = e => (e.rank > 1 && C.enemyRanks.colors[e.name] && C.enemyRanks.colors[e.name][e.rank - 2]) || e.type;
// Which route an enemy takes: among the routes of its entrance, at random (weighted where the level says so, e.g. a fork's short
// arm); single-route levels draw nothing, so their seeded runs replay as before.
// The longest route of the level (bosses always take it: more road to fight them on).
function longestRoute() {
  let best = 0;
  for (let r = 1; r < state.paths.length; r++) if (state.paths[r].lenU > state.paths[best].lenU) best = r;
  return best;
}
function pickRoute(entry) {
  const lv = level(), nr = state.paths.length, of = lv.entries > 1 ? lv.entryOf : null, w = lv.pathW;
  let n = 0, only = 0, total = 0;
  for (let r = 0; r < nr; r++) if (!of || of[r] === entry) { n++; only = r; total += w ? w[r] : 1; }
  if (n <= 1) return only;
  let x = rng.spawn() * total, last = only;
  for (let r = 0; r < nr; r++) {
    if (of && of[r] !== entry) continue;
    last = r; x -= w ? w[r] : 1;
    if (x < 0) return r;
  }
  return last;
}
// Returns the enemy, or null if the pool is full (the schedule retries next frame).
// ranked = a wave spawn, which may come as rank 2 or 3 (drawRank); bosses, their escorts and level 0's Scraps are rank 1.
function spawnEnemy(name, entry = 0, ranked = false, forceRank = 0) {
  let e = null;
  for (let i = 0; i < enemies.length; i++) if (!enemies[i].on) { e = enemies[i]; break; }
  if (!e) return null;
  const t = C.enemyTypes[name];
  e.rank = forceRank || (ranked && !t.boss ? drawRank() : 1);   // forceRank: the workbench's pick
  // a boss's hp: its own (more each time round on an endless run; an endless mini boss by the wave, like the rest)
  const bossHp = t.mini && isEndless() ? hpScale(t) : bossHpScale();
  e.on = true; e.type = t; e.name = name; e.r = t.r; e.hp = e.maxHp = t.boss ? t.hp * bossHp : t.hp * hpScale(t) * C.enemyRanks.hpMult[e.rank - 1];
  e.armored = !!t.armor; e.slowed = false; e.slowT = 0; e.slowMult = 1; e.iced = false; e.burning = false; e.burnLeft = 0; e.burnT = 0; e.burnDps = 0; e.pullHold = 0; e.magnets = 0; e.corks = 0; e.leg = 0; e.seamA = rng.spawn() * TAU; e.age = 0;
  e.speed = 1 / t.traverseSec; e.u = 0; e.seg = 0; e.ox = 0; e.oy = 0; e.pvx = 0; e.pvy = 0; e.hitT = 0;
  e.pulling = false; e.pinned = false; e.walking = false; e.escortOf = null; e.holdT = 0; e.gen++;
  e.bossPhase = 0; e.seamT = e.chargeT = e.armorDownT = e.swarmT = e.shieldDownT = 0; e.seamOpen = e.seamWarn = e.charging = e.windup = false;
  e.helmPh = 0; e.helmT = 0; e.helmSide = 0;
  e.phase = rng.spawn() * TAU;
  e.route = t.boss && !t.mini ? longestRoute() : pickRoute(entry);   // a mini boss comes in like the wave around it
  const cold = worldRule();
  e.bdef = t.boss ? C.bosses[name] || null : null;
  e.armorHits = t.armor ? (cold && cold.coldArmor ? cold.coldArmor : 1) : 0;   // the cold (snow): Brutes take coldArmor clangs
  e.air = false; e.airT = 0; e.airH = 0; e.hopFrom = e.hopTo = 0;
  e.hopT = t.hopEverySec ? e.phase / TAU * t.hopEverySec * 0.5 : 0;   // Moths don't all hop together
  e.hpMul = e.maxHp / t.hp; e.hpCap = e.maxHp * (t.growMax || 1);
  e.spin = 0; e.side = 0; e.chargeN = 0; e.captives = 0; e.wrapCharge = 0; e.freeAt = 0; e.spoolWarn = false; e.swarmDone = false; e.escortSlot = -1;
  e.lit = false; e.litCrit = 0; e.soft = false; e.softT = 0; e.meltMult = 1; e.curled = false;
  e.marked = false; e.bastedT = 0; e.stitchBits = 0;
  e.sideV = e.bdef && e.bdef.rolling ? e.bdef.bouncePx * (rng.spawn() < 0.5 ? -1 : 1) : 0;   // drawn only for a rolling boss
  if (t.mini) {                                                  // a mini boss walks on: its name banner and its roar, no card
    state.miniBannerT = 1; state.miniName = (e.bdef && e.bdef.name || name).toUpperCase();
    if (e.bdef) sfx(e.bdef.roar, 0);
    addShake(5, 8);
  }
  // a steady walking speed: traverseSec is for a road traverseRefLen long, so a longer road takes longer (the tutorial keeps its fixed time)
  if (!isTutorial()) e.speed = C.traverseRefLen / (t.traverseSec * state.paths[e.route].lenU);
  e.speed *= C.enemyRanks.speedMult[e.rank - 1];
  pathPoint(e); e.x = e.px; e.y = e.py;
  return e;
}

// needles in flight (Needle Pin shots): target + gen = the enemy it homes on, ang = heading for the renderer
const needles = state.needles;
for (let i = 0; i < 24; i++) needles.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, ang: 0, target: null, gen: 0, dmg: 0, life: 0 });

// Shoves (snips, blade contact) can push an enemy toward the road's edge but never off it: its offset from the
// centreline is capped at level.roadHalfWidth, and velocity still pushing outward is dropped so it slides along the edge.
function keepOnRoad(e) {
  const max = level().roadHalfWidth * view.L, d2 = e.ox * e.ox + e.oy * e.oy;
  if (d2 <= max * max) return;
  const d = Math.sqrt(d2), nx = e.ox / d, ny = e.oy / d;
  e.ox = nx * max; e.oy = ny * max;
  const vn = e.pvx * nx + e.pvy * ny;
  if (vn > 0) { e.pvx -= nx * vn; e.pvy -= ny * vn; }
}

// Level 0: nothing hurts the heart; the Scrap just pops and counts as done (no do-overs).
function reachWorkshop(e) {
  if (state.thimble > 0 && state.mode !== 'TUTORIAL' && !(e.type.boss && !e.type.mini)) { thimbleStop(e); return; }   // Thimble Guard (big bosses aside)
  e.on = false; tweens.cancel(e); e.pulling = false;
  if (lab.godHeart) { sparks(e.x, e.y, 8, 0); state.run.leaks++; return; }   // the workbench: the heart can't fall
  if (state.mode === 'TUTORIAL') { sparks(e.x, e.y, 8, 2); state.run.leaks++; tut.cuts++; return; }
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
    f.rot = ang; f.vr = (rng.fx() - 0.5) * 14; f.sz = e.r * 0.55; f.life = 1; f.color = made & 1 ? enemyColors(e).patch : enemyColors(e).color;
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
// LABEL_LIT = a snip on an enemy in a Lamp Pin's ring (once per snip), LABEL_CRACK = the Kitchen Shears' pivot execute
export const LABEL_SNIP = 0, LABEL_NICK = 1, LABEL_CLANG = 2, LABEL_SHIELD = 3, LABEL_SPIKES = 4, LABEL_LIT = 5, LABEL_CRACK = 6;
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
  onSpecial: unlessPaused(fingerMove), onMoveKey: unlessPaused(keyMove), onPause: togglePause, onPress: unlessPaused(onPress) };

// ======================= critters (src/critters.js) =======================
// One reused object tells critters.js what it needs from the game each frame (see updateCritters).
const critterEnv = { rnd: null, paths: null, playing: false, wave: 0, waveT: 0, onScreen: 0, seam: false,
  shown: false, open: 0, opening: false, bx: 0, by: 0, theta: 0, a: 0, L: 0, slide: false };
// rdt = the real frame time (the blades' opening rate reads it; dt is the world's, slower under Tailor's Focus)
function critterTick(dt, onScreen, seam, rdt) {
  const v = critterEnv, p = input.pose;
  v.rnd = rng.critter; v.paths = state.paths; v.playing = state.mode === 'PLAYING'; v.wave = state.wave; v.waveT = state.modeT;
  v.onScreen = onScreen; v.seam = seam;
  v.shown = input.scAlpha > 0.5 && !heli.active;
  const open = visOpen(); v.opening = rdt > 0 && (open - v.open) / rdt >= C.critters.silverfish.skitterOpenRate; v.open = open; v.bx = p.x; v.by = p.y; v.theta = p.theta;
  v.a = visBladeAngle(); v.L = bladeReachPx() * C.cutZoneScale * (isSlide() ? weapon.def.ringScale || 1 : 1); v.slide = isSlide();
  if (updateCritters(dt, v)) sfx('skitter', 0);
}

// ======================= world rules + the new enemies' moves =======================
// CONFIG.worldRules by the level's `world` (docs/worlds.md): autumn = gusts, night = the dark, snow = the cold (read where
// it applies: the Ice / Fire auras in update, Brute armor in spawnEnemy). Meadow and denim have none (null).
// ---------- playtest workbench (src/lab.js, ?lab=1) ----------
// A dev-only screen over the game: every tool allowed (introduced), scheduled waves held (noWaves), the heart unhurt
// (godHeart), a stand-in map place for the hp and rank scaling (place = { world, n } or null), enemies spawned on
// demand (labSpawn: queued one per gapMs, at a chosen rank), the moves charged (labCharge), the board cleared
// (labClear). Nothing here runs unless the workbench turned lab.on on.
export const lab = { on: false, noWaves: false, godHeart: false, place: null };
const labQueue = []; let labQueueT = 0;
export function labSpawn(name, rank = 0, count = 1) { if (!C.enemyTypes[name]) return; for (let i = 0; i < count; i++) labQueue.push([name, rank]); }
function labTick(dt) {
  if (!labQueue.length || (labQueueT -= dt) > 0) return;
  const [name, rank] = labQueue[0], ne = level().entries || 1;
  if (spawnEnemy(name, ne > 1 ? Math.floor(Math.random() * ne) : 0, false, rank)) { labQueue.shift(); labQueueT = C.enemyTypes[name].gapMs / 1000; }
}
export function labCharge() { for (let i = 0; i < moves.length; i++) if (moves[i].id) moves[i].charge = 1; }
// The workbench puts move id ('' = empty) in slot i (Save.moves, sandboxed) and switches the run's slots at once, uncharged
// (a normal run picks them at its start, resetRun). The other slot keeps its charge unless the move came from it. Also
// re-reads both slots' tiers (the workbench calls it after a tier change too).
export function labMove(i, id) {
  setMove(i, id);
  for (let k = 0; k < moves.length; k++) { const want = pickMove(k); if (moves[k].id !== want) setSlot(moves[k], want); else cacheDef(moves[k]); }
}
export function labClear() { labQueue.length = 0; for (const e of enemies) if (e.on) { e.on = false; tweens.cancel(e); e.pulling = false; } }
export function labHeal() { state.hp = C.workshopHp; }

export const worldRule = () => (C.worldRules && C.worldRules[level().world]) || null;

// The dark (night): pools of light in world px (state.lights[0..lightN), pooled objects): the level's `lights` (attached by
// the painter, plate units; r defaults to lightR), the heart pad, every built Pin (a Lamp Pin its whole ring). Rebuilt
// only when the level, the screen or the Pins change (layout, buildTower, rankUp, clearWorld); lightsVer tells render.js
// to re-mask. isLit(x, y): whether a point is in one (render.js draws enemies outside every light dim, no weak spot;
// the Lamp Pin's lit bonus can ask it too).
const NO_LIGHTS = [];
let litK = 1;                                                   // the night rule's litCore, cached by buildLights
function lightAt(n) { const L = state.lights; return L[n] || (L[n] = { x: 0, y: 0, r: 0 }); }
function buildLights() {
  const rule = worldRule(), lv = level();
  state.dark = !!(lv && rule && rule.darkAlpha !== undefined) && !isTutorial();
  litK = state.dark ? rule.litCore : 1;
  let n = 0;
  if (state.dark && state.paths.length) {
    const L = view.L;
    for (const s of lv.lights || NO_LIGHTS) {
      const o = lightAt(n++);
      o.x = levelX(s.x !== undefined ? s.x : s[0]); o.y = levelY(s.y !== undefined ? s.y : s[1]); o.r = ((s.r !== undefined ? s.r : s[2]) || rule.lightR) * L;
    }
    const p = state.paths[0], h = lightAt(n++);                   // the heart pad: every route ends on it
    h.x = p.x[p.n - 1]; h.y = p.y[p.n - 1]; h.r = rule.heartLightR * L;
    for (const t of state.towers) {
      if (!t.on) continue;
      const o = lightAt(n++);
      // a Lamp Pin lights its whole ring (its pool is drawn 1 / litCore as wide, so the soft rim falls outside the ring)
      o.x = t.x; o.y = t.y; o.r = t.type === 'lamp' ? Math.max(towerReachOf(t) / litK, rule.pinLightR * L) : rule.pinLightR * L;
    }
  }
  state.lightN = n; state.lightsVer++;
}
export function isLit(x, y) {
  if (!state.dark) return true;
  for (let i = 0; i < state.lightN; i++) {
    const o = state.lights[i], dx = x - o.x, dy = y - o.y, r = o.r * litK;
    if (dx * dx + dy * dy <= r * r) return true;
  }
  return false;
}

// Gusts (autumn): every enemy on the road that isn't a boss or an escort, held, pulled, frozen or in the air is carried
// gustU of a traverseRefLen-long road forward over gustSec (Leaves, `light`, gustLeafMult x as far), on the Magnet Pin's
// tween (e.pulling while it owns u; tagged by the enemy, so a kill cancels it).
function gust(rule) {
  state.gustBannerT = 1; sfx('gust', 0);
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.on || e.type.boss || e.escortOf || e.pinned || e.pulling || e.holdT > 0 || e.air) continue;
    const du = rule.gustU * C.traverseRefLen / state.paths[e.route].lenU * (e.type.light ? rule.gustLeafMult : 1);
    e.pulling = true; e.pullHold = 0;
    tween(e, { u: Math.min(0.995, e.u + du) }, rule.gustSec * 1000, easing.inOutSine, pullDone, e);
  }
}

// A Moth's walk: on the ground it walks like the rest; every hopEverySec it takes off (e.air: snips, Pins, SHRED and the
// blades all miss it) and lands hopU of a traverseRefLen-long road further on after hopSec. airH = its height (0..1) for
// the renderer, which draws its shadow on the road and the moth small and high.
function mothMove(e, dt, step) {
  const t = e.type;
  if (e.air) {
    e.airT += dt;
    const p = Math.min(1, e.airT / t.hopSec);
    e.u = e.hopFrom + (e.hopTo - e.hopFrom) * easeInOut(p); e.airH = Math.sin(Math.PI * p);
    if (p >= 1) { e.air = false; e.airH = 0; e.hopT = 0; }
    return;
  }
  if (e.pulling) return;                                         // a Magnet or a gust owns u
  e.u += step;
  if ((e.hopT += dt) >= t.hopEverySec && e.holdT <= 0) {
    e.air = true; e.airT = 0; e.hopFrom = e.u; e.hopTo = e.u + t.hopU * C.traverseRefLen / state.paths[e.route].lenU;
    sfx('flutter', 120);
  }
}

// ======================= update =======================
export function update(now, dt) {
  if (state.paused) return;                                      // frozen: no input, timers, tweens or clock
  updateInput(now, dt);                                          // input keeps running through hit-stop so no gesture is lost
  if (heli.active) input.scAlpha = 1;                            // a spinning SHRED never fades, even with the hand lifted
  for (let i = 0; i < moves.length; i++) {                       // an armed move waiting for its press (the moves section)
    const m = moves[i];
    if (m.id === 'shred') {                                      // armed SHRED: starts once the pressed hand has the scissors
      if (m.armed && !shredReady()) m.armed = m.go = false;
      else if (m.armed && m.go) trySpecial();
    } else if (m.armed || m.sewing) skillInput(m);               // a Skill waiting for its tap / drag
  }
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
  state.miniBannerT = Math.max(0, state.miniBannerT - ms / C.miniBannerMs);
  if (state.gustBannerT > 0) { const r = worldRule(); state.gustBannerT = r && r.gustBannerMs ? Math.max(0, state.gustBannerT - ms / r.gustBannerMs) : 0; }
  if (state.bossCardT > 0 && (state.bossCardT -= dt) <= 0) showScreens();   // the boss intro card closes
  if (state.goalsT > 0 && (state.goalsT -= dt) <= 0) showScreens();         // the star goals card closes
  tickMoves(dt, ms);                                             // Tailor's Focus runs on real time
  state.thimbleHitT = Math.max(0, state.thimbleHitT - dt * 2);

  // Tailor's Focus: from here on the world runs at focusSlow (waves, Pins, needles, enemies, critters, stitches, tweens,
  // effects): the same gate as hit-stop's freeze above. Input and the blades (bladeContacts) keep real time.
  const realDt = dt;
  dt *= focusScale();
  const wms = dt * 1000;

  // --- waves / onboarding ---
  if (state.mode === 'PLAYING') {
    // wait for the level's art (a recipe level paints its plate once the kit has loaded) so nothing walks onto bare felt;
    // bgWaitMaxSec caps the wait in case an image never arrives
    const artWait = !view.bgReady && (bgWaitT += dt) < C.bgWaitMaxSec;
    const hold = artWait || introActive();                       // the scripted first critter crosses in a quiet moment
    if (!hold) state.modeT += dt;
    const rule = worldRule();                                      // autumn: a gust every gustEverySec of the wave clock
    if (!hold && rule && rule.gustEverySec && (state.gustT += dt) >= rule.gustEverySec) { state.gustT = 0; gust(rule); }
    // board cleared mid-wave: skip the wave clock ahead so the next spawn is at most emptyWaveWaitSec away
    if (!hold && spawnIdx < spawnList.length && !anyEnemyOn()) state.modeT = Math.max(state.modeT, spawnList[spawnIdx][0] - C.emptyWaveWaitSec);
    while (!lab.noWaves && spawnIdx < spawnList.length && spawnList[spawnIdx][0] <= state.modeT && spawnEnemy(spawnList[spawnIdx][1], spawnList[spawnIdx][2], true)) spawnIdx++;
    labTick(dt);
    const marks = state.entryMarks;                                // entrance arrows: seconds to the next thing due at each
    if (marks.length) {
      for (const m of marks) m.next = 99;
      for (let j = spawnIdx, lim = state.modeT + C.entryWarnSec; j < spawnList.length && spawnList[j][0] <= lim; j++) { const m = marks[spawnList[j][2]]; if (m) m.next = Math.min(m.next, spawnList[j][0] - state.modeT); }
    }
  } else if (state.mode === 'WAVE_CLEAR') {
    state.modeT += dt;
    if (state.modeT * 1000 >= C.waveClearMs) { if (!isEndless() && state.wave >= levelWaves().length) endGame(true); else beginWave(state.wave + 1); }
  } else if (state.mode === 'TUTORIAL') tutUpdate(dt);

  // --- towers ---
  for (const t of towers) {
    if (!t.on) continue;
    if (t.pulse > 0) t.pulse = Math.max(0, t.pulse - dt * 2);
    if (t.snowedT > 0) { t.snowedT = Math.max(0, t.snowedT - dt); continue; }   // snowed under by the Snow Globe's shake: off for now
    // (the Lamp and Candle Pins have no clock: their rings are read per enemy below)
    if (t.type === 'magnet' && live()) { t.timer += dt; if (t.timer >= t.def.periodSec) { t.timer -= t.def.periodSec; magnetPull(t); } }
    else if (t.type === 'needle' && live()) needleTower(t, dt);
    else if (t.type === 'cork' && live()) corkTower(t, dt);
  }
  updateNeedles(dt);
  if (curlN > 0) {                                               // Ribbon Shears' curls fade out
    curlN = 0;
    for (let i = 0; i < curls.length; i++) { const c = curls[i]; if (!c.on) continue; if ((c.t -= dt) <= 0) c.on = false; else curlN++; }
  }
  if (stitchN > 0) updateStitches(dt);                          // Basting Stitches fray away

  // --- Helicopter spin ticks ---
  if (heli.phase === 'spin') { heli.tick += wms; while (heli.tick >= C.heliTickMs) { heli.tick -= C.heliTickMs; heliTick(); } }

  // --- enemies walk the road; shoves are an offset that springs back onto it ---
  if (live()) {
    const pushKeep = Math.exp(-C.pushDrag * dt), returnKeep = Math.exp(-C.pathReturnRate * dt);
    const rule = worldRule(), cold = rule && rule.coldIceMult ? rule : null;   // snow: the cold weakens Ice and stretches burns
    let alive = 0, onScreen = 0, seam = false;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i]; if (!e.on) continue;
      e.age += dt;
      if (e.y > -e.r && e.y < view.H + e.r && e.x > -e.r && e.x < view.W + e.r) onScreen++;
      if (e.type.boss && (e.seamOpen || e.seamWarn) && bossMode(e) === 'seam') seam = true;
      if (e.hitT > 0) e.hitT = Math.max(0, e.hitT - dt * 5);
      if (e.pinned) { alive++; continue; }                        // level-0 practice Scraps: the tutorial moves them
      // slowed: inside an Ice Pin aura (at the strongest one's slowMult; a tier-3 Ice Pin also stops it for freezeSec
      // as it first steps in), or recently hit by the Helicopter (C.slowSpeedMult). burning: inside a Fire Pin aura
      // (the strongest one's burnDps and burnSec), or left one less than burnSec ago.
      // lit: inside a Lamp Pin's ring (litCrit = the best tier-3 lampCrit). soft: inside a Candle Pin's ring (the
      // strongest meltMult; a tier-3 one keeps it meltLingerSec after leaving, e.softT). Bosses are never softened.
      let inIce = false, inFire = false, slowMult = 1, burnDps = 0, burnSec = 0, freeze = 0;
      let lit = false, litCrit = 0, inCandle = false, melt = 1, linger = 0;
      const ty = e.type;
      if (!e.air) for (const t of towers) {                      // a Moth in the air is out of every Pin's reach
        const tt = t.type;
        if (!t.on || t.snowedT > 0 || (tt !== 'ice' && tt !== 'fire' && tt !== 'lamp' && tt !== 'candle') || Math.hypot(e.x - t.x, e.y - t.y) > towerReachOf(t)) continue;
        const d = t.def;
        if (tt === 'ice') {
          if (ty.iceImmune) continue;                              // an Icicle is frozen already: Ice does nothing to it
          inIce = true; if (d.slowMult < slowMult) slowMult = d.slowMult; if (d.freezeSec > freeze) freeze = d.freezeSec;
        } else if (tt === 'fire') { inFire = true; if (d.burnDps > burnDps) { burnDps = d.burnDps; burnSec = d.burnSec; } }
        else if (tt === 'lamp') { lit = true; if (d.lampCrit > litCrit) litCrit = d.lampCrit; }
        else { inCandle = true; if (d.meltMult > melt) melt = d.meltMult; if (d.meltLingerSec > linger) linger = d.meltLingerSec; }
      }
      e.lit = lit; e.litCrit = litCrit;
      if (inCandle && !ty.boss) { e.softT = linger; e.meltMult = melt; } else if (e.softT > 0) e.softT = Math.max(0, e.softT - dt);
      e.soft = !ty.boss && (inCandle || e.softT > 0);
      if (cold) { slowMult = 1 - (1 - slowMult) * cold.coldIceMult; burnSec *= cold.coldBurnMult; }   // the cold: Ice weaker, burns longer
      if (e.slowT > 0) e.slowT = Math.max(0, e.slowT - dt);
      e.slowed = !e.type.boss && (inIce || e.slowT > 0);          // bosses can't be slowed
      e.slowMult = inIce ? slowMult : C.slowSpeedMult;
      if (inIce && !e.iced && freeze > 0 && !e.type.boss) e.holdT = Math.max(e.holdT, freeze);
      e.iced = inIce;
      if (ty.fireImmune) inFire = false;                          // Button Beetle: Fire Pins can't light it
      if (inFire) { e.burnLeft = burnSec; e.burnDps = burnDps; } else if (e.burnLeft > 0) e.burnLeft = Math.max(0, e.burnLeft - dt);
      e.burning = inFire || e.burnLeft > 0;
      if (e.burning) {                                           // burn in whole ticks, counted from catching fire
        const tick = C.towers.fire.burnTickMs / 1000;
        e.burnT += dt;
        if (e.burnT >= tick) { e.burnT -= tick; if (burn(e, e.burnDps * tick)) continue; }
      } else e.burnT = 0;
      if (e.bastedT > 0) e.bastedT = Math.max(0, e.bastedT - dt);
      if (stitchN > 0 && !e.air && !e.escortOf && !(ty.boss && !ty.mini)) stitchHold(e);   // a Basting Stitch across the road holds it
      if (e.holdT > 0) e.holdT = Math.max(0, e.holdT - dt);
      // a Snowball grows as it rolls: hp (at its own scaling) and radius, up to growMax x; softened by a Candle Pin it
      // stops and shrinks back toward its starting size at meltShrinkPerSec x those rates (melting never kills it)
      if (e.soft && (ty.growHpPerSec || ty.growRPerSec)) {
        const k = C.towers.candle.meltShrinkPerSec * dt, base = e.hpCap / (ty.growMax || 1);
        if (ty.growHpPerSec && e.maxHp > base) { const sub = Math.min(ty.growHpPerSec * e.hpMul * k, e.maxHp - base); e.maxHp -= sub; e.hp = Math.max(Math.min(e.hp, 0.05), e.hp - sub); }
        if (ty.growRPerSec && e.r > ty.r) e.r = Math.max(ty.r, e.r - ty.growRPerSec * k);
      } else {
        if (ty.growHpPerSec && e.maxHp < e.hpCap) { const add = Math.min(ty.growHpPerSec * e.hpMul * dt, e.hpCap - e.maxHp); e.hp += add; e.maxHp += add; }
        if (ty.growRPerSec && e.r < ty.r * ty.growMax) e.r = Math.min(ty.r * ty.growMax, e.r + ty.growRPerSec * dt);
      }
      // a Ribbon Shears curl underfoot: the slowest one it's on (bosses and Moths in the air ignore them)
      let curlMult = 1;
      if (curlN > 0 && !ty.boss && !e.air) {
        for (let c = 0; c < curls.length; c++) {
          const q = curls[c]; if (!q.on) continue;
          const dx = e.x - q.x, dy = e.y - q.y, rr = C.curlPx + e.r;
          if (dx * dx + dy * dy <= rr * rr && q.slow < curlMult) curlMult = q.slow;
        }
      }
      e.curled = curlMult < 1;
      const step = e.holdT > 0 ? 0 : e.speed * dt * (e.slowed ? e.slowMult : 1) * curlMult;   // held by the Ratchet Pruners' jaw / a Magnet clump / a freeze / a cork's stun
      if (ty.boss) bossMove(e, dt, step);                        // its own walk (bosses section)
      else if (e.escortOf) {                                     // a boss's swarm, teeth or catch: keeps its place round the boss
        const b = e.escortOf;
        if (b.on && b.gen === e.escortGen) e.u = clamp(b.u + e.escortOff, 0, 0.999); else e.escortOf = null;
      } else if (ty.hopEverySec) mothMove(e, dt, step);          // a Moth: walks, and hops (world rules section)
      else if (!e.pulling) e.u += step;                          // while a Magnet pulls it (or a gust carries it), its tween owns u, ox, oy
      if (e.u >= 1) { reachWorkshop(e); if (!live()) break; continue; }
      pathPoint(e);
      if (!e.pulling && !(e.bdef && e.bdef.rolling)) { e.ox = (e.ox + e.pvx * dt) * returnKeep; e.oy = (e.oy + e.pvy * dt) * returnKeep; keepOnRoad(e); }   // a rolling boss sets its own (rollBounce)
      e.pvx *= pushKeep; e.pvy *= pushKeep;
      e.x = e.px + e.ox; e.y = e.py + e.oy;
      if (ty.driftPx) {                                          // a Leaf drifts side to side across the road
        roadNormal(e);
        const max = level().roadHalfWidth * view.L, d = clamp(Math.sin(e.age * TAU / ty.driftSec + e.phase) * ty.driftPx, -max, max);
        e.x += NRM.x * d; e.y += NRM.y * d;
      }
      alive++;
    }
    if (live()) bladeContacts(realDt);
    if (live() && !isTutorial()) critterTick(dt, onScreen, seam, realDt);
    if (state.mode === 'PLAYING' && spawnIdx >= spawnList.length && alive === 0) {
      critterWaveEnd(state.wave);
      state.mode = 'WAVE_CLEAR'; state.modeT = 0;
      if (isEndless() && state.wave % C.endless.bossEvery === 0) state.hp = Math.min(C.workshopHp, state.hp + C.endless.healAfterBoss);   // a boss down: the heart mends a little
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
    p.t += wms / C.scorePopupMs; p.y -= C.scorePopupRisePx * dt; if (p.t >= 1) p.on = false;
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
