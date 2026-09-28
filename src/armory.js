// Your Scissors (DOM overlay): the weapon inventory, opened from the title's Upgrades tile and the map's top-left row,
// closed back to whichever opened it. One panel per pair held: art, name with upgrade stars, EQUIPPED or an Equip
// button, the sharpness meter with its Sharpen button (sharpMeter.js), and the next upgrade tier with its price.
// Pairs not held yet are listed after, greyed, with how they're won (a level) or bought (the Shop).
// Prices: CONFIG.meta; the buys themselves are meta.js.
import { CONFIG as C } from './config.js';
import { Save } from './save.js';
import { upgradeTier } from './scissors.js';
import { weaponLocked, unlockHint, savedWeapon } from './weaponSelect.js';
import { upgradeCost, buyUpgrade, buySharpen } from './meta.js';
import { sfx, unlockAudio } from './audio.js';
import { sharpMeter, setSharpMeter, sharpenButton, setSharpenButton } from './sharpMeter.js';

const screenEl = document.getElementById('armory'), body = document.getElementById('armory-body'), bal = document.getElementById('armory-buttons');
let opts = { toast: () => {}, onChange: () => {}, onEquip: () => {}, onClose: () => {} };

const pct = x => '+' + Math.round(x * 100) + '%';
const SIGNATURE = { angle: 'cut angle', damage: 'damage', crit: 'crit damage', hold: 'jaw hold time', ring: 'ring size' };
// What tier n (1..3) of weapon id does, in words.
export function tierText(id, n) {
  const M = C.meta, sig = C.weapons[id].signature;
  if (n === 1) return pct(M.reachUp) + ' reach';
  if (n === 2) return pct(M.speedUp) + ' close speed';
  return sig === 'all' ? pct(M.allUp) + ' to everything' : pct(M.signatureUp) + ' ' + SIGNATURE[sig];
}

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
const failText = { buttons: 'Not enough Buttons', max: 'Already maxed', sharp: 'Already sharp', locked: 'Not yours yet' };
function buy(fn, sound) { unlockAudio(); const why = fn(); if (why) opts.toast(failText[why] || why); else { sfx(sound, 0); opts.onChange(); } render(); }

function ownedPanel(id) {
  const w = C.weapons[id], tier = upgradeTier(id), equipped = savedWeapon() === id;
  const p = el('div', 'arm-card' + (equipped ? ' on' : ''));
  const img = el('img'); img.src = w.svg; img.alt = '';
  const head = el('div', 'arm-head');
  head.append(el('span', 'nm', w.name + (tier ? ' ' + '★'.repeat(tier) : '')));
  if (equipped) head.append(el('span', 'arm-eq', 'EQUIPPED'));
  else {
    const b = el('button', 'felt-btn small arm-equip', 'Equip'); b.type = 'button';
    b.addEventListener('click', () => { unlockAudio(); opts.onEquip(id); render(); });
    head.append(b);
  }
  const meter = sharpMeter(); setSharpMeter(meter, id);
  const sharpen = sharpenButton(() => buy(() => buySharpen(id), 'pinPop')); setSharpenButton(sharpen, id);
  const sharpRow = el('div', 'arm-sharp'); sharpRow.append(meter, sharpen);
  // the next upgrade: its tier pips, what it does, its price (or Maxed)
  const up = el('div', 'arm-up'), pips = el('span', 'pips'), info = el('span', 'arm-up-txt'), what = el('div');
  for (let i = 1; i <= 3; i++) pips.append(i <= tier ? '●' : el('i', '', '○'));
  let action;
  if (tier >= 3) { info.textContent = 'Fully upgraded'; action = el('span', 'tag', 'Maxed'); }
  else {
    const cost = upgradeCost(id);
    info.textContent = 'Tier ' + (tier + 1) + ': ' + tierText(id, tier + 1);
    action = el('button', 'felt-btn small buy'); action.type = 'button';
    action.innerHTML = '<span>Upgrade</span><span class="bt"></span><b></b>'; action.lastChild.textContent = cost;
    action.disabled = Save.buttons < cost;
    action.addEventListener('click', () => buy(() => buyUpgrade(id), 'pinPop'));
  }
  what.append(pips, info); up.append(what, action);
  const main = el('div', 'arm-main'); main.append(head, sharpRow, up);
  p.append(img, main);
  return p;
}

function render() {
  bal.textContent = Save.buttons;
  body.textContent = '';
  body.append(el('p', 'hint', 'Every snip wears the edge a little. A dull pair cuts weaker; Sharpen puts it back to full.'));
  const locked = [];
  for (const id in C.weapons) { if (weaponLocked(id)) locked.push(id); else body.append(ownedPanel(id)); }
  if (!locked.length) return;
  body.append(el('h3', '', 'Not yours yet'));
  for (const id of locked) {
    const w = C.weapons[id], r = el('div', 'meta-row lockd'), img = el('img'), mid = el('div');
    img.src = w.svg; img.alt = '';
    mid.append(el('span', 'nm', w.name), el('span', '', w.blurb));
    r.append(img, mid, el('span', 'tag', unlockHint(id)));
    body.append(r);
  }
}

// o: toast(text), onChange() after a buy (re-apply the weapon), onEquip(id), onClose().
export function initArmory(o) {
  opts = o;
  document.getElementById('armory-back').addEventListener('click', () => { screenEl.hidden = true; opts.onClose(); });
}
export function openArmory() { screenEl.hidden = false; render(); screenEl.scrollTop = 0; }
export function closeArmory() { screenEl.hidden = true; }
