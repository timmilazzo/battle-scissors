// Dresses a generated level's painted road from the zone's road kit (src/kit.js ZONES[zone].roadKit, assets/kit/20_road):
// edge lines along both sides of every route (the tray worlds: fence posts joined by rope links or rails, unbroken and
// evenly spaced, open only at the pads, the entrances, the heart pad and a river crossing, plus a fence ring round each
// Pin pad with its opening toward the road; denim and lair: an edge strip sliced along the road, its bottom long edge
// toward the road) and a few low-contrast decals on the felt (darned patches, a walk of boot prints, dropped pins, a
// chalk arrow at each entrance). Called by levelArt.js's paintLevel right after the road and its stitch, before the Pin
// pads, under the painter's 1 / size scale, in plate units; drawHeartFlags after the pads. Uses its own seeded stream,
// so the same level always dresses the same way. Tunables: CONFIG.roadKit. A wanted piece (kit.js) draws its stand-in
// (the snow caps: the plain fence) or is left out (the ring and the flag posts until they arrive).
import { CONFIG as C } from './config.js';
import { makeRng } from '../vendor/mulberry32.js';
import { SPRITES, ZONES, artKey } from './kit.js';
import { kitSprite, kitImage } from './levelArt.js';

const TAU = Math.PI * 2;

// Every sprite key the zone's road kit uses (zone = a ZONES name or entry), as drawn: stand-ins for wanted pieces,
// pieces with neither left out.
export function roadKitKeys(zone) {
  const rk = (typeof zone === 'string' ? ZONES[zone] : zone)?.roadKit;
  if (!rk) return [];
  const d = rk.decals || {};
  const keys = [...rk.posts, ...rk.links, ...rk.rails, ...rk.strips, ...(d.darns || []), ...(d.boots || []), ...(d.pins || []), ...(d.arrow ? [d.arrow] : []),
    ...(rk.padRing ? [rk.padRing] : []), ...(rk.flags || [])];
  return [...new Set(keys.map(artKey).filter(Boolean))];
}
// The list's pieces that have loaded, as drawn (stand-ins resolved).
const loaded = list => (list || []).map(artKey).filter(k => k && kitImage(k));

// env: { zone (ZONES entry), G (CONFIG.levelGen), polys, roadOuter, roadHalf, road (road.clear), spots, spotR, heart,
// workshopR, entries, layer(), flat(canvas) } (see levelArt.js paintLevel). Returns what it drew
// ({ posts, links, rings, slices, arrows, darns, boots, pins }), for the level lab.
export function drawRoadKit(g, def, env) {
  const R = C.roadKit, rk = env.zone && env.zone.roadKit, count = { posts: 0, links: 0, rings: 0, slices: 0, arrows: 0, darns: 0, boots: 0, pins: 0 };
  if (!rk) return count;
  const rng = makeRng((def.seed | 0) ^ 0x7C31), W = def.w, H = def.h;
  const routes = routeInfo(env.polys, W, H, R.sharedTol);
  // places nothing lines or decals may come near: pads, the heart pad, fork buttons, the entrances, the plate's edge
  const zones = env.spots.map(([x, y]) => [x, y, env.spotR]).concat([[env.heart[0], env.heart[1], env.workshopR]],
    (def.deco || []).filter(d => d.kind === 'button').map(d => [d.x, d.y, d.r]));
  if (env.river) zones.push([env.river.x, env.river.y, env.river.r + R.riverGap]);   // the fence opens where the road crosses the river
  const entryPts = routes.map(rt => rt.P[rt.enter]);
  const blocked = (x, y, rad, clear) => x < R.edgeClear || y < R.edgeClear || x > W - R.edgeClear || y > H - R.edgeClear ||
    zones.some(([zx, zy, zr]) => Math.hypot(x - zx, y - zy) < zr + clear + rad) ||
    entryPts.some(([ex, ey]) => Math.hypot(x - ex, y - ey) < R.entryClear);
  const ctx = { R, env, routes, blocked, rng, count };
  drawDecals(g, def, rk.decals, ctx);
  const strips = loaded(rk.strips), posts = loaded(rk.posts);
  if (strips.length) drawStrips(g, strips, ctx);
  else if (posts.length) drawFences(g, { posts, links: loaded(rk.links), rails: loaded(rk.rails), padRing: rk.padRing }, def, ctx);
  return count;
}

