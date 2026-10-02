// The Sewing Box's tabs and the Shop's Pairs tab (sewingBox.js and shop.js own the screens; this builds the contents,
// DOM only). Sewing Box: Scissors = one panel per pair held: art, name with upgrade stars, EQUIPPED or an Equip
// button, the sharpness meter with its Sharpen button (sharpMeter.js), and the next upgrade tier with its price.
// Pins = one panel per Pin type: its icon, what it does, its three permanent tiers (meta.js buyPinTier; on sale once
// its level is cleared). Moves = SHRED as a skill (CONFIG.shredTiers), its next tier bought with Buttons once SHRED's
// level is cleared, then the skills to come (CONFIG.skillIdeas). Shop: Pairs = the scissors not held yet, greyed: a
// Shop pair on sale shows its price (meta.js buyWeapon), the rest say how they're won (a level) or when they go on
// sale. Prices: CONFIG.meta; the buys themselves are meta.js.
import { CONFIG as C } from './config.js';
import { Save } from './save.js';
import { upgradeTier, shredTier } from './scissors.js';
import { pinTier, PIN_TIERS } from './pins.js';
import { weaponLocked, shopOpen, unlockHint, savedWeapon } from './weaponSelect.js';
import { upgradeCost, buyUpgrade, buySharpen, buyWeapon, shredOpen, shredCost, buyShred, pinOpen, pinTierCost, buyPinTier } from './meta.js';
import { sfx, unlockAudio } from './audio.js';
import { sharpMeter, setSharpMeter, sharpenButton, setSharpenButton } from './sharpMeter.js';
import { revealNow } from './levelMap.js';
import { PIN_ICON } from './actionBar.js';

let opts = { toast: () => {}, onChange: () => {}, onEquip: () => {}, onFeedback: () => {}, refresh: () => {} };

const pct = x => '+' + Math.round(x * 100) + '%';
const SIGNATURE = { angle: 'cut angle', damage: 'damage', crit: 'crit damage', hold: 'jaw hold time', ring: 'ring size' };
// What tier n (1..3) of weapon id does, in words.
export function tierText(id, n) {
  const M = C.meta, sig = C.weapons[id].signature;
  if (n === 1) return pct(M.reachUp) + ' reach';
  if (n === 2) return pct(M.speedUp) + ' close speed';
  return sig === 'all' ? pct(M.allUp) + ' to everything' : pct(M.signatureUp) + ' ' + SIGNATURE[sig];
}

// What tier n (1..3) of a Pin type does, in words (CONFIG.meta pinCostDown / pinRadiusUp / pinSignature).
export function pinTierText(type, n) {
  const M = C.meta, s = M.pinSignature[type] || {};
  if (n === 1) return '−' + Math.round(M.pinCostDown * 100) + '% build cost';
  if (n === 2) return pct(M.pinRadiusUp) + ' ring';
  if (s.volley) return 'shoots ' + s.volley + ' needles a shot';
  if (s.freezeSec) return 'stops an enemy ' + s.freezeSec + 's as it enters';
  if (s.burnSecUp) return pct(s.burnSecUp) + ' burn time after leaving';
  if (s.periodDown) return 'pulls ' + Math.round(s.periodDown * 100) + '% sooner';
  return '';
}

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
const failText = { buttons: 'Not enough Buttons', max: 'Already maxed', sharp: 'Already sharp', locked: 'Not yours yet', owned: 'Already owned', 'not yet': 'Not on sale yet' };
// A buy: fn() is a meta.js buy (returns '' or why not); on success the sound and opts.onChange(); the screens re-render either way.
export function buy(fn, sound) { unlockAudio(); const why = fn(); if (why) opts.toast(failText[why] || why); else { sfx(sound, 0); opts.onChange(); } opts.refresh(); }
// The upgrade row shared by the panels: pips, "Tier n: what it does", an Upgrade button with its price (or Maxed).
function upgradeRow(tier, max, text, cost, enabled, onBuy) {
  const up = el('div', 'arm-up'), pips = el('span', 'pips'), info = el('span', 'arm-up-txt'), what = el('div');
  for (let i = 1; i <= max; i++) pips.append(i <= tier ? '●' : el('i', '', '○'));
  let action;
  if (tier >= max) { info.textContent = 'Fully upgraded'; action = el('span', 'tag', 'Maxed'); }
  else {
    info.textContent = 'Tier ' + (tier + 1) + ': ' + text;
    action = el('button', 'felt-btn small buy'); action.type = 'button';
    action.innerHTML = '<span>Upgrade</span><span class="bt"></span><b></b>'; action.lastChild.textContent = cost;
    action.disabled = !enabled;
    action.addEventListener('click', onBuy);
  }
  what.append(pips, info); up.append(what, action);
  return up;
}

