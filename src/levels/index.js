// The level registry: every level's data file (in level-map order, then Random Quilt) and loadLevel(id, seed), the one
// way the game gets a level to play. Only this module imports the level files.
//
// A level file exports one object. Either a painted level: { id, name, blurb, bg, w, h, paths, spots, spotR,
// roadHalfWidth, workshopR } (the plate art and its measurements, in the plate's pixels), or a generated one:
// { id, name, blurb, recipe, seed } (src/levelGen.js builds it, src/levelArt.js paints it), or { random: true } (a new
// recipe from each run's seed). Plus the shared fields every file has: world, allowedPins, startThread, threadPerKill,
// critters ({ silverfish: cap }, null = CONFIG.critters.perWorld), critterIntro, waves,
// weapon, unlockOnClear, signText, starRules (see 01-meadow.js for what each means; null = the CONFIG default).
//
// loadLevel returns the level as played, the same shape either way: { id, name, blurb, world, gen, bg | (painted by
// levelArt), w, h, paths, spots, spotR, roadHalfWidth, workshopR, allowedPins, startThread, waves, unlockOnClear,
// signText, starRules } (+ recipe, seed, heart, deco, warnings, and the file's `dressing` if any, for a generated one).
import { CONFIG as C } from '../config.js';
import { buildLevel, randomRecipe } from '../levelGen.js';
import first from './00-first.js';
import meadow from './01-meadow.js';
import fork from './02-fork.js';
import hem from './03-hem.js';
import running from './04-running.js';
import double from './05-double.js';
import blanket from './06-blanket.js';
import loop from './07-loop.js';
import hemline from './08-hemline.js';
import cross from './09-cross.js';
import bias from './10-bias.js';
import selvage from './11-selvage.js';
import whip from './12-whip.js';
import lair from './13-lair.js';
import random from './random.js';

const LIST = [first, meadow, fork, hem, running, double, blanket, loop, hemline, cross, bias, selvage, whip, lair, random];
const byId = {};
for (const l of LIST) byId[l.id] = l;

const SHARED = { world: 'meadow', weapon: null, allowedPins: null, startThread: null, threadPerKill: null, critters: null, critterIntro: false, waves: null, unlockOnClear: null, signText: '', starRules: { noDamage: true, noSpecial: true } };
const shared = f => { const o = {}; for (const k in SHARED) o[k] = f[k] !== undefined ? f[k] : SHARED[k]; return o; };

export const hasLevel = id => !!byId[id];
export const levelIds = () => Object.keys(byId);
// What the menus need without building anything: { id, name, blurb, world, random, weapon (null = the equipped one) }.
export function levelInfo(id) {
  const f = byId[id];
  return f ? { id, name: f.name, blurb: f.blurb, world: f.world || SHARED.world, random: !!f.random, weapon: f.weapon || null } : null;
}
// The level whose first clear unlocks weapon `id` (its unlockOnClear.scissors), or ''.
export function rewardLevelOf(id) {
  for (const l of LIST) if (l.unlockOnClear && l.unlockOnClear.scissors === id) return l.id;
  return '';
}

// ?recipe= in the URL: a temporary "Custom Road" level (the level lab's "Play it").
export function addCustomLevel(recipe, seed) {
  byId.custom = { id: 'custom', name: 'Custom Road', blurb: recipe, recipe, seed, world: 'denim' };
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
        lv = buildLevel(randomRecipe(s), s, f);
        if (!lv.warnings.length && lv.spots.length >= C.levelGen.spotsMin) break;
      }
    } else lv = buildLevel(f.recipe, f.seed ?? 1, f);
    if (lv.warnings.length) console.warn('levelGen "' + lv.recipe + '" seed ' + lv.seed + ':', lv.warnings.join('; '));
  }
  Object.assign(lv, { id: f.id, name: f.name, blurb: f.blurb }, shared(f));
  if (f.recipe && f.dressing) lv.dressing = f.dressing;   // hand-placed sprites (src/levelDress.js), in plate units
  if (f.random) lv.world = ['meadow', 'denim', 'lair'][(seed >>> 0) % 3];   // a random road in a random zone's look
  cache.set(key, lv);
  return lv;
}