// The heart pad's two flag posts, at its front corners: where the road comes onto the pad, on its fence either side of
// the road. flagPostL's pennant flies right, flagPostR's left; both posts fly the same one. Nothing until the sprites arrive.
export function drawHeartFlags(g, def, env) {
  const rk = env.zone && env.zone.roadKit, R = C.roadKit;
  if (!rk || !rk.flags) return;
  const keys = rk.flags.map(k => (artKey(k) && kitImage(k) ? k : null));
  if (!keys[0] && !keys[1]) return;
  // the main route's last point outside the pad: the road's direction coming in
  const P = env.polys[0], [hx, hy] = env.heart;
  let i = P.length - 1;
  while (i > 0 && Math.hypot(P[i][0] - hx, P[i][1] - hy) < env.workshopR * 1.3) i--;
  const ux = P[i][0] - hx, uy = P[i][1] - hy, ul = Math.hypot(ux, uy) || 1, nx = ux / ul, ny = uy / ul;
  const b = env.roadOuter + R.flagOut, rr = env.workshopR * R.flagRing, a = Math.sqrt(Math.max(0, rr * rr - b * b));
  const pts = [-1, 1].map(s => [hx + nx * a - ny * b * s, hy + ny * a + nx * b * s]).sort((p, q) => p[0] - q[0]);
  // each drawn so its post's foot (flagFoot, shares of the left one's canvas; mirrored for the right) stands on the point
  // both pennants fly the same way, as in the references (which way by the level's seed): one hangs over the road
  const j = keys[0] && keys[1] ? (def.seed | 0) & 1 : keys[0] ? 0 : 1, key = keys[j];
  pts.forEach(([x, y]) => {
    const [, w, h, cx, cy] = SPRITES[artKey(key)], fx = (j ? 1 - R.flagFoot[0] : R.flagFoot[0]) * w, fy = R.flagFoot[1] * h;
    kitSprite(g, key, x + (cx - fx) * R.flagScale, y + (cy - fy) * R.flagScale, R.flagScale, 0, 1);
  });
}

