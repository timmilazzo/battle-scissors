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
//   fork [wide|narrow|long] [pin]  the road splits around a big button and rejoins; each enemy picks a side at random.
//                               "pin" puts a Pin pad in the middle instead of the button; "long" makes one arm a short
//                               direct run and the other a long detour (most enemies take the short one)
//   triple                      splits three ways (left, straight on, right) around two buttons, then rejoins
// Directives (not segments; anywhere in the recipe):
//   start left|right|center     where the road enters at the top
//   entry left|right|top [pct]  another entrance: a road comes in from that side (pct = how far down the road, 5-60; never up under
//                               the HUD) or from the top right of centre, and merges into the main road. Enemies pick an
//                               entrance at random
//   heart left|right|center     where the heart pad sits (a little off-centre, never sideways-on)
//   size n                      a bigger play surface (1 = the usual plate, 1.5 = 1.5x as much road on the same screen)
// Example: "size 1.4, start left, s, entry right 30, fork pin, zigzag 2". Unset sides come from the seed. randomRecipe(seed)
// writes one for you.
//
// Internally the road is laid out on the usual 941 x 1672 plate with its road, pads and heart scaled by n^sizeRoadExp / n (so
// they're thinner relative to the plate), then every coordinate is multiplied by n at the end. levelArt.js paints back in
// the unscaled space.
import { CONFIG as C } from './config.js';
import { makeRng } from '../vendor/mulberry32.js';

