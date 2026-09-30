// Paints a generated level's plate (src/levelGen.js) from the art kit (src/kit.js, assets/kit/), in its zone's look
// (the level's `world`): the zone's ground texture (denim also gets quilt seams and tone squares), fabric patches
// sewn under the road, a felt road with a suede edge and a running stitch, the kit's Pin pads, heart-pad workshop
// and big fork buttons, then the zone's props scattered on the free ground (clear of the road, pads and each other),
// each with a soft shadow, and a vignette. Decoration uses its own seeded stream, so the same level always paints the
// same plate. Called by render.js and the level lab; imports nothing that needs the game's DOM.
import { CONFIG as C } from './config.js';
import { makeRng } from '../vendor/mulberry32.js';
import { curve } from './levelGen.js';
import { KIT_DIR, SPRITES, TEXTURES, ZONES } from './kit.js';

const TAU = Math.PI * 2;
const zoneOf = def => ZONES[def.world] ? def.world : 'denim';

// ======================= kit loading =======================
// Images load on demand: the fixed pieces, the sewing props and the shared textures, plus the zone's own props and
// ground. loadKit(zone) resolves once they're decoded; loadKit() loads every zone (the level lab).
const images = {}, loading = {};
function loadImage(key, file) {
  if (!loading[key]) loading[key] = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { images[key] = key.startsWith('tex:') ? tileable(img) : img; resolve(); };
    img.onerror = reject;
    img.src = KIT_DIR + file;
  });
  return loading[key];
}
function neededFor(zone) {
  const z = ZONES[zone], keys = new Set([zone + 'PinPad', zone + 'HeartPad', 'forkButton']), tex = new Set(['roadFelt', 'roadEdge', z.ground, ...z.patches]);
  for (const [set] of z.sets) for (const [k] of set) keys.add(k);
  return { keys, tex };
}
// A texture tile as a pattern source. Some kit tiles have a few fully transparent rows or columns at an edge (left over
// from cutting them out); those are cropped off and the rest mirror-tiled 2x2, which always repeats seamlessly.
function tileable(img) {
  const w = img.width, h = img.height, c = canvas(w, h), g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const col = g.getImageData(w >> 1, 0, 1, h).data, row = g.getImageData(0, h >> 1, w, 1).data;
  let y0 = 0, y1 = h, x0 = 0, x1 = w;
  while (y0 < y1 && col[y0 * 4 + 3] < 250) y0++;
  while (y1 > y0 && col[(y1 - 1) * 4 + 3] < 250) y1--;
  while (x0 < x1 && row[x0 * 4 + 3] < 250) x0++;
  while (x1 > x0 && row[(x1 - 1) * 4 + 3] < 250) x1--;
  if (y0 === 0 && y1 === h && x0 === 0 && x1 === w) return img;
  const cw = x1 - x0, ch = y1 - y0, m = canvas(cw * 2, ch * 2), mg = m.getContext('2d');
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    mg.save(); mg.translate(sx < 0 ? 2 * cw : 0, sy < 0 ? 2 * ch : 0); mg.scale(sx, sy);
    mg.drawImage(img, x0, y0, cw, ch, 0, 0, cw, ch); mg.restore();
  }
  return m;
}
const ready = {};
export const kitReady = zone => !!ready[zone];
export function loadKit(zone) {
  if (!zone) return Promise.all(Object.keys(ZONES).map(loadKit));
  const { keys, tex } = neededFor(zone);
  return Promise.all([...[...keys].map(k => loadImage(k, SPRITES[k][0])), ...[...tex].map(t => loadImage('tex:' + t, TEXTURES[t]))])
    .then(() => { ready[zone] = true; });
}

// ======================= plate =======================
// The painted plate for a generated level (a canvas the size of def.w x def.h), cached per level. Returns null until
// its zone's kit has loaded; onReady() is called once it has, so the caller can ask again.
const plates = new WeakMap();
export function plateFor(def, onReady) {
  if (plates.has(def)) return plates.get(def);
  const zone = zoneOf(def);
  if (!ready[zone]) { loadKit(zone).then(onReady, () => {}); return null; }
  const c = paintLevel(def);
  plates.set(def, c);
  return c;
}

const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

