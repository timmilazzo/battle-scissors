// Critters: bonus targets that aren't enemies. Plain data and rules only (render.js draws them, game.js calls in).
// Only a manual snip can hit one: no HP, not part of any wave, never reaches the workshop, and Pins and SHRED don't
// see them (they live in their own pool, never in state.enemies). A squish pays a fixed amount of Thread; nothing
// about a critter ever pays Buttons (the two squish achievements in achievements.js are the only link, once each).
//
// Spawns come from the run's seeded critter stream (game.js rng.critter), never a real-time clock. Per level: a cap
// (the level file's `critters: { silverfish: n }`, else CONFIG.critters.perWorld), each one given to a random wave that
// has no boss, and due at a random moment of that wave's window (minWaveSec .. the last enemy spawn + tailSec, on the
// wave clock). A due one waits while fewer than minEnemies enemies are on screen or a boss's seam is splitting open;
// if its wave ends first it moves to the next eligible wave. A level with `critterIntro` also gets one scripted
// crossing in wave 1's first lull (it counts toward the cap and ignores those rules).
//
// Silverfish: crawls from one screen edge to the opposite one in crossSec on a gently wobbling line chosen to stay
// off the road. Blades opening (not blades already held open and still) within skitterPx of it make it skitter once per crossing: a 90 degree turn away from
// them and a burst for skitterSec, then it crawls on in its old direction.
import { CONFIG as C } from './config.js';
import { view, level, TAU, clamp, segDistSq } from './core.js';
import { cutZoneHits } from './scissors.js';

// on, x/y = where it is (px), bx/by = its line's point (x/y adds the wobble), dx/dy = its crossing direction,
// vx/vy = the direction it moves now (turned while skittering), speed = px/s, age (s), ph = wobble phase,
// skittered = used its one skitter, skT = skitter burst left (s), ang = drawn heading, intro = the scripted crossing,
// onRoad = how many of its line's 25 samples touch the road (0 unless no clear line fit this screen).
export const critters = [];
for (let i = 0; i < 4; i++) critters.push({ on: false, kind: '', x: 0, y: 0, bx: 0, by: 0, dx: 0, dy: 0, vx: 0, vy: 0,
  speed: 0, age: 0, ph: 0, skittered: false, skT: 0, ang: 0, r: 0, intro: false, onRoad: 0 });
// squish splats: t = 0 -> 1 over splatSec, rot, and a few shape numbers (visual only, so Math.random)
export const splats = [];
for (let i = 0; i < 6; i++) splats.push({ on: false, x: 0, y: 0, t: 0, rot: 0, k0: 0, k1: 0, k2: 0, k3: 0 });

// cap = this level's critters; spawned / killed this run; perWave[i] = how many are given to wave i + 1; due = the
// current wave's spawn times (wave clock seconds, sorted; dueN of them, dueIdx spawned); introPending = the scripted
// crossing hasn't come yet.
export const plan = { cap: 0, spawned: 0, killed: 0, perWave: [], eligible: [], due: new Float32Array(8), dueN: 0, dueIdx: 0,
  introPending: false, retryT: 0 };

export const critterCap = lv => {
  const c = lv.critters;
  return c ? (c.silverfish | 0) : (C.critters.perWorld[lv.world] | 0);
};

// Run start: hand this level's critters out to its boss-free waves (rnd = the run's critter stream).
export function planCritters(lv, waves, rnd, isBoss) {
  plan.cap = critterCap(lv); plan.spawned = plan.killed = 0; plan.dueN = plan.dueIdx = 0; plan.retryT = 0;
  plan.perWave.length = 0; plan.eligible.length = 0;
  waves.forEach((w, i) => { plan.perWave.push(0); if (!w.some(([n]) => isBoss(n))) plan.eligible.push(i); });
  let left = plan.cap;
  plan.introPending = !!lv.critterIntro && left > 0 && plan.eligible[0] === 0;
  if (plan.introPending) left--;
  if (!plan.eligible.length) return;
  for (; left > 0; left--) plan.perWave[plan.eligible[Math.min(plan.eligible.length - 1, Math.floor(rnd() * plan.eligible.length))]]++;
}

