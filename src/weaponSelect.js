// Weapon select screen (between the MAP and PLAYING): the chosen pair large (art, stats, its sharpness meter and a quick
// Sharpen button, sharpMeter.js) over a strip of every pair (a thin bar under each held one shows its edge; a locked one
// previews greyed with how it's won).
// The pick is remembered in the save (Save.equippedScissors). Only the default weapon starts unlocked; the rest are a
// map level's reward (its unlockOnClear) or bought in the Shop (CONFIG.weapons[id].shop, once shopAfter is cleared),
// and either way join Save.unlocks.scissors.
import { CONFIG as C } from './config.js';
import { Save, persist } from './save.js';
import { rewardLevelOf } from './levels/index.js';
import { weaponDef, sharpness, sharpBandIndex } from './scissors.js';
import { sharpMeter, setSharpMeter, sharpenButton, setSharpenButton } from './sharpMeter.js';
// Stats show the weapon as upgraded (weaponDef; the tier shows as pips after its name).
// Each stat is either a readout (text) or a bar (value, drawn relative to the best un-upgraded weapon in that stat).
// Reach: blade length in story inches (play area = statDrawerHeightIn tall). Spread: full angle between the open blades.
// Speed: how fast a held button / finger opens it (1 / openMs).
// A slide weapon (kind 'slide') has no reach or spread: its bite is a round hole (reachFrac = the hole's radius).
const inches = w => w.reachFrac * C.weaponScale * C.statDrawerHeightIn;
const STATS = [
  { label: w => w.kind === 'slide' ? 'Hole' : 'Reach', text: w => (w.kind === 'slide' ? 2 * inches(w) : inches(w)).toFixed(1) + ' in' },
  { label: w => w.kind === 'slide' ? 'Cut' : 'Spread', text: w => w.kind === 'slide' ? 'guillotine' : Math.round(w.maxOpenDeg * 2) + '°' },
  { label: () => 'Power', bar: w => w.damageMult },
  { label: () => 'Speed', bar: w => 1 / w.openMs },
];

// (a save from before a weapon got its reward level counts that level's clear)
export const weaponLocked = id => id !== C.defaultWeapon && !Save.unlocks.scissors.includes(id) && !Save.levels[rewardLevelOf(id)]?.cleared;
// Shop weapons: on sale once their shopAfter level is cleared.
export const shopOpen = id => !!C.weapons[id].shop && !!Save.levels[C.weapons[id].shopAfter]?.cleared;
const levelNum = id => C.map.nodes.findIndex(n => n[0] === id);
// How a locked weapon is won, in words.
export function unlockHint(id) {
  const w = C.weapons[id];
  if (w.shop) return shopOpen(id) ? 'In the Shop' : 'Shop, after Level ' + levelNum(w.shopAfter);
  return 'Clear Level ' + levelNum(rewardLevelOf(id));
}
export function savedWeapon() {
  return C.weapons[Save.equippedScissors] && !weaponLocked(Save.equippedScissors) ? Save.equippedScissors : C.defaultWeapon;
}

// onPick(id) when a pair is chosen, onStart() / onBack() for the two buttons, onSharpen(id) for the quick Sharpen
// (returns '' when it went through, else why not).
export function initWeaponSelect({ onPick, onStart, onBack, onSharpen }) {
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
    const row = document.createElement('span');
    row.className = 'wc-stat';
    row.innerHTML = s.bar ? '<span></span><span class="wc-bar"><span></span></span>' : '<span></span><span class="wc-val"></span>';
    row.firstChild.textContent = s.label(w);
    if (s.bar) row.querySelector('.wc-bar > span').style.width = Math.min(100, Math.round(s.bar(w) / best[i] * 100)) + '%';
    else row.querySelector('.wc-val').textContent = s.text(w);
    stats.appendChild(row);
  });
}
// Re-check locks, upgrades, sharpness and Buttons (each time the screen opens, and after a quick Sharpen).
let refreshLocks = () => {};
export const refreshWeaponSelect = () => refreshLocks();