export function paintLevel(def) {
  // A bigger level (def.size > 1) is painted at its full plate size but onto a canvas the usual size (the screen shows it
  // zoomed out anyway), so everything here runs under a 1 / size scale; the two offscreen layers get the same scale.
  const G = C.levelGen, W = def.w, H = def.h, k = 1 / (def.size || 1), rng = makeRng((def.seed | 0) ^ 0x6A09E6);
  const layer = () => { const cc = canvas(W * k, H * k), gc = cc.getContext('2d'); gc.scale(k, k); return [cc, gc]; };
  const [c, g] = layer();
  const flat = img => { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(img, 0, 0); g.restore(); };
  const Z = ZONES[zoneOf(def)], pat = t => g.createPattern(images['tex:' + t], 'repeat');
  const polys = def.paths.map(p => curve(p, 12));
  const roadOuter = G.roadHalf + G.roadBorder;

  // 1. ground; denim is a quilt: squares in slightly different tones, dark seams with a pale running stitch
  g.fillStyle = pat(Z.ground); g.fillRect(0, 0, W, H);
  if (Z.seams) {
    const Q = 235, ox = -rng() * Q, oy = -rng() * Q;
    for (let y = oy; y < H; y += Q) for (let x = ox; x < W; x += Q) {
      const t = rng();
      g.fillStyle = t < 0.5 ? 'rgba(0,25,35,' + (0.05 + t * 0.2) + ')' : 'rgba(170,230,235,' + ((t - 0.5) * 0.1) + ')';
      g.fillRect(x, y, Q, Q);
    }
    for (let x = ox; x < W; x += Q) seam(g, x, 0, x, H);
    for (let y = oy; y < H; y += Q) seam(g, 0, y, W, y);
  }

  // 2. fabric patches sewn on the ground (under the road)
  for (let i = 0; i < G.patches; i++) {
    const fabric = Z.patches[Math.floor(rng() * Z.patches.length)];
    patch(g, rng() * W, rng() * H, 130 + rng() * 150, 110 + rng() * 130, (rng() - 0.5) * 0.4, pat(fabric));
  }

  // 3. the fork buttons (a fork with a Pin pad inside gets the pad instead, in step 5)
  for (const d of def.deco) if (d.kind === 'button') sprite(g, 'forkButton', d.x, d.y, d.r / SPRITES.forkButton[5], 0, 1);

  // 4. road: soft shadow, suede edge, felt, then a running stitch just inside each edge
  const strokeAll = (width, style, gc = g) => {
    gc.lineWidth = width; gc.strokeStyle = style; gc.lineJoin = 'round'; gc.lineCap = 'round';
    for (const P of polys) strokePath(gc, P);
  };
  g.save(); g.shadowColor = 'rgba(0,12,18,0.55)'; g.shadowBlur = 16; g.shadowOffsetY = 6; strokeAll(2 * roadOuter, '#3a2210'); g.restore();
  // pale quilting line in the ground alongside the road
  const [quilt, qg] = layer();
  qg.setLineDash([14, 10]); qg.lineWidth = 2.5; qg.strokeStyle = 'rgba(235,225,195,0.45)';
  for (const P of polys) for (const s of [-1, 1]) strokePath(qg, offsetPoly(P, s * (roadOuter + 20)));
  qg.setLineDash([]); qg.globalCompositeOperation = 'destination-out';
  strokeAll(2 * (roadOuter + 12), '#000', qg);
  flat(quilt);
  strokeAll(2 * roadOuter, pat('roadEdge'));
  strokeAll(2 * roadOuter - 2 * G.roadBorder + 4, 'rgba(50,26,10,0.85)');                     // dark seam between edge and felt
  strokeAll(2 * G.roadHalf, pat('roadFelt'));
  g.save(); g.globalAlpha = 0.18; strokeAll(2 * G.roadHalf, '#6b4a2a'); g.restore();          // edges a touch darker...
  strokeAll(2 * G.roadHalf - 14, pat('roadFelt'));                                               // ...than the middle
  const [st, sg] = layer();
  sg.setLineDash([16, 12]); sg.lineWidth = 4.5; sg.lineCap = 'round'; sg.strokeStyle = Z.stitch;
  for (const P of polys) for (const s of [-1, 1]) strokePath(sg, offsetPoly(P, s * (G.roadHalf - 13)));
  sg.setLineDash([]); sg.globalCompositeOperation = 'destination-out';
  strokeAll(2 * (G.roadHalf - 19), '#000', sg);                                                 // no stitches across another road
  flat(st);

  // 5. Pin pads, the heart pad
  const pinKey = zoneOf(def) + 'PinPad', heartKey = zoneOf(def) + 'HeartPad';
  for (const [x, y] of def.spots) sprite(g, pinKey, x, y, def.spotR / SPRITES[pinKey][5] * 1.04, rng() * TAU, 1);
  sprite(g, heartKey, def.heart[0], def.heart[1], def.workshopR / SPRITES[heartKey][5] * 1.04, 0, 1);

  // 6. props on the free ground: picked by weight from the zone's sets, placed biggest first, each clear of the road,
  // the pads, the heart, the fork buttons and each other (props may hang off the plate's edges)
  const taken = def.spots.map(([x, y]) => [x, y, def.spotR + 6]).concat([[def.heart[0], def.heart[1], def.workshopR + 6]], def.deco.map(d => [d.x, d.y, d.r + 10]));
  const picks = [];
  for (let i = 0; i < G.props; i++) {
    let r = rng(), set = Z.sets[0][0];
    for (const [s, share] of Z.sets) { if ((r -= share) <= 0) { set = s; break; } }
    const total = set.reduce((a, p) => a + p[1], 0);
    let q = rng() * total, p = set[0];
    for (const e of set) { if ((q -= e[1]) <= 0) { p = e; break; } }
    const scale = p[2] + rng() * (p[3] - p[2]);
    picks.push({ key: p[0], scale, rot: (rng() - 0.5) * 2 * p[4], rad: SPRITES[p[0]][5] * scale });
  }
  picks.sort((a, b) => b.rad - a.rad);
  for (const pk of picks) {
    for (let tries = 0; tries < 40; tries++) {
      const x = -pk.rad * 0.35 + rng() * (W + pk.rad * 0.7), y = -pk.rad * 0.35 + rng() * (H + pk.rad * 0.7);
      if (distToPolys(polys, x, y) < roadOuter + pk.rad * 0.92 + 6) continue;
      if (taken.some(([tx, ty, tr]) => Math.hypot(x - tx, y - ty) < tr + pk.rad * 0.88)) continue;
      sprite(g, pk.key, x, y, pk.scale, pk.rot, 1);
      taken.push([x, y, pk.rad]);
      break;
    }
  }

  // 7. vignette
  const v = g.createRadialGradient(W / 2, H * 0.48, Math.min(W, H) * 0.35, W / 2, H * 0.48, Math.hypot(W, H) * 0.58);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(5,12,16,0.5)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  return c;
}

