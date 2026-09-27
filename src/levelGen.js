// Level generator: a path recipe (text) -> a playable level in the same shape as the painted level files (src/levels/)
// (routes, Pin spots, workshop), all in plate units. src/levelArt.js paints its plate. No canvas and no DOM here, so
// the level lab (tools/level-lab.html) can use it too.
//
// A recipe is a comma-separated list of segments laid top to bottom, each a name plus optional words/numbers:
//   straight                    a short straight run
//   bend [left|right|center]    drift over to one side (default: the far side)
//   s [left|right] [amp]        one S: swing to a side, across to the other, back to the middle
//   wave [n] [left|right]       n gentle swings (default 3)
//   wiggle [n]                  n small swings (default 4)
//   zigzag [n] [left|right]     n full-width switchback rows (default 2); left/right = the way the first row heads
//   fork [wide|narrow] [pin]    the road splits around a big button and rejoins; each enemy picks a side at random.
//                               "pin" puts a Pin pad in the middle instead of the button
//   start left|right|center     (not a segment) where the road enters at the top
// Example: "start left, s, fork pin, zigzag 2". Unset sides come from the seed. randomRecipe(seed) writes one for you.
import { CONFIG as C } from './config.js';
import { makeRng } from '../vendor/mulberry32.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const SIDES = { left: -1, right: 1 };
const sideOf = (args, rng) => { for (const a of args) if (a in SIDES) return SIDES[a]; return rng() < 0.5 ? -1 : 1; };
const numOf = (args, def) => { for (const a of args) if (a !== '' && !isNaN(+a)) return +a; return def; };
const outer = () => C.levelGen.roadHalf + C.levelGen.roadBorder;   // painted road half-width incl. its brown edge

// The generator's geometry for map scale k (CONFIG.mapGrowth): the plate and the road's layout (bands, swings, fork
// arms, the heart, the pad band) spread out by k, while the road's width, pads, heart pad and segment heights keep
// their size, so a bigger map holds more road. Numbers written in a recipe ("s 150") stay plain plate units.
const SPREAD = ['w', 'h', 'startX', 'startY', 'endY', 'heartX', 'heartY', 'xMin', 'xMax', 'spotXMin', 'spotXMax', 'spotYMin', 'spotYMax',
  'sAmp', 'waveAmp', 'wiggleAmp', 'forkHalfW'];
export function geometry(k = 1) {
  const g = { ...C.levelGen, k };
  for (const key of SPREAD) g[key] = C.levelGen[key] * k;
  g.spotsMax = Math.round(C.levelGen.spotsMax * k);               // more road, room for more pads
  return g;
}
let G = geometry();                                               // set by buildLevel / randomRecipe for their scale

// Catmull-Rom through the control points P (the same curve game.js walks), as [[x, y], ...].
export function curve(P, steps = 12) {
  const out = [], n = P.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = P[Math.max(i - 1, 0)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(i + 2, n - 1)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t, pt = [0, 0];
      for (let j = 0; j < 2; j++) pt[j] = 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
      out.push(pt);
    }
  }
  out.push(P[n - 1].slice());
  return out;
}

