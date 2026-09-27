// The Shop and Trophies screens (DOM only), both opened from the level map and closed back to it.
// Shop: scissors upgrades (3 tiers each; a locked weapon shows the level that unlocks it, never a price), Sharpening,
// cosmetics (chest-only ones say which chest). Trophies: every achievement, earned or not, with its reward, so the
// total is knowable; then the world chests with their fixed contents and progress. Prices and rewards: CONFIG.meta.
import { CONFIG as C } from './config.js';
import { Save } from './save.js';
import { upgradeTier } from './scissors.js';
import { weaponLocked } from './weaponSelect.js';
import { rewardLevelOf } from './levels/index.js';
import { ACHIEVEMENTS } from './achievements.js';
import { upgradeCost, buyUpgrade, buySharpen, buyCosmetic, equipCosmetic, worldIds, worldLevels, chestState } from './meta.js';
import { sfx, unlockAudio } from './audio.js';

const shopEl = document.getElementById('shop'), shopBody = document.getElementById('shop-body'), shopBal = document.getElementById('shop-buttons');
const trophiesEl = document.getElementById('trophies'), trophiesBody = document.getElementById('trophies-body'), trophiesSum = document.getElementById('trophies-sum');
let onChange = () => {}, toast = () => {};

const pct = x => '+' + Math.round(x * 100) + '%';
const SIGNATURE = { angle: 'cut angle', damage: 'damage', crit: 'crit damage', hold: 'jaw hold time', ring: 'ring size' };
// What tier n (1..3) of weapon id does, in words.
function tierText(id, n) {
  const M = C.meta, sig = C.weapons[id].signature;
  if (n === 1) return pct(M.reachUp) + ' reach';
  if (n === 2) return pct(M.speedUp) + ' close speed';
  return sig === 'all' ? pct(M.allUp) + ' to everything' : pct(M.signatureUp) + ' ' + SIGNATURE[sig];
}

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
// A row: [icon] [name + lines] [action].
function metaRow(icon, name, lines, action, cls = '') {
  const r = el('div', 'meta-row ' + cls), mid = el('div');
  mid.append(el('span', 'nm', name));
  for (const l of lines) { if (typeof l === 'string') mid.append(el('span', '', l), document.createElement('br')); else mid.append(l); }
  r.append(icon, mid, action);
  return r;
}
function priceBtn(n, enabled, onBuy) {
  const b = el('button', 'felt-btn small buy'); b.type = 'button';
  b.innerHTML = '<span class="bt"></span><span></span>'; b.lastChild.textContent = n;
  b.disabled = !enabled;
  b.addEventListener('click', onBuy);
  return b;
}
const failText = { buttons: 'Not enough Buttons', max: 'Already maxed', owned: 'Already owned' };
function buy(fn) { unlockAudio(); const why = fn(); if (why) toast(failText[why] || why); else { sfx('pinPop', 0); onChange(); } refresh(); }

