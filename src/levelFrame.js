// The frame round a generated level's plate (src/levelArt.js calls it): the level sits inside a sewing tray, like the
// painted Meadow Road. A rim wall runs round the play area a little in from the plate's edges and, where the road and
// the pads leave room, steps inward round a bigger compartment at a corner or halfway down a side. Outside the wall is
// the tray's compartment floor, split into cells by thinner dividers, and a few big hero props (src/kit.js
// ZONES[zone].frameHeroes) sit in the compartments, hanging off the plate and leaning in over the wall. Wherever a road
// runs through the wall (the top entrance, side entrances) or a pad comes too close, the wall stops with an end cap each
// side. All art is the zone's `frame` set (assets/kit/18_frames) and heroes (19_heroes).
// Laid out in screen space (the numbers in CONFIG.levelFrame are for a size 1 plate) and multiplied by the level's size.
// Its own seeded stream, so the frame is the same every time and the painter's own stream isn't disturbed.
import { CONFIG as C } from './config.js';
import { makeRng } from '../vendor/mulberry32.js';
import { SPRITES, ZONES, artKey, STRIP_TRIM } from './kit.js';
import { kitSprite, kitImage, kitTexture } from './levelArt.js';

const QUARTER = Math.PI / 2;

// Every SPRITES key and TEXTURES name the zone's frame and heroes use, so the painter's loader can wait for them, as
// drawn: a wanted piece's stand-in (kit.js; the holiday box's snow-capped rims stand in as the plain tray's), pieces with
// neither left out. `zone` is a ZONES entry or its name.
export function frameKeys(zone) {
  if (typeof zone === 'string') zone = ZONES[zone];
  const F = zone && zone.frame;
  if (!F) return { keys: [], tex: [] };
  const keys = [...F.rim, F.divider, F.outerCorner, F.innerCorner, F.cap];
  if (C.levelFrame.tee) keys.push(F.tee);
  for (const h of zone.frameHeroes || []) if (!keys.includes(h[0])) keys.push(h[0]);
  return { keys: [...new Set(keys.map(artKey).filter(Boolean))], tex: [F.floor] };
}

