// Weapon select screen (between the MAP and PLAYING): the chosen pair large (art, stats, its sharpness meter and a quick
// Sharpen button, sharpMeter.js) over a strip of every pair (a thin bar under each held one shows its edge; a locked one
// previews greyed with how it's won).
// The pick is remembered in the save (Save.equippedScissors). Only the default weapon starts unlocked; the rest are a
// map level's reward (its unlockOnClear) or bought in the Shop (CONFIG.weapons[id].shop, once shopAfter is cleared),
// and either way join Save.unlocks.scissors.
// Under the pair, a Moves row: the two move slots (Save.moves) as two chips, SLOT 1 and SLOT 2, each showing its move
// (icon + name) or "empty"; tapping a slot opens a row of the moves this level allows (SHRED and the Skills, NEW on a
// move's first level) to pick from, or Clear; picking the move the other slot holds moves it over (skills.js setMove).
// main.js passes getMoves() (what game.js allows on the level about to start), since this module doesn't import game.js.
import { CONFIG as C } from './config.js';
import { Save, persist } from './save.js';
import { rewardLevelOf } from './levels/index.js';
import { weaponDef, sharpness, sharpBandIndex } from './scissors.js';
import { sharpMeter, setSharpMeter, sharpenButton, setSharpenButton } from './sharpMeter.js';
import { setMove } from './skills.js';
// Stats show the weapon as upgraded (weaponDef; the tier shows as pips after its name).
// Each stat is either a readout (text) or a bar (value, drawn relative to the best un-upgraded weapon in that stat).
// Reach: blade length in story inches (play area = statDrawerHeightIn tall). Spread: full angle between the open blades.
// Speed: how fast a held button / finger opens it (1 / openMs).
// A slide weapon (kind 'slide') has no reach or spread: its bite is a round hole (reachFrac = the hole's radius).
// Special: one more row for a pair whose signature is a trick of its own (SPECIAL, by signature), in a few words.
const inches = w => w.reachFrac * C.weaponScale * C.statDrawerHeightIn;
const SPECIAL = {
  crit:  w => 'Crit x' + w.critMult.toFixed(1) + ' near pivot',
  hold:  w => 'Holds them ' + w.holdSec.toFixed(1) + 's',
  ring:  () => 'Beetle in hole: gone',
  notch: w => 'Pivot ' + Math.round(w.pivotZone * 100) + '%: Burr, Beetle gone',
  nick:  w => 'Soft spot x' + C.lampMult + ', crit x' + w.critMult.toFixed(1),
  curl:  w => 'Curl: ' + Math.round(w.curlSlow * 100) + '% speed, ' + w.curlSec.toFixed(1) + 's',
};
const STATS = [
  { label: w => w.kind === 'slide' ? 'Hole' : 'Reach', text: w => (w.kind === 'slide' ? 2 * inches(w) : inches(w)).toFixed(1) + ' in' },
  { label: w => w.kind === 'slide' ? 'Cut' : 'Spread', text: w => w.kind === 'slide' ? 'guillotine' : Math.round(w.maxOpenDeg * 2) + '°' },
  { label: () => 'Power', bar: w => w.damageMult },
  { label: () => 'Speed', bar: w => 1 / w.openMs },
  { label: () => 'Special', text: w => SPECIAL[w.signature](w), only: w => !!SPECIAL[w.signature] },
];

// (a save from before a weapon got its reward level counts that level's clear)
export const weaponLocked = id => id !== C.defaultWeapon && !Save.unlocks.scissors.includes(id) && !Save.levels[rewardLevelOf(id)]?.cleared;
// Shop weapons: on sale once their shopAfter level is cleared.
export const shopOpen = id => !!C.weapons[id].shop && !!Save.levels[C.weapons[id].shopAfter]?.cleared;
// A map level's number as the map shows it: "3-10" (world-level) on the world maps (CONFIG.map.worlds), else its patch
// index on the single map; '' off the map.
function levelNum(id) {
  const M = C.map;
  if (M.worlds) {
    for (let k = 0; k < M.worlds.length; k++) {
      const i = M.worlds[k].nodes.findIndex(n => n[0] === id);
      if (i >= 0) return (k + 1) + '-' + (M.worlds[k].nodes[0][0] === C.tutLevel ? i : i + 1);
    }
    return '';
  }
  const i = M.nodes ? M.nodes.findIndex(n => n[0] === id) : -1;
  return i >= 0 ? String(i) : '';
}
// How a locked weapon is won, in words (a boss's reward: the level that boss is on).
export function unlockHint(id) {
  const w = C.weapons[id];
  if (w.shop) return shopOpen(id) ? 'In the Shop' : 'Shop, after Level ' + levelNum(w.shopAfter);
  const n = levelNum(rewardLevelOf(id));
  return n ? 'Beat Level ' + n : 'Won on the map';
}
export function savedWeapon() {
  return C.weapons[Save.equippedScissors] && !weaponLocked(Save.equippedScissors) ? Save.equippedScissors : C.defaultWeapon;
}

