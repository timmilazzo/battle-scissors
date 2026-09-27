// Paints a generated level's plate (src/levelGen.js) in the Button Fork quilt style: denim quilt squares, fabric
// patches, a stitched beige felt road with a brown edge, round stitched Pin pads, a big button inside each fork, the red
// heart-pad workshop and scattered buttons. Fabric textures are swatches cut from assets/level2-bg.webp (the "kit"),
// re-stamped and mirror-tiled so they don't repeat visibly; everything else is drawn here. Decoration uses its own
// seeded stream, so the same recipe + seed always paints the same plate. Called by render.js and the level lab; imports nothing that needs the game's DOM.
import { CONFIG as C } from './config.js';
import { makeRng } from '../vendor/mulberry32.js';
import { curve } from './levelGen.js';

const TAU = Math.PI * 2;
const KIT_URL = new URL('../assets/level2-bg.webp', import.meta.url).href;
const DENIM_SWATCHES = [[655, 795, 60, 55], [578, 335, 60, 55], [232, 1030, 60, 40]];   // plain denim in the kit
const ROAD_SWATCH = [425, 1255, 100, 70];                                                // plain road felt

let kit = null, kitPromise = null, tiles = null;
export const kitReady = () => !!tiles;
export function loadKit() {
  if (!kitPromise) {
    kitPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { kit = img; tiles = makeTiles(); resolve(); };
      img.onerror = reject;
      img.src = KIT_URL;
    });
  }
  return kitPromise;
}

const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
// A 2x2 mirrored copy of `src`: tiles seamlessly.
function mirrorTile(src) {
  const w = src.width, h = src.height, c = canvas(w * 2, h * 2), g = c.getContext('2d');
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    g.save(); g.translate(sx < 0 ? 2 * w : 0, sy < 0 ? 2 * h : 0); g.scale(sx, sy); g.drawImage(src, 0, 0); g.restore();
  }
  return c;
}
function makeTiles() {
  // denim: plain swatches stamped with soft edges at random over a square, flipped at random, then mirror-tiled
  const S = 360, d = canvas(S, S), g = d.getContext('2d'), rng = makeRng(7);
  const [bx, by, bw, bh] = DENIM_SWATCHES[0];
  for (let y = 0; y < S; y += bh) for (let x = 0; x < S; x += bw) g.drawImage(kit, bx, by, bw, bh, x, y, bw, bh);   // opaque base
  for (let i = 0; i < 160; i++) {
    const [sx, sy, sw, sh] = DENIM_SWATCHES[Math.floor(rng() * DENIM_SWATCHES.length)];
    const t = canvas(sw, sh), tg = t.getContext('2d');
    tg.drawImage(kit, sx, sy, sw, sh, 0, 0, sw, sh);
    tg.globalCompositeOperation = 'destination-in';
    const gr = tg.createRadialGradient(sw / 2, sh / 2, Math.min(sw, sh) * 0.2, sw / 2, sh / 2, Math.min(sw, sh) * 0.5);
    gr.addColorStop(0, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)'); tg.fillStyle = gr; tg.fillRect(0, 0, sw, sh);
    g.save(); g.translate(rng() * S, rng() * S); g.scale(rng() < 0.5 ? -1 : 1, rng() < 0.5 ? -1 : 1); g.drawImage(t, -sw / 2, -sh / 2); g.restore();
  }
  const [rx, ry, rw, rh] = ROAD_SWATCH, r = canvas(rw, rh);
  r.getContext('2d').drawImage(kit, rx, ry, rw, rh, 0, 0, rw, rh);
  return { denim: mirrorTile(d), road: mirrorTile(r) };
}

// ======================= plate =======================
// The painted plate for a generated level (a canvas the size of def.w x def.h), cached per level. Returns null until
// the kit has loaded; onReady() is called once it has, so the caller can ask again.
const plates = new WeakMap();
export function plateFor(def, onReady) {
  if (plates.has(def)) return plates.get(def);
  if (!tiles) { loadKit().then(onReady, () => {}); return null; }
  const c = paintLevel(def);
  plates.set(def, c);
  return c;
}

