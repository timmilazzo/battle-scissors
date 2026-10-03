// Paints a generated level's plate (src/levelGen.js) from the art kit (src/kit.js, assets/kit/), in its zone's look
// (the level's `world`): the zone's ground (denim a quilt of irregular squares, the others the texture with soft
// shifted pieces over it so the tile doesn't repeat, plus big tone washes), fabric patches at the corners and edges,
// the ground features (a satin river that crosses the road once under a ruler bridge, ponds), the frame, a felt road
// with a soft contact shadow, a dark suede rim and a running stitch, the road kit (fences, edge strips, decals), the
// kit's Pin pads, heart-pad workshop (with its flag posts) and big fork buttons, then the zone's props in tiers (a few
// big heroes, on a bigger plate more heroes at the centres of the biggest pockets of ground between the roads, lanterns
// along the road in the dark world, beds and heaps of related props, a few singles, a fill pass and a carpet of tiny
// pieces over whatever ground is still bare; all clear of the road, pads and each other, and all drawn propScale x
// their kit scale, times size ^ propSizeGain on a bigger plate so they don't shrink to a pattern when the world zooms
// out), the glow under every lit thing, a colour grade and a vignette. Decoration uses its own seeded stream, so the same level
// always paints the same plate. Called by render.js and the level lab; imports nothing that needs the game's DOM.
//
// Missing art: a sprite or texture the kit doesn't have yet (kit.js: still `wanted`) is skipped, or drawn as its
// stand-in (kit.js STAND_IN: the meadow's pads, fence and tray for the round 5 worlds), and a zone whose ground tiles
// haven't arrived paints on its `standIn` zone's ground under its own colour grade and `standInWash`: stand-in until
// the sprites arrive. A file that fails to load is treated the same way (it never blocks a plate).
//
// What the painter hands back on the level def it painted (the object the game plays, so `level().x` reads it):
//   def.lights  [{ x, y, r }] in plate units: every light source on the plate (the lit props of kit.js LIGHTS, and in
//               a `roadLanterns` zone the lanterns it stands along the road, sprite or drawn stand-in). The night world
//               darkens the plate outside these (render.js). Set when the plate is painted (plateFor returns a canvas);
//               undefined before that, and on a painted (bg) plate.
//   def.deco    gains one { kind: 'river', x, y, r, ang, drawn, path, pond } entry for a river zone: where the river
//               crosses the road (the bridge's centre and radius, the road's direction there), whether it was drawn
//               (false while its sprites are missing: the layout is still made, so the level lab can check it), its
//               centreline, and the pond one half ends in ({ x, y, r } or null).
import { CONFIG as C } from './config.js';
import { makeRng } from '../vendor/mulberry32.js';
import { curve } from './levelGen.js';
import { KIT_DIR, SPRITES, TEXTURES, ZONES, ROAD_FELTS, artKey, texWanted, padKey, LIGHTS, CARPET_STAND_IN } from './kit.js';
import { drawDressing, loadDressing, dressingReady } from './levelDress.js';
import { drawRoadKit, roadKitKeys, drawHeartFlags } from './roadKit.js';
import { frameKeys, frameBase, frameHeroes } from './levelFrame.js';

const TAU = Math.PI * 2;
const zoneOf = def => ZONES[def.world] ? def.world : 'denim';