// ======================= measuring the art =======================
// The pieces are measured from their alpha once (cached): where a strip's wall runs across its height, where a
// corner's arms are (and which quarter of it is empty, so it can be turned the right way), a cap's visible box.
const measured = new Map();
function alphaOf(img) {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data, w = c.width;
  const at = (x, y) => ((Math.round(y) * w) + Math.round(x)) * 4;
  return { w, h: c.height, a: (x, y) => d[at(x, y) + 3], rgb: (x, y) => [d[at(x, y)], d[at(x, y) + 1], d[at(x, y) + 2]] };
}
// The mean colour of a few samples, and how far apart two colours are.
const meanRgb = (A, pts) => { const m = [0, 0, 0]; for (const [x, y] of pts) A.rgb(x, y).forEach((v, i) => { m[i] += v / pts.length; }); return m; };
const rgbDist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
const FS = [0.62, 0.72, 0.82], PROFILE = [0.08, 0.2, 0.32, 0.44, 0.56, 0.68, 0.8, 0.92];
const span = (n, at) => { let i0 = 0, i1 = n - 1; while (i0 < n && at(i0) < 128) i0++; while (i1 > i0 && at(i1) < 128) i1--; return [i0, i1 + 1]; };
// A strip (rim or divider): the rows its wall covers (the widest of a few columns), so it can be centred on its line.
function stripInfo(key) {
  if (measured.has(key)) return measured.get(key);
  const img = kitImage(key), A = alphaOf(img);
  let y0 = A.h, y1 = 0;
  for (const f of [0.25, 0.5, 0.75]) { const [a, b] = span(A.h, y => A.a(A.w * f, y)); y0 = Math.min(y0, a); y1 = Math.max(y1, b); }
  const t = y1 - y0, cols = [0.2, 0.35, 0.5, 0.65, 0.8];
  // its colour across the wall, top (outer side) to bottom (play side)
  const profile = PROFILE.map(p => meanRgb(A, cols.map(f => [A.w * f, y0 + p * (t - 1)])));
  // (a strip whose ends aren't seamless, kit.js STRIP_TRIM, is tiled from its middle part only)
  const trim = (STRIP_TRIM[artKey(key)] || 0) * A.w;
  const info = { img, w: A.w, h: A.h, x0: trim, x1: A.w - trim, mid: (y0 + y1) / 2, thick: t, profile };
  measured.set(key, info);
  return info;
}
// A cap: its visible box.
function boxInfo(key) {
  if (measured.has(key)) return measured.get(key);
  const img = kitImage(key), A = alphaOf(img);
  const [x0, x1] = span(A.w, x => Math.max(A.a(x, A.h * 0.3), A.a(x, A.h * 0.5), A.a(x, A.h * 0.7)));
  const [y0, y1] = span(A.h, y => Math.max(A.a(A.w * 0.3, y), A.a(A.w * 0.5, y), A.a(A.w * 0.7, y)));
  const info = { img, w: A.w, h: A.h, x0, x1, y0, y1 };
  measured.set(key, info);
  return info;
}
// An L piece (outer or inner corner): redrawn turned so it opens toward the bottom right (its corner square top left,
// its arms running right and down), then its arms measured. The kit's corners don't all come the same way round.
function cornerInfo(key) {
  if (measured.has(key)) return measured.get(key);
  const img = kitImage(key), A0 = alphaOf(img), w = A0.w, h = A0.h;
  let best = null, bestA = Infinity;                               // the emptiest quarter is the open side
  for (const [qx, qy] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
    let sum = 0;
    for (let i = 1; i < 6; i++) for (let j = 1; j < 6; j++) sum += A0.a(w * (qx / 2 + i / 12), h * (qy / 2 + j / 12));
    if (sum < bestA) { bestA = sum; best = [qx, qy]; }
  }
  // quarter turns clockwise that bring that quarter to the bottom right
  const turns = { '1,1': 0, '1,0': 1, '0,0': 2, '0,1': 3 }[best.join()];
  const c = document.createElement('canvas'); c.width = turns & 1 ? h : w; c.height = turns & 1 ? w : h;
  const g = c.getContext('2d');
  g.translate(c.width / 2, c.height / 2); g.rotate(turns * QUARTER); g.drawImage(img, -w / 2, -h / 2);
  const A = alphaOf(c);
  // each arm measured at a few places out along it (clear of the corner square and of a bevelled end), widest wins
  let hy0 = A.h, hy1 = 0, vx0 = A.w, vx1 = 0;
  for (const f of FS) {
    const [a, b] = span(A.h, y => A.a(A.w * f, y)), [c2, d] = span(A.w, x => A.a(x, A.h * f));
    if (b > a) { hy0 = Math.min(hy0, a); hy1 = Math.max(hy1, b); }
    if (d > c2) { vx0 = Math.min(vx0, c2); vx1 = Math.max(vx1, d); }
  }
  // the arms' colour across them, from the outer side (away from the open quarter) to the side facing it
  const th = hy1 - hy0, tv = vx1 - vx0;
  const profile = PROFILE.map(p => meanRgb(A, FS.flatMap(f => [[A.w * f, hy0 + p * (th - 1)], [vx0 + p * (tv - 1), A.h * f]])));
  const info = { img: c, w: A.w, h: A.h, xc: (vx0 + vx1) / 2, yc: (hy0 + hy1) / 2, thick: (th + tv) / 2, profile };
  measured.set(key, info);
  return info;
}
// Which turn of the wall an L piece suits, going by its colour across its arms against the wall strip's: 'outer' (a
// convex corner) if, read from the side away from its open quarter, it matches the strip read from its outer side to
// its play side; 'inner' (concave: the open quarter is then the compartment) if it matches the strip the other way round.
function cornerFits(key, strip) {
  const co = cornerInfo(key), m = co.profile.length;
  let same = 0, flip = 0;
  for (let i = 0; i < m; i++) { same += rgbDist(co.profile[i], strip.profile[i]); flip += rgbDist(co.profile[i], strip.profile[m - 1 - i]); }
  return same <= flip ? 'outer' : 'inner';
}
// A T-joint (bar along the top, stem down, as delivered): the bar's rows and where the stem is.
function teeInfo(key) {
  if (measured.has(key)) return measured.get(key);
  const img = kitImage(key), A = alphaOf(img);
  const [y0, y1] = span(A.h, y => A.a(A.w * 0.08, y));
  const [x0, x1] = span(A.w, x => A.a(x, A.h * 0.9));
  const info = { img, w: A.w, h: A.h, mid: (y0 + y1) / 2, thick: y1 - y0, xc: (x0 + x1) / 2 };
  measured.set(key, info);
  return info;
}