// ======================= routes =======================
// Per route: its points P, tangents t, arc length s, where it first comes onto the plate (enter), and which points lie
// on the road of an earlier route (shared: drawn by that one, so nothing is doubled where routes overlap).
function routeInfo(polys, W, H, tol) {
  const grid = new Map(), cell = Math.max(8, tol), keyOf = (i, j) => i * 73856093 ^ j * 19349663;
  return polys.map(P => {
    const n = P.length, t = [], s = [0], shared = [];
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
      t.push([tx / l, ty / l]);
      if (i) s.push(s[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
      const ci = Math.floor(P[i][0] / cell), cj = Math.floor(P[i][1] / cell);
      let sh = false;
      for (let di = -1; di <= 1 && !sh; di++) for (let dj = -1; dj <= 1 && !sh; dj++) {
        for (const [qx, qy] of grid.get(keyOf(ci + di, cj + dj)) || []) if (Math.hypot(qx - P[i][0], qy - P[i][1]) < tol) { sh = true; break; }
      }
      shared.push(sh);
    }
    let enter = P.findIndex(([x, y]) => x >= 0 && y >= 0 && x <= W && y <= H);
    if (enter < 0) enter = 0;
    for (const p of P) {                                                  // later routes see this one's points
      const k = keyOf(Math.floor(p[0] / cell), Math.floor(p[1] / cell));
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(p);
    }
    return { P, t, s, shared, enter, len: s[n - 1] };
  });
}
// The point, tangent angle and index at arc length a along a route.
function at(rt, a) {
  const { P, s } = rt;
  let lo = 0, hi = s.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (s[m] <= a) lo = m; else hi = m; }
  const f = s[hi] > s[lo] ? Math.min(1, Math.max(0, (a - s[lo]) / (s[hi] - s[lo]))) : 0;
  const x = P[lo][0] + (P[hi][0] - P[lo][0]) * f, y = P[lo][1] + (P[hi][1] - P[lo][1]) * f;
  const [tx, ty] = rt.t[f < 0.5 ? lo : hi];
  return { x, y, ang: Math.atan2(ty, tx), i: f < 0.5 ? lo : hi };
}
// The stretches of a route's side line at distance d (side +1 = right of the direction of travel) that may be dressed:
// not shared with an earlier route, past the entrance, not folded back on the inside of a tight bend (the offset point
// must be at least d from every road centreline: that also keeps it off other roads), not near a pad, the heart, a
// fork button, an entrance or the plate's edge. Returns arrays of [x, y] (consecutive allowed points).
function sideRuns(rt, side, d, rad, clear, ctx) {
  const { R, env, blocked } = ctx, runs = [];
  let cur = null;
  for (let j = 0; j < rt.P.length; j++) {
    const [tx, ty] = rt.t[j], x = rt.P[j][0] - ty * side * d, y = rt.P[j][1] + tx * side * d;
    const ok = !rt.shared[j] && rt.s[j] >= rt.s[rt.enter] + R.entryClear && env.road.clear(x, y, d - R.foldTol) && !blocked(x, y, rad, clear);
    if (ok) (cur || (cur = [])).push([x, y]);
    else if (cur) { runs.push(cur); cur = null; }
  }
  if (cur) runs.push(cur);
  return runs;
}
// Points along a polyline every `step` from arc `from` (as far as it goes): [[x, y, arc], ...], plus its length.
function resample(line, step, from = 0) {
  const out = [];
  let acc = 0, next = from;
  for (let i = 1; i < line.length; i++) {
    const [ax, ay] = line[i - 1], [bx, by] = line[i], l = Math.hypot(bx - ax, by - ay);
    while (next <= acc + l && l > 0) { const f = (next - acc) / l; out.push([ax + (bx - ax) * f, ay + (by - ay) * f, next]); next += step; }
    acc += l;
  }
  if (line.length === 1 && from === 0) out.push([line[0][0], line[0][1], 0]);
  return { pts: out, len: acc };
}
// The opaque bounding box of a sprite's image [x0, y0, x1, y1] (image px), cached; the whole image if it can't be read.
const boxes = {};
function opaqueBox(key) {
  if (boxes[key]) return boxes[key];
  const img = kitImage(key), w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  let box = [0, 0, w, h];
  try {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const cg = c.getContext('2d', { willReadFrequently: true }); cg.drawImage(img, 0, 0);
    const px = cg.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 40) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 >= x0) box = [x0, y0, x1 + 1, y1 + 1];
  } catch (e) { /* unreadable (file://): the whole image */ }
  return (boxes[key] = box);
}
const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const range = ([a, b], rng) => a + rng() * (b - a);
const strokePath = (g, P) => { g.beginPath(); P.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };
// Punches every road's interior (edge included) out of a layer, so nothing on it crosses another road.
function punchRoads(lg, env) {
  lg.save(); lg.globalCompositeOperation = 'destination-out';
  lg.lineWidth = 2 * env.roadOuter; lg.lineJoin = 'round'; lg.lineCap = 'round'; lg.strokeStyle = '#000';
  for (const P of env.polys) strokePath(lg, P);
  lg.restore();
}
// Composites a layer onto the plate with a soft drop shadow (plate units, turned into device px) at an alpha.
function flatShadowed(g, env, lc, alpha, sh) {
  const t = g.getTransform(), px = Math.hypot(t.a, t.b);
  g.save();
  g.globalAlpha = alpha;
  if (sh) { g.shadowColor = 'rgba(0,10,15,' + sh[0] + ')'; g.shadowBlur = sh[1] * px; g.shadowOffsetX = sh[2] * px; g.shadowOffsetY = sh[3] * px; }
  env.flat(lc);
  g.restore();
}

