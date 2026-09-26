// Weapon select screen (between TITLE and PLAYING): one card per CONFIG.weapons entry showing its art and stats.
// The pick is remembered in localStorage (per-device convenience only).
import { CONFIG as C } from './config.js';

const STORE_KEY = 'battleScissors.weapon';
// Each stat is either a readout (text) or a bar (value, drawn relative to the best weapon in that stat).
// Reach: blade length in story inches (play area = statDrawerHeightIn tall). Spread: full angle between the open blades.
// A slide weapon (kind 'slide') has no reach or spread: its bite is a round hole (reachFrac = the hole's radius).
const inches = w => w.reachFrac * C.weaponScale * C.statDrawerHeightIn;
const STATS = [
  { label: w => w.kind === 'slide' ? 'Hole' : 'Reach', text: w => (w.kind === 'slide' ? 2 * inches(w) : inches(w)).toFixed(1) + ' in' },
  { label: w => w.kind === 'slide' ? 'Cut' : 'Spread', text: w => w.kind === 'slide' ? 'guillotine' : w.maxOpenDeg * 2 + '°' },
  { label: () => 'Power', bar: w => w.damageMult },
];

export function savedWeapon() {
  try { const id = localStorage.getItem(STORE_KEY); if (id && C.weapons[id]) return id; } catch (e) { /* storage blocked */ }
  return C.defaultWeapon;
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
    card.innerHTML = '<img alt=""><span class="wc-name"></span><span class="wc-blurb"></span><span class="wc-stats"></span>';
    card.querySelector('img').src = w.svg;
    card.querySelector('.wc-name').textContent = w.name;
    card.querySelector('.wc-blurb').textContent = w.blurb;
    const stats = card.querySelector('.wc-stats');
    STATS.forEach((s, i) => {
      const row = document.createElement('span');
      row.className = 'wc-stat';
      row.innerHTML = s.bar ? '<span></span><span class="wc-bar"><span></span></span>' : '<span></span><span class="wc-val"></span>';
      row.firstChild.textContent = s.label(w);
      if (s.bar) row.querySelector('.wc-bar > span').style.width = Math.round(s.bar(w) / best[i] * 100) + '%';
      else row.querySelector('.wc-val').textContent = s.text(w);
      stats.appendChild(row);
    });
    card.addEventListener('click', () => { select(id); onPick(id); });
    card.addEventListener('dblclick', () => onStart());
    list.appendChild(card);
    cards[id] = card;
  }
  function select(id) {
    for (const k in cards) cards[k].setAttribute('aria-pressed', String(k === id));
    try { localStorage.setItem(STORE_KEY, id); } catch (e) { /* storage blocked */ }
  }
  document.getElementById('select-start').addEventListener('click', () => onStart());
  document.getElementById('select-back').addEventListener('click', () => onBack());
  select(savedWeapon());
}