// ======================= segments =======================
// min(args) / weight(args) size the segment's band; build(s) gets { x0 (entry x), y0, y1 (band), args, rng, warnings } and returns
// { pts } (appended to every route) or { lead, arms: [left, right] } (a fork), plus x (exit x) and optional deco.
const SEG = {
  straight: { min: () => 120, weight: () => 0.5, build: s => ({ pts: [[s.x0, s.y1]], x: s.x0 }) },
  bend: {
    min: () => 200, weight: () => 1,
    build(s) {
      const mid = (G.xMin + G.xMax) / 2;
      const t = s.args.includes('center') ? mid : s.args.includes('left') ? G.xMin + 30 : s.args.includes('right') ? G.xMax - 30
        : s.x0 < mid ? G.xMax - 30 : G.xMin + 30;
      return { pts: [[(s.x0 + t) / 2, (s.y0 + s.y1) / 2], [t, s.y1]], x: t };
    },
  },
  s: {
    min: () => 340, weight: () => 1.4,
    build(s) {
      const A = numOf(s.args, G.sAmp), side = sideOf(s.args, s.rng), h = s.y1 - s.y0;
      const xc = clamp(s.x0, G.xMin + A, G.xMax - A);
      return { pts: [[xc + side * A, s.y0 + h * 0.25], [xc - side * A, s.y0 + h * 0.75], [xc, s.y1]], x: xc };
    },
  },
  wave: {
    min: a => clamp(numOf(a, 3), 1, 8) * 150 + 60, weight: a => 0.45 * clamp(numOf(a, 3), 1, 8),
    build(s) { return swings(s, clamp(numOf(s.args, 3), 1, 8), G.waveAmp); },
  },
  wiggle: {
    min: a => clamp(numOf(a, 4), 1, 10) * 115 + 40, weight: a => 0.3 * clamp(numOf(a, 4), 1, 10),
    build(s) { return swings(s, clamp(numOf(s.args, 4), 1, 10), G.wiggleAmp); },
  },
  zigzag: {
    min: a => clamp(numOf(a, 2), 1, 5) * C.levelGen.zigRowMin + 40, weight: a => 0.9 * clamp(numOf(a, 2), 1, 5),
    build(s) {
      const n = clamp(numOf(s.args, 2), 1, 5), h = s.y1 - s.y0, g = h / n, mid = (G.xMin + G.xMax) / 2;
      const X = side => (side < 0 ? G.xMin + 10 : G.xMax - 10);
      // the first row turns off the incoming road and heads for the far side (or the side asked for); rows alternate,
      // joined by U-turns at the edges, and the road leaves from the last row's end, straight down
      let dir = s.args.includes('left') ? -1 : s.args.includes('right') ? 1 : s.x0 < mid ? 1 : -1;
      const pts = [];
      for (let k = 0; k < n; k++) {
        const y = s.y0 + g * (k + 0.5);
        pts.push([k ? X(-dir) + dir * G.zigInset : s.x0, y], [X(dir) - dir * G.zigInset, y]);
        if (k < n - 1) { pts.push([X(dir), y + g / 2]); dir = -dir; }   // the U-turn at the edge
      }
      const x = X(dir) + (mid - X(dir)) * 0.35;
      pts.push([x, s.y1]);
      return { pts, x };
    },
  },
  fork: {
    min: () => 480, weight: () => 1.6,
    build(s) {
      const W = numOf(s.args, s.args.includes('wide') ? 305 * G.k : s.args.includes('narrow') ? 220 * G.k : G.forkHalfW);
      // coming in off-centre, the lead-in is longer so the arm on that side doesn't double back under the incoming road
      const xc = clamp(s.x0, G.xMin + W, G.xMax - W), ya = s.y0 + G.forkLead + Math.min(160, Math.abs(s.x0 - xc) * 0.6), h = s.y1 - ya;
      const arm = side => [[xc + side * W * 0.35, ya + h * 0.1], [xc + side * W * 0.85, ya + h * 0.28], [xc + side * W, ya + h * 0.5],
        [xc + side * W * 0.85, ya + h * 0.72], [xc + side * W * 0.35, ya + h * 0.9], [xc, s.y1]];
      // the space inside the loop: a Pin pad if asked and it fits, else the big button (none if it's squeezed that small)
      const r = Math.min(W - outer() - 35, h / 2 - outer() - 45);
      let kind = s.args.includes('pin') ? 'pin' : 'button';
      if (kind === 'pin' && r < G.spotR + 5) { kind = 'button'; s.warnings.push('fork too small for a pin pad: button instead'); }
      return { lead: [[xc, ya]], arms: [arm(-1), arm(1)], x: xc, deco: r >= 30 ? { kind, x: xc, y: ya + h / 2, r } : null };
    },
  },
};
function swings(s, n, A0) {
  const A = numOf(s.args.filter(a => a !== String(n)), A0), side = sideOf(s.args, s.rng), h = s.y1 - s.y0;
  const xc = clamp(s.x0, G.xMin + A, G.xMax - A), pts = [];
  for (let k = 0; k < n; k++) pts.push([xc + (k % 2 ? -side : side) * A, s.y0 + h * (k + 0.5) / n]);
  pts.push([xc, s.y1]);
  return { pts, x: xc };
}
export const SEGMENT_NAMES = Object.keys(SEG);

// "s left, fork pin" -> [{ name: 's', args: ['left'] }, ...]. Unknown names are dropped with a warning.
export function parseRecipe(text, warnings = []) {
  const items = [];
  for (const raw of String(text).toLowerCase().split(/[,;>\n]+/)) {
    const words = raw.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    const name = words[0] === 'zig' || words[0] === 'switchback' ? 'zigzag' : words[0] === 'split' ? 'fork' : words[0];
    if (name !== 'start' && !SEG[name]) { warnings.push('unknown segment "' + words[0] + '"'); continue; }
    items.push({ name, args: words.slice(1) });
  }
  return items;
}