// The generator settings in force (CONFIG.levelGen, or a scaled copy while a bigger level is being built).
let GEN = C.levelGen;
const ROADISH = ['roadHalf', 'roadBorder', 'roadHalfWidth', 'roadGap', 'spotR', 'spotGap', 'spotSpacing', 'workshopR', 'zigRowMin'];
function scaledGen(size) {
  const g = { ...C.levelGen }, f = Math.pow(size, C.levelGen.sizeRoadExp) / size;   // road things: shrink by this in the unscaled space
  for (const k of ROADISH) g[k] = C.levelGen[k] * f;
  return g;
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const SIDES = { left: -1, right: 1 };
const sideOf = (args, rng) => { for (const a of args) if (a in SIDES) return SIDES[a]; return rng() < 0.5 ? -1 : 1; };
const numOf = (args, def) => { for (const a of args) if (a !== '' && !isNaN(+a)) return +a; return def; };
const outer = () => GEN.roadHalf + GEN.roadBorder;   // painted road half-width incl. its brown edge

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
      const G = GEN, mid = (G.xMin + G.xMax) / 2;
      const t = s.args.includes('center') ? mid : s.args.includes('left') ? G.xMin + 30 : s.args.includes('right') ? G.xMax - 30
        : s.x0 < mid ? G.xMax - 30 : G.xMin + 30;
      return { pts: [[(s.x0 + t) / 2, (s.y0 + s.y1) / 2], [t, s.y1]], x: t };
    },
  },
  s: {
    min: () => 340, weight: () => 1.4,
    build(s) {
      const G = GEN, A = numOf(s.args, G.sAmp), side = sideOf(s.args, s.rng), h = s.y1 - s.y0;
      const xc = clamp(s.x0, G.xMin + A, G.xMax - A);
      return { pts: [[xc + side * A, s.y0 + h * 0.25], [xc - side * A, s.y0 + h * 0.75], [xc, s.y1]], x: xc };
    },
  },
  wave: {
    min: a => clamp(numOf(a, 3), 1, 8) * 150 + 60, weight: a => 0.45 * clamp(numOf(a, 3), 1, 8),
    build(s) { return swings(s, clamp(numOf(s.args, 3), 1, 8), GEN.waveAmp); },
  },
  wiggle: {
    min: a => clamp(numOf(a, 4), 1, 10) * 115 + 40, weight: a => 0.3 * clamp(numOf(a, 4), 1, 10),
    build(s) { return swings(s, clamp(numOf(s.args, 4), 1, 10), GEN.wiggleAmp); },
  },
  zigzag: {
    min: a => clamp(numOf(a, 2), 1, 5) * GEN.zigRowMin + 40, weight: a => 0.9 * clamp(numOf(a, 2), 1, 5),
    build(s) {
      const G = GEN, n = clamp(numOf(s.args, 2), 1, 5), h = s.y1 - s.y0, g = h / n, mid = (G.xMin + G.xMax) / 2;
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
      const G = GEN, long = s.args.includes('long'), W = numOf(s.args, s.args.includes('wide') ? 305 : s.args.includes('narrow') ? 220 : G.forkHalfW);
      // "long": a short arm (150 out) and a long detour (290 out), the detour on a random side; else two equal arms
      const shortSide = long ? sideOf(s.args, s.rng) : 0, Wl = long ? 150 : W, Wr = long ? 290 : W;   // reach on the left / right
      const wl = shortSide < 0 ? Wl : Wr, wr = shortSide < 0 ? Wr : Wl;                              // (short arm on shortSide)
      // coming in off-centre, the lead-in is longer so the arm on that side doesn't double back under the incoming road
      const xc = clamp(s.x0, G.xMin + wl, G.xMax - wr), ya = s.y0 + G.forkLead + Math.min(160, Math.abs(s.x0 - xc) * 0.6), h = s.y1 - ya;
      const arm = (side, Wa) => [[xc + side * Wa * 0.35, ya + h * 0.1], [xc + side * Wa * 0.85, ya + h * 0.28], [xc + side * Wa, ya + h * 0.5],
        [xc + side * Wa * 0.85, ya + h * 0.72], [xc + side * Wa * 0.35, ya + h * 0.9], [xc, s.y1]];
      // the space inside the loop: a Pin pad if asked and it fits, else the big button (none if it's squeezed that small)
      const cx = xc + (wr - wl) / 2, r = Math.min((wl + wr) / 2 - outer() - 35, h / 2 - outer() - 45);
      let kind = s.args.includes('pin') ? 'pin' : 'button';
      if (kind === 'pin' && r < G.spotR + 5) { kind = 'button'; s.warnings.push('fork too small for a pin pad: button instead'); }
      return {
        lead: [[xc, ya]], arms: [arm(-1, wl), arm(1, wr)], armW: long ? (shortSide < 0 ? [0.65, 0.35] : [0.35, 0.65]) : null, x: xc,
        deco: r >= 30 ? { kind, x: cx, y: ya + h / 2, r } : null,
      };
    },
  },
  triple: {
    min: () => 560, weight: () => 1.8,
    build(s) {
      const G = GEN, W = G.forkHalfW * 0.95, xc = clamp(s.x0, G.xMin + W, G.xMax - W);
      const ya = s.y0 + G.forkLead + Math.min(160, Math.abs(s.x0 - xc) * 0.6), h = s.y1 - ya;
      const side = sd => [[xc + sd * W * 0.35, ya + h * 0.1], [xc + sd * W * 0.85, ya + h * 0.28], [xc + sd * W, ya + h * 0.5],
        [xc + sd * W * 0.85, ya + h * 0.72], [xc + sd * W * 0.35, ya + h * 0.9], [xc, s.y1]];
      const mid = [[xc, ya + h * 0.3], [xc, ya + h * 0.7], [xc, s.y1]];
      // an island between the straight road and each side arm
      const r = Math.min(W / 2 - outer() - 12, h / 2 - outer() - 45);
      return {
        lead: [[xc, ya]], arms: [side(-1), mid, side(1)], armW: [0.3, 0.4, 0.3], x: xc,
        deco: r >= 30 ? [{ kind: 'button', x: xc - W / 2, y: ya + h / 2, r }, { kind: 'button', x: xc + W / 2, y: ya + h / 2, r }] : null,
      };
    },
  },
};
function swings(s, n, A0) {
  const G = GEN, A = numOf(s.args.filter(a => a !== String(n)), A0), side = sideOf(s.args, s.rng), h = s.y1 - s.y0;
  const xc = clamp(s.x0, G.xMin + A, G.xMax - A), pts = [];
  for (let k = 0; k < n; k++) pts.push([xc + (k % 2 ? -side : side) * A, s.y0 + h * (k + 0.5) / n]);
  pts.push([xc, s.y1]);
  return { pts, x: xc };
}
export const SEGMENT_NAMES = Object.keys(SEG);

