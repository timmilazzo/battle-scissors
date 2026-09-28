// Current weapon and the snip cut zone (geometry + hit test). Logic only: weapon art and drawing live in
// weaponArt.js / render.js.
import { CONFIG as C } from './config.js';
import { view, DEG, segDistSq } from './core.js';
import { Save } from './save.js';

// ======================= current weapon =======================
// weapon.def = the weapon in use as played: its CONFIG.weapons entry with the save's upgrades applied (weaponDef).
// view.S (set by game.layout) maps its SVG units to CSS px. Call setWeapon again after an upgrade is bought.
export const weapon = { id: '', def: null };

export function setWeapon(id) {
  if (!C.weapons[id]) id = C.defaultWeapon;
  weapon.id = id; weapon.def = weaponDef(id);
}

// Upgrade tier 0..3 bought for weapon id (Save.upgrades; the shop is in shop.js, prices in CONFIG.meta).
export const upgradeTier = id => Math.max(0, Math.min(3, Save.upgrades[id] | 0));
// Sharpness of weapon id's edge, 0 (dull) .. 1 (sharp) (Save.sharpness; wear and Sharpen are in meta.js).
export const sharpness = id => { const s = Save.sharpness[id]; return typeof s === 'number' ? Math.max(0, Math.min(1, s)) : C.meta.sharpStart; };
// Snip damage multiplier for an edge: sharpDullMult at 0 to sharpSharpMult at 1.
export const sharpMult = s => C.meta.sharpDullMult + (C.meta.sharpSharpMult - C.meta.sharpDullMult) * s;
// The edge's name (CONFIG.meta.sharpBands, equal steps) and its index (0 = dullest).
export const sharpBandIndex = s => Math.min(C.meta.sharpBands.length - 1, Math.floor(s * C.meta.sharpBands.length));
export const sharpBand = s => C.meta.sharpBands[sharpBandIndex(s)];
// SHRED's tier bought (Save.skills.shred, meta.js buyShred) and the move at that tier (CONFIG.shredTiers: turns, charge).
export const shredTier = () => Math.max(0, Math.min(C.shredTiers.length - 1, Save.skills.shred | 0));
export const shredDef = () => C.shredTiers[shredTier()];
// Sharpen (meta.js buySharpen) is offered only below sharpenFrom.
export const canSharpen = id => sharpness(id) < C.meta.sharpenFrom;

// A weapon's stats at an upgrade tier (default: the tier bought): T1 reach, T2 close speed (opens faster), T3 its
// signature stat (CONFIG.weapons[id].signature). A fresh object; CONFIG itself is never changed.
export function weaponDef(id, tier = upgradeTier(id)) {
  const M = C.meta, base = C.weapons[id], d = { ...base, tier };
  if (tier >= 1) d.reachFrac *= 1 + M.reachUp;
  if (tier >= 2) d.openMs /= 1 + M.speedUp;
  if (tier >= 3) {
    const k = 1 + M.signatureUp, a = 1 + M.allUp;
    if (base.signature === 'angle') d.maxOpenDeg *= k;
    else if (base.signature === 'damage') d.damageMult *= k;
    else if (base.signature === 'crit') d.critMult *= k;
    else if (base.signature === 'hold') d.holdSec *= k;
    else if (base.signature === 'ring') d.ringScale *= k;
    else if (base.signature === 'all') { d.reachFrac *= a; d.openMs /= a; d.maxOpenDeg *= a; d.damageMult *= a; }
  }
  return d;
}

// SVG units -> CSS px for a weapon at this screen size (view.S holds it for the current weapon; the title's scissors
// use it for their own weapon).
export const scaleFor = def => def.reachFrac * C.weaponScale * view.H / def.bladeLen;

// Blade length on screen (pivot to tip) in CSS px.
export const bladeReachPx = () => weapon.def.bladeLen * view.S;
// kind 'slide' (Cigar Cutter): no pivot; parts slide apart and the cut zone is the round hole (radius = bladeLen).
export const isSlide = (def = weapon.def) => def.kind === 'slide';
// How far the Helicopter spin reaches: the blades, or for a slide weapon its whole body (spinLen).
export const spinReachPx = () => (weapon.def.spinLen || weapon.def.bladeLen) * view.S;

// ======================= cut zone =======================
// The pie slice the blades sweep on a snip, measured from the widest point of the close (for a slide weapon: the
// hole, a circle of radius L around (px, py); slide = true). ver bumps on every new zone so the renderer knows when to
// rebuild its gradient.
export const cut = { px: 0, py: 0, lx: 0, ly: 0, rx: 0, ry: 0, theta: 0, a: 0, L: 0, slide: false, ver: 0 };

export function setCutZone(px, py, theta, spread) {
  const a = spread * weapon.def.maxOpenDeg * DEG, L = bladeReachPx() * C.cutZoneScale * (isSlide() ? weapon.def.ringScale || 1 : 1);
  cut.slide = isSlide();
  cut.px = px; cut.py = py;
  cut.lx = px + L * Math.sin(theta - a); cut.ly = py - L * Math.cos(theta - a);
  cut.rx = px + L * Math.sin(theta + a); cut.ry = py - L * Math.cos(theta + a);
  cut.theta = theta; cut.a = a; cut.L = L; cut.ver++;
}

// Cut zone = the pie slice the blades actually sweep (tips travel on an arc, not a straight line),
// plus anything touching either blade edge. (x, y, r) is a circle; pad = extra reach in px.
export function cutZoneHits(x, y, r, pad) {
  const ax = Math.sin(cut.theta), ay = -Math.cos(cut.theta);
  const rx = x - cut.px, ry = y - cut.py, reach = r + pad;
  if (cut.slide) return Math.hypot(rx, ry) <= cut.L + reach;     // the hole
  const inSector = Math.hypot(rx, ry) <= cut.L + reach && Math.abs(Math.atan2(ax * ry - ay * rx, ax * rx + ay * ry)) <= cut.a;
  return inSector ||
    segDistSq(x, y, cut.px, cut.py, cut.lx, cut.ly) <= reach * reach ||
    segDistSq(x, y, cut.px, cut.py, cut.rx, cut.ry) <= reach * reach;
}
