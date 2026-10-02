// The Shop and Trophies screens (DOM only). The Shop opens from the level map's top row and the title's Shop tile; Trophies
// from the map. Each closes back to whichever screen opened it.
// Shop: where new things are bought, nothing else (what you hold is upgraded in the Sewing Box, sewingBox.js). Two
// tabs (the last one picked stays picked): Pairs (the scissors not held yet: a price once on sale, else how they're
// won or when they go on sale; armory.js pairsTab) and Style (cosmetics; chest-only ones say which chest). A gold dot on
// a tab = something there the balance covers (meta.js deals(), screen 'shop'); rendering a tab marks its deals seen
// (markDealsSeen), which puts out the dot on the Shop's entrances (main.js refreshNews). Trophies: every achievement,
// earned or not, with its reward, so the total is knowable; then the world chests with their fixed contents and
// progress. Prices and rewards: CONFIG.meta.
import { CONFIG as C } from './config.js';
import { Save } from './save.js';
import { ACHIEVEMENTS } from './achievements.js';
import { buyCosmetic, equipCosmetic, worldIds, worldLevels, chestState, deals, markDealsSeen } from './meta.js';
import { unlockAudio } from './audio.js';
import { UI_ART, uiUrl, achievementArt, swatchArt } from './kit.js';
import { pairsTab, buy } from './armory.js';

const shopEl = document.getElementById('shop'), shopBody = document.getElementById('shop-body'), shopBal = document.getElementById('shop-buttons');
const tabBtns = [...document.querySelectorAll('#shop-tabs [data-tab]')];
const trophiesEl = document.getElementById('trophies'), trophiesBody = document.getElementById('trophies-body'), trophiesSum = document.getElementById('trophies-sum');
let onChange = () => {}, tab = 'pairs';

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
function styleTab(body) {
  const M = C.meta;
  body.append(el('p', 'hint', 'Tap an owned one to wear it (tap again to take it off).'));
  for (const id in M.cosmetics) {
    const c = M.cosmetics[id], sw = el('span', 'sw'), owned = Save.cosmetics.owned.includes(id), worn = Save.cosmetics[c.slot] === id;
    if (swatchArt(id)) { sw.style.background = 'url(' + uiUrl(swatchArt(id)) + ') center / contain no-repeat'; sw.style.border = '0'; } else sw.style.background = c.slot === 'glow' ? 'radial-gradient(circle, #fff 0 12%, ' + c.color + ' 40%, #2a170a 80%)' : c.color;
    let action;
    if (owned) {
      action = el('button', 'felt-btn small buy', worn ? 'Worn' : 'Wear'); action.type = 'button';
      action.addEventListener('click', () => { equipCosmetic(id); onChange(); refresh(); });
    } else if (c.chest) action = el('span', 'tag', M.worlds[c.chest].name + ' chest');
    else action = priceBtn(c.price, Save.buttons >= c.price, () => buy(() => buyCosmetic(id), 'pinPop'));
    body.append(metaRow(sw, c.name, [c.slot === 'glow' ? 'Blade glow' : 'Handle colour'], action, worn ? 'done' : ''));
  }
}
const TABS = { pairs: pairsTab, style: styleTab };
function renderShop() {
  shopBal.textContent = Save.buttons;
  const ds = deals();
  for (const b of tabBtns) {
    const k = b.dataset.tab;
    b.setAttribute('aria-selected', String(k === tab));
    b.querySelector('.dot').hidden = k === tab || !ds.some(d => d.screen === 'shop' && d.tab === k);
  }
  shopBody.textContent = '';
  TABS[tab](shopBody);
  markDealsSeen('shop', tab);
}

// a trophy badge from the kit, or the fallback glyph when there's no art for it
function badgeIcon(file, glyph) {
  if (!file) return el('span', 'ico', glyph);
  const i = new Image(); i.src = uiUrl(file); i.alt = ''; return i;
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
    trophiesBody.append(metaRow(badgeIcon(done ? achievementArt(a.id) : UI_ART.achievementLocked, done ? '\u{1F3C6}' : '\u{1F512}'), a.name, [a.description], tag, done ? 'done' : 'lockd'));
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

export function refreshShop() { if (!shopEl.hidden) renderShop(); if (!trophiesEl.hidden) renderTrophies(); }
const refresh = refreshShop;

// opts: onChange() after a cosmetic was worn (re-apply it), onClose().
export function initShop(opts) {
  onChange = opts.onChange;
  for (const b of tabBtns) b.addEventListener('click', () => {
    if (tab === b.dataset.tab) return;
    unlockAudio(); tab = b.dataset.tab; renderShop(); shopEl.scrollTop = 0;
  });
  document.getElementById('shop-back').addEventListener('click', () => { shopEl.hidden = true; opts.onClose(); });
  document.getElementById('trophies-back').addEventListener('click', () => { trophiesEl.hidden = true; opts.onClose(); });
}
// which: a tab to open on ('pairs' | 'style'); omitted, the last one picked.
export function openShop(which) { if (TABS[which]) tab = which; trophiesEl.hidden = true; shopEl.hidden = false; renderShop(); shopEl.scrollTop = 0; }
export function openTrophies() { shopEl.hidden = true; trophiesEl.hidden = false; renderTrophies(); trophiesEl.scrollTop = 0; }