// Wave n begins; lastSpawnSec = its last scheduled enemy spawn. Its critters are due at random moments of its window.
export function critterWave(n, lastSpawnSec, rnd) {
  const K = C.critters, count = Math.min(plan.due.length, plan.perWave[n - 1] || 0);
  const from = K.minWaveSec, to = Math.max(from + 2, lastSpawnSec + K.tailSec);
  for (let i = 0; i < count; i++) plan.due[i] = from + rnd() * (to - from);
  plan.due.subarray(0, count).sort();
  plan.dueN = count; plan.dueIdx = 0; plan.retryT = 0;
}
// Wave n is over: critters that never got their moment move to the next eligible wave (or are gone after the last).
export function critterWaveEnd(n) {
  const left = plan.dueN - plan.dueIdx;
  plan.dueN = plan.dueIdx = 0;
  if (plan.introPending && n === 1) { plan.introPending = false; if (plan.perWave.length > 1) carry(n, 1); }
  if (left > 0) carry(n, left);
}
function carry(n, k) {
  const next = plan.eligible.find(i => i >= n);
  if (next !== undefined) plan.perWave[next] += k;
}

export function clearCritters() {
  for (const c of critters) c.on = false;
  for (const s of splats) s.on = false;
  plan.dueN = plan.dueIdx = 0; plan.introPending = false;
}
// The scripted crossing is on the table (game.js holds the wave clock meanwhile).
export const introActive = () => { for (const c of critters) if (c.on && c.intro) return true; return false; };

// ---- lanes: an edge-to-edge line that stays off the road (or, where none fits, the one that crosses it least) ----
function roadClear(x, y, paths, need2) {
  for (const p of paths) {
    for (let k = 0; k + 4 < p.n; k += 4) if (segDistSq(x, y, p.x[k], p.y[k], p.x[k + 4], p.y[k + 4]) < need2) return false;
  }
  return true;
}
const lane = { sx: 0, sy: 0, ex: 0, ey: 0, hits: 0 };            // hits = samples of the chosen line on the road (0 = clear)
function pickLane(rnd, paths) {
  const F = C.critters.silverfish, W = view.W, H = view.H, m = F.len * 0.8;
  const yTop = H * F.laneYMin, yLow = H * F.laneYMax;                   // side-to-side lanes: below the HUD, above the action bar
  const need = level().roadHalfWidth * view.L + F.laneClearPx + F.wobblePx, need2 = need * need;
  let best = Infinity;
  for (let i = 0; i < F.laneTries; i++) {
    const edge = Math.floor(rnd() * 4), t0 = rnd(), t1 = clamp(t0 + (rnd() - 0.5) * 0.3, 0, 1);
    let sx, sy, ex, ey;
    if (edge < 2) {                                               // top <-> bottom
      sx = W * (0.04 + 0.92 * t0); ex = W * (0.04 + 0.92 * t1);
      sy = edge === 0 ? -m : H + m; ey = edge === 0 ? H + m : -m;
    } else {                                                      // left <-> right
      sy = yTop + (yLow - yTop) * t0; ey = yTop + (yLow - yTop) * t1;
      sx = edge === 2 ? -m : W + m; ex = edge === 2 ? W + m : -m;
    }
    let hits = 0;
    for (let k = 0; k <= 24; k++) {
      const x = sx + (ex - sx) * k / 24, y = sy + (ey - sy) * k / 24;
      if (x < 0 || x > W || y < 0 || y > H) continue;             // off screen: it can cross what it likes there
      if (!roadClear(x, y, paths, need2)) hits++;
    }
    if (hits < best) { best = lane.hits = hits; lane.sx = sx; lane.sy = sy; lane.ex = ex; lane.ey = ey; if (!hits) break; }
  }
}

function spawnSilverfish(rnd, paths, intro) {
  let c = null;
  for (const o of critters) if (!o.on) { c = o; break; }
  if (!c) return null;
  const F = C.critters.silverfish;
  pickLane(rnd, paths);
  const len = Math.hypot(lane.ex - lane.sx, lane.ey - lane.sy) || 1;
  c.on = true; c.kind = 'silverfish'; c.intro = intro; c.r = F.r; c.onRoad = lane.hits;
  c.bx = c.x = lane.sx; c.by = c.y = lane.sy;
  c.dx = c.vx = (lane.ex - lane.sx) / len; c.dy = c.vy = (lane.ey - lane.sy) / len;
  c.speed = len / F.crossSec * (intro ? F.introSpeedMult : 1);
  c.age = 0; c.ph = rnd() * TAU; c.skittered = false; c.skT = 0; c.ang = Math.atan2(c.dy, c.dx);
  plan.spawned++;
  return c;
}

