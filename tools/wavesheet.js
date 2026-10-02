// Every map level's waves and Thread supply at a glance. Dev tool, not deployed:
//
//   node tools/wavesheet.js
//
// Per level: waves, enemies (boss included; the Unstitcher's own Scrap swarms aren't), Thread with no critters squished
// (startThread + enemies x threadPerKill, every enemy killed) and with every critter squished (+ cap x the critter's
// Thread), the critters' share of that total, and the baseline the level had before critters (CONFIG.startThread +
// enemies x CONFIG.threadPerKill); then the level's Pin spots and what filling them all costs, and what is left over
// for in-level ranks (CONFIG.pinRanks: rank 2 costs costMult[1] x the Pin's build cost). The target: "all" ~ baseline
// + a rank or two, "none" about one cheap Pin short of that, critters 10-15%, and every level's "spare" covers at
// least one rank 2 with no critters squished.
// Needs Node 22+ (it imports the game's ES modules directly; they touch no DOM).
import { CONFIG as C } from '../src/config.js';
import { loadLevel, levelInfo } from '../src/levels/index.js';
// as src/critters.js critterCap (that module touches the DOM, so it isn't imported here)
const critterCap = lv => lv.critters ? (lv.critters.silverfish | 0) : (C.critters.perWorld[lv.world] | 0);

const ids = C.map.nodes.map(n => n[0]).filter(id => id !== C.tutLevel);
const costs = Object.values(C.towers).map(t => t.cost), cheapPin = Math.min(...costs), avgPin = Math.round(costs.reduce((s, x) => s + x, 0) / costs.length);
const rank2 = Math.round(avgPin * C.pinRanks.costMult[1]);
const pad = (v, n) => String(v).padStart(n);
console.log('level      world   waves enemies  /kill start |  none   all  baseline | critters  share  short | spots  fill  spare  ranks');
for (const [i, id] of ids.entries()) {
  const lv = loadLevel(id, 1), waves = lv.waves || C.waves;
  let n = 0;
  for (const w of waves) for (const [, count] of w) n += count;
  const perKill = lv.threadPerKill ?? C.threadPerKill, start = lv.startThread ?? C.startThread;
  const cap = critterCap(lv), bonus = cap * C.critters.silverfish.thread;
  const none = start + n * perKill, all = none + bonus, base = C.startThread + n * C.threadPerKill;
  const spots = (lv.spots || []).length, fill = spots * avgPin, spare = none - fill;
  console.log((i + 1 + ' ' + id).padEnd(10) + ' ' + levelInfo(id).world.padEnd(7) + pad(waves.length, 6) + pad(n, 8) + pad(perKill, 7) + pad(start, 6) +
    ' |' + pad(none, 6) + pad(all, 6) + pad(base, 10) + ' |' + pad(cap + ' x ' + C.critters.silverfish.thread, 9) +
    pad((bonus / all * 100).toFixed(0) + '%', 7) + pad(base - none, 7) + ' |' + pad(spots, 6) + pad(fill, 6) + pad(spare, 7) + pad(spare > 0 ? (spare / rank2).toFixed(1) : '-', 7));
}
console.log('\n"short" = baseline - none: what squishing no critters costs (the cheapest Pin is ' + cheapPin + ').');
console.log('"fill" = every spot built at the average Pin cost (' + avgPin + '); "spare" = none - fill; "ranks" = how many rank 2s (' + rank2 + ' each) that spare buys.');