function ownedPanel(id) {
  const w = C.weapons[id], tier = upgradeTier(id), equipped = savedWeapon() === id;
  const p = el('div', 'arm-card' + (equipped ? ' on' : ''));
  const img = el('img'); img.src = w.svg; img.alt = '';
  const head = el('div', 'arm-head');
  head.append(el('span', 'nm', w.name + (tier ? ' ' + '★'.repeat(tier) : '')));
  if (equipped) head.append(el('span', 'arm-eq', 'EQUIPPED'));
  else {
    const b = el('button', 'felt-btn small arm-equip', 'Equip'); b.type = 'button';
    b.addEventListener('click', () => { unlockAudio(); opts.onEquip(id); opts.refresh(); });
    head.append(b);
  }
  const meter = sharpMeter(); setSharpMeter(meter, id);
  const sharpen = sharpenButton(() => buy(() => buySharpen(id), 'pinPop')); setSharpenButton(sharpen, id);
  const sharpRow = el('div', 'arm-sharp'); sharpRow.append(meter, sharpen);
  // the next upgrade: its tier pips, what it does, its price (or Maxed)
  const cost = upgradeCost(id);
  const up = upgradeRow(tier, 3, tierText(id, Math.min(3, tier + 1)), cost, Save.buttons >= cost, () => buy(() => buyUpgrade(id), 'pinPop'));
  const main = el('div', 'arm-main'); main.append(head, sharpRow, up);
  p.append(img, main);
  return p;
}

// A Pin type's panel (the Sewing Box's Pins tab): its icon in its felt, name with tier stars, what it does, and its
// next permanent tier with its price; locked (greyed, "Clear Level n") until the Pin's level is cleared.
function pinPanel(type) {
  const def = C.towers[type], tier = pinTier(type), open = pinOpen(type);
  const p = el('div', 'arm-card skill' + (open ? '' : ' lockd'));
  const icon = el('span', 'arm-skill-ico felt pin'); icon.style.setProperty('--fc', def.felt); icon.innerHTML = PIN_ICON[type] || '';
  const head = el('div', 'arm-head');
  head.append(el('span', 'nm', def.name + (tier ? ' ' + '★'.repeat(tier) : '')));
  if (!open) head.append(el('span', 'tag', 'Clear Level ' + levelNo(C.pinFrom[type])));
  const now = el('div', 'arm-skill-now', def.blurb[0].toUpperCase() + def.blurb.slice(1) + ' · ' + def.cost + ' thread to build');
  const cost = pinTierCost(type);
  const up = upgradeRow(tier, PIN_TIERS, pinTierText(type, Math.min(PIN_TIERS, tier + 1)), cost, open && Save.buttons >= cost, () => buy(() => buyPinTier(type), 'pinPop'));
  const main = el('div', 'arm-main'); main.append(head, now, up);
  p.append(icon, main);
  return p;
}
export function pinsTab(body) {
  body.append(el('p', 'hint', 'Permanent tiers for each Pin, kept for good. Ranks inside a level (a built Pin’s II / III, paid in Thread) are gone when it ends.'));
  for (const type in C.towers) body.append(pinPanel(type));
}

// A pair not held yet: its price once the Shop sells it, else how it's won or when it goes on sale.
function lockedRow(id) {
  const w = C.weapons[id], forSale = shopOpen(id), r = el('div', 'meta-row' + (forSale ? ' sale' : ' lockd')), img = el('img'), mid = el('div');
  img.src = w.svg; img.alt = '';
  mid.append(el('span', 'nm', w.name), el('span', '', w.blurb));
  let action;
  if (forSale) {
    action = el('button', 'felt-btn small buy'); action.type = 'button';
    action.innerHTML = '<span class="bt"></span><span></span>'; action.lastChild.textContent = w.shop;
    action.disabled = Save.buttons < w.shop;
    action.addEventListener('click', () => { buy(() => buyWeapon(id), 'pinPop'); revealNow(v => v.scissors === id); });
  } else action = el('span', 'tag', w.shop ? 'On sale after Level ' + levelNo(w.shopAfter) : unlockHint(id));
  r.append(img, mid, action);
  return r;
}