// onPick(id) when a pair is chosen, onStart() / onBack() for the two buttons, onSharpen(id) for the quick Sharpen
// (returns '' when it went through, else why not), getMoves() = [{ id, isNew }] (SHRED first, then the Skills) for the Moves row.
export function initWeaponSelect({ onPick, onStart, onBack, onSharpen, getMoves }) {
  movesOf = getMoves || movesOf;
  const strip = document.getElementById('weapon-cards');
  const hero = document.getElementById('sel-hero'), heroImg = hero.querySelector('img'), heroLock = document.getElementById('sel-lock');
  const bal = document.getElementById('sel-buttons'), startBtn = document.getElementById('select-start');
  const best = STATS.map(s => s.bar ? Math.max(...Object.values(C.weapons).map(s.bar)) : 0);
  const meter = sharpMeter(), sharpen = sharpenButton(() => { if (!onSharpen(shownId)) { hero.classList.remove('honed'); void hero.offsetWidth; hero.classList.add('honed'); } refreshLocks(); });
  document.getElementById('sel-sharp').append(meter, sharpen);
  const thumbs = {};
  let shownId = '';
  for (const id in C.weapons) {
    const w = C.weapons[id];
    const t = document.createElement('button');
    t.type = 'button'; t.className = 'weapon-thumb';
    t.innerHTML = '<img alt=""><span class="wt-name"></span><span class="wt-edge"><span></span></span><span class="wt-lock"></span>';
    t.querySelector('img').src = w.svg;
    t.querySelector('.wt-name').textContent = w.name;
    // a locked pair still previews (START stays off until it's won)
    t.addEventListener('click', () => { show(id); if (!weaponLocked(id)) { select(id); onPick(id); } });
    t.addEventListener('dblclick', () => { if (!weaponLocked(id)) onStart(); });
    strip.appendChild(t);
    thumbs[id] = t;
  }
  function select(id) {
    for (const k in thumbs) thumbs[k].setAttribute('aria-pressed', String(k === id));
    if (Save.equippedScissors !== id) { Save.equippedScissors = id; persist(); }
  }
  // The big panel: pair id's art, name, blurb, stats and sharpness (a locked pair: how it's won, no sharpness).
  function show(id) {
    shownId = id;
    const locked = weaponLocked(id);
    heroImg.src = C.weapons[id].svg;
    hero.querySelector('.wc-blurb').textContent = C.weapons[id].blurb;
    fillStats(hero, id, best);
    hero.classList.toggle('locked', locked);
    heroLock.textContent = locked ? '🔒 ' + unlockHint(id) : '';
    setSharpMeter(meter, id); setSharpenButton(sharpen, id);
    bal.textContent = String(Save.buttons);
    startBtn.disabled = locked;
    for (const k in thumbs) thumbs[k].classList.toggle('shown', k === id);
  }
  startBtn.addEventListener('click', () => { if (!weaponLocked(shownId)) onStart(); });
  document.getElementById('select-back').addEventListener('click', () => onBack());
  refreshLocks = () => {
    for (const k in thumbs) {
      const t = thumbs[k], locked = weaponLocked(k), s = sharpness(k), w = weaponDef(k);
      t.classList.toggle('locked', locked);
      t.querySelector('.wt-name').textContent = w.name + (w.tier ? ' ' + '★'.repeat(w.tier) : '');
      t.querySelector('.wt-lock').textContent = locked ? '🔒' : '';
      t.querySelector('.wt-edge').dataset.band = String(sharpBandIndex(s));
      t.querySelector('.wt-edge > span').style.width = Math.round(s * 100) + '%';
    }
    const id = savedWeapon();
    select(id); show(shownId && !weaponLocked(shownId) ? shownId : id);
    renderMoves();
    // the strip scrolls sideways: open it scrolled to the equipped pair
    requestAnimationFrame(() => thumbs[id]?.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
  };
  refreshLocks();
}
// The panel's name (with upgrade stars) and stat rows, for pair id as upgraded now.
function fillStats(card, id, best) {
  const w = weaponDef(id), stats = card.querySelector('.wc-stats');
  card.querySelector('.wc-name').textContent = w.name + (w.tier ? ' ' + '★'.repeat(w.tier) : '');
  stats.textContent = '';
  STATS.forEach((s, i) => {
    if (s.only && !s.only(w)) return;
    const row = document.createElement('span');
    row.className = 'wc-stat';
    row.innerHTML = s.bar ? '<span></span><span class="wc-bar"><span></span></span>' : '<span></span><span class="wc-val"></span>';
    row.firstChild.textContent = s.label(w);
    if (s.bar) row.querySelector('.wc-bar > span').style.width = Math.min(100, Math.round(s.bar(w) / best[i] * 100)) + '%';
    else row.querySelector('.wc-val').textContent = s.text(w);
    stats.appendChild(row);
  });
}
// The Moves row: a chip per move slot; tapping one opens the picks row under it (the allowed moves, then Clear).
let movesOf = () => [];
let openSlot = -1;                                           // the slot whose picks row is open (-1 = none)
// A move's look: SHRED's (CONFIG.shredBadge) or a Skill's (CONFIG.skills).
const moveLook = id => id === 'shred' ? { icon: C.shredBadge.icon, felt: C.shredBadge.felt, name: 'SHRED', blurb: C.shredBadge.blurb } :
  { icon: C.skills[id].icon, felt: C.skills[id].felt, name: C.skills[id].name, blurb: C.skills[id].blurb };
function moveChip(icon, name, felt, isNew, cap) {
  const c = document.createElement('button');
  c.type = 'button'; c.className = 'move-chip';
  c.innerHTML = (cap ? '<span class="mc-cap"></span>' : '') + '<span class="mc-ico"></span><span class="mc-name"></span>';
  if (cap) c.firstChild.textContent = cap;
  const ico = c.querySelector('.mc-ico');
  ico.textContent = icon; if (felt) ico.style.setProperty('--fc', felt); c.lastChild.textContent = name;
  if (isNew) { const n = document.createElement('span'); n.className = 'mc-new'; n.textContent = 'NEW'; c.appendChild(n); }
  return c;
}
// fresh = the screen is opening for a level: start with the picks row closed.
export function renderMoves(fresh = false) {
  if (fresh) openSlot = -1;
  const box = document.getElementById('sel-moves'), list = document.getElementById('sel-moves-list'), picks = document.getElementById('sel-moves-picks');
  const allowed = movesOf(), isNew = id => allowed.some(m => m.id === id && m.isNew);
  list.textContent = ''; picks.textContent = '';
  box.hidden = !allowed.length;
  if (!allowed.length) openSlot = -1;
  Save.moves.forEach((id, i) => {
    const here = !id || allowed.some(m => m.id === id), look = id ? moveLook(id) : null;
    const c = look ? moveChip(look.icon, look.name, look.felt, isNew(id), 'SLOT ' + (i + 1)) : moveChip('+', 'empty', '', false, 'SLOT ' + (i + 1));
    c.classList.add('slot'); c.classList.toggle('empty', !id); c.classList.toggle('off', !here);
    c.setAttribute('aria-expanded', String(openSlot === i));
    c.title = !id ? 'Tap to pick a move for this slot' : here ? look.blurb : look.name + ' isn’t on this level yet';
    c.addEventListener('click', () => { openSlot = openSlot === i ? -1 : i; renderMoves(); });
    list.appendChild(c);
  });
  picks.hidden = openSlot < 0;
  if (openSlot < 0) return;
  for (const { id, isNew: fresh } of allowed) {                // the moves this level allows; picking one fills the open slot
    const look = moveLook(id), c = moveChip(look.icon, look.name, look.felt, fresh), other = Save.moves.indexOf(id);
    c.title = look.blurb + (other >= 0 && other !== openSlot ? ' (moves it from slot ' + (other + 1) + ')' : '');
    c.setAttribute('aria-pressed', String(Save.moves[openSlot] === id));
    if (other >= 0 && other !== openSlot) c.classList.add('elsewhere');
    c.addEventListener('click', () => { setMove(openSlot, id); openSlot = -1; renderMoves(); });
    picks.appendChild(c);
  }
  const clear = moveChip('✕', 'Clear', '', false);
  clear.classList.add('clear'); clear.title = 'Leave this slot empty';
  clear.addEventListener('click', () => { setMove(openSlot, ''); openSlot = -1; renderMoves(); });
  picks.appendChild(clear);
  const picked = picks.querySelector('[aria-pressed="true"]');   // the row scrolls sideways: show the one in the slot
  if (picked) requestAnimationFrame(() => picked.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
}// Re-check locks, upgrades, sharpness and Buttons (each time the screen opens, and after a quick Sharpen).
let refreshLocks = () => {};
export const refreshWeaponSelect = () => refreshLocks();