export function paintLevel(def) {
  const G = C.levelGen, W = def.w, H = def.h, c = canvas(W, H), g = c.getContext('2d'), rng = makeRng((def.seed | 0) ^ 0x6A09E6);
  const pat = img => g.createPattern(img, 'repeat');
  const denim = pat(tiles.denim), road = pat(tiles.road);
  const polys = def.paths.map(p => curve(p, 12));
  const roadOuter = G.roadHalf + G.roadBorder;

  // 1. denim quilt: squares in slightly different tones, dark seams with a pale running stitch beside them
  g.fillStyle = denim; g.fillRect(0, 0, W, H);
  const Q = 235, ox = -rng() * Q, oy = -rng() * Q;
  for (let y = oy; y < H; y += Q) for (let x = ox; x < W; x += Q) {
    const t = rng();
    g.fillStyle = t < 0.5 ? 'rgba(0,25,35,' + (0.05 + t * 0.2) + ')' : 'rgba(170,230,235,' + ((t - 0.5) * 0.1) + ')';
    g.fillRect(x, y, Q, Q);
  }
  g.lineCap = 'butt';
  for (let x = ox; x < W; x += Q) seam(g, x, 0, x, H);
  for (let y = oy; y < H; y += Q) seam(g, 0, y, W, y);

  // 2. fabric patches sewn on the denim (under the road)
  for (let i = 0; i < G.patches; i++) patch(g, rng() * W, rng() * H, 130 + rng() * 150, 110 + rng() * 130, (rng() - 0.5) * 0.4, rng);

  // 3. the fork buttons: a navy denim ring with a big wooden button
  for (const d of def.deco) if (d.kind === 'button') bigButton(g, d.x, d.y, d.r, denim);

  // 4. road: soft shadow, brown edge, felt, then a running stitch just inside each edge
  const strokeAll = (width, style) => {
    g.lineWidth = width; g.strokeStyle = style; g.lineJoin = 'round'; g.lineCap = 'round';
    for (const P of polys) { g.beginPath(); P.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
  };
  g.save(); g.shadowColor = 'rgba(0,15,20,0.55)'; g.shadowBlur = 16; g.shadowOffsetY = 6; strokeAll(2 * roadOuter, '#3a2210'); g.restore();
  // pale quilting line in the denim alongside the road
  const quilt = canvas(W, H), qg = quilt.getContext('2d');
  qg.setLineDash([14, 10]); qg.lineWidth = 2.5; qg.strokeStyle = 'rgba(235,225,195,0.45)';
  for (const P of polys) for (const s of [-1, 1]) strokePath(qg, offsetPoly(P, s * (roadOuter + 20)));
  qg.setLineDash([]); qg.globalCompositeOperation = 'destination-out'; qg.lineCap = 'round'; qg.lineJoin = 'round'; qg.lineWidth = 2 * (roadOuter + 12);
  for (const P of polys) strokePath(qg, P);
  g.drawImage(quilt, 0, 0);
  strokeAll(2 * roadOuter, '#4a2a12');
  g.save(); g.globalAlpha = 0.45; strokeAll(2 * roadOuter - 4, road); g.restore();                  // mottled leather edge
  strokeAll(2 * roadOuter - 2 * G.roadBorder + 4, 'rgba(60,32,12,0.9)');
  strokeAll(2 * G.roadHalf, road);
  g.save(); g.globalCompositeOperation = 'multiply'; strokeAll(2 * G.roadHalf, 'rgba(236,214,176,1)'); g.restore();
  strokeAll(2 * G.roadHalf - 14, road);                                                            // edges a touch darker
  const st = canvas(W, H), sg = st.getContext('2d');
  sg.setLineDash([16, 12]); sg.lineWidth = 4.5; sg.lineCap = 'round'; sg.strokeStyle = '#6e4524';
  for (const P of polys) for (const s of [-1, 1]) strokePath(sg, offsetPoly(P, s * (G.roadHalf - 13)));
  sg.setLineDash([]); sg.globalCompositeOperation = 'destination-out'; sg.lineCap = 'round'; sg.lineJoin = 'round'; sg.lineWidth = 2 * (G.roadHalf - 19);
  for (const P of polys) strokePath(sg, P);                                                        // no stitches across another road
  g.drawImage(st, 0, 0);

  // 5. Pin pads, the heart pad, buttons on the free denim
  for (const [x, y] of def.spots) pad(g, x, y, def.spotR, road);
  heartPad(g, def.heart[0], def.heart[1], def.workshopR, road);
  const taken = def.spots.map(([x, y]) => [x, y, def.spotR]).concat([[def.heart[0], def.heart[1], def.workshopR]], def.deco.map(d => [d.x, d.y, d.r + 30]));
  const COLORS = ['#b8793c', '#3d6fb5', '#c0392b', '#2b3a67', '#c99a3e', '#7b3fc4'];
  for (let i = 0, placed = 0; i < 300 && placed < G.buttons; i++) {
    const r = 18 + rng() * 34, x = r + rng() * (W - 2 * r), y = r + rng() * (H - 2 * r);
    if (distToPolys(polys, x, y) < roadOuter + r + 10) continue;
    if (taken.some(([tx, ty, tr]) => Math.hypot(x - tx, y - ty) < tr + r + 14)) continue;
    button(g, x, y, r, COLORS[Math.floor(rng() * COLORS.length)], rng() < 0.3 ? 2 : 4, rng() * TAU);
    taken.push([x, y, r]); placed++;
  }

  // 6. vignette
  const v = g.createRadialGradient(W / 2, H * 0.48, Math.min(W, H) * 0.35, W / 2, H * 0.48, Math.hypot(W, H) * 0.58);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(5,12,16,0.5)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  return c;
}

// ======================= pieces =======================
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
// A fabric patch with pinked (zigzag) edges: plaid or plain cloth, a stitched border, a soft shadow.
const PLAIDS = [['#2c3f86', '#c9b27a', '#10183a'], ['#8f2626', '#e0c070', '#3a0c0c'], ['#35407a', '#d85c4a', '#141a3a'], ['#c79a2e', '#7a4a14', '#5a3a0a']];
function patch(g, cx, cy, w, h, rot, rng) {
  g.save(); g.translate(cx, cy); g.rotate(rot);
  const p = new Path2D(), z = 9;
  const edge = (x0, y0, x1, y1, nx, ny) => { const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / z)); for (let i = 1; i <= n; i++) { const t = i / n, k = i % 2 ? 5 : 0; p.lineTo(x0 + (x1 - x0) * t + nx * k, y0 + (y1 - y0) * t + ny * k); } };
  p.moveTo(-w / 2, -h / 2); edge(-w / 2, -h / 2, w / 2, -h / 2, 0, -1); edge(w / 2, -h / 2, w / 2, h / 2, 1, 0); edge(w / 2, h / 2, -w / 2, h / 2, 0, 1); edge(-w / 2, h / 2, -w / 2, -h / 2, -1, 0); p.closePath();
  g.save(); g.shadowColor = 'rgba(0,10,15,0.5)'; g.shadowBlur = 10; g.shadowOffsetY = 4; g.fillStyle = '#222'; g.fill(p); g.restore();
  const [base, stripe, dark] = PLAIDS[Math.floor(rng() * PLAIDS.length)];
  g.save(); g.clip(p);
  g.fillStyle = base; g.fillRect(-w, -h, 2 * w, 2 * h);
  const step = 22 + rng() * 16;
  g.globalAlpha = 0.35; g.fillStyle = dark;
  for (let x = -w; x < w; x += step) g.fillRect(x, -h, step * 0.45, 2 * h);
  for (let y = -h; y < h; y += step) g.fillRect(-w, y, 2 * w, step * 0.45);
  g.globalAlpha = 0.5; g.fillStyle = stripe;
  for (let x = -w + step * 0.7; x < w; x += step) g.fillRect(x, -h, 2, 2 * h);
  for (let y = -h + step * 0.7; y < h; y += step) g.fillRect(-w, y, 2 * w, 2);
  g.globalAlpha = 0.18; g.fillStyle = '#000';                                                      // weave grain
  for (let i = 0; i < 260; i++) g.fillRect(-w / 2 + rng() * w, -h / 2 + rng() * h, 2, 1);
  g.restore();
  g.setLineDash([10, 8]); g.lineWidth = 2; g.strokeStyle = 'rgba(240,228,200,0.7)';
  g.strokeRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24);
  g.setLineDash([]);
  g.restore();
}
function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); }
function pad(g, x, y, r, road) {
  g.save(); g.shadowColor = 'rgba(0,15,20,0.5)'; g.shadowBlur = 12; g.shadowOffsetY = 5; circ(g, x, y, r); g.fillStyle = '#7a5530'; g.fill(); g.restore();
  circ(g, x, y, r - 2); g.fillStyle = road; g.fill();
  const sh = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
  sh.addColorStop(0, 'rgba(255,245,220,0.15)'); sh.addColorStop(0.75, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(70,40,15,0.35)');
  circ(g, x, y, r - 2); g.fillStyle = sh; g.fill();
  g.setLineDash([15, 11]); g.lineWidth = 5; g.lineCap = 'round'; g.strokeStyle = '#6e4524';
  circ(g, x, y, r - 15); g.stroke(); g.setLineDash([]);
}
function button(g, x, y, r, color, holes, rot) {
  g.save();
  g.shadowColor = 'rgba(0,10,15,0.55)'; g.shadowBlur = r * 0.35; g.shadowOffsetY = r * 0.15;
  circ(g, x, y, r); g.fillStyle = color; g.fill();
  g.restore();
  const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  gr.addColorStop(0, 'rgba(255,255,255,0.35)'); gr.addColorStop(0.6, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.35)');
  circ(g, x, y, r); g.fillStyle = gr; g.fill();
  g.lineWidth = Math.max(1.5, r * 0.09); g.strokeStyle = 'rgba(0,0,0,0.3)'; circ(g, x, y, r * 0.72); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.18)'; circ(g, x - 1, y - 1, r * 0.72); g.stroke();
  g.fillStyle = 'rgba(15,8,4,0.85)';
  const hr = r * 0.12, hd = r * 0.25;
  for (let k = 0; k < holes; k++) { const a = rot + k * TAU / holes; circ(g, x + Math.cos(a) * hd, y + Math.sin(a) * hd, hr); g.fill(); }
}
// Inside a fork: a navy denim ring with a running stitch, and a big wooden button on it.
function bigButton(g, x, y, r, denim) {
  g.save(); g.shadowColor = 'rgba(0,10,15,0.6)'; g.shadowBlur = 18; g.shadowOffsetY = 6; circ(g, x, y, r); g.fillStyle = '#1f2f6a'; g.fill(); g.restore();
  g.save(); circ(g, x, y, r); g.clip(); g.globalAlpha = 0.55; g.globalCompositeOperation = 'luminosity'; g.fillStyle = denim; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore();
  g.save(); circ(g, x, y, r); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#3a52a8'; g.fill(); g.restore();
  g.setLineDash([16, 11]); g.lineWidth = 5; g.lineCap = 'round'; g.strokeStyle = '#efe3c4';
  circ(g, x, y, r - 16); g.stroke(); g.setLineDash([]);
  button(g, x, y, r * 0.68, '#b3703a', 4, Math.PI / 4);
}
// The workshop: a red felt pad with a stitched ring and a cream heart (as on the Button Fork plate).
function heartPath(cx, cy, s) {
  const p = new Path2D();
  for (let i = 0; i <= 120; i++) {
    const t = i / 120 * TAU, x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const px = cx + x * s / 17, py = cy - y * s / 17 - s * 0.1;
    i ? p.lineTo(px, py) : p.moveTo(px, py);
  }
  p.closePath();
  return p;
}
function heartPad(g, cx, cy, R, road) {
  g.save(); g.shadowColor = 'rgba(0,15,20,0.55)'; g.shadowBlur = 16; g.shadowOffsetY = 6; circ(g, cx, cy, R); g.fillStyle = '#3d2412'; g.fill(); g.restore();
  g.save(); circ(g, cx, cy, R - 5); g.clip();
  g.fillStyle = '#c93a2e'; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  g.globalCompositeOperation = 'multiply'; g.fillStyle = road; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  g.globalCompositeOperation = 'source-over';
  const sh = g.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
  sh.addColorStop(0, 'rgba(255,200,170,0.18)'); sh.addColorStop(0.7, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(40,0,0,0.35)');
  g.fillStyle = sh; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  g.restore();
  g.lineCap = 'round'; g.setLineDash([13, 11]); g.lineWidth = 5;
  g.strokeStyle = 'rgba(40,5,0,0.5)'; g.beginPath(); g.arc(cx + 1, cy + 2, R - 17, 0, TAU); g.stroke();
  g.strokeStyle = '#f3e6c8'; g.beginPath(); g.arc(cx, cy, R - 17, 0, TAU); g.stroke();
  g.setLineDash([]);
  const s = R * 0.62, hp = heartPath(cx, cy + R * 0.06, s);
  g.save(); g.shadowColor = 'rgba(40,0,0,0.5)'; g.shadowBlur = 6; g.shadowOffsetX = 2; g.shadowOffsetY = 4; g.fillStyle = '#efe4cc'; g.fill(hp); g.restore();
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = road; g.fill(hp); g.restore();
  g.lineWidth = 3; g.strokeStyle = '#5a3418'; g.stroke(hp);
  g.setLineDash([8, 7]); g.lineWidth = 3.5; g.strokeStyle = '#8a5a34'; g.stroke(heartPath(cx, cy + R * 0.06 + s * 0.02, s * 0.8));
  g.setLineDash([]);
}
