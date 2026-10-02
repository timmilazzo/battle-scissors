// The Buttons economy (the meta currency) at a glance: the one-time supply, the wage per win, and what it all buys.
// Dev tool, not deployed:
//
//   node tools/buttonsupply.js
//
// One-time supply = stars (every star of every Button-earning level, first time only) + achievements
// (src/achievements.js) + world chests. On top of that every win pays the wage: floor(score / scorePerButton), capped
// per level at scoreCapBase + scoreCapPerLevel x the level number (src/meta.js scoreCap), replays included, and Random
// Quilt pays it as level hpOffMapLevel. So income never runs out; the tool prints how many replay wins the whole tree
// takes. It then estimates what a full playthrough averaging 2.2 stars per level earns.
// Needs Node 22+ (it imports the game's ES modules directly; they touch no DOM).
import { CONFIG as C } from '../src/config.js';
import { ACHIEVEMENTS } from '../src/achievements.js';
import { levelInfo, loadLevel } from '../src/levels/index.js';

const M = C.meta;
const levels = C.map.nodes.map(n => n[0]).filter(id => id !== C.tutLevel);   // as meta.js earningLevels()
const worlds = [...new Set(levels.map(id => levelInfo(id).world))];
const sum = a => a.reduce((s, x) => s + x, 0);
const levelNum = id => { const i = C.map.nodes.findIndex(n => n[0] === id); return i >= 0 ? i : C.hpOffMapLevel; };   // as meta.js mapLevelNum
const cap = id => M.scoreCapBase + M.scoreCapPerLevel * levelNum(id);                                             // as meta.js scoreCap

const perLevelStars = sum(M.starButtons);
const stars = levels.length * perLevelStars;
const achievements = sum(ACHIEVEMENTS.map(a => a.reward));
const chests = worlds.filter(w => M.worlds[w]).length * M.chestButtons;
const supply = stars + achievements + chests;

const upgrades = Object.keys(C.weapons).length * sum(M.upgradeCosts);
const pinTiers = Object.keys(C.towers).length * sum(M.pinTierCosts);
const shred = sum(M.shredCosts);
const cosmetics = sum(Object.values(M.cosmetics).map(c => c.price || 0));
const shopScissors = sum(Object.values(C.weapons).map(w => w.shop || 0));
const tree = upgrades + pinTiers + shred + shopScissors + cosmetics;

console.log('One-time Button supply (' + levels.length + ' levels, ' + worlds.length + ' worlds, ' + ACHIEVEMENTS.length + ' achievements)');
console.log('  stars         ' + String(stars).padStart(5) + '  (' + levels.length + ' x ' + perLevelStars + ')');
console.log('  achievements  ' + String(achievements).padStart(5));
console.log('  world chests  ' + String(chests).padStart(5));
console.log('  TOTAL         ' + String(supply).padStart(5));
console.log('');
console.log('The wage, per win (floor(score / ' + M.scorePerButton + '), capped by level): L1 ' + cap(levels[0]) + ' .. L' + levels.length + ' ' + cap(levels[levels.length - 1]) +
  ', Random Quilt ' + cap('random') + '. Replays pay it every time.');
console.log('');
console.log('Spending: scissors upgrades ' + upgrades + ' (' + Object.keys(C.weapons).length + ' x ' + sum(M.upgradeCosts) + '), Pin tiers ' + pinTiers +
  ' (' + Object.keys(C.towers).length + ' x ' + sum(M.pinTierCosts) + '), SHRED tiers ' + shred + ', Shop scissors ' + shopScissors + ', cosmetics ' + cosmetics +
  ' = ' + tree + '; Sharpen ' + M.sharpenCost + ' a time');

// A full playthrough averaging 2.2 stars per level: 40% of levels three-starred, 40% two, 20% one. Three-starring
// is spread evenly, so a world's chest and its "three-star a world" achievement only come if a whole world is
// three-starred; at 40% we assume none is. Every level clears, so both world-clear and L12 achievements pay.
// The wage: the full-kill score of each level's waves (no multi-snip bonus), floor(/100), capped, once per level.
const byStars = { 3: 0.4, 2: 0.4, 1: 0.2 };
const starPay = n => sum(M.starButtons.slice(0, n));
const avgStarPay = sum(Object.entries(byStars).map(([n, f]) => f * starPay(+n)));
const levelScore = id => {
  let s = 0;
  for (const w of loadLevel(id, 1).waves || C.waves) for (const [type, count] of w) s += C.enemyTypes[type].score * count;
  return s;
};
const wageOf = id => Math.min(cap(id), Math.floor(levelScore(id) / M.scorePerButton));
const wagePay = sum(levels.map(wageOf));
const likely = ACHIEVEMENTS.filter(a => !a.id.startsWith('stars-') && !['snip10', 'cigar-beetle', 'pruner-bite'].includes(a.id));
const achPay = sum(likely.map(a => a.reward));
const earned = Math.round(levels.length * avgStarPay) + wagePay + achPay;
const lateWage = Math.round(sum(levels.slice(-4).map(wageOf)) / 4);
console.log('');
console.log('A full playthrough at 2.2 stars/level:');
console.log('  stars ' + Math.round(levels.length * avgStarPay) + ' (' + avgStarPay.toFixed(1) + '/level), wages ' + wagePay +
  ' (full-kill score per level, once), achievements ' + achPay + ' (all but three-star-a-world, 10-in-one, Cigar Beetle, Ratchet Bite), chests 0');
console.log('  = ' + earned + ' Buttons = ' + Math.round(earned / tree * 100) + '% of everything (' +
  Math.round(earned / sum(M.upgradeCosts)) + ' weapons fully upgraded, or ' + Math.floor(earned / sum(M.upgradeCosts.slice(0, 2))) + ' to tier 2)');
console.log('  with every achievement and chest: ' + (earned - achPay + achievements + chests) + ' = ' + Math.round((earned - achPay + achievements + chests) / tree * 100) + '%');
console.log('  the rest by replaying: a late-level win pays about ' + lateWage + ', so everything else takes ~' + Math.ceil((tree - earned) / lateWage) + ' more wins');