// ======================= geometry =======================
const distToRect = (x, y, [x0, y0, x1, y1]) => Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1));
// The wall's outline, a clockwise rectilinear polygon: the rectangle L..R x T..B, with a notch cut in wherever one was
// chosen (a corner notch replaces the corner by three turns; a side notch adds four).
function outline(L, T, R, B, notch) {
  const V = [], c = notch.corner;
  if (c.tl) V.push([L, T + c.tl[1]], [L + c.tl[0], T + c.tl[1]], [L + c.tl[0], T]); else V.push([L, T]);
  if (c.tr) V.push([R - c.tr[0], T], [R - c.tr[0], T + c.tr[1]], [R, T + c.tr[1]]); else V.push([R, T]);
  for (const [y0, y1, d] of notch.right) V.push([R, y0], [R - d, y0], [R - d, y1], [R, y1]);
  if (c.br) V.push([R, B - c.br[1]], [R - c.br[0], B - c.br[1]], [R - c.br[0], B]); else V.push([R, B]);
  if (c.bl) V.push([L + c.bl[0], B], [L + c.bl[0], B - c.bl[1]], [L, B - c.bl[1]]); else V.push([L, B]);
  for (const [y0, y1, d] of [...notch.left].reverse()) V.push([L, y1], [L + d, y1], [L + d, y0], [L, y0]);
  return V;
}
// Is (x, y) inside the polygon; how far is it from its outline; how far outside it (negative inside)?
function inPoly(V, x, y) {
  let inside = false;
  for (let i = 0, j = V.length - 1; i < V.length; j = i++) {
    const [xi, yi] = V[i], [xj, yj] = V[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function edgeDist(V, x, y) {
  let d = Infinity;
  for (let i = 0; i < V.length; i++) {
    const [ax, ay] = V[i], [bx, by] = V[(i + 1) % V.length];
    d = Math.min(d, distToRect(x, y, [Math.min(ax, bx), Math.min(ay, by), Math.max(ax, bx), Math.max(ay, by)]));
  }
  return d;
}
const outside = (V, x, y) => (inPoly(V, x, y) ? -1 : 1) * edgeDist(V, x, y);

// ======================= the frame =======================
// Draws the compartment floor, the dividers, the rim walls with their corners and end caps (and the shade they cast),
// and plans the heroes (drawn later by frameHeroes, over the road and pads). Returns the frame, or null if the zone
// has no frame art (or it hasn't loaded).
export function frameBase(g, def, env) {
  const Z = env.zone, F = Z && Z.frame, FC = C.levelFrame;
  if (!F || !kitImage(F.rim[0]) || !kitTexture(F.floor)) return null;
  const W = def.w, H = def.h, n = def.size || 1, rng = makeRng((def.seed | 0) ^ 0x3F2A);
  const s = FC.rimScale * n;                                   // art px -> plate units
  const rims = F.rim.filter(k => kitImage(k)).map(stripInfo), rim0 = rims[0];
  const half = rim0.thick * s / 2;                              // the wall's half thickness (plate units)
  const L = FC.inset * n, R = W - FC.inset * n, T = FC.top * n, B = H - FC.bottom * n;
  const road = env.road, roadOuter = env.roadOuter, polys = env.polys;
  const taken = env.taken || def.spots.map(([x, y]) => [x, y, def.spotR + 6]).concat([[def.heart[0], def.heart[1], def.workshopR + 6]], (def.deco || []).map(d => [d.x, d.y, d.r + 10]));
  const lerp = ([a, b]) => (a + rng() * (b - a)) * n, minP = FC.minPiece * n;

  // 1. notches: the wall steps in round a corner compartment (or one partway down a side) wherever the space it takes
  // from the play area is well clear of the road, the pads and the heart
  const free = rect => {
    const m = half + FC.notchClear * n;
    for (const P of polys) for (const [x, y] of P) if (distToRect(x, y, rect) < roadOuter + m) return false;
    return !taken.some(([x, y, r]) => distToRect(x, y, rect) < r + m);
  };
  const notch = { corner: {}, left: [], right: [] };
  for (const c of ['tl', 'tr', 'br', 'bl']) {
    if (rng() >= FC.cornerChance) continue;
    let best = null;
    for (let t = 0; t < FC.notchTries; t++) {
      const dx = lerp(FC.cornerW), dy = lerp(c[0] === 't' ? FC.cornerH : FC.cornerHBottom);
      const x0 = c[1] === 'l' ? L - half : R - dx - half, x1 = c[1] === 'l' ? L + dx + half : R + half;
      const y0 = c[0] === 't' ? T - half : B - dy - half, y1 = c[0] === 't' ? T + dy + half : B + half;
      if (free([x0, y0, x1, y1]) && (!best || dx * dy > best[0] * best[1])) best = [dx, dy];
    }
    if (best) notch.corner[c] = best;
  }
  for (const side of ['left', 'right']) {
    const top = T + (notch.corner[side === 'left' ? 'tl' : 'tr'] || [0, 0])[1] + minP * 1.5;
    const bot = B - (notch.corner[side === 'left' ? 'bl' : 'br'] || [0, 0])[1] - minP * 1.5;
    for (let k = 0; k < FC.sideNotches; k++) {
      for (let t = 0; t < FC.notchTries; t++) {
        const len = lerp(FC.sideLen), d = lerp(FC.sideDepth), y0 = top + rng() * (bot - top - len), y1 = y0 + len;
        if (y0 < top || y1 > bot) continue;
        if (notch[side].some(([a, b]) => y0 < b + minP * 1.5 && y1 > a - minP * 1.5)) continue;
        const rect = side === 'left' ? [L - half, y0 - half, L + d + half, y1 + half] : [R - d - half, y0 - half, R + half, y1 + half];
        if (free(rect)) { notch[side].push([y0, y1, d]); break; }
      }
    }
    notch[side].sort((a, b) => a[0] - b[0]);
  }
  const V = outline(L, T, R, B, notch);

  // 2. the wall's edges; each runs from its start along u, its play side is its local +y (turned by rot). The ones on
  // the plain rectangle (not a notch's) are `main`, with `band` the depth of the floor outside them: dividers run out from those
  const edges = V.map(([x, y], i) => {
    const [bx, by] = V[(i + 1) % V.length], len = Math.hypot(bx - x, by - y), ux = (bx - x) / len, uy = (by - y) / len;
    const main = (ux === 0 && (x === L || x === R)) || (uy === 0 && (y === T || y === B));
    return { x, y, ux, uy, len, rot: Math.atan2(uy, ux), main, band: !main ? 0 : uy === 0 ? (y === T ? T : H - B) : (x === L ? L : W - R) };
  });
  // which corner piece suits each turn: the kit's L whose faces match (see cornerFits); and how far its arms run
  const pieceFor = {};
  for (const turn of ['outer', 'inner']) {
    const keys = (turn === 'outer' ? [F.outerCorner, F.innerCorner] : [F.innerCorner, F.outerCorner]).filter(k => kitImage(k));
    pieceFor[turn] = FC.cornerArt ? keys.find(k => cornerFits(k, rim0) === turn) || null : null;
  }
  const armOf = key => { if (!key) return 0; const co = cornerInfo(key), cs = rim0.thick / co.thick * s; return Math.max(co.w - co.xc, co.h - co.yc) * cs; };
  const arm = Math.max(armOf(pieceFor.outer), armOf(pieceFor.inner));
  // gaps: along each edge, where a road's edge would cover the wall or a pad would crowd it; a gap near an end (closer
  // than a corner piece's arm) runs out to it, and that corner goes
  const step = 4 * n, roadD = roadOuter + half * FC.roadClear;
  for (const e of edges) {
    const gaps = [], keep = Math.min(Math.max(FC.cornerKeep * n, arm), e.len / 2);
    for (let t = 0; t <= e.len; t += step) {
      const x = e.x + e.ux * t, y = e.y + e.uy * t;
      if (road.clear(x, y, roadD) && !taken.some(([tx, ty, tr]) => Math.hypot(tx - x, ty - y) < tr + half + FC.padClear * n)) continue;
      const a = t - FC.gapMargin * n, b = t + step + FC.gapMargin * n, last = gaps[gaps.length - 1];
      if (last && a <= last[1]) last[1] = b; else gaps.push([a, b]);
    }
    for (const gp of gaps) { if (gp[0] < keep) gp[0] = -1; if (gp[1] > e.len - keep) gp[1] = e.len + 1; }
    e.gaps = gaps;
  }
  // corners: corner i (at edge i's start) stands where both its walls reach it; a right turn is an outer corner
  const corners = edges.map((e, i) => {
    const p = edges[(i + edges.length - 1) % edges.length];
    const on = !e.gaps.some(gp => gp[0] < 0) && !p.gaps.some(gp => gp[1] > p.len);
    return { on, outer: p.ux * e.uy - p.uy * e.ux > 0, dx: e.ux - p.ux, dy: e.uy - p.uy };
  });
  // the solid stretches between gaps (a short one is left out, unless it's a whole short edge), each end either a
  // corner or an end cap
  edges.forEach((e, i) => {
    const pieces = [];
    let a = 0;
    for (const [g0, g1] of [...e.gaps, [e.len + 1, e.len + 2]]) {
      const b = Math.min(g0, e.len);
      if (b - a >= minP || (a <= 0 && b >= e.len)) pieces.push([Math.max(a, 0), b]);
      a = Math.max(a, g1);
    }
    e.pieces = pieces.map(([p0, p1]) => ({ a: p0, b: p1, capA: !(p0 <= 0 && corners[i].on), capB: !(p1 >= e.len && corners[(i + 1) % edges.length].on) }));
  });
  const at = (e, t) => [e.x + e.ux * t, e.y + e.uy * t];

  // 3. heroes (planned now, so the dividers keep out from under them; drawn by frameHeroes)
  const heroes = planHeroes(env, Z, rng, { V, T, W, H, n, half, taken });

  // 4. dividers: from the plain walls out past the plate edge, splitting the band into cells; never in a gap, under a
  // hero or near a corner
  const div = kitImage(F.divider) ? stripInfo(F.divider) : null, dividers = [];
  if (div) {
    const dHalf = div.thick * s / 2;
    for (const e of edges) {
      if (!e.main || e.band - half < 20 * n || (e.y === B && e.uy === 0 && !FC.bottomCells)) continue;
      const keep = FC.cornerKeep * n + dHalf, len = e.band + 20 * n;
      const ok = t => {
        if (t < keep || t > e.len - keep || e.gaps.some(([g0, g1]) => t > g0 - dHalf - 10 * n && t < g1 + dHalf + 10 * n)) return false;
        const [x0, y0] = at(e, t), ox = e.uy, oy = -e.ux;                 // (ox, oy) = outward
        return !heroes.some(h => h.circles.some(([cx, cy, cr]) => {
          const k = Math.max(0, Math.min(len, (cx - x0) * ox + (cy - y0) * oy));
          return Math.hypot(x0 + ox * k - cx, y0 + oy * k - cy) < cr * 0.85 + dHalf;
        }));
      };
      for (let t = keep + lerp(FC.cell) * (0.3 + rng() * 0.4); t < e.len - keep; t += lerp(FC.cell)) {
        let tt = null;
        for (let k = 0; k <= 8 && tt === null; k++) for (const sg of k ? [1, -1] : [1]) if (tt === null && ok(t + sg * k * 14 * n)) tt = t + sg * k * 14 * n;
        if (tt !== null) { dividers.push({ e, t: tt, len }); t = tt; }
      }
    }
  }

  // ---- drawing ----
  const t0 = g.getTransform(), px = Math.hypot(t0.a, t0.b);
  // 5. the compartment floor, a little darker toward the walls
  {
    const p = g.createPattern(kitTexture(F.floor), 'repeat');
    p.setTransform(new DOMMatrix().translate(Math.round(rng() * 512), Math.round(rng() * 512)).scale(FC.floorScale * n));
    g.save();
    g.beginPath(); g.rect(-4, -4, W + 8, H + 8);
    g.moveTo(V[0][0], V[0][1]); for (let i = 1; i < V.length; i++) g.lineTo(V[i][0], V[i][1]); g.closePath();
    g.fillStyle = p; g.fill('evenodd');
    g.clip('evenodd');
    if (FC.floorTint) { g.fillStyle = FC.floorTint; g.fillRect(-4, -4, W + 8, H + 8); }
    for (const e of edges) {                                           // (in the edge's frame: local -y is outward)
      const w = FC.floorShadeW * n, gr = g.createLinearGradient(0, -half, 0, -half - w);
      gr.addColorStop(0, 'rgba(20,10,4,' + FC.floorShade + ')'); gr.addColorStop(1, 'rgba(20,10,4,0)');
      g.save(); g.translate(e.x, e.y); g.rotate(e.rot);
      g.fillStyle = gr; g.fillRect(-half, -half - w, e.len + 2 * half, w + half);
      g.restore();
    }
    g.restore();
  }
  // 6. the ground's contact shade along the inside of each stretch of wall
  for (const e of edges) for (const pc of e.pieces) {
    g.save(); g.translate(e.x, e.y); g.rotate(e.rot);
    const w = FC.shadeW * n, gr = g.createLinearGradient(0, half * 0.6, 0, half + w);
    gr.addColorStop(0, 'rgba(10,6,2,' + FC.shadeAlpha + ')'); gr.addColorStop(1, 'rgba(10,6,2,0)');
    g.fillStyle = gr; g.fillRect(pc.a, half * 0.6, pc.b - pc.a, half * 0.4 + w);
    g.restore();
  }
  // 7. the wall pieces go on a layer of their own, which is then laid down once with a soft drop shadow (a shadow per
  // strip would darken every join)
  const lc = document.createElement('canvas'); lc.width = g.canvas.width; lc.height = g.canvas.height;
  const lg = lc.getContext('2d'); lg.setTransform(t0);
  // dividers first (the wall covers their inner end): one running out sideways is drawn level, one running up or down
  // is turned a quarter back, so its lit top faces left
  for (const d of dividers) {
    const e = d.e, [x, y] = at(e, d.t), ox = e.uy, oy = -e.ux, level = Math.abs(ox) > 0.5, out = level ? ox : -oy;
    lg.save(); lg.translate(x, y); lg.rotate(level ? 0 : -QUARTER);
    drawStrip(lg, [div], 0, out > 0 ? 0 : -d.len, out > 0 ? d.len : 0, s, rng);
    lg.restore();
  }
  // each standing corner gets the piece that suits its turn if both its walls are longer than the piece's arms; else
  // it's a butt joint (both walls run on through the corner square) with a cap standing on it as a post
  corners.forEach((c, i) => {
    const key = c.on ? pieceFor[c.outer ? 'outer' : 'inner'] : null, p = edges[(i + edges.length - 1) % edges.length];
    c.key = key && Math.min(edges[i].len, p.len) > armOf(key) ? key : null;
  });
  const butt = i => corners[i].on && !corners[i].key;
  let v = Math.floor(rng() * rims.length);
  edges.forEach((e, i) => { for (const pc of e.pieces) {
    const a = pc.a <= 0 && butt(i) ? -half : pc.a, b = pc.b >= e.len && butt((i + 1) % edges.length) ? e.len + half : pc.b;
    lg.save(); lg.translate(e.x, e.y); lg.rotate(e.rot);
    v = drawStrip(lg, rims, v, a, b, s, rng);
    lg.restore();
  } });
  // T-joints where a divider meets the wall (stem outward), if the zone's art suits it
  if (FC.tee && kitImage(F.tee)) {
    const te = teeInfo(F.tee), ts = rim0.thick / te.thick * s;
    for (const d of dividers) {
      const [x, y] = at(d.e, d.t);
      lg.save(); lg.translate(x, y); lg.rotate(d.e.rot + Math.PI);
      lg.drawImage(te.img, -te.xc * ts, -te.mid * ts, te.w * ts, te.h * ts);
      lg.restore();
    }
  }
  // end caps (mirrored at a stretch's start), and a cap standing as a post on each butt-jointed corner
  if (kitImage(F.cap)) {
    const cp = boxInfo(F.cap), along = (cp.x1 - cp.x0) * s, mid = (cp.y0 + cp.y1) / 2;
    const cap = (x, y, rot, flip) => {
      lg.save(); lg.translate(x, y); lg.rotate(rot); lg.scale(flip, 1);
      lg.drawImage(cp.img, -(cp.x0 + cp.x1) / 2 * s, -mid * s, cp.w * s, cp.h * s);
      lg.restore();
    };
    for (const e of edges) for (const pc of e.pieces) for (const [t, flip] of [[pc.a, -1], [pc.b, 1]]) {
      if (flip < 0 ? pc.capA : pc.capB) cap(...at(e, t - flip * along / 2), e.rot, flip);
    }
    if (FC.jointCap) edges.forEach((e, i) => { if (butt(i)) cap(e.x, e.y, e.rot, 1); });
  }
  // corner pieces: the L turned so it opens between the wall going on and the wall coming in (toward the play area at
  // an outer corner, into the compartment at an inner one)
  corners.forEach((c, i) => {
    if (!c.key) return;
    const co = cornerInfo(c.key), cs = rim0.thick / co.thick * s;
    lg.save(); lg.translate(edges[i].x, edges[i].y); lg.rotate(Math.atan2(c.dy, c.dx) - Math.PI / 4);
    lg.drawImage(co.img, -co.xc * cs, -co.yc * cs, co.w * cs, co.h * cs);
    lg.restore();
  });
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const sh = FC.shadow * n * px;
  g.shadowColor = 'rgba(0,8,12,0.55)'; g.shadowBlur = 12 * sh; g.shadowOffsetX = 3 * sh; g.shadowOffsetY = 6 * sh;
  g.drawImage(lc, 0, 0);
  g.restore();

  return {
    inner: [L + half, T + half, R - half, B - half],               // the plain rectangle inside the wall (before any notch)
    outline: V, edges, corners, heroes, dividers, half,
    // true when a circle is wholly inside the wall (clear of its inner face, notches included)
    inside: (x, y, r = 0) => inPoly(V, x, y) && edgeDist(V, x, y) >= r + half,
  };
}

// Strips along local x from a to b, centred on local y = 0, tiling end to end from a seeded point in the art, taking
// turns through `list` from index v (returns the next index).
function drawStrip(g, list, v, a, b, s, rng) {
  let x = a, src = list[0].x0 + Math.floor(rng() * (list[0].x1 - list[0].x0));
  while (x < b - 0.5) {
    const st = list[v % list.length], sw = Math.min(st.x1 - src, (b - x) / s);
    g.drawImage(st.img, src, 0, sw, st.h, x, -st.mid * s, sw * s + 0.6, st.h * s);
    x += sw * s; v++; src = list[v % list.length].x0;
  }
  return v;
}

// ======================= heroes =======================
// Where the big props go: outside the wall (a notch's compartment gives the most room), leaning in over the wall by at
// most heroOverlap of their size, cropped by the plate edge but with at least heroVisible of them on the plate, clear of
// the road, the pads and each other; the sides taking turns, now and then the top. A long one (small `turn` in the kit)
// lies along the nearest plate edge; a round one turns any way.
function planHeroes(env, Z, rng, geo) {
  const FC = C.levelFrame, { V, T, W, H, n, half, taken } = geo, road = env.road, roadOuter = env.roadOuter;
  const list = (Z.frameHeroes || []).map(e => [artKey(e[0]), ...e.slice(1)]).filter(e => e[0] && kitImage(e[0]));
  const heroes = [], used = new Set();
  const count = Math.min(list.length, Math.floor(FC.heroes[0] + rng() * (FC.heroes[1] - FC.heroes[0] + 0.99)));
  let side = rng() < 0.5 ? 'left' : 'right';
  const topY = T + FC.heroTopBand * n, botY = H - FC.heroBottom * n;
  for (let i = 0; i < count; i++) {
    const zone = (i === 2 && count >= 3) || rng() < FC.heroTop ? 'top' : side;
    if (zone !== 'top') side = side === 'left' ? 'right' : 'left';
    const e = pickWeighted(list.filter(h => !used.has(h[0])), rng);
    if (!e) break;
    const [key, , s0, s1, turn] = e, [, iw, ih] = SPRITES[key], long = turn < 1;
    let scale = (s0 + rng() * (s1 - s0)) * FC.heroScale * Math.sqrt(n);
    const tilt = (rng() - 0.5) * 2 * (long ? turn * FC.heroLongTurn : Math.PI);
    let placed = null;
    for (let shrink = 0; shrink <= FC.heroShrinks && !placed; shrink++) {
      if (shrink) scale *= FC.heroShrink;
      const r = SPRITES[key][5] * scale, across = long ? r * Math.min(iw, ih) / Math.max(iw, ih) * 1.05 : r;
      let best = null, bestScore = -Infinity;
      for (let t = 0; t < FC.heroTries; t++) {
        const x = zone === 'left' ? -r * 0.6 + rng() * (W * 0.42 + r * 0.6) : zone === 'right' ? W * 0.58 + rng() * (W * 0.42 + r * 0.6) : -r * 0.6 + rng() * (W + r * 1.2);
        const y = zone === 'top' ? -r * 0.6 + rng() * (topY + r * 0.6) : topY * 0.5 + rng() * (botY - topY * 0.5);
        // a long one lies along the plate edge it's nearest (a side: upright; the top: level), its bottom toward the play area
        const near = Math.min(x, W - x) < y ? (x < W / 2 ? 'left' : 'right') : 'top';
        const rot = (!long ? 0 : near === 'top' ? 0 : near === 'left' ? -QUARTER : QUARTER) + tilt;
        const circles = footprint(x, y, rot, r, across);
        // leaning in no further than heroOverlap of its size past the wall's outer face
        if (!circles.every(([cx, cy, cr]) => outside(V, cx, cy) >= half + (1 - FC.heroOverlap) * cr)) continue;
        const vis = visibleShare(x, y, rot, r, across, !long, W, H);
        if (vis < FC.heroVisible) continue;
        if (!circles.every(([cx, cy, cr]) => road.clear(cx, cy, roadOuter + cr * 0.95 + FC.heroRoadGap * n)
          && !taken.some(([tx, ty, tr]) => Math.hypot(cx - tx, cy - ty) < tr + cr * 0.9))) continue;
        if (heroes.some(h => h.circles.some(([hx, hy, hr]) => circles.some(([cx, cy, cr]) => Math.hypot(cx - hx, cy - hy) < hr + cr + FC.heroGap * n)))) continue;
        const spread = heroes.reduce((m, h) => Math.min(m, Math.hypot(h.x - x, h.y - y)), 1200);
        const score = spread * 0.5 + vis * FC.heroVisBonus * n + rng() * 80;
        if (score > bestScore) { bestScore = score; best = { key, x, y, scale, rot, circles }; }
      }
      placed = best;
    }
    if (!placed) continue;
    used.add(placed.key); heroes.push(placed);
  }
  return heroes;
}
// The share of a hero on the plate: points over its footprint (a disc, or a long one's box turned by rot) counted.
function visibleShare(x, y, rot, hw, hh, round, W, H) {
  const c = Math.cos(rot), sn = Math.sin(rot);
  let all = 0, on = 0;
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
    const u = i / 4, v = j / 4;
    if (round && u * u + v * v > 1) continue;
    const px = x + c * u * hw - sn * v * hh, py = y + sn * u * hw + c * v * hh;
    all++; if (px >= 0 && px <= W && py >= 0 && py <= H) on++;
  }
  return on / all;
}
// Circles covering a box of half length hw and half width hh, turned by rot at (x, y): one if it's round-ish, a row
// along it if it's long.
function footprint(x, y, rot, hw, hh) {
  if (hw <= hh * 1.2) return [[x, y, Math.max(hw, hh)]];
  const m = Math.ceil((hw - hh) / hh) + 1, out = [], c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i < m; i++) { const d = -(hw - hh) + 2 * (hw - hh) * i / (m - 1); out.push([x + c * d, y + s * d, hh * 1.08]); }
  return out;
}
function pickWeighted(list, rng) {
  if (!list.length) return null;
  let q = rng() * list.reduce((a, e) => a + e[1], 0);
  for (const e of list) if ((q -= e[1]) <= 0) return e;
  return list[list.length - 1];
}

// Draws the planned heroes (over the road and pads, under the painter's props) with a big soft shadow; returns their
// footprints as [x, y, r] circles (a long one as a row of them) so the painter's props keep clear.
export function frameHeroes(g, def, env, frame) {
  if (!frame) return [];
  const out = [];
  for (const h of [...frame.heroes].sort((p, q) => p.y - q.y)) {
    kitSprite(g, h.key, h.x, h.y, h.scale, h.rot, C.levelFrame.heroShadow);
    out.push(...h.circles);
  }
  return out;
}
