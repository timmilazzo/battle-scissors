// Paints a generated level's plate (src/levelGen.js) from the art kit (src/kit.js, assets/kit/), in its zone's look
// (the level's `world`): the zone's ground (denim a quilt of irregular squares, the others the texture with soft
// shifted pieces over it so the tile doesn't repeat, plus big tone washes), fabric patches at the corners and edges,
// a felt road with a soft contact shadow, a suede edge and a running stitch, the kit's Pin pads, heart-pad workshop
// and big fork buttons, then the zone's props in tiers (a few big heroes out in the margins, beds and heaps of related
// props, a few singles; all clear of the road, pads and each other, each with a soft shadow), a colour grade and a
// vignette. Decoration uses its own seeded stream, so the same level always paints the same plate. Called by render.js
// and the level lab; imports nothing that needs the game's DOM.
import { CONFIG as C } from './config.js';
import { makeRng } from '../vendor/mulberry32.js';
import { curve } from './levelGen.js';
import { KIT_DIR, SPRITES, TEXTURES, ZONES, ROAD_FELTS } from './kit.js';
import { drawDressing, loadDressing, dressingReady } from './levelDress.js';
import { drawRoadKit, roadKitKeys } from './roadKit.js';
import { frameKeys, frameBase, frameHeroes } from './levelFrame.js';

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
// (a texture or sprite the kit doesn't have yet is left out, so a zone still paints while art is being imported)
const haveTex = names => names.filter(t => TEXTURES[t]);
const haveSprites = keys => keys.filter(k => SPRITES[k]);
function neededFor(zone) {
  const z = ZONES[zone], keys = new Set([zone + 'PinPad', zone + 'HeartPad', 'forkButton', ...roadKitKeys(z)]);
  const tex = new Set(['roadFelt', 'roadEdge', z.ground, ...z.patches, ...haveTex(z.grounds || []), ...haveTex(ROAD_FELTS)]);
  const fk = frameKeys(z); fk.keys.forEach(k => keys.add(k)); fk.tex.forEach(t => tex.add(t));
  const add = list => { for (const e of list) keys.add(e[0]); };
  add(z.props.heroes); add(z.props.singles);
  for (const cl of z.props.clusters) { add(cl.members); if (cl.core) add(cl.core); }
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
// Resolves once the given SPRITES keys' images have loaded (for other modules that draw with kitSprite).
export function ensureSprites(keys) { return Promise.all(keys.map(key => loadImage(key, SPRITES[key][0]))); }
// The same for TEXTURES names (tiled and mirror-fixed like the painter's own).
export function ensureTextures(names) { return Promise.all(names.map(t => loadImage('tex:' + t, TEXTURES[t]))); }
// A loaded sprite's image / a loaded texture's tile (undefined until loaded), for sibling modules that slice or tile them.
export const kitImage = key => images[key];
export const kitTexture = name => images['tex:' + name];

// ======================= plate =======================
// The painted plate for a generated level (a canvas the size of def.w x def.h), cached per level. Returns null until
// its zone's kit and the level's dressing sprites have loaded; onReady() is called once they have, so the caller can ask again.
const plates = new WeakMap();
export function plateFor(def, onReady) {
  if (plates.has(def)) return plates.get(def);
  const zone = zoneOf(def);
  if (!ready[zone] || !dressingReady(def)) { Promise.all([loadKit(zone), loadDressing(def)]).then(onReady, () => {}); return null; }
  const c = paintLevel(def);
  plates.set(def, c);
  return c;
}

const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

export function paintLevel(def) {
  // A bigger level (def.size > 1) is painted at its full plate size but onto a canvas the usual size (the screen shows it
  // zoomed out anyway), so everything here runs under a 1 / size scale; the offscreen layers get the same scale.
  const G = C.levelGen, W = def.w, H = def.h, n = def.size || 1, k = 1 / n, rng = makeRng((def.seed | 0) ^ 0x6A09E6);
  const layer = () => { const cc = canvas(W * k, H * k), gc = cc.getContext('2d'); gc.scale(k, k); return [cc, gc]; };
  const [c, g] = layer();
  const flat = img => { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(img, 0, 0); g.restore(); };
  const Z = ZONES[zoneOf(def)], pat = t => g.createPattern(images['tex:' + t], 'repeat');
  const polys = def.paths.map(p => curve(p, 12)), road = roadIndex(polys);
  const roadOuter = G.roadHalf + G.roadBorder;
  const lerp = ([a, b]) => a + rng() * (b - a);

  // 1. ground. Denim is a quilt: irregular squares, each cut from the denim turned its own way, with seams; the other
  // zones get the texture again at other offsets (mirrored or turned) through soft blotchy masks, so the tile's repeat
  // can't be picked out. Then a low-frequency wash of the zone's tint and shade.
  // (the zone's extra ground tiles, once imported, take turns: the quilt's squares and the soft layers each pick one)
  const grounds = haveTex(Z.grounds || [Z.ground]).map(t => images['tex:' + t]), pickGround = () => grounds[Math.floor(rng() * grounds.length)];
  g.fillStyle = pat(Z.ground); g.fillRect(0, 0, W, H);
  if (Z.seams) quilt(g, pickGround, W, H, rng, G);
  else for (let i = 0; i < G.groundLayers; i++) {
    const [lc, lg] = layer(), p = lg.createPattern(pickGround(), 'repeat'), m = new DOMMatrix().translate(Math.round(rng() * 1024), Math.round(rng() * 1024));
    p.setTransform(Z.groundTurn ? m.rotate(Math.floor(rng() * 4) * 90) : m.scale(-1, 1));
    lg.fillStyle = p; lg.fillRect(0, 0, W, H);
    lg.globalCompositeOperation = 'destination-in';
    stretch(lg, noise(W, H, G.groundCell, rng, v => [0, 0, 0, clamp01((v - 0.5) * 2.4 + 0.5) * 255]), W, H, G.groundCell);
    g.drawImage(lc, 0, 0, W, H);
  }
  const tint = rgbOf(Z.tint), shade = rgbOf(Z.shade);
  g.globalAlpha = G.toneAlpha;
  stretch(g, noise(W, H, G.toneCell, rng, v => [...(v > 0.5 ? tint : shade), Math.abs(v - 0.5) * 510]), W, H, G.toneCell);
  g.globalAlpha = 1;

  // 2. fabric patches: at the corners and edges of the play area (inside the frame's walls when the zone has one; some
  // laid half over another), never centred on the road
  const F = Z.frame && C.levelFrame, px0 = F ? F.inset * n : 0, px1 = F ? W - F.inset * n : W, py0 = F ? F.top * n : 0, py1 = F ? H - F.bottom * n : H;
  const anchors = [[px0, py0], [px1, py0], [px0, py1], [px1, py1], [px0, H * (0.3 + rng() * 0.15)], [px1, H * (0.55 + rng() * 0.15)], [px0, H * (0.6 + rng() * 0.1)], [px1, H * (0.25 + rng() * 0.1)]];
  for (let i = anchors.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [anchors[i], anchors[j]] = [anchors[j], anchors[i]]; }
  const laid = [];
  for (let i = 0, m = Math.round((G.patches[zoneOf(def)] || 0) * n); i < m; i++) {
    const fabric = Z.patches[Math.floor(rng() * Z.patches.length)], w = lerp(G.patchW), h = lerp(G.patchH);
    const over = laid.length > 0 && (rng() < G.patchOverlap || !anchors.length);
    if (!over && !anchors.length) break;
    const [ax, ay] = over ? [0, 0] : anchors.shift();
    for (let t = 0; t < 10; t++) {
      let x, y;
      if (over) { const b = laid[Math.floor(rng() * laid.length)]; x = b[0] + (rng() - 0.5) * b[2] * 0.9; y = b[1] + (rng() < 0.5 ? -1 : 1) * b[3] * (0.35 + rng() * 0.3); }
      else {
        x = ax > W / 2 ? ax - w * (0.1 + rng() * 0.3) : ax + w * (0.1 + rng() * 0.3);
        y = ay === py0 ? ay + h * (0.1 + rng() * 0.3) : ay === py1 ? ay - h * (0.1 + rng() * 0.3) : ay + (rng() - 0.5) * h;
      }
      if (!road.clear(x, y, roadOuter + Math.min(w, h) * 0.3)) continue;
      patch(g, x, y, w, h, (rng() - 0.5) * 0.3, pat(fabric));
      laid.push([x, y, w, h]);
      break;
    }
  }

  // 2b. the frame (src/levelFrame.js): compartment floor, rim walls with gaps where roads pass, corners, dividers
  const taken = def.spots.map(([x, y]) => [x, y, def.spotR + 6]).concat([[def.heart[0], def.heart[1], def.workshopR + 6]], def.deco.map(d => [d.x, d.y, d.r + 10]));
  const env = { zone: Z, G, polys, roadOuter, road, taken };
  const frame = frameBase(g, def, env);

  // 3. the fork buttons (a fork with a Pin pad inside gets the pad instead, in step 5)
  for (const d of def.deco) if (d.kind === 'button') kitSprite(g, 'forkButton', d.x, d.y, d.r / SPRITES.forkButton[5], 0, 1);

  // 4. road: a wide soft shadow on the ground, a tighter drop shadow, suede edge, felt, then a running stitch
  const strokeAll = (width, style, gc = g) => {
    gc.lineWidth = width; gc.strokeStyle = style; gc.lineJoin = 'round'; gc.lineCap = 'round';
    for (const P of polys) strokePath(gc, P);
  };
  {                                                                  // (the wide one is blurred at quarter size, which is cheap, then stretched)
    const q = k / 4, ac = canvas(W * q, H * q), ag = ac.getContext('2d');
    ag.scale(q, q); ag.shadowColor = '#000'; ag.shadowBlur = G.roadAOBlur * q; ag.shadowOffsetY = 8 * q; strokeAll(2 * roadOuter, '#000', ag);
    g.globalAlpha = G.roadAO; g.drawImage(ac, 0, 0, W, H); g.globalAlpha = 1;
  }
  g.save(); g.shadowColor = 'rgba(0,12,18,0.55)'; g.shadowBlur = 14 * k; g.shadowOffsetY = 5 * k; strokeAll(2 * roadOuter, '#3a2210'); g.restore();
  // pale quilting line in the ground alongside the road
  const [qline, qg] = layer();
  qg.setLineDash([14, 10]); qg.lineWidth = 2.5; qg.strokeStyle = 'rgba(235,225,195,0.45)';
  for (const P of polys) for (const s of [-1, 1]) strokePath(qg, offsetPoly(P, s * (roadOuter + 20)));
  qg.setLineDash([]); qg.globalCompositeOperation = 'destination-out';
  strokeAll(2 * (roadOuter + 12), '#000', qg);
  flat(qline);
  strokeAll(2 * roadOuter, pat('roadEdge'));
  strokeAll(2 * roadOuter - 2 * G.roadBorder + 4, 'rgba(50,26,10,0.85)');                     // dark seam between edge and felt
  const felts = haveTex(ROAD_FELTS), felt = pat(felts[Math.floor(rng() * felts.length)]);     // one of the road felt tiles, by seed
  strokeAll(2 * G.roadHalf, felt);
  g.save(); g.globalAlpha = 0.18; strokeAll(2 * G.roadHalf, '#6b4a2a'); g.restore();          // edges a touch darker...
  strokeAll(2 * G.roadHalf - 14, felt);                                                          // ...than the middle
  const [st, sg] = layer();
  sg.setLineDash([16, 12]); sg.lineWidth = 4.5; sg.lineCap = 'round'; sg.strokeStyle = Z.stitch;
  for (const P of polys) for (const s of [-1, 1]) strokePath(sg, offsetPoly(P, s * (G.roadHalf - 13)));
  sg.setLineDash([]); sg.globalCompositeOperation = 'destination-out';
  strokeAll(2 * (G.roadHalf - 19), '#000', sg);                                                 // no stitches across another road
  flat(st);
  // the road kit (src/roadKit.js): fences or edge strips along the road, faint decals on the felt
  drawRoadKit(g, def, { zone: Z, G, polys, roadOuter, roadHalf: G.roadHalf, road, spots: def.spots, spotR: def.spotR,
    heart: def.heart, workshopR: def.workshopR, entries: def.entries, layer, flat });

  // 5. Pin pads, the heart pad
  const pinKey = zoneOf(def) + 'PinPad', heartKey = zoneOf(def) + 'HeartPad';
  for (const [x, y] of def.spots) kitSprite(g, pinKey, x, y, def.spotR / SPRITES[pinKey][5] * 1.04, rng() * TAU, 1);
  kitSprite(g, heartKey, def.heart[0], def.heart[1], def.workshopR / SPRITES[heartKey][5] * 1.04, 0, 1);

  // 5b. the frame's heroes, in its compartments (they replace the painter's own margin heroes below)
  taken.push(...frameHeroes(g, def, env, frame));

  // 6. props (src/kit.js), in three tiers: a few big heroes out in the margins, beds and heaps of related props, a few
  // singles. Everything keeps clear of the road, the pads, the heart, the fork buttons and the other props.
  const P = Z.props, gap = G.propGap;
  const fits = (x, y, rad, list = taken, share = 0.9, near = 0.92) => (!frame || frame.inside(x, y, rad)) && road.clear(x, y, roadOuter + rad * near + gap) && !list.some(([tx, ty, tr]) => Math.hypot(x - tx, y - ty) < (tr + rad) * share + gap);
  const make = e => { const scale = e[2] + rng() * (e[3] - e[2]); return { key: e[0], scale, rot: (rng() - 0.5) * 2 * e[4], rad: SPRITES[e[0]][5] * scale, x: null, y: 0 }; };
  // heroes: alternating sides, each where it's clear, farthest from the other heroes and mostly on the plate
  const heroes = [], xL = G.xMin * n, xR = W - (G.w - G.xMax) * n, used = new Set();
  const heroCount = Math.floor(lerp([G.heroes[0], G.heroes[1] + 0.99]) * Math.sqrt(n) * (frame ? G.heroFramedShare : 1));   // a framed plate has its tray heroes too
  let side = rng() < 0.5 ? 0 : 1;
  for (let i = 0; i < heroCount; i++, side ^= 1) {
    const e = pickWeighted(P.heroes.filter(h => !used.has(h[0])), rng);
    if (!e) break;
    const pk = make(e);
    pk.scale *= Math.sqrt(n); pk.rad *= Math.sqrt(n);                                   // a bigger plate is painted smaller: still crisp
    for (let shrink = 0; shrink < 4 && pk.x === null; shrink++) {
      if (shrink) { pk.scale *= G.heroShrink; pk.rad *= G.heroShrink; }
      let best = -Infinity;
      for (let t = 0; t < G.heroTries; t++) {
        // most tries in this hero's side margin, some in the other one, some anywhere (a big open stretch of ground)
        const s = (t & 3) === 3 ? side ^ 1 : side, open = (t & 7) === 6, x = open ? rng() * W : s ? xR + rng() * (W - xR) : rng() * xL, y = rng() * H;
        if (!fits(x, y, pk.rad, taken, 1, 0.85)) continue;
        const vis = (Math.min(x + pk.rad, W) - Math.max(x - pk.rad, 0)) * (Math.min(y + pk.rad, H) - Math.max(y - pk.rad, 0)) / (4 * pk.rad * pk.rad);
        if (vis < G.heroVisible) continue;
        const spread = heroes.reduce((m, h) => Math.min(m, Math.hypot(h.x - x, h.y - y)), 900);
        const inset = s ? W - pk.rad * G.heroInset : pk.rad * G.heroInset;                      // where it sits best
        const score = spread - (open ? G.heroOpenCost : Math.abs(x - inset) * 0.6);
        if (score > best) { best = score; pk.x = x; pk.y = y; }
      }
    }
    if (pk.x === null) continue;
    used.add(pk.key); heroes.push(pk); taken.push([pk.x, pk.y, pk.rad]);
  }
  // clusters: a centre far from the other clusters and heroes, a core piece there, members packed around it
  const clusters = [], centres = heroes.map(h => [h.x, h.y]);
  // (a bigger plate gets more clusters, and bigger ones, rather than n^2 as many: it's shown zoomed out)
  for (let i = 0, m = Math.round(G.clusters * n); i < m; i++) {
    const kind = pickWeighted(P.clusters, rng, 'w'), spread = kind.spread * Math.sqrt(n), cands = [];
    for (let t = 0; t < G.clusterTries * 3 && cands.length < G.clusterTries; t++) {
      const x = -20 + rng() * (W + 40), y = -20 + rng() * (H + 40);
      if ((!frame || frame.inside(x, y, spread * 0.3)) && road.clear(x, y, roadOuter + spread * 0.3 + gap) && !taken.some(([tx, ty, tr]) => Math.hypot(x - tx, y - ty) < tr + spread * 0.25)) cands.push([x, y]);
    }
    // the candidates farthest from the other clusters and heroes first; the first that holds enough of its pieces wins
    const far = ([x, y]) => centres.reduce((d, [px, py]) => Math.min(d, Math.hypot(px - x, py - y)), 1e9);
    cands.sort((p, q) => far(q) - far(p));
    for (const [cx, cy] of cands.slice(0, G.clusterAttempts)) {
      const own = [], items = [], count = Math.floor(lerp([kind.n[0], kind.n[1] + 0.99]) * n);
      let core = null;
      if (kind.core) {
        const pk = make(pickWeighted(kind.core, rng));
        if (fits(cx, cy, pk.rad)) { pk.x = cx; pk.y = cy; core = pk; own.push([cx, cy, pk.rad]); }
      }
      for (let j = 0; j < count; j++) {
        const pk = make(pickWeighted(kind.members, rng));
        for (let t = 0; t < 10; t++) {
          const a = rng() * TAU, d = spread * Math.sqrt(0.08 + rng() * 0.92), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.85;
          if (!fits(x, y, pk.rad) || !fits(x, y, pk.rad, own, G.clusterPack)) continue;
          pk.x = x; pk.y = y; items.push(pk); own.push([x, y, pk.rad]);
          break;
        }
      }
      if (items.length + (core ? 1 : 0) < Math.max(2, Math.ceil(count * G.clusterFill))) continue;
      taken.push(...own); centres.push([cx, cy]);
      items.sort((p, q) => p.y - q.y);
      clusters.push({ x: cx, y: cy, r: spread, items: core ? [core, ...items] : items });
      break;
    }
  }
  // singles: anywhere clear, biggest first
  const singles = [];
  for (let i = 0, m = Math.round(G.singles * n); i < m; i++) singles.push(make(pickWeighted(P.singles, rng)));
  singles.sort((a, b) => b.rad - a.rad);
  for (const pk of singles) {
    for (let t = 0; t < 30; t++) {
      const x = -pk.rad * 0.35 + rng() * (W + pk.rad * 0.7), y = -pk.rad * 0.35 + rng() * (H + pk.rad * 0.7);
      if (!fits(x, y, pk.rad)) continue;
      pk.x = x; pk.y = y; taken.push([x, y, pk.rad]);
      break;
    }
  }
  // drawn: the shade pooled under each cluster, the heroes (a bigger, softer shadow), then clusters and singles top down
  for (const cl of clusters) {
    const r = cl.r + 40, cy = cl.y + 12, gr = g.createRadialGradient(cl.x, cy, 0, cl.x, cy, r);
    gr.addColorStop(0, 'rgba(0,10,12,' + G.clusterShade + ')'); gr.addColorStop(1, 'rgba(0,10,12,0)');
    g.fillStyle = gr; g.fillRect(cl.x - r, cy - r, 2 * r, 2 * r);
  }
  for (const h of heroes) kitSprite(g, h.key, h.x, h.y, h.scale, h.rot, 2.2);
  const rest = clusters.concat(singles.filter(s => s.x !== null).map(s => ({ y: s.y, items: [s] })));
  rest.sort((a, b) => a.y - b.y);
  for (const r of rest) for (const pk of r.items) kitSprite(g, pk.key, pk.x, pk.y, pk.scale, pk.rot, 1);

  // 6b. the level file's hand-placed dressing (src/levelDress.js), on top of the scatter, under the grade
  drawDressing(g, def);

  // 7. colour grade (one soft-light wash: the zone's warm tint top left, its shade bottom right), then the vignette
  g.globalCompositeOperation = 'soft-light';
  const lg = g.createLinearGradient(W * 0.1, 0, W * 0.9, H);
  lg.addColorStop(0, Z.tint); lg.addColorStop(0.5, '#8a8272'); lg.addColorStop(1, Z.shade);
  g.globalAlpha = G.grade; g.fillStyle = lg; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  const v = g.createRadialGradient(W / 2, H * 0.48, Math.min(W, H) * 0.35, W / 2, H * 0.48, Math.hypot(W, H) * 0.58);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(5,12,16,' + G.vignette + ')');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  return c;
}

// ======================= pieces =======================
// A kit sprite centred on (x, y) (its visible centre), scaled and turned, with a soft shadow if `shadow` (a number
// makes the shadow that many times bigger, for the heroes). Canvas shadows ignore the transform, so they're scaled here.
export function kitSprite(g, key, x, y, scale, rot, shadow) {
  const [, , , cx, cy] = SPRITES[key], img = images[key];
  if (!img) return;
  g.save();
  if (shadow) {
    const t = g.getTransform(), px = Math.hypot(t.a, t.b), s = (shadow === true ? 1 : shadow) * px;
    g.shadowColor = s > px ? 'rgba(0,10,15,0.55)' : 'rgba(0,10,15,0.5)'; g.shadowBlur = 12 * s; g.shadowOffsetX = 3 * s; g.shadowOffsetY = 6 * s;
  }
  g.translate(x, y); g.rotate(rot); g.scale(scale, scale);
  g.drawImage(img, -cx, -cy);
  g.restore();
}
// A weighted pick from a list of entries ([key, weight, ...], or objects with their weight under `wk`).
function pickWeighted(list, rng, wk = 1) {
  if (!list.length) return null;
  let q = rng() * list.reduce((a, e) => a + e[wk], 0);
  for (const e of list) if ((q -= e[wk]) <= 0) return e;
  return list[list.length - 1];
}
function strokePath(g, P) { g.beginPath(); P.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
// The polyline shifted sideways by d (positive = to the right of the direction of travel).
function offsetPoly(P, d) {
  return P.map(([x, y], i) => {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
    return [x - ty / l * d, y + tx / l * d];
  });
}
// The road's polylines with a bounding box each; clear(x, y, d) = no road centreline point within d of (x, y).
function roadIndex(polys) {
  const boxes = polys.map(P => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of P) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return [x0, y0, x1, y1];
  });
  return {
    clear(x, y, d) {
      const d2 = d * d;
      for (let i = 0; i < polys.length; i++) {
        const [x0, y0, x1, y1] = boxes[i];
        if (x < x0 - d || x > x1 + d || y < y0 - d || y > y1 + d) continue;
        for (const [px, py] of polys[i]) if ((px - x) ** 2 + (py - y) ** 2 < d2) return false;
      }
      return true;
    },
  };
}
// A smooth wobble of amplitude a: two sine waves with seeded phases (a seam wandering a little off straight).
function wobble(rng, a) {
  const f1 = 1 / (90 + rng() * 80), f2 = 1 / (35 + rng() * 25), p1 = rng() * TAU, p2 = rng() * TAU;
  return t => a * (0.65 * Math.sin(t * f1 + p1) + 0.35 * Math.sin(t * f2 + p2));
}
// Denim quilt: columns of varied width, each cut into squares of varied height (rows don't line up across columns);
// every square is the denim at its own offset and quarter turn, a touch lighter or darker, and the seams wander a little.
function quilt(g, pickTex, W, H, rng, G) {
  const xs = [-40 - rng() * 60];
  while (xs[xs.length - 1] < W) xs.push(xs[xs.length - 1] + G.quiltCol[0] + rng() * (G.quiltCol[1] - G.quiltCol[0]));
  const vx = xs.map(x => { const w = wobble(rng, G.quiltJitter); return y => x + w(y); });
  const cols = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const ys = [-40 - rng() * 80];
    while (ys[ys.length - 1] < H) ys.push(ys[ys.length - 1] + G.quiltRow[0] + rng() * (G.quiltRow[1] - G.quiltRow[0]));
    cols.push(ys.map(y => { const w = wobble(rng, G.quiltJitter); return x => y + w(x); }));
  }
  const pats = new Map();                                                              // one pattern per tile, re-aimed per square
  const pts = (a, b, f) => { const out = [], m = Math.max(1, Math.ceil(Math.abs(b - a) / 30)); for (let s = 0; s <= m; s++) out.push(f(a + (b - a) * s / m)); return out; };
  cols.forEach((hy, i) => {
    const L = vx[i], R = vx[i + 1], x0 = xs[i], x1 = xs[i + 1];
    for (let r = 0; r < hy.length - 1; r++) {
      const T = hy[r], B = hy[r + 1], y0 = T((x0 + x1) / 2), y1 = B((x0 + x1) / 2);
      const poly = [...pts(x0, x1, x => [x, T(x)]), ...pts(y0, y1, y => [R(y), y]), ...pts(x1, x0, x => [x, B(x)]), ...pts(y1, y0, y => [L(y), y])];
      g.save(); g.beginPath(); poly.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip();
      const tex = pickTex(), p = pats.get(tex) || pats.set(tex, g.createPattern(tex, 'repeat')).get(tex);
      p.setTransform(new DOMMatrix().translate(rng() * 1024, rng() * 1024).rotate(Math.floor(rng() * 4) * 90));
      const t = rng(), bx = x0 - 20, by = y0 - 20, bw = x1 - x0 + 40, bh = y1 - y0 + 40;
      g.fillStyle = p; g.fillRect(bx, by, bw, bh);
      g.fillStyle = t < 0.55 ? 'rgba(0,25,35,' + (0.04 + t * 0.2) + ')' : 'rgba(170,230,235,' + ((t - 0.55) * 0.12) + ')';
      g.fillRect(bx, by, bw, bh);
      g.restore();
    }
  });
  for (let i = 1; i < vx.length - 1; i++) seam(g, pts(-20, H + 20, y => [vx[i](y), y]), true);
  cols.forEach((hy, i) => { for (let r = 1; r < hy.length - 1; r++) seam(g, pts(xs[i], xs[i + 1], x => [x, hy[r](x)]), false); });
}
// A seam along a polyline: a dark line with a pale running stitch beside it (right of a vertical one, below a horizontal).
function seam(g, P, vert) {
  g.setLineDash([]); g.lineWidth = 3; g.strokeStyle = 'rgba(0,18,24,0.45)';
  strokePath(g, P);
  g.setLineDash([9, 8]); g.lineWidth = 1.8; g.strokeStyle = 'rgba(225,220,195,0.38)';
  strokePath(g, P.map(([x, y]) => [x + (vert ? 7 : 0), y + (vert ? 0 : 7)]));
  g.setLineDash([]);
}
// A tiny canvas of seeded values, one texel per `cell` plate units (plus a border), smoothed up 8x, to be stretched over
// the plate with stretch(): soft low-frequency variation without touching the plate's own pixels. px(v) gives the
// [r, g, b, a] (0..255) for a value v in 0..1.
function noise(W, H, cell, rng, px) {
  const cw = Math.ceil(W / cell) + 2, ch = Math.ceil(H / cell) + 2, c = canvas(cw, ch), g = c.getContext('2d'), img = g.createImageData(cw, ch);
  for (let i = 0; i < cw * ch; i++) img.data.set(px(rng()).map(Math.round), i * 4);
  g.putImageData(img, 0, 0);
  const m = canvas(cw * 8, ch * 8), mg = m.getContext('2d');
  mg.imageSmoothingQuality = 'high'; mg.drawImage(c, 0, 0, cw * 8, ch * 8);
  return m;
}
const stretch = (g, m, W, H, cell) => g.drawImage(m, -cell, -cell, m.width / 8 * cell, m.height / 8 * cell);
const clamp01 = v => Math.max(0, Math.min(1, v));
const rgbOf = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
// A fabric patch with pinked (zigzag) edges cut from a kit fabric, a stitched border and a soft shadow.
function patch(g, cx, cy, w, h, rot, fabric) {
  g.save(); g.translate(cx, cy); g.rotate(rot);
  const p = new Path2D(), z = 9, t = g.getTransform(), px = Math.hypot(t.a, t.b);
  const edge = (x0, y0, x1, y1, nx, ny) => { const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / z)); for (let i = 1; i <= n; i++) { const t = i / n, k = i % 2 ? 5 : 0; p.lineTo(x0 + (x1 - x0) * t + nx * k, y0 + (y1 - y0) * t + ny * k); } };
  p.moveTo(-w / 2, -h / 2); edge(-w / 2, -h / 2, w / 2, -h / 2, 0, -1); edge(w / 2, -h / 2, w / 2, h / 2, 1, 0); edge(w / 2, h / 2, -w / 2, h / 2, 0, 1); edge(-w / 2, h / 2, -w / 2, -h / 2, -1, 0); p.closePath();
  g.save(); g.shadowColor = 'rgba(0,10,15,0.5)'; g.shadowBlur = 12 * px; g.shadowOffsetY = 5 * px; g.fillStyle = '#222'; g.fill(p); g.restore();
  fabric.setTransform(new DOMMatrix().scale(0.5));                                      // half size: checks that suit a scrap
  g.fillStyle = fabric; g.fill(p);
  g.setLineDash([10, 8]); g.lineWidth = 2; g.strokeStyle = 'rgba(240,228,200,0.7)';
  g.strokeRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24);
  g.setLineDash([]);
  g.restore();
}
