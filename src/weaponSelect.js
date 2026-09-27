// Weapon select screen (between the MAP and PLAYING): one card per CONFIG.weapons entry showing its art and stats.
// The pick is remembered in the save (Save.equippedScissors). A weapon that is some level's reward (its unlockOnClear)
// stays locked until that level is cleared (Save.unlocks.scissors); the default weapon never is.
import { CONFIG as C } from './config.js';
import { Save, persist } from './save.js';
import { rewardLevelOf } from './levels/index.js';
import { weaponDef } from './scissors.js';
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

export const weaponLocked = id => id !== C.defaultWeapon && !!rewardLevelOf(id) && !Save.unlocks.scissors.includes(id);
export function savedWeapon() {
  return C.weapons[Save.equippedScissors] && !weaponLocked(Save.equippedScissors) ? Save.equippedScissors : C.defaultWeapon;
}

// onPick(id) when a card is chosen, onStart() / onBack() for the two buttons.
export function initWeaponSelect({ onPick, onStart, onBack }) {
  const list = document.getElementById('weapon-cards');
  const best = STATS.map(s => s.bar ? Math.max(...Object.values(C.weapons).map(s.bar)) : 0);
  const cards = {};
  for (const id in C.weapons) {
    const w = C.weapons[id];
    const card = document.createElement('button');
    card.type = 'button'; card.className = 'weapon-card';
    card.innerHTML = '<img alt=""><span class="wc-name"></span><span class="wc-lock"></span><span class="wc-blurb"></span><span class="wc-stats"></span>';
    const at = C.map.nodes.findIndex(n => n[0] === rewardLevelOf(id));
    if (at >= 0) card.querySelector('.wc-lock').textContent = '🔒 Clear Level ' + at + ' to unlock';
    card.querySelector('img').src = w.svg;
    card.querySelector('.wc-name').textContent = w.name;
    card.querySelector('.wc-blurb').textContent = w.blurb;
    fillStats(card, id, best);
    card.addEventListener('click', () => { if (weaponLocked(id)) return; select(id); onPick(id); });
    card.addEventListener('dblclick', () => { if (!weaponLocked(id)) onStart(); });
    list.appendChild(card);
    cards[id] = card;
  }
  function select(id) {
    for (const k in cards) cards[k].setAttribute('aria-pressed', String(k === id));
    if (Save.equippedScissors !== id) { Save.equippedScissors = id; persist(); }
  }
  document.getElementById('select-start').addEventListener('click', () => onStart());
  document.getElementById('select-back').addEventListener('click', () => onBack());
  select(savedWeapon());
  refreshLocks = () => {
    for (const k in cards) { cards[k].classList.toggle('locked', weaponLocked(k)); cards[k].disabled = weaponLocked(k); fillStats(cards[k], k, best); }
    select(savedWeapon());
  };
  refreshLocks();
}
// A card's name (with upgrade pips) and stat rows, for the weapon as upgraded now.
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
// Re-check the locks and upgrades (each time the screen opens: a level may have been cleared, or an upgrade bought).
let refreshLocks = () => {};
export const refreshWeaponSelect = () => refreshLocks();
