// The level registry: every level's data file (in map order: level 0, then the five worlds' ten levels each, then
// Random Quilt) and loadLevel(id, seed), the one way the game gets a level to play. Only this module imports the level files.
//
// Files: 00-first.js (level 0, the tutorial, on world 1's map), w<world>-<nn>-<id>.js for the fifty map levels (w1-01-meadow.js
// .. w5-10-whip.js; world 1 The Sewing Tray, 2 The Mending Pile, 3 The Kitchen Drawer, 4 The Bedside Drawer, 5 The Holiday
// Box; docs/worlds.md has what each level introduces), random.js (Random Quilt, off the map). A level's place on the map
// (world, number) comes from CONFIG.map.worlds (meta.js levelPlace), not from the file name; LIST just keeps the same order.
// Ids never change once shipped (saves key on them), so an old id can sit in a new place under a new name.
//
// A level file exports one object. Either a painted level: { id, name, blurb, bg, w, h, paths, spots, spotR,
// roadHalfWidth, workshopR } (the plate art and its measurements, in the plate's pixels), or a generated one:
// { id, name, blurb, recipe, seed } (src/levelGen.js builds it, src/levelArt.js paints it), or { random: true } (a new
// recipe from each run's seed). Plus the shared fields every file has: world, allowedPins, startThread, threadPerKill,
// critters ({ silverfish: cap }, null = CONFIG.critters.perWorld), critterIntro, waves,
// weapon, unlockOnClear, signText, starRules (see w1-01-meadow.js for what each means; null = the CONFIG default).
//
// loadLevel returns the level as played, the same shape either way: { id, name, blurb, world, gen, bg | (painted by
// levelArt), w, h, paths, spots, spotR, roadHalfWidth, workshopR, allowedPins, startThread, waves, unlockOnClear,
// signText, starRules } (+ recipe, seed, heart, deco, warnings, and the file's `dressing` if any, for a generated one).
import { CONFIG as C } from '../config.js';
import { buildLevel, randomRecipe } from '../levelGen.js';
import { randomZone, ZONES } from '../kit.js';
import first from './00-first.js';
// world 1: The Sewing Tray
import meadow from './w1-01-meadow.js';
import clover from './w1-02-clover.js';
import hem from './w1-03-hem.js';
import tack from './w1-04-tack.js';
import bobbin from './w1-05-bobbin.js';
import double from './w1-06-double.js';
import blanket from './w1-07-blanket.js';
import gather from './w1-08-gather.js';
import backstitch from './w1-09-backstitch.js';
import running from './w1-10-running.js';
// world 2: The Mending Pile
import fork from './w2-01-fork.js';
import loop from './w2-02-loop.js';
import rivet from './w2-03-rivet.js';
import pocket from './w2-04-pocket.js';
import zipper from './w2-05-zipper.js';
import cross from './w2-06-cross.js';
import patchwork from './w2-07-patchwork.js';
import bias from './w2-08-bias.js';
import seam from './w2-09-seam.js';
import hemline from './w2-10-hemline.js';
// world 3: The Kitchen Drawer
import leafpile from './w3-01-leafpile.js';
import corkscrew from './w3-02-corkscrew.js';
import ruler from './w3-03-ruler.js';
import pinecone from './w3-04-pinecone.js';
import honeydipper from './w3-05-honeydipper.js';
import toadstool from './w3-06-toadstool.js';
import harvest from './w3-07-harvest.js';
import pumpkin from './w3-08-pumpkin.js';
import bonfire from './w3-09-bonfire.js';
import twine from './w3-10-twine.js';
// world 4: The Bedside Drawer
import lanternlane from './w4-01-lanternlane.js';
import keyring from './w4-02-keyring.js';
import marble from './w4-03-marble.js';
import selvage from './w4-04-selvage.js';
import bottlecap from './w4-05-bottlecap.js';
import pencil from './w4-06-pencil.js';
import clothespin from './w4-07-clothespin.js';
import cookiecutter from './w4-08-cookiecutter.js';
import moonlight from './w4-09-moonlight.js';
import skeletonkey from './w4-10-skeletonkey.js';
// world 5: The Holiday Box
import firstsnow from './w5-01-firstsnow.js';
import candlelight from './w5-02-candlelight.js';
import sledrun from './w5-03-sledrun.js';
import icicle from './w5-04-icicle.js';
import snowglobe from './w5-05-snowglobe.js';
import lair from './w5-06-lair.js';
import tinsel from './w5-07-tinsel.js';
import cabin from './w5-08-cabin.js';
import blizzard from './w5-09-blizzard.js';
import whip from './w5-10-whip.js';
import random from './random.js';