// "s left, fork pin" -> [{ name: 's', args: ['left'] }, ...]. Unknown names are dropped with a warning.
const DIRECTIVES = ['start', 'entry', 'heart', 'size'];
export function parseRecipe(text, warnings = []) {
  const items = [];
  for (const raw of String(text).toLowerCase().split(/[,;>\n]+/)) {
    const words = raw.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    const name = words[0] === 'zig' || words[0] === 'switchback' ? 'zigzag' : words[0] === 'split' ? 'fork' : words[0];
    if (!DIRECTIVES.includes(name) && !SEG[name]) { warnings.push('unknown segment "' + words[0] + '"'); continue; }
    items.push({ name, args: words.slice(1) });
  }
  return items;
}

// ======================= build =======================
// recipe + seed -> a level: { name, blurb, gen: true, recipe, seed, size, w, h, paths, entryOf, entries, pathW, spots, spotR,
// roadHalfWidth, roadHalf, roadBorder, workshopR, heart, deco, warnings }, all in plate units of the (size-times) plate.
// `base` supplies name / blurb / size, and pads: 0 for a level with no Pin pads.
export function buildLevel(recipe, seed = 1, base = {}) {
  const warnings = [], items = parseRecipe(recipe, warnings);
  let size = base.size || 1;
  for (const it of items) if (it.name === 'size') size = numOf(it.args, size);
  size = clamp(size, 1, 2.5);
  GEN = scaledGen(size);
  try {
    for (const it of items) if (it.name === 'heart') GEN.heartX = C.levelGen.heartX + (it.args.includes('left') ? -1 : it.args.includes('right') ? 1 : 0) * C.levelGen.heartShift;
    return build(items, recipe, seed, base, size, warnings);
  } finally { GEN = C.levelGen; }
}

function build(items, recipe, seed, base, size, warnings) {
  const G = GEN, rng = makeRng(seed ^ 0x2F6B1D);
  let xs = G.startX;
  const segs = [], entrySpecs = [];
  for (const it of items) {
    if (it.name === 'start') xs = it.args.includes('left') ? G.xMin + 60 : it.args.includes('right') ? G.xMax - 60 : numOf(it.args, G.startX);
    else if (it.name === 'entry') entrySpecs.push(it.args);
    else if (SEG[it.name]) segs.push(it);
  }
  if (!segs.length) segs.push({ name: 's', args: [] });
  // bands: each segment's minimum height, plus a share of the rest by weight; up to 12% too tall squeezes everything a
  // little, beyond that the last segments are dropped
  const span = G.endY - G.startY;
  let mins = segs.map(s => SEG[s.name].min(s.args));
  while (segs.length > 1 && mins.reduce((a, b) => a + b, 0) > span * 1.12) { warnings.push('no room for "' + segs.pop().name + '": dropped'); mins.pop(); }
  const sumMin = mins.reduce((a, b) => a + b, 0), weights = segs.map(s => SEG[s.name].weight(s.args)), sumW = weights.reduce((a, b) => a + b, 0);
  const extra = Math.max(0, span - sumMin);
  let routes = [[[xs, -90], [xs, 20]]], wts = [1], x = xs, y = G.startY;
  const deco = [], spots = [];
  segs.forEach((seg, i) => {
    const y1 = y + mins[i] * Math.min(1, span / sumMin) + extra * weights[i] / sumW;
    let out = SEG[seg.name].build({ x0: x, y0: y, y1, args: seg.args, rng, warnings });
    if (out.arms && routes.length * out.arms.length > G.maxRoutes) { warnings.push('too many forks: one became an S'); out = SEG.s.build({ x0: x, y0: y, y1, args: [], rng, warnings }); }
    if (out.arms) {
      const nr = [], nw = [];
      routes.forEach((r, k) => { r.push(...out.lead); out.arms.forEach((a, j) => { nr.push(r.concat(a)); nw.push(wts[k] * (out.armW ? out.armW[j] : 1)); }); });
      routes = nr; wts = nw;
    } else for (const r of routes) r.push(...out.pts);
    for (const d of [].concat(out.deco || [])) { if (d.kind === 'pin') spots.push([Math.round(d.x), Math.round(d.y)]); deco.push(d); }
    x = out.x; y = y1;
  });
  // into the heart pad
  for (const r of routes) r.push([(x + G.heartX) / 2, G.endY + (G.heartY - G.endY) * 0.45], [G.heartX, G.heartY]);
  checkClearance(routes.map(r => curve(r, 10)), warnings);
  // other entrances: roads that join the main one; entryOf[i] = which entrance path i belongs to (0 = the top)
  const nMain = routes.length, entryOf = routes.map(() => 0);
  let nEntries = 1;
  for (const spec of entrySpecs) {
    const added = addEntry(routes, wts, nMain, spec, span, xs, rng, warnings);
    if (!added) continue;
    for (const [pts, w] of added) { routes.push(pts); wts.push(w); entryOf.push(nEntries); }
    nEntries++;
  }
  const paths = routes.map(r => r.map(([px, py]) => [Math.round(px), Math.round(py)]));
  const polys = paths.map(p => curve(p, 10));
  if (paths.length > G.maxPaths) warnings.push(paths.length + ' paths (over ' + G.maxPaths + ')');
  if (base.pads === 0) spots.length = 0;                          // a level without Pins (level 0)
  else if (placeSpots(polys, spots, deco, rng) < G.spotsMin) warnings.push('only ' + spots.length + ' Pin pads fit');
  // scale everything up to the plate's real size (the road things were already shrunk to match, see scaledGen)
  const S = size, sc = v => Math.round(v * S), pt = ([px, py]) => [sc(px), sc(py)];
  return {
    name: base.name || 'Custom Road', blurb: base.blurb || recipe, gen: true, recipe, seed, size,
    w: Math.round(G.w * S), h: Math.round(G.h * S), paths: paths.map(p => p.map(pt)), entries: nEntries, entryOf,
    pathW: wts.some(v => v !== wts[0]) ? wts.slice() : null,
    spots: spots.map(pt), spotR: G.spotR * S, roadHalfWidth: G.roadHalfWidth * S, roadHalf: G.roadHalf * S, roadBorder: G.roadBorder * S,
    workshopR: G.workshopR * S, heart: [sc(G.heartX), sc(G.heartY)], deco: deco.map(d => ({ ...d, x: sc(d.x), y: sc(d.y), r: d.r * S })), warnings,
  };
}