// Distance (px) from (x, y) to the open blades: env.bx/by pivot, theta aim (0 = up), a = half-angle, L = length
// (slide weapons: the hole, a circle of radius L).
function bladeDist(x, y, env) {
  const rx = x - env.bx, ry = y - env.by, d = Math.hypot(rx, ry);
  if (env.slide) return Math.max(0, d - env.L);
  const ax = Math.sin(env.theta), ay = -Math.cos(env.theta);
  const off = Math.abs(Math.atan2(ax * ry - ay * rx, ax * rx + ay * ry));
  if (off <= env.a) return Math.max(0, d - env.L);
  const lx = env.bx + env.L * Math.sin(env.theta - env.a), ly = env.by - env.L * Math.cos(env.theta - env.a);
  const qx = env.bx + env.L * Math.sin(env.theta + env.a), qy = env.by - env.L * Math.cos(env.theta + env.a);
  return Math.sqrt(Math.min(segDistSq(x, y, env.bx, env.by, lx, ly), segDistSq(x, y, env.bx, env.by, qx, qy)));
}

// Per frame while a level is live. env (game.js fills one reused object): rnd, paths, playing (PLAYING, not the tutorial),
// wave, waveT (wave clock), onScreen (enemies on screen), seam (a boss seam opening or open), shown / open (blades
// visible, 0..1 open), opening (the blades are opening right now), bx, by, theta, a, L, slide. Returns 'skitter' when one skittered this frame (for its sound).
export function updateCritters(dt, env) {
  const K = C.critters, F = K.silverfish;
  let said = '';
  if (env.playing) {
    if (plan.introPending && env.wave === 1 && (env.waveT >= F.introLatestSec || (env.waveT >= F.introEarliestSec && env.onScreen === 0))) {
      if (spawnSilverfish(env.rnd, env.paths, true)) plan.introPending = false;
    }
    if (plan.dueIdx < plan.dueN && plan.due[plan.dueIdx] <= env.waveT && (plan.retryT -= dt) <= 0) {
      plan.retryT = K.retrySec;
      if (env.onScreen >= K.minEnemies && !env.seam && spawnSilverfish(env.rnd, env.paths, false)) plan.dueIdx++;
    }
  }
  const W = view.W, H = view.H, keep = 1 - Math.exp(-F.turnRate * dt);
  for (const c of critters) {
    if (!c.on) continue;
    c.age += dt;
    if (!c.skittered && env.shown && env.opening && env.open >= F.skitterOpen && bladeDist(c.x, c.y, env) <= F.skitterPx) {
      // 90 degrees off its line, on the side away from the blades' middle
      const mx = env.bx + Math.sin(env.theta) * env.L * 0.5, my = env.by - Math.cos(env.theta) * env.L * 0.5;
      const s = (-c.dy) * (c.x - mx) + c.dx * (c.y - my) >= 0 ? 1 : -1;
      c.vx = -c.dy * s; c.vy = c.dx * s; c.skT = F.skitterSec; c.skittered = true; said = 'skitter';
    }
    let v = c.speed;
    if (c.skT > 0) { v *= F.skitterMult; if ((c.skT -= dt) <= 0) { c.skT = 0; c.vx = c.dx; c.vy = c.dy; } }
    c.bx += c.vx * v * dt; c.by += c.vy * v * dt;
    const w = F.wobblePx * Math.sin(TAU * F.wobbleHz * c.age + c.ph);
    const nx = c.bx - c.dy * w, ny = c.by + c.dx * w;
    const mvx = nx - c.x, mvy = ny - c.y;
    if (mvx * mvx + mvy * mvy > 1e-4) {
      let da = Math.atan2(mvy, mvx) - c.ang; da = Math.atan2(Math.sin(da), Math.cos(da));
      c.ang += da * keep;
    }
    c.x = nx; c.y = ny;
    const m = F.len * 1.2;                                        // gone off an edge (no penalty, no message)
    if (c.age > F.maxLifeSec || (c.age > 0.3 && (c.x < -m || c.x > W + m || c.y < -m || c.y > H + m))) c.on = false;
  }
  for (const s of splats) if (s.on && (s.t += dt / F.splatSec) >= 1) s.on = false;
  return said;
}

// A manual snip's cut zone is set (scissors.setCutZone): squish every critter in it. onKill(c) pays for each.
export function snipCritters(pad, onKill) {
  for (const c of critters) {
    if (!c.on || !cutZoneHits(c.x, c.y, c.r, pad)) continue;
    c.on = false; plan.killed++;
    let s = splats[0];
    for (const o of splats) { if (!o.on) { s = o; break; } if (o.t > s.t) s = o; }
    s.on = true; s.x = c.x; s.y = c.y; s.t = 0; s.rot = c.ang;
    s.k0 = Math.random(); s.k1 = Math.random(); s.k2 = Math.random(); s.k3 = Math.random();
    onKill(c);
  }
}