const LIST = [
  first,
  meadow, clover, hem, tack, bobbin, double, blanket, gather, backstitch, running,
  fork, loop, rivet, pocket, zipper, cross, patchwork, bias, seam, hemline,
  leafpile, corkscrew, ruler, pinecone, honeydipper, toadstool, harvest, pumpkin, bonfire, twine,
  lanternlane, keyring, marble, selvage, bottlecap, pencil, clothespin, cookiecutter, moonlight, skeletonkey,
  firstsnow, candlelight, sledrun, icicle, snowglobe, lair, tinsel, cabin, blizzard, whip,
  random,
];
const byId = {};
for (const l of LIST) byId[l.id] = l;

const SHARED = { world: 'meadow', endless: false, weapon: null, allowedPins: null, startThread: null, threadPerKill: null, critters: null, critterIntro: false, waves: null, unlockOnClear: null, signText: '', starRules: { noDamage: true, noSpecial: true } };
const shared = f => { const o = {}; for (const k in SHARED) o[k] = f[k] !== undefined ? f[k] : SHARED[k]; return o; };

export const hasLevel = id => !!byId[id];
export const levelIds = () => Object.keys(byId);
// What the menus need without building anything: { id, name, blurb, world, random, weapon (null = the equipped one) }.
export function levelInfo(id) {
  const f = byId[id];
  return f ? { id, name: f.name, blurb: f.blurb, world: f.world || SHARED.world, random: !!f.random, endless: !!f.endless, weapon: f.weapon || null } : null;
}
// The level whose first clear unlocks weapon `id` (its unlockOnClear.scissors), or ''.
export function rewardLevelOf(id) {
  for (const l of LIST) if (l.unlockOnClear && l.unlockOnClear.scissors === id) return l.id;
  return '';
}

// ?recipe= in the URL: a temporary "Custom Road" level (the level lab's "Play it").
export function addCustomLevel(recipe, seed, world) {
  byId.custom = { id: 'custom', name: 'Custom Road', blurb: recipe, recipe, seed, world: ZONES[world] ? world : 'denim' };   // ?world= picks the zone's look
}

// id -> the level to play. Painted levels are loaded once; generated ones are built and cached per recipe + seed;
// a random level gets a fresh recipe for `seed` (the run's seed), and a draw that comes out cramped (road too close to
// itself, too few pads) is redrawn from a derived seed, so a given run seed still always gives the same level.
const cache = new Map();
export function loadLevel(id, seed) {
  const f = byId[id] || byId[C.defaultLevel];
  const key = f.id + '|' + (f.random ? seed : f.recipe + '|' + (f.seed ?? 1));
  if (cache.has(key)) return cache.get(key);
  if (cache.size > 24) cache.clear();
  let lv;
  if (!f.recipe && !f.random) lv = { ...f, gen: false };
  else {
    if (f.random) {
      for (let k = 0; k < 6; k++) {
        const s = (seed + k * 7919) >>> 0;
        lv = buildLevel(randomRecipe(s, f.size), s, f);
        if (!lv.warnings.length && lv.spots.length >= C.levelGen.spotsMin) break;
      }
    } else lv = buildLevel(f.recipe, f.seed ?? 1, f);
    if (lv.warnings.length) console.warn('levelGen "' + lv.recipe + '" seed ' + lv.seed + ':', lv.warnings.join('; '));
  }
  Object.assign(lv, { id: f.id, name: f.name, blurb: f.blurb }, shared(f));
  if (f.recipe && f.dressing) lv.dressing = f.dressing;   // hand-placed sprites (src/levelDress.js), in plate units
  if (f.recipe && f.bg) lv.bg = f.bg;                     // a painted-over plate (docs/paint-over.md): drawn instead of the generated one
  if (f.random) lv.world = randomZone(seed);   // a random road in a random zone's look (any zone whose art is in, kit.js)
  cache.set(key, lv);
  return lv;
}