// ======================= build =======================
// recipe + seed -> a level: { name, blurb, gen: true, recipe, seed, w, h, paths, spots, spotR, roadHalfWidth,
// workshopR, heart, deco, warnings, mapScale }. `base` supplies name / blurb, and pads: 0 for a level with no Pin pads.
// scale = map scale (CONFIG.mapGrowth; 1 = the standard 941 x 1672 plate).
export function buildLevel(recipe, seed = 1, base = {}, scale = 1) {
  G = geometry(scale);
  const rng = makeRng(seed ^ 0x2F6B1D), warnings = [];
  const items = parseRecipe(recipe, warnings);
  let xs = G.startX;
  const segs = [];
  for (const it of items) {
    if (it.name === 'start') { xs = it.args.includes('left') ? G.xMin + 60 : it.args.includes('right') ? G.xMax - 60 : numOf(it.args, G.startX); continue; }
    segs.push(it);
  }
  if (!segs.length) segs.push({ name: 's', args: [] });
  // bands: each segment's minimum height, plus a share of the rest by weight; up to 12% too tall squeezes everything a
  // little, beyond that the last segments are dropped
  const span = G.endY - G.startY;
  let mins = segs.map(s => SEG[s.name].min(s.args));
  while (segs.length > 1 && mins.reduce((a, b) => a + b, 0) > span * 1.12) { warnings.push('no room for "' + segs.pop().name + '": dropped'); mins.pop(); }
  const sumMin = mins.reduce((a, b) => a + b, 0), weights = segs.map(s => SEG[s.name].weight(s.args)), sumW = weights.reduce((a, b) => a + b, 0);
  const extra = Math.max(0, span - sumMin);
  let routes = [[[xs, -90], [xs, 20]]], x = xs, y = G.startY;
  const deco = [], spots = [];
  segs.forEach((seg, i) => {
    const y1 = y + mins[i] * Math.min(1, span / sumMin) + extra * weights[i] / sumW;
    let out = SEG[seg.name].build({ x0: x, y0: y, y1, args: seg.args, rng, warnings });
    if (out.arms && routes.length * 2 > G.maxRoutes) { warnings.push('too many forks: one became an S'); out = SEG.s.build({ x0: x, y0: y, y1, args: [], rng, warnings }); }
    if (out.arms) {
      for (const r of routes) r.push(...out.lead);
      routes = routes.flatMap(r => out.arms.map(a => r.concat(a)));
    } else for (const r of routes) r.push(...out.pts);
    if (out.deco) { if (out.deco.kind === 'pin') spots.push([Math.round(out.deco.x), Math.round(out.deco.y)]); deco.push(out.deco); }
    x = out.x; y = y1;
  });
  // into the heart pad
  for (const r of routes) r.push([(x + G.heartX) / 2, G.endY + (G.heartY - G.endY) * 0.45], [G.heartX, G.heartY]);
  const paths = routes.map(r => r.map(([px, py]) => [Math.round(px), Math.round(py)]));
  const polys = paths.map(p => curve(p, 10));
  checkClearance(polys, warnings);
  if (base.pads === 0) spots.length = 0;                          // a level without Pins (level 0)
  else if (placeSpots(polys, spots, deco, rng) < G.spotsMin) warnings.push('only ' + spots.length + ' Pin pads fit');
  return {
    name: base.name || 'Custom Road', blurb: base.blurb || recipe, gen: true, recipe, seed,
    w: G.w, h: G.h, mapScale: G.k, paths, spots, spotR: G.spotR, roadHalfWidth: G.roadHalfWidth, workshopR: G.workshopR,
    heart: [G.heartX, G.heartY], deco, warnings,
  };
}

// Distance from (x, y) to the nearest point of any polyline.
function distToRoads(polys, x, y) {
  let best = Infinity;
  for (const P of polys) for (let i = 0; i < P.length - 1; i++) {
    const [ax, ay] = P[i], [bx, by] = P[i + 1], vx = bx - ax, vy = by - ay, L = vx * vx + vy * vy;
    const t = L > 0 ? clamp(((x - ax) * vx + (y - ay) * vy) / L, 0, 1) : 0, dx = x - ax - vx * t, dy = y - ay - vy * t, d = dx * dx + dy * dy;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

// Warn where a route passes too close to an earlier stretch of itself (the painted roads would touch).
function checkClearance(polys, warnings) {
  const need = 2 * outer() + G.roadGap * 0.5;
  polys.forEach(P => {
    const cum = [0];
    for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    for (let i = 0; i < P.length; i += 2) for (let j = i + 2; j < P.length; j += 2) {
      if (cum[j] - cum[i] < need * 2.2) continue;
      if (Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]) < need) {
        const msg = 'road runs close to itself near (' + Math.round(P[j][0]) + ', ' + Math.round(P[j][1]) + ')';
        if (!warnings.includes(msg)) warnings.push(msg);
        return;
      }
    }
    for (const [px] of P) if (px < G.xMin - 50 || px > G.xMax + 50) { warnings.push('road leaves the safe band (x ' + Math.round(px) + ')'); return; }
  });
}

