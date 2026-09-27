// The meta economy: Buttons, the one currency that outlives a level (thread is in-level only and is never converted).
// Buttons are earned only from performance and achievements, all deterministic:
//   stars      the first time each star of a level is earned: CONFIG.meta.starButtons (re-earning pays 0)
//   score      floor(score / scorePerButton), capped at scoreBonusCap per level: every run pays what it beats the
//              level's best bonus by (Save.levels[id].bonusPaid), so a level's score bonus totals at most the cap
//   achievements  src/achievements.js, once each
//   world chests  three-star every level of a world: chestButtons + that world's cosmetic, once
// Only the numbered map levels earn (not level 0, Random Quilt or a ?recipe= road), so the total supply is a fixed
// number: tools/buttonsupply.js prints it. Buttons buy the Shop's scissors (CONFIG.weapons[id].shop), scissors
// upgrades, Sharpening and cosmetics (shop.js); Pins and stars are never for sale. Nothing here waits on a clock or rolls a die. No DOM.
import { CONFIG as C } from './config.js';
import { Save, persist, levelRecord } from './save.js';
import { levelInfo } from './levels/index.js';
import { ACHIEVEMENTS } from './achievements.js';
import { upgradeTier } from './scissors.js';
import { weaponLocked, shopOpen } from './weaponSelect.js';

// The levels that pay Buttons: every map level but level 0, in map order.
export const earningLevels = () => C.map.nodes.map(n => n[0]).filter(id => id !== C.tutLevel);
export const earnsButtons = id => earningLevels().includes(id);
export const worldOf = id => (levelInfo(id) || {}).world || '';
export const worldIds = () => [...new Set(earningLevels().map(worldOf))];
export const worldLevels = w => earningLevels().filter(id => worldOf(id) === w);
export const achievementCtx = { worldLevels, levelAt: n => (C.map.nodes[n] || [''])[0] };

// A level's record before a run is recorded (settleRun compares against it).
export function levelBefore(id) {
  const r = Save.levels[id];
  return { stars: r ? r.stars : 0, cleared: !!(r && r.cleared) };
}

// End of a run (after recordLevelResult): pay its Buttons into the save and return the tally for the results card:
// { earns, stars: ['new' | 'old' | 'none'] x3 ('old' = earned on an earlier run: greyed, pays 0), starButtons,
//   scoreBonus, scoreButtons, achievements: [entries earned now], total, chest: world whose chest this run readied }.
export function settleRun(report, before) {
  const M = C.meta, id = report.level, earns = earnsButtons(id);
  const t = { earns, stars: [], starButtons: 0, scoreBonus: 0, scoreButtons: 0, achievements: [], total: 0, chest: '' };
  for (let n = 1; n <= 3; n++) {
    const got = report.won && n <= report.stars, fresh = got && earns && n > before.stars;
    t.stars.push(!got ? 'none' : fresh || !earns ? 'new' : 'old');
    if (fresh) t.starButtons += M.starButtons[n - 1];
  }
  if (earns) {
    const rec = levelRecord(id), bonus = Math.min(M.scoreBonusCap, Math.floor(report.score / M.scorePerButton));
    t.scoreBonus = bonus;
    t.scoreButtons = Math.max(0, bonus - (rec.bonusPaid | 0));
    rec.bonusPaid = Math.max(rec.bonusPaid | 0, bonus);
    for (const a of ACHIEVEMENTS) {
      if (Save.achievements.includes(a.id) || !a.check(report, Save, achievementCtx)) continue;
      Save.achievements.push(a.id); t.achievements.push(a);
    }
    const w = worldOf(id);
    if (report.stars >= 3 && before.stars < 3 && chestState(w) === 'ready') t.chest = w;
  }
  t.total = t.starButtons + t.scoreButtons + t.achievements.reduce((s, a) => s + a.reward, 0);
  Save.buttons += t.total;
  persist();
  return t;
}

// ---------- world chests ----------
// 'locked' (not every level of the world three-starred yet), 'ready' (earned, not opened) or 'opened'.
export function chestState(w) {
  if (Save.chests.includes(w)) return 'opened';
  return worldLevels(w).every(id => Save.levels[id] && Save.levels[id].stars >= 3) ? 'ready' : 'locked';
}
// Open a ready chest: its Buttons and its cosmetic. Returns whether it opened.
export function openChest(w) {
  if (chestState(w) !== 'ready') return false;
  Save.chests.push(w); Save.buttons += C.meta.chestButtons;
  const c = C.meta.worlds[w] && C.meta.worlds[w].chest;
  if (c && !Save.cosmetics.owned.includes(c)) Save.cosmetics.owned.push(c);
  persist();
  return true;
}

// ---------- shop ----------
// Price of weapon id's next upgrade tier (0 = fully upgraded).
export const upgradeCost = id => { const t = upgradeTier(id); return t < 3 ? C.meta.upgradeCosts[t] : 0; };
// Each buy returns '' on success, else why not ('max' | 'buttons' | 'owned').
export function buyUpgrade(id) {
  const cost = upgradeCost(id);
  if (!cost) return 'max';
  if (Save.buttons < cost) return 'buttons';
  Save.buttons -= cost; Save.upgrades[id] = upgradeTier(id) + 1; persist();
  return '';
}
// A Shop weapon: joins Save.unlocks.scissors, and the map shows its reveal like a won one.
export function buyWeapon(id) {
  const price = C.weapons[id].shop;
  if (!weaponLocked(id)) return 'owned';
  if (!shopOpen(id)) return 'not yet';
  if (Save.buttons < price) return 'buttons';
  Save.buttons -= price; Save.unlocks.scissors.push(id); Save.reveals.push({ scissors: id }); persist();
  return '';
}
export function buySharpen() {
  if (Save.sharpen >= C.meta.sharpenMax) return 'max';
  if (Save.buttons < C.meta.sharpenCost) return 'buttons';
  Save.buttons -= C.meta.sharpenCost; Save.sharpen++; persist();
  return '';
}
export function buyCosmetic(id) {
  const c = C.meta.cosmetics[id];
  if (!c || !c.price) return 'max';
  if (Save.cosmetics.owned.includes(id)) return 'owned';
  if (Save.buttons < c.price) return 'buttons';
  Save.buttons -= c.price; Save.cosmetics.owned.push(id); persist();
  return '';
}
// Wear an owned cosmetic in its slot, or take it off if it's already worn.
export function equipCosmetic(id) {
  const c = C.meta.cosmetics[id];
  if (!c || !Save.cosmetics.owned.includes(id)) return;
  Save.cosmetics[c.slot] = Save.cosmetics[c.slot] === id ? '' : id; persist();
}
// The colour worn in a slot ('handle' | 'glow'), or ''.
export function cosmeticColor(slot) {
  const c = C.meta.cosmetics[Save.cosmetics[slot]];
  return c ? c.color : '';
}
// Level start: use up one Sharpening if any are held. Returns whether this level is sharpened.
export function useSharpen() {
  if (Save.sharpen <= 0) return false;
  Save.sharpen--; persist();
  return true;
}
