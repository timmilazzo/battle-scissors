// The total supply of Buttons (the meta currency) in the game, and what it buys. Dev tool, not deployed:
//
//   node tools/buttonsupply.js
//
// Supply = stars (every star of every Button-earning level, first time only) + achievements (src/achievements.js)
// + score bonus (levels x CONFIG.meta.scoreBonusCap, the most a level's score bonus ever pays) + world chests.
// Buttons can't be earned any other way (see src/meta.js), so this is the most a player can ever hold.
// It then estimates what share of the scissors upgrade tree a full playthrough averaging 2.2 stars per level affords.
// Needs Node 22+ (it imports the game's ES modules directly; they touch no DOM).
import { CONFIG as C } from '../src/config.js';
import { ACHIEVEMENTS } from '../src/achievements.js';
import { levelInfo, loadLevel } from '../src/levels/index.js';

const M = C.meta;
const levels = C.map.nodes.map(n => n[0]).filter(id => id !== C.tutLevel);   // as meta.js earningLevels()
const worlds = [...new Set(levels.map(id => levelInfo(id).world))];
const sum = a => a.reduce((s, x) => s + x, 0);

const perLevelStars = sum(M.starButtons);
const stars = levels.length * perLevelStars;
const achievements = sum(ACHIEVEMENTS.map(a => a.reward));
const score = levels.length * M.scoreBonusCap;
const chests = worlds.filter(w => M.worlds[w]).length * M.chestButtons;
const supply = stars + achievements + score + chests;

const upgrades = Object.keys(C.weapons).length * sum(M.upgradeCosts);
const cosmetics = sum(Object.values(M.cosmetics).map(c => c.price || 0));
const shopScissors = sum(Object.values(C.weapons).map(w => w.shop || 0));

console.log('Button supply (' + levels.length + ' levels, ' + worlds.length + ' worlds, ' + ACHIEVEMENTS.length + ' achievements)');
console.log('  stars         ' + String(stars).padStart(5) + '  (' + levels.length + ' x ' + perLevelStars + ')');
console.log('  achievements  ' + String(achievements).padStart(5));
console.log('  score bonus   ' + String(score).padStart(5) + '  (' + levels.length + ' x ' + M.scoreBonusCap + ' max)');
console.log('  world chests  ' + String(chests).padStart(5));
console.log('  TOTAL         ' + String(supply).padStart(5));
console.log('');
console.log('Spending: upgrade tree ' + upgrades + ' (' + Object.keys(C.weapons).length + ' weapons x ' + sum(M.upgradeCosts) +
  '), Shop scissors ' + shopScissors + ', cosmetics ' + cosmetics + ', SHRED tiers ' + sum(M.shredCosts) + ', Sharpen ' + M.sharpenCost + ' a time');

// A full playthrough averaging 2.2 stars per level: 40% of levels three-starred, 40% two, 20% one. Three-starring
// is spread evenly, so a world's chest and its "three-star a world" achievement only come if a whole world is
// three-starred; at 40% we assume none is. Every level clears, so both world-clear and L12 achievements pay.
// Score bonus: the full-kill score of each level's waves (no multi-snip bonus), floor(/100), capped.
const byStars = { 3: 0.4, 2: 0.4, 1: 0.2 };
const starPay = n => sum(M.starButtons.slice(0, n));
const avgStarPay = sum(Object.entries(byStars).map(([n, f]) => f * starPay(+n)));
const levelScore = id => {
  let s = 0;
  for (const w of loadLevel(id, 1).waves || C.waves) for (const [type, count] of w) s += C.enemyTypes[type].score * count;
  return s;
};
const scorePay = sum(levels.map(id => Math.min(M.scoreBonusCap, Math.floor(levelScore(id) / M.scorePerButton))));
const likely = ACHIEVEMENTS.filter(a => !a.id.startsWith('stars-') && !['snip10', 'cigar-beetle', 'pruner-bite'].includes(a.id));
const achPay = sum(likely.map(a => a.reward));
const earned = Math.round(levels.length * avgStarPay) + scorePay + achPay;
console.log('');
console.log('A full playthrough at 2.2 stars/level:');
console.log('  stars ' + Math.round(levels.length * avgStarPay) + ' (' + avgStarPay.toFixed(1) + '/level), score bonus ' + scorePay +
  ' (full-kill score per level), achievements ' + achPay + ' (all but three-star-a-world, 10-in-one, Cigar Beetle, Ratchet Bite), chests 0');
console.log('  = ' + earned + ' Buttons = ' + Math.round(earned / upgrades * 100) + '% of the upgrade tree (' +
  Math.round(earned / sum(M.upgradeCosts)) + ' weapons fully upgraded, or ' + Math.floor(earned / sum(M.upgradeCosts.slice(0, 2))) + ' to tier 2)');
console.log('  with every achievement: ' + (earned - achPay + achievements) + ' = ' + Math.round((earned - achPay + achievements) / upgrades * 100) + '%;' +
  ' the whole supply: ' + Math.round(supply / upgrades * 100) + '%');
