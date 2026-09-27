// The persistent save: one `Save` object for everything the player keeps between sessions, stored as JSON in
// localStorage ('battleScissors.save'). It loads when this module is first imported; after changing it, call persist()
// (writes are debounced by CONFIG.saveDebounceMs and flushed when the page is hidden). migrate() upgrades older saves
// by version; the very first load also imports the separate keys earlier builds used, then removes them.
// Not in here: the debug panel's tuning overrides (debug.js) and playtest run reports (runlog.js), which are dev data.
//
// Save = {
//   version,
//   levels: { id: { stars, bestScore, cleared, bonusPaid } },  progress per level (stars 0..3, see recordLevelResult;
//                                                    bonusPaid = score-bonus Buttons already paid for it, see meta.js)
//   buttons,                                         the meta currency (meta.js: earned from stars, score, achievements, chests)
//   achievements: [id],                              achievements earned (src/achievements.js)
//   chests: [world],                                 world chests opened
//   sharpen,                                         Sharpenings held (used up one per level start)
//   cosmetics: { owned: [id], handle, glow },        cosmetics owned and the one equipped per slot ('' = none)
//   unlocks: { scissors: [], pins: [], levels: [] }, extra unlocks (levels: opened early, e.g. by "Unlock all")
//   upgrades: { scissorsId: tier },                  scissors upgrade tier 0..3 (meta.js)
//   equippedScissors, lastLevel,                     last weapon and level picked
//   settings: { sound, haptics, leftHanded, grip },  grip = touch controls 'hold' | 'pinch'; leftHanded not used yet
//   tutorialDone, tips: { pinIntro, shred },         one-time onboarding flags (tutorialDone = level 0 cleared)
//   reveals: [{ scissors } | { credits }],           rewards won but not yet shown (the level map plays them in order)
// }
import { CONFIG as C } from './config.js';

export const SAVE_VERSION = 2;
const KEY = 'battleScissors.save';
const defaults = () => ({
  version: SAVE_VERSION, levels: {}, buttons: 0, achievements: [], chests: [], sharpen: 0,
  cosmetics: { owned: [], handle: '', glow: '' }, unlocks: { scissors: [], pins: [], levels: [] }, upgrades: {},
  equippedScissors: '', lastLevel: '', settings: { sound: true, haptics: true, leftHanded: false, grip: 'hold' },
  tutorialDone: false, tips: { pinIntro: false, shred: false }, reveals: [],
});
export const Save = defaults();

// Bring a stored save up to SAVE_VERSION, one step per version.
export function migrate(old) {
  const s = old && typeof old === 'object' ? old : {};
  if ((s.version | 0) < 2) { delete s.scrap; s.version = 2; }       // v2: Buttons replace the unused "scrap" field
  s.version = SAVE_VERSION;
  return s;
}

// Fill `Save` from stored data over the defaults (nested groups merged, so new fields get their defaults).
function adopt(data) {
  const d = defaults();
  Object.assign(Save, d, data);
  for (const k of ['unlocks', 'settings', 'tips', 'cosmetics']) Save[k] = Object.assign(d[k], data[k]);
  for (const k of ['achievements', 'chests']) Save[k] = Array.isArray(data[k]) ? data[k] : [];
  Save.levels = Object.assign({}, data.levels);
  Save.reveals = Array.isArray(data.reveals) ? data.reveals : [];
}

// Earlier builds kept these as separate keys: import them once, then drop them.
const LEGACY = ['weapon', 'level', 'cleared', 'controls', 'muted', 'tips', 'onboarded'];
function fromLegacy() {
  const get = k => { try { return localStorage.getItem('battleScissors.' + k); } catch (e) { return null; } };
  const json = (k, d) => { try { return JSON.parse(get(k) || d); } catch (e) { return JSON.parse(d); } };
  const s = defaults();
  s.equippedScissors = get('weapon') || '';
  s.lastLevel = get('level') || '';
  for (const id of json('cleared', '[]')) s.levels[id] = { stars: 1, bestScore: 0, cleared: true };
  if (get('controls') === 'pinch') s.settings.grip = 'pinch';
  s.settings.sound = get('muted') !== '1';
  Object.assign(s.tips, json('tips', '{}'));
  s.tutorialDone = get('onboarded') === '1';
  return s;
}

function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { /* storage blocked: play with defaults */ }
  if (raw) {
    try { adopt(migrate(JSON.parse(raw))); return; } catch (e) { console.warn('save: unreadable, starting fresh', e); }
  }
  adopt(fromLegacy());
  writeNow();
  try { for (const k of LEGACY) localStorage.removeItem('battleScissors.' + k); } catch (e) { /* storage blocked */ }
}

let timer = 0;
function writeNow() {
  clearTimeout(timer); timer = 0;
  try { localStorage.setItem(KEY, JSON.stringify(Save)); } catch (e) { /* storage full or blocked */ }
}
// Call after changing Save: writes it CONFIG.saveDebounceMs later (one write for a burst of changes).
export function persist() {
  clearTimeout(timer);
  timer = setTimeout(writeNow, C.saveDebounceMs);
}
const flush = () => { if (timer) writeNow(); };
addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

// Progress record for a level (created on first use).
export function levelRecord(id) {
  return Save.levels[id] || (Save.levels[id] = { stars: 0, bestScore: 0, cleared: false, bonusPaid: 0 });
}

// Debug: forget everything (then the page reloads so every module starts from the defaults).
export function wipeSave() {
  clearTimeout(timer); timer = 0;
  try { localStorage.removeItem(KEY); for (const k of LEGACY) localStorage.removeItem('battleScissors.' + k); } catch (e) { /* storage blocked */ }
  adopt(defaults());
}
// Debug: every level, weapon and Pin unlocked (ids passed in, since this module knows nothing about content).
export function unlockAll({ levels, scissors, pins }) {
  Save.unlocks.levels = [...levels]; Save.unlocks.scissors = [...scissors]; Save.unlocks.pins = [...pins];
  persist();
}

load();