// ======================= kit loading =======================
// Images load on demand: the fixed pieces, the sewing props and the shared textures, plus the zone's own props and
// ground. loadKit(zone) resolves once they're decoded (or have failed: a missing file is left out); loadKit() loads every
// zone (the level lab).
const images = {}, loading = {};
function loadImage(key, file) {
  if (!loading[key]) loading[key] = new Promise(resolve => {
    const img = new Image();
    img.onload = () => { images[key] = key.startsWith('tex:') ? tileable(img) : img; resolve(); };
    img.onerror = () => { console.warn('levelArt: could not load ' + file); resolve(); };   // left out, never blocks a plate
    img.src = KIT_DIR + file;
  });
  return loading[key];
}
// (a texture the kit doesn't have yet is left out, so a zone still paints while art is being imported; a sprite key
// resolves to itself once delivered, else to its stand-in, else null)
const haveTex = names => names.filter(t => TEXTURES[t] && !texWanted(t));
// The zone whose ground tiles a zone paints with: its own once they've arrived, else its standIn zone's.
const groundZone = Z => (haveTex([Z.ground]).length || !Z.standIn ? Z : ZONES[Z.standIn]);
const RIVER_KEYS = c => ['river', 'riverBend'].map(k => k + (c === 'brown' ? 'Brown' : 'Blue')).concat('rulerBridge');
function neededFor(zone) {
  const z = ZONES[zone], gz = groundZone(z), keys = new Set([padKey(zone, 'Pin'), padKey(zone, 'Heart'), 'forkButton', ...roadKitKeys(z)]);
  const tex = new Set(['roadFelt', 'roadEdge', gz.ground, ...z.patches, ...haveTex(gz.grounds || []), ...haveTex(ROAD_FELTS)]);
  const fk = frameKeys(z); fk.keys.forEach(k => keys.add(k)); fk.tex.forEach(t => tex.add(t));
  const addKey = k => { const a = artKey(k); if (a) keys.add(a); };
  const add = list => { for (const e of list || []) addKey(e[0]); };
  const P = z.props;
  add(P.heroes); add(P.singles); add(P.fill); add(P.ponds); add(P.carpet);
  if (z.tray) add(CARPET_STAND_IN);
  for (const cl of P.clusters) { add(cl.members); add(cl.core); }
  if (z.river) RIVER_KEYS(z.river).forEach(addKey);
  if (z.roadLanterns) ['lanternLit1', 'lanternLit2'].forEach(addKey);
  for (const k in LIGHTS) addKey(LIGHTS[k].glow);
  return { keys, tex };
}
// A texture tile as a pattern source. Some kit tiles have a few fully transparent rows or columns at an edge (left over
// from cutting them out); those are cropped off and the rest mirror-tiled 2x2, which always repeats seamlessly.
function tileable(img) {
  const w = img.width, h = img.height, c = canvas(w, h), g = c.getContext('2d', { willReadFrequently: true });
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
// Resolves once the given SPRITES keys' images have loaded (for other modules that draw with kitSprite); a wanted key
// loads its stand-in, or nothing.
export function ensureSprites(keys) { return Promise.all(keys.map(artKey).filter(Boolean).map(key => loadImage(key, SPRITES[key][0]))); }
// The same for TEXTURES names (tiled and mirror-fixed like the painter's own).
export function ensureTextures(names) { return Promise.all(haveTex(names).map(t => loadImage('tex:' + t, TEXTURES[t]))); }
// A loaded sprite's image (its stand-in's for a wanted key) / a loaded texture's tile (undefined until loaded), for
// sibling modules that slice or tile them.
export const kitImage = key => images[artKey(key)];
export const kitTexture = name => images['tex:' + name];
// A props list with only the entries whose art has loaded, each under the key actually drawn.
function avail(list) {
  const out = [];
  for (const e of list || []) { const k = artKey(e[0]); if (k && images[k]) out.push(k === e[0] ? e : [k, ...e.slice(1)]); }
  return out;
}

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
  const G = C.levelGen, W = def.w, H = def.h, n = def.size || 1, k = 1 / n, rng = makeRng((def.seed | 0) ^ 0x6A09E6), sn = Math.sqrt(n);
  const layer = () => { const cc = canvas(W * k, H * k), gc = cc.getContext('2d'); gc.scale(k, k); return [cc, gc]; };
  const [c, g] = layer();
  const flat = img => { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(img, 0, 0); g.restore(); };
  const zone = zoneOf(def), Z = ZONES[zone], GZ = groundZone(Z), pat = t => g.createPattern(images['tex:' + t], 'repeat');
  if (def.deco) def.deco = def.deco.filter(d => d.kind !== 'river');                         // (a repaint lays it out again)
  const polys = def.paths.map(p => curve(p, 12)), road = roadIndex(polys);
  const roadOuter = G.roadHalf + G.roadBorder;
  const lerp = ([a, b]) => a + rng() * (b - a);
  // every prop inside the tray (heroes, clusters, singles, fill, carpet, ponds; not the frame, road kit, pads or heart)
  // is drawn ps x its kit scale: propScale on every plate, and n ^ propSizeGain more on a bigger one, so the props lose
  // less on screen when the world zooms out. Counts and spacing follow, so a bigger plate gets fewer, bigger things.
  const gain = n ** G.propSizeGain, ps = G.propScale * gain, many = n * n / (gain * gain);
  // (a zone still on a stand-in ground lays none of its props, only the stand-in carpet: the shared drawer junk alone
  // would fill it with screws; docs/worlds.md "stand-ins")
  const ZP = GZ === Z ? Z.props : { heroes: [], singles: [], clusters: [], ponds: [] };
  const P = { heroes: avail(ZP.heroes), singles: avail(ZP.singles), fill: ZP.fill ? avail(ZP.fill) : null, ponds: avail(ZP.ponds),
    clusters: ZP.clusters.map(cl => ({ ...cl, core: cl.core ? avail(cl.core) : null, members: avail(cl.members) })).filter(cl => cl.members.length || (cl.core && cl.core.length)) };
  for (const cl of P.clusters) if (cl.core && !cl.core.length) cl.core = null;
  P.carpet = avail(Z.props.carpet);
  if (!P.carpet.length && Z.tray) P.carpet = avail(CARPET_STAND_IN);                       // (stand-in until the zone's own arrive)

  // 1. ground. Denim is a quilt: irregular squares, each cut from the denim turned its own way, with seams; the other
  // zones get the texture again at other offsets (mirrored or turned) through soft blotchy masks, so the tile's repeat
  // can't be picked out. Then a low-frequency wash of the zone's tint and shade. A zone whose own tiles haven't arrived
  // lays its standIn zone's ground, then its standInWash over it, so the stand-in already reads as that world.
  // (the zone's extra ground tiles, once imported, take turns: the quilt's squares and the soft layers each pick one)
  const grounds = haveTex(GZ.grounds || [GZ.ground]).map(t => images['tex:' + t]).filter(Boolean), pickGround = () => grounds[Math.floor(rng() * grounds.length)];
  g.fillStyle = pat(GZ.ground); g.fillRect(0, 0, W, H);
  if (GZ.seams) quilt(g, pickGround, W, H, rng, G);
  else for (let i = 0; i < G.groundLayers && grounds.length; i++) {
    const [lc, lg] = layer(), p = lg.createPattern(pickGround(), 'repeat'), m = new DOMMatrix().translate(Math.round(rng() * 1024), Math.round(rng() * 1024));
    p.setTransform(GZ.groundTurn ? m.rotate(Math.floor(rng() * 4) * 90) : m.scale(-1, 1));
    lg.fillStyle = p; lg.fillRect(0, 0, W, H);
    lg.globalCompositeOperation = 'destination-in';
    stretch(lg, noise(W, H, G.groundCell, rng, v => [0, 0, 0, clamp01((v - 0.5) * 2.4 + 0.5) * 255]), W, H, G.groundCell);
    g.drawImage(lc, 0, 0, W, H);
  }
  if (GZ !== Z && Z.standInWash) {
    const [col, a, blend] = Z.standInWash;
    g.save(); g.globalCompositeOperation = blend; g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, 0, W, H); g.restore();
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
  for (let i = 0, m = Math.round((G.patches[zone] || 0) * n); i < m; i++) {
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

  // 2a. the river (zones with `river`): laid out whether or not its art is in (the level lab shows the crossing), drawn
  // before the frame so it runs on under the tray's wall, and before the road, which crosses it over the ruler bridge
  const river = Z.river ? riverLayout(def, polys, G, makeRng((def.seed | 0) ^ 0x51A7), !!Z.frame) : null;
  const riverOn = !!river && drawRiver(g, river, Z.river, G, makeRng((def.seed | 0) ^ 0x51A8));

  // 2b. the frame (src/levelFrame.js): compartment floor, rim walls with gaps where roads pass, corners, dividers
  // (a pad with a fence ring round it, roadKit.js, keeps the props and the carpet off its ring too)
  const ringed = !!(Z.roadKit && Z.roadKit.padRing && (artKey(zone + 'PinPad') === zone + 'PinPad' || C.roadKit.padRingOnStandIn));
  const padClear = ringed ? def.spotR * C.roadKit.padRingR + 26 : def.spotR + 6;
  const taken = def.spots.map(([x, y]) => [x, y, padClear]).concat([[def.heart[0], def.heart[1], def.workshopR + 6]], def.deco.map(d => [d.x, d.y, d.r + 10]));
  const fixed = taken.slice();                                                               // (what the carpet treats as solid)
  if (riverOn) {
    for (const [x, y] of river.samples) { taken.push([x, y, G.riverW / 2 + 8]); fixed.push([x, y, G.riverW / 2 + 4]); }
    for (const h of river.halves) if (h.pond) { taken.push([h.pond.x, h.pond.y, h.pond.r * 0.85]); fixed.push([h.pond.x, h.pond.y, h.pond.r * 0.8]); }
  }
  const env = { zone: Z, G, polys, roadOuter, road, taken };
  const frame = frameBase(g, def, env);

  // 2c. ponds (props.ponds): flat on the ground, clear of the road, the pads, the heart, the river and each other
  if (P.ponds.length && G.ponds[zone]) {
    for (let i = 0, m = Math.round(lerp([G.ponds[zone][0], G.ponds[zone][1] + 0.99]) * n); i < m; i++) {
      const e = pickWeighted(P.ponds, rng), scale = (e[2] + rng() * (e[3] - e[2])) * ps, rad = SPRITES[e[0]][5] * scale, rot = (rng() - 0.5) * 2 * e[4];
      for (let t = 0; t < G.pondTries; t++) {
        const x = rng() * W, y = rng() * H;
        if ((frame && !frame.inside(x, y, rad * 0.8)) || !road.clear(x, y, roadOuter + rad * 0.85 + G.pondClear)
          || taken.some(([tx, ty, tr]) => Math.hypot(x - tx, y - ty) < tr + rad * 0.85 + G.pondClear)) continue;
        kitSprite(g, e[0], x, y, scale, rot, 0);
        taken.push([x, y, rad * 0.85]); fixed.push([x, y, rad * 0.8]);
        break;
      }
    }
  }

  // 3. the fork buttons (a fork with a Pin pad inside gets the pad instead, in step 5)
  for (const d of def.deco) if (d.kind === 'button') kitSprite(g, 'forkButton', d.x, d.y, d.r / SPRITES.forkButton[5], 0, 1);

  // 4. road: a wide soft shadow on the ground, a tighter drop shadow, a dark suede rim, pale felt, then a running stitch
  // inside both edges (as all four tray references)
  const strokeAll = (width, style, gc = g) => {
    gc.lineWidth = width; gc.strokeStyle = style; gc.lineJoin = 'round'; gc.lineCap = 'round';
    for (const Pl of polys) strokePath(gc, Pl);
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
  for (const Pl of polys) for (const s of [-1, 1]) strokePath(qg, offsetPoly(Pl, s * (roadOuter + 20)));
  qg.setLineDash([]); qg.globalCompositeOperation = 'destination-out';
  strokeAll(2 * (roadOuter + 12), '#000', qg);
  flat(qline);
  strokeAll(2 * roadOuter, pat('roadEdge'));
  g.save(); g.globalAlpha = G.roadRimDark; strokeAll(2 * roadOuter, '#2a1405'); g.restore();   // the suede rim, darker
  strokeAll(2 * roadOuter - 2 * G.roadBorder + 4, 'rgba(50,26,10,0.85)');                     // dark seam between edge and felt
  const felts = haveTex(ROAD_FELTS), felt = pat(felts[Math.floor(rng() * felts.length)]);     // one of the road felt tiles, by seed
  strokeAll(2 * G.roadHalf, felt);
  g.save(); g.globalAlpha = 0.18; strokeAll(2 * G.roadHalf, '#6b4a2a'); g.restore();          // edges a touch darker...
  strokeAll(2 * G.roadHalf - 14, felt);                                                          // ...than the middle
  g.save(); g.globalAlpha = G.roadFeltWash; strokeAll(2 * G.roadHalf - 8, '#fff3dc'); g.restore();   // and the felt paler, as the refs
  const [st, sg] = layer();
  sg.setLineDash(G.stitchDash); sg.lineWidth = G.stitchW; sg.lineCap = 'round'; sg.strokeStyle = Z.stitch;
  for (const Pl of polys) for (const s of [-1, 1]) strokePath(sg, offsetPoly(Pl, s * (G.roadHalf - G.stitchInset)));
  sg.setLineDash([]); sg.globalCompositeOperation = 'destination-out';
  strokeAll(2 * (G.roadHalf - G.stitchInset - 6), '#000', sg);                                  // no stitches across another road
  flat(st);
  // the road kit (src/roadKit.js): fences or edge strips along the road (and rings round the pads), faint decals on the felt
  const rkEnv = { zone: Z, zoneName: zone, G, polys, roadOuter, roadHalf: G.roadHalf, road, spots: def.spots, spotR: def.spotR,
    heart: def.heart, workshopR: def.workshopR, entries: def.entries, layer, flat, river: riverOn ? river.cross : null };
  drawRoadKit(g, def, rkEnv);
  // the ruler bridge over the river crossing, laid along the road
  if (riverOn) kitSprite(g, 'rulerBridge', river.cross.x, river.cross.y, G.bridgeScale, river.cross.ang, 1);

  // 5. Pin pads, the heart pad (the meadow's while the zone's own haven't arrived), the heart pad's flag posts
  const pinKey = padKey(zone, 'Pin'), heartKey = padKey(zone, 'Heart');
  for (const [x, y] of def.spots) kitSprite(g, pinKey, x, y, def.spotR / SPRITES[pinKey][5] * 1.04, rng() * TAU, 1);
  kitSprite(g, heartKey, def.heart[0], def.heart[1], def.workshopR / SPRITES[heartKey][5] * 1.04, 0, 1);
  drawHeartFlags(g, def, rkEnv);

  // 5b. the frame's heroes, in its compartments (they replace the painter's own margin heroes below)
  taken.push(...frameHeroes(g, def, env, frame));

  // 6. props (src/kit.js), in tiers: a few big heroes, beds and heaps of related props, a few singles, a fill pass, the
  // carpet. Everything keeps clear of the road, the pads, the heart, the fork buttons and the other props.
  const gap = G.propGap;
  const fits = (x, y, rad, list = taken, share = 0.9, near = 0.92, wall = 1) => (!frame || frame.inside(x, y, rad * wall)) && road.clear(x, y, roadOuter + rad * near + gap) && !list.some(([tx, ty, tr]) => Math.hypot(x - tx, y - ty) < (tr + rad) * share + gap);
  const make = e => { const scale = (e[2] + rng() * (e[3] - e[2])) * ps; return { key: e[0], scale, rot: (rng() - 0.5) * 2 * e[4], rad: SPRITES[e[0]][5] * scale, x: null, y: 0 }; };
  // heroes: alternating sides, each where it's clear, farthest from the other heroes and mostly on the plate. A tray world
  // gets 3 to 4 (its big trees), which may lean in over the wall (heroWall); other framed plates fewer (heroFramedShare).
  const heroes = [], xL = G.xMin * n, xR = W - (G.w - G.xMax) * n, used = new Set();
  const heroCount = Z.tray && frame ? Math.floor(lerp([G.heroesTray[0], G.heroesTray[1] + 0.99]) * sn)
    : Math.floor(lerp([G.heroes[0], G.heroes[1] + 0.99]) * sn * (frame ? G.heroFramedShare : 1));
  const heroWall = Z.tray ? G.heroWall : 1;
  let side = rng() < 0.5 ? 0 : 1;
  for (let i = 0; i < heroCount; i++, side ^= 1) {
    const e = pickWeighted(P.heroes.filter(h => !used.has(h[0])), rng) || pickWeighted(P.heroes, rng);
    if (!e) break;
    const pk = make(e);
    for (let shrink = 0; shrink < 4 && pk.x === null; shrink++) {
      if (shrink) { pk.scale *= G.heroShrink; pk.rad *= G.heroShrink; }
      let best = -Infinity;
      for (let t = 0; t < G.heroTries; t++) {
        // most tries in this hero's side margin, some in the other one, some anywhere (a big open stretch of ground)
        const s = (t & 3) === 3 ? side ^ 1 : side, open = (t & 7) === 6, x = open ? rng() * W : s ? xR + rng() * (W - xR) : rng() * xL, y = rng() * H;
        if (!fits(x, y, pk.rad, taken, 1, 0.85, heroWall)) continue;
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
  // heroes between the roads (a plate of size >= midHeroFrom): the biggest pockets of open ground in the road band, each
  // filled at its centre by a hero of another kind (see midHeroes())
  if (n >= G.midHeroFrom && P.heroes.length) for (const pk of midHeroes(def, P.heroes, polys, road, roadOuter, frame, taken, G, rng, make, ps)) { heroes.push(pk); taken.push([pk.x, pk.y, pk.rad]); }
  // lanterns along the road (a roadLanterns zone): every lanternEvery along each route, sides taking turns, beside the
  // fence; the lit sprite once it's in, a small drawn lantern with its glow until then
  const lanterns = Z.roadLanterns ? roadLanterns(def, polys, road, G, roadOuter, frame, taken, rng) : [];
  // clusters: a centre far from the other clusters and heroes, a core piece there, members packed around it
  const clusters = [], centres = heroes.map(h => [h.x, h.y]);
  // (a bigger plate gets more clusters, each spread out as much as its pieces are scaled up, rather than n^2 as many:
  // it's shown zoomed out)
  for (let i = 0, m = P.clusters.length ? Math.round(G.clusters * many) : 0; i < m; i++) {
    const kind = pickWeighted(P.clusters, rng, 'w'), spread = kind.spread * ps, cands = [];
    for (let t = 0; t < G.clusterTries * 3 && cands.length < G.clusterTries; t++) {
      const x = -20 + rng() * (W + 40), y = -20 + rng() * (H + 40);
      if ((!frame || frame.inside(x, y, spread * 0.3)) && road.clear(x, y, roadOuter + spread * 0.3 + gap) && !taken.some(([tx, ty, tr]) => Math.hypot(x - tx, y - ty) < tr + spread * 0.25)) cands.push([x, y]);
    }
    // the candidates farthest from the other clusters and heroes first; the first that holds enough of its pieces wins
    const far = ([x, y]) => centres.reduce((d, [px, py]) => Math.min(d, Math.hypot(px - x, py - y)), 1e9);
    cands.sort((p, q) => far(q) - far(p));
    for (const [cx, cy] of cands.slice(0, G.clusterAttempts)) {
      const own = [], items = [], count = kind.members.length ? Math.floor(lerp([kind.n[0], kind.n[1] + 0.99])) : 0;
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
      if (items.length + (core ? 1 : 0) < Math.max(count ? 2 : 1, Math.ceil(count * G.clusterFill))) continue;
      taken.push(...own); centres.push([cx, cy]);
      items.sort((p, q) => p.y - q.y);
      clusters.push({ x: cx, y: cy, r: spread, items: core ? [core, ...items] : items });
      break;
    }
  }
  // singles: anywhere clear, biggest first
  const singles = [];
  for (let i = 0, m = P.singles.length ? Math.round(G.singles * many) : 0; i < m; i++) singles.push(make(pickWeighted(P.singles, rng)));
  singles.sort((a, b) => b.rad - a.rad);
  for (const pk of singles) {
    for (let t = 0; t < 30; t++) {
      const x = -pk.rad * 0.35 + rng() * (W + pk.rad * 0.7), y = -pk.rad * 0.35 + rng() * (H + pk.rad * 0.7);
      if (!fits(x, y, pk.rad)) continue;
      pk.x = x; pk.y = y; taken.push([x, y, pk.rad]);
      break;
    }
  }
  // fill: a jittered sweep over the plate packs small props (any cluster's members, the singles) into ground still bare,
  // so no stretch of plain tile shows. Fill props may crowd each other a little, as the painted plates' bushes do.
  const fillers = [], fillPool = P.fill || P.clusters.flatMap(cl => cl.members).concat(P.singles), own = [];
  // fill props may tuck up to the fences and lean over the tray wall a little, as on the painted plates
  const fillFits = (x, y, rad) => (!frame || frame.inside(x, y, rad * G.fillWall)) && road.clear(x, y, roadOuter + rad * G.fillNearRoad + gap) && !taken.some(([tx, ty, tr]) => Math.hypot(x - tx, y - ty) < (tr + rad) * 0.9 + gap);
  const fillCount = fillPool.length ? Math.round(G.fillTries * many) : 0, cells = Math.max(1, Math.ceil(Math.sqrt(fillCount * W / H))), cw = W / cells;
  for (let i = 0; i < fillCount; i++) {
    const x = (i % cells + rng()) * cw, y = (Math.floor(i / cells) + rng()) * cw;
    if (y > H + 20) break;
    const pk = make(pickWeighted(fillPool, rng));
    if (!fillFits(x, y, pk.rad) || !fits(x, y, pk.rad, own, G.fillPack)) continue;
    pk.x = x; pk.y = y; fillers.push(pk); own.push([x, y, pk.rad]);
  }
  taken.push(...own);
  const placed = heroes.concat(fillers, singles.filter(s => s.x !== null), lanterns, ...clusters.map(cl => cl.items));
  // carpet: the tiniest pieces, packed into every bit of ground still bare (see carpet())
  const carpetItems = P.carpet.length ? carpet(def, P.carpet, polys, roadOuter, frame, fixed, placed, taken.slice(fixed.length), G, rng, make, ps) : [];

  // lights: every lit prop (kit.js LIGHTS) and the road lanterns, for the dark world (def.lights, see the header)
  const lights = [];
  for (const pk of placed) {
    const L = pk.light || LIGHTS[pk.key];
    if (L) lights.push({ x: pk.x, y: pk.y, r: pk.light ? pk.light.r : L.r * pk.rad * G.lightScale, glow: L.glow });
  }
  for (const d of (def.dressing || [])) {
    const L = LIGHTS[d.key], key = artKey(d.key);
    if (L && key) lights.push({ x: d.x, y: d.y, r: L.r * SPRITES[key][5] * (d.s ?? 0.5) * G.lightScale, glow: L.glow });
  }

  // drawn: the carpet (under everything, no shadows), the contact shade under every prop, the shade pooled under each
  // cluster, the glow under every lit thing, the heroes (a bigger, softer shadow), then clusters, singles, fill and
  // lanterns top down
  for (const pk of carpetItems) kitSprite(g, pk.key, pk.x, pk.y, pk.scale, pk.rot, 0);
  // contact shade: a tight dark pool right under every prop, so they sit in the ground rather than on it
  for (const pk of placed) {
    const r = pk.rad * 0.95, cy = pk.y + pk.rad * 0.18, gr = g.createRadialGradient(pk.x, cy, 0, pk.x, cy, r);
    gr.addColorStop(0, 'rgba(0,10,12,' + G.contactAO + ')'); gr.addColorStop(1, 'rgba(0,10,12,0)');
    g.fillStyle = gr; g.fillRect(pk.x - r, cy - r, 2 * r, 2 * r);
  }
  for (const cl of clusters) {
    const r = cl.r + 40 * ps, cy = cl.y + 12 * ps, gr = g.createRadialGradient(cl.x, cy, 0, cl.x, cy, r);
    gr.addColorStop(0, 'rgba(0,10,12,' + G.clusterShade + ')'); gr.addColorStop(1, 'rgba(0,10,12,0)');
    g.fillStyle = gr; g.fillRect(cl.x - r, cy - r, 2 * r, 2 * r);
  }
  drawGlows(g, lights, G);
  // (shadows grow with the size gain, so a bigger plate's bigger props cast as much shadow on screen)
  for (const h of heroes) kitSprite(g, h.key, h.x, h.y, h.scale, h.rot, 2.2 * gain);
  const rest = clusters.concat(singles.concat(fillers, lanterns).filter(s => s.x !== null).map(s => ({ y: s.y, items: [s] })));
  rest.sort((a, b) => a.y - b.y);
  for (const r of rest) for (const pk of r.items) { if (pk.draw) pk.draw(g); else kitSprite(g, pk.key, pk.x, pk.y, pk.scale, pk.rot, pk.light ? 1 : gain); }   // (a road lantern isn't scaled)

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

  // handed back on the def the game plays (see the header): the light sources for the dark world, the river crossing
  def.lights = lights.map(({ x, y, r }) => ({ x, y, r }));
  if (river) def.deco.push({ kind: 'river', x: river.cross.x, y: river.cross.y, r: river.cross.r, ang: river.cross.ang, drawn: riverOn, path: river.samples,
    pond: (river.halves.find(h => h.pond) || {}).pond || null });
  return c;
}

// ======================= carpet =======================
// Bare ground is found on a grid (CONFIG.levelGen.carpetCell): every cell under the road (with room for a piece), a
// pad, the heart, a fork button, the river, a pond or outside the tray wall is solid, every placed prop covers the cells
// out to carpetCover of its radius; then the free cells, in a seeded shuffle, each take one tiny piece (a little off
// the cell's centre), which covers carpetSpace of its radius for the next. Fast enough for the thousands a big plate takes.
function carpet(def, pool, polys, roadOuter, frame, fixed, placed, others, G, rng, make, ps) {
  // (make() already scales each piece by ps, the painter's prop scale; the cells grow with it)
  const W = def.w, H = def.h, cs = G.carpetCell * ps, gw = Math.ceil(W / cs) + 1, gh = Math.ceil(H / cs) + 1, grid = new Uint8Array(gw * gh);
  const maxR = pool.reduce((m, e) => Math.max(m, SPRITES[e[0]][5] * e[3]), 0) * ps;
  const stamp = (x, y, r) => {
    const i0 = Math.max(0, Math.floor((x - r) / cs)), i1 = Math.min(gw - 1, Math.floor((x + r) / cs)), j0 = Math.max(0, Math.floor((y - r) / cs)), j1 = Math.min(gh - 1, Math.floor((y + r) / cs)), r2 = r * r;
    for (let j = j0; j <= j1; j++) { const dy = (j + 0.5) * cs - y; for (let i = i0; i <= i1; i++) { const dx = (i + 0.5) * cs - x; if (dx * dx + dy * dy <= r2) grid[j * gw + i] = 1; } }
  };
  for (const P of polys) for (const [x, y] of P) stamp(x, y, roadOuter + G.carpetRoad + maxR * 0.7);
  for (const [x, y, r] of fixed) stamp(x, y, r + maxR * 0.6);
  for (const pk of placed) if (pk.x !== null) stamp(pk.x, pk.y, pk.rad * G.carpetCover);
  for (const [x, y, r] of others) stamp(x, y, r * G.carpetCover);                         // (frame heroes)
  const free = [];
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
    if (grid[j * gw + i]) continue;
    const x = (i + 0.5) * cs, y = (j + 0.5) * cs;
    if (frame && !frame.inside(x, y, G.carpetWall + maxR * 0.5)) { grid[j * gw + i] = 1; continue; }
    free.push(j * gw + i);
  }
  for (let a = free.length - 1; a > 0; a--) { const b = Math.floor(rng() * (a + 1)); const t = free[a]; free[a] = free[b]; free[b] = t; }
  const out = [];
  for (const idx of free) {
    if (grid[idx]) continue;
    const pk = make(pickWeighted(pool, rng));
    pk.x = ((idx % gw) + 0.2 + rng() * 0.6) * cs; pk.y = (Math.floor(idx / gw) + 0.2 + rng() * 0.6) * cs;
    stamp(pk.x, pk.y, Math.max(cs * 0.5, pk.rad * G.carpetSpace));
    out.push(pk);
  }
  out.sort((p, q) => p.y - q.y);
  return out;
}

// ======================= heroes between the roads =======================
// On a bigger plate the open ground between and beside the roads reads as texture once the world zooms out, so its
// biggest pockets each get a hero, at the pocket's centre. The plate is rasterised (CONFIG.levelGen.midHeroCell) with
// everything solid stamped in: the road out to midHeroClear past its edge (clear of the fence), and every entry of
// `taken` (pads with their rings, the heart, fork buttons, the river, ponds, the frame's and the margins' heroes) plus
// propGap; outside the tray wall counts as solid too. A chamfer distance transform then gives every free cell its
// clearance. The deepest cell in the road band (the pads' band up and down, so the HUD and the action bar don't hide
// it) is the biggest pocket's centre; a hero of a family not used here yet (trees, then a big junk piece, ...) is fitted
// there at the hero tier's scale, shrunk to no less than midHeroMin of it in a tight pocket, checked exactly against
// the road, `taken` and the wall, and stamped out with midHeroSpace round it so the next one goes to another pocket.
// Returns the placed props (make() records), up to midHeroes of them.
const heroFamily = k => k.replace(/\d+$/, '').replace(/(Big|Small|Large|Red|Gold|Orange|Green|Blue|Yellow|Teal|[LMS])$/, '');
function midHeroes(def, pool, polys, road, roadOuter, frame, taken, G, rng, make, ps) {
  const W = def.w, H = def.h, n = def.size || 1, cs = G.midHeroCell, gw = Math.ceil(W / cs), gh = Math.ceil(H / cs);
  const d = new Float32Array(gw * gh).fill(1e9);
  const stamp = (x, y, r) => {
    const i0 = Math.max(0, Math.floor((x - r) / cs)), i1 = Math.min(gw - 1, Math.floor((x + r) / cs)), j0 = Math.max(0, Math.floor((y - r) / cs)), j1 = Math.min(gh - 1, Math.floor((y + r) / cs)), r2 = r * r;
    for (let j = j0; j <= j1; j++) { const dy = (j + 0.5) * cs - y; for (let i = i0; i <= i1; i++) { const dx = (i + 0.5) * cs - x; if (dx * dx + dy * dy <= r2) d[j * gw + i] = 0; } }
  };
  const roadR = roadOuter + G.midHeroClear;
  for (const Pl of polys) for (let i = 0; i < Pl.length; i++) {
    stamp(Pl[i][0], Pl[i][1], roadR);
    if (i) { const [ax, ay] = Pl[i - 1], [bx, by] = Pl[i], m = Math.floor(Math.hypot(bx - ax, by - ay) / cs); for (let k = 1; k < m; k++) stamp(ax + (bx - ax) * k / m, ay + (by - ay) * k / m, roadR); }
  }
  for (const [x, y, r] of taken) stamp(x, y, r + G.propGap);
  if (frame) for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) if (!frame.inside((i + 0.5) * cs, (j + 0.5) * cs, 0)) d[j * gw + i] = 0;
  // two chamfer passes (straight steps cs, diagonal ones cs * sqrt 2): run again after new stamps, the values only drop
  const a = cs, b = cs * Math.SQRT2;
  const transform = () => {
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const o = j * gw + i; let v = d[o];
      if (!v) continue;
      if (i) v = Math.min(v, d[o - 1] + a);
      if (j) { v = Math.min(v, d[o - gw] + a); if (i) v = Math.min(v, d[o - gw - 1] + b); if (i < gw - 1) v = Math.min(v, d[o - gw + 1] + b); }
      d[o] = v;
    }
    for (let j = gh - 1; j >= 0; j--) for (let i = gw - 1; i >= 0; i--) {
      const o = j * gw + i; let v = d[o];
      if (!v) continue;
      if (i < gw - 1) v = Math.min(v, d[o + 1] + a);
      if (j < gh - 1) { v = Math.min(v, d[o + gw] + a); if (i < gw - 1) v = Math.min(v, d[o + gw + 1] + b); if (i) v = Math.min(v, d[o + gw - 1] + b); }
      d[o] = v;
    }
  };
  transform();
  const xa = G.xMin * n, xb = W - (G.w - G.xMax) * n, ya = G.spotYMin * n, yb = G.spotYMax * n;
  const out = [], fams = new Set(), want = Math.floor(G.midHeroes[0] + rng() * (G.midHeroes[1] - G.midHeroes[0] + 0.99));
  const smallest = pool.reduce((m, e) => Math.min(m, SPRITES[e[0]][5] * e[2]), 1e9) * ps * G.midHeroMin;
  for (let tries = 0; out.length < want && tries < want * 4; tries++) {
    // the deepest free cell in the band: its clearance (to the nearest solid cell's edge, and the plate's edge)
    let best = 0, bx = 0, by = 0;
    for (let j = Math.floor(ya / cs); j <= Math.min(gh - 1, Math.floor(yb / cs)); j++) for (let i = Math.floor(xa / cs); i <= Math.min(gw - 1, Math.floor(xb / cs)); i++) {
      const x = (i + 0.5) * cs, y = (j + 0.5) * cs, c = Math.min(d[j * gw + i] - cs / 2, x, W - x, y, H - y);
      if (c > best) { best = c; bx = x; by = y; }
    }
    if (best < smallest) break;
    // a hero of a family not used here yet, the first that fits the pocket; failing that, another sprite of a used one
    let cands = pool.filter(e => !fams.has(heroFamily(e[0]))), later = pool.filter(e => fams.has(heroFamily(e[0])) && !out.some(o => o.key === e[0]));
    let pk = null;
    while (!pk && (cands.length || later.length)) {
      if (!cands.length) { cands = later; later = []; }
      const e = pickWeighted(cands, rng), p = make(e), floor = p.scale * G.midHeroMin * 0.9;   // (a tenth under, for the raster's error)
      cands = cands.filter(q => q !== e);
      if (p.rad > best) { const s = best / p.rad; if (s < G.midHeroMin) continue; p.scale *= s; p.rad = best; }
      while (p.scale >= floor) {
        if (road.clear(bx, by, roadOuter + p.rad + G.midHeroClear) && (!frame || frame.inside(bx, by, p.rad))
          && !taken.some(([tx, ty, tr]) => Math.hypot(bx - tx, by - ty) < tr + p.rad + G.propGap)
          && !out.some(o => Math.hypot(bx - o.x, by - o.y) < o.rad + p.rad + G.midHeroSpace)) { p.x = bx; p.y = by; pk = p; break; }
        p.scale *= 0.92; p.rad *= 0.92;                                                   // (the raster is coarse: a touch smaller)
      }
    }
    if (!pk) { stamp(bx, by, cs * 2); transform(); continue; }                            // nothing fits here: try the next pocket
    out.push(pk); fams.add(heroFamily(pk.key));
    stamp(pk.x, pk.y, pk.rad + G.midHeroSpace); transform();
  }
  return out;
}

// ======================= river =======================
// The satin river crosses the road once, on a straight stretch: from the crossing it runs out both ways, square to the
// road (or, where the road runs mostly up and down, straight across the plate, up to riverSkew off square), each half
// either straight on to the plate's edge or out riverLeg and round a 90 degree bend to the edge, so it never comes near
// the road again, a pad (with its fence ring), the heart pad or a fork button. Every point along the routes that suits
// a bridge is a candidate (in a seeded order, riverTries of them); the best layout wins (halves leaving by the sides
// score best: the top has the HUD and the entrances, the bottom the heart). Returns { cross: { x, y, ang, r }, halves:
// [{ pts, corner, din, dout, turn }], samples } or null if nothing fits. samples = the centreline every ~40 plate units
// (for props to keep clear and the level lab). The road and the blockers are rasterised first, so a walk is cheap.
function riverLayout(def, polys, G, rng, framed) {
  const W = def.w, H = def.h, n = def.size || 1, half = G.riverW / 2, roadOuter = G.roadHalf + G.roadBorder, step = 10;
  const exempt = roadOuter + half + G.riverClear;
  // the raster: bit 1 = too near a road, bit 2 = too near a pad, the heart or a fork button
  const cs = 8, gw = Math.ceil(W / cs) + 1, gh = Math.ceil(H / cs) + 1, grid = new Uint8Array(gw * gh);
  const stamp = (x, y, r, bit) => {
    const i0 = Math.max(0, Math.floor((x - r) / cs)), i1 = Math.min(gw - 1, Math.floor((x + r) / cs)), j0 = Math.max(0, Math.floor((y - r) / cs)), j1 = Math.min(gh - 1, Math.floor((y + r) / cs)), r2 = r * r;
    for (let j = j0; j <= j1; j++) { const dy = (j + 0.5) * cs - y; for (let i = i0; i <= i1; i++) { const dx = (i + 0.5) * cs - x; if (dx * dx + dy * dy <= r2) grid[j * gw + i] |= bit; } }
  };
  for (const Pl of polys) for (let i = 0; i < Pl.length; i++) {
    stamp(Pl[i][0], Pl[i][1], exempt, 1);
    if (i) { const [ax, ay] = Pl[i - 1], [bx, by] = Pl[i], m = Math.floor(Math.hypot(bx - ax, by - ay) / cs); for (let k = 1; k < m; k++) stamp(ax + (bx - ax) * k / m, ay + (by - ay) * k / m, exempt, 1); }
  }
  const ringR = def.spotR * C.roadKit.padRingR + 14;
  for (const [x, y] of def.spots) stamp(x, y, ringR + half + G.riverClear, 2);
  stamp(def.heart[0], def.heart[1], def.workshopR * 1.1 + half + G.riverClear, 2);
  for (const d of def.deco || []) if (d.kind === 'button') stamp(d.x, d.y, d.r + half + G.riverClear, 2);
  const at = (x, y) => { const i = Math.floor(x / cs), j = Math.floor(y / cs); return i < 0 || j < 0 || i >= gw || j >= gh ? 0 : grid[j * gw + i]; };
  // where the river is out of sight: past the plate's edge, or (a framed plate) under the tray's compartment floor
  const F = framed ? C.levelFrame : null, bx0 = F ? F.inset * n : -half, bx1 = F ? W - F.inset * n : W + half, by0 = F ? F.top * n : -half, by1 = F ? H - F.bottom * n : H + half;
  const gone = (x, y) => x < bx0 || y < by0 || x > bx1 || y > by1;
  const pr = SPRITES.pond1[5] * G.riverPond;                                          // the pond a half may end in
  // (the raster is grown by the river's half width, so the pond's disc less that much must miss it: then the whole pond
  // keeps riverClear off the road and the blockers)
  const pondFits = (x, y) => {
    const q = Math.max(0, pr - half);
    if (at(x, y) || gone(x - pr * 0.7, y - pr * 0.7) || gone(x + pr * 0.7, y + pr * 0.7)) return false;
    for (let a = 0; a < 16; a++) if (at(x + Math.cos(a * TAU / 16) * q, y + Math.sin(a * TAU / 16) * q) || at(x + Math.cos(a * TAU / 16) * q / 2, y + Math.sin(a * TAU / 16) * q / 2)) return false;
    return true;
  };
  // one half from (cx, cy) along (dx, dy): straight on out of sight (turn 0), a right / left turn (+1 / -1) after `leg`,
  // or straight into a pond (turn 2) once clear of the road. It may be on the road it starts from only at first: once
  // clear of every road it must stay clear, and it must get clear within 2.5 x exempt, however slanted the crossing.
  const walk = (cx, cy, dx, dy, leg, turn) => {
    const pts = [], din = [dx, dy];
    let x = cx, y = cy, t = 0, corner = null, out = false;
    while (t < 6000) {
      if (gone(x, y)) break;
      if (turn === 2 && out && t >= exempt) {
        const px = x + dx * pr * 0.6, py = y + dy * pr * 0.6;
        if (!pondFits(px, py)) return null;
        pts.push([x, y]);
        return { pts, corner, din, dout: [dx, dy], turn, len: t, pond: { x: px, y: py, r: pr }, score: -100 - t * 0.15 };
      }
      const v = at(x, y);
      if (t > 0 && v & 2) return null;
      if (!(v & 1)) out = true;
      else if (out || t > 2.5 * exempt) return null;
      pts.push([x, y]);
      if ((turn === 1 || turn === -1) && !corner && t >= leg) { if (!out) return null; corner = [x, y]; [dx, dy] = turn > 0 ? [-dy, dx] : [dy, -dx]; }
      x += dx * step; y += dy * step; t += step;
    }
    if (t >= 6000) return null;
    if (turn === 2) return null;
    const side = x < bx0 || x > bx1;                                                   // left by a side
    return { pts, corner, din, dout: [dx, dy], turn, len: t, score: (side ? 400 : y > H / 2 ? -300 : 0) - t * 0.15 + (turn ? 0 : 60) };
  };
  // candidates: every 30 plate units along each route, in the play area (not on a side road), clear of the blockers,
  // where the road runs straight for the bridge
  const span = half + 40, cands = [];
  for (const Pl of polys) {
    const s = [0];
    for (let i = 1; i < Pl.length; i++) s.push(s[i - 1] + Math.hypot(Pl[i][0] - Pl[i - 1][0], Pl[i][1] - Pl[i - 1][1]));
    const atS = a => { let i = 1; while (i < s.length - 1 && s[i] < a) i++; const f = (a - s[i - 1]) / ((s[i] - s[i - 1]) || 1); return [Pl[i - 1][0] + (Pl[i][0] - Pl[i - 1][0]) * f, Pl[i - 1][1] + (Pl[i][1] - Pl[i - 1][1]) * f, Math.atan2(Pl[i][1] - Pl[i - 1][1], Pl[i][0] - Pl[i - 1][0])]; };
    for (let a = span; a < s[s.length - 1] - span; a += 30) {
      const [x, y, ang] = atS(a), a0 = atS(a - span)[2], a1 = atS(a + span)[2];
      if (y < H * G.riverBand[0] || y > H * G.riverBand[1] || x < G.xMin * n || x > W - (G.w - G.xMax) * n || at(x, y) & 2) continue;
      if (Math.abs(Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0))) > G.riverStraight) continue;
      cands.push([x, y, ang]);
    }
  }
  for (let i = cands.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [cands[i], cands[j]] = [cands[j], cands[i]]; }
  let best = null;
  for (const [x, y, ang] of cands.slice(0, G.riverTries)) {
    const nx = -Math.sin(ang), ny = Math.cos(ang), leg = Math.max(G.riverLeg[0] + rng() * (G.riverLeg[1] - G.riverLeg[0]), exempt + half);
    const dirs = [[nx, ny, true]];
    if (Math.acos(Math.min(1, Math.abs(nx))) < G.riverSkew) dirs.push([Math.sign(nx), 0, false]);
    for (const [dx, dy, square] of dirs) {
      // per half the best way out of sight and the pond; at most one half may end in the pond
      const opts = [1, -1].map(sg => {
        let pick = null;
        for (const turn of [0, 1, -1]) { const h = walk(x, y, sg * dx, sg * dy, leg, turn); if (h && (!pick || h.score > pick.score)) pick = h; }
        return [pick, walk(x, y, sg * dx, sg * dy, leg, 2)];
      });
      const combos = [[opts[0][0], opts[1][0]], [opts[0][0], opts[1][1]], [opts[0][1], opts[1][0]]].filter(([a, b]) => a && b);
      if (!combos.length) continue;
      const halves = combos.reduce((m, c) => (c[0].score + c[1].score > m[0].score + m[1].score ? c : m));
      const score = halves[0].score + halves[1].score + (square ? 120 : 0) + rng() * 40;
      if (!best || score > best.score) best = { score, halves, cross: { x, y, ang, r: SPRITES.rulerBridge[5] * G.bridgeScale } };
    }
  }
  if (!best) return null;
  const samples = [];
  for (const h of best.halves) h.pts.forEach((p, i) => { if (i % 4 === 0) samples.push(p); });
  best.samples = samples;
  return best;
}
// Draws the river: each straight stretch the strip art tiled along it, each bend the elbow art, turned (and mirrored for
// a left turn) to join them, and a half that ends in a pond the pond laid over its end. The strip is scaled so its
// height is riverW, and laid with its rounded ends trimmed (riverTrim) and overlapping, as it doesn't tile seamlessly.
// The bend art joins its left edge to its bottom edge; its corner, where the two centrelines meet, is at riverBendCorner
// (shares of its canvas), and it's drawn riverBendScale x the strip's scale (its ribbon is narrower than the strip's).
// Returns false (and draws nothing) while the art a layout needs isn't in.
function drawRiver(g, rv, colour, G, rng) {
  const [sKey, bKey] = RIVER_KEYS(colour).map(artKey), simg = sKey && images[sKey], bimg = bKey && images[bKey];
  const ponds = ['pond1', 'pond2', 'pond3'].map(artKey).filter(k => k && images[k]);
  if (!simg || (rv.halves.some(h => h.corner) && !bimg) || (rv.halves.some(h => h.pond) && !ponds.length)) return false;
  const s = G.riverW / simg.height, sb = s * G.riverBendScale, [fx, fy] = G.riverBendCorner;   // art px -> plate units
  const armIn = bimg ? bimg.width * fx * sb : 0, armOut = bimg ? bimg.height * (1 - fy) * sb : 0;
  const sx0 = simg.width * G.riverTrim, sw = simg.width - 2 * sx0, tw = sw * s, th = simg.height * s, lap = tw * 0.06;
  const ribbon = (ax, ay, bx, by) => {
    const len = Math.hypot(bx - ax, by - ay);
    g.save(); g.translate(ax, ay); g.rotate(Math.atan2(by - ay, bx - ax));
    for (let x = -lap; x < len; x += tw - lap) { const w = Math.min(tw, len + lap - x); g.drawImage(simg, sx0, 0, w / s, simg.height, x, -th / 2, w, th); }
    g.restore();
  };
  for (const h of rv.halves) {
    const [x0, y0] = h.pts[0], [xe, ye] = h.pts[h.pts.length - 1], end = h.pond ? [h.pond.x, h.pond.y] : [xe + h.dout[0] * G.riverW, ye + h.dout[1] * G.riverW];
    if (h.pond) {
      ribbon(x0, y0, end[0], end[1]);
      const key = ponds[Math.floor(rng() * ponds.length)];
      kitSprite(g, key, h.pond.x, h.pond.y, h.pond.r / SPRITES[key][5], Math.atan2(h.dout[1], h.dout[0]) + (rng() - 0.5) * 0.6, 0);
      continue;
    }
    if (!h.corner) { ribbon(x0, y0, end[0], end[1]); continue; }
    const [cx, cy] = h.corner;
    ribbon(x0, y0, cx - h.din[0] * armIn, cy - h.din[1] * armIn);
    ribbon(cx + h.dout[0] * armOut, cy + h.dout[1] * armOut, end[0], end[1]);
    g.save(); g.translate(cx, cy); g.rotate(Math.atan2(h.din[1], h.din[0])); if (h.turn < 0) g.scale(1, -1);
    g.drawImage(bimg, -bimg.width * fx * sb, -bimg.height * fy * sb, bimg.width * sb, bimg.height * sb);
    g.restore();
  }
  return true;
}

