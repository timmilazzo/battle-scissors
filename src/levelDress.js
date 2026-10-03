// Hand-placed dressing for generated levels: kit sprites a level file pins at exact spots, painted over the seeded
// scatter (src/levelArt.js paints the plate, then calls drawDressing). Placed by eye in the level lab's Dress mode
// (tools/level-lab.html), which writes the JSON to paste into the level file. No DOM besides Image.
//
// Schema, in a generated level file (src/levels/*.js with a `recipe`; loadLevel passes it through to the level def):
//   dressing: [{ key, x, y, s, rot }, ...]
//     key  a sprite key of src/kit.js SPRITES (e.g. 'spoolRed', 'treeL')
//     x, y where its visible centre (SPRITES[key][3], [4]) goes, in the level's plate units: the same space as its
//          `spots` and `paths`, i.e. after the recipe's `size` multiplication
//     s    scale against the sprite file (delivered at 2x), so 0.5 = the size it was drawn for on the plate
//     rot  turn in radians (clockwise, about the visible centre)
// Drawn in list order (later ones on top), each with the same soft shadow as the scattered props (levelArt's
// kitSprite: blur 12, offset 3,6 in plate units). A key whose art is still wanted (src/kit.js) draws its stand-in, or is
// skipped until the file arrives.
import { KIT_DIR, SPRITES, artKey } from './kit.js';

const images = {}, loading = {}, settled = {};
function loadSprite(key) {
  if (!loading[key]) loading[key] = new Promise(resolve => {
    const img = new Image();
    img.onload = () => { images[key] = img; settled[key] = true; resolve(); };
    img.onerror = () => { console.warn('levelDress: could not load sprite ' + key); settled[key] = true; resolve(); };   // missing art never blocks the plate
    img.src = KIT_DIR + SPRITES[key][0];
  });
  return loading[key];
}

// The sprite keys a level's dressing draws (each once, stand-ins resolved; unknown and not-yet-delivered keys left out).
export function dressingKeys(def) {
  const keys = new Set();
  for (const d of (def && def.dressing) || []) { const k = artKey(d.key); if (k) keys.add(k); }
  return [...keys];
}

// Loads those sprites' images; resolves once every one has loaded or failed.
export function loadDressing(def) {
  return Promise.all(dressingKeys(def).map(loadSprite));
}

// True once every sprite the level's dressing uses has loaded (or failed), so a plate painted now has all of it.
export function dressingReady(def) {
  return dressingKeys(def).every(k => settled[k]);
}

// Draws each placement on g, in plate units (the painter's own transform handles a bigger level's 1 / size scale).
// Placements whose image hasn't loaded yet are skipped.
export function drawDressing(g, def) {
  for (const d of (def && def.dressing) || []) {
    const key = artKey(d.key), S = key && SPRITES[key], img = key && images[key];
    if (!S || !img) continue;
    const s = d.s ?? 0.5, t = g.getTransform(), px = Math.hypot(t.a, t.b);   // canvas shadows ignore the transform,
    g.save();                                                                 // so they're scaled to plate units here
    g.shadowColor = 'rgba(0,10,15,0.5)'; g.shadowBlur = 12 * px; g.shadowOffsetX = 3 * px; g.shadowOffsetY = 6 * px;
    g.translate(d.x, d.y); g.rotate(d.rot || 0); g.scale(s, s);
    g.drawImage(img, -S[3], -S[4]);
    g.restore();
  }
}
