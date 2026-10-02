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
//   sharpness: { scissorsId: 0..1 },                 each pair's edge (missing = CONFIG.meta.sharpStart; worn by snips, meta.js)
//   cosmetics: { owned: [id], handle, glow },        cosmetics owned and the one equipped per slot ('' = none)
//   unlocks: { scissors: [], pins: [], levels: [] }, extra unlocks (levels: opened early, e.g. by "Unlock all")
//   upgrades: { scissorsId: tier },                  scissors upgrade tier 0..3 (meta.js)
//   pinTiers: { pinType: tier },                     each Pin type's permanent tier 0..3 (meta.js buyPinTier; src/pins.js)
//   skills: { shred },                               SHRED's tier 0..3 (CONFIG.shredTiers; meta.js buyShred)
//   equippedScissors, lastLevel,                     last weapon and level picked
//   settings: { sound, haptics, leftHanded, grip, analytics },  grip = touch controls 'hold' | 'pinch'; leftHanded not used yet;
//     analytics = share anonymous play data (src/analytics.js); anonId = the random id those events carry (made on first use)
//   tutorialDone, tips: { pins, shred, shredRuns, shopSeen, rank },  one-time onboarding flags (tutorialDone = level 0 cleared; pins = Pin
//                                                    types the explainer has introduced; shredRuns = runs the SHRED ready tip showed
//                                                    in; shopSeen = Shop / Sewing Box deals (meta.js deals() ids) the player has had
//                                                    on screen; rank = the Pin rank-up tip has shown)
//   reveals: [{ morning } | { scissors } | { shop } | { credits } | { chest }],  rewards won but not yet shown (the level map plays
//                                                    them in order; morning = a boss level id whose morning-after note (story.js)
//                                                    is due; shop = 'shred' or a weapon id: stock a level clear put on sale)
//   critterKills,                                    critters squished, all runs (the one-time "Squish 25" achievement)
// }
import { CONFIG as C } from './config.js';

export const SAVE_VERSION = 4;
const KEY = 'battleScissors.save';
const defaults = () => ({
  version: SAVE_VERSION, levels: {}, buttons: 0, achievements: [], chests: [], sharpness: {},
  cosmetics: { owned: [], handle: '', glow: '' }, unlocks: { scissors: [], pins: [], levels: [] }, upgrades: {}, pinTiers: {}, skills: { shred: 0 },
  equippedScissors: '', lastLevel: '', settings: { sound: true, haptics: true, leftHanded: false, grip: 'hold', analytics: true }, anonId: '',
  tutorialDone: false, tips: { pins: [], shred: false, shredRuns: 0, shopSeen: [], rank: false }, reveals: [], critterKills: 0,
});
export const Save = defaults();

// Bring a stored save up to SAVE_VERSION, one step per version.
export function migrate(old) {
  const s = old && typeof old === 'object' ? old : {};
  if ((s.version | 0) < 2) { delete s.scrap; s.version = 2; }       // v2: Buttons replace the unused "scrap" field
  if ((s.version | 0) < 3) {                                        // v3: each pair's own sharpness replaces held
    s.buttons = (s.buttons | 0) + (s.sharpen | 0) * 40; delete s.sharpen;   // Sharpenings, refunded at their old price
  }
  if ((s.version | 0) < 4 && s.tips) {                              // v4: one explainer per Pin type replaces the single
    s.tips.pins = s.tips.pinIntro ? ['needle'] : []; delete s.tips.pinIntro;   // one-time one (which always led with the Needle)
  }
  s.version = SAVE_VERSION;
  return s;
}

// Fill `Save` from stored data over the defaults (nested groups merged, so new fields get their defaults).
function adopt(data) {
  const d = defaults();
  Object.assign(Save, d, data);
  for (const k of ['unlocks', 'settings', 'tips', 'cosmetics', 'sharpness', 'skills', 'upgrades', 'pinTiers']) Save[k] = Object.assign(d[k], data[k]);
  for (const k of ['achievements', 'chests']) Save[k] = Array.isArray(data[k]) ? data[k] : [];
  if (!Array.isArray(Save.tips.pins)) Save.tips.pins = [];
  if (!Array.isArray(Save.tips.shopSeen)) Save.tips.shopSeen = [];
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