// ======================= pieces =======================
// A kit sprite centred on (x, y) (its visible centre), scaled and turned, with a soft shadow if `shadow`.
function sprite(g, key, x, y, scale, rot, shadow) {
  const [, , , cx, cy] = SPRITES[key], img = images[key];
  if (!img) return;
  g.save();
  if (shadow) { g.shadowColor = 'rgba(0,10,15,0.5)'; g.shadowBlur = 12; g.shadowOffsetX = 3; g.shadowOffsetY = 6; }
  g.translate(x, y); g.rotate(rot); g.scale(scale, scale);
  g.drawImage(img, -cx, -cy);
  g.restore();
}
function strokePath(g, P) { g.beginPath(); P.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
// The polyline shifted sideways by d (positive = to the right of the direction of travel).
function offsetPoly(P, d) {
  return P.map(([x, y], i) => {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
    return [x - ty / l * d, y + tx / l * d];
  });
}
function distToPolys(polys, x, y) {
  let best = Infinity;
  for (const P of polys) for (const [px, py] of P) { const d = (px - x) ** 2 + (py - y) ** 2; if (d < best) best = d; }
  return Math.sqrt(best);
}
function seam(g, x0, y0, x1, y1) {
  g.setLineDash([]); g.lineWidth = 3; g.strokeStyle = 'rgba(0,18,24,0.4)';
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  const vert = x0 === x1;
  g.setLineDash([9, 8]); g.lineWidth = 1.8; g.strokeStyle = 'rgba(225,220,195,0.35)';
  g.beginPath(); g.moveTo(x0 + (vert ? 7 : 0), y0 + (vert ? 0 : 7)); g.lineTo(x1 + (vert ? 7 : 0), y1 + (vert ? 0 : 7)); g.stroke();
  g.setLineDash([]);
}
// A fabric patch with pinked (zigzag) edges cut from a kit fabric, a stitched border and a soft shadow.
function patch(g, cx, cy, w, h, rot, fabric) {
  g.save(); g.translate(cx, cy); g.rotate(rot);
  const p = new Path2D(), z = 9;
  const edge = (x0, y0, x1, y1, nx, ny) => { const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / z)); for (let i = 1; i <= n; i++) { const t = i / n, k = i % 2 ? 5 : 0; p.lineTo(x0 + (x1 - x0) * t + nx * k, y0 + (y1 - y0) * t + ny * k); } };
  p.moveTo(-w / 2, -h / 2); edge(-w / 2, -h / 2, w / 2, -h / 2, 0, -1); edge(w / 2, -h / 2, w / 2, h / 2, 1, 0); edge(w / 2, h / 2, -w / 2, h / 2, 0, 1); edge(-w / 2, h / 2, -w / 2, -h / 2, -1, 0); p.closePath();
  g.save(); g.shadowColor = 'rgba(0,10,15,0.5)'; g.shadowBlur = 10; g.shadowOffsetY = 4; g.fillStyle = '#222'; g.fill(p); g.restore();
  fabric.setTransform(new DOMMatrix().scale(0.5));                                      // half size: checks that suit a scrap
  g.fillStyle = fabric; g.fill(p);
  g.setLineDash([10, 8]); g.lineWidth = 2; g.strokeStyle = 'rgba(240,228,200,0.7)';
  g.strokeRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24);
  g.setLineDash([]);
  g.restore();
}