// ======================= light =======================
// Lanterns along the road, for a roadLanterns zone: every lanternEvery along each route (one where routes share the
// road), sides taking turns, lanternOff past the road's edge, clear of the pads, the heart, the entrances, other roads and
// the props already placed. Each is a prop the painter draws (the lit sprite, or drawStandInLantern) carrying its light.
function roadLanterns(def, polys, road, G, roadOuter, frame, taken, rng) {
  const out = [], d = roadOuter + G.lanternOff, keys = ['lanternLit1', 'lanternLit2'].map(artKey).filter(k => k && images[k]);
  const sizeR = 22;                                                                     // a lantern's footprint (plate units)
  let side = rng() < 0.5 ? 1 : -1;
  for (const Pl of polys) {
    let acc = G.lanternEvery * (0.35 + rng() * 0.3);
    for (let i = 1; i < Pl.length; i++) {
      const [ax, ay] = Pl[i - 1], [bx, by] = Pl[i], l = Math.hypot(bx - ax, by - ay);
      acc -= l;
      if (acc > 0) continue;
      if (Pl[i][1] < C.roadKit.entryClear || ay < 0) { acc = 0; continue; }
      const tx = (bx - ax) / (l || 1), ty = (by - ay) / (l || 1);
      for (const sg of [side, -side]) {
        const x = bx - ty * sg * d, y = by + tx * sg * d;
        if (x < 30 || x > def.w - 30 || (frame && !frame.inside(x, y, sizeR)) || !road.clear(x, y, d - 6)
          || taken.some(([qx, qy, qr]) => Math.hypot(x - qx, y - qy) < qr + sizeR)
          || out.some(o => Math.hypot(o.x - x, o.y - y) < G.lanternEvery * 0.6)) continue;
        const key = keys.length ? keys[Math.floor(rng() * keys.length)] : null;
        const pk = { key, x, y, scale: G.lanternScale, rot: 0, rad: sizeR, light: { r: G.lanternLight, glow: 'lanternGlow' } };
        if (!key) pk.draw = gc => drawStandInLantern(gc, x, y);
        out.push(pk); taken.push([x, y, sizeR]);
        side = -sg;
        break;
      }
      acc = G.lanternEvery;
    }
  }
  return out;
}
// A lantern drawn until its sprite arrives: a little brass box seen from above with a lit core (the glow is drawn
// under it with the others).
function drawStandInLantern(g, x, y) {
  g.save();
  g.fillStyle = 'rgba(0,8,12,0.45)'; g.beginPath(); g.ellipse(x + 3, y + 6, 15, 12, 0, 0, TAU); g.fill();
  g.fillStyle = '#5a3a14'; g.beginPath(); g.roundRect(x - 13, y - 13, 26, 26, 6); g.fill();
  g.fillStyle = '#c99a3e'; g.beginPath(); g.roundRect(x - 11, y - 11, 22, 22, 5); g.fill();
  const core = g.createRadialGradient(x, y, 0, x, y, 10);
  core.addColorStop(0, '#fffbe0'); core.addColorStop(0.5, '#ffd36a'); core.addColorStop(1, '#e08a1e');
  g.fillStyle = core; g.beginPath(); g.roundRect(x - 7, y - 7, 14, 14, 3); g.fill();
  g.fillStyle = '#3a2408'; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill();
  g.restore();
}
// The glow under every lit thing, additive: its glow sprite (lanternGlow / windowGlow) once delivered, a soft warm
// radial gradient until then; reaching glowShare of the light's radius.
function drawGlows(g, lights, G) {
  if (!lights.length) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const L of lights) {
    const r = L.r * G.glowShare, key = L.glow && artKey(L.glow), img = key && images[key];
    if (img) {
      g.globalAlpha = G.glowAlpha;
      const sc = r / SPRITES[key][5];
      g.drawImage(img, L.x - SPRITES[key][3] * sc, L.y - SPRITES[key][4] * sc, img.width * sc, img.height * sc);
    } else {
      g.globalAlpha = 1;
      const gr = g.createRadialGradient(L.x, L.y, 0, L.x, L.y, r);
      gr.addColorStop(0, 'rgba(255,196,96,' + G.glowAlpha + ')'); gr.addColorStop(0.45, 'rgba(255,150,50,' + G.glowAlpha * 0.4 + ')'); gr.addColorStop(1, 'rgba(255,120,30,0)');
      g.fillStyle = gr; g.fillRect(L.x - r, L.y - r, 2 * r, 2 * r);
    }
  }
  g.restore();
}

// ======================= pieces =======================
// A kit sprite centred on (x, y) (its visible centre), scaled and turned, with a soft shadow if `shadow` (a number
// makes the shadow that many times bigger, for the heroes). Canvas shadows ignore the transform, so they're scaled here.
// A wanted key draws its stand-in, or nothing.
export function kitSprite(g, key, x, y, scale, rot, shadow) {
  const k = artKey(key), img = k && images[k];
  if (!img) return;
  const [, , , cx, cy] = SPRITES[k];
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
  if (!list || !list.length) return null;
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
