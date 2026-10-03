// Pins (towers) as the game plays them: the CONFIG.towers entry with the type's permanent tier (Save.pinTiers, bought
// with Buttons in the Sewing Box) and a built Pin's in-level rank (Thread, tapping its arrow) applied. The twin of
// scissors.js's weaponDef: logic only, no DOM, CONFIG itself is never changed. game.js caches pinDef on each tower
// (t.def) when it's built or ranked up, so the hot loop never allocates.
import { CONFIG as C } from './config.js';
import { Save } from './save.js';
import { view } from './core.js';

export const PIN_TIERS = 3;
export const maxRank = () => C.pinRanks.costMult.length;
// A Pin type's permanent tier, 0..3.
export const pinTier = type => Math.max(0, Math.min(PIN_TIERS, Save.pinTiers[type] | 0));

// The Pin as it plays: `type` at in-level `rank` (1 = as built) with its tier. Tier 1 cuts the build cost, tier 2 widens
// the ring, tier 3 adds the type's signature (CONFIG.meta.pinSignature); each rank widens the ring and multiplies its
// power (CONFIG.pinRanks). The result also carries `rank` and `tier`.
export function pinDef(type, rank = 1, tier = pinTier(type)) {
  const M = C.meta, R = C.pinRanks, base = C.towers[type], d = { ...base, rank, tier };
  const r = Math.max(0, Math.min(R.costMult.length - 1, rank - 1)), power = R.powerMult[r];
  if (tier >= 1) d.cost = Math.round(base.cost * (1 - M.pinCostDown));
  d.radius = base.radius * (tier >= 2 ? 1 + M.pinRadiusUp : 1) * R.radiusMult[r];
  if (tier >= 3) Object.assign(d, M.pinSignature[type] || {});
  if (d.damage != null) d.damage = base.damage * power;
  if (d.cooldownSec != null) d.cooldownSec = base.cooldownSec / power;
  if (d.burnDps != null) d.burnDps = base.burnDps * power;
  if (d.burnSec != null && d.burnSecUp) d.burnSec = base.burnSec * (1 + d.burnSecUp);
  if (d.pullBack != null) d.pullBack = base.pullBack * power;
  if (d.holdSec != null) d.holdSec = base.holdSec * power;
  if (d.periodSec != null && d.periodDown) d.periodSec = base.periodSec * (1 - d.periodDown);
  if (d.popBackU != null) d.popBackU = base.popBackU * power;                   // cork: shoves further back
  if (d.meltMult != null) d.meltMult = 1 + (base.meltMult - 1) * power;         // candle: the bonus part grows (1.25 -> 1.35 -> 1.45)
  if (type === 'ice') d.slowMult = R.iceSlow[r];
  return d;
}
// A type's Thread build cost at its tier (no allocation: read every frame by the action bar).
export const pinCost = type => Math.round(C.towers[type].cost * (pinTier(type) >= 1 ? 1 - C.meta.pinCostDown : 1));
// The def for a tower entity (game.js state.towers[i]) at its current rank.
export const towerDef = t => pinDef(t.type, t.rank);
// A Pin's ring in world px: a built one (its cached def) or a type (as it would be built, rank 1: the picker's preview).
export const towerReachOf = t => (t.def || pinDef(t.type)).radius * view.L;
export const towerReach = type => pinDef(type).radius * view.L;
// Thread to raise built Pin t to its next rank (0 = at the top rank).
export function rankUpCost(t) {
  const R = C.pinRanks;
  if (!t.on || t.rank >= R.costMult.length) return 0;
  return Math.round(pinDef(t.type).cost * R.costMult[t.rank]);
}
// What the next rank changes, for the rank card: [[label, text], ...] (percentages from CONFIG.pinRanks).
export function rankUpText(t) {
  const R = C.pinRanks, a = t.rank - 1, b = Math.min(R.costMult.length - 1, t.rank);
  const pct = (x, y) => '+' + Math.round((y / x - 1) * 100) + '%';
  const out = [['ring', pct(R.radiusMult[a], R.radiusMult[b])]];
  const power = pct(R.powerMult[a], R.powerMult[b]);
  if (t.type === 'needle') out.push(['damage', power], ['fire rate', power]);
  else if (t.type === 'fire') out.push(['burn', power]);
  else if (t.type === 'magnet') out.push(['pull', power], ['hold', power]);
  else if (t.type === 'ice') out.push(['slow', 'to ' + Math.round(R.iceSlow[b] * 100) + '% speed']);
  else if (t.type === 'cork') out.push(['pop-back', power]);
  else if (t.type === 'candle') {
    const m = C.towers.candle.meltMult - 1;
    out.push(['melt', 'x' + (1 + m * R.powerMult[b]).toFixed(2) + ' damage']);
  }
  return out;
}