// Pin pads: candidates just off the road on both sides, clear of every road, the fork buttons and the heart; then
// spread out by farthest-point picking (a little seeded jitter so different seeds pick differently).
function placeSpots(polys, spots, deco, rng) {
  const R = G.spotR, off = outer() + G.spotGap + R, heartClear = G.workshopR + R + 30;
  const cands = [];
  for (const P of polys) {
    let acc = 0;
    for (let i = 1; i < P.length - 1; i++) {
      acc += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
      if (acc < 28) continue;
      acc = 0;
      const tx = P[i + 1][0] - P[i - 1][0], ty = P[i + 1][1] - P[i - 1][1], tl = Math.hypot(tx, ty) || 1;
      for (const side of [-1, 1]) {
        const cx = P[i][0] - ty / tl * off * side, cy = P[i][1] + tx / tl * off * side;
        if (cx < G.spotXMin || cx > G.spotXMax || cy < G.spotYMin || cy > G.spotYMax) continue;
        if (Math.hypot(cx - G.heartX, cy - G.heartY) < heartClear) continue;
        if (deco.some(d => Math.hypot(cx - d.x, cy - d.y) < d.r + R + 25)) continue;
        if (distToRoads(polys, cx, cy) < off - 3) continue;
        cands.push([cx, cy]);
      }
    }
  }
  const len = polys[0].reduce((a, p, i) => i ? a + Math.hypot(p[0] - polys[0][i - 1][0], p[1] - polys[0][i - 1][1]) : 0, 0);
  const want = clamp(Math.round(len / G.spotEveryLen), G.spotsMin, G.spotsMax), minSep = 2 * R + G.spotSpacing;
  const jitter = cands.map(() => rng() * 60);
  while (spots.length < want) {
    let best = -1, bestScore = -Infinity;
    cands.forEach(([cx, cy], k) => {
      let d = spots.length ? Infinity : Math.hypot(cx - G.heartX, cy - G.heartY) * 0.5;
      for (const [sx, sy] of spots) d = Math.min(d, Math.hypot(cx - sx, cy - sy));
      if (spots.length && d < minSep) return;
      if (d + jitter[k] > bestScore) { bestScore = d + jitter[k]; best = k; }
    });
    if (best < 0) break;
    spots.push(cands[best].map(Math.round));
  }
  return spots.length;
}

// ======================= random recipes =======================
// A recipe for "Random Quilt": segments drawn by weight until the road is about full; at most one fork (two if room).
const POOL = [['s', 3], ['zigzag', 2], ['fork', 2.2], ['bend', 1.2], ['wave', 1.2], ['wiggle', 0.7], ['straight', 0.4]];
export function randomRecipe(seed, scale = 1) {
  G = geometry(scale);
  const rng = makeRng(seed ^ 0x51ED27), span = G.endY - G.startY, items = [];
  let used = 0, forks = 0, last = '';
  const total = POOL.reduce((a, p) => a + p[1], 0);
  for (let tries = 0; tries < 30 && used < span * 0.8; tries++) {
    let r = rng() * total, name = POOL[0][0];
    for (const [n, w] of POOL) { if ((r -= w) <= 0) { name = n; break; } }
    if (name === last || (name === 'fork' && forks >= (used < span * 0.3 ? 2 : 1))) continue;
    const pick = a => a[Math.floor(rng() * a.length)];
    const args = name === 's' || name === 'bend' ? [pick(['left', 'right'])]
      : name === 'zigzag' ? [String(1 + Math.floor(rng() * 3))]
      : name === 'wave' ? [String(2 + Math.floor(rng() * 3))]
      : name === 'fork' ? (rng() < 0.35 ? ['pin'] : rng() < 0.5 ? ['wide'] : []) : [];
    const min = SEG[name].min(args);
    if (used + min > span) continue;
    items.push([name, ...args].join(' ')); used += min; last = name;
    if (name === 'fork') forks++;
  }
  return items.join(', ');
}