// ======================= tray worlds: fences =======================
// Along both sides of each route, joined post to post by rope links or rails (one or the other per plate). With
// fenceContinuous every allowed stretch of side line (see sideRuns: it stops at pads, entrances, the heart pad, the
// river crossing, the plate's edge and the inside of tight bends) is fenced end to end, its posts spaced evenly (about
// postEvery, measured along the line, so they stay even round bends); otherwise runs of posts and gaps (fenceRun,
// fenceGap). Then a ring round each Pin pad (fencePadRings). Links first, posts on top.
function drawFences(g, rk, def, ctx) {
  const { R, env, routes, rng, count } = ctx, d = env.roadOuter + R.fenceOffset, step = R.postEvery;
  const links = rk.rails.length && (rng() < R.railChance || !rk.links.length) ? rk.rails : rk.links;
  const postR = 14 * R.postScale, placed = [], chains = [];
  const near = (x, y, lim) => placed.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 < lim * lim);
  if (R.fenceContinuous) for (const rt of routes) for (const side of [-1, 1]) {
    for (const line of sideRuns(rt, side, d, postR, R.fenceClear, ctx)) {
      const { len } = resample(line, 1e9);
      if (len < step * (R.fenceMin - 1) * 0.8) continue;
      const m = Math.max(1, Math.round(len / step)), pts = resample(line, len / m - 1e-6).pts;
      let chain = [];
      const end = () => { if (chain.length >= R.fenceMin) chains.push({ side, posts: chain }); else for (const p of chain) placed.splice(placed.indexOf(p), 1); chain = []; };
      for (const [x, y] of pts) {
        if (near(x, y, step * R.postMinGap)) { end(); continue; }
        const post = [x, y, pick(rk.posts, rng), rng() * TAU]; chain.push(post); placed.push(post);
      }
      end();
    }
  }
  else for (const rt of routes) for (const side of [-1, 1]) {
    // the run / gap pattern carries on across this side's stretches; it starts part way into a gap so the sides differ
    let inRun = false, left = range(R.fenceGap, rng) * rng();
    for (const line of sideRuns(rt, side, d, postR, R.fenceClear, ctx)) {
      let pos = 0, chain = [];
      const { len } = resample(line, 1e9);
      const end = () => { if (chain.length >= R.fenceMin) chains.push({ side, posts: chain }); else for (const p of chain) placed.splice(placed.indexOf(p), 1); chain = []; };
      while (pos <= len) {
        if (!inRun) {
          if (pos + left > len) { left -= len - pos; break; }
          pos += left; inRun = true; left = Math.round(range(R.fenceRun, rng));
          continue;
        }
        const p = resample(line, 1e9, pos).pts[0];
        const prev = chain[chain.length - 1];
        if ((prev && Math.hypot(p[0] - prev[0], p[1] - prev[1]) < step * R.postMinGap) || near(p[0], p[1], step * R.postMinGap)) end();
        else { const post = [p[0], p[1], pick(rk.posts, rng), rng() * TAU]; chain.push(post); placed.push(post); }
        pos += step * (1 + (rng() * 2 - 1) * R.postJitter);
        if (--left <= 0) { end(); inRun = false; left = range(R.fenceGap, rng); }
      }
      end();
    }
  }
  const [lc, lg] = env.layer();
  const ring = fencePadRings(lg, rk, def, ctx, near, placed, chains);
  for (const { side, posts, loop } of chains) for (let i = loop ? 0 : 1; i < posts.length; i++) {
    const a = posts[(i + posts.length - 1) % posts.length], b = posts[i];
    if (links.length && Math.hypot(b[0] - a[0], b[1] - a[1]) < step * 1.6) { drawLink(lg, pick(links, rng), a, b, side > 0, R); count.links++; }
  }
  for (const { posts } of chains) for (const [x, y, key, rot] of posts) { kitSprite(lg, key, x, y, postScaleOf(key, R), upright(key) ? 0 : rot, 0); count.posts++; }
  for (const r of ring) { kitSprite(lg, r.key, r.x, r.y, r.scale, r.rot, 0); count.rings++; }
  punchRoads(lg, env);
  flatShadowed(g, env, lc, 1, R.fenceShadow);
}
// The fence ring round each Pin pad, its opening toward the nearest road: the padRing sprite (turned so its opening,
// padRingGapAt as delivered, faces the road) once it's in, else posts every ~postEvery round a circle of padRingR x
// the pad's radius, leaving out padRingGap either side of the road's direction and any post the road or a road-side post
// would crowd; their links are added to `chains` (a post run each side of the opening). Only when the zone's own Pin pad
// has arrived (the meadow pad standing in has a fence of its own) unless padRingOnStandIn. Returns the sprite rings to draw.
function fencePadRings(lg, rk, def, ctx, near, placed, chains) {
  const { R, env, rng } = ctx, out = [];
  if (!rk.padRing) return out;
  const zone = env.zoneName, ownPad = zone && artKey(zone + 'PinPad') === zone + 'PinPad';
  if (!ownPad && !R.padRingOnStandIn) return out;
  const ringKey = artKey(rk.padRing) && kitImage(rk.padRing) ? artKey(rk.padRing) : null;
  const postR = 14 * R.postScale, rr = env.spotR * R.padRingR;
  for (const [sx, sy] of env.spots) {
    // toward the road: the nearest centreline point
    let best = Infinity, ax = 0, ay = 1;
    for (const P of env.polys) for (const [x, y] of P) { const q = (x - sx) ** 2 + (y - sy) ** 2; if (q < best) { best = q; ax = x - sx; ay = y - sy; } }
    const toRoad = Math.atan2(ay, ax);
    if (ringKey) {
      out.push({ key: ringKey, x: sx, y: sy, scale: rr / (SPRITES[ringKey][5] * R.padRingInner), rot: toRoad - R.padRingGapAt });   // (its rails at rr)
      continue;
    }
    const m = Math.max(8, Math.round(TAU * rr / R.postEvery)), runs = [];
    let cur = [];
    for (let j = 0; j < m; j++) {
      const a = toRoad + Math.PI + (j / m) * TAU, off = Math.abs(Math.atan2(Math.sin(a - toRoad), Math.cos(a - toRoad)));
      const x = sx + Math.cos(a) * rr, y = sy + Math.sin(a) * rr;
      const ok = off > R.padRingGap && env.road.clear(x, y, env.roadOuter + postR + 2) && !near(x, y, R.postEvery * R.postMinGap);
      if (ok) cur.push([x, y, pick(rk.posts, rng), rng() * TAU]);
      else if (cur.length) { runs.push(cur); cur = []; }
    }
    if (cur.length) runs.push(cur);
    // the walk starts opposite the road, so a run that reaches the end carries on into the first one
    if (runs.length > 1 && runs[0][0] && runs[runs.length - 1].length && near2(runs[0][0], runs[runs.length - 1][runs[runs.length - 1].length - 1], R.postEvery * 1.6)) runs[0] = runs.pop().concat(runs[0]);
    for (const run of runs) if (run.length >= 2) { chains.push({ side: 1, posts: run }); placed.push(...run); }
  }
  return out;
}
const near2 = (a, b, lim) => Math.hypot(a[0] - b[0], a[1] - b[1]) < lim;
// A post's scale: postW plate units wide (the meadow posts' files are 56 px, the snow-capped ones 131), times postScale.
const postScaleOf = (key, R) => R.postW * R.postScale / SPRITES[key][1];
// A piece drawn standing up (a side view, taller than wide: the snow-capped posts) is never turned.
const upright = key => SPRITES[key][2] > SPRITES[key][1] * 1.2;
// A rope link / rail from post a to post b: its opaque part stretched to the gap plus linkOverlap under each post,
// bottom edge toward the road (flip on the right-hand side). A thin piece (a rope or rail alone) keeps its own
// thickness; a whole fence segment (the snow rail, posts at its ends) keeps its proportions instead.
function drawLink(lg, key, a, b, flip, R) {
  const img = kitImage(key), [x0, y0, x1, y1] = opaqueBox(key);
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) + 2 * R.linkOverlap;
  const h = (y1 - y0 <= 40 ? (y1 - y0) * 0.5 : L * (y1 - y0) / (x1 - x0)) * R.linkScale;
  lg.save();
  lg.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); lg.rotate(Math.atan2(dy, dx));
  if (flip) lg.scale(1, -1);
  lg.drawImage(img, x0, y0, x1 - x0, y1 - y0, -L / 2, -h / 2, L, h);
  lg.restore();
}