// The Sewing Box's Scissors tab: the pairs held.
export function scissorsTab(body) {
  body.append(el('p', 'hint', 'Every snip wears the edge a little. A dull pair cuts weaker; Sharpen puts it back to full.'));
  for (const id in C.weapons) if (!weaponLocked(id)) body.append(ownedPanel(id));
}
// The Shop's Pairs tab: the pairs not held yet, the ones on sale first.
export function pairsTab(body) {
  const locked = [];
  for (const id in C.weapons) if (weaponLocked(id)) locked.push(id);
  if (!locked.length) { body.append(el('p', 'hint', 'Every pair in the house is yours. Upgrade them in the Sewing Box.')); return; }
  const sale = locked.filter(shopOpen), later = locked.filter(id => !shopOpen(id));
  if (sale.length) { body.append(el('h3', '', 'On sale')); for (const id of sale) body.append(lockedRow(id)); }
  if (later.length) { body.append(el('h3', '', sale.length ? 'Not for sale yet' : 'Nothing on sale yet')); for (const id of later) body.append(lockedRow(id)); }
}

// SHRED as a skill: what a tier does, in words, and its panel (the tier's name, pips, the next tier and its price).
const spins = n => n === 1 ? 'one spin' : n === 2 ? 'two spins' : n + ' spins';
const shredText = d => { const t = spins(d.turns); return t[0].toUpperCase() + t.slice(1) + ', then a snip · charges in ' + d.charge + ' kills'; };
function shredPanel() {
  const tier = shredTier(), cur = C.shredTiers[tier], next = C.shredTiers[tier + 1], open = shredOpen();
  const p = el('div', 'arm-card skill' + (open ? '' : ' lockd'));
  const icon = el('span', 'arm-skill-ico felt purple', '✂');
  const head = el('div', 'arm-head');
  head.append(el('span', 'nm', 'SHRED · ' + cur.name));
  if (!open) head.append(el('span', 'tag', 'Clear Level ' + levelNo(C.shredFrom)));
  const now = el('div', 'arm-skill-now', shredText(cur));
  const cost = shredCost(), nextText = next ? next.name + ': ' + (next.turns !== cur.turns ? spins(next.turns) : 'charges in ' + next.charge + ' kills') : '';
  const up = upgradeRow(tier, C.shredTiers.length - 1, nextText, cost, open && Save.buttons >= cost, () => buy(buyShred, 'pinPop'));
  if (next) up.querySelector('.arm-up-txt').textContent = nextText;   // SHRED's tiers are named, not numbered
  const main = el('div', 'arm-main'); main.append(head, now, up);
  p.append(icon, main);
  return p;
}

// Skills to come (CONFIG.skillIdeas, not in play yet): a card each with the level it would arrive on, what it would
// do, what charges it and its planned tiers, and a Want this button (opts.onFeedback) so playtesters can vote.
const levelNo = id => C.map.nodes.findIndex(n => n[0] === id);
function ideaPanel(k) {
  const p = el('div', 'arm-card skill idea'), icon = el('span', 'arm-skill-ico felt dark', k.icon);
  const head = el('div', 'arm-head');
  head.append(el('span', 'nm', k.name), el('span', 'arm-soon', 'SOON · LEVEL ' + levelNo(k.from)));
  const want = el('button', 'felt-btn small', 'Want this'); want.type = 'button';
  want.addEventListener('click', () => { unlockAudio(); opts.onFeedback(k); });
  const main = el('div', 'arm-main');
  main.append(head, el('div', 'arm-skill-now', k.blurb), el('div', 'arm-idea-meta', 'Charges from ' + k.charge + '. Tiers: ' + k.tiers.join(' → ') + '.'), want);
  p.append(icon, main);
  return p;
}

export function movesTab(body) {
  body.append(shredPanel());
  const ideas = C.skillIdeas.filter(k => !k.enabled);
  if (!ideas.length) return;
  body.append(el('h3', '', 'Skills coming soon'), el('p', 'hint', 'The plan: a second move slot beside SHRED, filled with one of these before each level, each bought up in tiers like SHRED. Not in the game yet. Tell us which you’d want.'));
  for (const k of ideas) body.append(ideaPanel(k));
}

// A deal (meta.js deals()) in words, for the results card's Shop line: "Safety Firsts tier 1 (+15% reach)",
// "Needle Pin tier 2 (+15% ring)", "SHRED Double Spin", a pair's or a cosmetic's name.
export function dealText(d) {
  if (d.cosmetic) return C.meta.cosmetics[d.cosmetic].name;
  if (d.tab === 'moves') return 'SHRED ' + C.shredTiers[d.tier].name;
  if (d.pin) return C.towers[d.pin].name + ' tier ' + d.tier + ' (' + pinTierText(d.pin, d.tier) + ')';
  const w = C.weapons[d.weapon];
  return d.tier ? w.name + ' tier ' + d.tier + ' (' + tierText(d.weapon, d.tier) + ')' : w.name;
}

// o: toast(text), onChange() after a buy (re-apply the weapon), onEquip(id), onFeedback(skillIdea), refresh() (re-render the Shop).
export function initArmory(o) { opts = o; }
