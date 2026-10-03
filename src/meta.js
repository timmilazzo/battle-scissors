// The meta economy: Buttons, the one currency that outlives a level (thread is in-level only and is never converted).
// Buttons are earned only from playing, all deterministic:
//   wage       every win: floor(score / scorePerButton), capped at scoreCap(id) (CONFIG.meta.scoreCapBase + scoreCapPerLevel
//              x the global level number 1..50, levelPlace), replays included, so income never runs out; Random Quilt
//              pays it too (as world hpOffMapWorld, level hpOffMapLevel). Save.levels[id].bonusPaid keeps the level's
//              best for the results card.
//   stars      the first time each star of a map level is earned: CONFIG.meta.starButtons (re-earning pays 0)
//   achievements  src/achievements.js, once each, on map levels
//   world chests  three-star every level of a world: chestButtons + that world's cosmetic, once
// Level 0 and a ?recipe= road never earn. tools/buttonsupply.js prints the one-time supply and the wage per level.
// Buttons buy the Shop's scissors (CONFIG.weapons[id].shop) and cosmetics (shop.js), and in the Sewing Box the
// scissors' upgrade tiers, Sharpen, the Pins' permanent tiers, SHRED's tiers and the Skills' tiers (armory.js). Stars are never for sale
// and Pins are unlocked by progression (only their tiers are bought). Nothing here waits on a clock or rolls a die. No DOM.
import { CONFIG as C } from './config.js';
import { Save, persist, levelRecord } from './save.js';
import { levelInfo } from './levels/index.js';
import { ACHIEVEMENTS } from './achievements.js';
import { upgradeTier, sharpness, canSharpen, shredTier } from './scissors.js';
import { pinTier, PIN_TIERS } from './pins.js';
import { skillTier, SKILL_TIERS } from './skills.js';
import { weaponLocked, shopOpen } from './weaponSelect.js';

// ---------- the map: five worlds of ten levels (CONFIG.map.worlds, docs/worlds.md) ----------
// A level's place: { world: 1..5, worldId, n: 0..10 (its number inside the world; level 0 = the tutorial, world 1's
// patch 0), global: 0..50 (the patches counted in play order, level 0 = 0: the wage cap and the rank mix), onMap }.
// Off the map (Random Quilt, Custom Road) it is world CONFIG.hpOffMapWorld, level hpOffMapLevel, and the global number
// that place would have (3-5 = 25), onMap false. The map's places are built once (the map isn't tuned live).
let places = null;
function placeTable() {
  if (places) return places;
  places = new Map();
  let global = 0;
  C.map.worlds.forEach((w, wi) => {
    let n = 0;
    for (const [id] of w.nodes) {
      const tut = id === C.tutLevel;
      if (!tut) { n++; global++; }
      places.set(id, { world: wi + 1, worldId: w.id, n: tut ? 0 : n, global: tut ? 0 : global, onMap: true });
    }
  });
  return places;
}
export function levelPlace(id) {
  const p = placeTable().get(id);
  if (p) return p;
  const wi = C.hpOffMapWorld - 1, before = C.map.worlds.slice(0, wi).reduce((s, w) => s + w.nodes.filter(nd => nd[0] !== C.tutLevel).length, 0);
  return { world: C.hpOffMapWorld, worldId: (C.map.worlds[wi] || {}).id || '', n: C.hpOffMapLevel, global: before + C.hpOffMapLevel, onMap: false };
}
// Every map level id in play order (level 0 first): the index is the global level number.
export const mapIds = () => C.map.worlds.flatMap(w => w.nodes.map(nd => nd[0]));
// The global number of a map level, -1 off the map (game.js's progression compares these).
export const mapIndex = id => { const p = placeTable().get(id); return p ? p.global : -1; };
// "2-3" for a map level, "0" for level 0, '' off the map (the HUD, labels and "Clear Level ..." hints).
export const levelNo = id => { const p = placeTable().get(id); return !p ? '' : p.n === 0 ? '0' : p.world + '-' + p.n; };
// Compat: the old one-road map number. Now the global number (off the map: 3-5's, 25). Use levelPlace.
export const mapLevelNum = id => levelPlace(id).global;
// The levels that pay stars, achievements and chests: every map level but level 0, in map order.
export const earningLevels = () => mapIds().filter(id => id !== C.tutLevel);
export const earnsStars = id => placeTable().has(id) && id !== C.tutLevel;
export const earnsButtons = earnsStars;
// The levels that pay the wage: those, and Random Quilt.
export const earnsWage = id => earnsStars(id) || id === 'random';
// The most the wage pays on a level: scoreCapBase + scoreCapPerLevel x its global number.
export const scoreCap = id => C.meta.scoreCapBase + C.meta.scoreCapPerLevel * levelPlace(id).global;
// The worlds in order, a level's world id (its map world; off the map its level file's), a world's levels (not level 0),
// its boss level (its last patch, n = 10) and its CONFIG.map.worlds entry.
export const worldIds = () => C.map.worlds.map(w => w.id);
export const mapWorld = w => C.map.worlds.find(x => x.id === w);
export const worldOf = id => { const p = placeTable().get(id); return p ? p.worldId : (levelInfo(id) || {}).world || ''; };
export const worldLevels = w => { const W = mapWorld(w); return W ? W.nodes.map(nd => nd[0]).filter(id => id !== C.tutLevel) : []; };
export const worldBoss = w => { const ids = worldLevels(w); return ids[ids.length - 1] || ''; };
// Whether world w is open: always with CONFIG.map.lockWorlds off and for the first world; otherwise once the previous
// world's boss level is cleared. worldGate(w) = the level that opens it ('' = open from the start).
export const worldGate = w => { const i = worldIds().indexOf(w); return C.map.lockWorlds && i > 0 ? worldBoss(worldIds()[i - 1]) : ''; };
export const worldOpen = w => { const g = worldGate(w); return !g || !!(Save.levels[g] && Save.levels[g].cleared); };
export const achievementCtx = { worldLevels, worldBoss, levelAt: n => mapIds()[n] || '' };