// ======================= denim / lair: edge strips =======================
// Along both sides of each route, the strip image sliced into sliceLen pieces, each turned to the local direction of the
// side line, the pattern running on from piece to piece. A plate has a main variant; a route switches to another one
// now and then (stripSwitch). Pieces fade in and out over stripFade at the ends of a stretch.
function drawStrips(g, strips, ctx) {
  const { R, env, routes, rng, count } = ctx, L = R.sliceLen, main = pick(strips, rng);
  const [lc, lg] = env.layer();
  for (const rt of routes) {
    const key = rng() < R.stripSwitch ? pick(strips, rng) : main, img = kitImage(key), [x0, y0, x1, y1] = opaqueBox(key);
    const sw = x1 - x0, tile = sw * 0.5 * R.stripScale, th = (y1 - y0) * 0.5 * R.stripScale, d = env.roadOuter + R.stripOffset + th / 2;
    let u = Math.floor(rng() * tile / L) * L;
    for (const side of [-1, 1]) for (const line of sideRuns(rt, side, d, th / 2, R.stripClear, ctx)) {
      const { pts, len } = resample(line, L);
      for (let i = 1; i < pts.length; i++, u += L) {
        const [ax, ay, sa] = pts[i - 1], [bx, by] = pts[i], mid = sa + L / 2;
        lg.save();
        lg.globalAlpha = Math.max(0, Math.min(1, mid / R.stripFade, (len - mid) / R.stripFade));
        lg.translate((ax + bx) / 2, (ay + by) / 2); lg.rotate(Math.atan2(by - ay, bx - ax));
        if (side > 0) lg.scale(1, -1);
        // the source slice, split in two where it runs off the end of the image (the strip tiles end to end)
        const w = L + R.sliceOverlap, f = sw / tile, sx = ((u % tile) + tile) % tile * f, sLen = L * f, k = w / L;
        const first = Math.min(sLen, sw - sx);
        lg.drawImage(img, x0 + sx, y0, first, y1 - y0, -w / 2, -th / 2, first / f * k, th);
        if (first < sLen - 0.01) lg.drawImage(img, x0, y0, sLen - first, y1 - y0, -w / 2 + first / f * k, -th / 2, (sLen - first) / f * k, th);
        lg.restore();
        count.slices++;
      }
    }
  }
  punchRoads(lg, env);
  flatShadowed(g, env, lc, R.stripAlpha, R.stripShadow);
}