// One more entrance. spec = ['left'|'right'|'top', pct?]. Tries merge points on the main roads (in random order): the side
// road comes in from the edge, runs beside the trunk (kept clear of it) and joins at the merge point, then follows every
// main route that shares that point. Returns [[points, weight], ...] for the paths to add, or null (a warning is added).
function addEntry(routes, wts, nMain, spec, span, xs, rng, warnings) {
  const G = GEN, W = G.w, mid = (G.xMin + G.xMax) / 2, need = 2 * outer() + G.roadGap * 0.5, clear = C.levelGen.entryClear;
  const edge = spec.includes('right') ? 'right' : spec.includes('top') ? 'top' : 'left';
  // keep entrances out from under the HUD (top left: wave badge, hearts, SHRED) and the pause button (top right)
  const yE = Math.max(G.startY + span * clamp(numOf(spec, 30), 5, 60) / 100, edge === 'left' ? 400 : 260);
  const trunk = routes.map(r => curve(r, 10));
  // merge point candidates: control points of the main routes, below where the side road enters
  const seen = new Set(), cands = [];
  routes.slice(0, nMain).forEach(r => r.forEach(([px, py], i) => {
    const key = px + ',' + py;
    if (i < 2 || seen.has(key) || py < (edge === 'top' ? 380 : yE + 170) || py > G.endY - 40) return;
    seen.add(key); cands.push([px, py]);
  }));
  for (let i = cands.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [cands[i], cands[j]] = [cands[j], cands[i]]; }
  // a second top entrance comes in right of centre, away from the HUD; each merge point is tried with a shallow and a steep approach
  const xs2 = edge === 'top' ? [G.xMax - 110, mid + 60, mid - 60].filter(v => Math.abs(v - xs) > need + 40) : [0];
  for (const [mx, my] of cands.slice(0, C.levelGen.entryTries)) for (const dy of [150, 270]) for (const xt of xs2) {
    const sd = edge === 'left' ? -1 : edge === 'right' ? 1 : (xt < mx ? -1 : 1), cx = mx + sd * clear, cy = my - dy;
    if (cx < 40 || cx > W - 40) continue;
    let pts;
    if (edge === 'top') { if (cy < 260) continue; pts = [[xt, -90], [xt, 20], [(xt + cx) / 2, (20 + cy) / 2], [cx, cy], [mx + sd * 95, my - 55], [mx, my]]; }
    else {
      if (cy < yE + 60) continue;
      const ex = sd < 0 ? -90 : W + 90;
      pts = [[ex, yE], [(ex + cx) / 2, yE + 0.3 * (cy - yE)], [cx, cy], [mx + sd * 95, my - 55], [mx, my]];
    }
    // clear of every road except where it's about to merge (the last stretch)
    const P = curve(pts, 10);
    let acc = 0, ok = true;
    for (let i = P.length - 1; i >= 0 && ok; i--) {
      if (i < P.length - 1) acc += Math.hypot(P[i][0] - P[i + 1][0], P[i][1] - P[i + 1][1]);
      if (acc >= clear + 40 && distToRoads(trunk, P[i][0], P[i][1]) < need) ok = false;
    }
    if (!ok) continue;
    const out = [], tails = new Set();
    routes.slice(0, nMain).forEach((r, i) => {
      const j = r.findIndex(([px, py]) => px === mx && py === my);
      if (j < 0) return;
      const tail = r.slice(j), key = JSON.stringify(tail);
      if (tails.has(key)) return;
      tails.add(key); out.push([pts.slice(0, -1).concat(tail), wts[i]]);
    });
    if (out.length) return out;
  }
  warnings.push('entry ' + edge + ': no clear place to merge, dropped');
  return null;
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
  const G = GEN, need = 2 * outer() + G.roadGap * 0.5;
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
  const G = GEN, R = G.spotR, off = outer() + G.spotGap + R, heartClear = G.workshopR + R + 30;
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
const POOL = [['s', 3], ['zigzag', 2], ['fork', 2.2], ['bend', 1.2], ['wave', 1.2], ['wiggle', 0.7], ['straight', 0.4], ['triple', 0.6]];
export function randomRecipe(seed) {
  const G = GEN, rng = makeRng(seed ^ 0x51ED27), span = G.endY - G.startY, items = [];
  let used = 0, forks = 0, last = '';
  const total = POOL.reduce((a, p) => a + p[1], 0);
  for (let tries = 0; tries < 30 && used < span * 0.8; tries++) {
    let r = rng() * total, name = POOL[0][0];
    for (const [n, w] of POOL) { if ((r -= w) <= 0) { name = n; break; } }
    if (name === last || ((name === 'fork' || name === 'triple') && forks >= (used < span * 0.3 ? 2 : 1))) continue;
    const pick = a => a[Math.floor(rng() * a.length)];
    const args = name === 's' || name === 'bend' ? [pick(['left', 'right'])]
      : name === 'zigzag' ? [String(1 + Math.floor(rng() * 3))]
      : name === 'wave' ? [String(2 + Math.floor(rng() * 3))]
      : name === 'fork' ? (rng() < 0.35 ? ['pin'] : rng() < 0.3 ? ['long'] : rng() < 0.5 ? ['wide'] : []) : [];
    const min = SEG[name].min(args);
    if (used + min > span) continue;
    items.push([name, ...args].join(' ')); used += min; last = name;
    if (name === 'fork' || name === 'triple') forks++;
  }
  // a bigger surface, up to two more entrances, and the heart pad not always in the middle
  const pre = ['size ' + [1.2, 1.4, 1.6][Math.floor(rng() * 3)]];
  const ne = rng() < 0.25 ? 0 : rng() < 0.65 ? 1 : 2, edges = ['left', 'right', 'top'].sort(() => rng() - 0.5);
  for (let k = 0; k < ne; k++) pre.push('entry ' + edges[k] + (edges[k] === 'top' ? '' : ' ' + (15 + Math.floor(rng() * 30))));
  if (rng() < 0.4) pre.push('heart ' + (rng() < 0.5 ? 'left' : 'right'));
  return pre.concat(items).join(', ');
}