function renderShop() {
  shopBal.textContent = Save.buttons;
  shopBody.textContent = '';
  const M = C.meta;
  shopBody.append(el('h3', '', 'Scissors upgrades'), el('p', 'hint', 'Tier 1: ' + pct(M.reachUp) + ' reach. Tier 2: ' + pct(M.speedUp) +
    ' close speed. Tier 3: each weapon’s signature stat ' + pct(M.signatureUp) + '.'));
  for (const id in C.weapons) {
    const w = C.weapons[id], img = el('img'); img.src = w.svg; img.alt = '';
    const tier = upgradeTier(id), pips = el('span', 'pips');
    for (let i = 1; i <= 3; i++) pips.append(i <= tier ? '●' : el('i', '', '○'));
    let action, lines;
    if (weaponLocked(id)) {
      const n = C.map.nodes.findIndex(nd => nd[0] === rewardLevelOf(id));
      action = el('span', 'tag', 'Clear Level ' + n); lines = [pips];
    } else if (tier >= 3) {
      action = el('span', 'tag', 'Maxed'); lines = [pips];
    } else {
      const cost = upgradeCost(id);
      action = priceBtn(cost, Save.buttons >= cost, () => buy(() => buyUpgrade(id)));
      lines = [pips, el('span', '', ' Next: ' + tierText(id, tier + 1))];
    }
    shopBody.append(metaRow(img, w.name, lines, action, weaponLocked(id) ? 'lockd' : tier >= 3 ? 'done' : ''));
  }
  shopBody.append(el('h3', '', 'Sharpening'));
  const full = Save.sharpen >= M.sharpenMax;
  shopBody.append(metaRow(el('span', 'ico', '✦'), 'Sharpening',
    [pct(M.sharpenMult - 1) + ' snip damage for your next level only. Held: ' + Save.sharpen + ' / ' + M.sharpenMax + '.'],
    full ? el('span', 'tag', 'Full') : priceBtn(M.sharpenCost, Save.buttons >= M.sharpenCost, () => buy(buySharpen))));
  shopBody.append(el('h3', '', 'Cosmetics'), el('p', 'hint', 'Tap an owned one to wear it (tap again to take it off).'));
  for (const id in M.cosmetics) {
    const c = M.cosmetics[id], sw = el('span', 'sw'), owned = Save.cosmetics.owned.includes(id), worn = Save.cosmetics[c.slot] === id;
    sw.style.background = c.slot === 'glow' ? 'radial-gradient(circle, #fff 0 12%, ' + c.color + ' 40%, #2a170a 80%)' : c.color;
    let action;
    if (owned) {
      action = el('button', 'felt-btn small buy', worn ? 'Worn' : 'Wear'); action.type = 'button';
      action.addEventListener('click', () => { equipCosmetic(id); onChange(); refresh(); });
    } else if (c.chest) action = el('span', 'tag', M.worlds[c.chest].name + ' chest');
    else action = priceBtn(c.price, Save.buttons >= c.price, () => buy(() => buyCosmetic(id)));
    shopBody.append(metaRow(sw, c.name, [c.slot === 'glow' ? 'Blade glow' : 'Handle colour'], action, worn ? 'done' : ''));
  }
}

function renderTrophies() {
  trophiesBody.textContent = '';
  const got = ACHIEVEMENTS.filter(a => Save.achievements.includes(a.id));
  const earned = got.reduce((s, a) => s + a.reward, 0), all = ACHIEVEMENTS.reduce((s, a) => s + a.reward, 0);
  trophiesSum.innerHTML = '<span class="bt"></span><b></b>';
  trophiesSum.lastChild.textContent = got.length + ' / ' + ACHIEVEMENTS.length + ' earned · ' + earned + ' / ' + all + ' Buttons';
  for (const a of ACHIEVEMENTS) {
    const done = Save.achievements.includes(a.id), tag = el('span', 'tag');
    tag.innerHTML = '<span class="bt"></span> '; tag.append(done ? '✓ ' + a.reward : String(a.reward));
    trophiesBody.append(metaRow(el('span', 'ico', done ? '\u{1F3C6}' : '\u{1F512}'), a.name, [a.description], tag, done ? 'done' : 'lockd'));
  }
  trophiesBody.append(el('h3', '', 'World chests'), el('p', 'hint', 'Three-star every level of a world and its chest opens on the map. The contents are fixed.'));
  for (const w of worldIds()) {
    const W = C.meta.worlds[w]; if (!W) continue;
    const ids = worldLevels(w), stars = ids.reduce((s, id) => s + Math.min(3, (Save.levels[id] || {}).stars || 0), 0), st = chestState(w);
    trophiesBody.append(metaRow(el('span', 'ico', st === 'opened' ? '✓' : '★'), W.name + ' chest',
      [C.meta.chestButtons + ' Buttons + ' + C.meta.cosmetics[W.chest].name, 'Stars: ' + stars + ' / ' + ids.length * 3],
      el('span', 'tag', st === 'opened' ? 'Opened' : st === 'ready' ? 'Ready on the map!' : 'Locked'), st === 'opened' ? 'done' : st === 'ready' ? '' : 'lockd'));
  }
}

function refresh() { if (!shopEl.hidden) renderShop(); if (!trophiesEl.hidden) renderTrophies(); }

// opts: toast(text), onChange() after anything was bought or worn (re-apply the weapon / cosmetics), onClose().
export function initShop(opts) {
  toast = opts.toast; onChange = opts.onChange;
  document.getElementById('shop-back').addEventListener('click', () => { shopEl.hidden = true; opts.onClose(); });
  document.getElementById('trophies-back').addEventListener('click', () => { trophiesEl.hidden = true; opts.onClose(); });
}
export function openShop() { trophiesEl.hidden = true; shopEl.hidden = false; renderShop(); shopEl.scrollTop = 0; }
export function openTrophies() { shopEl.hidden = true; trophiesEl.hidden = false; renderTrophies(); trophiesEl.scrollTop = 0; }
export function closeMetaScreens() { shopEl.hidden = trophiesEl.hidden = true; }
