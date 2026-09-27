// Which level is picked and which are cleared (localStorage, per-device convenience only). No DOM: the level map
// (levelMap.js) shows them. ?level=id in the URL wins (the run report's replay link carries it); otherwise the last
// pick. ?recipe=... adds a "Custom Road" level built from that recipe (and ?seed=, if given) and picks it: the level
// lab's "Play it" link.
import { CONFIG as C } from './config.js';

const STORE_KEY = 'battleScissors.level', CLEARED_KEY = 'battleScissors.cleared';
const q = new URLSearchParams(location.search), urlLevel = q.get('level'), urlRecipe = q.get('recipe');
if (urlRecipe) C.levels.custom = { name: 'Custom Road', blurb: urlRecipe, recipe: urlRecipe, seed: /^\d+$/.test(q.get('seed') || '') ? +q.get('seed') : 1 };

export function savedLevel() {
  if (urlRecipe) return 'custom';
  if (urlLevel && C.levels[urlLevel]) return urlLevel;
  try { const id = localStorage.getItem(STORE_KEY); if (id && C.levels[id]) return id; } catch (e) { /* storage blocked */ }
  return C.defaultLevel;
}
export function rememberLevel(id) {
  try { localStorage.setItem(STORE_KEY, id); } catch (e) { /* storage blocked */ }
}

// Levels won at least once.
export function clearedLevels() {
  try { return new Set(JSON.parse(localStorage.getItem(CLEARED_KEY) || '[]')); } catch (e) { return new Set(); }
}
export function markCleared(id) {
  const s = clearedLevels(); if (s.has(id)) return;
  s.add(id);
  try { localStorage.setItem(CLEARED_KEY, JSON.stringify([...s])); } catch (e) { /* storage blocked */ }
}

// "Level 4: Running Stitch" for a map level, just the name for the others.
export function levelLabel(id) {
  const i = C.map.nodes.findIndex(n => n[0] === id), lv = C.levels[id];
  return lv ? (i >= 0 ? 'Level ' + (i + 1) + ': ' : '') + lv.name : '';
}