// A level's record before a run is recorded (settleRun compares against it).
export function levelBefore(id) {
  const r = Save.levels[id];
  return { stars: r ? r.stars : 0, cleared: !!(r && r.cleared) };
}

// End of a run (after recordLevelResult): pay its Buttons into the save and return the tally for the results card:
// { earns (anything at all: stars or the wage), wage (the wage: a win here pays the score bonus), scoreCap, stars:
//   ['new' | 'old' | 'none'] x3 ('old' = earned on an earlier run: greyed, pays 0), starButtons, scoreBonus (= what it
//   pays, scoreButtons), achievements: [entries earned now], total, chest: world whose chest this run readied }.
export function settleRun(report, before) {
  const M = C.meta, id = report.level, earns = earnsStars(id), wage = earnsWage(id);
  const t = { earns: earns || wage, wage, scoreCap: scoreCap(id), stars: [], starButtons: 0, scoreBonus: 0, scoreButtons: 0, achievements: [], total: 0, chest: '' };
  for (let n = 1; n <= 3; n++) {
    const got = report.won && n <= report.stars, fresh = got && earns && n > before.stars;
    t.stars.push(!got ? 'none' : fresh || !earns ? 'new' : 'old');
    if (fresh) t.starButtons += M.starButtons[n - 1];
  }
  if (wage && (report.won || report.endless)) {                 // the wage: every win pays, capped by level (an endless run however it ends)
    const rec = levelRecord(id), bonus = Math.min(t.scoreCap, Math.floor(report.score / M.scorePerButton));
    t.scoreBonus = t.scoreButtons = bonus;
    rec.bonusPaid = Math.max(rec.bonusPaid | 0, bonus);         // the level's best, for the results card
  }
  if (earns) {
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

// ---------- the Sewing Box and the Shop ----------
// Price of weapon id's next upgrade tier (0 = fully upgraded).
export const upgradeCost = id => { const t = upgradeTier(id); return t < 3 ? C.meta.upgradeCosts[t] : 0; };
// A Pin type's permanent tiers: on sale once the Pin's first level (CONFIG.pinFrom) is cleared (or the Pin is in
// Save.unlocks.pins); its next tier's price (0 = maxed).
export const pinOpen = type => !!(Save.levels[C.pinFrom[type]] && Save.levels[C.pinFrom[type]].cleared) || Save.unlocks.pins.includes(type);
export const pinTierCost = type => { const t = pinTier(type); return t < PIN_TIERS ? C.meta.pinTierCosts[t] : 0; };
export function buyPinTier(type) {
  const cost = pinTierCost(type);
  if (!cost) return 'max';
  if (!pinOpen(type)) return 'not yet';
  if (Save.buttons < cost) return 'buttons';
  Save.buttons -= cost; Save.pinTiers[type] = pinTier(type) + 1; persist();
  return '';
}
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
// SHRED as a skill: its next tier's price (0 = maxed), on sale once SHRED's level (CONFIG.shredFrom) is cleared.
export const shredOpen = () => !!(Save.levels[C.shredFrom] && Save.levels[C.shredFrom].cleared);
export const shredCost = () => C.meta.shredCosts[shredTier()] || 0;
export function buyShred() {
  const cost = shredCost();
  if (!cost) return 'max';
  if (!shredOpen()) return 'not yet';
  if (Save.buttons < cost) return 'buttons';
  Save.buttons -= cost; Save.skills.shred = shredTier() + 1; persist();
  return '';
}
// A Skill (CONFIG.skills, a move for either slot): its tiers go on sale once its level (CONFIG.skillFrom) is cleared; its
// next tier's price (CONFIG.skillCosts; 0 = maxed). Tier 0 is free: the Skill itself comes with its level.
export const skillOpen = id => !!(Save.levels[C.skillFrom[id]] && Save.levels[C.skillFrom[id]].cleared);
export const skillCost = id => { const t = skillTier(id); return t < SKILL_TIERS ? C.skillCosts[t] || 0 : 0; };
export function buySkillTier(id) {
  if (!C.skills[id]) return 'max';
  const cost = skillCost(id);
  if (!cost) return 'max';
  if (!skillOpen(id)) return 'not yet';
  if (Save.buttons < cost) return 'buttons';
  Save.buttons -= cost; Save.skills[id] = skillTier(id) + 1; persist();
  return '';
}
// ---------- what's new in the Sewing Box and the Shop ----------
// Everything on sale that the balance covers right now, one entry each, with the screen ('box' = the Sewing Box, 'shop')
// and tab it's on and its price: in the Sewing Box a held pair's next upgrade tier ('up:<weapon>:<tier>', scissors),
// a Pin's next tier ('pin:<type>:<tier>', pins), SHRED's next tier ('shred:<tier>', moves) and a Skill's next tier
// ('skill:<id>:<tier>', moves); in the Shop a pair on
// sale ('pair:<weapon>', pairs) and a cosmetic ('cos:<id>', style). Sharpen is upkeep, never a deal. newDeals(screen) =
// the ones the player hasn't had on screen yet (Save.tips.shopSeen): they light the gold dot on that screen's entrances
// and fill the results card's Shop line; markDealsSeen(screen, tab) as that tab renders. A bought tier's next one is a
// new id, so the dot returns only when there's really something new.
export function deals() {
  const out = [];
  for (const id in C.weapons) {
    const w = C.weapons[id];
    if (!weaponLocked(id)) { const t = upgradeTier(id); if (t < 3 && Save.buttons >= upgradeCost(id)) out.push({ id: 'up:' + id + ':' + (t + 1), screen: 'box', tab: 'scissors', weapon: id, tier: t + 1, cost: upgradeCost(id) }); }
    else if (shopOpen(id) && Save.buttons >= w.shop) out.push({ id: 'pair:' + id, screen: 'shop', tab: 'pairs', weapon: id, cost: w.shop });
  }
  for (const type in C.towers) {
    const t = pinTier(type);
    if (pinOpen(type) && t < PIN_TIERS && Save.buttons >= pinTierCost(type)) out.push({ id: 'pin:' + type + ':' + (t + 1), screen: 'box', tab: 'pins', pin: type, tier: t + 1, cost: pinTierCost(type) });
  }
  const st = shredTier();
  if (shredOpen() && C.shredTiers[st + 1] && Save.buttons >= shredCost()) out.push({ id: 'shred:' + (st + 1), screen: 'box', tab: 'moves', tier: st + 1, cost: shredCost() });
  for (const id in C.skills) {
    const t = skillTier(id), cost = skillCost(id);
    if (skillOpen(id) && cost && Save.buttons >= cost) out.push({ id: 'skill:' + id + ':' + (t + 1), screen: 'box', tab: 'moves', skill: id, tier: t + 1, cost });
  }
  for (const id in C.meta.cosmetics) {
    const c = C.meta.cosmetics[id];
    if (!c.chest && !Save.cosmetics.owned.includes(id) && Save.buttons >= c.price) out.push({ id: 'cos:' + id, screen: 'shop', tab: 'style', cosmetic: id, cost: c.price });
  }
  return out;
}
export const newDeals = screen => deals().filter(d => !Save.tips.shopSeen.includes(d.id) && (!screen || d.screen === screen));
export function markDealsSeen(screen, tab) {
  let changed = false;
  for (const d of deals()) if (d.screen === screen && d.tab === tab && !Save.tips.shopSeen.includes(d.id)) { Save.tips.shopSeen.push(d.id); changed = true; }
  if (changed) persist();
}
// Sharpen weapon id's edge back to 1 (sharp). Offered only below sharpenFrom (canSharpen).
export function buySharpen(id) {
  if (weaponLocked(id)) return 'locked';
  if (!canSharpen(id)) return 'sharp';
  if (Save.buttons < C.meta.sharpenCost) return 'buttons';
  Save.buttons -= C.meta.sharpenCost; Save.sharpness[id] = 1; persist();
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
// One snip attempt with weapon id (hit or miss): its edge wears by sharpWearPerSnip, never below 0 (dull).
export function wearBlade(id) {
  Save.sharpness[id] = Math.max(0, sharpness(id) - C.meta.sharpWearPerSnip); persist();
}
