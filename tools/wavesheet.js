// Every map level's waves, Thread supply and enemy hp at a glance. Dev tool, not deployed:
//
//   node tools/wavesheet.js
//
// Per level, in map order (world by world; "w-n" is its place, as the map numbers it): waves, enemies (bosses and mini
// bosses included; the Unstitcher's Scrap swarms, the Bobbin's dropped Scraps and the Zipper's teeth aren't), Thread with
// no critters squished (startThread + enemies x threadPerKill, every enemy killed) and with every critter squished (+ cap
// x the critter's Thread), the critters' share of that total, and the baseline the level had before critters
// (CONFIG.startThread + enemies x CONFIG.threadPerKill); then the level's Pin spots and what filling them all costs, and
// what is left over for in-level ranks (CONFIG.pinRanks: rank 2 costs costMult[1] x the Pin's build cost). The target:
// "all" ~ baseline + a rank or two, "none" about one cheap Pin short of that, critters 10-15%, and every level's
// "spare" covers at least one rank 2 with no critters squished. Last, the hp multiplier a type with levelHp 1 (Bolster,
// Brute, Burr) has on the level's first and last regular wave: 1 + hpPerWave x (wave - 1) + levelHp x (hpPerWorld x
// (world - 1) + hpPerLevel x (n - 1)) (docs/worlds.md "Difficulty"; ranks come on top).
// An enemy key CONFIG.enemyTypes doesn't know is reported, not fatal (the level still counts it).
// Needs Node 22+ (it imports the game's ES modules directly; they touch no DOM).
import { CONFIG as C } from '../src/config.js';
import { loadLevel, levelInfo, levelIds } from '../src/levels/index.js';
// as src/critters.js critterCap (that module touches the DOM, so it isn't imported here)
const critterCap = lv => lv.critters ? (lv.critters.silverfish | 0) : ((C.critters.perWorld || {})[lv.world] | 0);

// The map in play order, each level with its world (1..5) and number in it (as meta.js levelPlace; that module reads the
// save, so it isn't imported here). Falls back to the level files' order, ten a world, if CONFIG.map has no worlds.
function places() {
  const out = [];
  if (C.map && Array.isArray(C.map.worlds)) {
    C.map.worlds.forEach((w, wi) => {
      let n = 0;
      for (const nd of w.nodes) { if (nd[0] === C.tutLevel) continue; out.push({ id: nd[0], world: wi + 1, n: ++n }); }
    });
  } else {
    const ids = levelIds().filter(id => id !== C.tutLevel && !levelInfo(id).random && id !== 'custom');
    ids.forEach((id, i) => out.push({ id, world: Math.floor(i / 10) + 1, n: i % 10 + 1 }));
  }
  return out;
}

const hpPerWorld = C.hpPerWorld ?? 0, hpPerLevel = C.hpPerLevel ?? 0;
const hpMult = (world, n, wave) => 1 + C.hpPerWave * (wave - 1) + (hpPerWorld * (world - 1) + hpPerLevel * (n - 1));
const isBoss = t => !!(C.enemyTypes[t] && C.enemyTypes[t].boss);

const costs = Object.values(C.towers).map(t => t.cost), cheapPin = Math.min(...costs), avgPin = Math.round(costs.reduce((s, x) => s + x, 0) / costs.length);
const rank2 = Math.round(avgPin * C.pinRanks.costMult[1]);
const pad = (v, n) => String(v).padStart(n);
const unknown = new Map();
console.log('w-n  level        world   waves enemies  /kill start |  none   all  baseline | critters  share  short | spots  fill  spare  ranks |  hp x');
let lastWorld = 0;
for (const { id, world, n: num } of places()) {
  if (!levelInfo(id)) { console.log(world + '-' + num + '  ' + id + ': no level file'); continue; }
  if (world !== lastWorld && lastWorld) console.log('');
  lastWorld = world;
  const lv = loadLevel(id, 1), waves = lv.waves || C.waves;
  let n = 0, regular = 0;
  waves.forEach(w => {
    let boss = true;
    for (const [type, count] of w) {
      n += count;
      if (!C.enemyTypes[type]) { if (!unknown.has(type)) unknown.set(type, []); unknown.get(type).push(id); }
      if (!isBoss(type)) boss = false;
    }
    if (!boss) regular++;
  });
  const perKill = lv.threadPerKill ?? C.threadPerKill, start = lv.startThread ?? C.startThread;
  const cap = critterCap(lv), bonus = cap * C.critters.silverfish.thread;
  const none = start + n * perKill, all = none + bonus, base = C.startThread + n * C.threadPerKill;
  const spots = (lv.spots || []).length, fill = spots * avgPin, spare = none - fill;
  const hp = hpMult(world, num, 1).toFixed(2) + '-' + hpMult(world, num, regular).toFixed(2);
  console.log((world + '-' + num).padEnd(5) + id.padEnd(12) + ' ' + String(levelInfo(id).world).padEnd(7) + pad(waves.length, 6) + pad(n, 8) + pad(perKill, 7) + pad(start, 6) +
    ' |' + pad(none, 6) + pad(all, 6) + pad(base, 10) + ' |' + pad(cap + ' x ' + C.critters.silverfish.thread, 9) +
    pad((bonus / all * 100).toFixed(0) + '%', 7) + pad(base - none, 7) + ' |' + pad(spots, 6) + pad(fill, 6) + pad(spare, 7) + pad(spare > 0 ? (spare / rank2).toFixed(1) : '-', 7) +
    ' | ' + hp);
}
console.log('\n"short" = baseline - none: what squishing no critters costs (the cheapest Pin is ' + cheapPin + ').');
console.log('"fill" = every spot built at the average Pin cost (' + avgPin + '); "spare" = none - fill; "ranks" = how many rank 2s (' + rank2 + ' each) that spare buys.');
console.log('"hp x" = the hp multiplier for levelHp 1 on the first and last regular wave (hpPerWorld ' + hpPerWorld + ', hpPerLevel ' + hpPerLevel + ', hpPerWave ' + C.hpPerWave + ').');
for (const [type, ids] of unknown) console.log('WARNING: enemy type "' + type + '" is not in CONFIG.enemyTypes (used by ' + [...new Set(ids)].join(', ') + ')');
