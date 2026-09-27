// Which level is picked and how each has gone: both kept in the save (Save.lastLevel, Save.levels). No DOM: the level
// map (levelMap.js) shows them. ?level=id in the URL wins (the run report's replay link carries it); otherwise the
// last pick. ?recipe=... adds a "Custom Road" level built from that recipe (and ?seed=, if given) and picks it: the
// level lab's "Play it" link.
import { CONFIG as C } from './config.js';
import { Save, persist, levelRecord } from './save.js';
import { hasLevel, levelInfo, addCustomLevel } from './levels/index.js';

const q = new URLSearchParams(location.search), urlLevel = q.get('level'), urlRecipe = q.get('recipe');
if (urlRecipe) addCustomLevel(urlRecipe, /^\d+$/.test(q.get('seed') || '') ? +q.get('seed') : 1);

export function savedLevel() {
  if (urlRecipe) return 'custom';
  if (urlLevel && hasLevel(urlLevel)) return urlLevel;
  return hasLevel(Save.lastLevel) ? Save.lastLevel : C.defaultLevel;
}
export function rememberLevel(id) {
  if (Save.lastLevel !== id) { Save.lastLevel = id; persist(); }
}

// Levels won at least once.
export function clearedLevels() {
  const s = new Set();
  for (const id in Save.levels) if (Save.levels[id].cleared) s.add(id);
  return s;
}
// End of a run: best score, cleared + best stars on a win, and the level's unlockOnClear the first time it's won
// (a weapon joins Save.unlocks.scissors, credits just play; either way it queues a reveal for the level map).
// (Custom Road is a one-off, so it isn't recorded.)
export function recordLevelResult(id, won, score, stars, unlock) {
  if (id === 'custom') return;
  const r = levelRecord(id);
  r.bestScore = Math.max(r.bestScore, score);
  if (won) {
    if (!r.cleared && unlock) {
      if (unlock.scissors && !Save.unlocks.scissors.includes(unlock.scissors)) Save.unlocks.scissors.push(unlock.scissors);
      if (unlock.pin && !Save.unlocks.pins.includes(unlock.pin)) Save.unlocks.pins.push(unlock.pin);
      if (unlock.scissors) Save.reveals.push({ scissors: unlock.scissors });
      if (unlock.credits) Save.reveals.push({ credits: true });
    }
    r.cleared = true; r.stars = Math.max(r.stars, stars);
  }
  persist();
}

// "Level 4: Running Stitch" for a map level (numbered from 0: the tutorial), just the name for the others.
export function levelLabel(id) {
  const i = C.map.nodes.findIndex(n => n[0] === id), lv = levelInfo(id);
  return lv ? (i >= 0 ? 'Level ' + i + ': ' : '') + lv.name : '';
}