// ======================= decals on the felt =======================
// A chalk arrow at each entrance, then `decals` (per size-1 plate, times the level's size) of darned patches, boot-print
// walks and dropped pins, low in contrast. None on a pad, near the heart, on top of another decal, or where another
// road runs into this one (only where the road is this route's alone, or shared outright: drawn once either way).
function drawDecals(g, def, D, ctx) {
  if (!D) return;
  const { R, env, routes, blocked, rng, count } = ctx, taken = [], n = def.size || 1;
  const otherRoad = (x, y, ri, rad) => routes.some((rt, j) => {
    if (j === ri) return false;
    let m = Infinity;
    for (const [px, py] of rt.P) { const q = (px - x) ** 2 + (py - y) ** 2; if (q < m) m = q; }
    m = Math.sqrt(m);
    return m > R.sharedTol && m < 2 * env.roadOuter + rad;
  });
  const fits = (x, y, ri, rad, entry = false) => !(entry ? false : blocked(x, y, rad, R.decalClear)) &&
    Math.hypot(x - env.heart[0], y - env.heart[1]) > env.workshopR + R.heartClear + rad &&
    !taken.some(([tx, ty, tr]) => Math.hypot(x - tx, y - ty) < tr + rad) && !otherRoad(x, y, ri, rad);
  const put = (key, x, y, scale, rot, kind) => {
    g.save(); g.globalAlpha = R.decalAlpha[kind]; g.globalCompositeOperation = R.decalBlend[kind];
    kitSprite(g, key, x, y, scale, rot, 0);
    g.restore();
  };
  const rad = (key, scale) => SPRITES[key][5] * scale;
  // chalk arrows: one per entrance (the first route that comes in by it), pointing along the road
  if (D.arrow && SPRITES[D.arrow]) {
    const seen = new Set();
    routes.forEach((rt, ri) => {
      const e = (def.entryOf && def.entryOf[ri]) || 0;
      if (seen.has(e)) return;
      seen.add(e);
      const p = at(rt, rt.s[rt.enter] + R.arrowAt), sc = 0.5 * R.arrowScale, r = rad(D.arrow, sc) * 0.7;
      if (!fits(p.x, p.y, ri, r, true)) return;
      put(D.arrow, p.x, p.y, sc, p.ang + Math.PI / 2 + (rng() - 0.5) * 0.12, 'arrow');
      taken.push([p.x, p.y, r]); count.arrows++;
    });
  }
  // a random point on the felt of some route, past its entrance, with its route index
  const spot = () => {
    const ri = Math.floor(rng() * routes.length), rt = routes[ri], a0 = rt.s[rt.enter] + R.entryClear;
    return rt.len > a0 ? { ri, rt, a: a0 + rng() * (rt.len - a0) } : null;
  };
  const mix = Object.entries(R.decalMix).filter(([k]) => (k === 'darn' ? D.darns : k === 'boots' ? D.boots : D.pins)?.length);
  const total = mix.reduce((s, e) => s + e[1], 0);
  for (let i = 0, m = Math.round(R.decals * n); i < m && total > 0; i++) {
    let q = rng() * total, kind = mix[0][0];
    for (const [k, w] of mix) if ((q -= w) <= 0) { kind = k; break; }
    for (let tries = 0; tries < R.decalTries; tries++) {
      const c = spot();
      if (!c) break;
      const p = at(c.rt, c.a);
      if (kind === 'darn') {
        const key = pick(D.darns, rng), sc = 0.5 * range(R.darnScale, rng), r = rad(key, sc) * 0.75;
        if (!fits(p.x, p.y, c.ri, r)) continue;
        put(key, p.x, p.y, sc, p.ang + (rng() - 0.5) * 0.25, 'darn'); taken.push([p.x, p.y, r]); count.darns++;
      } else if (kind === 'pin') {
        const key = pick(D.pins, rng), sc = 0.5 * R.pinScale, off = (rng() - 0.5) * 2 * (env.roadHalf - R.pinInset);
        const x = p.x - Math.sin(p.ang) * off, y = p.y + Math.cos(p.ang) * off, r = rad(key, sc);
        if (!fits(x, y, c.ri, r)) continue;
        put(key, x, y, sc, rng() * TAU, 'pin'); taken.push([x, y, r]); count.pins++;
      } else {
        // a walk of boot prints along the road, left and right alternating either side of the centreline
        const steps = Math.round(range(R.bootSteps, rng)), sc = 0.5 * R.bootScale, prints = [];
        const leftFirst = rng() < 0.5;
        for (let k = 0; k < steps; k++) {
          const q2 = at(c.rt, c.a + k * R.bootStride), left = (k % 2 === 0) === leftFirst, off = (left ? -1 : 1) * R.bootSide;
          const x = q2.x - Math.sin(q2.ang) * off, y = q2.y + Math.cos(q2.ang) * off;
          prints.push([left ? D.boots[0] : D.boots[D.boots.length - 1], x, y, q2.ang + Math.PI / 2 + (left ? -1 : 1) * R.bootToe]);
        }
        if (c.a + steps * R.bootStride > c.rt.len) continue;
        const r = rad(D.boots[0], sc);
        if (prints.some(([, x, y]) => !fits(x, y, c.ri, r))) continue;
        for (const [key, x, y, rot] of prints) { put(key, x, y, sc, rot, 'boots'); taken.push([x, y, r]); }
        count.boots++;
      }
      break;
    }
  }
}
